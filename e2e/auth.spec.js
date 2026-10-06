import { test, expect } from '@playwright/test';

test.describe('Autentikasi Pengguna (Login & Register)', () => {
  test.beforeEach(async ({ page }) => {
    // Bersihkan storage & cookies agar tidak dalam keadaan login
    await page.context().clearCookies();
    await page.goto('/login');
  });

  test('TC-AUTH-01: Memuat halaman login dengan elemen form yang lengkap', async ({ page }) => {
    // Verifikasi heading form
    await expect(page.getByRole('heading', { name: /Selamat Datang Kembali/i })).toBeVisible();

    // Verifikasi pilihan role card
    const roleBuyer = page.getByRole('button', { name: /Pembeli Cari & beli gadget/i });
    const roleSeller = page.getByRole('button', { name: /Penjual Jual perangkat saya/i });
    await expect(roleBuyer).toBeVisible();
    await expect(roleSeller).toBeVisible();

    // Verifikasi input email dan password
    const emailInput = page.getByPlaceholder(/nama@email.com/i);
    const passwordInput = page.getByPlaceholder(/••••••••/i);
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Verifikasi tombol submit awal
    await expect(page.getByRole('button', { name: /Masuk sebagai/i })).toBeVisible();
  });

  test('TC-AUTH-02: Dapat beralih antara peran Pembeli dan Penjual', async ({ page }) => {
    const roleSeller = page.getByRole('button', { name: /Penjual Jual perangkat saya/i });
    await roleSeller.click();
    await expect(roleSeller).toHaveClass(/border-blue-500/);

    const roleBuyer = page.getByRole('button', { name: /Pembeli Cari & beli gadget/i });
    await roleBuyer.click();
    await expect(roleBuyer).toHaveClass(/border-blue-500/);
  });

  test('TC-AUTH-03: Dapat beralih ke form Pendaftaran Akun Baru', async ({ page }) => {
    // Cari tombol toggle ke mode registrasi
    const registerToggle = page.getByRole('button', { name: /Daftar gratis/i });
    await expect(registerToggle).toBeVisible();
    await registerToggle.click();

    await expect(page.getByRole('heading', { name: /Pendaftaran Akun Baru/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Contoh: Budi Santoso/i)).toBeVisible();
  });
});
