// NFR-003 — Sistem harus mencegah pengguna yang belum login mengakses halaman yang butuh login.
import { test, expect } from '@playwright/test';

// Cek manual dulu halaman mana yang memang butuh login, lalu sesuaikan daftar ini.
const PROTECTED = [process.env.DASHBOARD_PATH || '/dashboard', '/cart'];

for (const path of PROTECTED) {
  test(`TC-008 Akses ${path} tanpa login diarahkan ke /login`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });
}
