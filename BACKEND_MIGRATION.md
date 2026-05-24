# Backend Migration Status

## Sudah dipindahkan ke Supabase

- Auth utama melalui Supabase Auth
- Profil user melalui tabel `profiles`
- Device listing melalui tabel `devices`
- Upload gambar melalui Supabase Storage bucket `device-media`
- Cart melalui tabel `cart_items`
- Orders dasar melalui tabel `orders` dan `order_items`
- Reviews melalui tabel `reviews`
- Foto review tersimpan ke Supabase Storage dan URL-nya tersimpan di `reviews.image`
- Relasi review ke order sudah memakai kolom `reviews.order_id`
- Relasi review ke item order sudah memakai kolom `reviews.order_item_id`
- Return order buyer/admin sudah tersambung ke Supabase lewat `order_items.return_*`
- WTB listing melalui tabel `wtb_listings`
- Chat dan message melalui tabel `chats` dan `chat_messages`
- Admin user management melalui Supabase Auth + tabel `profiles`
- Badge seller permanen melalui `profiles.badges`
- Presence chat melalui `profiles.last_seen_at`
- Custom offer chat kini membuat device offer nyata di Supabase dan bisa dibeli buyer yang dituju
- Seed katalog awal melalui `scripts/seed-supabase-devices.mjs`
- API server untuk device:
  - `GET /api/devices`
  - `POST /api/devices`
  - `GET /api/devices/:id`
  - `PATCH /api/devices/:id`
  - `DELETE /api/devices/:id`

## Masih perlu tahap lanjutan

- Flow return order sudah pindah ke backend; tetap perlu uji end-to-end di project Supabase live setelah migration SQL terbaru dijalankan
- Auto-complete order berdasarkan item yang sudah dirating/return resolved sudah aktif, tetapi tetap perlu uji edge case multi-item
- Custom offer chat sudah menjadi device offer privat (`devices.is_custom_offer`) yang bisa dibeli buyer tujuan
- Badge seller admin sudah tersimpan permanen di `profiles.badges`
- Smart matching, trade-in catalog, trade-in publish, dan admin product management sudah membaca/menulis device lewat API Supabase
- Hardening awal sudah dilakukan:
  - create/update/delete device sekarang auth-aware
  - upload sekarang wajib session login
  - offer device privat dibatasi untuk buyer tujuan dan seller terkait

## Catatan Handoff

- Rincian pekerjaan lanjutan ada di `TUGAS_LANJUTAN.md`
- Produk seed dummy sekarang sudah terhubung ke akun seller Supabase sungguhan; jangan hapus `seller_id` saat seed ulang

## Langkah setup

1. Buat project Supabase.
2. Jalankan isi `supabase/schema.sql` di SQL Editor.
3. Salin `.env.example` menjadi `.env.local`.
4. Isi:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET`
5. Jalankan `node scripts/seed-supabase-devices.mjs` untuk memasukkan katalog awal.
6. Restart dev server.

## Catatan penting

- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di route server. Jangan pernah expose ke browser.
- Saat ini route device memakai server client agar migrasi cepat berjalan. Setelah seluruh flow auth selesai, bisa diperketat lagi dengan session-aware server client dan policy yang lebih ketat.
- `devices` custom offer sekarang disembunyikan dari katalog publik dan hanya bisa dibaca peserta offer terkait.
- Data dummy lama bisa dimigrasikan dengan script seed di atas.
