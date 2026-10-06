import { test, expect } from '@playwright/test';

test.describe('Halaman Smart Price Checker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/price-checker');
  });

  test('TC-PRC-01: Memuat halaman price checker dengan form spesifikasi perangkat', async ({ page }) => {
    // Verifikasi heading
    await expect(page.getByRole('heading', { name: /Smart Price Checker/i })).toBeVisible();

    // Verifikasi label spesifikasi
    await expect(page.getByRole('heading', { name: /Spesifikasi/i })).toBeVisible();

    // Verifikasi input model
    const modelInput = page.getByPlaceholder(/iPhone 15 Pro Max/i);
    await expect(modelInput).toBeVisible();

    // Verifikasi tombol Cek Estimasi AI
    const analyzeBtn = page.getByRole('button', { name: /Cek Estimasi AI/i });
    await expect(analyzeBtn).toBeVisible();
  });

  test('TC-PRC-02: Mengisi form spesifikasi dan memilih kondisi perangkat', async ({ page }) => {
    const modelInput = page.getByPlaceholder(/iPhone 15 Pro Max/i);
    await modelInput.fill('Samsung Galaxy S24 Ultra');
    await expect(modelInput).toHaveValue('Samsung Galaxy S24 Ultra');

    // Klik tombol kondisi 'Excellent'
    const excellentBtn = page.getByRole('button', { name: 'Excellent', exact: true });
    await expect(excellentBtn).toBeVisible();
    await excellentBtn.click();

    // Pastikan tombol terhighlight (memiliki class active bg-blue-600)
    await expect(excellentBtn).toHaveClass(/bg-blue-600/);
  });
});
