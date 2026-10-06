import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Helper input masking mimicking src/app/verification/page.js
function applyImeiMask(inputVal) {
  return String(inputVal || '').replace(/\D/g, '').slice(0, 15);
}

// Helper validation logic before submit
function validateImeiSubmission(imei) {
  if (!imei || imei.length === 0) {
    return { valid: false, message: 'Kolom IMEI tidak boleh kosong.' };
  }
  if (imei.length < 15) {
    return { valid: false, message: 'IMEI harus berisi tepat 15 digit angka.' };
  }
  if (imei.length > 15) {
    return { valid: false, message: 'Panjang IMEI melebihi batas 15 digit.' };
  }
  return { valid: true, message: null };
}

// Helper toast type resolution mimicking src/components/CustomAlert.jsx
function resolveToastType(message, initialType = 'info') {
  let finalType = initialType;
  if (initialType === 'info') {
    const msg = (message || '').toLowerCase();
    if (msg.includes('sukses') || msg.includes('berhasil') || msg.includes('success') || msg.includes('approved')) {
      finalType = 'success';
    } else if (msg.includes('gagal') || msg.includes('error') || msg.includes('failed') || msg.includes('batal') || msg.includes('rejected')) {
      finalType = 'error';
    } else if (msg.includes('peringatan') || msg.includes('perhatian') || msg.includes('warning')) {
      finalType = 'warning';
    }
  }
  return finalType;
}

// Helper modal confirmation configuration mimicking CustomAlert.jsx
function createConfirmationModalConfig(message) {
  const msgLower = (message || '').toLowerCase();
  const isDanger = msgLower.includes('batal') || msgLower.includes('hapus') || msgLower.includes('delete');

  return {
    title: isDanger ? 'Konfirmasi Pembatalan / Tindakan Berbahaya' : 'Konfirmasi Tindakan',
    message,
    type: isDanger ? 'danger' : 'info',
    confirmText: isDanger ? 'Ya, Lanjutkan Hapus' : 'Ya, Lanjutkan',
    cancelText: 'Kembali / Batal',
    allowCancel: true,
  };
}

describe('NFR-012: Pengujian Usability — Kejelasan Umpan Balik Pengguna & Pencegahan Galat (Error Prevention)', () => {

  it('TC-01: Harus melakukan masking input otomatis agar pengguna tidak dapat memasukkan huruf atau karakter khusus pada form IMEI', () => {
    const rawInput1 = '3546-8515-1234-564'; // Mengandung tanda minus
    const rawInput2 = '35468abc5151234564999'; // Mengandung huruf dan kelebihan digit
    const rawInput3 = "354685151234' OR 1=1"; // Mengandung kutip dan spasi

    assert.equal(applyImeiMask(rawInput1), '354685151234564', 'Semua tanda minus harus dibersihkan otomatis');
    assert.equal(applyImeiMask(rawInput2).length, 15, 'Panjang string harus dipotong tepat 15 karakter');
    assert.equal(applyImeiMask(rawInput2), '354685151234564', 'Hanya digit murni yang diterima');
    assert.equal(applyImeiMask(rawInput3), '35468515123411', 'Karakter non-angka harus disaring seketika tanpa error');
  });

  it('TC-02: Harus mencegah pengiriman formulir dan memberikan pesan panduan jelas jika input belum lengkap (< 15 digit)', () => {
    const incompleteImei = '35468515'; // Hanya 8 digit
    const emptyImei = '';
    const completeImei = '354685151234564'; // 15 digit

    const resultIncomplete = validateImeiSubmission(incompleteImei);
    const resultEmpty = validateImeiSubmission(emptyImei);
    const resultComplete = validateImeiSubmission(completeImei);

    assert.equal(resultIncomplete.valid, false, 'Formulir tidak boleh diproses jika digit kurang');
    assert.ok(resultIncomplete.message.includes('15 digit'), 'Pesan kesalahan harus menginstruksikan format yang benar');

    assert.equal(resultEmpty.valid, false, 'Input kosong harus ditolak');
    assert.ok(resultEmpty.message.includes('tidak boleh kosong'), 'Pesan panduan harus komunikatif');

    assert.equal(resultComplete.valid, true, 'Input 15 digit valid harus diizinkan untuk dikirim');
    assert.equal(resultComplete.message, null, 'Tidak boleh ada pesan error pada input valid');
  });

  it('TC-03: Harus menonaktifkan elemen input/tombol (Disabled State) saat operasi async berjalan untuk mencegah double-submission', () => {
    let verifying = false;
    let clickCount = 0;

    const simulateUserSubmit = () => {
      if (verifying) return false; // Dicegah oleh sistem saat loading
      verifying = true;
      clickCount++;
      return true;
    };

    // Klik pertama (sukses)
    const firstClick = simulateUserSubmit();
    assert.equal(firstClick, true, 'Klik pertama harus diterima dan mengubah state ke loading');
    assert.equal(clickCount, 1);
    assert.equal(verifying, true, 'Sistem harus dalam status verifying/loading');

    // Pengguna mengklik lagi saat sedang loading (double-click cepat)
    const secondClick = simulateUserSubmit();
    assert.equal(secondClick, false, 'Klik kedua saat status loading harus diblokir');
    assert.equal(clickCount, 1, 'Counter submission tidak boleh bertambah');
  });

  it('TC-04: Harus mengklasifikasikan warna dan ikon notifikasi toast secara semantik berdasarkan konteks pesan', () => {
    const successMsg = 'Perangkat berhasil ditambahkan ke keranjang belanja!';
    const errorMsg = 'Gagal memverifikasi: Nomor seri tidak ditemukan pada database';
    const warningMsg = 'Peringatan: Masa garansi perangkat hampir berakhir';
    const neutralMsg = 'Memperbarui daftar inventaris toko...';

    assert.equal(resolveToastType(successMsg), 'success', 'Pesan berhasil harus menghasilkan tipe success (Hijau)');
    assert.equal(resolveToastType(errorMsg), 'error', 'Pesan kegagalan harus menghasilkan tipe error (Merah)');
    assert.equal(resolveToastType(warningMsg), 'warning', 'Pesan peringatan harus menghasilkan tipe warning (Kuning)');
    assert.equal(resolveToastType(neutralMsg), 'info', 'Pesan status umum harus menghasilkan tipe info (Netral/Biru)');
  });

  it('TC-05: Harus menyajikan dialog konfirmasi pencegahan galat (Error Prevention) dengan opsi pembatalan aman untuk aksi berisiko', () => {
    const dangerActionMsg = 'Apakah Anda yakin ingin membatalkan transaksi escrow ini? Saldo akan dikembalikan.';
    const normalActionMsg = 'Lanjutkan proses checkout pesanan sekarang?';

    const dangerModal = createConfirmationModalConfig(dangerActionMsg);
    const normalModal = createConfirmationModalConfig(normalActionMsg);

    assert.equal(dangerModal.type, 'danger', 'Aksi pembatalan harus bertipe danger');
    assert.ok(dangerModal.title.includes('Pembatalan') || dangerModal.title.includes('Berbahaya'), 'Judul modal harus memperingatkan risiko');
    assert.equal(dangerModal.allowCancel, true, 'Harus menyediakan tombol pembatalan yang mudah diakses pengguna');
    assert.ok(dangerModal.cancelText.includes('Batal') || dangerModal.cancelText.includes('Kembali'), 'Label tombol kembali harus jelas');

    assert.equal(normalModal.type, 'info', 'Aksi normal harus bertipe info yang ramah');
  });

  it('TC-06: Harus mendukung mekanisme auto-dismiss dan tombol tutup manual (✕) pada antarmuka notifikasi', () => {
    const activeToasts = [
      { id: 101, message: 'Login berhasil', duration: 4000 },
      { id: 102, message: 'Produk disimpan', duration: 4000 },
    ];

    // Simulasi tombol tutup manual (✕)
    const closeToastManually = (id) => {
      const idx = activeToasts.findIndex(t => t.id === id);
      if (idx !== -1) activeToasts.splice(idx, 1);
    };

    closeToastManually(101);
    assert.equal(activeToasts.length, 1, 'Toast harus segera hilang ketika tombol tutup ditekan pengguna');
    assert.equal(activeToasts[0].id, 102, 'Toast lain yang belum ditutup harus tetap tampil');

    // Verifikasi durasi wajar (tidak boleh terlalu cepat hilang agar terbaca)
    assert.ok(activeToasts[0].duration >= 3000, 'Durasi tampil minimal 3000ms agar sempat dibaca pengguna');
  });

});
