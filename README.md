# Smart Device Marketplace (GadgetTrustX)

[![Deploy Status](https://img.shields.io/badge/Deployment-Netlify-00C7B7?style=flat&logo=netlify&logoColor=white)](https://gadgetrustx.netlify.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat&logo=react&logoColor=black)](https://react.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Platform marketplace *smart device* (smartphone, tablet, laptop, dan wearable) terpadu yang dirancang khusus untuk menciptakan ekosistem jual-beli gadget bekas dan baru yang aman, transparan, dan terpercaya di Indonesia. 

GadgetTrustX memecahkan problematika tingginya risiko penipuan (barang fiktif, pemblokiran IMEI ilegal, manipulasi *battery health*, dan transfer langsung tanpa proteksi) dengan memadukan **Rekening Bersama Terproteksi (Escrow)**, **Mesin Valuasi & Tukar Tambah AI (Gemini AI)**, **Pemindai IMEI TAC Global**, **Pencocokan Cerdas (Smart Match)**, serta **Negosiasi Langsung (Live Chat & Custom Offer)**.

---

## 🌐 Tautan Proyek

- **Live Production URL**: [https://gadgetrustx.netlify.app/](https://gadgetrustx.netlify.app/)
- **GitHub Repository**: [https://github.com/Andrakkkk/GadgetTrustX](https://github.com/Andrakkkk/GadgetTrustX)

---

## ✨ Fitur Utama Sistem

### 1. Marketplace & Multi-Parameter Filter (`/marketplace`)
- Katalog lengkap produk gadget baru dan bekas berkualitas.
- Filter pintar berdasarkan merek (*Apple, Samsung, Xiaomi, Google, dll.*), kapasitas RAM, internal storage, kondisi fisik unit, dan rentang harga numerik.
- Pengurutan dinamis (*Termurah, Termahal, Terbaru*).
- Penanda verifikasi resmi **"Verified by TrustX"** untuk unit yang telah lolos inspeksi keaslian.

### 2. Valuasi Harga AI / AI Valuation (`/price-checker`)
- Mesin valuasi harga pasar *real-time* bertenaga **Google Gemini AI**.
- Menganalisis kondisi fisik, kelengkapan aksesoris, kapasitas memori, dan tren pasar terkini.
- Menyajikan estimasi harga wajar, batas rentang pasar (*price range*), analisis *demand index*, serta tingkat keyakinan (*confidence score*).

### 3. Pemindai & Verifikasi Legalitas IMEI (`/verification`)
- Alat validasi 15-digit nomor IMEI dengan implementasi algoritma **Luhn Check**.
- Integrasi *database* **Type Allocation Code (TAC) Global** (80+ model gadget terkemuka).
- Memeriksa keaslian spesifikasi pabrikan, status sinyal/garansi regional, serta mendeteksi status *blacklist* atau pelaporan unit hilang/curian.

### 4. Smart Match Wizard (`/smart-matching`)
- Asisten interaktif 4-tahap yang mencocokkan kebutuhan konsumen (*budget*, fokus kebutuhan utama seperti *gaming/fotografi/produktivitas*, serta preferensi merek).
- Mengkalkulasi *AI Match Score* untuk merekomendasikan perangkat paling sesuai dari katalog aktif.

### 5. HP Bekas & Trade-In Hub (`/trade-in`)
- Pusat program tukar tambah (*trade-in*) gadget secara digital.
- Formulir inspeksi fisik dengan pengunggahan **6 sudut foto** (Depan, Belakang, Layar, Samping, Box/Charger, Cacat/Dent).
- Menghasilkan taksiran potongan harga instan yang diaudit oleh AI untuk memotong total tagihan pembelian unit baru.

### 6. Transaksi Aman Midtrans Escrow & Ongkir Real-Time (`/checkout`)
- Sistem pembayaran rekening bersama (*escrow holding*) terintegrasi **Midtrans Payment Gateway** (GoPay QRIS dengan batas kedaluwarsa 15 menit, Virtual Account Bank 24 jam, dan transfer bank).
- Dana ditahan di rekening penampungan dan hanya diteruskan ke penjual setelah barang diterima pembeli atau batas garansi 72 jam terlampaui.
- Kalkulasi ongkir otomatis untuk kurir ekspedisi (JNE, SiCepat, Pos Indonesia) melalui integrasi API kurir.
- Proteksi bot cerdas menggunakan **Cloudflare Turnstile** dan penerapan *idempotency key* untuk mencegah *double-charge*.

### 7. Manajemen Peran & Dasbor Pengguna
- **Dasbor Pembeli (`/buyer-profile`)**: Pelacakan riwayat pesanan, *live countdown timer* pembayaran escrow, pelacakan nomor resi pengiriman *real-time* (BinderByte API), konfirmasi pesanan selesai, dan pengajuan retur barang bermasalah beserta unggahan bukti foto cacat.
- **Dasbor Penjual (`/seller-profile`)**: Manajemen toko, penerbitan katalog perangkat dengan fitur **AI Auto-Fill Spesifikasi** (Gemini AI), pencetakan label kirim, input nomor resi kurir, audit foto kondisi unit *trade-in*, dan tanggapan ulasan pembeli.
- **Dasbor Superadmin / Inspector (`/admin`)**: Pemantauan metrik ekosistem, aktivasi lencana verifikasi katalog (*Verified by TrustX*), persetujuan/penolakan tiket sengketa retur barang (*Return Refund Approval*), dan manajemen verifikasi toko penjual.

### 8. Live Chat & Custom Offer
- Komunikasi langsung antara calon pembeli dan penjual via `ChatWidget`.
- Fitur penerbitan kartu negosiasi eksklusif (**Custom Offer**) dengan harga khusus yang telah disepakati kedua pihak.

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

| Lapisan | Teknologi & Layanan |
| :--- | :--- |
| **Frontend Framework** | **Next.js 16.2.4** (App Router & Turbopack), **React 19.2.4** |
| **Styling & UI Theme** | **Tailwind CSS v4**, Dark Glassmorphism Design, **GSAP 3.15** & ScrollTrigger |
| **Autentikasi & Database** | **Supabase Auth**, **Supabase PostgreSQL** dengan Row Level Security (RLS) |
| **Media Storage** | **Supabase Storage** (Bucket `device-media`) |
| **Kecerdasan Buatan (AI)** | **Google Gemini AI API** (Valuasi Harga, Auto-Fill Katalog, Audit Trade-In) |
| **Payment Gateway** | **Midtrans Client** (QRIS GoPay, Bank Virtual Account Escrow Holding) |
| **Pengiriman & Logistik** | **BinderByte Logistics API** (Kalkulasi Tarif & Tracking Resi JNE, SiCepat, Pos) |
| **Keamanan & Anti-Bot** | **Cloudflare Turnstile**, Idempotent Request Handlers |
| **Hosting & Deployment** | **Netlify Edge CDN** |
| **Testing & Quality Assurance** | **Playwright Test** (E2E, Security, Usability), **k6** (Performance & Load Testing) |

---

## 📂 Struktur Direktori Proyek

```text
smart-device-marketplace/
├── e2e/                           # Skenario pengujian end-to-end
├── prisma/                        # Skema database & migrasi (jika menggunakan Prisma)
├── public/                        # Aset statis, ikon, dan gambar branding
│   ├── images/
│   └── favicon.ico
├── scripts/                       # Skrip automasi & seed data Supabase
│   ├── seed-supabase-devices.mjs
│   └── ensure-supabase-admin.mjs
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── admin/                 # Dasbor Superadmin / Inspector
│   │   ├── api/                   # API Route Handlers (Auth, Orders, Payment, Shipping, AI)
│   │   ├── buyer-profile/         # Dasbor Pembeli & Pelacakan Resi
│   │   ├── cart/                  # Keranjang belanja
│   │   ├── checkout/              # Checkout transaksi & Midtrans Escrow
│   │   ├── login/                 # Autentikasi Login Supabase
│   │   ├── marketplace/           # Katalog produk & filter multi-parameter
│   │   ├── price-checker/         # Valuasi harga pasar Gemini AI
│   │   ├── product/[id]/          # Halaman detail produk & ChatWidget
│   │   ├── register/              # Registrasi akun pengguna baru
│   │   ├── reset-password/        # Layanan pemulihan & reset kata sandi
│   │   ├── seller-profile/        # Dasbor Penjual & Manajemen Katalog
│   │   ├── smart-matching/        # Wizard rekomendasi preferensi AI
│   │   ├── trade-in/              # Formulir pengajuan tukar tambah 6 sudut foto
│   │   ├── verification/          # TrustX Scanner IMEI TAC 15-digit
│   │   ├── layout.js              # Root Layout dengan tema Glassmorphism
│   │   └── page.js                # Landing page utama
│   ├── components/                # Komponen UI modular (Navbar, Footer, Modals, dll.)
│   ├── hooks/                     # Custom React Hooks (useAuth, dll.)
│   ├── lib/                       # Konfigurasi Supabase, Gemini AI, Turnstile
│   └── utils/                     # Fungsi utilitas & kalkulasi format uang
├── supabase/                      # Skema DDL SQL & aturan Row Level Security
│   └── schema.sql
├── testing/                       # Rangkaian pengujian terstruktur (SQA)
│   ├── performance/               # Skrip k6 load testing
│   └── tests/                     # Playwright specs (Functionality, Security, Usability)
├── BACKEND_MIGRATION.md           # Panduan migrasi backend Supabase
├── TRADE_IN_FEATURE.md            # Dokumentasi teknis alur Trade-In
└── package.json
```

---

## 🚀 Panduan Menjalankan Proyek Secara Lokal

### 1. Prasyarat Sistem
- **Node.js**: Versi 18.18 atau lebih baru (direkomendasikan Node.js 20 LTS).
- **NPM** atau **PNPM** package manager.
- Akun dan proyek aktif di **Supabase**.

### 2. Kloning Repositori & Instalasi Dependensi
```bash
git clone https://github.com/Andrakkkk/GadgetTrustX.git
cd GadgetTrustX
npm install
```

### 3. Konfigurasi Environment Variable
Salin berkas `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Lengkapi variabel lingkungan pada `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_STORAGE_BUCKET=device-media

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY=your-midtrans-server-key
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your-midtrans-client-key
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key
TURNSTILE_SECRET_KEY=your-turnstile-secret-key

# Logistics (BinderByte)
BINDERBYTE_API_KEY=your-binderbyte-api-key
```

### 4. Setup Database & Seed Data
1. Buka SQL Editor di dasbor Supabase Anda dan jalankan kueri dari `supabase/schema.sql`.
2. Jalankan skrip *seeding* katalog gadget awal:
```bash
npm run seed:supabase
```
3. *(Opsional)* Tetapkan akun superadmin jika diperlukan:
```bash
npm run admin:ensure
```

### 5. Menjalankan Server Development
```bash
npm run dev
```
Buka peramban web dan akses:
```text
http://localhost:3000
```

---

## 🧪 Pengujian & Penjaminan Mutu Perangkat Lunak (SQA)

Repositori ini telah dilengkapi dengan instrumen pengujian otomatis (*automated testing*) dan dokumen rencana pengujian (*Test Plan*) standar **ISO/IEC/IEEE 29119**:

### Menjalankan Pengujian Fungsional & E2E (Playwright)
```bash
# Menjalankan seluruh pengujian E2E headless
npm run test:e2e

# Menjalankan pengujian E2E dengan tampilan UI interaktif
npm run test:e2e:ui

# Membuka laporan hasil pengujian Playwright
npm run test:e2e:report
```

### Menjalankan Pengujian Usabilitas
```bash
npm run test:usability
```

### Menjalankan Pengujian Beban & Performa (k6)
```bash
k6 run testing/performance/k6-load.js
```

---

## 👥 Kontributor & Hak Cipta

- **Pengembang & Penyusun**: Leandra Andra ([@Andrakkkk](https://github.com/Andrakkkk))
- **Mata Kuliah**: Praktikum Penjaminan Kualitas Perangkat Lunak (PKPL) / SQA & Rekayasa Kebutuhan
- **Institusi**: Program Studi Informatika, Universitas Muhammadiyah Malang
