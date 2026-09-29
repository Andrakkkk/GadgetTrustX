'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/utils/formatPrice';

export default function TradeInCard({ device, onNego, onOpenDetail }) {
  const router = useRouter();
  const { user } = useAuth();

  const handleBuy = (dev) => { 
    if (user && user.email === dev.seller?.id) {
      alert("Anda tidak bisa membeli produk Anda sendiri.");
      return;
    }
    router.push(`/product/${dev.id}`); 
  };

  return (
    <div className="glass-panel p-2.5 sm:p-5 flex flex-col justify-between hover:border-purple-500/50 transition-all h-full group relative overflow-hidden rounded-2xl">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
          <span className="text-[8px] sm:text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-1.5 sm:px-2.5 py-0.5 rounded border border-purple-500/20">
            {device.brand || 'BEKAS'}
          </span>
          <span className="bg-purple-600 text-white text-[7px] sm:text-[9px] font-black px-1.5 sm:px-2.5 py-0.5 rounded-md tracking-wider uppercase">
            HP BEKAS
          </span>
        </div>

        <div
          className="h-28 sm:h-44 mb-2 sm:mb-4 overflow-hidden rounded-xl sm:rounded-2xl bg-slate-900 relative border border-white/5 cursor-pointer group/img"
          onClick={() => onOpenDetail(device)}
        >
          <img src={device.image} alt={device.name} className="w-full h-full object-contain p-1.5 group-hover/img:scale-110 transition-transform duration-500" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-[9px] font-bold text-white transition-opacity">
            🔍 Detail
          </div>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <h3
            className="text-xs sm:text-lg font-bold text-white leading-tight cursor-pointer hover:text-purple-400 transition-colors line-clamp-2"
            onClick={() => onOpenDetail(device)}
          >
            {device.name}
          </h3>

          {/* Info Penjual */}
          <div className="flex items-center gap-1 text-[9px] sm:text-xs text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
            <span className="truncate">Penjual: <strong className="text-slate-200">{device.seller?.name || 'Seller'}</strong></span>
          </div>

          <p className="text-sm sm:text-2xl font-black text-emerald-400 pt-0.5 sm:pt-1">{formatPrice(device.price)}</p>

          {/* Specs Badges */}
          <div className="flex flex-wrap gap-1 pt-1">
            {device.ram && <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 text-[8px] sm:text-[10px] font-bold rounded">{device.ram}</span>}
            <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 text-[8px] sm:text-[10px] font-bold rounded">{device.storage || '256GB'}</span>
            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[8px] sm:text-[10px] font-bold rounded border border-amber-500/20">{device.condition || 'Good'}</span>
            {device.batteryHealth && <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] sm:text-[10px] font-bold rounded border border-emerald-500/20">BH {device.batteryHealth}%</span>}
          </div>
        </div>
      </div>

      <div className="pt-2 sm:pt-4 border-t border-white/5 flex gap-1.5 mt-2 sm:mt-4">
        {device.stock === 0 ? (
          <button disabled className="w-full py-1.5 sm:py-2.5 bg-slate-900 text-slate-600 font-black uppercase tracking-widest text-[9px] sm:text-[10px] rounded-lg sm:rounded-xl cursor-not-allowed">Stok Habis</button>
        ) : (
          <>
            <button onClick={() => handleBuy(device)} className="flex-1 btn-primary !py-1.5 sm:!py-2.5 !text-[9px] sm:!text-[10px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl">Beli</button>
            <button onClick={() => onNego(device)} className="flex-1 py-1.5 sm:py-2.5 bg-slate-900 text-slate-400 hover:text-white font-black uppercase tracking-widest text-[9px] sm:text-[10px] rounded-lg sm:rounded-xl border border-white/5 transition-all">Nego</button>
          </>
        )}
      </div>
    </div>
  );
}
