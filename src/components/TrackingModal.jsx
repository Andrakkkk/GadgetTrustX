'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';

export default function TrackingModal({ order, tradeIn, onClose }) {
  const [loading, setLoading] = useState(true);
  const [trackData, setTrackData] = useState(null);
  const [copiedResi, setCopiedResi] = useState(false);

  const isTradeInMode = Boolean(tradeIn);

  const waybill = isTradeInMode
    ? (tradeIn?.old_device_waybill || 'Belum Ada Resi')
    : (order?.waybillNumber || `GTX-${order?.id?.slice(-8)}`);

  const courier = isTradeInMode
    ? (tradeIn?.old_device_courier || 'JNE Express')
    : (order?.shippingCourier || 'JNE Express');

  const itemId = isTradeInMode ? tradeIn?.id : order?.id;

  useEffect(() => {
    if (!itemId) return;
    let isMounted = true;

    const fetchTracking = async () => {
      try {
        const queryUrl = isTradeInMode
          ? `/api/shipping/track?tradeInId=${tradeIn?.id}&resi=${encodeURIComponent(waybill)}&courier=${encodeURIComponent(courier)}`
          : `/api/shipping/track?orderId=${order?.id}&resi=${encodeURIComponent(waybill)}&courier=${encodeURIComponent(courier)}`;

        const res = await apiFetch(queryUrl);
        const data = await res.json();
        if (isMounted) setTrackData(data);
      } catch (err) {
        console.error('Tracking fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTracking();
    return () => {
      isMounted = false;
    };
  }, [itemId, waybill, courier, isTradeInMode, order?.id, tradeIn?.id]);

  if (!order && !tradeIn) return null;

  const isDelivered = isTradeInMode
    ? tradeIn?.status === 'completed' || tradeIn?.old_device_received
    : trackData?.status === 'DELIVERED' || order?.status === 'Delivered' || order?.status === 'Completed';

  const isShipped = isTradeInMode
    ? tradeIn?.status === 'shipping' || tradeIn?.status === 'completed' || Boolean(tradeIn?.old_device_waybill)
    : order?.status === 'Shipped' || order?.status === 'Delivered' || order?.status === 'Completed' || Boolean(order?.waybillNumber);

  const handleCopyResi = () => {
    if (!waybill || waybill.includes('Belum Ada')) return;
    navigator.clipboard.writeText(waybill);
    setCopiedResi(true);
    setTimeout(() => setCopiedResi(false), 2000);
  };

  // Steps tracking ala Shopee
  const steps = isTradeInMode ? [
    { title: 'Pengajuan Disetujui', done: true, icon: '📝' },
    { title: 'Buyer Input Resi', done: Boolean(tradeIn?.old_device_waybill), icon: '📦' },
    { title: 'Dalam Pengiriman', done: isShipped, icon: '🚚' },
    { title: 'Seller Terima HP', done: isDelivered, icon: '🏡' },
  ] : [
    { title: 'Pesanan Dibuat', done: true, icon: '📝' },
    { title: 'Diproses Seller', done: true, icon: '📦' },
    { title: 'Dalam Pengiriman', done: isShipped, icon: '🚚' },
    { title: 'Pesanan Diterima', done: isDelivered, icon: '🏡' },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-panel !rounded-3xl w-full max-w-xl overflow-hidden border border-white/10 shadow-2xl relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Shopee-style */}
        <div className="p-6 border-b border-white/10 bg-slate-900/80 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl shadow-lg shadow-emerald-500/10">
              🚚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {isTradeInMode ? 'Lacak HP Lama Buyer' : 'Lacak Paket'}
                </span>
                <span className="text-xs text-slate-400 font-mono">#{itemId?.slice(0, 8)}</span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                {isTradeInMode ? `Pengiriman ${tradeIn?.old_device_name}` : 'Informasi Pengiriman Shopee-Style'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Visual Step Progress Bar ala Shopee */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/5 space-y-4">
            <div className="flex justify-between items-center relative">
              {/* Connecting Line */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-800 -z-0">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{
                    width: isDelivered ? '100%' : isShipped ? '66%' : '33%',
                  }}
                />
              </div>

              {steps.map((step, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center gap-1.5 flex-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-md ${
                      step.done
                        ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {step.done ? step.icon : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] font-bold leading-tight ${
                      step.done ? 'text-emerald-400 font-black' : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Courier & Resi Info Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                  Kurir Ekspedisi Pengirim
                </p>
                <p className="text-base font-bold text-white mt-0.5">
                  {courier} <span className="text-xs text-emerald-400 font-medium">({isTradeInMode ? 'HP Lama Buyer' : (order?.shippingService || 'REG')})</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                  Status Pengiriman
                </p>
                <span
                  className={`inline-block mt-1 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                    isDelivered
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : isShipped
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {isDelivered ? 'DITERIMA SELLER' : isShipped ? 'DALAM PENGIRIMAN' : 'MENUNGGU RESI'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Nomor Resi / AWB</p>
                <p className="text-base font-mono font-black text-amber-400 tracking-wider mt-0.5">{waybill}</p>
              </div>
              {waybill && !waybill.includes('Belum Ada') && (
                <button
                  onClick={handleCopyResi}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all border border-white/5 flex items-center gap-1.5"
                >
                  <span>{copiedResi ? '✓ Tersalin!' : '📋 Salin Resi'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Detailed Timeline */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <span>📍</span>
              <span>Riwayat Perjalanan Paket Live</span>
            </h4>

            {loading ? (
              <div className="py-10 text-center flex flex-col items-center justify-center gap-3 glass-panel">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400">Menghubungkan ke sistem kurir logistik...</p>
              </div>
            ) : trackData?.history?.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {trackData.history.map((item, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    {/* Circle Dot */}
                    <div
                      className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        idx === 0
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/40'
                          : 'bg-slate-900 border-slate-700 text-slate-500'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-slate-950 animate-pulse' : 'bg-slate-600'}`} />
                    </div>

                    <div className={`p-4 rounded-2xl border w-full transition-all ${
                      idx === 0 ? 'bg-slate-900/90 border-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'bg-slate-900/50 border-white/5'
                    }`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] font-bold ${idx === 0 ? 'text-emerald-400 font-black' : 'text-slate-400'}`}>
                          {item.date}
                        </span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                          {item.location}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${idx === 0 ? 'text-white font-bold' : 'text-slate-300'}`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-8 text-center text-slate-500 text-xs font-medium">
                Belum ada pergerakan resi logistik yang tercatat.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
