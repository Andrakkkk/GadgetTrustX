# Smart Device Marketplace (GadgetTrustX)

## Deskripsi Project

Smart Device Marketplace (GadgetTrustX) adalah platform jual beli device elektronik yang dirancang untuk membantu pengguna melakukan transaksi secara aman, cepat, dan terpercaya.

Sistem ini menyediakan fitur Smart Price Checker, Device Verification, Trade-In System, Seller Reputation, Smart Matching Buyer-Seller, dan pencarian produk berdasarkan spesifikasi device.

Project ini dibuat untuk memenuhi tugas Daily Project 7 pada mata kuliah Rekayasa Kebutuhan.

---

## Fitur Utama

### 1. Smart Price Checker

Penjual dapat menentukan harga jual device berdasarkan analisis harga pasar secara otomatis.

### 2. Device Verification

Pembeli dapat memverifikasi keaslian device melalui pengecekan IMEI atau serial number.

### 3. Smart Matching Buyer-Seller

Sistem membantu pembeli menemukan device sesuai kebutuhan berdasarkan preferensi spesifikasi.

### 4. Seller Reputation

Pembeli dapat melihat reputasi penjual berdasarkan review, histori transaksi, dan skor sistem.

### 5. Product Filtering

Pencarian produk berdasarkan RAM, storage, kondisi device, dan spesifikasi lainnya.

### 6. Trade-In System

Pengguna dapat melakukan tukar tambah device lama dengan device baru.

---

## Teknologi yang Digunakan

* Next.js
* React.js
* Tailwind CSS
* JavaScript
* Supabase Auth
* Supabase Postgres
* Supabase Storage
* Vercel (Deployment)
* GitHub (Version Control)

---

## Cara Menjalankan Project

### Install Dependencies

```bash
npm install
```

### Menjalankan Development Server

```bash
npm run dev
```

### Buka Browser

```text
http://localhost:3000
```

### Konfigurasi Supabase

1. Buat project Supabase.
2. Jalankan SQL pada `supabase/schema.sql`.
3. Salin `.env.example` menjadi `.env.local`.
4. Isi kredensial Supabase di `.env.local`.
5. Jalankan seed katalog awal:

```bash
npm run seed:supabase
```

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=device-media
```

Status migrasi backend ada di `BACKEND_MIGRATION.md`.

---

## Struktur Project

```text
src/
├── app/
├── components/
├── lib/
├── services/
├── data/
├── hooks/
├── utils/
└── middleware.js
```

---

## Login

Login sekarang memakai Supabase Auth. Akun dibuat melalui form register pada halaman login.

---

## Link Project

### GitHub Repository

Tambahkan link GitHub kalian di sini

```text
https://github.com/username/smart-device-marketplace
```

### Live Demo Website

Tambahkan link deploy website di sini

```text
https://gadget-trustx.netlify.app/
```

---

## Tabel Pengujian Aplikasi

| No | Aspek Kualitas | Use Case                        | Skenario Pengujian                                           | Hasil yang Diharapkan                                                     | Hasil Aktual                                  | Status |
| -- | -------------- | ------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------- | --------------------------------------------- | ------ |
| 1  | Functionality  | Menentukan Harga Jual Device    | Penjual menginput spesifikasi device                         | Sistem menampilkan rekomendasi harga berdasarkan analisis pasar           | Harga berhasil ditampilkan sesuai spesifikasi | PASS   |
| 2  | Functionality  | Verifikasi Keaslian Device      | Pembeli menginput IMEI / serial number                       | Sistem memvalidasi data dan menampilkan status keaslian                   | Status device berhasil ditampilkan            | PASS   |
| 3  | Functionality  | Mencari Device Sesuai Kebutuhan | Pembeli memilih preferensi device                            | Sistem menampilkan rekomendasi device sesuai kebutuhan                    | Rekomendasi device berhasil muncul            | PASS   |
| 4  | Functionality  | Melihat Reputasi Penjual        | Pembeli membuka profil penjual                               | Sistem menampilkan skor reputasi berdasarkan review dan histori transaksi | Reputasi penjual berhasil tampil              | PASS   |
| 5  | Functionality  | Mencari Produk                  | Pembeli menggunakan filter RAM, storage, dll                 | Sistem menampilkan hasil pencarian yang sesuai                            | Data produk berhasil difilter                 | PASS   |
| 6  | Functionality  | Trade-In Device                 | Pembeli menginput device lama dan melakukan negosiasi        | Sistem memproses trade-in dan transaksi dapat disepakati                  | Trade-in berhasil diproses                    | PASS   |
| 7  | Performance    | Load Marketplace                | Membuka halaman marketplace dengan banyak data produk        | Halaman terbuka kurang dari 3 detik                                       | Halaman terbuka dalam 2.1 detik               | PASS   |
| 8  | Performance    | Device Search Speed             | Pembeli melakukan pencarian produk dengan filter spesifikasi | Hasil pencarian tampil kurang dari 3 detik                                | Hasil pencarian tampil dalam 1.8 detik        | PASS   |
| 9  | Usability      | Navigasi Sistem                 | User mencoba seluruh menu utama                              | User dapat berpindah halaman dengan mudah                                 | Semua menu berjalan normal                    | PASS   |
| 10 | Reliability    | Login dan Session               | User login lalu refresh halaman                              | Session tetap aktif dan data tidak hilang                                 | Session tetap tersimpan                       | PASS   |

---

## Kesimpulan

Berdasarkan hasil pengujian, sistem Smart Device Marketplace (GadgetTrustX) telah memenuhi aspek kualitas utama yang telah dirancang pada Daily Project 6, terutama pada functionality, performance, usability, dan reliability.

Sistem berjalan dengan baik dan siap digunakan untuk demonstrasi serta evaluasi tugas akhir Daily Project 7.
