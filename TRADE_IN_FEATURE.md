# TRADE_IN_FEATURE.md

Dokumentasi fitur **Trade-In (Tukar Tambah)** dan rebranding **HP Bekas** pada platform GadgetTrustX.

---

## Daftar Isi

1. [Gambaran Umum](#gambaran-umum)
2. [Rebranding: HP Bekas Hub](#rebranding-hp-bekas-hub)
3. [Fitur Trade-In (Tukar Tambah)](#fitur-trade-in-tukar-tambah)
4. [Database Schema](#database-schema)
5. [API Routes](#api-routes)
6. [Alur Penggunaan](#alur-penggunaan)
7. [Status Trade-In](#status-trade-in)
8. [Setup & Migrasi Database](#setup--migrasi-database)

---

## Gambaran Umum

GadgetTrustX kini memiliki dua fitur terpisah yang sebelumnya tercampur:

| Fitur | Deskripsi | Halaman |
|-------|-----------|---------|
| **HP Bekas Hub** | Marketplace jual-beli perangkat bekas antar pengguna (C2C) | `/trade-in` |
| **Tukar Tambah** | Buyer menukar HP lama saat beli HP baru → dapat potongan harga | Di halaman produk |

---

## Rebranding: HP Bekas Hub

Fitur jual-beli perangkat bekas **tidak berubah secara fungsional**. Hanya label UI yang diperbarui agar tidak membingungkan dengan fitur Trade-In (Tukar Tambah) yang baru.

### File yang Diubah

| File | Perubahan |
|------|-----------|
| `src/components/Navbar.jsx` | Nav link: `Trade-In` → `HP Bekas` |
| `src/app/trade-in/page.js` | Judul: `TRADE-IN HUB` → `HP BEKAS HUB` |
| `src/app/buyer-profile/page.js` | Tab: `Trade-Ins` → `HP Bekas Saya` |
| `src/app/page.js` | Feature card: `Trade-In Praktis` → `Jual HP Bekas` |
| `src/app/price-checker/page.js` | CTA: `Jual via Trade-In` → `Jual di HP Bekas` |

---

## Fitur Trade-In (Tukar Tambah)

### Konsep

Buyer yang ingin membeli HP baru dapat menukarkan HP lama mereka untuk mendapatkan potongan harga. Nilai tukar dihitung oleh **Gemini AI** secara instan berdasarkan kondisi, spesifikasi, dan deskripsi perangkat lama.

```
Buyer mau beli iPhone 16 Pro (Rp 22.000.000)
        ↓
Klik "🔄 Tukar Tambah" di halaman produk
        ↓
Isi detail perangkat lama (model, kondisi, foto)
        ↓
Gemini AI hitung nilai tukar → Rp 8.500.000
        ↓
┌────────────────────────────────────────┐
│ iPhone 16 Pro          Rp 22.000.000  │
│ Tukar Tambah: iPhone 14 -Rp 8.500.000 │
│ ────────────────────────────────────── │
│ Bayar                  Rp 13.500.000  │
└────────────────────────────────────────┘
        ↓
Checkout → Bayar Rp 13.500.000 via Midtrans
        ↓
Seller verifikasi & Approve/Reject
        ↓
Buyer kirim HP lama + Seller kirim HP baru
```

### Komponen yang Ditambahkan

#### 1. Halaman Produk (`src/app/product/[id]/page.js`)
- Tombol **"🔄 Beli dengan Tukar Tambah — Hemat Jutaan!"** tampil khusus untuk buyer pada produk baru (bukan produk bekas).
- Modal trade-in 4 langkah:
  - **Step 1** — Form input detail HP lama (merek, model, kondisi, storage, RAM, battery health, aksesoris, foto, deskripsi)
  - **Step 2** — Gemini AI memproses dan menampilkan estimasi nilai tukar
  - **Step 3** — Ringkasan harga: harga baru − nilai tukar = total bayar
  - **Step 4** — Konfirmasi → lanjut ke checkout

> **Catatan:** Tombol Tukar Tambah TIDAK muncul untuk:
> - Pengguna dengan role `seller`
> - Produk bekas (`isTradeIn = true`)

#### 2. Halaman Checkout (`src/app/checkout/page.js`)
- Menampilkan baris potongan harga tukar tambah berwarna hijau di ringkasan pembayaran:
  ```
  Subtotal (1 item)                    Rp 22.000.000
  Tukar Tambah: iPhone 14 Pro         -Rp  8.500.000   ← BARU
  Ongkir (JNE - REG)                   Rp     18.000
  ─────────────────────────────────────────────────────
  Total                                Rp 13.518.000
  ```
- Trade-in discount otomatis dikirim ke Midtrans Snap dan disimpan ke tabel `orders`.

#### 3. Dashboard Seller (`src/app/seller-profile/page.js`)
- Tab baru **"Tukar Tambah"** di sidebar (dengan badge counter request pending).
- Setiap request menampilkan: info HP lama buyer, kondisi, spesifikasi, estimasi AI, status.
- Aksi yang tersedia:
  - **Setujui** — konfirmasi nilai tukar & buyer diarahkan kirim HP lama
  - **Tolak** — dengan input alasan
  - **Konfirmasi Terima** — setelah buyer kirim HP lama dan resi terverifikasi

#### 4. Dashboard Buyer (`src/app/buyer-profile/page.js`)
- Section **"Pengajuan Tukar Tambah Saya"** di tab HP Bekas.
- Buyer bisa memantau status request secara real-time.
- Tombol **"Input Resi Kirim Perangkat Lama"** muncul ketika seller sudah menyetujui request.

---

## Database Schema

### Tabel Baru: `trade_in_requests`

```sql
create table if not exists public.trade_in_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  device_id text references public.devices(id) on delete set null,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid references public.profiles(id) on delete set null,

  -- Detail perangkat lama buyer
  old_device_name text not null,
  old_device_brand text,
  old_device_condition text not null,
  old_device_storage text,
  old_device_ram text,
  old_device_battery_health integer,
  old_device_accessories text,
  old_device_description text,
  old_device_images text[] not null default '{}',

  -- Valuasi
  ai_estimated_value integer not null default 0,
  final_trade_in_value integer not null default 0,

  -- Status workflow
  status text not null default 'pending',
  rejection_reason text,

  -- Tracking pengiriman HP lama dari buyer ke seller
  old_device_waybill text,
  old_device_courier text,
  old_device_received boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Kolom Baru di Tabel `orders`

```sql
alter table public.orders
  add column if not exists trade_in_id uuid references public.trade_in_requests(id) on delete set null,
  add column if not exists trade_in_discount integer not null default 0;
```

### Row Level Security (RLS)

```sql
-- Buyer & seller bisa baca request mereka
create policy "trade_in_participants_read" on public.trade_in_requests
  for select using (buyer_id = auth.uid() or seller_id = auth.uid());

-- Hanya buyer yang bisa membuat request
create policy "buyers_create_trade_in" on public.trade_in_requests
  for insert with check (buyer_id = auth.uid());

-- Buyer & seller bisa update
create policy "participants_update_trade_in" on public.trade_in_requests
  for update using (buyer_id = auth.uid() or seller_id = auth.uid());
```

---

## API Routes

### `GET /api/trade-in`
Mengambil daftar trade-in request milik user (sebagai buyer atau seller).

**Response:**
```json
{
  "tradeIns": [
    {
      "id": "uuid",
      "status": "pending",
      "old_device_name": "iPhone 14 Pro",
      "ai_estimated_value": 8500000,
      "device": { "name": "iPhone 16 Pro", "price": 22000000 },
      "buyer": { "name": "...", "email": "..." },
      "seller": { "name": "...", "store_name": "..." }
    }
  ]
}
```

---

### `POST /api/trade-in`
Membuat trade-in request baru dari halaman produk.

**Request Body:**
```json
{
  "deviceId": "dev_123",
  "oldDeviceName": "iPhone 14 Pro",
  "oldDeviceBrand": "Apple",
  "oldDeviceCondition": "Good",
  "oldDeviceStorage": "256GB",
  "oldDeviceRam": "6GB",
  "oldDeviceBatteryHealth": 87,
  "oldDeviceAccessories": "Box, Charger",
  "oldDeviceDescription": "Layar mulus, body lecet kecil di pojok",
  "oldDeviceImages": ["url1", "url2"],
  "aiEstimatedValue": 8500000
}
```

**Response:**
```json
{
  "tradeIn": { "id": "uuid", "status": "pending", ... }
}
```

---

### `GET /api/trade-in/[id]`
Mengambil detail satu trade-in request.

---

### `PATCH /api/trade-in/[id]`
Memperbarui status trade-in. Action yang tersedia:

| `action` | Dilakukan oleh | Keterangan |
|----------|---------------|------------|
| `approve` | Seller | Menyetujui request dengan nilai final |
| `reject` | Seller | Menolak request dengan alasan |
| `ship_old_device` | Buyer | Input resi pengiriman HP lama |
| `confirm_received` | Seller | Konfirmasi HP lama sudah diterima |

**Contoh body (seller approve):**
```json
{
  "action": "approve",
  "finalValue": 8500000
}
```

**Contoh body (buyer kirim resi):**
```json
{
  "action": "ship_old_device",
  "waybill": "JNE1234567890",
  "courier": "JNE Express"
}
```

---

## Alur Penggunaan

### Sisi Buyer
1. Buka halaman produk baru → klik **"🔄 Beli dengan Tukar Tambah"**
2. Isi form detail HP lama → tunggu estimasi AI
3. Review ringkasan harga → konfirmasi → lanjut checkout
4. Bayar selisih harga via Midtrans
5. Tunggu persetujuan seller di halaman **Buyer Profile → HP Bekas Saya**
6. Jika disetujui → klik **"Input Resi Kirim Perangkat Lama"** → kirim HP lama ke alamat seller

### Sisi Seller
1. Buka **Seller Profile → tab Tukar Tambah**
2. Review detail HP lama buyer (kondisi, foto, spesifikasi)
3. Klik **Setujui** atau **Tolak** (dengan alasan)
4. Setelah buyer kirim HP lama → klik **"Konfirmasi Terima Perangkat Lama"**
5. Proses selesai — kirim HP baru ke buyer sesuai alur order normal

---

## Status Trade-In

```
pending → approved → shipping → completed
       ↘ rejected
```

| Status | Deskripsi | Aksi Selanjutnya |
|--------|-----------|-----------------|
| `pending` | Request dikirim buyer, menunggu seller | Seller approve / reject |
| `approved` | Seller menyetujui nilai tukar | Buyer input resi kirim HP lama |
| `rejected` | Seller menolak (kondisi tidak sesuai, dll) | Buyer bayar full price atau batalkan |
| `shipping` | Buyer sudah mengirim HP lama | Seller konfirmasi penerimaan |
| `completed` | HP lama diterima seller, transaksi selesai | — |

---

## Setup & Migrasi Database

Jalankan SQL berikut di Supabase SQL Editor:

```sql
-- 1. Buat tabel trade_in_requests
-- (Lihat schema lengkap di supabase/schema.sql)

-- 2. Enable RLS
alter table public.trade_in_requests enable row level security;

-- 3. Tambah kolom ke orders
alter table public.orders
  add column if not exists trade_in_id uuid references public.trade_in_requests(id) on delete set null,
  add column if not exists trade_in_discount integer not null default 0;
```

> **Catatan:** Schema lengkap tersedia di [`supabase/schema.sql`](./supabase/schema.sql).
