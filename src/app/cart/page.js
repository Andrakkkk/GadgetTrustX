'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/AuthGuard';
import { formatPrice } from '@/utils/formatPrice';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';

export default function CartPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showMobileSummaryDrawer, setShowMobileSummaryDrawer] = useState(false);
  
  // Ref for debounced API syncs per cartItemId to prevent rapid network spam and UI freezing
  const syncTimeoutsRef = useRef({});

  // Clean up any pending debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(syncTimeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  // Fetch Cart Items
  const loadCart = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiFetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setCartItems((prev) => {
          const selectionMap = new Map(prev.map((i) => [i.cartItemId, i.selected]));
          return (data.items || []).map((item) => ({
            ...item,
            selected: selectionMap.has(item.cartItemId) ? selectionMap.get(item.cartItemId) : true,
          }));
        });
      }
    } catch (error) {
      console.error('Failed to load cart', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Optimistic Remove Item
  const handleRemove = async (index) => {
    const itemToRemove = cartItems[index];
    if (!itemToRemove) return;

    // Clear any pending debounce PATCH for this item
    if (syncTimeoutsRef.current[itemToRemove.cartItemId]) {
      clearTimeout(syncTimeoutsRef.current[itemToRemove.cartItemId]);
      delete syncTimeoutsRef.current[itemToRemove.cartItemId];
    }

    const previousCart = [...cartItems];
    const nextCart = cartItems.filter((_, i) => i !== index);

    // Instant local UI update
    setCartItems(nextCart);

    // Instant badge update
    const newTotalCount = nextCart.reduce((sum, it) => sum + (it.cartQty || 1), 0);
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: newTotalCount } }));

    try {
      const res = await apiFetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: itemToRemove.cartItemId }),
      });

      if (!res.ok) {
        setCartItems(previousCart);
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Gagal menghapus produk dari keranjang.');
      }
    } catch (err) {
      console.error('Delete cart item error:', err);
      setCartItems(previousCart);
      alert('Gagal menghapus produk dari keranjang. Terjadi kesalahan jaringan.');
    }
  };

  // Optimistic & Debounced Quantity Change
  const handleQuantityChange = (index, delta) => {
    const item = cartItems[index];
    if (!item) return;

    const currentQty = item.cartQty || 1;
    const nextQty = currentQty + delta;

    if (nextQty <= 0) {
      handleRemove(index);
      return;
    }

    if (nextQty > item.stock) {
      alert(`Stok hanya tersisa ${item.stock} unit!`);
      return;
    }

    // 1. Instant local state update (0ms latency, zero UI freeze)
    const updatedCart = [...cartItems];
    updatedCart[index] = { ...item, cartQty: nextQty };
    setCartItems(updatedCart);

    // 2. Instant Navbar badge update
    const newTotalCount = updatedCart.reduce((sum, it) => sum + (it.cartQty || 1), 0);
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: newTotalCount } }));

    // 3. Debounce server sync by 350ms to consolidate rapid clicks into a single PATCH
    const cartItemId = item.cartItemId;
    if (syncTimeoutsRef.current[cartItemId]) {
      clearTimeout(syncTimeoutsRef.current[cartItemId]);
    }

    syncTimeoutsRef.current[cartItemId] = setTimeout(async () => {
      delete syncTimeoutsRef.current[cartItemId];
      try {
        const res = await apiFetch('/api/cart', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItemId, quantity: nextQty }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data.error || 'Gagal memperbarui jumlah.');
          loadCart(); // Rollback to actual server state
        }
      } catch (err) {
        console.error('Failed to sync cart quantity:', err);
        loadCart(); // Rollback on error
      }
    }, 350);
  };

  // Toggle Single Selection
  const toggleSelect = (index) => {
    setCartItems((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], selected: !copy[index].selected };
      }
      return copy;
    });
  };

  // Memoized Calculations
  const selectedItems = useMemo(() => cartItems.filter((item) => item.selected), [cartItems]);
  const total = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.price * (item.cartQty || 1), 0),
    [selectedItems]
  );
  const allSelected = useMemo(
    () => cartItems.length > 0 && cartItems.every((i) => i.selected),
    [cartItems]
  );

  const toggleSelectAll = () => {
    const nextSelected = !allSelected;
    setCartItems((prev) => prev.map((i) => ({ ...i, selected: nextSelected })));
  };

  // Group cart items by Seller (Shopee Style)
  const groupedBySeller = useMemo(() => {
    return cartItems.reduce((acc, item, index) => {
      const sellerId = item.seller?.id || item.sellerEmail || item.seller?.name || 'TrustX Seller';
      const sellerName = item.seller?.name || 'Seller TrustX';
      if (!acc[sellerId]) {
        acc[sellerId] = {
          sellerId,
          sellerName,
          isVerified: Boolean(item.seller?.verified || item.seller?.isVerified),
          items: [],
        };
      }
      acc[sellerId].items.push({ ...item, originalIndex: index });
      return acc;
    }, {});
  }, [cartItems]);

  const toggleSellerSelect = (sellerId) => {
    const sellerItems = groupedBySeller[sellerId]?.items || [];
    const allSellerSelected = sellerItems.every((i) => i.selected);
    const nextState = !allSellerSelected;
    const sellerIndexSet = new Set(sellerItems.map((i) => i.originalIndex));
    setCartItems((prev) =>
      prev.map((item, idx) => (sellerIndexSet.has(idx) ? { ...item, selected: nextState } : item))
    );
  };

  const handleCheckout = () => {
    if (!selectedItems.length) return;
    setCheckingOut(true);
    sessionStorage.setItem('checkout_items', JSON.stringify(selectedItems));
    router.push('/checkout');
  };

  if (user?.role !== 'buyer') {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-panel p-10 text-center max-w-md">
            <h3 className="text-xl font-bold text-white mb-2">Akses Dibatasi</h3>
            <p className="text-slate-500 mb-0">Hanya Buyer yang bisa mengakses fitur keranjang.</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen pb-28 pt-20 sm:pt-28">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-4 sm:mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-2">
                Keranjang <span className="text-blue-500">Belanja</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                {cartItems.length} item total • {selectedItems.length} dipilih
              </p>
            </div>
          </div>

          {/* Skeleton Loader during initial fetch */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 animate-pulse">
              <div className="lg:col-span-8 space-y-4">
                <div className="h-14 bg-slate-900/60 rounded-2xl border border-white/5"></div>
                <div className="h-44 bg-slate-900/60 rounded-2xl border border-white/5"></div>
                <div className="h-44 bg-slate-900/60 rounded-2xl border border-white/5"></div>
              </div>
              <div className="hidden lg:block lg:col-span-4">
                <div className="h-64 bg-slate-900/60 rounded-2xl border border-white/5"></div>
              </div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="glass-panel p-10 sm:p-20 text-center animate-fade-in">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-800">
                <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Keranjang Kosong</h3>
              <p className="text-slate-500 mb-10">Gadget favorit berikutnya sedang menunggu di marketplace.</p>
              <Link href="/marketplace" className="btn-primary !px-10">
                Mulai Belanja
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 animate-fade-in">
              {/* Left Main Cart Section */}
              <div className={selectedItems.length > 0 ? 'lg:col-span-8 space-y-4' : 'lg:col-span-12 space-y-4'}>
                {/* Select All Bar (Shopee Style) */}
                <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-white/10 flex items-center justify-between bg-slate-900/60">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        allSelected ? 'bg-blue-600 border-blue-600' : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      {allSelected && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span className="text-xs sm:text-sm font-bold text-white">
                      Pilih Semua ({cartItems.length} produk)
                    </span>
                  </div>

                  {selectedItems.length > 0 && (
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400">
                      {selectedItems.length} Terpilih
                    </span>
                  )}
                </div>

                {/* Grouped Products by Seller (Shopee Style) */}
                {Object.values(groupedBySeller).map((sellerGroup) => {
                  const allSellerSelected = sellerGroup.items.every((i) => i.selected);
                  return (
                    <div
                      key={sellerGroup.sellerId}
                      className="glass-panel p-3.5 sm:p-5 rounded-2xl border border-white/10 space-y-3 bg-[#0d1117]/80"
                    >
                      {/* Store Header Row */}
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => toggleSellerSelect(sellerGroup.sellerId)}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                              allSellerSelected ? 'bg-blue-600 border-blue-600' : 'border-white/20 hover:border-white/40'
                            }`}
                          >
                            {allSellerSelected && (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-white">
                            <span className="text-blue-400">🏪</span>
                            <span>{sellerGroup.sellerName}</span>
                            {sellerGroup.isVerified && <span className="text-emerald-400 text-[10px] font-black">✓</span>}
                          </div>
                        </div>
                      </div>

                      {/* Store Products */}
                      <div className="space-y-4 pt-1">
                        {sellerGroup.items.map((item) => (
                          <div
                            key={item.cartItemId || item.originalIndex}
                            className={`flex gap-2.5 sm:gap-4 items-start transition-all ${
                              item.selected ? '' : 'opacity-55'
                            }`}
                          >
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={() => toggleSelect(item.originalIndex)}
                              className={`w-5 h-5 mt-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                item.selected ? 'bg-blue-600 border-blue-600' : 'border-white/20 hover:border-white/40'
                              }`}
                            >
                              {item.selected && (
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>

                            {/* Image */}
                            <div
                              onClick={() => router.push(`/product/${item.id}`)}
                              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#0a0f1a] border border-white/5 p-1.5 flex-shrink-0 cursor-pointer overflow-hidden flex items-center justify-center hover:border-blue-500/40 transition-all"
                            >
                              <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <h4
                                    onClick={() => router.push(`/product/${item.id}`)}
                                    className="text-xs sm:text-sm font-bold text-white line-clamp-2 cursor-pointer hover:text-blue-400 transition-colors"
                                  >
                                    {item.name}
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={() => handleRemove(item.originalIndex)}
                                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                    title="Hapus"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>

                                <p className="text-[10px] text-slate-400 font-medium mt-1">
                                  {item.ram ? `RAM ${item.ram}` : ''} {item.storage ? `• ${item.storage}` : ''} {item.condition ? `• ${item.condition}` : ''}
                                </p>
                              </div>

                              {/* Price + Stepper Row */}
                              <div className="flex items-center justify-between gap-2 mt-2">
                                <span className="text-xs sm:text-base font-black text-emerald-400">
                                  {formatPrice(item.price)}
                                </span>

                                <div className="flex items-center border border-white/10 rounded-lg bg-slate-900 overflow-hidden select-none">
                                  <button
                                    type="button"
                                    onClick={() => handleQuantityChange(item.originalIndex, -1)}
                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white font-bold text-sm hover:bg-white/10 active:bg-white/20 transition-all"
                                    aria-label="Kurangi jumlah"
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center text-xs font-black text-white">
                                    {item.cartQty || 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleQuantityChange(item.originalIndex, 1)}
                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white font-bold text-sm hover:bg-white/10 active:bg-white/20 transition-all"
                                    aria-label="Tambah jumlah"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Desktop Summary */}
              {selectedItems.length > 0 && (
                <div className="hidden lg:block lg:col-span-4 animate-scale-in">
                  <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 sticky top-24 bg-[#0d1117]/90 space-y-4">
                    <h3 className="text-sm font-black text-white border-b border-white/5 pb-2.5 uppercase tracking-wider flex items-center justify-between">
                      <span>Ringkasan Pesanan</span>
                      <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full">
                        {selectedItems.length} produk
                      </span>
                    </h3>

                    <div className="space-y-2.5 text-xs font-medium">
                      <div className="flex justify-between text-slate-400">
                        <span>Subtotal Produk</span>
                        <span className="text-white font-bold">{formatPrice(total)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Pajak (VAT)</span>
                        <span className="text-emerald-400 font-bold">0.00</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-white/5 items-baseline">
                        <span className="text-xs font-black text-white uppercase tracking-wider">Total Pembayaran</span>
                        <span className="text-lg font-black text-emerald-400">{formatPrice(total)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={checkingOut}
                      className="w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs flex justify-center items-center gap-2 btn-primary shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                      {`Checkout (${selectedItems.length}) →`}
                    </button>

                    <p className="text-[9px] text-slate-500 font-medium text-center flex items-center justify-center gap-1">
                      <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Transaksi 100% Aman via TrustX Engine
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Floating Bottom Bar & Pop-up Order Summary Sheet for Mobile */}
        {!isLoading && cartItems.length > 0 && selectedItems.length > 0 && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 animate-fade-in-up">
            {/* Pop-up Order Summary Drawer */}
            {showMobileSummaryDrawer && (
              <div
                className="bg-[#0d1117]/98 border-t border-x border-white/10 backdrop-blur-2xl rounded-t-3xl p-4 shadow-[0_-15px_40px_rgba(0,0,0,0.9)] space-y-3 animate-scale-in border-b-0"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white uppercase tracking-wider">Ringkasan Pesanan</span>
                    <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full">
                      {selectedItems.length} produk
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMobileSummaryDrawer(false)}
                    className="text-slate-400 hover:text-white text-xs font-bold px-2.5 py-1 bg-white/5 rounded-lg border border-white/10"
                  >
                    ✕ Tutup
                  </button>
                </div>

                <div className="space-y-2 text-xs font-medium">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal Produk</span>
                    <span className="text-white font-bold">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Pajak (VAT)</span>
                    <span className="text-emerald-400 font-bold">0.00</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10 items-baseline">
                    <span className="text-xs font-black text-white uppercase tracking-wider">Total Pembayaran</span>
                    <span className="text-base font-black text-emerald-400">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Main Mobile Bottom Bar */}
            <div className="bg-[#0d1117]/95 border-t border-white/10 backdrop-blur-xl p-2.5 px-4 shadow-[0_-10px_30px_rgba(0,0,0,0.9)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    allSelected ? 'bg-blue-600 border-blue-600' : 'border-white/20'
                  }`}
                >
                  {allSelected && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <div
                  onClick={() => setShowMobileSummaryDrawer(!showMobileSummaryDrawer)}
                  className="flex flex-col cursor-pointer group"
                >
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Total ({selectedItems.length})</span>
                    <span className="text-[10px] text-blue-400 font-black flex items-center gap-0.5 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                      {showMobileSummaryDrawer ? 'Rincian ▾' : 'Rincian ▴'}
                    </span>
                  </div>
                  <span className="text-sm font-black text-emerald-400">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkingOut}
                className="px-5 py-2.5 rounded-xl font-black uppercase text-xs flex items-center gap-1.5 shadow-lg bg-blue-600 text-white shadow-blue-500/30 active:scale-95 transition-all"
              >
                Checkout ({selectedItems.length}) →
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
