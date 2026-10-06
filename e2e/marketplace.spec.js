import { test, expect } from '@playwright/test';

test.describe('Halaman Marketplace GadgetTrustX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/marketplace');
  });

  test('TC-MKT-01: Memuat halaman marketplace dengan section Hero dan Featured Hardware', async ({ page }) => {
    // Verifikasi heading utama marketplace
    await expect(page.getByRole('heading', { name: /The Verified Gadget Marketplace/i })).toBeVisible();
    
    // Verifikasi tombol eksplorasi produk
    const exploreBtn = page.getByRole('button', { name: /Jelajahi Semua Produk/i });
    await expect(exploreBtn).toBeVisible();

    // Verifikasi section Featured Hardware muncul sebelum katalog
    await expect(page.getByRole('heading', { name: /Featured Hardware/i })).toBeVisible();
  });

  test('TC-MKT-02: Membuka katalog produk dan melakukan pencarian perangkat', async ({ page }) => {
    // Klik tombol Jelajahi Semua Produk untuk membuka katalog
    const exploreBtn = page.getByRole('button', { name: /Jelajahi Semua Produk/i });
    await exploreBtn.click();

    // Pastikan input search muncul
    const searchInput = page.getByPlaceholder(/Cari gadget, merek, atau spesifikasi/i);
    await expect(searchInput).toBeVisible();

    // Coba ketik kata kunci pencarian
    await searchInput.fill('iPhone');
    await expect(searchInput).toHaveValue('iPhone');

    // Coba kosongkan kembali
    await searchInput.fill('');
    await expect(searchInput).toHaveValue('');
  });

  test('TC-MKT-03: Navigasi tombol Valuasi Harga AI dari Marketplace ke Price Checker', async ({ page }) => {
    const valuationBtn = page.getByRole('button', { name: /Valuasi Harga AI/i });
    await expect(valuationBtn).toBeVisible();
    await valuationBtn.click();
    await expect(page).toHaveURL(/.*price-checker.*/);
  });
});
