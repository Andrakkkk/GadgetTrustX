/**
 * Utility functions for input validation and sanitization across GadgetTrustX.
 */

// Email regex format standard
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validasi alamat email
 * @param {string} email
 * @returns {{ isValid: boolean, error?: string, sanitized?: string }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Alamat email wajib diisi.' };
  }
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 100) {
    return { isValid: false, error: 'Panjang email maksimal 100 karakter.' };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Format email tidak valid (contoh: nama@email.com).' };
  }
  return { isValid: true, sanitized: trimmed };
}

/**
 * Validasi password
 * @param {string} password
 * @param {{ isNew?: boolean, confirmPassword?: string }} options
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validatePassword(password, { isNew = false, confirmPassword = null } = {}) {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password wajib diisi.' };
  }
  if (password.length < 8) {
    return { isValid: false, error: 'Password minimal 8 karakter demi keamanan akun.' };
  }
  if (password.length > 72) {
    return { isValid: false, error: 'Password maksimal 72 karakter.' };
  }

  if (isNew) {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      return { isValid: false, error: 'Password baru wajib mengandung kombinasi huruf dan angka.' };
    }
    if (confirmPassword !== null && confirmPassword !== undefined) {
      if (password !== confirmPassword) {
        return { isValid: false, error: 'Konfirmasi password tidak cocok.' };
      }
    }
  }

  return { isValid: true };
}

/**
 * Mengukur kekuatan password secara real-time
 * @param {string} password
 * @returns {{ score: number, label: string, color: string, barColor: string }}
 */
export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: 'text-slate-500', barColor: 'bg-slate-700' };
  let points = 0;
  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^a-zA-Z0-9]/.test(password)) points += 1;

  if (points <= 2) {
    return { score: 1, label: 'Lemah', color: 'text-red-400', barColor: 'bg-red-500' };
  }
  if (points <= 4) {
    return { score: 2, label: 'Sedang', color: 'text-amber-400', barColor: 'bg-amber-500' };
  }
  return { score: 3, label: 'Kuat', color: 'text-emerald-400', barColor: 'bg-emerald-500' };
}

/**
 * Membersihkan nomor telepon agar hanya tersisa angka (maksimal 15 digit)
 * @param {string} phone
 * @returns {string}
 */
export function sanitizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/\D/g, '').slice(0, 15);
}

/**
 * Validasi nomor telepon Indonesia (wajib angka, 10-15 digit, diawali 08 atau 628)
 * @param {string} phone
 * @param {{ required?: boolean }} options
 * @returns {{ isValid: boolean, error?: string, sanitized?: string }}
 */
export function validatePhone(phone, { required = false } = {}) {
  const digits = sanitizePhone(phone);
  if (!digits) {
    if (required) {
      return { isValid: false, error: 'Nomor telepon wajib diisi (hanya angka).' };
    }
    return { isValid: true, sanitized: '' };
  }

  if (digits.length < 10 || digits.length > 15) {
    return { isValid: false, error: 'Nomor telepon harus terdiri dari 10 - 15 digit angka.' };
  }

  if (!digits.startsWith('08') && !digits.startsWith('628')) {
    return { isValid: false, error: 'Nomor telepon harus diawali dengan 08... atau 628...' };
  }

  return { isValid: true, sanitized: digits };
}

/**
 * Validasi nama pengguna
 * @param {string} name
 * @param {{ min?: number, max?: number }} options
 * @returns {{ isValid: boolean, error?: string, sanitized?: string }}
 */
export function validateName(name, { min = 2, max = 70 } = {}) {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Nama lengkap wajib diisi.' };
  }
  const trimmed = name.trim();
  if (trimmed.length < min) {
    return { isValid: false, error: `Nama minimal ${min} karakter.` };
  }
  if (trimmed.length > max) {
    return { isValid: false, error: `Nama maksimal ${max} karakter.` };
  }
  // Mencegah script injection atau simbol berbahaya, izinkan huruf, angka, spasi, titik, kutip, strip
  if (!/^[a-zA-Z0-9\s'.\-]+$/.test(trimmed)) {
    return { isValid: false, error: 'Nama hanya boleh berupa huruf, angka, spasi, atau tanda baca umum.' };
  }
  return { isValid: true, sanitized: trimmed };
}

/**
 * Sanitasi teks umum (alamat, bio, deskripsi)
 * Menghilangkan tag HTML berbahaya dan membatasi panjang teks
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
export function sanitizeText(text, max = 500) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[<>]/g, '') // strip potential HTML tags
    .trim()
    .slice(0, max);
}

/**
 * Validasi input Price Checker
 */
export function validatePriceCheckerInput({ device, brand, storage, ram, condition }) {
  if (!device || typeof device !== 'string' || !device.trim()) {
    return { isValid: false, error: 'Nama model perangkat wajib diisi.' };
  }
  const cleanDevice = sanitizeText(device, 80);
  if (cleanDevice.length < 2) {
    return { isValid: false, error: 'Nama model minimal 2 karakter.' };
  }
  if (device.trim().length > 80) {
    return { isValid: false, error: 'Nama model terlalu panjang (maksimal 80 karakter).' };
  }

  const cleanBrand = sanitizeText(brand || 'Other', 40);
  const cleanStorage = sanitizeText(storage || '128GB', 20);
  const cleanRam = sanitizeText(ram || '8GB', 20);
  const cleanCondition = sanitizeText(condition || 'Good', 30);

  return {
    isValid: true,
    sanitized: {
      device: cleanDevice,
      brand: cleanBrand,
      storage: cleanStorage,
      ram: cleanRam,
      condition: cleanCondition
    }
  };
}

/**
 * Validasi input form WTB (Want to Buy / Request Perangkat)
 */
export function validateWtbInput({ device, budget, condition, notes }) {
  if (!device || typeof device !== 'string' || !device.trim()) {
    return { isValid: false, error: 'Nama perangkat yang dicari wajib diisi.' };
  }
  const cleanDevice = sanitizeText(device, 100);
  if (cleanDevice.length < 2) {
    return { isValid: false, error: 'Nama perangkat minimal 2 karakter.' };
  }
  if (device.trim().length > 100) {
    return { isValid: false, error: 'Nama perangkat maksimal 100 karakter.' };
  }

  const numBudget = Number(budget);
  if (!budget || isNaN(numBudget) || numBudget < 10000) {
    return { isValid: false, error: 'Pagu budget minimal Rp 10.000.' };
  }
  if (numBudget > 1000000000) {
    return { isValid: false, error: 'Pagu budget maksimal Rp 1.000.000.000 (1 Miliar).' };
  }

  const cleanNotes = sanitizeText(notes || '', 500);

  return {
    isValid: true,
    sanitized: {
      device: cleanDevice,
      budget: Math.round(numBudget),
      condition: sanitizeText(condition || 'Any', 30),
      notes: cleanNotes
    }
  };
}

/**
 * Validasi input Ulasan / Review Produk
 */
export function validateReviewInput({ rating, comment }) {
  const numRating = parseInt(rating, 10);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return { isValid: false, error: 'Rating bintang wajib dipilih (antara 1 sampai 5).' };
  }

  if (comment && typeof comment === 'string' && comment.trim().length > 500) {
    return { isValid: false, error: 'Komentar ulasan maksimal 500 karakter.' };
  }

  return {
    isValid: true,
    sanitized: {
      rating: numRating,
      comment: sanitizeText(comment || '', 500)
    }
  };
}

/**
 * Validasi input Pengajuan Retur / Komplain Barang
 */
export function validateReturnInput({ reason }) {
  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    return { isValid: false, error: 'Alasan pengajuan retur wajib diisi.' };
  }
  const trimmed = reason.trim();
  if (trimmed.length < 5) {
    return { isValid: false, error: 'Jelaskan alasan retur minimal 5 karakter.' };
  }
  if (trimmed.length > 500) {
    return { isValid: false, error: 'Alasan retur maksimal 500 karakter.' };
  }

  return {
    isValid: true,
    sanitized: {
      reason: sanitizeText(trimmed, 500)
    }
  };
}

/**
 * Validasi input Jual HP Bekas / Tambah Listing Device
 */
export function validateDeviceListingInput({ name, brand, category, price, stock, description, chipset }) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return { isValid: false, error: 'Nama/judul model perangkat wajib diisi.' };
  }
  const cleanName = sanitizeText(name, 120);
  if (cleanName.length < 3) {
    return { isValid: false, error: 'Nama perangkat minimal 3 karakter.' };
  }
  if (name.trim().length > 120) {
    return { isValid: false, error: 'Nama perangkat maksimal 120 karakter.' };
  }

  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice < 1000) {
    return { isValid: false, error: 'Harga jual minimal Rp 1.000.' };
  }
  if (numPrice > 1000000000) {
    return { isValid: false, error: 'Harga jual maksimal Rp 1.000.000.000 (1 Miliar).' };
  }

  const numStock = parseInt(stock, 10);
  if (isNaN(numStock) || numStock < 0) {
    return { isValid: false, error: 'Jumlah stok tidak boleh negatif.' };
  }
  if (numStock > 10000) {
    return { isValid: false, error: 'Jumlah stok maksimal 10.000 unit.' };
  }

  if (description && typeof description === 'string' && description.trim().length > 1500) {
    return { isValid: false, error: 'Deskripsi produk maksimal 1.500 karakter.' };
  }

  return {
    isValid: true,
    sanitized: {
      name: cleanName,
      brand: sanitizeText(brand || 'Other', 50),
      category: sanitizeText(category || 'Smartphone', 50),
      price: Math.round(numPrice),
      stock: numStock,
      description: sanitizeText(description || '', 1500),
      chipset: sanitizeText(chipset || '', 80)
    }
  };
}

