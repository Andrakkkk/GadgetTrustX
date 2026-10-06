import { test, expect } from '@playwright/test';

test.describe('Halaman Trade-In (HP Bekas Hub)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trade-in');
  });

  test('TC-TRD-01: Memuat halaman HP Bekas Hub dan tab navigasi', async ({ page }) => {
    // Verifikasi heading utama
    await expect(page.getByRole('heading', { name: /HP BEKAS HUB/i })).toBeVisible();

    // Verifikasi dua tombol tab
    const catalogTab = page.getByRole('button', { name: /Lihat barang bekas/i });
    const sellTab = page.getByRole('button', { name: /Jual perangkat/i });
    await expect(catalogTab).toBeVisible();
    await expect(sellTab).toBeVisible();
  });

  test('TC-TRD-02: Beralih ke tab Jual Perangkat dan memuat Gemini AI Valuation Engine', async ({ page }) => {
    const sellTab = page.getByRole('button', { name: /Jual perangkat/i });
    await sellTab.click();

    // Pastikan form estimasi Gemini AI muncul
    await expect(page.getByRole('heading', { name: /Gemini AI Valuation Engine/i })).toBeVisible();

    // Pastikan dropdown Model Target tersedia
    const modelSelect = page.locator('select').first();
    await expect(modelSelect).toBeVisible();
  });
});
