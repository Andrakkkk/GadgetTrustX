'use client';
import { formatPrice } from '@/utils/formatPrice';

export default function TradeInDetailModal({
  detailDeviceModal,
  setDetailDeviceModal,
  setPreviewImageModal,
  handleNego,
  user,
  router
}) {
  if (!detailDeviceModal) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in"
      onClick={() => setDetailDeviceModal(null)}
    >
      <div
        className="bg-[#0d1117] border border-purple-500/40 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-[0_24px_64px_rgba(0,0,0,0.8)] p-6 sm:p-8 space-y-6 text-white relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Badges */}
        <div className="flex justify-between items-start border-b border-white/10 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-purple-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-md tracking-wider uppercase">
                HP BEKAS
              </span>
              <span className="flex items-center gap-1 bg-[#090d14]/90 border border-emerald-500/35 text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md">
                <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
                </svg>
                TRUSTX VERIFIED
              </span>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                {detailDeviceModal.condition || 'Good'}
              </span>
            </div>
            <h3 className="text-2xl font-black text-white leading-tight">
              {detailDeviceModal.name}
            </h3>
            <p className="text-xs text-purple-400 font-bold uppercase tracking-widest mt-0.5">
              {detailDeviceModal.brand}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDetailDeviceModal(null)}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-xs font-bold border border-white/10"
          >
            ✕ Tutup
          </button>
        </div>

        {/* Info Penjual Card Block */}
        <div className="p-4 rounded-2xl bg-[#090d14] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md flex-shrink-0 border border-white/10">
              {(detailDeviceModal.seller?.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white">{detailDeviceModal.seller?.name || 'Penjual HP Bekas'}</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/30">Verified</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                <span>{detailDeviceModal.seller?.id || '-'}</span>
                <span>•</span>
                <span>📍 {detailDeviceModal.location || 'Jakarta'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const dev = detailDeviceModal;
              setDetailDeviceModal(null);
              handleNego(dev);
            }}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-purple-500/20 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>💬 Nego / Chat Penjual</span>
          </button>
        </div>

        {/* Product Image & Spec Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            className="sm:col-span-1 h-52 rounded-2xl bg-[#0a0f1a] p-2 border border-white/10 flex items-center justify-center cursor-pointer group/img relative overflow-hidden"
            onClick={() => setPreviewImageModal(detailDeviceModal.image)}
          >
            <img src={detailDeviceModal.image} alt={detailDeviceModal.name} className="max-w-full max-h-full object-contain p-2 group-hover/img:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-[9px] font-bold text-white transition-opacity">
              🔍 Perbesar Foto
            </div>
          </div>

          <div className="sm:col-span-2 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#090d14] rounded-xl border border-white/5">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Merek & Model</span>
              <p className="font-bold text-white leading-tight">{detailDeviceModal.brand} {detailDeviceModal.name}</p>
            </div>
            <div className="p-3 bg-[#090d14] rounded-xl border border-white/5">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">RAM / Storage</span>
              <p className="font-bold text-white">RAM {detailDeviceModal.ram || '-'} / Storage {detailDeviceModal.storage || '-'}</p>
            </div>
            <div className="p-3 bg-[#090d14] rounded-xl border border-white/5">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Kondisi Fisik</span>
              <p className="font-bold text-amber-400">{detailDeviceModal.condition || 'Good'}</p>
            </div>
            <div className="p-3 bg-[#090d14] rounded-xl border border-white/5">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Battery Health</span>
              <p className="font-bold text-emerald-400">{detailDeviceModal.batteryHealth ? `${detailDeviceModal.batteryHealth}%` : 'Normal'}</p>
            </div>
            <div className="col-span-2 p-4 bg-emerald-950/20 rounded-xl border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Harga Jual Bekas</span>
                <p className="font-black text-2xl text-emerald-400 mt-0.5">{formatPrice(detailDeviceModal.price)}</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-white/5">
                Nett / Nego
              </span>
            </div>
          </div>
        </div>

        {/* Description / Notes */}
        {detailDeviceModal.description && (
          <div className="p-4 rounded-2xl bg-[#090d14] border border-white/5 text-xs space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Catatan Kelengkapan & Deskripsi Fisik</span>
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">{detailDeviceModal.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setDetailDeviceModal(null)}
            className="py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors border border-slate-700 cursor-pointer"
          >
            ✕ Tutup
          </button>
          {detailDeviceModal.stock > 0 && user?.email !== detailDeviceModal.seller?.id && (
            <button
              type="button"
              onClick={() => {
                const dev = detailDeviceModal;
                setDetailDeviceModal(null);
                router.push(`/product/${dev.id}`);
              }}
              className="flex-1 btn-primary !py-3.5 font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🛒 Beli Sekarang ({formatPrice(detailDeviceModal.price)})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
