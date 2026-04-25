'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/utils/formatPrice';
import AuthGuard from '@/components/AuthGuard';
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

  useEffect(() => {
    // Load device
    const savedDevices = localStorage.getItem('gadgetTrustX_devices');
    if (savedDevices) {
      const allDevices = JSON.parse(savedDevices);
      const found = allDevices.find(d => d.id === id);
      if (found) setDevice(found);
    }
    
    // Load reviews for this device/seller
    const savedReviews = localStorage.getItem('gadgetTrustX_reviews');
    if (savedReviews) {
      const allReviews = JSON.parse(savedReviews);
      setReviews(allReviews.filter(r => r.deviceId === id));
    }
    
    setLoading(false);
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (!device) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-bold text-slate-300 mb-4">Product Not Found</h1>
        <p className="text-slate-500 mb-8">This item may have been removed or does not exist.</p>
        <button onClick={() => router.push('/marketplace')} className="btn-primary px-6 py-2">Back to Marketplace</button>
      </div>
    );
  }

  const handleAddToCart = (e) => {
    if (!user) {
      alert("Please login as a Buyer to add items to cart.");
      return;
    }
    if (user.role !== 'buyer') {
      alert("Only buyers can add items to the cart.");
      return;
    }
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
  };

  const handleChat = () => {
    if (!user) {
      alert("Please login to chat with the seller.");
      return;
    }
    window.dispatchEvent(new CustomEvent('openChat', { detail: device.seller }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-400 mb-6 flex items-center space-x-2">
        <button onClick={() => router.push('/marketplace')} className="hover:text-blue-400">Marketplace</button>
        <span>/</span>
        <span className="text-slate-500">{device.category}</span>
        <span>/</span>
        <span className="text-slate-200">{device.name}</span>
      </div>

      <div className="glass-panel p-6 md:p-10 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-700 shadow-xl group">
              <img 
                src={device.image} 
                alt={device.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {device.verifiedByTrustX && (
                <div className="absolute top-4 right-4 bg-emerald-500/90 text-white font-bold px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center shadow-lg">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  TrustX Verified
                </div>
              )}
            </div>
            
            {/* Seller Info Card */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white text-xl mr-3">
                  {device.seller.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-white">{device.seller.name}</h4>
                  <div className="flex items-center text-sm">
                    <span className="text-amber-400 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                      {device.seller.reputationScore}
                    </span>
                    <span className="text-slate-400 mx-2">•</span>
                    <span className="text-slate-400 text-xs">Active Seller</span>
                  </div>
                </div>
              </div>
              <button onClick={handleChat} className="btn-secondary text-sm px-4 py-2 flex items-center bg-slate-700 hover:bg-slate-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                Chat
              </button>
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-white mb-2">{device.name}</h1>
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium border border-blue-500/30">
                {device.brand}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${device.stock > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                {device.stock > 0 ? `In Stock: ${device.stock}` : 'Out of Stock'}
              </span>
            </div>

            <div className="mb-8">
              <span className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Price</span>
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400 mt-1">
                {formatPrice(device.price)}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {device.isTradeIn && (
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-center">
                  <p className="text-xs text-slate-400 mb-1">Condition</p>
                  <p className="font-semibold text-white">{device.condition}</p>
                </div>
              )}
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-center">
                <p className="text-xs text-slate-400 mb-1">RAM</p>
                <p className="font-semibold text-white">{device.ram}</p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-center">
                <p className="text-xs text-slate-400 mb-1">Storage</p>
                <p className="font-semibold text-white">{device.storage}</p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-center">
                <p className="text-xs text-slate-400 mb-1">Chipset</p>
                <p className="font-semibold text-white truncate px-1" title={device.chipset || '-'}>{device.chipset || '-'}</p>
              </div>
            </div>

            <div className="mb-8 flex-grow">
              <h3 className="text-lg font-bold text-white mb-3 border-b border-slate-700 pb-2">Description</h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                {device.description || "No detailed description provided by the seller."}
              </p>
            </div>

            <div className="flex gap-4 mt-auto">
              <button 
                onClick={handleAddToCart}
                disabled={!device.stock || device.stock <= 0}
                className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all shadow-lg ${device.stock > 0 ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                {device.stock > 0 ? 'Add to Cart' : 'Sold Out'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="glass-panel p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center mb-4 md:mb-0">
            <svg className="w-6 h-6 mr-2 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            Product Reviews ({reviews.length})
            {reviews.length > 0 && (
              <span className="ml-3 text-lg font-normal text-slate-300 bg-slate-800 px-3 py-1 rounded-full">
                {(reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)} Average
              </span>
            )}
          </h2>
          {reviews.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button onClick={() => setReviewFilter(0)} className={`px-3 py-1 rounded-lg text-sm border whitespace-nowrap transition-colors ${reviewFilter === 0 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>All</button>
              {[5,4,3,2,1].map(star => (
                <button key={star} onClick={() => setReviewFilter(star)} className={`px-3 py-1 rounded-lg text-sm border flex items-center transition-colors ${reviewFilter === star ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                  {star} <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {reviews.length === 0 ? (
          <div className="text-center p-8 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <p className="text-slate-400">No reviews yet. Buy this device to be the first to leave a review!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.filter(r => reviewFilter === 0 || r.rating === reviewFilter).map(review => (
              <div 
                key={review.id} 
                className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 cursor-pointer hover:border-blue-500 transition-colors shadow-lg"
                onClick={() => setSelectedReview(review)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold mr-3">
                      {review.buyerName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{review.buyerName}</p>
                      <p className="text-xs text-slate-500">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    ))}
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-3 line-clamp-3">{review.comment}</p>
                {review.image && (
                  <div className="relative group">
                    <img src={review.image} alt="Review attachment" className="w-full h-40 object-cover bg-slate-900 rounded-lg border border-slate-700/50" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <span className="text-white text-sm font-semibold bg-black/60 px-3 py-1 rounded-full flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                        Click to expand
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedReview(null)}>
          <div className="bg-slate-900 max-w-4xl w-full rounded-2xl flex flex-col md:flex-row overflow-hidden border border-slate-700 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedReview(null)} className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-red-500 z-10 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            {selectedReview.image && (
              <div className="md:w-1/2 bg-black flex items-center justify-center p-4 min-h-[300px]">
                <img src={selectedReview.image} className="max-h-[80vh] max-w-full object-contain" alt="Review Photo" />
              </div>
            )}
            <div className={`p-8 flex flex-col ${selectedReview.image ? 'md:w-1/2' : 'w-full'} max-h-[80vh] overflow-y-auto bg-slate-800`}>
               <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-3">Detail Ulasan</h3>
               <div className="flex items-center mb-6">
                 <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl mr-4 shadow-inner">
                   {selectedReview.buyerName.charAt(0)}
                 </div>
                 <div>
                   <p className="font-bold text-white text-lg">{selectedReview.buyerName}</p>
                   <p className="text-sm text-slate-400">{selectedReview.date}</p>
                 </div>
               </div>
               <div className="flex text-amber-400 mb-6 bg-slate-900/50 p-3 rounded-lg w-fit">
                 {[...Array(5)].map((_, i) => (
                   <svg key={i} className={`w-6 h-6 ${i < selectedReview.rating ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                 ))}
               </div>
               <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-700/50 flex-grow">
                 <p className="text-slate-300 text-base leading-relaxed whitespace-pre-wrap">{selectedReview.comment}</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
