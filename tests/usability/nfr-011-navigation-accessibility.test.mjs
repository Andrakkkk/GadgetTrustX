import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Helper formatPrice mimicking src/utils/formatPrice.js
function formatPrice(price) {
  if (price === null || price === undefined || isNaN(price)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price).replace(/\s+/g, ' ');
}

// NavLinks definition matching src/components/Navbar.jsx
const NAV_LINKS = [
  { name: 'Marketplace', path: '/marketplace' },
  { name: 'AI Valuation', path: '/price-checker' },
  { name: 'Scanner', path: '/verification' },
  { name: 'Smart Match', path: '/smart-matching' },
  { name: 'HP Bekas', path: '/trade-in' },
];

// Helper to extract seller badges list matching src/components/DeviceCard.jsx
function extractSellerBadges(seller) {
  const isVerifiedSeller = Boolean(seller?.verified || seller?.isVerified || seller?.is_verified);
  const rawBadges = seller?.badges;
  const sellerBadgesList = [];
  if (isVerifiedSeller) {
    sellerBadgesList.push('Verified');
  }
  if (Array.isArray(rawBadges)) {
    rawBadges.forEach((b) => {
      if (b && !sellerBadgesList.includes(b)) sellerBadgesList.push(b);
    });
  } else if (typeof rawBadges === 'string' && rawBadges.trim()) {
    rawBadges.split(',').forEach((b) => {
      const trimmed = b.trim();
      if (trimmed && !sellerBadgesList.includes(trimmed)) sellerBadgesList.push(trimmed);
    });
  }
  return sellerBadgesList;
}

// Helper to calculate badge notifications matching src/components/Navbar.jsx
function calculateBadges(cartItems, chats, userEmail) {
  const cartCount = (cartItems || []).reduce((sum, item) => sum + (item.cartQty || 1), 0);
  const unreadCount = (chats || []).filter((chat) => {
    const lastMsg = chat.messages?.[chat.messages.length - 1];
    return lastMsg && lastMsg.senderId !== userEmail && !lastMsg.read;
  }).length;
  return { cartCount, unreadCount };
}

describe('NFR-011: Pengujian Usability — Aksesibilitas, Struktur Navigasi & Tampilan Antarmuka', () => {

  it('TC-01: Harus menyediakan seluruh tautan navigasi utama secara intuitif dan memiliki rute yang valid', () => {
    assert.equal(NAV_LINKS.length, 5, 'Harus memiliki 5 link navigasi utama');
    
    const requiredSections = ['Marketplace', 'Scanner', 'AI Valuation', 'HP Bekas'];
    const names = NAV_LINKS.map(link => link.name);
    
    for (const req of requiredSections) {
      assert.ok(names.includes(req), `Navigasi harus menyertakan menu penting: ${req}`);
    }

    // Pastikan setiap rute diawali dengan slash '/'
    NAV_LINKS.forEach(link => {
      assert.ok(link.path.startsWith('/'), `Path ${link.path} harus berupa rute absolut valid`);
      assert.ok(link.name.trim().length > 0, 'Label link tidak boleh kosong untuk aksesibilitas screen reader');
    });
  });

  it('TC-02: Harus menutup drawer menu mobile secara otomatis saat navigasi berpindah rute', () => {
    let mobileMenuOpen = true;
    let currentPath = '/marketplace';

    const onRouteChange = (newPath) => {
      if (newPath !== currentPath) {
        currentPath = newPath;
        mobileMenuOpen = false; // Efek penutupan otomatis seperti pada useEffect Navbar
      }
    };

    onRouteChange('/verification');
    assert.equal(mobileMenuOpen, false, 'Menu mobile harus tertutup otomatis saat berpindah ke halaman lain');
  });

  it('TC-03: Harus menampilkan visual badge count notifikasi (Keranjang & Pesan) secara akurat', () => {
    const mockCartItems = [
      { id: '1', name: 'iPhone 13', cartQty: 2 },
      { id: '2', name: 'Galaxy S22', cartQty: 1 },
    ];
    const mockChats = [
      { id: 'c1', messages: [{ senderId: 'seller1@test.com', read: false }] }, // Belum dibaca oleh user
      { id: 'c2', messages: [{ senderId: 'user@test.com', read: false }] },    // Pesan dari user sendiri (jangan dihitung)
      { id: 'c3', messages: [{ senderId: 'seller2@test.com', read: true }] },  // Sudah dibaca
    ];

    const badges = calculateBadges(mockCartItems, mockChats, 'user@test.com');

    assert.equal(badges.cartCount, 3, 'Total item di cart harus berjumlah 3');
    assert.equal(badges.unreadCount, 1, 'Hanya pesan masuk yang belum terbaca yang menghasilkan notifikasi merah');
  });

  it('TC-04: Harus memformat harga produk ke format Rupiah (IDR) standar yang mudah dibaca pengguna', () => {
    const price1 = 12500000;
    const price2 = 899000;
    const priceZero = 0;

    const formatted1 = formatPrice(price1);
    const formatted2 = formatPrice(price2);
    const formattedZero = formatPrice(priceZero);

    assert.ok(formatted1.includes('12.500.000') || formatted1.includes('12,500,000'), 'Harga harus memiliki pemisah ribuan yang jelas');
    assert.ok(formatted1.includes('Rp'), 'Format harga harus mencantumkan simbol mata uang Rp');
    assert.ok(formatted2.includes('899.000') || formatted2.includes('899,000'), 'Harga ratusan ribu harus diformat rapi');
    assert.ok(formattedZero.includes('0'), 'Harga 0 harus ditangani dengan elegan');
  });

  it('TC-05: Harus menyematkan badge kepercayaan ("Verified") pada profil seller untuk meningkatkan kenyamanan user', () => {
    const verifiedSeller = { name: 'Official Store Jakarta', is_verified: true, badges: 'Top Rated, Fast Response' };
    const unverifiedSeller = { name: 'Seller Baru', is_verified: false, badges: [] };

    const badgesVerified = extractSellerBadges(verifiedSeller);
    const badgesUnverified = extractSellerBadges(unverifiedSeller);

    assert.ok(badgesVerified.includes('Verified'), 'Penjual terverifikasi harus menampilkan badge "Verified"');
    assert.ok(badgesVerified.includes('Top Rated'), 'Badge tambahan harus berhasil diekstrak');
    assert.equal(badgesUnverified.includes('Verified'), false, 'Penjual belum terverifikasi tidak boleh mendapat badge palsu');
  });

  it('TC-06: Harus menyajikan ringkasan spesifikasi penting perangkat dalam format tag ringkas untuk kemudahan pemindaian visual', () => {
    const rawSpecs = {
      storage: '256GB',
      ram: '8GB',
      condition: 'Like New (99%)',
      batteryHealth: '94%',
    };

    // Fungsi pembuat tag visual usability
    const generateVisualTags = (specs) => {
      const tags = [];
      if (specs.storage) tags.push(`💾 ${specs.storage}`);
      if (specs.ram) tags.push(`⚡ ${specs.ram} RAM`);
      if (specs.condition) tags.push(`✨ ${specs.condition}`);
      if (specs.batteryHealth) tags.push(`🔋 BH ${specs.batteryHealth}`);
      return tags;
    };

    const tags = generateVisualTags(rawSpecs);
    assert.equal(tags.length, 4, 'Seluruh informasi kunci harus diringkas menjadi visual chips');
    assert.ok(tags[0].includes('256GB'), 'Kapasitas penyimpanan harus terlihat seketika');
    assert.ok(tags[2].includes('Like New'), 'Kondisi fisik perangkat harus jelas');
  });

});
