# Dokumen Rencana Pengujian (Test Plan)
## GadgetTrustX (Smart Device Marketplace)

| Bidang | Detail |
| :--- | :--- |
| **Identifikasi Test Plan** | TP-GADGETTRUSTX-MOD1-202210370311001 |
| **Nama Aplikasi** | GadgetTrustX (Smart Device Marketplace) |
| **Versi** | v1.0 |
| **Peran yang Dipilih untuk Diuji** | Pembeli (Buyer) |
| **Nama Praktikan** | Mahasiswa Praktikan PKPL |
| **NIM** | [NIM Praktikan] |
| **Kelas** | PKPL |
| **Tanggal Dibuat** | 08 Oktober 2026 |
| **Tanggal Terakhir Diperbarui** | 08 Oktober 2026 |
| **Status** | Final |

---

### Riwayat Revisi

| Versi | Tanggal Revisi | Diperbarui Oleh | Deskripsi Perubahan |
| :--- | :--- | :--- | :--- |
| 1.0 | 08 Oktober 2026 | Praktikan PKPL | Draf awal dan finalisasi dokumen Test Plan Modul 1 |

---

### DAFTAR ISI
1. Konteks Pengujian
   1.1 Item Uji
   1.2 Cakupan Pengujian
   1.3 Peran yang Dipilih untuk Diuji
   1.4 Asumsi dan Batasan
2. Daftar Risiko
3. Strategi Pengujian
   3.1 Pendekatan Keseluruhan
   3.2 Arah Pengujian yang Direncanakan
   3.3 Kriteria
4. Lingkungan Pengujian
   4.1 Perangkat dan Perangkat Keras
   4.2 Perangkat Lunak dan Alat
   4.3 Jaringan dan Backend
   4.4 Data Uji
5. Jadwal Pengujian
6. Luaran Pengujian
Lampiran A: Glosarium

---

## 1. Konteks Pengujian

Software Requirements Specification (SRS) merupakan salah satu item persiapan untuk Modul 2. Pada Modul 1, praktikan mengidentifikasi sumber kebutuhan yang tersedia dan mulai menyiapkan SRS secara bertahap. SRS belum harus selesai atau dikumpulkan pada Modul 1; batas waktu penyelesaian dan pengumpulannya mengikuti petunjuk pada materi Modul 2.

### 1.1 Item Uji

| Bidang | Deskripsi |
| :--- | :--- |
| **Nama Aplikasi** | GadgetTrustX (Smart Device Marketplace) |
| **Platform** | Web |
| **Versi** | v1.0 |
| **URL Deployment / Akses** | [https://gadgetrustx.netlify.app/](https://gadgetrustx.netlify.app/) (Produksi) dan http://localhost:3000 (Lokal) |
| **Tumpukan Teknologi** | Next.js 15/16 App Router, React 19, Tailwind CSS v4, Supabase (Auth, PostgreSQL, Storage), Midtrans Escrow, Netlify |
| **Deskripsi Singkat** | GadgetTrustX adalah platform marketplace smart device terpadu berbasis web yang dirancang untuk memfasilitasi transaksi jual-beli gadget bekas dan baru secara aman dan terpercaya, dilengkapi dengan fitur verifikasi keaslian IMEI TAC global, valuasi harga pasar berbasis kecerdasan buatan (Gemini AI), rekomendasi spesifikasi cerdas (Smart Matching), serta sistem checkout dan pembayaran terpadu. |

### 1.2 Cakupan Pengujian

**Fitur dalam Cakupan (In-Scope)**

Cantumkan minimal delapan fitur secara keseluruhan, yaitu Login, Register, Forgot Password, dan lima fitur tambahan. Fitur tambahan boleh berupa subfeature apabila memiliki fungsi dan test scenario yang jelas. Proyek secara keseluruhan memiliki variasi input, proses, behavior, state, dan business rule yang memadai untuk mendukung rangkaian praktikum.

| No. | Nama Fitur | Jenis Fitur | Deskripsi Singkat |
| :-: | :--- | :--- | :--- |
| 1 | **Login** | Fitur Autentikasi | Pembeli terdaftar masuk ke akun menggunakan kredensial email dan kata sandi yang divalidasi via Supabase Auth dengan proteksi Cloudflare Turnstile. |
| 2 | **Register** | Fitur Autentikasi | Pengguna baru membuat akun pembeli dengan menginput nama lengkap, alamat email valid, nomor telepon, dan kata sandi baru. |
| 3 | **Forgot Password** | Fitur Autentikasi | Pembeli meminta tautan pemulihan kata sandi yang dikirimkan ke email terdaftar untuk mengatur ulang password yang lupa. |
| 4 | **Jelajah & Pencarian Produk Marketplace** | Fitur Tambahan | Pembeli mencari katalog gadget aktif menggunakan kata kunci nama perangkat, brand, atau model pada search bar marketplace. |
| 5 | **Filter Multi-Parameter Produk** | Fitur Tambahan | Pembeli memfilter katalog produk berdasarkan kategori, brand, kapasitas RAM, internal storage, kondisi fisik unit, dan batasan rentang harga minimum/maksimum. |
| 6 | **Keranjang Belanja (Shopping Cart)** | Fitur Tambahan | Pembeli menambahkan unit gadget ke keranjang belanja, memperbarui jumlah kuantitas sesuai stok tersedia, dan menghapus item dari keranjang. |
| 7 | **Checkout dan Pembayaran (Midtrans Payment)** | Fitur Tambahan | Pembeli mengisi/memilih alamat tujuan pengiriman, menghitung estimasi ongkir kurir ekspedisi, memilih metode pembayaran (QRIS/Transfer), memproses token Midtrans, dan memverifikasi status pembayaran lunas. |
| 8 | **Verifikasi Keaslian IMEI (TrustX Scanner)** | Fitur Tambahan | Pembeli memasukkan 15 digit nomor IMEI pada modul scanner untuk divalidasi menggunakan algoritma Luhn dan dicocokkan dengan database TAC global serta status legalitas perangkat. |
| 9 | **Smart Price Checker (Valuasi Harga AI)** | Fitur Tambahan | Pembeli memasukkan spesifikasi detail gadget (merek, tipe, kapasitas, kondisi, kelengkapan) untuk mendapatkan estimasi nilai wajar pasar dan rentang harga referensi. |
| 10 | **Smart Matching (Rekomendasi Cerdas)** | Fitur Tambahan | Pembeli memasukkan kriteria kebutuhan performa (gaming, fotografi, baterai awet) dan pagu anggaran (*budget*) untuk mendapatkan rekomendasi gadget terbaik. |
| 11 | **Ulasan dan Penilaian Produk (Review & Rating)** | Fitur Tambahan | Pembeli yang telah menyelesaikan transaksi memberikan rating bintang (1–5) serta ulasan teks pengalaman kualitas unit gadget yang dibeli. |
| 12 | **Pengajuan Retur / Komplain Barang** | Fitur Tambahan | Pembeli mengajukan klaim pengembalian dana/barang saat menerima unit yang cacat atau tidak sesuai deskripsi, menyertakan alasan retur, dan memantau status resolusi komplain. |

**Di Luar Cakupan (Out-of-Scope)**

| No. | Fitur / Aspek | Alasan Pengecualian |
| :-: | :--- | :--- |
| 1 | **Sistem Tukar Tambah (Trade-In)** | Alur fitur tukar tambah perangkat dinonaktifkan dari cakupan uji peran Pembeli pada versi rilis saat ini dan difokuskan pada pembelian langsung. |
| 2 | **Dasbor Penjual (Seller) & Manajemen Stok Listing** | Merupakan alur kerja peran Penjual untuk pendaftaran toko, pengunggahan produk baru, manajemen inventori, dan penginputan nomor resi pengiriman. |
| 3 | **Dasbor Administrator & Approval Tiket Sengketa Retur** | Merupakan kewenangan peran Administrator/Superadmin untuk memoderasi listing, menengahi sengketa, dan persetujuan klaim retur. |
| 4 | **Pemberitahuan Push Real-Time Native Browser** | Belum diimplementasikan secara menyeluruh pada rilis web saat ini. |

### 1.3 Peran yang Dipilih untuk Diuji

| Bidang | Detail |
| :--- | :--- |
| **Nama Peran** | Pembeli (Buyer) |
| **Deskripsi Peran** | Pembeli adalah pengguna akhir yang menjelajahi katalog produk smart device, memeriksa keaslian IMEI melalui pemindai, mengevaluasi valuasi harga pasar, mengelola keranjang, melakukan transaksi checkout dengan pembayaran Midtrans, memberikan ulasan produk, dan mengajukan komplain/retur barang bila diperlukan. |
| **Fitur yang Dapat Diakses** | Login, Register, Forgot Password, Jelajah & Pencarian Produk, Filter Multi-Parameter, Keranjang Belanja, Checkout dan Pembayaran, Verifikasi Keaslian IMEI, Smart Price Checker, Smart Matching, Ulasan/Review Produk, Pengajuan Retur. |
| **Alasan Pemilihan** | Peran Pembeli merepresentasikan alur utama pengguna (*core user journey*) pada platform yang memiliki variasi input teks dan numerik terlengkap (filter multi-parameter, 15 digit IMEI, form alamat, ulasan teks), melibatkan logika perhitungan finansial dan pembayaran, serta memiliki konsentrasi risiko bisnis tertinggi terhadap kepuasan dan kepercayaan pengguna. Pemilihan peran ini tetap konsisten hingga penilaian akhir praktikum. |

### 1.4 Asumsi dan Batasan

| Jenis | Deskripsi |
| :--- | :--- |
| **Asumsi** | Seluruh fitur yang terdaftar (3 autentikasi dan fitur tambahan peran Pembeli) berfungsi dengan baik dan dapat didemonstrasikan pada build yang telah di-deploy secara online di Vercel/Netlify maupun dijalankan di localhost. |
| **Asumsi** | Minimal satu akun uji Pembeli yang valid dan data katalog perangkat pada database Supabase telah tersedia sebelum pengujian dimulai. |
| **Batasan** | Pengujian dibatasi secara ketat hanya pada alur dan antarmuka peran Pembeli; fungsionalitas peran Penjual dan Administrator tidak diuji pada praktikum ini. |
| **Batasan** | Integrasi payment gateway (Midtrans) diuji menggunakan lingkungan sandbox / mock testing untuk mencegah transaksi moneter riil. |

---

## 2. Daftar Risiko

Identifikasi minimal lima risiko yang terkait dengan proyek yang dipilih. Prioritas = Dampak × Kemungkinan, masing-masing menggunakan skala 1 sampai 5, dengan 1 berarti sangat rendah dan 5 berarti sangat tinggi.
Risiko produk adalah potensi cacat pada fitur atau kualitas produk. Risiko proyek adalah masalah pengelolaan, seperti tenggat waktu yang ketat, perubahan kebutuhan, atau keterbatasan sumber daya.

| ID Risiko | Deskripsi Risiko | Jenis | Dampak | Kemungkinan | Prioritas | Strategi Mitigasi |
| :-: | :--- | :---: | :---: | :---: | :---: | :--- |
| **R-01** | Total pembayaran pada Checkout dihitung keliru saat menggabungkan harga unit barang, jumlah kuantitas, dan estimasi ongkos kirim ekspedisi. | Produk | 5 | 3 | **15** | Menempatkan kalkulasi harga, biaya kirim, dan invoice sebagai fokus pengujian berprioritas tertinggi, serta memverifikasi kalkulasi server-side sebelum penerbitan token Midtrans. |
| **R-02** | Validasi format 15 digit IMEI dan algoritma Luhn Check pada TrustX Scanner mengalami kegagalan atau terjadi timeout saat mencocokkan database TAC global. | Produk | 4 | 3 | **12** | Menerapkan boundary value analysis (<15 digit dan >15 digit) serta equivalence partitioning pada input non-numerik, dan memastikan ketersediaan pesan penanganan bila lookup API eksternal lambat. |
| **R-03** | Terbentuknya pesanan ganda (*duplicate order / race condition*) ketika pengguna menekan tombol 'Bayar Sekarang' pada halaman Checkout berulang kali dengan cepat akibat koneksi lambat. | Produk | 4 | 3 | **12** | Menguji pengiriman formulir berulang secara cepat (*rapid submission*), memastikan tombol bayar langsung berstatus *disabled* setelah klik pertama, dan memverifikasi token sesi pembayaran. |
| **R-04** | Form pengajuan retur barang gagal memproses lampiran bukti kendala atau gagal memperbarui status pesanan pada database Supabase. | Produk | 4 | 2 | **8** | Menguji validasi form retur dengan berbagai skenario kelengkapan data dan format gambar, serta memverifikasi integritas perubahan state status pesanan di database. |
| **R-05** | Keterbatasan alokasi waktu dan perangkat praktikan dalam menyusun serta mengeksekusi skenario uji untuk seluruh fitur peran Pembeli secara mendalam. | Proyek | 3 | 3 | **9** | Menerapkan Risk-Based Testing dengan memprioritaskan pengujian pada alur kritis transaksi (Checkout & Pembayaran, Autentikasi) terlebih dahulu sebelum menguji fitur penunjang lainnya. |
| **R-06** | Ketergantungan terhadap koneksi internet laboratorium dan ketersediaan layanan cloud (Supabase Database, Vercel/Netlify hosting) saat sesi demonstrasi. | Proyek | 3 | 2 | **6** | Menyiapkan lingkungan pengujian cadangan berupa local dev server (http://localhost:3000) dengan data seed lengkap di mesin penguji sebagai langkah kontinjensi bila koneksi internet lab terganggu. |

---

## 3. Strategi Pengujian

### 3.1 Pendekatan Keseluruhan

| Bidang | Deskripsi |
| :--- | :--- |
| **Pendekatan Pengujian** | <Belum ditetapkan; dilengkapi pada modul berikutnya> |
| **Tingkat Pengujian** | <Belum ditetapkan; dilengkapi pada modul berikutnya> |
| **Jenis Pengujian Utama** | <Belum ditetapkan; dilengkapi pada modul berikutnya> |
| **Fitur Berprioritas Tinggi** | Checkout dan Pembayaran, Keranjang Belanja, serta Verifikasi Keaslian IMEI via TrustX Scanner (skor prioritas risiko tertinggi pada Bagian 2) |

### 3.2 Arah Pengujian yang Direncanakan

Pada Modul 1, arah dan teknik pengujian belum perlu ditentukan. Bagian ini dilengkapi secara bertahap setelah materi terkait dipelajari pada modul berikutnya. Pertahankan placeholder berikut dan jangan menambahkan nama teknik pada Modul 1.

| Aspek | Status | Catatan |
| :--- | :--- | :--- |
| **Arah dan Teknik Pengujian** | <Belum ditetapkan> | Dilengkapi setelah materi terkait dipelajari pada modul berikutnya. |

### 3.3 Kriteria

| Jenis Kriteria | Deskripsi |
| :--- | :--- |
| **Kriteria Masuk** | Delapan fitur yang terdaftar sudah tersedia pada staging (deploy Netlify atau localhost), dan minimal satu akun uji Pembeli yang valid sudah siap digunakan. |
| **Kriteria Keluar** | Seluruh test case yang direncanakan untuk delapan fitur terdaftar telah dieksekusi dan dicatat, serta tidak ada blocker defect yang belum teridentifikasi. |
| **Kriteria Lolos** | Hasil aktual sesuai dengan hasil yang diharapkan (*expected result*) pada spesifikasi kasus uji. |
| **Kriteria Gagal** | Hasil aktual tidak sesuai dengan hasil yang diharapkan, terdapat kegagalan validasi logika, atau terjadi unhandled error / crash pada aplikasi. |
| **Pengujian Ulang** | Test case yang gagal dieksekusi ulang setelah defect yang dilaporkan berhasil diperbaiki oleh pengembang. |
| **Pengujian Regresi** | Test case kritis (Autentikasi dan Checkout) dieksekusi ulang setelah setiap perbaikan atau modifikasi kode untuk memastikan fungsionalitas lain tidak terganggu. |

---

## 4. Lingkungan Pengujian

### 4.1 Perangkat dan Perangkat Keras

| Item | Detail |
| :--- | :--- |
| **Jenis Perangkat** | Laptop / PC |
| **Processor** | Intel Core i5-1135G7 / AMD Ryzen 5 setara atau lebih tinggi |
| **RAM** | 16 GB (minimal 8 GB) |
| **Sistem Operasi** | Windows 11 Home / Pro 64-bit |

### 4.2 Perangkat Lunak dan Alat

| Alat / Perangkat Lunak | Versi / Detail | Tujuan |
| :--- | :--- | :--- |
| **Browser / Perangkat** | Google Chrome 126+ (Desktop) | Eksekusi pengujian fungsional dan verifikasi antarmuka |
| **Alat Dokumentasi** | Google Docs / Microsoft Word | Penyusunan dokumen Test Plan dan pelaporan SQA |
| **Alat Tangkapan Layar** | Snipping Tool / Lightshot | Pengumpulan bukti pengujian (*evidence*) dan tangkapan layar bug |
| **Version Control & Editor** | Visual Studio Code, Git, GitHub | Akses kode sumber dan peninjauan implementasi logika |

### 4.3 Jaringan dan Backend

| Item | Detail |
| :--- | :--- |
| **Jaringan** | Koneksi Wi-Fi Kampus / Hotspot Seluler stabil (kecepatan ≥ 10 Mbps) |
| **Backend / API** | Next.js Route Handlers, Supabase PostgreSQL, Supabase Auth, Supabase Storage |
| **URL Dasar Pengujian** | [https://gadgetrustx.netlify.app/](https://gadgetrustx.netlify.app/) (Deploy) atau http://localhost:3000 (Lokal) |

### 4.4 Data Uji

Identifikasi jenis data uji secara umum yang dibutuhkan. Kumpulan data uji secara detail akan disiapkan pada modul berikutnya.

| Jenis Data | Deskripsi |
| :--- | :--- |
| **Akun Uji Valid** | buyer.test@gadgettrustx.com, akun Pembeli terdaftar dan terverifikasi dengan riwayat transaksi aktif. |
| **Akun Uji Tidak Valid** | Alamat email yang belum pernah didaftarkan (misal nonexisting@test.com), format email salah (@domain), atau password keliru. |
| **Contoh Data Input** | Nomor 15-digit IMEI valid (TAC iPhone 13 / Samsung Galaxy S21) dan invalid (<15 digit), data gadget trade-in (RAM 8GB, Storage 128GB, kondisi 'Mulus 95%'), serta sampel batasan harga filter (Rp 3.000.000 - Rp 10.000.000). |
| **Data Uji Tambahan** | <Belum ditetapkan; dilengkapi pada modul berikutnya> |

---

## 5. Jadwal Pengujian

Pada Modul 1, isi hanya jadwal dan luaran yang memang ditetapkan untuk Modul 1. Detail Modul 2 sampai Modul 6 dan UAP tetap berupa placeholder sampai modul terkait dibahas dan ditetapkan.

| Modul | Aktivitas Pengujian Utama | Perkiraan Waktu | Luaran Utama |
| :--- | :--- | :--- | :--- |
| **Modul 1** | Perencanaan pengujian, analisis risiko, dan registrasi proyek | Minggu 1-2 | Dokumen Test Plan dan entri registrasi proyek |
| **Modul 2** | <Belum ditetapkan> | <Belum ditetapkan> | <Belum ditetapkan> |
| **Modul 3** | <Belum ditetapkan> | <Belum ditetapkan> | <Belum ditetapkan> |
| **Modul 4** | <Belum ditetapkan> | <Belum ditetapkan> | <Belum ditetapkan> |
| **Modul 5** | <Belum ditetapkan> | <Belum ditetapkan> | <Belum ditetapkan> |
| **Modul 6** | <Belum ditetapkan> | <Belum ditetapkan> | <Belum ditetapkan> |
| **UAP** | <Belum ditetapkan> | <Belum ditetapkan> | <Belum ditetapkan> |

---

## 6. Luaran Pengujian

Pada Modul 1, luaran yang perlu diselesaikan adalah dokumen Test Plan dan entri registrasi proyek. Luaran, format, dan status untuk Modul 2 sampai Modul 6 serta UAP belum ditetapkan pada dokumen ini.

| Modul | Luaran | Format | Status |
| :--- | :--- | :---: | :---: |
| **Modul 1** | Dokumen Test Plan | DOCX / PDF | Sedang Berjalan |
| **Modul 1** | Entri Lembar Registrasi Proyek | Google Sheets | Sedang Berjalan |
| **Modul 2** | <Belum ditetapkan> | <Belum ditetapkan> | <Belum ditetapkan> |
| **Modul 3** | <Belum ditetapkan> | <Belum ditetapkan> | <Belum ditetapkan> |
| **Modul 4** | <Belum ditetapkan> | <Belum ditetapkan> | <Belum ditetapkan> |
| **Modul 5** | <Belum ditetapkan> | <Belum ditetapkan> | <Belum ditetapkan> |
| **Modul 6** | <Belum ditetapkan> | <Belum ditetapkan> | <Belum ditetapkan> |
| **UAP** | <Belum ditetapkan> | <Belum ditetapkan> | <Belum ditetapkan> |

---

## Lampiran A: Glosarium

Istilah kunci yang digunakan dalam dokumen ini, berdasarkan ISO/IEC/IEEE 29119-1:

| Istilah | Definisi |
| :--- | :--- |
| **Item Uji** | Objek yang diuji. Dalam praktikum ini, objek tersebut adalah aplikasi web atau mobile yang dipilih oleh masing-masing praktikan. |
| **Dasar Pengujian** | Sumber diturunkannya sebuah *test condition*, dapat berupa kebutuhan, user story, atau perilaku yang sudah disepakati. |
| **Kondisi Pengujian** | Aspek dari aplikasi yang dapat diuji secara spesifik, dan menjadi dasar penulisan test case. |
| **Kasus Uji** | Input konkret, langkah-langkah, dan hasil yang diharapkan, yang digunakan untuk memeriksa satu test condition. |
| **Lingkungan Pengujian** | Perangkat, software, dan akses yang dibutuhkan untuk benar-benar menjalankan pengujian. |
| **Risk** | Kemungkinan terjadinya suatu masalah, baik pada produk itu sendiri (Risiko Produk) maupun pada proyek di sekitarnya, seperti tenggat waktu yang ketat (Risiko Proyek). |
| **Incident** | Segala sesuatu yang tidak terduga yang ditemukan selama pengujian dan perlu ditelusuri lebih lanjut. |
| **Traceability** | Kemampuan untuk menelusuri hubungan dari sebuah kebutuhan, ke sebuah fitur, hingga ke test case yang memeriksanya. |
| **Dampak** | Seberapa serius akibat yang akan timbul apabila sebuah risiko benar-benar terjadi, dinilai dengan skala 1 sampai 5. |
| **Kemungkinan** | Seberapa besar kemungkinan sebuah risiko benar-benar terjadi, dinilai dengan skala 1 sampai 5. |
| **Prioritas** | Tingkat kepentingan suatu risiko secara keseluruhan, dihitung sebagai Dampak dikalikan Kemungkinan. Digunakan untuk menentukan risiko mana yang perlu ditangani lebih dulu. |
| **Strategi Mitigasi** | Tindakan yang direncanakan untuk mengurangi dampak suatu risiko atau kemungkinan risiko tersebut terjadi. |
| **Kriteria Masuk** | Kondisi yang harus terpenuhi sebelum pengujian dapat dimulai. |
| **Kriteria Keluar** | Kondisi yang menandakan bahwa pengujian telah selesai. |
