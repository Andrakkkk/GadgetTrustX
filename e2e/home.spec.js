import { test, expect } from '@playwright/test';

test.describe('Halaman Utama (Landing Page) GadgetTrustX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Tunggu elemen hero stabil setelah animasi GSAP
    await expect(page.locator('h1.hero-title')).toBeVisible();
  });

  test('TC-HOME-01: Memuat halaman beranda dengan elemen hero yang lengkap', async ({ page }) => {
    // Verifikasi navbar dan logo
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('GadgetTrustX').first()).toBeVisible();

    // Verifikasi hero title & tagline
    const heroHeading = page.locator('h1.hero-title');
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toContainText('Gadget impian');

    // Verifikasi CTA button ke marketplace
    const marketplaceBtn = page.getByRole('link', { name: /Jelajahi Marketplace/i });
    await expect(marketplaceBtn).toBeVisible();
  });

  test('TC-HOME-02: Navigasi tombol CTA Hero mengarah ke Marketplace', async ({ page }) => {
    const marketplaceBtn = page.getByRole('link', { name: /Jelajahi Marketplace/i });
    await expect(marketplaceBtn).toBeVisible();
    await marketplaceBtn.click();
    await expect(page).toHaveURL(/.*marketplace.*/);
  });

  test('TC-HOME-03: Menampilkan kartu fitur utama platform', async ({ page }) => {
    // Verifikasi kartu fitur
    await expect(page.getByText('Valuasi Harga AI')).toBeVisible();
    await expect(page.getByText('Verifikasi IMEI & Keaslian')).toBeVisible();
    await expect(page.getByText('Tukar Tambah HP Lama')).toBeVisible();
  });

  test('TC-HOME-04: Navigasi Navbar berfungsi dengan baik', async ({ page }) => {
    // Klik menu Scanner di Navbar desktop
    const scannerLink = page.locator('nav').getByRole('link', { name: /Scanner/i });
    await expect(scannerLink).toBeVisible();
    await scannerLink.click();
    await expect(page).toHaveURL(/.*verification.*/);
  });
});
