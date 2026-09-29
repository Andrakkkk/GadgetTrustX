'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/utils/formatPrice';
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
  flyingImg.style.cssText = `position:fixed;left:${btnRect.left}px;top:${btnRect.top}px;width:80px;height:80px;border-radius:16px;object-fit:cover;z-index:99999;box-shadow:0 8px 32px rgba(59,130,246,0.6);transition:all 1.2s cubic-bezier(0.25,1,0.3,1);pointer-events:none;`;
  document.body.appendChild(flyingImg);
  flyingImg.getBoundingClientRect();
  flyingImg.style.left = `${cartRect.left + cartRect.width / 2 - 15}px`;
  flyingImg.style.top = `${cartRect.top + cartRect.height / 2 - 15}px`;
  flyingImg.style.width = '30px';
  flyingImg.style.height = '30px';
  flyingImg.style.opacity = '0';
  flyingImg.style.transform = 'scale(0.3)';
  setTimeout(() => {
    flyingImg.remove();
    cartIcon.style.transform = 'scale(1.3)';
    setTimeout(() => (cartIcon.style.transform = 'scale(1)'), 300);
  }, 1200);
};

function StarRating({ rating = 0, max = 5, size = 'sm' }) {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4.5 h-4.5', lg: 'w-5 h-5' };
  return (
    <div className="flex gap-0.5">
      {[...Array(max)].map((_, i) => (
        <svg key={i} className={`${sizes[size]} ${i < Math.round(rating) ? 'text-amber-400' : 'text-slate-700'} fill-current`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

const specIconMap = {
  RAM: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
    </svg>
  ),
  Penyimpanan: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
    </svg>
  ),
  Chipset: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18M9 12h6M9 16h4"/>
    </svg>
  ),
  Kondisi: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
    </svg>
  ),
  Kategori: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
    </svg>
  ),
  Brand: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
    </svg>
  ),
};

const specColorMap = {
  RAM: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Penyimpanan: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  Chipset: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  Kondisi: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Kategori: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Brand: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
};

function SpecCard({ label, value }) {
  if (!value) return null;
  const icon = specIconMap[label];
  const colorClass = specColorMap[label] || 'text-slate-400 bg-white/[0.04] border-white/[0.08]';
  return (
    <div className="group relative flex flex-col gap-4 bg-[#0d1117] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.14] transition-all duration-300">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1.5">{label}</p>
        <p className="text-lg font-black text-white leading-tight">{value}</p>
      </div>
    </div>
  );
}

function SpecChip({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3">
      <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  );
}

export default function ProductDetailPage({ params }) {
  const router = useRouter();
  const { user } = useAuth();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewFilter, setReviewFilter] = useState(0);
  const [selectedReview, setSelectedReview] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [sellerReviews, setSellerReviews] = useState([]);
  const [aiValuation, setAiValuation] = useState(null);
  const [sellerReplyText, setSellerReplyText] = useState('');
  const [sellerReplyImage, setSellerReplyImage] = useState(null);
  const [sellerReplyImagePreview, setSellerReplyImagePreview] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState({ isOpen: false, url: '', title: '' });

  // Trade-In Modal States
  const [showTradeInModal, setShowTradeInModal] = useState(false);
  const [tradeInStep, setTradeInStep] = useState(1);
  const [tradeInForm, setTradeInForm] = useState({
    oldDeviceName: '',
    oldDeviceBrand: 'Apple',
    oldDeviceCondition: 'Good',
    oldDeviceStorage: '128GB',
    oldDeviceRam: '4GB',
    oldDeviceBatteryHealth: 85,
    oldDeviceAccessories: '',
    oldDeviceDescription: '',
  });
  const [tradeInAiValuation, setTradeInAiValuation] = useState(null);
  const [userOfferPrice, setUserOfferPrice] = useState(0);
  const [tradeInSubmitting, setTradeInSubmitting] = useState(false);
  const [tradeInError, setTradeInError] = useState('');
  const [tradeInImagePreviews, setTradeInImagePreviews] = useState([]);

  const handleStartTradeIn = () => {
    if (!user) { router.push('/login'); return; }
    setShowTradeInModal(true);
    setTradeInStep(1);
    setTradeInAiValuation(null);
    setTradeInImagePreviews([]);
    setTradeInError('');
  };

  const handleCalculateTradeInAI = async (e) => {
    e.preventDefault();
    if (!tradeInForm.oldDeviceName.trim()) return;
    setTradeInSubmitting(true);
    setTradeInError('');

    try {
      const res = await fetch('/api/price-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device: tradeInForm.oldDeviceName,
          brand: tradeInForm.oldDeviceBrand,
          condition: tradeInForm.oldDeviceCondition,
          storage: tradeInForm.oldDeviceStorage,
          ram: tradeInForm.oldDeviceRam
        })
      });
      const data = await res.json();
      if (data.price) {
        setTradeInAiValuation(data);
        setUserOfferPrice(data.price);
        setTradeInStep(2);
      } else {
        setTradeInError('AI tidak bisa menghitung nilai perangkat ini. Pastikan nama model sudah benar.');
      }
    } catch (err) {
      setTradeInError('Gagal terhubung ke AI. Periksa koneksi dan coba lagi.');
    } finally {
      setTradeInSubmitting(false);
    }
  };

  const handleConfirmTradeInCheckout = async () => {
    if (!user || !device) return;
    setTradeInSubmitting(true);
    setTradeInError('');

    try {
      const targetName = tradeInForm.oldDeviceName;
      const finalOfferPrice = Number(userOfferPrice) || tradeInAiValuation?.price || 0;

      const res = await apiFetch('/api/trade-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: device.id,
          oldDeviceName: targetName,
          oldDeviceBrand: tradeInForm.oldDeviceBrand,
          oldDeviceCondition: tradeInForm.oldDeviceCondition,
          oldDeviceStorage: tradeInForm.oldDeviceStorage,
          oldDeviceRam: tradeInForm.oldDeviceRam,
          oldDeviceBatteryHealth: tradeInForm.oldDeviceBatteryHealth,
          oldDeviceAccessories: tradeInForm.oldDeviceAccessories,
          oldDeviceDescription: tradeInForm.oldDeviceDescription,
          oldDeviceImages: tradeInImagePreviews,
          aiEstimatedValue: finalOfferPrice
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setTradeInError(data.error || 'Gagal membuat permintaan tukar tambah.');
        setTradeInSubmitting(false);
        return;
      }

      setShowTradeInModal(false);
      alert('📩 Pengajuan Tukar Tambah Berhasil Dikirim!\n\nPenjual akan meninjau dan menyetujui (ACC) tawaran kamu. Setelah disetujui, tombol checkout diskon akan aktif di profil kamu.');
      router.push('/buyer-profile');
    } catch (err) {
      setTradeInError('Terjadi kesalahan saat mengirim pengajuan tukar tambah.');
      setTradeInSubmitting(false);
    }
  };

  useEffect(() => {
    fetch(`/api/devices/${id}`)
      .then(r => r.json())
      .then(data => setDevice(data.device || null))
      .catch(() => setDevice(null))
      .finally(() => setLoading(false));

    fetch(`/api/reviews?deviceId=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(data => setReviews(data.reviews || []))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!device) return;
    const isTradeIn = Boolean(device.isTradeIn);
    const itemCondition = isTradeIn ? (device.condition || 'Good') : 'Brand New';

    fetch('/api/price-checker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device: device.name,
        brand: device.brand || '',
        condition: itemCondition,
        storage: device.storage || '128GB',
        ram: device.ram || '8GB',
        category: device.category || 'Smartphone',
        ttlMs: 24 * 60 * 60 * 1000 // 1 Day (24 hours) TTL for Wajar AI on product detail page
      })
    })
      .then(r => r.json())
      .then(data => { if (data.price) setAiValuation(data); })
      .catch(() => {});
  }, [device]);

  useEffect(() => {
    if (!device?.seller?.id) return;
    fetch(`/api/reviews?sellerEmail=${encodeURIComponent(device.seller.id)}`)
      .then(r => r.json())
      .then(data => setSellerReviews(data.reviews || []))
      .catch(() => {});
  }, [device?.seller?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
            </svg>
          </div>
          <p className="text-slate-500 text-sm font-medium">Memuat produk...</p>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 gap-4">
        <div className="text-5xl mb-2">🔍</div>
        <h1 className="text-2xl font-bold text-white">Produk Tidak Ditemukan</h1>
        <p className="text-slate-500 max-w-sm">Item ini mungkin sudah dihapus atau tidak tersedia lagi.</p>
        <button onClick={() => router.push('/marketplace')} className="btn-primary mt-4 px-8 py-3">
          Kembali ke Marketplace
        </button>
      </div>
    );
  }

  const handleAddToCart = async (e) => {
    const btn = e.currentTarget;
    if (!user) { router.push('/login'); return; }
    if (user.role === 'seller') { alert('Seller tidak bisa menambahkan produk ke keranjang.'); return; }
    if (user.email === device.seller?.id) { alert('Anda tidak bisa membeli produk Anda sendiri.'); return; }
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
      setTimeout(() => setAddedToCart(false), 2500);
    }
  };

  const handleChat = () => {
    if (!user) { router.push('/login'); return; }
    window.dispatchEvent(new CustomEvent('openChat', {
      detail: { ...device.seller, product: { id: device.id, name: device.name, price: device.price, image: device.image } }
    }));
  };

  const handleSendSellerReply = async () => {
    if (!selectedReview || (!sellerReplyText.trim() && !sellerReplyImage)) return;
    if (!isAuthorizedSeller) {
      alert('Anda tidak memiliki izin untuk membalas ulasan pada produk penjual lain.');
      return;
    }
    setSubmittingReply(true);
    try {
      let uploadedImageUrl = null;
      if (sellerReplyImage) {
        const formData = new FormData();
        formData.append('file', sellerReplyImage);
        const uploadRes = await apiFetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.url) {
          uploadedImageUrl = uploadData.url;
        }
      }

      const res = await apiFetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: selectedReview.id,
          sellerResponse: sellerReplyText.trim(),
          sellerResponseImage: uploadedImageUrl,
        }),
      });
      const data = await res.json();
      if (res.ok && data.review) {
        setSelectedReview(data.review);
        setReviews(prev => prev.map(r => r.id === data.review.id ? data.review : r));
        setSellerReplyText('');
        setSellerReplyImage(null);
        setSellerReplyImagePreview('');
        alert('Respon penjual berhasil dikirimkan.');
      } else {
        alert(data.error || 'Gagal mengirimkan respon.');
      }
    } catch (e) {
      alert('Terjadi kesalahan saat mengirimkan respon.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const avgDeviceRating = reviews.length > 0
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const avgSellerRating = sellerReviews.length > 0
    ? (sellerReviews.reduce((a, r) => a + r.rating, 0) / sellerReviews.length).toFixed(1)
    : device.seller?.reputationScore || null;

  const inStock = device.stock > 0;
  const filteredReviews = reviews.filter(r => reviewFilter === 0 || r.rating === reviewFilter);

  const isAuthorizedSeller = Boolean(
    user && device?.seller &&
    (
      user.role === 'admin' ||
      (user.email && device.seller.id && String(user.email).toLowerCase() === String(device.seller.id).toLowerCase()) ||
      (user.id && device.seller.profileId && user.id === device.seller.profileId)
    )
  );

  const specItems = [
    { label: 'RAM', value: device.ram },
    { label: 'Penyimpanan', value: device.storage },
    { label: 'Chipset', value: device.chipset },
    { label: 'Kondisi', value: device.condition },
    { label: 'Kategori', value: device.category },
    { label: 'Brand', value: device.brand },
  ].filter(s => s.value);

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-600 mb-8">
          <button onClick={() => router.push('/marketplace')} className="hover:text-blue-400 transition-colors font-medium">
            Marketplace
          </button>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          <span className="text-slate-500">{device.category}</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          <span className="text-slate-300 font-medium truncate max-w-[200px]">{device.name}</span>
        </nav>

        {/* ── Main Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-10 mb-12">

          {/* LEFT: Image */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-[#0d1117] border border-white/[0.08] aspect-square flex items-center justify-center">
              <img
                src={device.image}
                alt={device.name}
                className="w-full h-full object-contain p-4"
              />
              {/* Badges */}
              {device.verifiedByTrustX && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-black px-3 py-1.5 rounded-xl">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Verified TrustX
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl backdrop-blur-sm ${inStock ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  {inStock ? 'IN STOCK' : 'HABIS'}
                </span>
              </div>
            </div>

            {/* Seller Card */}
            <div className="rounded-2xl bg-[#0d1117] border border-white/[0.08] p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-lg font-black text-white flex-shrink-0">
                  {(device.seller?.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Dijual oleh</p>
                  <p className="text-sm font-bold text-white truncate">{device.seller?.name || 'Unknown Seller'}</p>
                  {avgSellerRating && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <StarRating rating={parseFloat(avgSellerRating)} size="sm" />
                      <span className="text-[10px] font-bold text-amber-400">{avgSellerRating}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleChat}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-bold text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                Chat
              </button>
            </div>

            {/* Seller badges */}
            {device.seller?.badges?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {device.seller.badges.map(badge => (
                  <span key={badge} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-blue-400/20 bg-blue-500/8 text-blue-400">
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Info */}
          <div className="flex flex-col">
            {/* Status + Name */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${inStock ? 'text-emerald-400' : 'text-red-400'}`}>
                <span className={`w-2 h-2 rounded-full ${inStock ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                {inStock ? 'IN STOCK' : 'HABIS'} · {device.verifiedByTrustX ? 'VERIFIED' : device.brand?.toUpperCase()}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
              {device.name}
            </h1>

            {/* Sub-line — styled badges */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {device.brand && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                  </svg>
                  {device.brand}
                </span>
              )}
              {device.storage && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
                  </svg>
                  {device.storage}
                </span>
              )}
              {device.condition && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {device.isTradeIn ? (device.condition || 'Second / Bekas') : 'Baru (Brand New)'}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="mb-8 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Harga</p>
                {aiValuation && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Wajar AI: {formatPrice(aiValuation.price)}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-4xl font-black text-white">{formatPrice(device.price)}</span>
                {device.originalPrice && (
                  <>
                    <span className="text-lg text-slate-600 line-through font-medium">{formatPrice(device.originalPrice)}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/>
                      </svg>
                      Hemat {formatPrice(device.originalPrice - device.price)}
                    </span>
                  </>
                )}
              </div>
              {aiValuation?.reasoning && (
                <p className="text-xs text-purple-300/80 mt-3 pt-3 border-t border-white/5 leading-relaxed">
                  <span className="font-bold text-purple-400">AI Valuation: </span>
                  {aiValuation.reasoning}
                </p>
              )}
              {inStock && (
                <p className="text-xs text-slate-700 mt-2">
                  Stok tersisa: <span className="text-slate-500 font-bold">{device.stock} unit</span>
                </p>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 mb-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className={`flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all
                    ${inStock
                      ? addedToCart
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:shadow-[0_4px_28px_rgba(59,130,246,0.5)]'
                      : 'bg-white/[0.04] text-slate-600 cursor-not-allowed'
                    }
                  `}
                >
                  {addedToCart ? (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg> Ditambahkan!</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg> {inStock ? 'Tambah ke Keranjang' : 'Stok Habis'}</>
                  )}
                </button>
                <button
                  onClick={handleChat}
                  className="flex-shrink-0 w-12 h-12 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.18] text-slate-400 hover:text-white transition-all flex items-center justify-center"
                  title="Hubungi Seller"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                </button>
              </div>

              {/* Trade-In (Tukar Tambah) Button for Buyers */}
              {!device.isTradeIn && user?.role !== 'seller' && user?.email !== device.seller?.id && inStock && (
                <button
                  onClick={handleStartTradeIn}
                  className="w-full py-3.5 rounded-xl border border-purple-500/40 bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 hover:text-white font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-purple-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                  </svg>
                  <span>🔄 Beli dengan Tukar Tambah — Hemat Jutaan!</span>
                </button>
              )}
            </div>

            {/* TrustX Verification Box */}
            {device.verifiedByTrustX && (
              <div className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 p-5 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-black text-emerald-400">Verified by TrustX</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Status Stok', value: inStock ? 'Tersedia' : 'Habis' },
                    { label: 'Kondisi', value: device.condition || 'Dicek TrustX' },
                    { label: 'Seller', value: device.seller?.name || '-' },
                    { label: 'Reputasi', value: avgSellerRating ? `${avgSellerRating} / 5.0` : 'Baru' },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-sm font-bold text-emerald-300">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}


          </div>
        </div>

        {/* ── Technical Specifications ── */}
        {specItems.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Technical Specifications</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
              {specItems.map(spec => (
                <SpecCard key={spec.label} label={spec.label} value={spec.value} />
              ))}
            </div>
          </section>
        )}

        {/* ── Description ── */}
        {device.description && (
          <section className="mb-12 rounded-2xl bg-[#0d1117] border border-white/[0.07] p-7">
            <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Deskripsi Produk
            </h2>
            <p className="text-slate-400 leading-8 whitespace-pre-line text-sm">{device.description}</p>
          </section>
        )}

        {/* ── Reviews Section ── */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Ulasan Pembeli
              </h2>
              {avgDeviceRating && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                  <StarRating rating={parseFloat(avgDeviceRating)} size="sm" />
                  <span className="text-sm font-black text-amber-400">{avgDeviceRating}</span>
                  <span className="text-xs text-slate-600">({reviews.length})</span>
                </div>
              )}
            </div>

            {reviews.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setReviewFilter(0)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${reviewFilter === 0 ? 'bg-blue-600 border-blue-500 text-white' : 'border-white/[0.08] text-slate-500 hover:text-white bg-white/[0.02]'}`}
                >
                  Semua ({reviews.length})
                </button>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = reviews.filter(r => r.rating === star).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={star}
                      onClick={() => setReviewFilter(star)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${reviewFilter === star ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'border-white/[0.08] text-slate-500 hover:text-white bg-white/[0.02]'}`}
                    >
                      ★ {star} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl bg-[#0d1117] border border-white/[0.07] text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-bold text-white mb-2">Belum ada ulasan</h3>
              <p className="text-slate-500 text-sm">Jadilah yang pertama memberi ulasan setelah membeli produk ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReviews.map(review => (
                <div
                  key={review.id}
                  className="group rounded-2xl bg-[#0d1117] border border-white/[0.07] p-6 cursor-pointer hover:border-white/[0.14] transition-all"
                  onClick={() => setSelectedReview(review)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/30 to-violet-600/30 border border-white/10 flex items-center justify-center text-sm font-black text-white">
                        {review.buyerName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{review.buyerName}</p>
                        <p className="text-[10px] text-slate-600">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                      <svg className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      <span className="text-xs font-black text-amber-400">{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm leading-7 line-clamp-3">{review.comment}</p>
                  {review.sellerResponse && (
                    <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1.5">
                      <span className="font-bold text-blue-400 block">Respon Penjual:</span>
                      <p className="text-slate-300 line-clamp-2">{review.sellerResponse}</p>
                      {review.sellerResponseImage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImageModal({ isOpen: true, url: review.sellerResponseImage, title: `Foto Balasan Penjual` });
                          }}
                          className="pt-1 flex items-center gap-1.5 text-blue-300 hover:text-blue-200 font-bold text-[10px] cursor-pointer"
                        >
                          <span>🖼️ Lihat Foto Balasan Penjual</span>
                        </button>
                      )}
                    </div>
                  )}
                  {review.image && (
                    <div
                      className="mt-4 rounded-xl overflow-hidden border border-white/[0.07] group/img relative cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImageModal({ isOpen: true, url: review.image, title: `Foto Ulasan oleh ${review.buyerName}` });
                      }}
                    >
                      <img src={review.image} alt="Review" className="w-full h-32 object-cover group-hover/img:scale-105 transition-all" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all">
                        🔍 Perbesar Foto
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Review Modal ── */}
      {selectedReview && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedReview(null)}
        >
          <div
            className="relative bg-[#0d1117] border border-white/[0.1] max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedReview(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/20 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            {selectedReview.image && (
              <div
                className="relative group cursor-pointer overflow-hidden border-b border-white/10"
                onClick={() => setPreviewImageModal({ isOpen: true, url: selectedReview.image, title: `Foto Ulasan oleh ${selectedReview.buyerName}` })}
              >
                <img src={selectedReview.image} alt="Review" className="w-full max-h-64 object-cover group-hover:scale-105 transition-all" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all">
                  🔍 Perbesar Foto
                </div>
              </div>
            )}

            <div className="p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/30 to-violet-600/30 border border-white/10 flex items-center justify-center text-lg font-black text-white">
                  {selectedReview.buyerName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-bold text-white">{selectedReview.buyerName}</p>
                  <p className="text-xs text-slate-500">{selectedReview.date}</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl">
                  <StarRating rating={selectedReview.rating} size="sm" />
                  <span className="text-sm font-black text-amber-400">{selectedReview.rating}</span>
                </div>
              </div>
              <p className="text-slate-300 leading-8 text-sm whitespace-pre-wrap">{selectedReview.comment}</p>
              
              {selectedReview.sellerResponse && (
                <div className="mt-5 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-400">💬 Respon Penjual:</span>
                    {selectedReview.sellerResponseDate && (
                      <span className="text-[10px] text-slate-500">• {selectedReview.sellerResponseDate}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-200">{selectedReview.sellerResponse}</p>
                  {selectedReview.sellerResponseImage && (
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Foto Lampiran Penjual:</span>
                      <button
                        type="button"
                        onClick={() => setPreviewImageModal({ isOpen: true, url: selectedReview.sellerResponseImage, title: 'Foto Balasan Penjual' })}
                        className="relative group block w-28 h-28 rounded-xl overflow-hidden border border-blue-500/30 hover:border-blue-400 transition-all cursor-pointer"
                      >
                        <img src={selectedReview.sellerResponseImage} alt="Foto Balasan Penjual" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all">
                          🔍 Perbesar
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isAuthorizedSeller && !selectedReview.sellerResponse && (
                <div className="mt-5 pt-5 border-t border-white/10 space-y-3">
                  <label className="block text-xs font-bold text-slate-300">Beri Respon Penjual:</label>
                  <textarea
                    rows="2"
                    className="input-field !py-3"
                    placeholder="Tulis balasan untuk ulasan pembeli..."
                    value={sellerReplyText}
                    onChange={(e) => setSellerReplyText(e.target.value)}
                  />

                  {/* Photo Upload Attachment */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lampirkan Foto Balasan (Opsional)</label>
                    <div className="flex items-center gap-3">
                      {sellerReplyImagePreview ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-blue-500/40">
                          <img src={sellerReplyImagePreview} alt="Preview Foto Balasan" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => { setSellerReplyImage(null); setSellerReplyImagePreview(''); }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="seller-reply-img-upload" className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-bold text-slate-300 cursor-pointer flex items-center gap-2 transition-all">
                          <span>📸 Tambah Foto Balasan</span>
                        </label>
                      )}
                      <input
                        id="seller-reply-img-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setSellerReplyImage(file);
                            setSellerReplyImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSendSellerReply}
                    disabled={submittingReply || (!sellerReplyText.trim() && !sellerReplyImage)}
                    className="btn-primary py-2.5 px-5 text-xs font-bold uppercase tracking-wider"
                  >
                    {submittingReply ? 'Mengirimkan...' : 'Kirim Balasan Seller'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── Trade-In Modal ── */}
      {showTradeInModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative bg-[#0d1117] border border-purple-500/30 max-w-2xl w-full rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] sm:my-8">
            {/* Header — sticky */}
            <div className="flex items-center justify-between border-b border-white/10 px-8 pt-7 pb-5 flex-shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Program Tukar Tambah Resmi</span>
                <h3 className="text-xl font-bold text-white">Tukarkan Perangkat Lama Anda</h3>
              </div>
              <button
                onClick={() => setShowTradeInModal(false)}
                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-8 pb-8 pt-5 space-y-5">

            {tradeInError && (
              <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs text-center font-bold">
                {tradeInError}
              </div>
            )}

            {tradeInStep === 1 && (
              <form onSubmit={handleCalculateTradeInAI} className="space-y-5">
                {/* Info banner */}
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex gap-3 items-start">
                  <span className="text-purple-400 text-lg mt-0.5">💡</span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Tukar perangkat lama kamu dan dapatkan <span className="text-purple-400 font-bold">potongan harga instan</span> dihitung langsung oleh Gemini AI. Kamu hanya perlu membayar selisihnya.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nama Produk — input manual full width */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nama Produk Perangkat Lama <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: iPhone 13 Pro Max, Samsung Galaxy S23 Ultra"
                      className="input-field"
                      value={tradeInForm.oldDeviceName}
                      onChange={(e) => setTradeInForm({ ...tradeInForm, oldDeviceName: e.target.value })}
                    />
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Brand</label>
                    <select className="input-field appearance-none" value={tradeInForm.oldDeviceBrand} onChange={(e) => setTradeInForm({ ...tradeInForm, oldDeviceBrand: e.target.value })}>
                      {['Apple', 'Samsung', 'Google', 'Xiaomi', 'Asus', 'Oppo', 'Vivo', 'Realme', 'OnePlus', 'Lainnya'].map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>

                  {/* Kondisi */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Kondisi Perangkat</label>
                    <select className="input-field appearance-none" value={tradeInForm.oldDeviceCondition} onChange={(e) => setTradeInForm({ ...tradeInForm, oldDeviceCondition: e.target.value })}>
                      <option value="Brand New">Brand New — Masih segel</option>
                      <option value="Like New">Like New — Mulus tanpa bekas</option>
                      <option value="Good">Good — Bekas pakai normal</option>
                      <option value="Fair">Fair — Ada lecet/goresan</option>
                      <option value="Cracked">Cracked — Layar/body retak</option>
                    </select>
                  </div>

                  {/* Storage */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Kapasitas Penyimpanan</label>
                    <select className="input-field appearance-none" value={tradeInForm.oldDeviceStorage} onChange={(e) => setTradeInForm({ ...tradeInForm, oldDeviceStorage: e.target.value })}>
                      {['64GB', '128GB', '256GB', '512GB', '1TB'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* RAM */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Ukuran RAM</label>
                    <select className="input-field appearance-none" value={tradeInForm.oldDeviceRam} onChange={(e) => setTradeInForm({ ...tradeInForm, oldDeviceRam: e.target.value })}>
                      {['3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>

                  {/* Battery Health */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Battery Health (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="input-field"
                      placeholder="85"
                      value={tradeInForm.oldDeviceBatteryHealth}
                      onChange={(e) => setTradeInForm({ ...tradeInForm, oldDeviceBatteryHealth: Number(e.target.value) })}
                    />
                  </div>

                  {/* Kelengkapan */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Kelengkapan yang Disertakan <span className="text-slate-600 font-normal normal-case">(opsional)</span></label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Contoh: Dus original, charger, case, garansi iBox"
                      value={tradeInForm.oldDeviceAccessories}
                      onChange={(e) => setTradeInForm({ ...tradeInForm, oldDeviceAccessories: e.target.value })}
                    />
                  </div>

                  {/* Catatan Kondisi */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Catatan Kondisi <span className="text-slate-600 font-normal normal-case">(opsional)</span></label>
                    <textarea
                      rows="2"
                      className="input-field !py-3"
                      placeholder="Ceritakan kondisi fisik, ada lecet di mana, riwayat ganti layar, dll..."
                      value={tradeInForm.oldDeviceDescription}
                      onChange={(e) => setTradeInForm({ ...tradeInForm, oldDeviceDescription: e.target.value })}
                    />
                  </div>

                  {/* Foto Perangkat */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Foto Perangkat <span className="text-slate-600 font-normal normal-case">(opsional, maks. 4 foto)</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {/* Preview foto yang sudah dipilih */}
                      {tradeInImagePreviews.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                          <img src={src} alt={`foto-${i}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setTradeInImagePreviews(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {/* Tombol tambah foto */}
                      {tradeInImagePreviews.length < 4 && (
                        <label className="aspect-square rounded-xl border border-dashed border-slate-700 hover:border-purple-500/60 bg-slate-900/50 hover:bg-purple-500/5 flex flex-col items-center justify-center cursor-pointer transition-all gap-1">
                          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                          <span className="text-[9px] font-black uppercase text-slate-600 tracking-wider">Tambah</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files);
                              files.forEach(file => {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setTradeInImagePreviews(prev => {
                                    if (prev.length >= 4) return prev;
                                    return [...prev, reader.result];
                                  });
                                };
                                reader.readAsDataURL(file);
                              });
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1.5">Foto membantu seller memverifikasi kondisi perangkat lebih cepat.</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={tradeInSubmitting || !tradeInForm.oldDeviceName.trim()}
                  className="btn-primary w-full !py-4 font-black uppercase tracking-widest text-xs flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tradeInSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>AI sedang menghitung nilai tukar...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Hitung Nilai Tukar dengan AI</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {tradeInStep === 2 && tradeInAiValuation && (
              <div className="space-y-5">
                {/* AI Result Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-purple-950/40 border border-emerald-500/30 text-center space-y-2 shadow-xl">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 inline-block">
                    ✨ Rekomendasi Valuasi Pasar AI
                  </span>
                  <div className="text-4xl font-black text-emerald-400 mt-2">{formatPrice(tradeInAiValuation.price)}</div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed italic">&ldquo;{tradeInAiValuation.reasoning}&rdquo;</p>
                </div>

                {/* Perangkat lama summary */}
                <div className="px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3.5 text-xs">
                  <span className="text-2xl">📱</span>
                  <div>
                    <p className="font-bold text-white">{tradeInForm.oldDeviceName}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{tradeInForm.oldDeviceStorage} / {tradeInForm.oldDeviceRam} · Kondisi {tradeInForm.oldDeviceCondition} · Baterai {tradeInForm.oldDeviceBatteryHealth}%</p>
                  </div>
                </div>

                {/* Manual Price Override */}
                <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-purple-300">
                      Nominal Penawaran Tukar Tambah Anda
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Estimasi AI: {formatPrice(tradeInAiValuation.price)}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                    <input
                      type="number"
                      required
                      min="0"
                      className="input-field !pl-12 !text-lg font-bold text-emerald-400"
                      value={userOfferPrice}
                      onChange={(e) => setUserOfferPrice(Number(e.target.value))}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Anda dapat memodifikasi nominal penawaran harga sebelum dikirimkan ke Penjual untuk ditinjau.</p>
                </div>

                {/* Ringkasan harga */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-3">Rincian Perhitungan Selisih Pembayaran</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{device.name}</span>
                    <span className="font-bold text-white">{formatPrice(device.price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-400">Potongan Tukar Tambah ({tradeInForm.oldDeviceName})</span>
                    <span className="font-bold text-emerald-400">− {formatPrice(userOfferPrice || 0)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-white pt-3 border-t border-white/10">
                    <span>Perkiraan Sisa Tagihan</span>
                    <span className="text-emerald-400 text-xl">{formatPrice(Math.max(0, device.price - (userOfferPrice || 0)))}</span>
                  </div>
                </div>

                <p className="text-[11px] text-purple-300 text-center leading-relaxed font-medium bg-purple-500/10 p-3.5 rounded-2xl border border-purple-500/20">
                  ℹ️ Pengajuan Tukar Tambah akan dikirimkan ke Penjual untuk ditinjau. Setelah Penjual menyetujui, Anda dapat melanjutkan ke proses pembayaran checkout.
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setTradeInStep(1)}
                    className="px-6 py-3.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    ← Ubah Data
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmTradeInCheckout}
                    disabled={tradeInSubmitting}
                    className="flex-1 btn-primary !py-3.5 font-black uppercase tracking-widest text-xs flex justify-center items-center gap-2"
                  >
                    {tradeInSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mengirimkan Pengajuan...</span>
                      </>
                    ) : (
                      <span>📩 Kirim Pengajuan Tukar Tambah</span>
                    )}
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Full-Screen Preview Modal (No URL Navigation & Uncropped) */}
      {previewImageModal.isOpen && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setPreviewImageModal({ isOpen: false, url: '', title: '' })}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-[#0d1117] border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center pb-3 mb-3 border-b border-white/10 px-2">
              <h4 className="text-sm font-bold text-white tracking-wide">{previewImageModal.title || 'Pratinjau Foto'}</h4>
              <button
                type="button"
                onClick={() => setPreviewImageModal({ isOpen: false, url: '', title: '' })}
                className="w-8 h-8 rounded-full bg-white/10 text-slate-300 hover:text-white hover:bg-red-500/30 flex items-center justify-center text-xs transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="w-full flex items-center justify-center overflow-auto max-h-[75vh] p-2">
              <img
                src={previewImageModal.url}
                alt="Preview Detail"
                className="max-w-full max-h-[72vh] object-contain rounded-2xl border border-white/5 shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
