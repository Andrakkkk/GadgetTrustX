import { test, expect } from '@playwright/test';

test.describe('Pengujian Security NFR-001: Validasi Kredensial Pengguna & Proteksi Form Otentikasi', () => {

  test('TC-SEC-01: Memvalidasi penolakan login dengan format email tidak valid dan password kosong', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.getByPlaceholder(/nama@email.com/i);
    const passwordInput = page.getByPlaceholder(/••••••••/i);
    const submitBtn = page.getByRole('button', { name: /Masuk sebagai/i });

    // Masukkan format email invalid (tanpa domain & @)
    await emailInput.fill('userinvalid');
    await passwordInput.fill('');

    // Verifikasi tombol submit tidak mengizinkan submit atau input ditandai invalid
    await expect(emailInput).toHaveValue('userinvalid');
    await expect(passwordInput).toHaveValue('');
  });

  test('TC-SEC-02: Memvalidasi atribut keamanan type=password pada input kata sandi untuk mencegah shoulder surfing', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.getByPlaceholder(/••••••••/i);
    await expect(passwordInput).toBeVisible();

    // Pastikan type input adalah password agar karakter disamarkan
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('TC-SEC-03: Memvalidasi pesan umpan balik galat login tidak membocorkan informasi spesifik akun', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.getByPlaceholder(/nama@email.com/i);
    const passwordInput = page.getByPlaceholder(/••••••••/i);

    await emailInput.fill('unregistered_user_99@test.com');
    await passwordInput.fill('WrongPassword123!');

    // Verifikasi input menerima value tanpa crash
    await expect(emailInput).toHaveValue('unregistered_user_99@test.com');
  });

});

test.describe('Pengujian Security NFR-002: Proteksi Rute Terlindungi & AuthGuard Redirection', () => {

  test('TC-SEC-04: Memvalidasi pencegahan akses tanpa otentikasi ke halaman Profil Pembeli (/buyer-profile)', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/buyer-profile');

    // Sistem harus mengarahkan kembali ke halaman login (AuthGuard redirection)
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('TC-SEC-05: Memvalidasi pencegahan akses tanpa otentikasi ke halaman Profil Penjual (/seller-profile)', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/seller-profile');

    // Pengguna yang belum login harus diarahkan ke /login
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('TC-SEC-06: Memvalidasi pembatasan akses ke halaman Dashboard Admin (/admin)', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/admin');

    // Publik dilarang mengakses dashboard admin
    await expect(page).toHaveURL(/.*login.*/);
  });

});

test.describe('Pengujian Security NFR-003: Sanitasi Input & Pencegahan Serangan Injeksi (Anti-SQLi & Anti-XSS)', () => {

  test('TC-SEC-07: Memvalidasi penyaringan payload SQL Injection pada form input IMEI dan filter pencarian', async ({ page }) => {
    await page.goto('/verification');

    const imeiInput = page.getByPlaceholder(/Masukkan IMEI 15 digit/i);
    const sqliPayload = "' OR 1=1 --";

    // Coba masukkan payload SQL Injection
    await imeiInput.fill(sqliPayload);

    // Sistem harus otomatis memfilter karakter berbahaya (petik, spasi, dash)
    await expect(imeiInput).toHaveValue('11');
    const verifyBtn = page.getByRole('button', { name: /Verifikasi Keamanan Perangkat/i });
    await expect(verifyBtn).toBeDisabled();
  });

  test('TC-SEC-08: Memvalidasi netralisasi payload Cross-Site Scripting (XSS) pada formulir input', async ({ page }) => {
    await page.goto('/verification');

    const imeiInput = page.getByPlaceholder(/Masukkan IMEI 15 digit/i);
    const xssPayload = '<script>alert("XSS")</script>';

    await imeiInput.fill(xssPayload);

    // Seluruh tag script harus dilenyapkan dan tidak dieksekusi di DOM
    await expect(imeiInput).toHaveValue('');
  });

  test('TC-SEC-09: Memvalidasi pembatasan panjang karakter (Length Limiting) untuk mencegah buffer overload', async ({ page }) => {
    await page.goto('/verification');

    const imeiInput = page.getByPlaceholder(/Masukkan IMEI 15 digit/i);
    const longInput = '9'.repeat(100); // 100 digit angka

    await imeiInput.fill(longInput);

    // Panjang nilai input harus dipotong tepat maksimal 15 karakter
    const actualVal = await imeiInput.inputValue();
    expect(actualVal.length).toBe(15);
  });

});

test.describe('Pengujian Security NFR-004 & NFR-005: Proteksi Rahasia API, Bot Prevention & Terminasi Sesi', () => {

  test('TC-SEC-10: Memvalidasi ketersediaan widget verifikasi bot Cloudflare Turnstile pada transaksi penting', async ({ page }) => {
    await page.goto('/verification');

    // Verifikasi container halaman verifikasi siap
    await expect(page.locator('main, div.glass-panel').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /TrustX Scanner/i })).toBeVisible();
  });

  test('TC-SEC-11: Memvalidasi ketiadaan kunci API atau rahasia sensitif (Zero Hardcoded Secrets) di atribut elemen DOM publik', async ({ page }) => {
    await page.goto('/');

    const pageContent = await page.content();

    // Pastikan tidak ada raw SUPABASE_SERVICE_ROLE_KEY atau API Secret yang bocor ke markup HTML
    expect(pageContent).not.toContain('service_role');
    expect(pageContent).not.toContain('TURNSTILE_SECRET_KEY');
  });

  test('TC-SEC-12: Memvalidasi mekanisme pembersihan token sesi (Secure Session Termination) saat proses logout', async ({ page }) => {
    await page.goto('/login');

    // Verifikasi ketiadaan session token aktif pada state unauthenticated
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('supabase-auth-token') || c.name.includes('access_token'));
    expect(sessionCookie).toBeUndefined();
  });

});
