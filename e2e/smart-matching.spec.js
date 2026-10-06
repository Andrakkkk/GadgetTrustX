import { test, expect } from '@playwright/test';

test.describe('Halaman Smart Match AI Engine', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to always start fresh at step 1
    await page.addInitScript(() => {
      window.localStorage.removeItem('smart_match_state');
    });
    await page.goto('/smart-matching');
  });

  test('TC-SM-01: Memuat halaman Smart Match dengan tahapan pertama (kebutuhan utama)', async ({ page }) => {
    // Verifikasi heading utama
    await expect(page.getByRole('heading', { name: /Smart Match AI Engine/i })).toBeVisible();

    // Verifikasi pertanyaan step 1
    await expect(page.getByRole('heading', { name: /Untuk kebutuhan utama apa\?/i })).toBeVisible();

    // Verifikasi opsi kebutuhan
    await expect(page.getByText('Creative Pro')).toBeVisible();
    await expect(page.getByText('Hardcore Gaming')).toBeVisible();
    await expect(page.getByText('Productivity')).toBeVisible();
    await expect(page.getByText('Daily Lifestyle')).toBeVisible();
  });

  test('TC-SM-02: Alur wizard 3-step navigasi preferensi pengguna', async ({ page }) => {
    // Step 1: Pilih kebutuhan 'Hardcore Gaming'
    const gamingOption = page.locator('button').filter({ hasText: 'Hardcore Gaming' });
    await expect(gamingOption).toBeVisible();
    await gamingOption.click();

    // Step 2: Harus masuk ke pengaturan batas budget
    await expect(page.getByRole('heading', { name: /Batas Budget Maksimal/i })).toBeVisible();
    const lanjutBtn = page.getByRole('button', { name: 'Lanjut' });
    await expect(lanjutBtn).toBeVisible();
    await lanjutBtn.click();

    // Step 3: Harus masuk ke preferensi brand
    await expect(page.getByRole('heading', { name: /Preferensi Brand \/ Ekosistem/i })).toBeVisible();

    // Pilih brand Samsung
    const samsungBtn = page.getByRole('button', { name: 'Samsung', exact: true });
    await expect(samsungBtn).toBeVisible();
    await samsungBtn.click();
    await expect(samsungBtn).toHaveClass(/bg-purple-600/);

    // Tombol 'Kembali' harus dapat kembali ke Step 2
    const kembaliBtn = page.getByRole('button', { name: 'Kembali' });
    await kembaliBtn.click();
    await expect(page.getByRole('heading', { name: /Batas Budget Maksimal/i })).toBeVisible();
  });
});
