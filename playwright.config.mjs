import { defineConfig, devices } from '@playwright/test';

/**
 * Konfigurasi Playwright untuk GadgetTrustX
 * https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Batas waktu per test case (45 detik untuk kompilasi Next.js dev di Windows) */
  timeout: 45 * 1000,
  expect: {
    timeout: 15 * 1000,
  },
  /* Jalankan dengan 2 worker agar dev server Next.js tidak terbebani saat kompilasi */
  workers: 2,
  fullyParallel: true,
  /* Reporter menghasilkan list di CLI dan web report HTML di folder playwright-report */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    /* Base URL aplikasi GadgetTrustX lokal */
    baseURL: 'http://localhost:3000',
    /* Simpan trace jika terjadi kegagalan untuk debugging */
    trace: 'on-first-retry',
    /* Simpan screenshot & video otomatis jika pengujian gagal */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Jika dev server belum jalan, Playwright akan menyalakannya otomatis */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
