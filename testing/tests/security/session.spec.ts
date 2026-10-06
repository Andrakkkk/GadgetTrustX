// NFR-002 — Sistem harus mengelola sesi pengguna sesuai status autentikasi.
// NFR-005 — Sistem harus mengakhiri sesi pengguna setelah logout.
import { test, expect } from '@playwright/test';
import { login } from '../helpers';

const DASHBOARD = process.env.DASHBOARD_PATH || '/dashboard';

test.describe.serial('Sesi & logout', () => {
  test.skip(!process.env.VALID_EMAIL, 'Isi VALID_EMAIL & VALID_PASSWORD di .env');

  test('TC-006 Sesi tetap aktif setelah halaman di-refresh', async ({ page }) => {
    await login(page, process.env.VALID_EMAIL!, process.env.VALID_PASSWORD!);
    await expect(page).toHaveURL(new RegExp(DASHBOARD), { timeout: 20_000 });
    await page.reload();
    await expect(page).toHaveURL(new RegExp(DASHBOARD));
  });

  test('TC-007 Logout mengakhiri sesi & dashboard tidak bisa diakses lagi', async ({ page }) => {
    await login(page, process.env.VALID_EMAIL!, process.env.VALID_PASSWORD!);
    await expect(page).toHaveURL(new RegExp(DASHBOARD), { timeout: 20_000 });

    // Tombol logout berupa ikon; sesuaikan selector ini lewat `npm run codegen` bila gagal
    const logout = page
      .locator('button[aria-label*="logout" i], button[aria-label*="keluar" i], button[title*="keluar" i], button[title*="logout" i]')
      .or(page.getByRole('button', { name: /keluar|logout/i }))
      .first();
    await logout.click();

    await page.goto(DASHBOARD);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });
});
