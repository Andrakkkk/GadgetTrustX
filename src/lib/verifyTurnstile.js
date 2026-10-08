const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TOKEN_MAX_LENGTH = 2048;
const VERIFY_TIMEOUT_MS = 8000;

function normalizeHostname(hostname) {
  return hostname.trim().toLowerCase().replace(/:\d+$/, '');
}

function getAllowedHostnames() {
  const configured = (process.env.TURNSTILE_ALLOWED_HOSTNAMES || '')
    .split(',')
    .map(normalizeHostname)
    .filter(Boolean);

  if (configured.length > 0) {
    const list = new Set(configured);
    list.add('gadget-trust-x.vercel.app');
    list.add('gadgetrustx.netlify.app');
    if (process.env.VERCEL_URL) list.add(normalizeHostname(process.env.VERCEL_URL));
    return Array.from(list);
  }

  return [];
}

export function getRequestIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();

  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('true-client-ip') ||
    forwardedFor ||
    ''
  );
}

export async function verifyTurnstileToken(token, ip = '') {
  if (!token || typeof token !== 'string') {
    return { success: false, error: 'Verifikasi Cloudflare wajib diselesaikan.' };
  }

  if (token.length > TOKEN_MAX_LENGTH) {
    return { success: false, error: 'Token Cloudflare tidak valid.' };
  }

  const secret = (process.env.TURNSTILE_SECRET_KEY || '').trim();
  if (!secret) {
    return { success: false, error: 'Cloudflare Turnstile belum dikonfigurasi di server.' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secret);
    formData.append('response', token);
    if (ip) formData.append('remoteip', ip);
    if (globalThis.crypto?.randomUUID) {
      formData.append('idempotency_key', globalThis.crypto.randomUUID());
    }

    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return { success: false, error: 'Cloudflare tidak dapat memvalidasi permintaan saat ini.' };
    }

    const outcome = await response.json();
    if (!outcome.success) {
      console.warn('Turnstile verification failed:', outcome['error-codes']);
      return { success: false, error: 'Verifikasi Cloudflare gagal. Silakan coba lagi.' };
    }

    const allowedHostnames = getAllowedHostnames();
    if (allowedHostnames.length > 0) {
      if (!outcome.hostname) {
        console.warn('Turnstile hostname missing.');
        return { success: false, error: 'Hostname Cloudflare tidak tersedia.' };
      }

      const hostname = normalizeHostname(outcome.hostname);
      if (!allowedHostnames.includes(hostname)) {
        console.warn('Turnstile hostname rejected:', hostname);
        return { success: false, error: 'Hostname Cloudflare tidak sesuai konfigurasi.' };
      }
    }

    return { success: true };
  } catch (error) {
    console.warn('Turnstile verification error:', error.message);
    return { success: false, error: 'Verifikasi Cloudflare sedang bermasalah. Silakan coba lagi.' };
  } finally {
    clearTimeout(timeout);
  }
}
