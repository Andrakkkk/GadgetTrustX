'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, dur) => addToast(msg, 'success', dur), [addToast]);
  const error = useCallback((msg, dur) => addToast(msg, 'error', dur), [addToast]);
  const info = useCallback((msg, dur) => addToast(msg, 'info', dur), [addToast]);
  const warning = useCallback((msg, dur) => addToast(msg, 'warning', dur), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4">
        {toasts.map((toast) => {
          let bgClass = 'bg-slate-900/90 text-white border-slate-700/60';
          let icon = 'ℹ️';

          if (toast.type === 'success') {
            bgClass = 'bg-emerald-950/90 text-emerald-100 border-emerald-500/50 shadow-emerald-900/30';
            icon = '✅';
          } else if (toast.type === 'error') {
            bgClass = 'bg-rose-950/90 text-rose-100 border-rose-500/50 shadow-rose-900/30';
            icon = '🚨';
          } else if (toast.type === 'warning') {
            bgClass = 'bg-amber-950/90 text-amber-100 border-amber-500/50 shadow-amber-900/30';
            icon = '⚠️';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-bottom-5 ${bgClass}`}
            >
              <span className="text-lg leading-none mt-0.5">{icon}</span>
              <div className="flex-1 text-sm font-medium leading-snug">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors text-xs font-bold ml-1"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if component is used outside ToastProvider
    return {
      success: (msg) => console.log('Toast (success):', msg),
      error: (msg) => console.error('Toast (error):', msg),
      info: (msg) => console.log('Toast (info):', msg),
      warning: (msg) => console.warn('Toast (warning):', msg),
      addToast: (msg) => console.log('Toast:', msg),
    };
  }
  return context;
}
