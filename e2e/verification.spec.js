import { test, expect } from '@playwright/test';

test.describe('Halaman Verifikasi IMEI (TrustX Scanner)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/verification');
  });

  test('TC-VRF-01: Memuat halaman verifikasi dengan form IMEI Validator', async ({ page }) => {
    // Verifikasi heading halaman
    await expect(page.getByRole('heading', { name: /TrustX Scanner/i })).toBeVisible();

    // Verifikasi form IMEI Validator
    await expect(page.getByRole('heading', { name: /IMEI Validator/i })).toBeVisible();

    // Verifikasi input IMEI
    const imeiInput = page.getByPlaceholder(/Masukkan IMEI 15 digit/i);
    await expect(imeiInput).toBeVisible();

    // Verifikasi tombol Verifikasi dinonaktifkan jika input masih kosong
    const verifyBtn = page.getByRole('button', { name: /Verifikasi Keamanan Perangkat/i });
    await expect(verifyBtn).toBeDisabled();
  });

  test('TC-VRF-02: Validasi input IMEI hanya menerima angka dan maksimal 15 digit', async ({ page }) => {
    const imeiInput = page.getByPlaceholder(/Masukkan IMEI 15 digit/i);
    const verifyBtn = page.getByRole('button', { name: /Verifikasi Keamanan Perangkat/i });

    // Coba masukkan karakter huruf (harus difilter oleh regex input)
    await imeiInput.fill('abc123xyz');
    await expect(imeiInput).toHaveValue('123');
    await expect(verifyBtn).toBeDisabled();

    // Masukkan 14 digit (masih kurang 1 digit, tombol harus tetap disabled)
    await imeiInput.fill('12345678901234');
    await expect(verifyBtn).toBeDisabled();

    // Masukkan tepat 15 digit angka (tombol verifikasi harus aktif)
    await imeiInput.fill('352099001761482');
    await expect(imeiInput).toHaveValue('352099001761482');
    await expect(verifyBtn).toBeEnabled();
  });

  test('TC-VRF-03: Menampilkan petunjuk cara cek IMEI (*#06#)', async ({ page }) => {
    await expect(page.getByText(/\*#06#/i)).toBeVisible();
  });
});
