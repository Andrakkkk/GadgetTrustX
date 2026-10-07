# Pengujian Otomatis GadgetTrustX

SUT: https://gadgetrustx.netlify.app — PKPL Kelas B, Kelompok 13

| Aspek | Kakas bantu | File |
|---|---|---|
| Security | Playwright | `tests/security/*.spec.ts` |
| Functionality | Playwright | `tests/functionality/navigation.spec.ts` |
| Performance | Playwright (Navigation Timing), Lighthouse, k6 | `tests/performance/`, `performance/k6-load.js` |
| Usability | Playwright + axe-core | `tests/usability/usability.spec.ts` |
| Reliability | Playwright (`--repeat-each=3`) | `tests/reliability/reliability.spec.ts` |
| Maintainability | ESLint / SonarCloud (butuh source code repo GadgetTrustX) | — |

## Cara menjalankan

```bash
npm install
npx playwright install chrome
cp .env.example .env      # isi akun uji
npm run test:security     # --headed: kalau Turnstile minta klik, klik manual
npm run test:functionality
npm run test:performance
npm run test:usability
npm run test:reliability
npm run report            # buka laporan HTML -> screenshot untuk laporan
npm run lighthouse        # skor Performance / Accessibility / Best Practices / SEO
k6 run performance/k6-load.js   # opsional, perlu install k6
```

Selector tidak cocok? Jalankan `npm run codegen`, klik elemen di browser yang terbuka, salin selector yang dihasilkan.

## Catatan Cloudflare Turnstile
Login dilindungi Turnstile. Test login dijalankan dalam mode `--headed`; jika Turnstile tidak lolos otomatis,
penguji mengklik kotak verifikasi secara manual (helper menunggu hingga 60 detik). Ini dicatat sebagai keterbatasan otomasi.
