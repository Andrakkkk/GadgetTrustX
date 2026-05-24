# Tugas Lanjutan

Dokumen ini adalah handoff untuk AI atau developer berikutnya setelah migrasi utama ke Supabase.

## Kondisi Saat Ini

Backend inti sudah pindah ke Supabase:

- Auth memakai Supabase Auth
- Profil memakai tabel `profiles`
- Device listing memakai tabel `devices`
- Upload media memakai Supabase Storage bucket `device-media`
- Cart memakai tabel `cart_items`
- Order dasar memakai tabel `orders` dan `order_items`
- Review memakai tabel `reviews`
- WTB request memakai tabel `wtb_listings`
- Chat memakai tabel `chats` dan `chat_messages`
- Admin user management memakai Supabase Auth + `profiles`

Produk seed dummy sudah terhubung ke akun seller Supabase sungguhan. Jangan kembalikan lagi ke seller fallback lokal.

## Prioritas Berikutnya

### 1. Selesaikan return order ke Supabase

Status: selesai di kode.

Yang sudah dibuat:

- endpoint buyer `POST /api/orders/returns`
- endpoint admin `PATCH /api/orders/returns`
- mapping `order_items.return_*` ke response order
- buyer profile dan admin page sudah membaca/menulis return lewat backend
- status order ikut diperbarui setelah return diproses

Catatan:

- jalankan SQL schema terbaru di Supabase live bila kolom return belum pernah diterapkan
- tetap lakukan verifikasi end-to-end setelah deploy

### 2. Sinkronkan review dengan status order

Status: selesai di kode.

Yang sudah dibuat:

- kolom `reviews.order_item_id`
- order response mengembalikan `ratedItems`
- review buyer mengirim `orderItemId`
- order otomatis menjadi `Completed` jika semua item sudah rated atau return-nya sudah selesai diproses

Catatan:

- jalankan SQL schema terbaru di Supabase live agar kolom `order_item_id` tersedia
- uji kasus order dengan beberapa item sebelum menganggap flow final

### 3. Rapikan custom offer dari chat

Status: selesai di kode.

Yang sudah dibuat:

- saat seller mengirim catalog offer, backend membuat device offer privat di Supabase
- metadata chat menyimpan `catalog.id` nyata
- tombol beli dari chat menambahkan offer nyata ke cart
- jika nego diterima, harga device offer ikut diperbarui sebelum checkout
- device offer disembunyikan dari katalog publik dan hanya dapat dibaca peserta offer terkait

### 4. Simpan badge seller secara permanen

Status: selesai di kode.

Yang sudah dibuat:

- kolom `profiles.badges`
- toggle admin menyimpan badge melalui API
- badge tampil di card device dan detail product

### 5. Hardening backend untuk produksi

Status: tahap awal selesai.

Yang sudah dibuat:

- device create/update/delete sekarang memverifikasi user dan owner/admin
- upload sekarang wajib session login
- custom offer privat tidak tampil di katalog publik
- policy `devices` dipisah antara katalog umum dan offer privat
- route admin user tetap memverifikasi role `admin`

Yang masih layak diaudit lagi nanti:

- sisa route yang masih memakai `createAdminClient()` untuk operasi baca publik
- penyempurnaan policy RLS lintas tabel bila app nanti mau lebih banyak memakai client Supabase langsung dari browser

### 6. Bereskan build issue lama

Status: selesai di kode.

- file kosong `src/app/icon.js` sudah dihapus agar tidak lagi memblokir build

## File Penting

- `BACKEND_MIGRATION.md`
- `supabase/schema.sql`
- `src/lib/supabase/*`
- `src/app/api/orders/route.js`
- `src/app/api/reviews/route.js`
- `src/app/api/chats/*`
- `src/app/buyer-profile/page.js`
- `src/app/seller-profile/page.js`
- `src/app/admin/page.js`

## Hal yang Sudah Diperbaiki Belakangan

- login Supabase yang sempat diam karena callback auth
- detail produk `Product Not Found` akibat `params` route dinamis belum di-`await`
- review image tidak tersimpan karena route review belum menyimpan `image`
- chat produk dummy gagal karena produk seed belum punya `seller_id`
- chat sekarang menampilkan status online dan `terakhir online`
- custom offer chat sekarang bisa benar-benar dibeli
- badge seller admin sekarang permanen

## Verifikasi yang Disarankan Setelah Perubahan Berikutnya

1. buyer checkout produk
2. buyer submit review dengan foto
3. buyer submit return dengan bukti foto
4. admin approve/reject return dan refresh halaman
5. seller melihat status return dan review masuk
6. seller kirim custom offer dari chat
7. buyer checkout hasil offer
8. jalankan `next build`
