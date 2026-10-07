// NFR tambahan keamanan — HTTP security headers.
// Pakai expect.soft: semua header dicek walau ada yang gagal. Header yang hilang = temuan (bukan error script).
import { test, expect } from '@playwright/test';

test('TC-009 Respons memakai HTTPS dan security headers', async ({ request, baseURL }) => {
  expect(baseURL).toMatch(/^https:/);
  const res = await request.get('/');
  const h = res.headers();
  console.table({
    'strict-transport-security': h['strict-transport-security'] ?? '(tidak ada)',
    'x-frame-options': h['x-frame-options'] ?? '(tidak ada)',
    'x-content-type-options': h['x-content-type-options'] ?? '(tidak ada)',
    'content-security-policy': h['content-security-policy'] ?? '(tidak ada)',
    'referrer-policy': h['referrer-policy'] ?? '(tidak ada)',
  });
  expect.soft(h['strict-transport-security'], 'HSTS').toBeTruthy();
  expect.soft(h['x-content-type-options'], 'X-Content-Type-Options').toBe('nosniff');
  expect.soft(h['x-frame-options'] || h['content-security-policy'], 'Anti-clickjacking').toBeTruthy();
});
