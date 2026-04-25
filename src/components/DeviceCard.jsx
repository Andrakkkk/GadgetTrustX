import { formatPrice } from '@/utils/formatPrice';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const flyToCartAnimation = (e, imageSrc) => {
  const btn = e.currentTarget;
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
  const [realSellerName, setRealSellerName] = useState(device.seller.name);

  useEffect(() => {
    const savedUsers = localStorage.getItem('gadgetTrustX_users');
    if (savedUsers) {
      const allUsers = JSON.parse(savedUsers);
      const sellerInfo = allUsers.find(u => u.email === device.seller.id);
      if (sellerInfo && sellerInfo.name) {
        setRealSellerName(sellerInfo.name);
      }
    }

    const saved = localStorage.getItem('gadgetTrustX_reviews');
    if (saved) {
      const allReviews = JSON.parse(saved);
      const sellerReviews = allReviews.filter(r => r.sellerEmail === device.seller.id);
      if (sellerReviews.length > 0) {
        const avg = sellerReviews.reduce((acc, r) => acc + r.rating, 0) / sellerReviews.length;
        setRealSellerRating(avg.toFixed(1));
      }

      const deviceReviews = allReviews.filter(r => r.deviceId === device.id);
      setDeviceReviewCount(deviceReviews.length);
      if (deviceReviews.length > 0) {
        const avgDevice = deviceReviews.reduce((acc, r) => acc + r.rating, 0) / deviceReviews.length;
        setRealDeviceRating(avgDevice.toFixed(1));
      }
    }
  }, [device.seller.id, device.id]);

  return (
    <div 
      onClick={() => router.push(`/product/${device.id}`)}
      className="glass-panel overflow-hidden card-hover group cursor-pointer flex flex-col h-full relative"
    >
      <div className="relative h-48 w-full bg-slate-800 overflow-hidden">
        {/* Placeholder image representation since we are using dummy images */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10 opacity-60"></div>
        <img 
          src={device.image} 
          alt={device.name} 
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        />
        {device.verifiedByTrustX && (
          <div className="absolute top-3 right-3 z-20 bg-emerald-500/90 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm flex items-center shadow-lg">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Verified
          </div>
        )}
      </div>
      
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-2">
          <div className="flex-grow">
            <p className="text-xs text-blue-400 font-medium mb-1">{device.brand}</p>
            <h3 className="font-bold text-lg text-slate-100 leading-tight line-clamp-2">{device.name}</h3>
            {realDeviceRating && (
              <div className="flex items-center mt-1">
                <span className="text-amber-400 text-xs font-bold flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                  {realDeviceRating}
                </span>
                <span className="text-slate-500 text-[10px] ml-1">({deviceReviewCount})</span>
              </div>
            )}
          </div>
          <span className="text-lg font-bold text-emerald-400 whitespace-nowrap">{formatPrice(device.price)}</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3 mb-4 text-xs">
          <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded-md border border-slate-700">{device.ram} RAM</span>
          <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded-md border border-slate-700">{device.storage}</span>
          {device.condition && (
            <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded-md border border-purple-500/30">
              {device.condition}
            </span>
          )}
          <span className={`px-2 py-1 rounded-md border font-semibold ${device.stock > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
            {device.stock > 0 ? `Stock: ${device.stock}` : 'Out of Stock'}
          </span>
        </div>
        
        <div className="mt-auto pt-4 border-t border-slate-700/50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white mr-2">
                {realSellerName.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-slate-300">{realSellerName}</p>
                <div className="flex items-center">
                  <span className="text-[10px] text-amber-400">★ {realSellerRating}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (user && user.email === device.seller.id) {
                  alert("Anda tidak bisa melakukan chat dengan diri sendiri.");
                  return;
                }
                window.dispatchEvent(new CustomEvent('openChat', { detail: device.seller }));
              }}
              className="flex-1 text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg font-medium flex justify-center items-center transition-colors"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              Chat
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (device.stock > 0) {
                  const saved = localStorage.getItem('gadgetTrustX_cart');
                  const cart = saved ? JSON.parse(saved) : [];
                  const existingItemIndex = cart.findIndex(item => item.id === device.id);
                  const currentCount = existingItemIndex !== -1 ? (cart[existingItemIndex].cartQty || 1) : 0;
                  
                  if (currentCount >= device.stock) {
                    alert(`Sorry, the seller only has ${device.stock} in stock!`);
                    return;
                  }
                  
                  if (existingItemIndex !== -1) {
                    cart[existingItemIndex].cartQty = currentCount + 1;
                  } else {
                    cart.push({ ...device, cartQty: 1 });
                  }
                  
                  localStorage.setItem('gadgetTrustX_cart', JSON.stringify(cart));
                  window.dispatchEvent(new Event('cartUpdated'));
                  flyToCartAnimation(e, device.image);
                }
              }}
              disabled={!device.stock || device.stock <= 0}
              className={`flex-1 text-xs px-3 py-2 rounded-lg font-medium flex justify-center items-center transition-colors ${device.stock > 0 ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              {device.stock > 0 ? 'Add to Cart' : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
