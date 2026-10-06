import { Page, expect } from '@playwright/test';

export const emailInput = (page: Page) => page.locator('input[type="email"]').first();
export const passwordInput = (page: Page) => page.locator('input[type="password"]').first();
export const submitButton = (page: Page) =>
  page.getByRole('button', { name: /^(masuk|login|sign in)/i }).first();

/**
 * Menunggu Cloudflare Turnstile selesai (token terisi).
 * Kalau Turnstile meminta klik, jalankan dengan --headed dan klik kotaknya secara manual;
 * test akan menunggu sampai 60 detik. Catat ini sebagai keterbatasan di laporan.
 */
export async function waitForTurnstile(page: Page) {
  const token = page.locator('input[name="cf-turnstile-response"]');
  if ((await token.count()) === 0) return; // tidak ada Turnstile di halaman ini
  await expect
    .poll(async () => (await token.first().inputValue()).length, { timeout: 60_000 })
    .toBeGreaterThan(0);
}

export async function openLogin(page: Page) {
  await page.goto('/login');
  await expect(emailInput(page)).toBeVisible({ timeout: 20_000 }); // form dirender di client
}

export async function login(page: Page, email: string, password: string) {
  await openLogin(page);
  await emailInput(page).fill(email);
  await passwordInput(page).fill(password);
  await waitForTurnstile(page);
  await submitButton(page).click();
}
