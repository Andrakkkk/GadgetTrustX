# LAPORAN LAB SESSION MODUL 2
**Mata Kuliah:** Penjaminan Mutu & Pengujian Perangkat Lunak (PKPL-B)  
**Topik:** *Test Design Specification (TDS) & Test Traceability Matrix (TTM)*  
**Standar Acuan:** ISO/IEC/IEEE 29119-3:2013 (Test Documentation)  
**Aplikasi Teruji (SUT):** GadgetTrustX Platform (Role: Pembeli / Buyer)  
**Praktikan:** Leandra Chelsea Geovani Karyono | **NIM:** 202310370311421  

---

### 1. Software Requirements (Kebutuhan Perangkat Lunak Teruji)

Kebutuhan fungsional sistem berikut diambil dari Dokumen Spesifikasi Kebutuhan Perangkat Lunak (SRS) GadgetTrustX yang telah disesuaikan khusus untuk fungsionalitas pengguna pembeli (*Buyer*):

* **REQ-F-01: Autentikasi Pengguna (Login)**  
  Sistem harus menyediakan mekanisme autentikasi akun pembeli melalui input email dan kata sandi yang divalidasi ke database Supabase Auth, dilengkapi proteksi brute-force Cloudflare Turnstile CAPTCHA.
* **REQ-F-02: Registrasi Akun Pembeli**  
  Sistem harus memfasilitasi pembuatan akun pembeli baru dengan validasi format email unik, kata sandi minimal 6 karakter, dan pemberian role default 'buyer'.
* **REQ-F-03: Pemulihan Kata Sandi (Forgot Password)**  
  Sistem harus menyediakan alur reset kata sandi melalui input email terdaftar untuk mengirimkan tautan token pemulihan kredensial pembeli.
* **REQ-F-04: Jelajah Katalog & Pencarian Produk**  
  Sistem harus menyediakan fitur pencarian katalog perangkat gadget secara real-time berdasarkan kata kunci nama produk, model, atau merek, serta menampilkan pesan informatif saat produk tidak ditemukan.
* **REQ-F-05: Filter Multi-Parameter Produk**  
  Sistem harus memungkinkan pembeli menyaring katalog gadget berdasarkan kombinasi multi-kriteria (Brand, kapasitas RAM, internal storage hingga 2TB, rentang harga, dan kondisi baru/bekas) serta menyediakan tombol reset semua filter.
* **REQ-F-06: Keranjang Belanja (Shopping Cart)**  
  Sistem harus memfasilitasi pembeli untuk menambahkan produk gadget ke keranjang belanja, memperbarui jumlah kuantitas tanpa melebihi batas sisa stok inventori toko, dan menghapus item dari keranjang belanja.
* **REQ-F-07: Checkout dan Pembayaran Terpadu (Midtrans Payment)**  
  Sistem harus menghitung subtotal belanja dan estimasi ongkos kirim ekspedisi secara akurat pada checkout pesanan, serta menerbitkan token transaksi pembayaran Midtrans Snap untuk menampilkan dialog pembayaran bagi pembeli.
* **REQ-F-08: Verifikasi Keaslian IMEI (TrustX Scanner)**  
  Sistem harus memverifikasi keaslian perangkat seluler melalui input 15-digit nomor IMEI yang divalidasi menggunakan algoritma Luhn checksum dan dicocokkan dengan database TAC (Type Allocation Code) resmi global.
* **REQ-F-09: Smart Price Checker (Valuasi Harga Pasar AI)**  
  Sistem harus menyajikan estimasi nilai wajar pasar dan analisis depresiasi harga gadget berdasarkan spesifikasi dan kondisi fisik menggunakan model Google Gemini AI (dengan dukungan fallback database lokal).
* **REQ-F-10: Smart Matching Rekomendasi Cerdas**  
  Sistem harus menyediakan wizard rekomendasi bertahap berbasis batas pagu anggaran (budget slider) dan prioritas penggunaan (gaming, fotografi, baterai) untuk menyajikan top-3 rekomendasi gadget paling relevan.
* **REQ-F-11: Penjualan Gadget Bekas oleh Pengguna (C2C Sell & Trade-In Hub)**  
  Sistem harus memungkinkan pengguna/pembeli menginput spesifikasi HP lama, memperoleh valuasi instan AI, mengunggah foto fisik unit (maksimal 5MB per file), dan menerbitkan listing penjualan gadget bekas ke marketplace.

---

### 2. Feature Sets (Kumpulan Fitur Pengujian)

Sesuai standar ISO/IEC/IEEE 29119-2, seluruh kebutuhan di atas dikelompokkan ke dalam **8 Feature Sets** sebagai unit manajemen pengujian terpadu:

* **FS-01 – User Authentication Management**  
  * Objective: Mengelola registrasi akun pembeli, autentikasi sesi login yang aman, dan prosedur pemulihan kata sandi.  
  * Priority: **High**  
  * Traceability: REQ-F-01, REQ-F-02, REQ-F-03  

* **FS-02 – Catalog Exploration & Discovery**  
  * Objective: Menyediakan kapabilitas pencarian kata kunci real-time dan penyaringan multi-parameter spesifikasi produk.  
  * Priority: **High**  
  * Traceability: REQ-F-04, REQ-F-05  

* **FS-03 – Shopping Cart Management**  
  * Objective: Menangani penambahan barang ke keranjang, manipulasi kuantitas item sesuai stok, dan kalkulasi subtotal.  
  * Priority: **High**  
  * Traceability: REQ-F-06  

* **FS-04 – Order Checkout & Payment Escrow**  
  * Objective: Memvalidasi pemilihan kurir ekspedisi, kalkulasi ongkos kirim, dan integrasi modal pembayaran Midtrans Snap pada sisi pembeli.  
  * Priority: **High**  
  * Traceability: REQ-F-07  

* **FS-05 – Device Authenticity Verification (Scanner)**  
  * Objective: Memverifikasi integritas nomor IMEI 15 digit melalui algoritma Luhn dan pencocokan TAC database global.  
  * Priority: **High**  
  * Traceability: REQ-F-08  

* **FS-06 – AI Market Price Valuation**  
  * Objective: Menghasilkan taksiran harga pasar wajar dan depresiasi gadget berbasis pemrosesan Gemini AI.  
  * Priority: **High**  
  * Traceability: REQ-F-09  

* **FS-07 – Smart Recommendation System**  
  * Objective: Menghasilkan rekomendasi cerdas perangkat gadget berdasarkan filter budget dan preferensi kebutuhan.  
  * Priority: **Medium**  
  * Traceability: REQ-F-10  

* **FS-08 – C2C Preloved Selling & Trade-In Hub**  
  * Objective: Memfasilitasi penjualan gadget bekas mandiri oleh pembeli dengan valuasi AI dan unggah foto fisik.  
  * Priority: **High**  
  * Traceability: REQ-F-11  

---

### 3. Test Conditions (Tabel Kondisi Pengujian)

| ID | Feature Set | Description (Kondisi Pengujian) | Priority | Traceability |
| :---: | :---: | :--- | :---: | :---: |
| **TCond-001** | FS-01 | Login berhasil menggunakan email dan password valid terdaftar | High | REQ-F-01 |
| **TCond-002** | FS-01 | Login ditolak saat menginputkan password salah atau email belum terdaftar | High | REQ-F-01 |
| **TCond-003** | FS-01 | Registrasi akun baru berhasil dengan data lengkap dan email unik | High | REQ-F-02 |
| **TCond-004** | FS-01 | Registrasi akun ditolak saat mendaftar dengan email yang sudah ada di database | High | REQ-F-02 |
| **TCond-005** | FS-01 | Permintaan reset password berhasil mengirim tautan token ke email pembeli | Medium | REQ-F-03 |
| **TCond-006** | FS-01 | Permintaan reset password menampilkan error saat format email tidak valid | Medium | REQ-F-03 |
| **TCond-007** | FS-02 | Pencarian katalog menampilkan kartu produk yang sesuai dengan kata kunci | High | REQ-F-04 |
| **TCond-008** | FS-02 | Pencarian katalog menampilkan pesan kosong saat kata kunci tidak ditemukan | Medium | REQ-F-04 |
| **TCond-009** | FS-02 | Filter katalog menyaring produk secara tepat berdasarkan kombinasi RAM, Storage, dan Harga | High | REQ-F-05 |
| **TCond-010** | FS-02 | Katalog mengembalikan seluruh produk saat tombol 'Reset Semua' filter ditekan | Low | REQ-F-05 |
| **TCond-011** | FS-03 | Menambahkan produk ke keranjang berhasil dan menaikkan kuantitas badge cart | High | REQ-F-06 |
| **TCond-012** | FS-03 | Penambahan kuantitas produk dibatasi dan ditolak saat melebihi sisa stok toko | High | REQ-F-06 |
| **TCond-013** | FS-03 | Menghapus item dari keranjang belanja berhasil dan mengupdate subtotal | Medium | REQ-F-06 |
| **TCond-014** | FS-04 | Checkout menghitung total bayar secara presisi (subtotal barang + ongkir kurir) | High | REQ-F-07 |
| **TCond-015** | FS-04 | Pembuatan token transaksi Midtrans Snap berhasil dan memunculkan popup pembayaran | High | REQ-F-07 |
| **TCond-016** | FS-05 | Scanner memverifikasi keaslian dan detail model untuk 15-digit IMEI valid | High | REQ-F-08 |
| **TCond-017** | FS-05 | Scanner menolak input IMEI dengan panjang tidak pas 15 digit (<15 atau >15 digit) | High | REQ-F-08 |
| **TCond-018** | FS-05 | Scanner menolak input IMEI yang mengandung karakter non-angka (huruf/simbol) | High | REQ-F-08 |
| **TCond-019** | FS-06 | Smart Price Checker menyajikan valuasi harga wajar pasar berbasis model Gemini AI | High | REQ-F-09 |
| **TCond-020** | FS-06 | Price Checker beralih ke tabel harga cadangan lokal saat API AI mengalami timeout | Medium | REQ-F-09 |
| **TCond-021** | FS-07 | Smart Matching wizard menyajikan rekomendasi top-3 gadget sesuai preferensi budget | High | REQ-F-10 |
| **TCond-022** | FS-07 | Slider budget Smart Matching dibatasi pada rentang valid (Rp 1jt s/d Rp 30jt) | Medium | REQ-F-10 |
| **TCond-023** | FS-08 | Pengguna berhasil menginput spesifikasi HP bekas, valuasi AI, dan menerbitkan listing | High | REQ-F-11 |
| **TCond-024** | FS-08 | Form jual HP bekas menolak file foto non-gambar atau ukuran file melebihi batas 5MB | Medium | REQ-F-11 |

---

### 4. Coverage Items (Tabel Item Cakupan Pengujian)

| ID | Description (Objek Cakupan Pengujian) | Related Test Condition | Priority | Traceability |
| :---: | :--- | :---: | :---: | :---: |
| **CI-001** | Form Login (Input email, password, tombol submit) | TCond-001, TCond-002 | High | REQ-F-01 |
| **CI-002** | Notifikasi validasi kredensial login Supabase Auth | TCond-002 | High | REQ-F-01 |
| **CI-003** | Form Registrasi (Nama, email, password min 6 char) | TCond-003 | High | REQ-F-02 |
| **CI-004** | Validasi keunikan alamat email terdaftar | TCond-004 | High | REQ-F-02 |
| **CI-005** | Form pemulihan kata sandi (Forgot password dialog) | TCond-005, TCond-006 | Medium | REQ-F-03 |
| **CI-006** | Search bar pencarian katalog produk marketplace | TCond-007, TCond-008 | High | REQ-F-04 |
| **CI-007** | Placeholder 'Tidak ada produk ditemukan' pada search | TCond-008 | Medium | REQ-F-04 |
| **CI-008** | Panel filter multi-parameter (RAM, Storage, Harga) | TCond-009 | High | REQ-F-05 |
| **CI-009** | Tombol dan fungsi 'Reset Semua' filter katalog | TCond-010 | Low | REQ-F-05 |
| **CI-010** | Tombol penambahan unit barang ke keranjang belanja | TCond-011 | High | REQ-F-06 |
| **CI-011** | Validasi batas stok inventori produk pada keranjang | TCond-012 | High | REQ-F-06 |
| **CI-012** | Tombol hapus item dan kalkulasi subtotal keranjang | TCond-013 | Medium | REQ-F-06 |
| **CI-013** | Kalkulasi total tagihan invoice checkout dan ongkir | TCond-014 | High | REQ-F-07 |
| **CI-014** | Integrasi pembuatan Snap Token API Midtrans | TCond-015 | High | REQ-F-07 |
| **CI-015** | Input field 15-digit nomor IMEI TrustX Scanner | TCond-016, TCond-017 | High | REQ-F-08 |
| **CI-016** | Validasi checksum Luhn dan pencocokan database TAC | TCond-016, TCond-018 | High | REQ-F-08 |
| **CI-017** | Form kalkulator spesifikasi gadget Smart Price Checker | TCond-019 | High | REQ-F-09 |
| **CI-018** | Mekanisme fail-safe fallback database harga lokal | TCond-020 | Medium | REQ-F-09 |
| **CI-019** | Wizard bertahap dan slider budget Smart Matching | TCond-021, TCond-022 | High | REQ-F-10 |
| **CI-020** | Form input spesifikasi dan kondisi jual HP bekas | TCond-023 | High | REQ-F-11 |
| **CI-021** | Validasi upload file gambar fisik gadget (MIME & 5MB) | TCond-024 | Medium | REQ-F-11 |

---

### 5. Test Traceability Matrix (TTM)

| Requirement | Feature Set | Test Condition | Coverage Item |
| :---: | :---: | :---: | :--- |
| **REQ-F-01** | FS-01 | TCond-001 | CI-001 |
| **REQ-F-01** | FS-01 | TCond-002 | CI-001, CI-002 |
| **REQ-F-02** | FS-01 | TCond-003 | CI-003 |
| **REQ-F-02** | FS-01 | TCond-004 | CI-004 |
| **REQ-F-03** | FS-01 | TCond-005 | CI-005 |
| **REQ-F-03** | FS-01 | TCond-006 | CI-005 |
| **REQ-F-04** | FS-02 | TCond-007 | CI-006 |
| **REQ-F-04** | FS-02 | TCond-008 | CI-007 |
| **REQ-F-05** | FS-02 | TCond-009 | CI-008 |
| **REQ-F-05** | FS-02 | TCond-010 | CI-009 |
| **REQ-F-06** | FS-03 | TCond-011 | CI-010 |
| **REQ-F-06** | FS-03 | TCond-012 | CI-011 |
| **REQ-F-06** | FS-03 | TCond-013 | CI-012 |
| **REQ-F-07** | FS-04 | TCond-014 | CI-013 |
| **REQ-F-07** | FS-04 | TCond-015 | CI-014 |
| **REQ-F-08** | FS-05 | TCond-016 | CI-015, CI-016 |
| **REQ-F-08** | FS-05 | TCond-017 | CI-015 |
| **REQ-F-08** | FS-05 | TCond-018 | CI-015, CI-016 |
| **REQ-F-09** | FS-06 | TCond-019 | CI-017 |
| **REQ-F-09** | FS-06 | TCond-020 | CI-018 |
| **REQ-F-10** | FS-07 | TCond-021 | CI-019 |
| **REQ-F-10** | FS-07 | TCond-022 | CI-019 |
| **REQ-F-11** | FS-08 | TCond-023 | CI-020 |
| **REQ-F-11** | FS-08 | TCond-024 | CI-021 |

---

### 6. Test Design Technique Summary (Ringkasan Teknik Desain Uji)

| Test Condition ID | Test Design Technique | Rationale (Alasan Pemilihan Teknik) |
| :---: | :---: | :--- |
| **TCond-001, 002** | *Equivalence Partitioning* | Mempartisi input kredensial ke dalam kelas valid (terdaftar) dan invalid (salah password). |
| **TCond-003, 004** | *Equivalence Partitioning* | Mempartisi data registrasi berdasarkan keunikan email (email baru vs email duplikat). |
| **TCond-005, 006** | *Equivalence Partitioning* | Mempartisi format email pada permintaan reset password (format valid RFC vs invalid). |
| **TCond-007, 008** | *Equivalence Partitioning* | Menguji respons pencarian saat query cocok dengan item vs saat query tidak cocok (empty). |
| **TCond-009, 010** | *Combinatorial / Decision Table* | Menguji kombinasi penyaringan multi-parameter RAM, ROM, dan rentang harga. |
| **TCond-011, 012** | *Boundary Value Analysis* | Menguji nilai batas maksimum kuantitas keranjang belanja terhadap sisa stok inventori. |
| **TCond-013** | *Equivalence Partitioning* | Menguji pembaruan subtotal keranjang belanja saat item dihapus. |
| **TCond-014, 015** | *Equivalence Partitioning* | Menguji kalkulasi finansial invoice pembayaran dan pembuatan token Snap Midtrans. |
| **TCond-016, 017, 018** | *Boundary Value Analysis & Luhn* | Menguji batas digit nomor IMEI (14, 15, 16 digit) dan validitas algoritma checksum modulo 10. |
| **TCond-019, 020** | *Equivalence Partitioning & Fallback* | Menguji keakuratan estimasi harga model Gemini AI dan mekanisme fail-safe fallback lokal. |
| **TCond-021, 022** | *Boundary Value Analysis* | Menguji nilai batas minimum (Rp 1.000.000) dan maksimum (Rp 30.000.000) pada slider budget. |
| **TCond-023, 024** | *Equivalence Partitioning & BVA* | Menguji proses penerbitan listing bekas dan batas ukuran file foto kondisi fisik (<= 5MB). |
