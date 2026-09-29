'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessFallback() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel p-12 text-center max-w-lg w-full">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-sm font-bold text-slate-400">Memuat status pembayaran...</p>
        </div>
      </div>
    </AuthGuard>
  );
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const status = searchParams.get('status');
  const isPending = status === 'pending';

  return (
    <AuthGuard>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel p-12 text-center max-w-lg w-full animate-fade-in">
          {isPending ? (
            <>
              {/* Pending State */}
              <div className="w-20 h-20 bg-yellow-500/10 text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-8 border border-yellow-500/20">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">Menunggu Pembayaran</h2>
              <p className="text-slate-400 mb-3 font-medium leading-relaxed">
                Pesananmu sudah dibuat. Selesaikan pembayaran sesuai instruksi yang dikirim ke emailmu.
              </p>
              <p className="text-xs text-slate-500 mb-10 font-mono bg-slate-900 rounded-xl px-4 py-2 border border-white/5 inline-block">
                Order ID: {orderId || '-'}
              </p>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-4xl font-black text-white mb-3 uppercase tracking-tighter">Pembayaran Berhasil!</h2>
              <p className="text-slate-400 mb-3 font-medium leading-relaxed">
                Terima kasih! Pesananmu sudah dikonfirmasi dan penjual sudah dinotifikasi.
              </p>
              <p className="text-xs text-slate-500 mb-10 font-mono bg-slate-900 rounded-xl px-4 py-2 border border-white/5 inline-block">
                Order ID: {orderId || '-'}
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/buyer-profile" className="btn-primary !px-10">
              Lihat Pesananku
            </Link>
            <Link
              href="/marketplace"
              className="px-10 py-3 rounded-2xl border border-white/10 text-slate-300 hover:bg-white/5 transition-all text-xs font-black uppercase tracking-widest"
            >
              Belanja Lagi
            </Link>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
