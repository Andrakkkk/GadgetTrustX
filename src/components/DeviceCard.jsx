import { formatPrice } from '@/utils/formatPrice';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api-client';

const flyToCartAnimation = (btn, imageSrc) => {
  if (!btn) return;
  const btnRect = btn.getBoundingClientRect();
  const cartIcon = document.getElementById('cart-icon');
  if (!cartIcon) return;
  const cartRect = cartIcon.getBoundingClientRect();
  const flyingImg = document.createElement('img');
  flyingImg.src = imageSrc;
  flyingImg.style.cssText = `position:fixed;left:${btnRect.left}px;top:${btnRect.top}px;width:64px;height:64px;border-radius:12px;object-fit:cover;z-index:99999;box-shadow:0 8px 32px rgba(59,130,246,0.5);transition:all 1s cubic-bezier(0.25,1,0.3,1);pointer-events:none;`;
  document.body.appendChild(flyingImg);
  flyingImg.getBoundingClientRect();
  flyingImg.style.left = `${cartRect.left + cartRect.width / 2 - 15}px`;
  flyingImg.style.top = `${cartRect.top + cartRect.height / 2 - 15}px`;
  flyingImg.style.width = '24px';
  flyingImg.style.height = '24px';
  flyingImg.style.opacity = '0';
  flyingImg.style.transform = 'scale(0.2)';
  setTimeout(() => {
    flyingImg.remove();
    cartIcon.style.transform = 'scale(1.3)';
    setTimeout(() => (cartIcon.style.transform = 'scale(1)'), 300);
  }, 1000);
};

export default function DeviceCard({ device }) {
  const router = useRouter();
  const { user } = useAuth();
  const [sellerRating, setSellerRating] = useState(null);
  const [sellerReviewCount, setSellerReviewCount] = useState(0);
  const [deviceRating, setDeviceRating] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const sellerName = device.seller?.name || 'Seller TrustX';

  // Extract seller badges array safely
  const isVerifiedSeller = Boolean(device.seller?.verified || device.seller?.isVerified || device.seller?.is_verified);
  const rawBadges = device.seller?.badges;
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

  useEffect(() => {
    const sellerId = device.seller?.id || device.seller?.email;
    if (!sellerId && !device.id) return;
    let isMounted = true;

    const fetchRatings = async () => {
      try {
        const promises = [];
        if (sellerId) {
          promises.push(fetch(`/api/reviews?sellerEmail=${encodeURIComponent(sellerId)}`).then(r => r.json()));
        } else {
          promises.push(Promise.resolve({ reviews: [] }));
        }

        if (device.id) {
          promises.push(fetch(`/api/reviews?deviceId=${encodeURIComponent(device.id)}`).then(r => r.json()));
        } else {
          promises.push(Promise.resolve({ reviews: [] }));
        }

        const [sellerData, deviceData] = await Promise.all(promises);
        
        if (!isMounted) return;

        const sReviews = sellerData.reviews || [];
        if (sReviews.length > 0) {
          const avg = sReviews.reduce((a, r) => a + Number(r.rating || 0), 0) / sReviews.length;
          setSellerRating(avg.toFixed(1));
          setSellerReviewCount(sReviews.length);
        } else {
          setSellerRating(null);
          setSellerReviewCount(0);
        }

        const dReviews = deviceData.reviews || [];
        setReviewCount(dReviews.length);
        if (dReviews.length > 0) {
          const avg = dReviews.reduce((a, r) => a + Number(r.rating || 0), 0) / dReviews.length;
          setDeviceRating(avg.toFixed(1));
        } else {
          setDeviceRating(null);
        }
      } catch (err) {
        console.error('Rating fetch error:', err);
      }
    };

    fetchRatings();
    return () => {
      isMounted = false;
    };
  }, [device.seller?.id, device.seller?.email, device.id]);

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    if (!user) { router.push('/login'); return; }
    if (user.role === 'seller') {
      alert('Akun penjual tidak dapat menambahkan produk ke keranjang. Silakan masuk sebagai pembeli.');
      return;
    }
    if (user.email === (device.seller?.id || device.seller?.email)) {
      alert('Anda tidak dapat membeli produk milik Anda sendiri.');
      return;
    }
    if (device.stock > 0) {
      const res = await apiFetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: device.id, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Gagal menambahkan ke keranjang.'); return; }
      window.dispatchEvent(new Event('cartUpdated'));
      flyToCartAnimation(btn, device.image);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  const handleChat = (e) => {
    e.stopPropagation();
    if (!user) { router.push('/login'); return; }
    if (user.email === (device.seller?.id || device.seller?.email)) {
      alert('Ini adalah produk Anda sendiri.');
      return;
    }
    window.dispatchEvent(new CustomEvent('openChat', { detail: device.seller }));
  };

  const inStock = device.stock > 0;
  const isLowStock = device.stock > 0 && device.stock <= 3;

  const isBrandNew = Boolean(
    device.condition &&
    (
      device.condition.toLowerCase().includes('brand new') ||
      device.condition.toLowerCase().includes('baru') ||
      device.condition.toLowerCase().includes('bnib') ||
      device.condition.toLowerCase() === 'new'
    )
  );

  return (
    <div
      onClick={() => router.push(`/product/${device.id}`)}
      className="group relative flex flex-col bg-[#0d1117] rounded-xl sm:rounded-2xl border border-white/[0.07] overflow-hidden cursor-pointer transition-all duration-400 hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
    >
      {/* Image */}
      <div className="relative h-24 sm:h-52 overflow-hidden bg-[#0a0f1a] flex-shrink-0 flex items-center justify-center">
        <img
          src={device.image}
          alt={device.name}
          className="w-full h-full object-contain p-1 sm:p-2.5 transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117]/80 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-1 left-1 sm:top-3 sm:left-3 flex flex-wrap items-center gap-0.5 sm:gap-1.5 z-10">
          {device.verifiedByTrustX && (
            <span className="flex items-center gap-0.5 bg-[#090d14]/90 backdrop-blur-md border border-emerald-500/35 text-emerald-400 text-[7px] sm:text-[9px] font-black uppercase tracking-wider px-1 py-0.2 sm:px-2.5 sm:py-0.5 rounded sm:rounded-lg shadow-md">
              TRUSTX
            </span>
          )}
          {sellerBadgesList.includes('Official Store') && (
            <span className="bg-[#090d14]/90 backdrop-blur-md border border-purple-500/35 text-purple-300 text-[7px] sm:text-[9px] font-black uppercase tracking-wider px-1 py-0.2 sm:px-2.5 sm:py-0.5 rounded sm:rounded-lg shadow-md">
              OFFICIAL
            </span>
          )}
          {isBrandNew && (
            <span className="bg-[#090d14]/90 backdrop-blur-md border border-blue-500/35 text-blue-400 text-[7px] sm:text-[9px] font-black uppercase tracking-wider px-1 py-0.2 sm:px-2.5 sm:py-0.5 rounded sm:rounded-lg shadow-md">
              BNIB
            </span>
          )}
        </div>

        {/* Stock status top right */}
        <div className="absolute top-1 right-1 sm:top-3 sm:right-3">
          <span className={`flex items-center gap-0.5 sm:gap-1 text-[7px] sm:text-[9px] font-black uppercase tracking-wider px-1 py-0.2 sm:px-2.5 sm:py-1 rounded sm:rounded-lg backdrop-blur-sm ${
              !inStock
                ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                : isLowStock
                  ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                  : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
            }`}>
            <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                !inStock
                  ? 'bg-red-400'
                  : isLowStock
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-emerald-400 animate-pulse'
              }`}
            />
            {!inStock ? 'Habis' : isLowStock ? 'Tipis' : 'Ready'}
          </span>
        </div>

        {/* Device rating bottom left (Only if reviews exist for this device) */}
        {deviceRating !== null && (
          <div className="absolute bottom-1 left-1 sm:bottom-3 sm:left-3">
            <div className="flex items-center gap-0.5 bg-black/60 backdrop-blur-md px-1 py-0.2 sm:px-2 sm:py-1 rounded sm:rounded-lg border border-white/10 shadow-lg">
              <svg className="w-2 h-2 sm:w-3 sm:h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <span className="text-[8px] sm:text-[10px] font-bold text-white">{deviceRating}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-2 sm:p-5">
        {/* Brand + Name */}
        <div className="mb-1 sm:mb-3">
          <p className="text-[7px] sm:text-[10px] font-black uppercase tracking-wider text-blue-400 mb-0.5">{device.brand}</p>
          <h3 className="text-[10px] sm:text-base font-bold text-white leading-snug group-hover:text-purple-300 transition-colors line-clamp-2">
            {device.name}
          </h3>
        </div>

        {/* Spec chips */}
        <div className="flex flex-wrap gap-0.5 sm:gap-1.5 mb-1.5 sm:mb-4">
          {device.ram && (
            <span className="text-[7px] sm:text-[10px] font-bold text-slate-400 bg-white/[0.04] border border-white/[0.07] px-1 py-0.2 sm:px-2 sm:py-1 rounded sm:rounded-lg">
              {device.ram}
            </span>
          )}
          {device.storage && (
            <span className="text-[7px] sm:text-[10px] font-bold text-slate-400 bg-white/[0.04] border border-white/[0.07] px-1 py-0.2 sm:px-2 sm:py-1 rounded sm:rounded-lg">
              {device.storage}
            </span>
          )}
          {device.condition && (
            <span className="text-[7px] sm:text-[10px] font-bold text-slate-400 bg-white/[0.04] border border-white/[0.07] px-1 py-0.2 sm:px-2 sm:py-1 rounded sm:rounded-lg hidden sm:inline">
              {device.condition}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-1.5 sm:mb-4">
          <span className="text-xs sm:text-xl font-black text-white">{formatPrice(device.price)}</span>
          {device.originalPrice && (
            <span className="text-[9px] sm:text-sm text-slate-600 line-through font-medium hidden sm:inline">{formatPrice(device.originalPrice)}</span>
          )}
        </div>

        {/* Seller row */}
        <div className="flex items-center justify-between gap-1 mb-2 sm:mb-4 py-1.5 sm:py-3 border-t border-white/[0.06]">
          {/* Avatar + Info */}
          <div className="flex items-center gap-1 sm:gap-2.5 min-w-0 flex-1">
            <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-md sm:rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[8px] sm:text-xs font-black text-white flex-shrink-0 shadow-md shadow-purple-500/10">
              {sellerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              {/* Line 1: Seller Name + Verified Checkmark */}
              <div className="flex items-center gap-0.5 min-w-0">
                <span className="text-[9px] sm:text-xs font-bold text-slate-100 truncate">{sellerName}</span>
                {isVerifiedSeller && (
                  <span className="inline-flex items-center justify-center w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[7px] sm:text-[9px] font-black flex-shrink-0" title="Verified Seller">
                    ✓
                  </span>
                )}
              </div>
              
              {/* Line 2: Seller Badges */}
              {sellerBadgesList.filter(b => b !== 'Verified').length > 0 && (
                <div className="hidden sm:flex items-center gap-1 flex-wrap mt-0.5">
                  {sellerBadgesList.filter(b => b !== 'Verified').slice(0, 2).map((badge, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${
                        badge === 'Official Store'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Real Seller Account Rating */}
          {sellerRating !== null && (
            <div className="flex items-center gap-0.5 flex-shrink-0 bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 sm:px-2 sm:py-1 rounded sm:rounded-xl shadow-sm" title={`Rating Akun Seller (${sellerReviewCount} Ulasan Produk)`}>
              <svg className="w-2 h-2 sm:w-3 sm:h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <span className="text-[8px] sm:text-[11px] font-black text-amber-400">{sellerRating}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 sm:gap-2 mt-auto">
          <button
            onClick={handleChat}
            className="w-7 h-7 sm:w-10 sm:h-10 flex-shrink-0 rounded-md sm:rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
            title="Chat seller"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </button>
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`flex-1 h-7 sm:h-10 rounded-md sm:rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-wide transition-all flex items-center justify-center gap-1
              ${inStock
                ? addedToCart
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white/[0.03] text-slate-600 cursor-not-allowed'
              }
            `}
          >
            {addedToCart ? (
              <>
                <span className="hidden sm:inline">Ditambahkan!</span>
                <span>✓</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
                <span className="truncate">{inStock ? 'Beli' : 'Habis'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
