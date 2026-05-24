'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api-client';

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [contactsOpen, setContactsOpen] = useState(true);
  const [sendingImage, setSendingImage] = useState(false);
  const [negoInputId, setNegoInputId] = useState(null);
  const [negoValue, setNegoValue] = useState('');
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const loadChats = async () => {
      try {
        const res = await apiFetch('/api/chats');
        if (!res.ok) return;
        const data = await res.json();
        const myChats = data.chats || [];
        setChats(myChats);
        setUnreadCount(myChats.filter((chat) => {
          const lastMsg = chat.messages[chat.messages.length - 1];
          return lastMsg && lastMsg.senderId !== user.email && !lastMsg.read;
        }).length);
      } catch (error) {
        console.error('Failed to load chats', error);
      }
    };
    loadChats();
    window.addEventListener('chatUpdated', loadChats);
    const interval = setInterval(loadChats, 12000);
    return () => {
      window.removeEventListener('chatUpdated', loadChats);
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const pingPresence = () => apiFetch('/api/presence', { method: 'POST' }).catch(() => {});
    pingPresence();
    const interval = setInterval(pingPresence, 60000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') pingPresence();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Listen for 'openChat' event — supports optional product context
  useEffect(() => {
    if (!user) return;

    const handleOpenChat = async (e) => {
      const detail = e.detail; 
      
      if (!detail || !detail.id) {
        setIsOpen(true);
        setContactsOpen(true);
        return;
      }

      const seller = { id: detail.id, name: detail.name };
      const product = detail.product || null;

      if (user.email === seller.id) {
        alert("You cannot chat with yourself!");
        return;
      }

      setIsOpen(true);
      setContactsOpen(false);

      const existingChat = chats.find(c =>
        (c.buyerId === user.email && c.sellerId === seller.id) ||
        (c.sellerId === user.email && c.buyerId === seller.id)
      );
      const res = await apiFetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otherEmail: seller.id,
          ...(product ? {
            message: {
              type: 'product',
              text: `Tanya tentang produk: ${product.name}`,
              metadata: { product },
            },
          } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal membuka chat.');
        return;
      }

      setChats((items) => {
        const withoutCurrent = items.filter((chat) => chat.id !== data.chat.id);
        return [...withoutCurrent, data.chat];
      });
      setActiveChatId(data.chat.id);
      window.dispatchEvent(new Event('chatUpdated'));
    };

    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, [user, chats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, activeChatId]);

  if (!user) return null;

  const activeChat = chats.find(c => c.id === activeChatId);

  const getOtherName = (chat) => {
    if (!chat) return 'Unknown';
    const fallback = chat.buyerId === user.email ? (chat.sellerName || 'Unknown') : (chat.buyerName || 'Unknown');
    return fallback;
  };

  const reloadChats = async () => {
    try {
      const res = await apiFetch('/api/chats');
      if (!res.ok) return;
      const data = await res.json();
      setChats(data.chats || []);
    } catch (error) {
      console.error('Failed to reload chats', error);
    }
  };

  const getOtherLastSeenAt = (chat) => (
    chat?.buyerId === user.email ? chat.sellerLastSeenAt : chat.buyerLastSeenAt
  );

  const getPresenceLabel = (chat) => {
    const value = getOtherLastSeenAt(chat);
    if (!value) return 'Belum pernah terlihat';
    const lastSeen = new Date(value);
    const diffMs = Date.now() - lastSeen.getTime();
    if (diffMs < 2 * 60 * 1000) return 'Online';
    const formatter = diffMs > 24 * 60 * 60 * 1000
      ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
      : new Intl.DateTimeFormat('id-ID', { timeStyle: 'short' });
    return `Terakhir online ${formatter.format(lastSeen)}`;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId) return;
    await apiFetch(`/api/chats/${activeChatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newMessage, type: 'text' }),
    });
    await reloadChats();
    setNewMessage('');
    window.dispatchEvent(new Event('chatUpdated'));
  };

  const sendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChatId) return;
    setSendingImage(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiFetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) {
        await apiFetch(`/api/chats/${activeChatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: 'Photo',
            type: 'image',
            metadata: { imageUrl: data.url },
          }),
        });
        await reloadChats();
        window.dispatchEvent(new Event('chatUpdated'));
      }
    } catch (err) {
      console.error('Image send failed', err);
    }
    setSendingImage(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);

  const handleSendNego = async (_msgId, catalog) => {
    if (!negoValue) return;
    await apiFetch(`/api/chats/${activeChatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'nego_counter',
        text: `Nego Harga: ${formatPrice(negoValue)}`,
        metadata: { originalCatalog: catalog, counterPrice: Number(negoValue) },
      }),
    });
    await reloadChats();
    setNegoInputId(null);
    setNegoValue('');
    window.dispatchEvent(new Event('chatUpdated'));
  };

  const handleNegoAction = async (msgIdx, action) => {
    const originalMsg = activeChat.messages[msgIdx];
    await apiFetch(`/api/chats/${activeChatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: action === 'accept' ? 'nego_accepted' : 'nego_rejected',
        text: action === 'accept' ? `Penawaran diterima: ${formatPrice(originalMsg.counterPrice)}` : 'Penawaran ditolak.',
        metadata: {
          originalCatalog: originalMsg.originalCatalog,
          finalPrice: originalMsg.counterPrice,
        },
      }),
    });
    await reloadChats();
    window.dispatchEvent(new Event('chatUpdated'));
  };

  const handleAddToCartFromChat = async (item, price) => {
    if (user.role === 'seller') return alert('Sellers cannot add to cart.');
    if (!item.id) {
      alert('Offer custom perlu dibuat sebagai listing dulu sebelum bisa dibeli.');
      return;
    }
    const res = await apiFetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: item.id, quantity: 1, negotiatedPrice: price }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Gagal menambahkan ke keranjang.');
      return;
    }
    window.dispatchEvent(new Event('cartUpdated'));
    alert(`Berhasil menambahkan ke keranjang dengan harga ${formatPrice(price || item.price)}`);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 relative"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white text-[10px] font-black rounded-lg border-2 border-slate-900 flex items-center justify-center shadow-lg shadow-red-500/40 animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-80 sm:w-96 h-[520px] flex flex-col overflow-hidden animate-fade-in">

          {/* Header */}
          <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
            {contactsOpen || !activeChat ? (
              <h3 className="font-bold text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
                Messages
              </h3>
            ) : (
              <div className="flex items-center">
                <button onClick={() => setContactsOpen(true)} className="mr-2 text-slate-400 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                    {getOtherName(activeChat).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-sm">{getOtherName(activeChat)}</span>
                    <span className={`text-xs ${getPresenceLabel(activeChat) === 'Online' ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {getPresenceLabel(activeChat)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-grow flex flex-col overflow-hidden relative">

            {/* Contacts View */}
            {(contactsOpen || !activeChat) && (
              <div className="absolute inset-0 bg-slate-900 z-10 overflow-y-auto">
                {chats.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                    <svg className="w-12 h-12 text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    <p className="text-slate-400 text-sm">No messages yet.</p>
                    <p className="text-slate-500 text-xs mt-1">Chat with sellers from device listings!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {chats.map(chat => {
                      const otherName = getOtherName(chat);
                      const lastMsg = chat.messages[chat.messages.length - 1];
                      return (
                        <button
                          key={chat.id}
                          onClick={async () => { 
                            setActiveChatId(chat.id); 
                            setContactsOpen(false); 
                            await apiFetch(`/api/chats/${chat.id}/messages`, { method: 'PATCH' });
                            await reloadChats();
                            window.dispatchEvent(new Event('chatUpdated'));
                          }}
                          className="w-full p-4 flex items-center hover:bg-slate-800 transition-colors text-left relative"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold mr-3 flex-shrink-0 uppercase">
                            {otherName.charAt(0)}
                          </div>
                          {lastMsg && lastMsg.senderId !== user.email && !lastMsg.read && (
                            <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                          )}
                          <div className="flex-grow overflow-hidden">
                            <div className="flex justify-between items-baseline mb-1">
                              <h4 className="font-semibold text-slate-200 text-sm truncate">{otherName}</h4>
                              <span className="text-[10px] text-slate-500">{lastMsg?.timestamp || ''}</span>
                            </div>
                            <p className="mb-1 text-[10px] text-slate-500">{getPresenceLabel(chat)}</p>
                            <p className={`text-xs truncate ${lastMsg && lastMsg.senderId !== user.email && !lastMsg.read ? 'text-white font-bold' : 'text-slate-400'}`}>
                               {lastMsg ? (lastMsg.type === 'image' ? '📷 Photo' : lastMsg.type === 'product' ? '🛒 Device Inquiry' : lastMsg.type === 'catalog' ? '⚡ Premium Offer' : lastMsg.text) : 'Say hello!'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Chat View */}
            {!contactsOpen && activeChat && (
              <>
                <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-slate-900">
                  {activeChat.messages.length === 0 ? (
                    <div className="text-center text-slate-500 text-xs mt-4">Start a conversation. This chat is secured end-to-end.</div>
                  ) : (
                    activeChat.messages.map((msg, idx) => {
                      const isMe = msg.senderId === user.email;
                      return (
                        <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {/* Product Card */}
                          {msg.type === 'product' && msg.product && (
                            <div className={`max-w-[85%] rounded-2xl overflow-hidden border text-sm mb-0.5 ${isMe ? 'border-emerald-700/50 bg-emerald-900/30' : 'border-slate-600 bg-slate-800'}`}>
                              <div className="flex items-center gap-2 p-2">
                                <img src={msg.product.image} alt={msg.product.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                                <div className="overflow-hidden">
                                  <p className="text-white text-[10px] font-bold truncate">{msg.product.name}</p>
                                  <p className="text-emerald-400 text-[10px] font-black">{formatPrice(msg.product.price)}</p>
                                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-tighter">Product Inquiry</p>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Catalog / Offer Message */}
                          {msg.type === 'catalog' && msg.catalog && (
                            <div className={`max-w-[85%] rounded-2xl overflow-hidden border text-sm mb-0.5 ${isMe ? 'border-blue-700/50 bg-blue-900/30' : 'border-slate-600 bg-slate-800'}`}>
                              <div className="p-3">
                                 <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                    Premium Offer
                                 </p>
                                 <div className="flex gap-3 items-start mb-3">
                                    {msg.catalog.image && <img src={msg.catalog.image} className="w-16 h-16 object-cover rounded-xl shadow-lg" />}
                                    <div>
                                       <p className="text-white text-xs font-bold leading-tight mb-1">{msg.catalog.deviceName}</p>
                                       <p className="text-emerald-400 text-sm font-black">{formatPrice(msg.catalog.price)}</p>
                                    </div>
                                 </div>
                                 <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="bg-black/20 p-1.5 rounded-lg text-center">
                                       <p className="text-[8px] text-slate-500 font-black uppercase">RAM</p>
                                       <p className="text-[10px] text-white font-bold">{msg.catalog.ram || '-'}</p>
                                    </div>
                                    <div className="bg-black/20 p-1.5 rounded-lg text-center">
                                       <p className="text-[8px] text-slate-500 font-black uppercase">Storage</p>
                                       <p className="text-[10px] text-white font-bold">{msg.catalog.storage || '-'}</p>
                                    </div>
                                 </div>
                                 <p className="text-[10px] text-slate-400 leading-relaxed italic mb-3">"{msg.catalog.description}"</p>
                                 {!isMe && (
                                    <div className="flex gap-2">
                                       <button 
                                         onClick={() => handleAddToCartFromChat(msg.catalog, msg.catalog.price)}
                                         className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                                       >
                                         Buy Now
                                       </button>
                                       <button 
                                         onClick={() => setNegoInputId(idx)}
                                         className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border border-white/5"
                                       >
                                         Nego
                                       </button>
                                    </div>
                                 )}

                                 {negoInputId === idx && (
                                    <div className="mt-3 pt-3 border-t border-white/10 animate-fade-in">
                                       <div className="flex gap-2">
                                          <input 
                                             type="number" 
                                             placeholder="Tawar harga..." 
                                             className="flex-grow bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                                             value={negoValue}
                                             onChange={e => setNegoValue(e.target.value)}
                                          />
                                          <button 
                                             onClick={() => handleSendNego(idx, msg.catalog)}
                                             className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg"
                                          >
                                             Send
                                          </button>
                                       </div>
                                    </div>
                                 )}
                              </div>
                            </div>
                          )}

                          {/* Nego Counter Message */}
                          {msg.type === 'nego_counter' && (
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-700 text-slate-200 rounded-tl-sm'}`}>
                               <p className="font-bold mb-2">{msg.text}</p>
                               {!isMe && (
                                  <div className="flex gap-2 mt-2">
                                     <button 
                                        onClick={() => handleNegoAction(idx, 'accept')}
                                        className="flex-1 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg"
                                     >
                                        Accept
                                     </button>
                                     <button 
                                        onClick={() => handleNegoAction(idx, 'reject')}
                                        className="flex-1 py-1.5 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg"
                                     >
                                        Reject
                                     </button>
                                  </div>
                               )}
                            </div>
                          )}

                          {/* Nego Accepted Message */}
                          {msg.type === 'nego_accepted' && (
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm border-2 ${isMe ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-emerald-900/40 border-emerald-700 text-emerald-300'}`}>
                               <div className="flex items-center gap-2 mb-2 font-black uppercase text-[10px]">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                  Deal Confirmed
                               </div>
                               <p className="text-sm font-bold mb-3">{msg.text}</p>
                               {msg.senderId !== user.email && (
                                  <button 
                                     onClick={() => handleAddToCartFromChat(msg.originalCatalog, msg.finalPrice)}
                                     className="w-full py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg"
                                  >
                                     Add to Cart (Deal)
                                  </button>
                               )}
                            </div>
                          )}

                          {/* Nego Rejected Message */}
                          {msg.type === 'nego_rejected' && (
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-red-900/20 border border-red-500/30 text-red-400 italic`}>
                               {msg.text}
                            </div>
                          )}
                          {/* Image Message */}
                          {msg.type === 'image' && (
                            <div className={`max-w-[75%] rounded-2xl overflow-hidden ${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                              <img src={msg.imageUrl} alt="Sent image" className="w-full max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.imageUrl, '_blank')} />
                            </div>
                          )}
                          {/* Text Message */}
                          {(!msg.type || msg.type === 'text') && (
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-slate-700 text-slate-200 rounded-tl-sm'}`}>
                              {msg.text}
                            </div>
                          )}
                          <span className="text-[10px] text-slate-500 mt-1">{msg.timestamp}</span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={sendMessage} className="p-3 bg-slate-800 border-t border-slate-700 flex items-center gap-2">
                  {/* Image button */}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={sendingImage}
                    className="w-9 h-9 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white flex items-center justify-center flex-shrink-0 transition-colors"
                    title="Send photo"
                  >
                    {sendingImage ? (
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    )}
                  </button>
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={sendImage} />

                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-grow bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="submit" disabled={!newMessage.trim()} className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
                    <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
