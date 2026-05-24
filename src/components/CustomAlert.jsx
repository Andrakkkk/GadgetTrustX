'use client';
import { useState, useEffect } from 'react';

export default function CustomAlertContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Override default window.alert
    const originalAlert = window.alert;
    
    window.alert = (message, type = 'info') => {
      const id = Date.now();
      // Simple detection for success/error based on keywords if type not provided
      let finalType = type;
      if (type === 'info') {
        const msg = message.toLowerCase();
        if (msg.includes('success') || msg.includes('thank') || msg.includes('approved')) finalType = 'success';
        if (msg.includes('error') || msg.includes('failed') || msg.includes('invalid') || msg.includes('rejected')) finalType = 'error';
      }

      setToasts(prev => [...prev, { id, message, type: finalType }]);
      
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>;
      case 'error':
        return <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>;
      default:
        return <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
    }
  };

  const getColors = (type) => {
    switch (type) {
      case 'success':
        return 'border-blue-500/30 shadow-[0_10px_40px_rgba(59,130,246,0.2)] bg-slate-900/90';
      case 'error':
        return 'border-red-500/30 shadow-[0_10px_40px_rgba(239,68,68,0.2)] bg-slate-900/90';
      default:
        return 'border-blue-500/30 shadow-[0_10px_40px_rgba(59,130,246,0.2)] bg-slate-900/90';
    }
  };

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-3 pointer-events-none w-full max-w-md px-4">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`animate-slide-down backdrop-blur-xl border ${getColors(toast.type)} text-white px-6 py-4 rounded-2xl flex items-center gap-4 pointer-events-auto transform transition-all duration-500 border-t-2 border-t-white/10`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5`}>
            {getIcon(toast.type)}
          </div>
          <div className="flex-grow">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">{toast.type}</p>
            <p className="text-sm font-bold leading-tight">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      ))}
    </div>
  );
}
