'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api-client';

export default function ChatWidget() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [contactsOpen, setContactsOpen] = useState(true);
  const [sendingImage, setSendingImage] = useState(false);
  const [negoInputId, setNegoInputId] = useState(null);
  const [negoValue, setNegoValue] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef(null);
  const hasMovedRef = useRef(false);
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);

  const sortChatsByLatest = (chatList) => {
    return [...chatList].sort((a, b) => {
      const lastA = a.messages && a.messages.length > 0 ? a.messages[a.messages.length - 1] : null;
      const lastB = b.messages && b.messages.length > 0 ? b.messages[b.messages.length - 1] : null;

      const timeA = lastA?.createdAt
        ? new Date(lastA.createdAt).getTime()
        : (a.createdAt ? new Date(a.createdAt).getTime() : 0);

      const timeB = lastB?.createdAt
        ? new Date(lastB.createdAt).getTime()
        : (b.createdAt ? new Date(b.createdAt).getTime() : 0);

      return timeB - timeA;
    });
  };

  const getDateDividerLabel = (dateString) => {
    if (!dateString) return '';
    const msgDate = new Date(dateString);
    if (isNaN(msgDate.getTime())) return '';

    const now = new Date();
    const dMsg = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
    const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffDays = Math.round((dNow.getTime() - dMsg.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 0) return 'Hari Ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays > 1 && diffDays < 7) {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      return days[msgDate.getDay()];
    }
    return msgDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    if (!user) return;
    const loadChats = async () => {
      try {
        const res = await apiFetch('/api/chats');
        if (!res.ok) return;
        const data = await res.json();
        const myChats = sortChatsByLatest(data.chats || []);
        setChats(myChats);
        setUnreadCount(myChats.filter((chat) => {
          const lastMsg = chat.messages[chat.messages.length - 1];
          return lastMsg && lastMsg.senderId !== user.email && !lastMsg.read;
        }).length);
      } catch (error) {
        console.warn('Failed to load chats:', error?.message || error);
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
    const timer = setInterval(() => setNow(Date.now()), 30000);
    const pingPresence = () => apiFetch('/api/presence', { method: 'POST' }).catch(() => {});
    pingPresence();
    const interval = setInterval(pingPresence, 60000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') pingPresence();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(timer);
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
        alert("Anda tidak bisa chat dengan diri sendiri!");
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

  const handleStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = {
      x: clientX - position.x,
      y: clientY - position.y,
      startX: clientX,
      startY: clientY,
    };
    hasMovedRef.current = false;
    isDraggingRef.current = true;
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDraggingRef.current || !dragStartRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const diffX = clientX - dragStartRef.current.startX;
      const diffY = clientY - dragStartRef.current.startY;

      if (Math.abs(diffX) > 4 || Math.abs(diffY) > 4) {
        hasMovedRef.current = true;
      }

      if (hasMovedRef.current) {
        const rawX = clientX - dragStartRef.current.x;
        const rawY = clientY - dragStartRef.current.y;

        const isMobile = window.innerWidth < 640;
        const btnWidth = isMobile ? 48 : 56;
        const rightOffset = isMobile ? 12 : 24;
        const halfBtn = btnWidth / 2;

        const minX = -(window.innerWidth - rightOffset - halfBtn);
        const maxX = halfBtn + rightOffset;
        const minY = -(window.innerHeight - 80);
        const maxY = 10;

        const clampedX = Math.min(maxX, Math.max(minX, rawX));
        const clampedY = Math.min(maxY, Math.max(minY, rawY));

        setPosition({ x: clampedX, y: clampedY });
      }
    };

    const handleEnd = () => {
      if (isDraggingRef.current && hasMovedRef.current) {
        setPosition((currentPos) => {
          const isMobile = window.innerWidth < 640;
          const btnWidth = isMobile ? 48 : 56;
          const rightOffset = isMobile ? 12 : 24;
          const halfBtn = btnWidth / 2;

          // Inner screen boundaries (normal inside screen area)
          const innerLeftX = -(window.innerWidth - rightOffset - btnWidth);
          const innerRightX = 0;

          let finalX = currentPos.x;

          // ONLY dock 50% protruding if explicitly pushed PAST the screen edges!
          if (currentPos.x < innerLeftX - 8) {
            // Pushed past left edge -> Dock 50% protruding on Left
            finalX = -(window.innerWidth - rightOffset - halfBtn);
          } else if (currentPos.x > innerRightX + 8) {
            // Pushed past right edge -> Dock 50% protruding on Right
            finalX = halfBtn + rightOffset;
          } else {
            // Dropped inside normal screen area -> Stay EXACTLY where dropped!
            finalX = Math.min(innerRightX, Math.max(innerLeftX, currentPos.x));
          }

          return { x: finalX, y: currentPos.y };
        });
      }
      isDraggingRef.current = false;
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [position]);

  if (!user || pathname === '/checkout' || pathname === '/cart') return null;

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
      setChats(sortChatsByLatest(data.chats || []));
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
    const diffMs = now - lastSeen.getTime();
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
            text: 'Foto',
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
    if (user.role === 'seller') return alert('Seller tidak bisa menambahkan ke keranjang.');
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
    <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 max-w-[calc(100vw-24px)]">
      {/* Floating Button (Draggable) */}
      {!isOpen && (
        <div
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0px)`,
            touchAction: 'none'
          }}
          className="transition-transform duration-75 select-none cursor-grab active:cursor-grabbing hover:scale-105"
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          onClick={(e) => {
            if (hasMovedRef.current) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            setPosition({ x: 0, y: 0 });
            setIsOpen(true);
          }}
        >
          <button
            type="button"
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-[0_8px_30px_rgba(16,185,129,0.4)] border border-emerald-400/30 flex items-center justify-center relative active:scale-95 transition-all"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-600 text-white text-[10px] font-black rounded-lg border-2 border-slate-900 flex items-center justify-center shadow-lg shadow-red-500/40 animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-[calc(100vw-24px)] sm:w-96 max-w-sm h-[480px] sm:h-[520px] flex flex-col overflow-hidden animate-fade-in">

          {/* Header */}
          <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
            {contactsOpen || !activeChat ? (
              <h3 className="font-bold text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
                Pesan
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
                    <p className="text-slate-400 text-sm">Belum ada pesan.</p>
                    <p className="text-slate-500 text-xs mt-1">Mulai chat dengan seller dari listing perangkat!</p>
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
                               {lastMsg ? (lastMsg.type === 'image' ? '📷 Foto' : lastMsg.type === 'product' ? '🛒 Tanya Produk' : lastMsg.type === 'catalog' ? '⚡ Penawaran Premium' : lastMsg.text) : 'Sapa dulu!'}
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
                    <div className="text-center text-slate-500 text-xs mt-4">Mulai percakapan. Chat ini diamankan end-to-end.</div>
                  ) : (
                    activeChat.messages.map((msg, idx) => {
                      const isMe = msg.senderId === user.email;
                      const currentDivider = getDateDividerLabel(msg.createdAt);
                      const prevMsg = idx > 0 ? activeChat.messages[idx - 1] : null;
                      const prevDivider = prevMsg ? getDateDividerLabel(prevMsg.createdAt) : null;
                      const showDateDivider = Boolean(currentDivider && currentDivider !== prevDivider);

                      return (
                        <div key={msg.id || idx} className="space-y-3">
                          {showDateDivider && (
                            <div className="flex justify-center my-3">
                              <span className="bg-slate-800 text-slate-300 text-[10px] font-extrabold px-3.5 py-1 rounded-full border border-white/10 tracking-wider shadow-sm">
                                {currentDivider}
                              </span>
                            </div>
                          )}
                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {/* Product Card — Shopee Style */}
                          {msg.type === 'product' && msg.product && (
                            <div className={`max-w-[85%] rounded-2xl overflow-hidden border mb-0.5 shadow-lg ${isMe ? 'border-purple-700/50 bg-purple-950/40' : 'border-slate-600/80 bg-slate-800/90'}`}>
                              {/* Product header banner */}
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 border-b border-purple-500/20">
                                <span className="text-[9px]">🛍️</span>
                                <span className="text-[9px] font-black text-purple-300 uppercase tracking-widest">
                                  {msg.product.isBekas ? 'HP Bekas · Nego Harga' : 'Tanya Produk'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 p-3">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 border border-white/5">
                                  {msg.product.image
                                    ? <img src={msg.product.image} alt={msg.product.name} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-2xl">📱</div>
                                  }
                                </div>
                                <div className="overflow-hidden flex-1 min-w-0">
                                  <p className="text-white text-xs font-bold truncate leading-snug">{msg.product.name}</p>
                                  <p className="text-emerald-400 text-sm font-black mt-0.5">{formatPrice(msg.product.price)}</p>
                                  {msg.product.condition && (
                                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-[9px] font-black uppercase tracking-wide border border-amber-500/20">
                                      Kondisi: {msg.product.condition}
                                    </span>
                                  )}
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
                                    Penawaran Premium
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
                                 <p className="text-[10px] text-slate-400 leading-relaxed italic mb-3">&ldquo;{msg.catalog.description}&rdquo;</p>
                                 {!isMe && (
                                    <div className="flex gap-2">
                                       <button 
                                         onClick={() => handleAddToCartFromChat(msg.catalog, msg.catalog.price)}
                                         className="flex-1 rounded-lg bg-emerald-600 px-2 py-2 text-[10px] font-black uppercase tracking-wide text-white transition-all hover:bg-emerald-500"
                                       >
                                         Beli Sekarang
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
                                             Kirim
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
                                        Terima
                                     </button>
                                     <button 
                                        onClick={() => handleNegoAction(idx, 'reject')}
                                        className="flex-1 py-1.5 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg"
                                     >
                                        Tolak
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
                                  Deal Disetujui
                               </div>
                               <p className="text-sm font-bold mb-3">{msg.text}</p>
                               {msg.senderId !== user.email && (
                                  <button 
                                     onClick={() => handleAddToCartFromChat(msg.originalCatalog, msg.finalPrice)}
                                     className="w-full rounded-lg bg-emerald-500 px-2 py-2 text-[10px] font-black uppercase tracking-wide text-white shadow-lg"
                                  >
                                     Tambah ke Keranjang (Deal)
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
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="p-2 sm:p-3 bg-slate-800 border-t border-slate-700 flex items-center gap-1.5 sm:gap-2 w-full box-border">
                  {/* Image button */}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={sendingImage}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white flex items-center justify-center flex-shrink-0 transition-colors"
                    title="Kirim foto"
                  >
                    {sendingImage ? (
                      <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    )}
                  </button>
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={sendImage} />

                  <input
                    type="text"
                    placeholder="Tulis pesan..."
                    className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="submit" disabled={!newMessage.trim()} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
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
