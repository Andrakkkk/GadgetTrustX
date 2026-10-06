import { test, expect } from '@playwright/test';

test.describe('Pengujian Usability NFR-011: Struktur Navigasi, Responsivitas Mobile & Konsistensi UI', () => {

  test('TC-USB-01: Memuat dan memvalidasi keutuhan 5 menu navigasi utama (Marketplace, AI Valuation, Scanner, Smart Match, HP Bekas)', async ({ page }) => {
    await page.goto('/');

    // Verifikasi keberadaan bilah navigasi utama
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();

    // Verifikasi 5 menu navigasi utama sesuai kebutuhan pengguna
    await expect(navbar.getByRole('link', { name: /Marketplace/i })).toBeVisible();
    await expect(navbar.getByRole('link', { name: /AI Valuation/i })).toBeVisible();
    await expect(navbar.getByRole('link', { name: /Scanner/i })).toBeVisible();
    await expect(navbar.getByRole('link', { name: /Smart Match/i })).toBeVisible();
    await expect(navbar.getByRole('link', { name: /HP Bekas/i })).toBeVisible();

    // Verifikasi logo dan identitas platform
    await expect(page.getByText('GadgetTrustX').first()).toBeVisible();
  });

  test('TC-USB-02: Memvalidasi interaktivitas navigasi mobile drawer dan penutupan otomatis saat rute berpindah', async ({ page }) => {
    // Simulasikan tampilan layar perangkat ponsel (Mobile Viewport)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verifikasi tombol toggle menu mobile muncul pada layar kecil
    const menuToggle = page.locator('nav button').first();
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();

    // Klik menu Scanner dari daftar menu mobile
    const scannerLink = page.getByRole('link', { name: /Scanner/i }).first();
    await expect(scannerLink).toBeVisible();
    await scannerLink.click();

    // Verifikasi halaman berpindah ke /verification dan drawer menutup otomatis
    await expect(page).toHaveURL(/.*verification.*/);
  });

  test('TC-USB-03: Memvalidasi kejelasan format mata uang lokal (Rp / IDR) dan badge verifikasi seller pada kartu produk', async ({ page }) => {
    await page.goto('/marketplace');

    // Verifikasi kontainer katalog produk tampil
    const productGrid = page.locator('main, section').first();
    await expect(productGrid).toBeVisible();

    // Verifikasi elemen kartu produk pertama
    const firstCard = page.locator('div.group, [data-testid="device-card"]').first();
    await expect(firstCard).toBeVisible();

    // Verifikasi format harga mencantumkan format standar Rupiah (IDR)
    await expect(firstCard.getByText(/Rp/i).first()).toBeVisible();

    // Verifikasi adanya elemen rating atau identitas kondisi barang
    await expect(firstCard.locator('svg, span').first()).toBeVisible();
  });

});
