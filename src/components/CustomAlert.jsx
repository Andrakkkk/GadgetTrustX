'use client';
import { useState, useEffect, useCallback } from 'react';

export default function CustomAlertContainer() {
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null); // { id, title, message, type, confirmText, cancelText, resolve }

  useEffect(() => {
    // Save originals
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;

    // Custom Toast Dispatcher
    window.toast = (message, type = 'info', title = null) => {
      const id = Date.now() + Math.random();
      let finalType = type;
      if (type === 'info') {
        const msg = (message || '').toLowerCase();
        if (msg.includes('sukses') || msg.includes('berhasil') || msg.includes('success') || msg.includes('approved')) finalType = 'success';
        if (msg.includes('gagal') || msg.includes('error') || msg.includes('failed') || msg.includes('batal') || msg.includes('rejected')) finalType = 'error';
      }

      setToasts(prev => [...prev, { id, title, message, type: finalType }]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4500);
    };

    // Override window.alert
    window.alert = (message, type = 'info') => {
      window.toast(message, type);
    };

    // Custom Promise-based Confirm Modal
    window.confirmCustom = ({
      title = 'Konfirmasi Tindakan',
      message = 'Apakah Anda yakin ingin melanjutkan?',
      type = 'danger', // 'danger' | 'warning' | 'info'
      confirmText = 'Ya, Lanjutkan',
      cancelText = 'Batal'
    }) => {
      return new Promise((resolve) => {
        setConfirmModal({
          id: Date.now(),
          title,
          message,
          type,
          confirmText,
          cancelText,
          resolve
        });
      });
    };

    // Override default window.confirm with beautiful custom modal
    window.confirm = (message) => {
      const isDanger = (message || '').toLowerCase().includes('batal') || (message || '').toLowerCase().includes('hapus');
      return window.confirmCustom({
        title: isDanger ? 'Konfirmasi Pembatalan' : 'Konfirmasi Tindakan',
        message,
        type: isDanger ? 'danger' : 'info',
        confirmText: isDanger ? 'Ya, Batalkan' : 'Ya, Lanjutkan',
        cancelText: 'Kembali'
      });
    };

    return () => {
      window.alert = originalAlert;
      window.confirm = originalConfirm;
    };
  }, []);

  const handleConfirmResult = useCallback((result) => {
    if (confirmModal && confirmModal.resolve) {
      confirmModal.resolve(result);
    }
    setConfirmModal(null);
  }, [confirmModal]);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
          </div>
        );
      case 'error':
      case 'danger':
        return (
          <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        );
    }
  };

  const getToastBorder = (type) => {
    switch (type) {
      case 'success': return 'border-emerald-500/30 shadow-[0_10px_40px_rgba(16,185,129,0.2)] bg-slate-950/95';
      case 'error': case 'danger': return 'border-red-500/30 shadow-[0_10px_40px_rgba(239,68,68,0.2)] bg-slate-950/95';
      case 'warning': return 'border-amber-500/30 shadow-[0_10px_40px_rgba(245,158,11,0.2)] bg-slate-950/95';
      default: return 'border-purple-500/30 shadow-[0_10px_40px_rgba(168,85,247,0.2)] bg-slate-950/95';
    }
  };

  return (
    <>
      {/* Toast Stack */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[999999] flex flex-col gap-3 pointer-events-none w-full max-w-md px-4">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`animate-fade-in backdrop-blur-2xl border ${getToastBorder(t.type)} text-white p-4 rounded-2xl flex items-start gap-4 pointer-events-auto transform transition-all duration-300 relative overflow-hidden shadow-2xl`}
          >
            {getToastIcon(t.type)}
            <div className="flex-grow min-w-0 pr-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                {t.title || (t.type === 'success' ? 'Sukses' : t.type === 'error' ? 'Pemberitahuan' : 'Notifikasi')}
              </p>
              <p className="text-xs font-bold leading-relaxed text-slate-100">{t.message}</p>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
              className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
          <div
            className="glass-panel !rounded-3xl w-full max-w-md p-8 border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.8)] relative overflow-hidden text-center animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Ambient Backlight */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-[80px] pointer-events-none -z-10 ${confirmModal.type === 'danger' ? 'bg-red-600/30' : 'bg-purple-600/30'}`}></div>

            {/* Modal Icon Header */}
            <div className="mb-6 inline-flex">
              {confirmModal.type === 'danger' ? (
                <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.25)]">
                  <svg className="w-10 h-10 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.25)]">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
              )}
            </div>

            {/* Title & Message */}
            <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{confirmModal.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">{confirmModal.message}</p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleConfirmResult(false)}
                className="flex-1 py-4 px-5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-black uppercase text-xs tracking-widest transition-all hover:bg-slate-800"
              >
                {confirmModal.cancelText || 'Batal'}
              </button>
              
              <button
                onClick={() => handleConfirmResult(true)}
                className={`flex-1 py-4 px-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all text-white shadow-xl ${
                  confirmModal.type === 'danger'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-600/30'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/30'
                }`}
              >
                {confirmModal.confirmText || 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
