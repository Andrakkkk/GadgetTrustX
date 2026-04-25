'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [contactsOpen, setContactsOpen] = useState(true);
  const messagesEndRef = useRef(null);

  // Load chats from global storage
  useEffect(() => {
    if (!user) return;
    const loadChats = () => {
      const saved = localStorage.getItem('gadgetTrustX_chats');
      if (saved) {
        const allChats = JSON.parse(saved);
        // Filter chats involving the current user, and ignore corrupted self-chats
        const myChats = allChats.filter(c => (c.buyerId === user.email || c.sellerId === user.email) && c.buyerId !== c.sellerId);
        setChats(myChats);
      }
    };
    
    loadChats();
    // Poll every 2 seconds for new messages (simulating real-time)
    const interval = setInterval(loadChats, 2000);
    return () => clearInterval(interval);
  }, [user]);

  // Listen for 'openChat' event from DeviceCards
  useEffect(() => {
    if (!user) return;
    
    const handleOpenChat = (e) => {
      const seller = e.detail; // { id: email, name: name }
      if (user.email === seller.id) {
        alert("You cannot chat with yourself!");
        return;
      }

      setIsOpen(true);
      setContactsOpen(false);

      // Check if chat already exists
      const saved = localStorage.getItem('gadgetTrustX_chats');
      let allChats = saved ? JSON.parse(saved) : [];
      
      const existingChat = allChats.find(c => 
        (c.buyerId === user.email && c.sellerId === seller.id) ||
        (c.sellerId === user.email && c.buyerId === seller.id)
      );

      if (existingChat) {
        setActiveChatId(existingChat.id);
      } else {
        // Create new chat
        const newChat = {
          id: 'chat_' + Date.now(),
          buyerId: user.email,
          buyerName: user.name,
          sellerId: seller.id,
          sellerName: seller.name,
          messages: []
        };
        allChats.push(newChat);
        localStorage.setItem('gadgetTrustX_chats', JSON.stringify(allChats));
        
        setChats(prev => [...prev, newChat]);
        setActiveChatId(newChat.id);
      }
    };

    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, [user]);

  // Scroll to bottom when active chat messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, activeChatId]);

  if (!user) return null;

  const activeChat = chats.find(c => c.id === activeChatId);

  const getOtherName = (chat) => {
    if (!chat) return 'Unknown';
    const savedUsers = localStorage.getItem('gadgetTrustX_users');
    const allUsers = savedUsers ? JSON.parse(savedUsers) : [];
    const otherId = chat.buyerId === user.email ? chat.sellerId : chat.buyerId;
    const fallback = chat.buyerId === user.email ? chat.sellerName : chat.buyerName;
    const u = allUsers.find(u => u.email === otherId);
    return (u && u.name) ? u.name : (fallback || 'Unknown');
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId) return;

    const saved = localStorage.getItem('gadgetTrustX_chats');
    let allChats = saved ? JSON.parse(saved) : [];
    
    const chatIndex = allChats.findIndex(c => c.id === activeChatId);
    if (chatIndex !== -1) {
      const msg = {
        senderId: user.email,
        text: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      allChats[chatIndex].messages.push(msg);
      localStorage.setItem('gadgetTrustX_chats', JSON.stringify(allChats));
      
      setChats(allChats.filter(c => c.buyerId === user.email || c.sellerId === user.email));
      setNewMessage('');
    }
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
          {chats.length > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900"></span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-80 sm:w-96 h-[500px] flex flex-col overflow-hidden animate-fade-in">
          
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
                <div className="flex flex-col">
                  <span className="font-bold text-white text-sm">
                    {getOtherName(activeChat)}
                  </span>
                  <span className="text-xs text-emerald-400">Online</span>
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
                    <p className="text-slate-500 text-xs mt-1">Chat with sellers directly from device listings!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {chats.map(chat => {
                      const otherName = getOtherName(chat);
                      const lastMsg = chat.messages[chat.messages.length - 1];
                      return (
                        <button 
                          key={chat.id} 
                          onClick={() => { setActiveChatId(chat.id); setContactsOpen(false); }}
                          className="w-full p-4 flex items-center hover:bg-slate-800 transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold mr-3 flex-shrink-0 uppercase">
                            {otherName.charAt(0)}
                          </div>
                          <div className="flex-grow overflow-hidden">
                            <div className="flex justify-between items-baseline mb-1">
                              <h4 className="font-semibold text-slate-200 text-sm truncate">{otherName}</h4>
                              <span className="text-[10px] text-slate-500">{lastMsg?.timestamp || ''}</span>
                            </div>
                            <p className="text-xs text-slate-400 truncate">
                              {lastMsg ? lastMsg.text : 'Say hello!'}
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
                <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-900">
                  {activeChat.messages.length === 0 ? (
                    <div className="text-center text-slate-500 text-xs mt-4">Start a conversation. This chat is secured end-to-end.</div>
                  ) : (
                    activeChat.messages.map((msg, idx) => {
                      const isMe = msg.senderId === user.email;
                      return (
                        <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-slate-700 text-slate-200 rounded-tl-sm'}`}>
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1">{msg.timestamp}</span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Input Area */}
                <form onSubmit={sendMessage} className="p-3 bg-slate-800 border-t border-slate-700 flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    className="flex-grow bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="submit" disabled={!newMessage.trim()} className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
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
