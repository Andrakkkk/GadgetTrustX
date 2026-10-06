// Reliability — tidak ada link rusak, error ditangani, tanpa error JS di console.
// Jalankan dengan --repeat-each=3 untuk menunjukkan hasil konsisten.
import { test, expect } from '@playwright/test';

test('TC-021 Semua link internal di beranda tidak rusak (status < 400)', async ({ page, request }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const hrefs = await page.$$eval('a[href^="/"], a[href*="gadgetrustx.netlify.app"]', as =>
    [...new Set(as.map(a => (a as HTMLAnchorElement).href.split('#')[0]))]);
  const rusak: string[] = [];
  for (const href of hrefs) {
    const res = await request.get(href);
    if (res.status() >= 400) rusak.push(`${res.status()} ${href}`);
  }
  console.log(`Dicek ${hrefs.length} link`, rusak);
  expect(rusak).toEqual([]);
});

test('TC-022 Halaman yang tidak ada menampilkan halaman 404, bukan crash', async ({ page }) => {
  const res = await page.goto('/halaman-yang-tidak-ada-123', {waitUntil: 'domcontentloaded'});
  expect(res?.status()).toBe(404);
  await expect(page.locator('body')).not.toBeEmpty();
});

test('TC-023 Tidak ada error JavaScript di console saat membuka halaman utama', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  for (const p of ['/', '/marketplace', '/price-checker']) {
    await page.goto(p, { waitUntil  : 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
  }
  console.log(errors);
  expect.soft(errors).toEqual([]);
});
