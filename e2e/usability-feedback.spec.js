import { test, expect } from '@playwright/test';

test.describe('Pengujian Usability NFR-012: Pencegahan Galat (Error Prevention) & Kejelasan Umpan Balik', () => {

  test('TC-USB-04: Validasi input masking formulir IMEI (Filter otomatis karakter non-angka & pembatasan 15 digit)', async ({ page }) => {
    await page.goto('/verification');

    const imeiInput = page.getByPlaceholder(/Masukkan IMEI 15 digit/i);
    await expect(imeiInput).toBeVisible();

    // Masukkan kombinasi huruf dan simbol non-angka
    await imeiInput.fill('3546-8515-ABCD-564');
    // Sistem harus secara otomatis memfilter karakter non-angka
    await expect(imeiInput).toHaveValue('35468515564');

    // Masukkan lebih dari 15 digit angka (harus dipotong tepat 15 digit)
    await imeiInput.fill('12345678901234567890');
    await expect(imeiInput).toHaveValue('123456789012345');
  });

  test('TC-USB-05: Pencegahan submit data tidak lengkap dan status tombol disabled untuk mencegah double-submission', async ({ page }) => {
    await page.goto('/verification');

    const imeiInput = page.getByPlaceholder(/Masukkan IMEI 15 digit/i);
    const verifyBtn = page.getByRole('button', { name: /Verifikasi Keamanan Perangkat/i });

    // Saat input kosong, tombol harus dalam keadaan non-aktif (disabled)
    await expect(verifyBtn).toBeDisabled();

    // Saat input baru 10 digit (belum lengkap), tombol tetap harus disabled
    await imeiInput.fill('3546851512');
    await expect(verifyBtn).toBeDisabled();

    // Saat input telah genap 15 digit, tombol harus aktif (enabled) dan siap diklik
    await imeiInput.fill('354685151234564');
    await expect(verifyBtn).toBeEnabled();
  });

  test('TC-USB-06: Verifikasi kejelasan pesan umpan balik visual dan petunjuk format pengisian IMEI', async ({ page }) => {
    await page.goto('/verification');

    // Verifikasi ketersediaan petunjuk cara memeriksa nomor IMEI (*#06#)
    await expect(page.getByText(/\*#06#/i)).toBeVisible();

    // Verifikasi sub-heading petunjuk spesifikasi TAC
    await expect(page.getByText(/80\+ Model · TAC Database · Luhn Check/i)).toBeVisible();

    // Verifikasi kejelasan badge indikator verifikasi pada antarmuka
    await expect(page.locator('h2, h3').filter({ hasText: /IMEI Validator/i })).toBeVisible();
  });

});
