# Dokumen Spesifikasi Kebutuhan Perangkat Lunak (Software Requirements Specification - SRS)
## GadgetTrustX (Smart Device Marketplace)
**Standar Acuan: ISO/IEC/IEEE 29148:2018 / IEEE 830**

| Atribut Proyek | Keterangan Spesifikasi |
| :--- | :--- |
| **Identifikasi Dokumen** | `SRS-GADGETTRUSTX-MOD2-202310370311421` |
| **Nama Aplikasi** | GadgetTrustX (Smart Device Marketplace) |
| **Versi Dokumen** | v1.0 (Persiapan Modul 2) |
| **Fokus Peran Pengujian** | Pembeli (Buyer) |
| **Nama Praktikan** | Leandra Chelsea Geovani Karyono |
| **NIM** | 202310370311421 |
| **Kelas Praktikum** | PKPL -B |
| **Tanggal Terbit** | 09 Oktober 2026 |
| **Status** | Final untuk Modul 2 |
| **Dokumen Acuan Terkait** | `TP-GADGETTRUSTX-MOD1-202310370311421` (Test Plan Modul 1) |

---

### Riwayat Revisi Dokumen

| Versi | Tanggal | Penyusun | Deskripsi Perubahan |
| :---: | :---: | :---: | :--- |
| 1.0 | 09 Oktober 2026 | Leandra Chelsea Geovani Karyono | Penyusunan awal spesifikasi kebutuhan lengkap (12 Fitur In-Scope) untuk persiapan Modul 2 |

---

## DAFTAR ISI
1. Pendahuluan
   1.1 Tujuan Dokumen
   1.2 Lingkup Produk
   1.3 Definisi, Akronim, dan Singkatan
   1.4 Dokumen Referensi
   1.5 Gambaran Umum Dokumen
2. Deskripsi Keseluruhan
   2.1 Perspektif Produk
   2.2 Fungsi Produk Utama
   2.3 Karakteristik Pengguna
   2.4 Batasan-Batasan Sistem
   2.5 Asumsi dan Ketergantungan
3. Kebutuhan Antarmuka Eksternal
   3.1 Antarmuka Pengguna (User Interface)
   3.2 Antarmuka Perangkat Lunak (Software Interface)
   3.3 Antarmuka Komunikasi (Communication Interface)
4. Kebutuhan Fungsional (Functional Requirements)
   4.1 REQ-F-01: Autentikasi Pengguna (Login)
   4.2 REQ-F-02: Registrasi Akun Pembeli (Register)
   4.3 REQ-F-03: Pemulihan Kata Sandi (Forgot Password)
   4.4 REQ-F-04: Jelajah Katalog & Pencarian Produk
   4.5 REQ-F-05: Filter Multi-Parameter Produk
   4.6 REQ-F-06: Keranjang Belanja (Shopping Cart)
   4.7 REQ-F-07: Checkout dan Pembayaran Terpadu (Midtrans)
   4.8 REQ-F-08: Verifikasi Keaslian IMEI (TrustX Scanner)
   4.9 REQ-F-09: Smart Price Checker (Valuasi Harga Pasar AI)
   4.10 REQ-F-10: Smart Matching Rekomendasi Cerdas
   4.11 REQ-F-11: Ulasan dan Penilaian Produk (Review & Rating)
   4.12 REQ-F-12: Pengajuan Retur & Komplain Kerusakan Barang
5. Kebutuhan Non-Fungsional (Non-Functional Requirements)
   5.1 Kinerja dan Efisiensi (Performance)
   5.2 Keamanan dan Integritas Data (Security)
   5.3 Keandalan dan Ketersediaan (Reliability & Availability)
   5.4 Kemudahan Penggunaan (Usability)
   5.5 Portabilitas dan Kompatibilitas Browser
6. Matriks Ketertelusuran Kebutuhan (Requirements Traceability Matrix - RTM)
Lampiran A: Glosarium Istilah SQA & Standar IEEE

---

## 1. Pendahuluan

### 1.1 Tujuan Dokumen
Dokumen Spesifikasi Kebutuhan Perangkat Lunak (Software Requirements Specification - SRS) ini disusun sebagai dasar formal spesifikasi kebutuhan fungsional dan non-fungsional untuk platform **GadgetTrustX (Smart Device Marketplace)**. Dokumen ini menjadi acuan utama (*Test Basis*) untuk pelaksanaan praktikum Pengujian Kualitas Perangkat Lunak (PKPL) pada Modul 2 dan modul-modul berikutnya, khususnya dalam merancang kasus uji (*Test Case*), matriks penelusuran (*Traceability Matrix*), dan evaluasi kesesuaian sistem.

### 1.2 Lingkup Produk
GadgetTrustX adalah platform marketplace perangkat pintar (*smart device*) terintegrasi berbasis web yang dirancang untuk memfasilitasi transaksi jual-beli gadget baru dan bekas secara aman, transparan, dan terpercaya. Sistem dilengkapi fitur verifikasi keaslian IMEI melalui database TAC global, valuasi estimasi harga wajar pasar berbasis Gemini AI, rekomendasi spesifikasi cerdas (Smart Matching), serta sistem transaksi aman menggunakan escrow pembayaran Midtrans Payment Gateway.

### 1.3 Definisi, Akronim, dan Singkatan
| Istilah / Akronim | Definisi Operasional |
| :--- | :--- |
| **SRS** | Software Requirements Specification berdasarkan standar ISO/IEC/IEEE 29148:2018. |
| **IMEI** | International Mobile Equipment Identity; nomor unik 15 digit pengenal perangkat seluler global. |
| **TAC** | Type Allocation Code; 8 digit pertama nomor IMEI yang mengidentifikasi pabrikan dan model perangkat. |
| **Algoritma Luhn** | Formula checksum modulus 10 yang digunakan untuk memvalidasi keabsahan susunan angka IMEI. |
| **Midtrans** | Penyedia gerbang pembayaran (*payment gateway*) resmi untuk transaksi QRIS, transfer bank, dan e-wallet. |
| **Supabase** | BaaS sumber terbuka berbasis PostgreSQL yang mengelola database, autentikasi, dan media storage. |
| **RTM** | Requirements Traceability Matrix; tabel pelacak keterhubungan antara kebutuhan SRS, risiko, dan test case. |

### 1.4 Dokumen Referensi
1. ISO/IEC/IEEE 29148:2018 - Systems and software engineering — Life cycle processes — Requirements engineering.
2. ISO/IEC/IEEE 29119:2022 - Software and systems engineering — Software testing (Part 1, 2, 3).
3. Dokumen Rencana Pengujian Modul 1 (Test Plan): `TP-GADGETTRUSTX-MOD1-202310370311421`.

### 1.5 Gambaran Umum Dokumen
Dokumen ini terbagi menjadi 6 bab utama:
- Bab 2 memaparkan deskripsi umum sistem dan karakteristik peran Pembeli.
- Bab 3 menjelaskan antarmuka eksternal (UI, Software, Communication).
- Bab 4 mendefinisikan 12 kebutuhan fungsional secara rinci (REQ-F-01 s/d REQ-F-12).
- Bab 5 menjabarkan kebutuhan non-fungsional (performa, keamanan, keandalan, ergonomi).
- Bab 6 menyajikan Matriks Ketertelusuran Kebutuhan (RTM).

---

## 2. Deskripsi Keseluruhan

### 2.1 Perspektif Produk
GadgetTrustX merupakan aplikasi web modern mandiri (*self-contained web application*) yang dibangun menggunakan arsitektur Next.js 16 App Router, React 19, dan Tailwind CSS v4 di sisi frontend, berkomunikasi langsung dengan Supabase PostgreSQL dan Supabase Auth via Secure Route Handlers, serta terhubung dengan layanan pihak ketiga (Midtrans Payment Gateway dan Gemini AI Engine).

### 2.2 Fungsi Produk Utama
- Pengelolaan akun dan kredensial aman (Login, Register, Forgot Password).
- Eksplorasi katalog gadget cerdas dengan pencarian teks bebas dan filter multi-parameter (RAM, Storage hingga 2TB, rentang harga, kondisi).
- Validasi keaslian perangkat (TrustX Scanner IMEI berbasis TAC & Luhn).
- Asistensi pemilihan gadget berbasis AI (Smart Price Checker & Smart Matching).
- Siklus transaksi belanja aman (Keranjang Belanja, Kalkulasi Ongkir Otomatis, Checkout Escrow Midtrans).
- Perlindungan pasca-pembelian (Ulasan/Rating Produk dan Formulir Pengajuan Retur Komplain Barang).

### 2.3 Karakteristik Pengguna
Fokus pengujian praktikum ini ditujukan secara eksklusif pada peran **Pembeli (Buyer)**. Pembeli adalah konsumen akhir yang memiliki keterampilan digital tingkat menengah, berinteraksi melalui browser desktop atau mobile untuk mencari, mengecek keaslian, membeli gadget, dan mengelola tiket komplain pesanan.

### 2.4 Batasan-Batasan Sistem
1. Pengujian dibatasi khusus pada antarmuka dan interaksi peran Pembeli; fitur manajemen stok toko oleh Penjual (Seller) dan dasbor operasional Administrator berada di luar cakupan.
2. Transaksi finansial pada pembayaran checkout diuji menggunakan lingkungan Midtrans Sandbox untuk menghindari mutasi uang riil.
3. Estimasi valuasi harga pada Smart Price Checker bersumber dari model AI Gemini dan berfungsi sebagai referensi pasar dinamis.

### 2.5 Asumsi dan Ketergantungan
- Pengguna memiliki koneksi internet stabil saat mengakses web.
- Basis data Supabase menyediakan dataset produk aktif sebelum pengujian berlangsung.
- Layanan pihak ketiga (Midtrans Sandbox dan Supabase Auth) beroperasi dalam kondisi normal.

---

## 3. Kebutuhan Antarmuka Eksternal

### 3.1 Antarmuka Pengguna (User Interface)
Antarmuka pengguna dirancang responsif (desktop, tablet, mobile), mengusung tema modern dengan dukungan peralihan Dark Mode dan Light Mode. Setiap komponen input dilengkapi validasi interaktif, batasan karakter, serta pesan kesalahan yang jelas.

### 3.2 Antarmuka Perangkat Lunak (Software Interface)
- **Database Server:** PostgreSQL via Supabase SDK (Client-Server REST/RPC).
- **Payment Gateway:** Midtrans Snap API (Sandbox Environment) untuk pembuatan token transaksi pembayaran.
- **AI Valuation Engine:** Google Gemini API untuk analisis harga pasar gadget.

### 3.3 Antarmuka Komunikasi (Communication Interface)
Seluruh pertukaran data antara browser klien dan server menggunakan protokol aman HTTPS (TLS 1.3) dan REST API dengan format payload JSON.

---

## 4. Kebutuhan Fungsional (Functional Requirements)

### REQ-F-01: Autentikasi Pengguna (Login)
| Komponen Spesifikasi | Keterangan Rinci |
| :--- | :--- |
| **ID Kebutuhan** | REQ-F-01 |
| **Nama Kebutuhan** | Autentikasi Pengguna (Login) |
| **Deskripsi** | Sistem memungkinkan pembeli terdaftar untuk masuk ke dalam aplikasi menggunakan alamat email dan kata sandi yang valid. |
| **Aktor Utama** | Pembeli (Buyer) |
| **Pre-Kondisi** | Akun pembeli telah terdaftar sebelumnya di database Supabase Auth. |
| **Alur Utama (Main Flow)** | 1. Pembeli membuka halaman /login.<br>2. Pembeli memasukkan email dan password.<br>3. Pembeli menekan tombol 'Masuk'.<br>4. Sistem memverifikasi kredensial via Supabase Auth.<br>5. Kredensial valid, token sesi disimpan, pembeli dialihkan ke halaman utama/dashboard. |
| **Alur Alternatif / Eksepsi** | • Jika email belum terdaftar atau password salah, sistem menampilkan notifikasi kesalahan: 'Kredensial tidak valid'.<br>• Jika format email salah, form menampilkan validasi instan. |
| **Post-Kondisi** | Sesi pengguna aktif, status login tersimpan di state global dan localStorage. |
| **Aturan Bisnis (Business Rules)** | Password minimal 6 karakter. Proteksi brute-force aktif via Supabase rate-limiting. |
| **Ketertelusuran (Traceability)** | Mendukung Fitur No. 1 pada Test Plan. Mitigasi proteksi autentikasi dasar. |

### REQ-F-02: Registrasi Akun Pembeli (Register)
| Komponen Spesifikasi | Keterangan Rinci |
| :--- | :--- |
| **ID Kebutuhan** | REQ-F-02 |
| **Nama Kebutuhan** | Registrasi Akun Pembeli (Register) |
| **Deskripsi** | Sistem memungkinkan pengguna baru untuk membuat akun pembeli dengan mengisikan nama lengkap, alamat email valid, nomor telepon, dan kata sandi baru. |
| **Aktor Utama** | Pengguna Baru / Pembeli |
| **Pre-Kondisi** | Pengguna belum memiliki akun dengan email yang sama di sistem. |
| **Alur Utama (Main Flow)** | 1. Pengguna membuka halaman /register.<br>2. Pengguna mengisi nama, email, no HP, dan password.<br>3. Pengguna menekan tombol 'Daftar Sekarang'.<br>4. Sistem memvalidasi kelengkapan data dan keunikan email.<br>5. Sistem membuat entri akun baru di Supabase Auth dan profil pengguna.<br>6. Pengguna otomatis diarahkan ke halaman login atau beranda. |
| **Alur Alternatif / Eksepsi** | • Jika email sudah pernah terdaftar, sistem menampilkan pesan error: 'Email sudah digunakan'.<br>• Jika konfirmasi password tidak cocok, form memblokir pengiriman. |
| **Post-Kondisi** | Akun pembeli baru berhasil tercatat di database dan dapat digunakan untuk login. |
| **Aturan Bisnis (Business Rules)** | Role pengguna otomatis ditetapkan sebagai 'buyer'. Batas input teks nama maksimal 100 karakter. |
| **Ketertelusuran (Traceability)** | Mendukung Fitur No. 2 pada Test Plan. |

### REQ-F-03: Pemulihan Kata Sandi (Forgot Password)
| Komponen Spesifikasi | Keterangan Rinci |
| :--- | :--- |
| **ID Kebutuhan** | REQ-F-03 |
| **Nama Kebutuhan** | Pemulihan Kata Sandi (Forgot Password) |
| **Deskripsi** | Sistem menyediakan alur permintaan tautan reset password yang dikirimkan ke alamat email terdaftar. |
| **Aktor Utama** | Pembeli (Buyer) |
| **Pre-Kondisi** | Akun pembeli telah terdaftar di sistem. |
| **Alur Utama (Main Flow)** | 1. Pembeli mengakses tautan 'Lupa Password' di /login.<br>2. Pembeli memasukkan alamat email terdaftar pada form /reset-password.<br>3. Pembeli menekan tombol 'Kirim Tautan Pemulihan'.<br>4. Sistem mengirimkan email berisi tautan token reset password via Supabase Auth.<br>5. Sistem menampilkan notifikasi sukses pengiriman. |
| **Alur Alternatif / Eksepsi** | • Jika format email tidak valid, sistem menampilkan peringatan format.<br>• Jika email tidak ditemukan, sistem menampilkan pesan netral demi alasan keamanan privasi. |
| **Post-Kondisi** | Tautan pemulihan terkirim ke inbox email pengguna dengan masa berlaku 1 jam. |
| **Aturan Bisnis (Business Rules)** | Tautan hanya dapat digunakan satu kali (one-time token). |
| **Ketertelusuran (Traceability)** | Mendukung Fitur No. 3 pada Test Plan. |

### REQ-F-04: Jelajah Katalog & Pencarian Produk
| Komponen Spesifikasi | Keterangan Rinci |
| :--- | :--- |
| **ID Kebutuhan** | REQ-F-04 |
| **Nama Kebutuhan** | Jelajah Katalog & Pencarian Produk |
| **Deskripsi** | Sistem menyediakan katalog gadget aktif dengan fungsi pencarian kata kunci berdasarkan nama produk, model, atau merek. |
| **Aktor Utama** | Pembeli (Buyer) |
| **Pre-Kondisi** | Tersedia data listing produk gadget aktif pada database. |
| **Alur Utama (Main Flow)** | 1. Pembeli membuka halaman /marketplace.<br>2. Pembeli mengetik kata kunci pada search bar (misal 'iPhone' atau 'Samsung').<br>3. Sistem memfilter daftar produk secara real-time berdasarkan kecocokan nama, brand, atau deskripsi.<br>4. Sistem menampilkan kartu produk yang sesuai beserta harga, spesifikasi, dan rating. |
| **Alur Alternatif / Eksepsi** | • Jika kata kunci tidak cocok dengan produk apa pun, sistem menampilkan tampilan 'Tidak ada produk ditemukan' disertai tombol reset. |
| **Post-Kondisi** | Daftar produk yang ditampilkan sesuai dengan kata kunci pencarian. |
| **Aturan Bisnis (Business Rules)** | Panjang input kata kunci dibatasi maksimal 100 karakter untuk mencegah injection. |
| **Ketertelusuran (Traceability)** | Mendukung Fitur No. 4 pada Test Plan. |

### REQ-F-05: Filter Multi-Parameter Produk
| Komponen Spesifikasi | Keterangan Rinci |
| :--- | :--- |
| **ID Kebutuhan** | REQ-F-05 |
| **Nama Kebutuhan** | Filter Multi-Parameter Produk |
| **Deskripsi** | Sistem menyediakan fitur penyaringan katalog berdasarkan banyak kriteria sekaligus: Brand, RAM, Internal Storage (hingga opsi 2TB), kondisi, dan rentang harga. |
| **Aktor Utama** | Pembeli (Buyer) |
| **Pre-Kondisi** | Pembeli berada di halaman katalog /marketplace. |
| **Alur Utama (Main Flow)** | 1. Pembeli membuka panel filter (accordion collapsible).<br>2. Pembeli memilih opsi Brand, RAM (misal 8GB), Storage (misal 256GB / 2TB), dan mengisi batas harga min/max.<br>3. Sistem memperbarui query filter dan menyajikan produk yang memenuhi semua kriteria. |
| **Alur Alternatif / Eksepsi** | • Pembeli dapat mereset salah satu filter dengan mengklik badge tag aktif (✕), atau mereset seluruh filter sekaligus melalui tombol 'Reset Semua'. |
| **Post-Kondisi** | Katalog produk menampilkan unit gadget yang memenuhi kriteria gabungan. |
| **Aturan Bisnis (Business Rules)** | Batas input harga minimum dan maksimum hanya menerima angka positif hingga Rp 100.000.000. |
| **Ketertelusuran (Traceability)** | Mendukung Fitur No. 5 pada Test Plan. Menguji Risiko R-04 (kombinasi filter). |

### REQ-F-06: Keranjang Belanja (Shopping Cart)
| Komponen Spesifikasi | Keterangan Rinci |
| :--- | :--- |
| **ID Kebutuhan** | REQ-F-06 |
| **Nama Kebutuhan** | Keranjang Belanja (Shopping Cart) |
| **Deskripsi** | Sistem memungkinkan pembeli menyimpan unit gadget ke keranjang, memperbarui jumlah kuantitas sesuai stok barang, dan menghapus item dari keranjang. |
| **Aktor Utama** | Pembeli (Buyer) |
| **Pre-Kondisi** | Pembeli sudah login dan memilih produk dengan status stok tersedia. |
| **Alur Utama (Main Flow)** | 1. Pembeli menekan tombol 'Tambah ke Keranjang' pada kartu produk / halaman detail.<br>2. Animasi fly-to-cart berjalan dan badge keranjang bertambah.<br>3. Pembeli membuka halaman /cart untuk mengubah kuantitas atau menghapus item.<br>4. Sistem menghitung subtotal belanja secara otomatis. |
| **Alur Alternatif / Eksepsi** | • Jika pembeli menambah kuantitas melebihi stok yang ada, sistem membatasi penambahan dan menampilkan notifikasi batas stok.<br>• Akun peran Penjual diblokir untuk menambah produk miliknya sendiri ke keranjang. |
| **Post-Kondisi** | Data keranjang belanja tersimpan di database pengguna dan siap diteruskan ke checkout. |
| **Aturan Bisnis (Business Rules)** | Kuantitas minimal 1 unit, kuantitas maksimal dibatasi oleh sisa stok penjual. |
| **Ketertelusuran (Traceability)** | Mendukung Fitur No. 6 pada Test Plan. |

### REQ-F-07: Checkout dan Pembayaran Terpadu (Midtrans Payment)
| Komponen Spesifikasi | Keterangan Rinci |
| :--- | :--- |
| **ID Kebutuhan** | REQ-F-07 |
| **Nama Kebutuhan** | Checkout dan Pembayaran Terpadu (Midtrans Payment) |
| **Deskripsi** | Sistem memfasilitasi transaksi checkout, pemilihan alamat tujuan, estimasi ongkir ekspedisi, dan penerbitan token dialog pembayaran Midtrans Snap untuk pembeli. |
| **Aktor Utama** | Pembeli (Buyer) |
| **Pre-Kondisi** | Keranjang belanja memiliki minimal 1 produk dan stok unit masih tersedia. |
| **Alur Utama (Main Flow)** | 1. Pembeli menekan tombol 'Checkout' dari halaman /cart.<br>2. Pembeli memilih alamat kirim dan opsi kurir ekspedisi di /checkout.<br>3. Sistem menghitung total tagihan = subtotal barang + ongkos kirim.<br>4. Pembeli menekan 'Bayar Sekarang' $\rightarrow$ popup Midtrans Snap muncul.<br>5. Pembeli memilih metode (QRIS/Transfer VA) pada simulator sandbox dan menyelesaikan pembayaran.<br>6. Dialog pembayaran Midtrans Snap menampilkan konfirmasi transaksi dan detail invoice belanja pembeli. |
| **Alur Alternatif / Eksepsi** | • Jika dialog pembayaran ditutup oleh pembeli, sistem kembali ke antarmuka checkout secara aman tanpa menghapus produk terpilih.<br>• Jika stok habis saat proses checkout berlangsung, sistem membatalkan transaksi secara aman. |
| **Post-Kondisi** | Transaksi pembayaran berhasil diverifikasi dan faktur belanja diterbitkan untuk pembeli. |
| **Aturan Bisnis (Business Rules)** | Kalkulasi total harga dihitung ulang dan diverifikasi pada server-side sebelum menerbitkan snap token. |
| **Ketertelusuran (Traceability)** | Mendukung Fitur No. 7 pada Test Plan. Mitigasi Risiko Kritis R-07 (Skor 15). |

### REQ-F-08: Verifikasi Keaslian IMEI (TrustX Scanner)
| Komponen Spesifikasi | Keterangan Rinci |
| :--- | :--- |
| **ID Kebutuhan** | REQ-F-08 |
| **Nama Kebutuhan** | Verifikasi Keaslian IMEI (TrustX Scanner) |
| **Deskripsi** | Sistem menyediakan modul pemindai IMEI untuk memvalidasi nomor seri 15 digit menggunakan algoritma Luhn dan mencocokkannya dengan database TAC resmi. |
| **Aktor Utama** | Pembeli (Buyer) |
| **Pre-Kondisi** | Pembeli mengakses halaman /scanner. |
| **Alur Utama (Main Flow)** | 1. Pembeli memasukkan 15 digit nomor IMEI perangkat.<br>2. Pembeli menekan tombol 'Periksa Keaslian IMEI'.<br>3. Sistem memvalidasi checksum menggunakan algoritma Luhn.<br>4. Sistem mencocokkan 8 digit pertama (TAC) dengan database referensi global.<br>5. Sistem menampilkan hasil audit: Nama Model, Merek Resmi, Status Legalitas, dan Rekomendasi Keamanan. |
| **Alur Alternatif / Eksepsi** | • Jika input kurang atau lebih dari 15 digit, sistem menampilkan pesan: 'Nomor IMEI harus tepat 15 digit angka'.<br>• Jika input mengandung huruf/simbol, sistem menolak input secara otomatis. |
| **Post-Kondisi** | Hasil verifikasi ditampilkan secara transparan di layar pembeli. |
| **Aturan Bisnis (Business Rules)** | Input hanya menerima format numerik persis 15 digit. Checksum digit ke-15 harus valid modulo 10. |
| **Ketertelusuran (Traceability)** | Mendukung Fitur No. 8 pada Test Plan. Mitigasi Risiko R-01 (Skor 12). |

### REQ-F-09: Smart Price Checker (Valuasi Harga Pasar AI)
| Komponen Spesifikasi | Keterangan Rinci |
| :--- | :--- |
| **ID Kebutuhan** | REQ-F-09 |
| **Nama Kebutuhan** | Smart Price Checker (Valuasi Harga Pasar AI) |
| **Deskripsi** | Sistem menyediakan kalkulator valuasi harga berbasis AI Gemini untuk memperkirakan nilai wajar pasar gadget berdasarkan spesifikasi, kondisi, dan kelengkapan. |
| **Aktor Utama** | Pembeli (Buyer) |
| **Pre-Kondisi** | Pembeli mengakses halaman /price-checker. |
| **Alur Utama (Main Flow)** | 1. Pembeli memilih merek, tipe gadget, kapasitas RAM & Storage, serta kondisi fisik (Mulus, Normal, Minus).<br>2. Pembeli menekan tombol 'Cek Estimasi Harga AI'.<br>3. Sistem memanggil Gemini AI API untuk menganalisis parameter.<br>4. Sistem menyajikan hasil valuasi: Rentang Harga Pasar Wajar (Min - Max), Rekomendasi Harga Beli, dan Analisis Depresiasi. |
| **Alur Alternatif / Eksepsi** | • Jika layanan AI mengalami latency/timeout, sistem beralih ke tabel referensi harga cadangan lokal (fallback database). |
| **Post-Kondisi** | Rekomendasi estimasi harga tampil secara lengkap di antarmuka pengguna. |
| **Aturan Bisnis (Business Rules)** | Kapasitas memori dan kondisi fisik divalidasi dengan batas nilai wajar sebelum diproses. |
| **Ketertelusuran (Traceability)** | Mendukung Fitur No. 9 pada Test Plan. Mitigasi Risiko R-05 (Skor 8). |

### REQ-F-10: Smart Matching (Rekomendasi Cerdas Berbasis Kebutuhan)
| Komponen Spesifikasi | Keterangan Rinci |
| :--- | :--- |
| **ID Kebutuhan** | REQ-F-10 |
| **Nama Kebutuhan** | Smart Matching (Rekomendasi Cerdas Berbasis Kebutuhan) |
| **Deskripsi** | Sistem menyediakan wizard bertahap bagi pembeli untuk mendapatkan rekomendasi gadget terbaik berdasarkan pagu anggaran (budget) dan prioritas penggunaan. |
| **Aktor Utama** | Pembeli (Buyer) |
| **Pre-Kondisi** | Pembeli mengakses halaman /smart-matching. |
| **Alur Utama (Main Flow)** | 1. Langkah 1: Pembeli menentukan rentang budget melalui slider interaktif.<br>2. Langkah 2: Pembeli memilih prioritas utama (Gaming Performa, Fotografi Kamera, atau Baterai Tahan Lama).<br>3. Langkah 3: Pembeli memilih preferensi ekosistem/merek.<br>4. Sistem memproses algoritma pencocokan skor spesifikasi.<br>5. Sistem menyajikan 3 rekomendasi gadget paling ideal lengkap dengan skor kecocokan. |
| **Alur Alternatif / Eksepsi** | • Pembeli dapat mengubah slider atau melompat kembali ke langkah sebelumnya melalui stepper navigasi. |
| **Post-Kondisi** | Daftar gadget rekomendasi ditampilkan dengan tautan langsung ke detail produk. |
| **Aturan Bisnis (Business Rules)** | Slider budget dibatasi antara Rp 1.000.000 hingga Rp 30.000.000. |
| **Ketertelusuran (Traceability)** | Mendukung Fitur No. 10 pada Test Plan. |

### REQ-F-11: Ulasan dan Penilaian Produk (Review & Rating)
| Komponen Spesifikasi | Keterangan Rinci |
| :--- | :--- |
| **ID Kebutuhan** | REQ-F-11 |
| **Nama Kebutuhan** | Ulasan dan Penilaian Produk (Review & Rating) |
| **Deskripsi** | Sistem memungkinkan pembeli yang telah menyelesaikan transaksi untuk memberikan penilaian bintang (1-5), ulasan pengalaman, dan mengunggah foto produk. |
| **Aktor Utama** | Pembeli (Buyer) |
| **Pre-Kondisi** | Pembeli memiliki pesanan dengan status 'Completed' / 'Paid' pada /buyer-profile. |
| **Alur Utama (Main Flow)** | 1. Pembeli membuka tab Riwayat Pesanan di profil pembeli.<br>2. Pembeli menekan tombol 'Beri Ulasan' pada produk terkait.<br>3. Modal ulasan terbuka: pembeli memilih rating 1–5 bintang, menulis teks ulasan, dan mengunggah foto produk.<br>4. Pembeli menekan tombol 'Kirim Ulasan'.<br>5. Sistem menyimpan ulasan dan memperbarui rating rata-rata produk. |
| **Alur Alternatif / Eksepsi** | • Jika rating bintang belum dipilih (0 bintang), tombol kirim terkunci (disabled).<br>• Jika produk sudah pernah diulas, tombol ulasan otomatis berganti menjadi 'Sudah Diulas'. |
| **Post-Kondisi** | Ulasan tercatat di database dan tampil pada halaman detail produk publik. |
| **Aturan Bisnis (Business Rules)** | Teks ulasan maksimal 500 karakter. Format foto terbatas pada JPG, PNG, WEBP dengan batas ukuran 3MB. |
| **Ketertelusuran (Traceability)** | Mendukung Fitur No. 11 pada Test Plan. Mitigasi Risiko R-03 (Skor 12). |

### REQ-F-12: Pengajuan Retur & Komplain Kerusakan Barang
| Komponen Spesifikasi | Keterangan Rinci |
| :--- | :--- |
| **ID Kebutuhan** | REQ-F-12 |
| **Nama Kebutuhan** | Pengajuan Retur & Komplain Kerusakan Barang |
| **Deskripsi** | Sistem menyediakan formulir klaim retur/komplain bagi pembeli untuk melaporkan produk cacat, menyertakan alasan kerusakan, dan melampirkan foto bukti fisik. |
| **Aktor Utama** | Pembeli (Buyer) |
| **Pre-Kondisi** | Pembeli menerima barang yang bermasalah dan masa garansi komplain masih aktif. |
| **Alur Utama (Main Flow)** | 1. Pembeli membuka riwayat transaksi di /buyer-profile.<br>2. Pembeli menekan tombol 'Ajukan Retur / Komplain'.<br>3. Pembeli memilih kategori kendala (Cacat Fisik, Fungsi Rusak, IMEI Tidak Cocok, Barang Tidak Sesuai).<br>4. Pembeli mengisi deskripsi detail kerusakan dan mengunggah foto bukti fisik cacat.<br>5. Pembeli menekan 'Kirim Pengajuan'.<br>6. Sistem menerbitkan nomor tiket komplain dan mencatat riwayat pengajuan klaim pembeli. |
| **Alur Alternatif / Eksepsi** | • Jika berkas foto melebihi 5MB atau berformat selain gambar, sistem menolak unggahan dan menampilkan peringatan error yang jelas.<br>• Pengajuan retur dibatasi hanya pada form input pembeli; alur approval dan transfer refund berada di sisi Seller/Admin (Out-of-Scope). |
| **Post-Kondisi** | Tiket retur tersimpan di database dan pembeli dapat memantau status komplainnya. |
| **Aturan Bisnis (Business Rules)** | Deskripsi kerusakan minimal 20 karakter dan maksimal 500 karakter. Wajib melampirkan minimal 1 foto bukti fisik. |
| **Ketertelusuran (Traceability)** | Mendukung Fitur No. 12 pada Test Plan. Mitigasi Risiko R-02 (Skor 12). |

---

## 5. Kebutuhan Non-Fungsional (Non-Functional Requirements)

| ID Kebutuhan | Kategori Kebutuhan | Spesifikasi Tolok Ukur |
| :--- | :--- | :--- |
| **REQ-NF-01** | Kinerja (Performance) | Waktu muat halaman (Page Load Time) di bawah 2 detik pada koneksi internet standar (10 Mbps). Waktu respons API Route Handlers maksimal 800 ms. |
| **REQ-NF-02** | Keamanan (Security) | Kredensial login dilindungi hashing enkripsi bcrypt via Supabase Auth. Form publik dilindungi Cloudflare Turnstile CAPTCHA. Transaksi finansial dilindungi escrow token Midtrans Snap. |
| **REQ-NF-03** | Keandalan (Reliability) | Sistem mampu menangani kegagalan API eksternal (fallback offline database saat Gemini AI timeout). Ketersediaan sistem (Availability) minimal 99% pada platform deployment. |
| **REQ-NF-04** | Kemudahan Penggunaan (Usability) | Antarmuka mendukung Dark Mode dan Light Mode yang nyaman di mata. Desain antarmuka mematuhi prinsip kontras warna WCAG AA, navigasi ramah mobile (responsive drawer), dan input counter informatif. |
| **REQ-NF-05** | Kompatibilitas (Compatibility) | Aplikasi dapat diakses dan berfungsi optimal pada peramban web modern: Google Chrome (Desktop & Android), Mozilla Firefox, Microsoft Edge, dan Apple Safari. |
| **REQ-NF-06** | Integritas Data (Data Integrity) | Pencatatan transaksi checkout bersifat idempotent (mencegah double-order saat tombol ditekan berulang kali) dan menerapkan integritas referensial foreign-key di PostgreSQL. |

---

## 6. Matriks Ketertelusuran Kebutuhan (Requirements Traceability Matrix - RTM)

| ID SRS | Nama Fitur | Ref Test Plan | Risiko Terkait | Teknik Rencana Uji | Status Kesiapan |
| :---: | :--- | :---: | :---: | :--- | :---: |
| **REQ-F-01** | Autentikasi Login | Fitur 1 (Auth) | R-06 (Waktu/Proyek) | Black-Box (EP & BVA) | Siap Diuji |
| **REQ-F-02** | Registrasi Akun | Fitur 2 (Auth) | R-06 (Waktu/Proyek) | Black-Box (EP & BVA) | Siap Diuji |
| **REQ-F-03** | Forgot Password | Fitur 3 (Auth) | R-06 (Waktu/Proyek) | State Transition Test | Siap Diuji |
| **REQ-F-04** | Pencarian Katalog | Fitur 4 (Marketplace) | R-04 (Pencarian/Filter) | Equivalence Partitioning | Siap Diuji |
| **REQ-F-05** | Filter Multi-Parameter | Fitur 5 (Filter) | R-04 (Filter Query) | Decision Table Testing | Siap Diuji |
| **REQ-F-06** | Keranjang Belanja | Fitur 6 (Cart) | R-07 (Subtotal Hitung) | BVA & Boundary Test | Siap Diuji |
| **REQ-F-07** | Checkout & Midtrans | Fitur 7 (Payment) | R-07 (Skor 15 - Kritis) | End-to-End Workflow Test | Prioritas Utama |
| **REQ-F-08** | TrustX Scanner IMEI | Fitur 8 (Scanner) | R-01 (Skor 12 - Format) | BVA & Luhn Checksum Test | Prioritas Utama |
| **REQ-F-09** | Smart Price Checker | Fitur 9 (AI Valuasi) | R-05 (Skor 8 - Estimasi) | Combinatorial Testing | Siap Diuji |
| **REQ-F-10** | Smart Matching | Fitur 10 (Matching) | R-05 (Rekomendasi) | Equivalence Partitioning | Siap Diuji |
| **REQ-F-11** | Ulasan Produk | Fitur 11 (Review) | R-03 (Skor 12 - Ganda) | Boundary & State Test | Prioritas Utama |
| **REQ-F-12** | Pengajuan Retur | Fitur 12 (Retur) | R-02 (Skor 12 - Foto) | Negative & File Upload Test | Prioritas Utama |

---

## Lampiran A: Glosarium Istilah SQA & Standar IEEE

| Istilah Kunci | Penjelasan Standar ISO/IEC/IEEE |
| :--- | :--- |
| **Requirement (Kebutuhan)** | Kondisi atau kemampuan yang harus dipenuhi atau dimiliki oleh sistem untuk memuaskan kontrak, standar, atau kebutuhan pemangku kepentingan. |
| **Functional Requirement** | Kebutuhan yang menspesifikasikan fungsi atau aksi yang harus mampu dieksekusi oleh sistem (apa yang dilakukan sistem). |
| **Non-Functional Requirement** | Kebutuhan yang menspesifikasikan kriteria kualitas, batasan, atau atribut performa sistem (seberapa baik sistem melakukannya). |
| **Test Basis** | Seluruh dokumen atau sumber pengetahuan yang menjadi dasar dalam menurunkan kondisi uji dan kasus uji. |
| **Traceability Matrix** | Tabel yang menghubungkan kebutuhan bisnis ke kebutuhan perangkat lunak dan ke kasus uji untuk memastikan tidak ada kebutuhan yang terlewat. |
| **Equivalence Partitioning (EP)** | Teknik pengujian black-box yang membagi domain input ke dalam kelas-kelas data ekuivalen yang diasumsikan diproses secara sama. |
| **Boundary Value Analysis (BVA)** | Teknik pengujian black-box yang menguji nilai pada batas ekstrem (tepat di batas, tepat di bawah, dan tepat di atas batas partisi). |
