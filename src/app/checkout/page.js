'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/AuthGuard';
import ShippingSelector from '@/components/ShippingSelector';
import { formatPrice } from '@/utils/formatPrice';
import Link from 'next/link';
import Script from 'next/script';
import { apiFetch } from '@/lib/api-client';

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [snapReady, setSnapReady] = useState(false);
  const [error, setError] = useState('');
  const [shippingOption, setShippingOption] = useState({
    courierName: 'JNE Express',
    service: 'REG',
    cost: 18000,
    etd: '1-2 Hari',
  });
  const [tradeInInfo, setTradeInInfo] = useState(null);
  const [showMobileCheckoutDrawer, setShowMobileCheckoutDrawer] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const rawTradeIn = localStorage.getItem('trade_in_checkout');
        if (rawTradeIn) {
          setTradeInInfo(JSON.parse(rawTradeIn));
        }
      } catch (e) {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Check if Midtrans Snap script is already loaded in window
  useEffect(() => {
    const checkSnap = () => {
      if (typeof window !== 'undefined' && window.snap) {
        setSnapReady(true);
        return true;
      }
      return false;
    };

    if (!checkSnap()) {
      const interval = setInterval(() => {
        if (checkSnap()) {
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, []);

  // Load selected cart items from sessionStorage
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      const raw = sessionStorage.getItem('checkout_items');
      if (!raw) {
        router.replace('/cart');
        return;
      }
      try {
        const items = JSON.parse(raw);
        if (!items.length) { router.replace('/cart'); return; }
        setCartItems(items);
      } catch {
        router.replace('/cart');
      }
      setIsLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [user, router]);

  const itemsSubtotal = cartItems.reduce((sum, item) => sum + item.price * (item.cartQty || 1), 0);

  // Estimasi berat per kategori (gram)
  const estimateWeightGrams = (item) => {
    const cat = (item.category || '').toLowerCase();
    if (cat === 'laptop') return 1800;
    if (cat === 'tablet') return 600;
    if (cat === 'smartwatch') return 150;
    if (cat === 'accessory') return 200;
    return 500; // smartphone default
  };

  const totalWeightGrams = cartItems.reduce((sum, item) => sum + estimateWeightGrams(item) * (item.cartQty || 1), 0);
  const isValidTradeInId = Boolean(tradeInInfo?.tradeInId && String(tradeInInfo.tradeInId) !== 'null' && String(tradeInInfo.tradeInId) !== 'undefined');
  const isTradeInMatching = isValidTradeInId && cartItems.length > 0 && cartItems.some(i => String(i.id || i.deviceId) === String(tradeInInfo.targetDeviceId) || true);
  const tradeInDiscount = isTradeInMatching && tradeInInfo?.discount ? Math.min(Number(tradeInInfo.discount) || 0, itemsSubtotal) : 0;
  const activeTradeInId = isTradeInMatching ? String(tradeInInfo.tradeInId) : null;
  const grandTotal = Math.max(0, itemsSubtotal - tradeInDiscount + (shippingOption?.cost || 0));
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const selectedIds = cartItems
    .map((item) => item.cartItemId || item.id)
    .filter((id) => id && UUID_REGEX.test(String(id)));

  // Gunakan lokasi seller dari produk pertama sebagai origin ongkir
  // Jika ada multi-seller, tampilkan semua lokasi unik
  const uniqueOrigins = [...new Set(cartItems.map(i => i.location || 'Jakarta'))];
  const originCity = uniqueOrigins[0] || 'Jakarta';

  const cancelOrder = async (orderId) => {
    try {
      await apiFetch('/api/payment/cancel', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      console.log('[cancel] Order cancelled:', orderId);
    } catch (e) {
      console.error('[cancel] Failed to cancel order:', e);
    }
  };

  const handlePay = useCallback(async () => {
    if (!snapReady) {
      setError('Sistem pembayaran belum siap. Tunggu sebentar lalu coba lagi.');
      return;
    }
    setIsProcessing(true);
    setError('');

    try {
      const res = await apiFetch('/api/payment/create-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItemIds: selectedIds,
          shippingFee: shippingOption?.cost || 0,
          shippingCourier: shippingOption?.courierName || 'JNE Express',
          shippingService: shippingOption?.service || 'REG',
          tradeInId: activeTradeInId,
          tradeInDiscount: tradeInDiscount,
          tradeInDeviceId: tradeInInfo?.targetDeviceId || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal memulai pembayaran.');
        setIsProcessing(false);
        return;
      }

      // Open Midtrans Snap popup
      window.snap.pay(data.snapToken, {
        onSuccess: async (result) => {
          console.log('[Midtrans] onSuccess fired:', result);
          try {
            const confirmRes = await apiFetch('/api/payment/confirm', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.orderId,
                midtransResult: result,
                paymentFinalStatus: 'paid',
                cartItemIds: data.cartItemIds,
              }),
            });
            const confirmData = await confirmRes.json();
            console.log('[confirm] response:', confirmRes.status, confirmData);
          } catch (e) {
            console.error('[confirm] network/parse error:', e);
          }
          sessionStorage.removeItem('checkout_items');
          localStorage.removeItem('trade_in_checkout');
          window.dispatchEvent(new Event('cartUpdated'));
          router.push(`/checkout/success?order_id=${data.orderId}`);
        },
        onPending: async (result) => {
          console.log('[Midtrans] onPending fired:', result);
          try {
            await apiFetch('/api/payment/confirm', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.orderId,
                midtransResult: result,
                paymentFinalStatus: 'processing',
              }),
            });
          } catch (e) {
            console.error('[confirm/pending] error:', e);
          }
          try {
            localStorage.setItem('pending_payment_' + data.orderId, JSON.stringify(result));
          } catch (e) {}
          sessionStorage.removeItem('checkout_items');
          window.dispatchEvent(new Event('cartUpdated'));
          router.push(`/checkout/success?order_id=${data.orderId}&status=pending`);
        },
        onError: async (result) => {
          console.error('[Midtrans] onError:', result);
          setError('Pembayaran gagal. Silakan coba lagi.');
          setIsProcessing(false);
        },
        onClose: async () => {
          console.log('[Midtrans] onClose — user menutup popup tanpa membatalkan order');
          setIsProcessing(false);
        },
      });
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setIsProcessing(false);
    }
  }, [snapReady, selectedIds, shippingOption, router]);

  if (user?.role !== 'buyer') {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-panel p-10 text-center max-w-md">
            <h3 className="text-xl font-bold text-white mb-2">Akses Dibatasi</h3>
            <p className="text-slate-500">Hanya Buyer yang bisa mengakses checkout.</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Parse destination city from user's address
  const addressParts = (user?.address || '').split(',');
  const destinationCity = addressParts.length >= 2 ? addressParts[addressParts.length - 2].trim() : 'Jakarta';

  return (
    <AuthGuard>
      {/* Load Midtrans Snap.js */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
        onLoad={() => setSnapReady(true)}
        onError={() => setError('Gagal memuat sistem pembayaran. Refresh halaman.')}
      />

      <div className="min-h-screen pb-20 pt-32">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="mb-10">
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-2">GadgetTrustX Marketplace</p>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
              Konfirmasi <span className="text-blue-500">Pesanan</span>
            </h1>
            <p className="text-slate-500 text-sm mt-2">Periksa kembali item & kurir pengiriman sebelum melanjutkan pembayaran.</p>
          </div>

          {isLoading ? (
            <div className="glass-panel p-20 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
              {/* Item List & Shipping Selector */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                    {cartItems.length} Item Dipilih
                  </h2>
                  <div className="space-y-3">
                    {cartItems.map((item, index) => (
                      <div
                        key={index}
                        className="glass-panel p-5 flex items-center gap-5"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-contain rounded-xl bg-[#0a0f1a] p-1.5 shadow-lg flex-shrink-0"
                        />
                        <div className="flex-grow min-w-0">
                          <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">{item.brand}</p>
                          <h3 className="text-base font-bold text-white truncate">{item.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-slate-400 text-xs">
                              {item.cartQty || 1}x &nbsp;
                              <span className="text-white font-bold">{formatPrice(item.price)}</span>
                            </p>
                            {item.location && (
                              <span className="text-[9px] font-black uppercase tracking-wider text-blue-400/70 flex items-center gap-0.5">
                                📍 {item.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-black text-white">{formatPrice(item.price * (item.cartQty || 1))}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Selector Component — origin dari lokasi seller produk */}
                <ShippingSelector
                  originCity={originCity}
                  destinationCity={destinationCity}
                  totalWeightGrams={totalWeightGrams}
                  onSelectShipping={setShippingOption}
                />

                {/* Back to Cart */}
                <Link
                  href="/cart"
                  className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors pt-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Kembali ke Keranjang
                </Link>
              </div>

              {/* Order Summary & Pay (Desktop Only) */}
              <div className="hidden lg:block lg:col-span-5">
                <div className="glass-panel p-6 sticky top-24 space-y-4">
                  <h3 className="text-sm font-black text-white border-b border-white/5 pb-2.5 uppercase tracking-wider">
                    Ringkasan Pembayaran
                  </h3>

                  <div className="space-y-2.5 text-xs font-medium">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal ({cartItems.length} item)</span>
                      <span className="text-white font-bold">{formatPrice(itemsSubtotal)}</span>
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span>Ongkir ({shippingOption?.courierName?.split(' ')[0]} - {shippingOption?.service})</span>
                      <span className="text-blue-400 font-bold">{formatPrice(shippingOption?.cost || 0)}</span>
                    </div>

                    {tradeInDiscount > 0 && (
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>Tukar Tambah ({tradeInInfo?.oldDeviceName})</span>
                        <span>- {formatPrice(tradeInDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-400">
                      <span>Biaya Layanan</span>
                      <span className="text-emerald-400 font-bold">Gratis</span>
                    </div>

                    <div className="flex justify-between pt-3 border-t border-white/5 items-baseline">
                      <span className="text-xs font-black text-white uppercase tracking-wider">Total</span>
                      <span className="text-lg font-black text-emerald-400 glow-text">{formatPrice(grandTotal)}</span>
                    </div>
                  </div>

                  {/* Payment Methods Preview */}
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-2">Metode Pembayaran Resmi</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['GoPay', 'QRIS', 'BCA', 'Mandiri', 'BRI', 'BNI', 'Indomaret'].map((method) => (
                        <span
                          key={method}
                          className="text-[9px] font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700"
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-xs text-red-400 font-medium">{error}</p>
                    </div>
                  )}

                  {/* Pay Button */}
                  <button
                    id="btn-pay-now"
                    onClick={handlePay}
                    disabled={isProcessing || !snapReady}
                    className={`w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-xs flex justify-center items-center gap-2 transition-all ${
                      isProcessing || !snapReady
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : 'btn-primary shadow-xl shadow-blue-500/20 hover:scale-[1.02]'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Memproses...
                      </>
                    ) : !snapReady ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Memuat sistem pembayaran...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Bayar Sekarang — {formatPrice(grandTotal)}
                      </>
                    )}
                  </button>

                  <p className="text-[9px] text-slate-500 font-medium text-center flex items-center justify-center gap-1">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Pembayaran & Ongkir terverifikasi via Midtrans
                  </p>
                </div>
              </div>

            </div>
          )}

        {/* Fixed Floating Bottom Bar & Pop-up Order Summary Sheet for Mobile (Checkout Style) */}
        {!isLoading && cartItems.length > 0 && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 animate-fade-in-up">
            
            {/* Pop-up Order Summary Drawer (Expands directly above sticky bottom bar) */}
            {showMobileCheckoutDrawer && (
              <div
                className="bg-[#0d1117]/98 border-t border-x border-white/10 backdrop-blur-2xl rounded-t-3xl p-4 shadow-[0_-15px_40px_rgba(0,0,0,0.9)] space-y-3 animate-scale-in border-b-0"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white uppercase tracking-wider">Ringkasan Pembayaran</span>
                    <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full">{cartItems.length} item</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMobileCheckoutDrawer(false)}
                    className="text-slate-400 hover:text-white text-xs font-bold px-2.5 py-1 bg-white/5 rounded-lg border border-white/10"
                  >
                    ✕ Tutup
                  </button>
                </div>

                <div className="space-y-2 text-xs font-medium">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal ({cartItems.length} item)</span>
                    <span className="text-white font-bold">{formatPrice(itemsSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Ongkir ({shippingOption?.courierName?.split(' ')[0]} - {shippingOption?.service})</span>
                    <span className="text-blue-400 font-bold">{formatPrice(shippingOption?.cost || 0)}</span>
                  </div>
                  {tradeInDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Tukar Tambah ({tradeInInfo?.oldDeviceName})</span>
                      <span>- {formatPrice(tradeInDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Biaya Layanan</span>
                    <span className="text-emerald-400 font-bold">Gratis</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10 items-baseline">
                    <span className="text-xs font-black text-white uppercase tracking-wider">Total Pembayaran</span>
                    <span className="text-base font-black text-emerald-400">{formatPrice(grandTotal)}</span>
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Metode Pembayaran Resmi</p>
                    <div className="flex flex-wrap gap-1">
                      {['GoPay', 'QRIS', 'BCA', 'Mandiri', 'BRI', 'BNI', 'Indomaret'].map((m) => (
                        <span key={m} className="text-[8px] font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Mobile Bottom Pay Bar */}
            <div className="bg-[#0d1117]/95 border-t border-white/10 backdrop-blur-xl p-2.5 px-4 shadow-[0_-10px_30px_rgba(0,0,0,0.9)] flex items-center justify-between">
              <div
                onClick={() => setShowMobileCheckoutDrawer(!showMobileCheckoutDrawer)}
                className="flex flex-col cursor-pointer group"
              >
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Total Tagihan</span>
                  <span className="text-[10px] text-blue-400 font-black flex items-center gap-0.5 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                    {showMobileCheckoutDrawer ? 'Rincian ▾' : 'Rincian ▴'}
                  </span>
                </div>
                <span className="text-sm font-black text-emerald-400">{formatPrice(grandTotal)}</span>
              </div>

              <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing || !snapReady}
                className={`px-5 py-2.5 rounded-xl font-black uppercase text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all ${
                  isProcessing || !snapReady
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-blue-600 text-white shadow-blue-500/30'
                }`}
              >
                {isProcessing ? 'Memproses...' : !snapReady ? 'Memuat...' : 'Bayar Sekarang →'}
              </button>
            </div>

          </div>
        )}
        </div>
      </div>
    </AuthGuard>
  );
}
