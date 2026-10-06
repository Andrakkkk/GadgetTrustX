// Functionality — setiap fitur utama dapat diakses dan menampilkan konten.
import { test, expect } from '@playwright/test';

const PAGES = [
  { id: 'TC-010', path: '/', name: 'Beranda' },
  { id: 'TC-011', path: '/marketplace', name: 'Marketplace' },
  { id: 'TC-012', path: '/price-checker', name: 'AI Valuation' },
  { id: 'TC-013', path: '/verification', name: 'Scanner / Verifikasi IMEI' },
  { id: 'TC-014', path: '/smart-matching', name: 'Smart Match' },
  { id: 'TC-015', path: '/trade-in', name: 'Tukar Tambah (HP Bekas)' },
];

for (const p of PAGES) {
  test(`${p.id} Halaman ${p.name} dapat dibuka`, async ({ page }) => {
    const res = await page.goto(p.path);
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
  });
}

test('TC-016 Menu navigasi berpindah ke halaman yang benar', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Marketplace' }).first().click();
  await expect(page).toHaveURL(/\/marketplace/);
  await page.getByRole('link', { name: 'AI Valuation' }).first().click();
  await expect(page).toHaveURL(/\/price-checker/);
});

test('TC-017 Tombol "Daftar Gratis" membuka halaman registrasi/autentikasi', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /daftar gratis/i }).click();
  await expect(page).toHaveURL(/register|login/);
});
