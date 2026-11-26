import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { after, before, mock, test } from 'node:test';

const src = new URL('../../src/', import.meta.url);
const route = new URL('app/api/auth/register/route.js', src);
const routeImports = new Map([
  ['@/lib/authPassword', new URL('lib/authPassword.js', src)],
  ['@/lib/supabase/admin', new URL('lib/supabase/admin.js', src)],
  ['@/lib/supabase/public', new URL('lib/supabase/public.js', src)],
  ['@/lib/verifyTurnstile', new URL('lib/verifyTurnstile.js', src)],
  ['@/utils/validation', new URL('utils/validation.js', src)],
]);

// Resolve the imports Next.js usually handles when loading this route directly.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL === route.href) {
      if (specifier === 'next/server') return nextResolve('next/server.js', context);
      const target = routeImports.get(specifier);
      if (target) return nextResolve(target.href, context);
    }
    return nextResolve(specifier, context);
  },
});

const buyer = {
  name: 'Pembeli Contoh',
  email: 'buyer@example.test',
  password: 'Buyer123',
  role: 'buyer',
};
const origin = 'https://marketplace.example.test';

function makeRequest(password = buyer.password) {
  return new Request(`${origin}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ ...buyer, password, captchaToken: 'test-token' }),
  });
}

const publicClient = {
  auth: {
    async signUp() {
      return { data: { user: { id: 'buyer-test-id', identities: [{}] } }, error: null };
    },
  },
};
const profiles = {
  select() { return this; },
  eq() { return this; },
  async maybeSingle() { return { data: null, error: null }; },
  async upsert() { return { error: null }; },
};
const turnstile = {
  async verify() { return { success: true }; },
};
let POST;

before(async () => {
  mock.module(routeImports.get('@/lib/supabase/admin'), {
    exports: { createAdminClient: () => ({ from: () => profiles }) },
  });
  mock.module(routeImports.get('@/lib/supabase/public'), {
    exports: { createPublicClient: () => publicClient },
  });
  // Stub: supply a controlled CAPTCHA result without calling Turnstile.
  mock.module(routeImports.get('@/lib/verifyTurnstile'), {
    exports: {
      getRequestIp: () => '192.0.2.1',
      verifyTurnstileToken: () => turnstile.verify(),
    },
  });
  ({ POST } = await import(route.href));
});

after(() => {
  mock.reset();
  hooks.deregister();
});

function spyOnSignUp(t) {
  // Preserve the stand-in's behavior while recording calls and arguments.
  return t.mock.method(publicClient.auth, 'signUp');
}

test('TC-R01: password too short stops registration before sign-up', async (t) => {
  const signUp = spyOnSignUp(t);
  const request = makeRequest('Buyer12');

  const response = await POST(request);

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'Password minimal 8 karakter demi keamanan akun.',
  });
  assert.equal(signUp.mock.callCount(), 0);
});

test('TC-R02: failed CAPTCHA verification stops sign-up', async (t) => {
  const captchaResult = { success: false, error: 'Verifikasi CAPTCHA gagal.' };
  t.mock.method(turnstile, 'verify', async () => captchaResult);
  const signUp = spyOnSignUp(t);
  const request = makeRequest();

  const response = await POST(request);

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: captchaResult.error });
  assert.equal(signUp.mock.callCount(), 0);
});

test('TC-R03: valid registration requests sign-up and email verification', async (t) => {
  const signUp = spyOnSignUp(t);
  const request = makeRequest();

  const response = await POST(request);

  const result = await response.json();
  assert.equal(response.status, 201);
  assert.equal(result.success, true);
  assert.equal(result.requireVerification, true);
  assert.equal(signUp.mock.callCount(), 1);
  assert.deepEqual(signUp.mock.calls[0].arguments, [{
    email: buyer.email,
    password: buyer.password,
    options: {
      emailRedirectTo: `${origin}/login?verified=true`,
      data: { name: buyer.name, role: buyer.role },
    },
  }]);
});
