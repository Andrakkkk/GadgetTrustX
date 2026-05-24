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
  flyingImg.style.position = 'fixed';
  flyingImg.style.left = `${btnRect.left}px`;
  flyingImg.style.top = `${btnRect.top}px`;
  flyingImg.style.width = '80px';
  flyingImg.style.height = '80px';
  flyingImg.style.borderRadius = '50%';
  flyingImg.style.objectFit = 'cover';
  flyingImg.style.zIndex = '99999';
  flyingImg.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6)';
  flyingImg.style.transition = 'all 1.2s cubic-bezier(0.25, 1, 0.3, 1)';
  document.body.appendChild(flyingImg);
  
  // force reflow
  flyingImg.getBoundingClientRect();
  
  flyingImg.style.left = `${cartRect.left + cartRect.width/2 - 15}px`;
  flyingImg.style.top = `${cartRect.top + cartRect.height/2 - 15}px`;
  flyingImg.style.width = '30px';
  flyingImg.style.height = '30px';
  flyingImg.style.opacity = '0.5';
  flyingImg.style.transform = 'scale(0.3) rotate(360deg)';
  
  setTimeout(() => {
    flyingImg.remove();
    cartIcon.style.transform = 'scale(1.3)';
    setTimeout(() => cartIcon.style.transform = 'scale(1)', 300);
  }, 1200);
};

export default function DeviceCard({ device }) {
  const router = useRouter();
  const { user } = useAuth();
  const [realSellerRating, setRealSellerRating] = useState(device.seller.reputationScore);
  const [realDeviceRating, setRealDeviceRating] = useState(null);
  const [deviceReviewCount, setDeviceReviewCount] = useState(0);
  const [realSellerName, setRealSellerName] = useState(device.seller?.name || 'Unknown Seller');

  useEffect(() => {
    if (!device.seller?.id) return;

    fetch(`/api/reviews?sellerEmail=${encodeURIComponent(device.seller.id)}`)
      .then((res) => res.json())
      .then((data) => {
        const sellerReviews = data.reviews || [];
        if (sellerReviews.length > 0) {
          const avg = sellerReviews.reduce((acc, r) => acc + r.rating, 0) / sellerReviews.length;
          setRealSellerRating(avg.toFixed(1));
        }
      })
      .catch((error) => console.error('Failed to load seller reviews', error));

    fetch(`/api/reviews?deviceId=${encodeURIComponent(device.id)}`)
      .then((res) => res.json())
      .then((data) => {
        const deviceReviews = data.reviews || [];
        setDeviceReviewCount(deviceReviews.length);
        if (deviceReviews.length > 0) {
          const avgDevice = deviceReviews.reduce((acc, r) => acc + r.rating, 0) / deviceReviews.length;
          setRealDeviceRating(avgDevice.toFixed(1));
        }
      })
      .catch((error) => console.error('Failed to load device reviews', error));

    if (device.seller?.name) {
      setRealSellerName(device.seller.name);
    }
  }, [device.seller?.id, device.seller?.name, device.id]);

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    const triggerButton = e.currentTarget;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role === 'seller') {
      alert("Sellers cannot add products to the cart.");
      return;
    }
    if (user.email === device.seller?.id) {
      alert("Anda tidak bisa membeli produk Anda sendiri.");
      return;
    }
    if (device.stock > 0) {
      const res = await apiFetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: device.id, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menambahkan ke keranjang.');
        return;
      }
      window.dispatchEvent(new Event('cartUpdated'));
      flyToCartAnimation(triggerButton, device.image);
    }
  };

  const handleChat = (e) => {
    e.stopPropagation();
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.email === device.seller?.id) {
      alert("Anda tidak bisa melakukan chat dengan diri sendiri.");
      return;
    }
    window.dispatchEvent(new CustomEvent('openChat', { detail: device.seller }));
  };

  return (
    <div 
      onClick={() => router.push(`/product/${device.id}`)}
      className="glass-panel overflow-hidden card-hover group cursor-pointer flex flex-col h-full bg-slate-900/40"
    >
      <div className="relative h-56 w-full overflow-hidden bg-slate-800">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 opacity-80"></div>
        <img 
          src={device.image} 
          alt={device.name} 
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Floating Badges */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
           {device.verifiedByTrustX && (
              <div className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg backdrop-blur-md flex items-center shadow-2xl shadow-emerald-500/20 border border-emerald-400/50">
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4"></path></svg>
                Verified
              </div>
           )}
           {device.condition === 'Brand New' && (
              <div className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg backdrop-blur-md flex items-center shadow-2xl shadow-blue-500/20 border border-blue-400/50">
                Brand New
              </div>
           )}
        </div>

        <div className="absolute bottom-4 left-4 z-20">
           <div className="flex items-center gap-1.5">
              <div className="flex text-amber-400">
                 {[...Array(5)].map((_, i) => (
                   <svg key={i} className={`w-3 h-3 ${i < Math.floor(realDeviceRating || 5) ? 'fill-current' : 'text-slate-600'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                 ))}
              </div>
              <span className="text-[10px] font-black text-white/50 uppercase tracking-tighter">{deviceReviewCount} Reviews</span>
           </div>
        </div>
      </div>
      
      <div className="p-6 flex-grow flex flex-col">
        <div className="mb-4">
          <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mb-1">{device.brand}</p>
          <h3 className="font-bold text-xl text-white leading-tight group-hover:text-blue-400 transition-colors">{device.name}</h3>
        </div>

        <div className="flex items-center gap-3 mb-6">
           <div className="text-2xl font-black text-white">{formatPrice(device.price)}</div>
           {device.originalPrice && (
              <div className="text-sm text-slate-500 line-through font-medium">{formatPrice(device.originalPrice)}</div>
           )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-6">
           <div className="px-3 py-2 bg-slate-950/40 rounded-xl border border-white/5 flex flex-col">
              <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Memory</span>
              <span className="text-xs font-bold text-slate-200">{device.ram} RAM</span>
           </div>
           <div className="px-3 py-2 bg-slate-950/40 rounded-xl border border-white/5 flex flex-col">
              <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Storage</span>
              <span className="text-xs font-bold text-slate-200">{device.storage}</span>
           </div>
        </div>
        
        <div className="mt-auto flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-black text-white shadow-lg">
                {realSellerName.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Seller</p>
                <p className="text-xs font-bold text-white">{realSellerName}</p>
              </div>
            </div>
            <div className="text-right">
               <div className="text-amber-400 text-xs font-black">★ {realSellerRating}</div>
            </div>
          </div>

          {device.seller.badges?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {device.seller.badges.slice(0, 3).map((badge) => (
                <span key={badge} className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-blue-300">
                  {badge}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button 
              onClick={handleChat}
              className="p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-700/50 text-white transition-all border border-slate-700/50"
              title="Chat with seller"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            </button>
            <button 
              onClick={handleAddToCart}
              disabled={!device.stock || device.stock <= 0}
              className={`flex-grow py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${device.stock > 0 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
            >
              {device.stock > 0 ? 'Add to Cart' : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
