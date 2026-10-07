import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  retries: 1, // longgar, karena login menunggu Cloudflare Turnstile
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1, // satu per satu supaya tidak membebani situs & Turnstile
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: (globalThis as typeof globalThis & { process?: { env?: { BASE_URL?: string } } }).process?.env?.BASE_URL || 'https://gadgetrustx.netlify.app',
    navigationTimeout: 60_000, 
    screenshot: 'on', // setiap test menyimpan screenshot -> bahan kolom "Tangkap Layar"
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    locale: 'id-ID',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome']} },
  ],
});
