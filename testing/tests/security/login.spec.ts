// NFR-001 — Sistem harus memvalidasi kredensial pengguna pada proses login.
// NFR-004 — Sistem harus memvalidasi input pada form autentikasi.
import { test, expect } from '@playwright/test';
import { login, openLogin, emailInput, passwordInput, submitButton, waitForTurnstile } from '../helpers';

const DASHBOARD = process.env.DASHBOARD_PATH || '/dashboard';

test.describe('NFR-001 Validasi kredensial login', () => {
  test('TC-001 Login dengan email & password valid', async ({ page }) => {
    test.skip(!process.env.VALID_EMAIL, 'Isi VALID_EMAIL & VALID_PASSWORD di .env');
    await login(page, process.env.VALID_EMAIL!, process.env.VALID_PASSWORD!);
    await expect(page).toHaveURL(new RegExp(DASHBOARD), { timeout: 20_000 });
  });

  test('TC-002 Login dengan email belum terkonfirmasi', async ({ page }) => {
    test.skip(!process.env.UNCONFIRMED_EMAIL, 'Isi UNCONFIRMED_EMAIL di .env');
    await login(page, process.env.UNCONFIRMED_EMAIL!, process.env.UNCONFIRMED_PASSWORD!);
    await expect(page.getByText(/email not confirmed/i)).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  test('TC-003 Login dengan password salah', async ({ page }) => {
    await login(page, 'tidakterdaftar.pkpl13@gmail.com', 'PasswordSalah123');
    await expect(page.getByText(/invalid login credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('NFR-004 Validasi input form autentikasi', () => {
  test('TC-004 Login dengan email & password kosong', async ({ page }) => {
    await openLogin(page);
    await waitForTurnstile(page);
    await submitButton(page).click();
    await expect(page.getByText(/harap isi semua kolom/i)).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  test('TC-005 Login dengan format email tidak valid', async ({ page }) => {
    await openLogin(page);
    await emailInput(page).fill('bukan-email');
    await passwordInput(page).fill('123456');
    await submitButton(page).click();
    // Lolos jika browser/aplikasi menolak format email dan tetap di halaman login
    const valid = await emailInput(page).evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(valid).toBe(false);
    await expect(page).toHaveURL(/login/);
  });
});
