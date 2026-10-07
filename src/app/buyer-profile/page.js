'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/AuthGuard';
import AddressPicker from '@/components/AddressPicker';
import TrackingModal from '@/components/TrackingModal';
import { formatPrice } from '@/utils/formatPrice';
import { apiFetch } from '@/lib/api-client';
import OrderDetailModal from '@/components/OrderDetailModal';
import { validatePhone, validateName, sanitizePhone } from '@/utils/validation';

function PaymentDetailsModal({ order, onClose, onCancelOrder, onRefreshOrders, onOpenSnap }) {
  const [loading, setLoading] = useState(true);
  const [midtransData, setMidtransData] = useState(null);
  const [qrisData, setQrisData] = useState(null);   // data dari /api/payment/gopay-qris
  const [loadingQris, setLoadingQris] = useState(false);
  const [qrisError, setQrisError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [simulatingPaid, setSimulatingPaid] = useState(false);
  const [instructionTab, setInstructionTab] = useState('mbanking');
  const [timeLeft, setTimeLeft] = useState({ minutes: 15, seconds: 0 });
  // Guard agar fetchGopayQris tidak dipanggil dua kali (React Strict Mode)
  const qrisFetchingRef = useRef(false);

  const fetchGopayQris = async (orderId, isMounted = true) => {
    // Cegah double-call dari React Strict Mode / concurrent renders
    if (qrisFetchingRef.current) return;
    qrisFetchingRef.current = true;
    setLoadingQris(true);
    setQrisError(null);
    try {
      const res = await apiFetch('/api/payment/gopay-qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!isMounted) return;
      if (!res.ok) {
        setQrisError(data.error || 'Gagal memuat QRIS dari Midtrans.');
        qrisFetchingRef.current = false; // reset agar bisa retry
      } else {
        setQrisData(data);
      }
    } catch (err) {
      if (isMounted) setQrisError('Koneksi ke Midtrans gagal.');
      qrisFetchingRef.current = false; // reset agar bisa retry
    } finally {
      if (isMounted) setLoadingQris(false);
    }
  };

  useEffect(() => {
    if (!order) return;
    let isMounted = true;

    // Fetch status dari Midtrans untuk cek payment_type (VA / GoPay)
    apiFetch(`/api/payment/status?orderId=${order.id}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.midtransStatus) {
          setMidtransData(data.midtransStatus);

          // Jika payment_method adalah GoPay/QRIS atau belum ada → auto-fetch QRIS
          const pt = data.midtransStatus?.payment_type || order.payment_method || null;
          const isQrisPayment = !pt || pt === 'gopay' || pt === 'qris' || pt === 'other_qris';
          if (isQrisPayment) {
            fetchGopayQris(order.id, isMounted);
          }
        } else {
          // Belum pernah bayar → default ke GoPay/QRIS
          fetchGopayQris(order.id, isMounted);
        }
      })
      .catch(() => {
        if (isMounted) fetchGopayQris(order.id, isMounted);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [order]);

  // Live Countdown Timer — dari waktu transaksi GoPay (15 menit) atau VA (24 jam)
  useEffect(() => {
    if (!order) return;

    const isQris = !midtransData?.payment_type ||
      midtransData?.payment_type === 'gopay' ||
      midtransData?.payment_type === 'qris' ||
      midtransData?.payment_type === 'other_qris';

    const durationMs = isQris ? 15 * 60 * 1000 : 24 * 60 * 60 * 1000;

    // Prioritaskan waktu dari GoPay charge (qrisData) > midtransData > order.date
    const rawTime = qrisData?.transactionTime || midtransData?.transaction_time || order.date;
    const baseTime = rawTime ? new Date(rawTime).getTime() : Date.now();
    const targetTime = baseTime + durationMs;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [order, midtransData, qrisData]);

  if (!order) return null;

  const handleCopy = (text, fieldName) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      if (window.alert) window.alert(`${fieldName} berhasil disalin!`, 'success');
      setTimeout(() => setCopiedField(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    await onRefreshOrders();
    setCheckingStatus(false);
    if (window.alert) window.alert('Status pesanan berhasil diperbarui!', 'success');
  };

  const paymentType = midtransData?.payment_type || order.payment_method || order.paymentMethod || null;
  // Jika belum ada payment_type (belum pernah bayar) atau GoPay/QRIS → tampilkan QRIS form
  const isQris = !paymentType || paymentType === 'gopay' || paymentType === 'qris' || paymentType === 'other_qris';
  const isBankTransfer = paymentType === 'bank_transfer';
  const isEchannel = paymentType === 'echannel';
  const isCstore = paymentType === 'cstore';

  const vaObj = midtransData?.va_numbers?.[0] || null;
  const permataVa = midtransData?.permata_va_number || null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in" onClick={onClose}>
      <div className="glass-panel !rounded-3xl w-full max-w-xl overflow-hidden border border-white/10 shadow-2xl relative" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-slate-900/60 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Instruksi Pembayaran</h3>
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending Payment</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Order #{order.id.slice(-8)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Live Countdown Timer Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span className="text-xs font-black uppercase tracking-wider">Sisa Waktu Pembayaran</span>
            </div>
            <div className="text-lg font-mono font-black text-amber-300 bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-500/30">
              {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </div>
          </div>

          {/* Total Tagihan Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Tagihan Pembayaran</p>
              <h4 className="text-3xl font-black text-emerald-400 glow-text">{formatPrice(order.total)}</h4>
            </div>
            <button
              onClick={() => handleCopy(order.total.toString(), 'Nominal Tagihan')}
              className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              <span>{copiedField === 'Nominal Tagihan' ? 'Tersalin!' : 'Salin Nominal'}</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-slate-400">Memuat rincian data transaksi Midtrans Real...</p>
            </div>
          ) : isQris ? (
            /* ===== QRIS / GOPAY PAYMENT ===== */
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center relative overflow-hidden">
                <div className="flex items-center justify-between w-full mb-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xl tracking-tighter text-red-500">QRIS</span>
                    <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 uppercase">GoPay / QRIS</span>
                  </div>
                  <div className="flex gap-2 text-[10px] font-black text-slate-400 uppercase">
                    <span>GoPay</span> • <span>OVO</span> • <span>DANA</span> • <span>ShopeePay</span>
                  </div>
                </div>

                {/* QR Image — dari Midtrans Core API langsung */}
                {loadingQris ? (
                  <div className="py-10 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-slate-400 font-medium">Memuat QRIS dari Midtrans...</p>
                  </div>
                ) : qrisData?.qrImageUrl ? (
                  <div className="p-3 bg-white rounded-2xl border-4 border-slate-800 shadow-2xl my-2 flex flex-col items-center">
                    <img
                      src={qrisData.qrImageUrl}
                      alt="QRIS Midtrans Live"
                      className="w-60 h-60 object-contain"
                      onError={(e) => { e.target.style.display='none'; }}
                    />
                    <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-wider">Midtrans Live QRIS • GoPay</p>
                  </div>
                ) : qrisError ? (
                  <div className="py-6 my-2 flex flex-col items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <p className="text-xs text-red-400 font-bold">{qrisError}</p>
                    <button
                      onClick={() => fetchGopayQris(order.id)}
                      className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
                    >
                      🔄 Coba Lagi
                    </button>
                  </div>
                ) : null}

                <p className="text-xs font-bold text-slate-300 mt-3 max-w-xs leading-relaxed">
                  Scan kode QRIS di atas dengan aplikasi GoPay, OVO, DANA, ShopeePay, atau mobile banking Anda.
                </p>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-2 mt-4 w-full justify-center">
                  {qrisData?.deeplinkUrl && (
                    <a
                      href={qrisData.deeplinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>📱 Buka di Aplikasi GoPay</span>
                    </a>
                  )}
                  {(!qrisData?.qrImageUrl && !loadingQris) && (
                    <button
                      onClick={() => { onClose(); onOpenSnap(order); }}
                      className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      <span>Buka Midtrans Snap</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300 bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                <p className="font-bold text-white mb-2">Cara Pembayaran QRIS / GoPay:</p>
                <ol className="list-decimal list-inside space-y-2 text-slate-300">
                  <li>Buka aplikasi <strong className="text-white">GoPay, OVO, DANA, ShopeePay, LinkAja</strong>, atau m-Banking (<strong className="text-white">BCA / Livin / BRImo</strong>).</li>
                  <li>Pilih menu <strong className="text-white">Scan / Pindai QRIS</strong>.</li>
                  <li>Arahkan kamera ke kode QRIS di atas.</li>
                  <li>Pastikan nominal tagihan sebesar <strong className="text-emerald-400">{formatPrice(order.total)}</strong> sudah sesuai.</li>
                  <li>Konfirmasi dan masukkan PIN transaksi Anda.</li>
                </ol>
              </div>
            </div>
          ) : isBankTransfer && vaObj ? (
            /* ONLY SPECIFIC BANK VA CHOSEN IN MIDTRANS */
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Nomor Virtual Account (Bank {vaObj.bank.toUpperCase()})
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Midtrans Live</span>
                </div>
                
                <div className="flex items-center justify-between gap-4 mt-2">
                  <div className="text-xl sm:text-2xl font-mono font-black text-white tracking-widest break-all">
                    {vaObj.va_number}
                  </div>
                  <button
                    onClick={() => handleCopy(vaObj.va_number, 'Nomor VA')}
                    className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    <span>{copiedField === 'Nomor VA' ? 'Tersalin!' : 'Salin VA'}</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex border-b border-slate-800 mb-4">
                  {[
                    { id: 'mbanking', label: 'm-Banking' },
                    { id: 'atm', label: 'ATM' },
                    { id: 'ibanking', label: 'Internet Banking' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setInstructionTab(t.id)}
                      className={`py-2 px-4 text-xs font-bold transition-all border-b-2 ${instructionTab === t.id ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-500 hover:text-white'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                  {instructionTab === 'mbanking' && (
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Buka aplikasi m-Banking <strong className="text-white uppercase">{vaObj.bank}</strong> pada ponsel Anda.</li>
                      <li>Pilih menu <strong className="text-white">Transfer</strong> &gt; <strong className="text-white">Virtual Account</strong>.</li>
                      <li>Masukkan Nomor Virtual Account: <code className="bg-slate-800 px-2 py-0.5 rounded text-amber-400 font-mono font-bold">{vaObj.va_number}</code>.</li>
                      <li>Pastikan nominal transaksi sebesar <strong className="text-emerald-400">{formatPrice(order.total)}</strong> sudah sesuai.</li>
                      <li>Masukkan PIN m-Banking Anda dan selesaikan pembayaran.</li>
                    </ol>
                  )}
                  {instructionTab === 'atm' && (
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Masukkan Kartu ATM <strong className="text-white uppercase">{vaObj.bank}</strong> & PIN Anda.</li>
                      <li>Pilih menu <strong className="text-white">Transfer</strong> &gt; <strong className="text-white">Ke Rek Virtual Account</strong>.</li>
                      <li>Masukkan Nomor Virtual Account: <code className="bg-slate-800 px-2 py-0.5 rounded text-amber-400 font-mono font-bold">{vaObj.va_number}</code>.</li>
                      <li>Periksa detail pembayaran lalu konfirmasi transaksi Anda.</li>
                    </ol>
                  )}
                  {instructionTab === 'ibanking' && (
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Login ke Internet Banking <strong className="text-white uppercase">{vaObj.bank}</strong> Anda.</li>
                      <li>Pilih menu <strong className="text-white">Pembayaran Tagihan</strong> &gt; <strong className="text-white">Virtual Account</strong>.</li>
                      <li>Masukkan Kode VA <code className="bg-slate-800 px-2 py-0.5 rounded text-amber-400 font-mono font-bold">{vaObj.va_number}</code>.</li>
                    </ol>
                  )}
                </div>
              </div>
            </div>
          ) : permataVa ? (
            /* ONLY PERMATA VA */
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nomor Permata Virtual Account</span>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Midtrans Live</span>
                </div>
                <div className="flex items-center justify-between gap-4 mt-2">
                  <div className="text-xl sm:text-2xl font-mono font-black text-white tracking-widest break-all">
                    {permataVa}
                  </div>
                  <button
                    onClick={() => handleCopy(permataVa, 'Nomor VA Permata')}
                    className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-black uppercase tracking-wider transition-all flex-shrink-0"
                  >
                    <span>{copiedField === 'Nomor VA Permata' ? 'Tersalin!' : 'Salin VA'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : isEchannel && (midtransData?.biller_code || midtransData?.bill_key) ? (
            /* ONLY MANDIRI BILL PAYMENT */
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Kode Perusahaan (Biller Code)</span>
                  <div className="text-xl font-mono font-black text-amber-400">{midtransData.biller_code || '70012'}</div>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Kode Pembayaran (Bill Key)</span>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-xl sm:text-2xl font-mono font-black text-white tracking-widest">{midtransData.bill_key}</div>
                    <button
                      onClick={() => handleCopy(midtransData.bill_key, 'Bill Key Mandiri')}
                      className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-black uppercase tracking-wider transition-all flex-shrink-0"
                    >
                      <span>{copiedField === 'Bill Key Mandiri' ? 'Tersalin!' : 'Salin Key'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* IF NO METHOD WAS CHOSEN YET */
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <h4 className="text-base font-bold text-white">Metode Pembayaran Belum Selesai Ditentukan</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Anda dapat memilih metode pembayaran dan menyelesaikan transaksi ini via Midtrans Snap.
              </p>
              <button
                onClick={() => { onClose(); onOpenSnap(order); }}
                className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-600/20 transition-all inline-flex items-center gap-2"
              >
                <span>⚡ Buka Popup Midtrans Snap</span>
              </button>
            </div>
          )}

          {/* Action Footer Buttons */}
          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={async () => {
                setSimulatingPaid(true);
                try {
                  const res = await apiFetch('/api/payment/confirm', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      orderId: order.id,
                      paymentFinalStatus: 'paid',
                    }),
                  });
                  if (res.ok) {
                    if (onRefreshOrders) onRefreshOrders();
                    onClose();
                    alert('🎉 Pembayaran berhasil disimulasikan LUNAS! Pesanan kamu kini berstatus Processing.');
                  } else {
                    alert('Gagal konfirmasi pembayaran.');
                  }
                } catch (e) {
                  alert('Terjadi kesalahan jaringan.');
                } finally {
                  setSimulatingPaid(false);
                }
              }}
              disabled={simulatingPaid}
              className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2"
            >
              {simulatingPaid ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses Lunas...</span>
                </>
              ) : (
                <>
                  <span>⚡ Simulasi Bayar Lunas Instan (Sandbox Test)</span>
                </>
              )}
            </button>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCheckStatus}
                disabled={checkingStatus}
                className="flex-1 py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                {checkingStatus ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Memeriksa...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>Cek Status Pembayaran</span>
                  </>
                )}
              </button>

              <button
                onClick={() => { onClose(); onCancelOrder(order.id); }}
                className="py-3.5 px-4 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold uppercase text-xs tracking-widest transition-all"
              >
                Batalkan Pesanan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuyerProfilePage() {
  const router = useRouter();
  const { user, isLoading, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMobileTabMenu, setShowMobileTabMenu] = useState(false);
  const [wtbList, setWtbList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ device: '', budget: '', condition: 'Any', notes: '' });
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '', bio: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [orders, setOrders] = useState([]);
  const [myTradeIns, setMyTradeIns] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewModal, setReviewModal] = useState({ isOpen: false, item: null, orderItemId: null, orderId: null, rating: 5, comment: '', imageFile: null });
  const [uploadingReview, setUploadingReview] = useState(false);
  const [returnModal, setReturnModal] = useState({ isOpen: false, item: null, orderItemId: null, orderId: null, reason: '', imageFile: null });
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, order: null });
  const [trackingModal, setTrackingModal] = useState({ isOpen: false, order: null });
  const [buyerTradeInRequests, setBuyerTradeInRequests] = useState([]);
  const [tradeInShipModal, setTradeInShipModal] = useState({ isOpen: false, tradeInId: null, waybill: '', courier: 'JNE Express' });
  const [previewImageModal, setPreviewImageModal] = useState(null);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState(null);
  const [tradeInPage, setTradeInPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [wtbPage, setWtbPage] = useState(1);
  const [myUsedPage, setMyUsedPage] = useState(1);
  const [detailTradeInModal, setDetailTradeInModal] = useState(null);
  const [orderDetailModal, setOrderDetailModal] = useState({ isOpen: false, order: null });

  const handleProceedTradeInCheckout = async (t) => {
    const targetDeviceId = t.device?.id || t.device_id;
    if (!targetDeviceId) {
      alert('Informasi produk target tidak ditemukan.');
      return;
    }
    setCheckoutLoadingId(t.id);
    try {
      const targetDeviceName = t.device?.name || 'Produk HP Target';
      const targetDevicePrice = t.device?.price || 0;
      const targetDeviceImage = t.device?.image || '/placeholder.png';
      const targetDeviceCategory = t.device?.category || 'smartphone';
      const targetDeviceLocation = t.device?.location || 'Jakarta';

      // First, fetch current cart to find existing cartItemId for this device
      let existingCartItemId = null;
      try {
        const getCartRes = await apiFetch('/api/cart', { method: 'GET' });
        if (getCartRes.ok) {
          const getCartData = await getCartRes.json();
          const found = (getCartData.items || []).find(
            (i) => String(i.deviceId || i.id) === String(targetDeviceId)
          );
          if (found) existingCartItemId = found.cartItemId;
        }
      } catch (e) {
        console.warn('GET cart fallback:', e);
      }

      // If not in cart, add it with qty=1, then get the new cartItemId
      if (!existingCartItemId) {
        try {
          const cartRes = await apiFetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: targetDeviceId, quantity: 1 }),
          });
          if (cartRes.ok) {
            const cartData = await cartRes.json();
            const found = (cartData.items || []).find(
              (i) => String(i.deviceId || i.id) === String(targetDeviceId)
            );
            if (found) existingCartItemId = found.cartItemId;
          }
        } catch (e) {
          console.warn('POST cart fallback:', e);
        }
      }

      const checkoutItem = {
        cartItemId: existingCartItemId || null,
        id: targetDeviceId,
        deviceId: targetDeviceId,
        name: targetDeviceName,
        price: targetDevicePrice,
        image: targetDeviceImage,
        category: targetDeviceCategory,
        location: targetDeviceLocation,
        cartQty: 1,
      };

      sessionStorage.setItem('checkout_items', JSON.stringify([checkoutItem]));
      localStorage.setItem('trade_in_checkout', JSON.stringify({
        tradeInId: t.id,
        discount: Number(t.final_trade_in_value || t.ai_estimated_value || 0),
        oldDeviceName: t.old_device_name,
        targetDeviceId: String(targetDeviceId)
      }));

      window.dispatchEvent(new Event('cartUpdated'));
      if (router && typeof router.push === 'function') {
        router.push('/checkout');
      } else {
        window.location.href = '/checkout';
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Gagal melanjutkan ke checkout. Silakan coba lagi.');
    } finally {
      setCheckoutLoadingId(null);
    }
  };

  const handleAcceptCounterOffer = async (t) => {
    try {
      const res = await apiFetch(`/api/trade-in/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept_counter' }),
      });
      if (res.ok) {
        const data = await res.json();
        setBuyerTradeInRequests(prev => prev.map(item => item.id === t.id ? data.tradeIn : item));
        handleProceedTradeInCheckout(data.tradeIn);
      }
    } catch (e) {
      alert('Gagal menyetujui penawaran balik.');
    }
  };

  const handleRejectCounterOffer = async (t) => {
    if (!confirm('Apakah kamu yakin ingin menolak penawaran harga ini?')) return;
    try {
      const res = await apiFetch(`/api/trade-in/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: 'Ditolak oleh pembeli' }),
      });
      if (res.ok) {
        const data = await res.json();
        setBuyerTradeInRequests(prev => prev.map(item => item.id === t.id ? data.tradeIn : item));
      }
    } catch (e) {
      alert('Gagal menolak penawaran.');
    }
  };

  const handleConfirmOrderCompleted = async (orderId) => {
    if (!confirm('Apakah kamu yakin paket pesanan sudah diterima dengan baik dan lengkap?')) return;
    try {
      const res = await apiFetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: 'Completed' }),
      });
      if (res.ok) {
        refreshOrders();
        alert('🎉 Pesanan Selesai! Terima kasih telah berbelanja di GadgetTrustX.');
      } else {
        alert('Gagal mengonfirmasi pesanan selesai.');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  const refreshOrders = async () => {
    try {
      const res = await apiFetch('/api/orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!user) return undefined;

    const timeoutId = window.setTimeout(() => {
      setProfileForm({ name: user.name || '', phone: user.phone || '', address: user.address || '', bio: user.bio || '' });
      if (user.avatar) setAvatarPreview(user.avatar);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'buyer') return;

    apiFetch('/api/wtb')
      .then((res) => res.json())
      .then((data) => setWtbList(data.listings || []))
      .catch((error) => console.error('Failed to load WTB listings', error));

    refreshOrders();

    fetch('/api/devices')
      .then((res) => res.json())
      .then((data) => setMyTradeIns((data.devices || []).filter((device) => device.isTradeIn && device.seller?.id === user.email)))
      .catch((error) => console.error('Failed to load trade-in listings', error));

    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews || []))
      .catch((error) => console.error('Failed to load reviews', error));

    apiFetch('/api/trade-in')
      .then((res) => res.json())
      .then((data) => setBuyerTradeInRequests(data.tradeIns || []))
      .catch((error) => console.error('Failed to load buyer trade-in requests', error));
  }, [user]);

  // Direct Midtrans Snap launcher
  const handleOpenMidtransSnap = async (order) => {
    try {
      const res = await apiFetch('/api/payment/resume-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (window.alert) window.alert(data.error || 'Gagal memuat sesi Midtrans Snap.', 'error');
        return;
      }

      if (window.snap) {
        window.snap.pay(data.snapToken, {
          onSuccess: async (result) => {
            await apiFetch('/api/payment/confirm', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: order.id, midtransResult: result, paymentFinalStatus: 'paid' }),
            });
            refreshOrders();
            if (window.alert) window.alert('Pembayaran berhasil dikonfirmasi!', 'success');
          },
          onPending: async (result) => {
            await apiFetch('/api/payment/confirm', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: order.id, midtransResult: result, paymentFinalStatus: 'processing' }),
            });
            try {
              localStorage.setItem('pending_payment_' + order.id, JSON.stringify(result));
            } catch (e) {}
            refreshOrders();
          },
          onError: async (result) => {
            if (window.alert) window.alert('Pembayaran gagal atau dibatalkan.', 'error');
          },
          onClose: () => {
            refreshOrders();
          }
        });
      }
    } catch (err) {
      if (window.alert) window.alert('Terjadi kesalahan koneksi.', 'error');
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const nameVal = validateName(profileForm.name);
    if (!nameVal.isValid) {
      alert(`Gagal: ${nameVal.error}`);
      return;
    }
    if (profileForm.phone) {
      const phoneVal = validatePhone(profileForm.phone);
      if (!phoneVal.isValid) {
        alert(`Gagal: ${phoneVal.error}`);
        return;
      }
    }
    setSavingProfile(true);
    let avatarUrl = user?.avatar || null;
    const fileInput = e.target.elements.avatarFile;
    if (fileInput && fileInput.files[0]) {
      const fd = new FormData();
      fd.append('file', fileInput.files[0]);
      try {
        const res = await apiFetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) avatarUrl = data.url;
      } catch (err) { console.error('Avatar upload failed', err); }
    }
    const result = await updateProfile({ ...profileForm, avatar: avatarUrl });
    setSavingProfile(false);
    if (!result.success) {
      alert(`Gagal menyimpan profile: ${result.message}`);
      return;
    }
    alert('Profil berhasil diperbarui!');
  };

  const handleWtbSubmit = async (e) => {
    e.preventDefault();
    let result;
    if (editingId) {
      const res = await apiFetch('/api/wtb', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...formData }),
      });
      result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Gagal memperbarui request.');
        return;
      }
      setWtbList((items) => items.map((item) => item.id === editingId ? result.listing : item));
    } else {
      const res = await apiFetch('/api/wtb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Gagal membuat request.');
        return;
      }
      setWtbList((items) => [result.listing, ...items]);
    }
    setFormData({ device: '', budget: '', condition: 'Any', notes: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModal.item || !user) {
      alert('Data ulasan belum lengkap. Coba buka ulang halaman.');
      return;
    }

    setUploadingReview(true);
    let imageUrl = null;
    if (reviewModal.imageFile) {
      const fd = new FormData();
      fd.append('file', reviewModal.imageFile);
      try {
        const res = await apiFetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) imageUrl = data.url;
      } catch (err) { console.error('Review image upload failed', err); }
    }

    const reviewPayload = {
      deviceId: reviewModal.item.id,
      deviceName: reviewModal.item.name,
      buyerName: user?.name,
      buyerEmail: user?.email,
      sellerEmail: reviewModal.item.seller?.id,
      rating: reviewModal.rating,
      comment: reviewModal.comment,
      image: imageUrl,
      orderId: reviewModal.orderId,
      orderItemId: reviewModal.orderItemId,
    };
    const reviewRes = await apiFetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewPayload),
    });
    const reviewData = await reviewRes.json();
    if (!reviewRes.ok) {
      setUploadingReview(false);
      if (reviewRes.status === 409) {
        alert('Anda sudah memberikan ulasan untuk produk ini sebelumnya.');
        setReviewModal({ isOpen: false, item: null, orderItemId: null, orderId: null, rating: 5, comment: '', imageFile: null });
        refreshOrders();
      } else {
        alert(reviewData.error || 'Gagal menyimpan ulasan.');
      }
      return;
    }
    setReviews((items) => [reviewData.review, ...items]);
    setUploadingReview(false);
    setReviewModal({ isOpen: false, item: null, orderItemId: null, orderId: null, rating: 5, comment: '', imageFile: null });
    alert('Terima kasih atas ulasan Anda! Pesanan akan otomatis selesai jika semua item sudah diulas.');
    // Refresh orders so status Completed is reflected
    refreshOrders();
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReturn(true);

    let imageUrl = null;
    const fileInput = e.target.elements.returnImageFile;
    if (fileInput && fileInput.files[0]) {
      const fd = new FormData();
      fd.append('file', fileInput.files[0]);
      try {
        const res = await apiFetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) imageUrl = data.url;
      } catch (err) { console.error('Return image upload failed', err); }
    }

    const response = await apiFetch('/api/orders/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderItemId: returnModal.orderItemId,
        reason: returnModal.reason,
        image: imageUrl,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setSubmittingReturn(false);
      alert(data.error || 'Gagal mengirim return request.');
      return;
    }

    refreshOrders();
    setSubmittingReturn(false);
    setReturnModal({ isOpen: false, item: null, orderItemId: null, orderId: null, reason: '', imageFile: null });
    alert('Request return berhasil dikirim. Tim kami akan meninjau bukti Anda.');
  };

  const handleCancelOrder = async (orderId) => {
    const isConfirmed = window.confirmCustom
      ? await window.confirmCustom({
          title: 'Batalkan Pesanan',
          message: `Apakah Anda yakin ingin membatalkan Pesanan #${orderId.slice(-6)}? Tindakan ini tidak dapat dibatalkan.`,
          type: 'danger',
          confirmText: 'Ya, Batalkan Pesanan',
          cancelText: 'Kembali'
        })
      : window.confirm('Yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.');

    if (!isConfirmed) return;
    setCancellingOrderId(orderId);
    try {
      const res = await apiFetch('/api/payment/cancel', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal membatalkan pesanan.', 'error');
        return;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'Cancelled', payment_status: 'failed' } : o
        )
      );
      alert('Pesanan berhasil dibatalkan.', 'success');
    } catch (err) {
      alert('Terjadi kesalahan saat membatalkan pesanan.', 'error');
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (isLoading || !user || user.role !== 'buyer') {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      </AuthGuard>
    );
  }

  const safeOrders = orders.filter((order) => order?.id);
  const myRequests = wtbList.filter(item => item?.authorEmail === user.email);

  return (
    <AuthGuard>
      {/* Load Midtrans Snap Script directly */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />

      <div className="min-h-screen pb-20 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Sidebar Navigation */}
            <aside className="lg:col-span-3 space-y-6">
              <div className="glass-panel p-6 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden ring-4 ring-white/5 shadow-2xl">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-2xl font-black text-white">
                        {(user.name || '?').charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{user.name}</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{user.email}</p>
                <div className="mt-4 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Buyer Terverifikasi</div>
              </div>

              {/* Navigation Items Data */}
              {(() => {
                const buyerNavItems = [
                  { id: 'dashboard', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                  { id: 'orders', label: 'Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', count: safeOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length },
                  { id: 'wtb', label: 'Request', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', count: myRequests.length },
                  { id: 'tradein', label: 'Pengajuan Tukar Tambah', icon: 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4', count: buyerTradeInRequests.filter(t => t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'Completed' && t.status !== 'Cancelled' && t.status !== 'rejected').length },
                  { id: 'my_used_phones', label: 'HP Bekas Saya', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z', count: myTradeIns.length },
                  { id: 'profile', label: 'Pengaturan', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
                ];
                const activeNavObj = buyerNavItems.find(item => item.id === activeTab) || buyerNavItems[0];

                return (
                  <>
                    {/* Mobile Navigation Pop-up Selector Button (Mobile Only) */}
                    <div className="lg:hidden w-full mt-4">
                      <button
                        type="button"
                        onClick={() => setShowMobileTabMenu(true)}
                        className="w-full glass-panel p-4 flex items-center justify-between border-emerald-500/40 bg-slate-900/90 text-white font-bold text-xs sm:text-sm shadow-xl rounded-2xl cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Menu:</span>
                          <span className="flex items-center gap-2 text-emerald-400 font-black">
                            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={activeNavObj.icon}></path></svg>
                            {activeNavObj.label}
                          </span>
                          {activeNavObj.count > 0 && (
                            <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                              {activeNavObj.count}
                            </span>
                          )}
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          Pilih ▾
                        </span>
                      </button>
                    </div>

                    {/* Pop-up Navigation Modal Sheet for Mobile */}
                    {showMobileTabMenu && (
                      <div
                        className="fixed inset-0 z-[150] bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in lg:hidden"
                        onClick={() => setShowMobileTabMenu(false)}
                      >
                        <div
                          className="bg-[#0d1117] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-scale-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-between items-center border-b border-white/10 pb-3">
                            <div>
                              <h3 className="text-base font-black text-white">Menu Dashboard Buyer</h3>
                              <p className="text-[10px] text-slate-400 font-medium">Pilih bagian dashboard yang ingin dibuka</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowMobileTabMenu(false)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-white/10"
                            >
                              ✕ Tutup
                            </button>
                          </div>

                          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                            {buyerNavItems.map(item => (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setActiveTab(item.id);
                                  setShowForm(false);
                                  setShowMobileTabMenu(false);
                                }}
                                className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all font-bold text-xs ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 border border-white/5'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-emerald-400'}`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg>
                                  </div>
                                  <span className="text-left font-bold text-sm">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {item.count > 0 && (
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                      {item.count}
                                    </span>
                                  )}
                                  {activeTab === item.id && <span className="text-sm font-black">✓</span>}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Desktop Sidebar Navigation (Hidden on Mobile) */}
                    <nav className="hidden lg:flex flex-col gap-1 glass-panel p-2 mt-4">
                      {buyerNavItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => { setActiveTab(item.id); setShowForm(false); }}
                          className={`flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-sm ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg>
                            {item.label}
                          </div>
                          {item.count > 0 && <span className="ml-2 bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-lg font-black">{item.count}</span>}
                        </button>
                      ))}
                    </nav>
                  </>
                );
              })()}
            </aside>

            {/* Main Content Area */}
            <main className="lg:col-span-9">
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                    <div className="glass-panel p-4 sm:p-6 md:p-8 bg-gradient-to-br from-emerald-600/10 to-transparent border-emerald-500/20">
                      <p className="text-[9px] sm:text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-1 sm:mb-2">Total Belanja</p>
                      <h3 className="text-xl sm:text-3xl md:text-4xl font-black text-white mb-1 sm:mb-2 break-all">{formatPrice(safeOrders.reduce((acc, curr) => acc + (curr.total || 0), 0))}</h3>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest">{safeOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length} pesanan aktif</p>
                    </div>
                    <div className="glass-panel p-4 sm:p-6 md:p-8">
                      <p className="text-[9px] sm:text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1 sm:mb-2">Request Aktif</p>
                      <h3 className="text-2xl sm:text-4xl font-black text-white mb-1 sm:mb-2">{myRequests.length}</h3>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Sedang mencari deal</p>
                    </div>
                    <div className="glass-panel p-4 sm:p-6 md:p-8">
                      <p className="text-[9px] sm:text-[10px] text-purple-400 font-black uppercase tracking-widest mb-1 sm:mb-2">Nilai HP Bekas</p>
                      <h3 className="text-xl sm:text-3xl md:text-4xl font-black text-white mb-1 sm:mb-2">{formatPrice(myTradeIns.reduce((acc, curr) => acc + (curr.price || 0), 0))}</h3>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-medium">{myTradeIns.length} item terdaftar</p>
                    </div>
                  </div>

                  <div className="glass-panel p-4 sm:p-8">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Pesanan Terbaru</h3>
                    <div className="space-y-3 sm:space-y-4">
                      {safeOrders.length > 0 ? safeOrders.slice(0, 3).map(order => (
                        <div key={order.id} className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800">
                          <div className="flex gap-4 items-center">
                            <div
                              className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden border border-white/5 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform group relative"
                              onClick={() => order.items && order.items[0]?.image && setPreviewImageModal(order.items[0].image)}
                              title="Klik untuk memperbesar foto"
                            >
                              {order.items && order.items[0]?.image ? (
                                <>
                                  <img src={order.items[0].image} className="w-full h-full object-contain p-1.5" alt="Produk" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-bold text-white transition-opacity">
                                    🔍
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">Pesanan #{order.id.slice(-6)}</p>
                              <p className="text-[10px] text-slate-500 uppercase font-black">
                                {order.date} • {(order.items || []).reduce((sum, i) => sum + (i?.cartQty || 1), 0)} Item
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-emerald-400">{formatPrice(order.total)}</p>
                            {order.status === 'Pending Payment' ? (
                              <button
                                onClick={() => setPaymentModal({ isOpen: true, order })}
                                className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-500/40 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
                              >
                                <svg className="w-3.5 h-3.5 text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                                <span>Pending Payment</span>
                              </button>
                            ) : (
                              <p className="text-[10px] font-black uppercase text-blue-500 tracking-tighter">{order.status}</p>
                            )}
                          </div>
                        </div>
                      )) : (
                        <p className="text-slate-500 text-center py-10">Belum ada pesanan. Siap mulai belanja pertama?</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="text-2xl font-black text-white mb-6">Riwayat Pesanan</h2>
                  {safeOrders.length === 0 && (
                    <div className="glass-panel p-16 text-center">
                      <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                        <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                      </div>
                      <p className="text-slate-500 font-bold">Belum ada pesanan.</p>
                    </div>
                  )}
                  {safeOrders.length > 0 ? (
                    (() => {
                      const itemsPerPage = 10;
                      const totalPages = Math.ceil(safeOrders.length / itemsPerPage) || 1;
                      const currentPage = Math.min(ordersPage, totalPages);
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const paginatedOrders = safeOrders.slice(startIndex, startIndex + itemsPerPage);

                      return (
                        <>
                          {paginatedOrders.map((order) => {
                            const isPendingPayment = order.status === 'Pending Payment' && order.payment_status !== 'paid';
                            const isCancelled = order.status === 'Cancelled';
                            const statusColor =
                              isCancelled                               ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              isPendingPayment                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              order.status === 'Processing'             ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              order.status === 'Shipped'                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                              order.status === 'Delivered'              ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                              order.status === 'Completed'              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              order.status === 'Partially Returned'     ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                              order.status === 'Refunded'               ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                                          'bg-slate-500/10 text-slate-400 border-slate-500/20';
                            return (
                              <div key={order.id} className={`glass-panel p-3.5 sm:p-5 rounded-2xl overflow-hidden transition-all ${isCancelled ? 'opacity-60' : 'hover:border-emerald-500/30'}`}>
                                {/* Header Row */}
                                <div className="flex items-center justify-between border-b border-white/5 pb-2.5 gap-2 flex-wrap mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs sm:text-sm font-black text-white uppercase tracking-tight">#{order.id.slice(-8)}</span>
                                    <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full">
                                      {(order.items || []).reduce((sum, i) => sum + (i?.cartQty || 1), 0)} item
                                    </span>
                                    {order.date && <span className="text-[10px] text-slate-500 font-medium">({order.date})</span>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isPendingPayment ? (
                                      <button
                                        onClick={() => setPaymentModal({ isOpen: true, order })}
                                        className="px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-amber-500/40 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                        <span>Pending Payment</span>
                                      </button>
                                    ) : (
                                      <span className={`px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider border ${statusColor}`}>
                                        {order.status}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Products list */}
                                <div className="space-y-2 mb-3">
                                  {(order.items || []).filter(Boolean).map((item, itemIdx) => (
                                    <div key={itemIdx} className="flex items-center gap-2.5 sm:gap-4 p-2.5 sm:p-3 rounded-xl bg-slate-900/60 border border-white/5">
                                      <div
                                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-[#0a0f1a] border border-white/5 p-1 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform group relative shadow-md"
                                        onClick={() => item.image && setPreviewImageModal(item.image)}
                                        title="Klik untuk memperbesar foto produk"
                                      >
                                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                      </div>
                                      <div className="flex-grow min-w-0">
                                        <h5 className="font-bold text-white text-xs sm:text-sm truncate">
                                          {item.name} <span className="text-blue-400 font-bold text-[10px] sm:text-xs">x{item.cartQty || 1}</span>
                                        </h5>
                                        <p className="text-[10px] text-slate-400 truncate">
                                          Seller: <span className="text-slate-300">{item.seller?.name || 'Seller'}</span>
                                        </p>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <p className="font-black text-white text-xs sm:text-sm">{formatPrice(item.price * (item.cartQty || 1))}</p>
                                        {!isCancelled && !isPendingPayment && (
                                          <div className="flex gap-1.5 mt-1 justify-end">
                                            {item.returnStatus === 'Pending' ? (
                                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">↩ Return Diproses</span>
                                            ) : item.returnStatus === 'Approved' ? (
                                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">✓ Return Disetujui</span>
                                            ) : item.returnStatus === 'Rejected' ? (
                                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">✕ Return Ditolak</span>
                                            ) : order.ratedItems?.includes(item.orderItemId) ? (
                                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">★ Sudah Diulas</span>
                                            ) : (
                                              <>
                                                {order.status === 'Delivered' && (
                                                  <button onClick={() => setReviewModal({ ...reviewModal, isOpen: true, item, orderItemId: item.orderItemId, orderId: order.id })} className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all">★ Ulas</button>
                                                )}
                                                {order.status === 'Delivered' && (
                                                  <button onClick={() => setReturnModal({ ...returnModal, isOpen: true, item, orderItemId: item.orderItemId, orderId: order.id })} className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all">↩ Return</button>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Footer Bar */}
                                <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Tagihan:</span>
                                    <span className="text-xs sm:text-base font-black text-emerald-400">{formatPrice(order.total)}</span>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                      onClick={() => setOrderDetailModal({ isOpen: true, order })}
                                      className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>📋 Detail</span>
                                    </button>
                                    {order.status !== 'Pending Payment' && order.status !== 'Cancelled' && (
                                      <button
                                        onClick={() => setTrackingModal({ isOpen: true, order })}
                                        className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all flex items-center gap-1 cursor-pointer"
                                      >
                                        <span>📍 Lacak</span>
                                      </button>
                                    )}
                                    {order.status === 'Delivered' && (
                                      <button
                                        onClick={() => handleConfirmOrderCompleted(order.id)}
                                        className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                                      >
                                        <span>✅ Diterima</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Pagination Bar (Maksimal 10 Pesanan Per Halaman) */}
                          {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-[#0d1117] border border-white/[0.08] text-xs mt-6">
                              <span className="text-slate-400 font-bold">
                                Menampilkan <strong className="text-white">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, safeOrders.length)}</strong> dari <strong className="text-white">{safeOrders.length}</strong> pesanan (Halaman {currentPage} dari {totalPages})
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setOrdersPage((p) => Math.max(p - 1, 1))}
                                  disabled={currentPage === 1}
                                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all border border-slate-700"
                                >
                                  ← Sebelumnya
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setOrdersPage((p) => Math.min(p + 1, totalPages))}
                                  disabled={currentPage === totalPages}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all border border-emerald-500 shadow-lg shadow-emerald-500/20"
                                >
                                  Selanjutnya →
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()
                  ) : (
                    <div className="glass-panel p-16 text-center">
                      <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                        <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                      </div>
                      <p className="text-slate-500 font-bold">Belum ada pesanan.</p>
                    </div>
                  )}

                </div>
              )}

              {activeTab === 'wtb' && (
                <div className="animate-fade-in">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h2 className="text-3xl font-black text-white tracking-tight">WTB Requests</h2>
                      <p className="text-slate-500 text-sm mt-1">Seller akan melihat request ini dan mengirim penawaran custom.</p>
                    </div>
                    <button onClick={() => { setEditingId(null); setFormData({ device: '', budget: '', condition: 'Any', notes: '' }); setShowForm(true); }} className="btn-primary !px-8">Request Baru</button>
                  </div>

                  {showForm ? (
                    <div className="glass-panel p-10 mb-8 border-emerald-500/30">
                      <form onSubmit={handleWtbSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Perangkat Target</label>
                          <input type="text" required placeholder="e.g. iPhone 15 Pro Max 256GB" className="input-field !text-lg !py-4" value={formData.device} onChange={e => setFormData({ ...formData, device: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Budget Maksimal (IDR)</label>
                          <input type="number" required placeholder="15000000" className="input-field" value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Preferensi Kondisi</label>
                          <select className="input-field appearance-none" value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })}>
                            {['Any', 'Brand New', 'Like New', 'Good', 'Fair'].map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Catatan untuk Seller</label>
                          <textarea rows="3" className="input-field !py-4" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Contoh: battery health harus di atas 90%..."></textarea>
                        </div>
                        <div className="md:col-span-2 flex gap-4">
                          <button type="submit" className="btn-primary !py-4 flex-grow font-black uppercase tracking-widest text-xs">Publikasikan Request</button>
                          <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 bg-slate-900 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all">Batal</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {myRequests.length > 0 ? myRequests.map(item => (
                        <div key={item.id} className="glass-panel p-8 relative group hover:border-emerald-500/30 transition-all">
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                            <button onClick={() => { setEditingId(item.id); setFormData({ device: item.device, budget: item.budget, condition: item.condition, notes: item.notes }); setShowForm(true); }} className="p-2 bg-blue-600 text-white rounded-xl shadow-xl hover:bg-blue-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                            <button onClick={async () => {
                              const res = await apiFetch('/api/wtb', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: item.id }),
                              });
                              if (res.ok) setWtbList((items) => items.filter((listing) => listing.id !== item.id));
                            }} className="p-2 bg-red-600 text-white rounded-xl shadow-xl hover:bg-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                          </div>
                          <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-2">{item.date}</p>
                          <h3 className="text-xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors">{item.device}</h3>
                          <div className="flex gap-4 items-center">
                            <span className="text-lg font-black text-white">Hingga {formatPrice(item.budget)}</span>
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter px-2 py-1 bg-slate-900 rounded-lg">{item.condition}</span>
                          </div>
                          {item.notes && <p className="mt-4 text-xs text-slate-500 italic">&quot;{item.notes}&quot;</p>}
                        </div>
                      )) : (
                        <div className="md:col-span-2 py-20 text-center glass-panel">
                          <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
                            <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">Belum ada request</h3>
                          <p className="text-slate-500 mb-8">Posting perangkat yang dicari dan biarkan deal datang ke Anda.</p>
                          <button onClick={() => setShowForm(true)} className="btn-primary !px-10">Buat WTB</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tradein' && (
                <div className="space-y-10 animate-fade-in">
                  {/* Section 1: Pengajuan Tukar Tambah Saya */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Pengajuan Tukar Tambah Saya</h2>
                        <p className="text-slate-500 text-sm mt-1">Status tukar tambah perangkat lama Anda untuk produk yang Anda beli.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {buyerTradeInRequests.length > 0 ? (
                        (() => {
                          const itemsPerPage = 10;
                          const totalPages = Math.ceil(buyerTradeInRequests.length / itemsPerPage) || 1;
                          const currentPage = Math.min(tradeInPage, totalPages);
                          const startIndex = (currentPage - 1) * itemsPerPage;
                          const paginatedTradeIns = buyerTradeInRequests.slice(startIndex, startIndex + itemsPerPage);

                          return (
                            <>
                              {paginatedTradeIns.map((t) => (
                                <div key={t.id} className="glass-panel p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all space-y-4">
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                                    <div>
                                      <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Trade-In Request #{t.id.slice(0, 8)}</span>
                                      <h3 className="text-lg font-bold text-white mt-1">Produk Target: {t.device?.name}</h3>
                                      <p className="text-xs text-slate-400">Seller: {t.seller?.name || t.seller?.store_name || 'Seller'}</p>
                                    </div>
                                    <div>
                                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                        t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        t.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' :
                                        t.status === 'countered' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse' :
                                        t.status === 'shipping' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                        t.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                      }`}>
                                        {t.status === 'pending' ? '⏳ Menunggu Konfirmasi Penjual' :
                                         t.status === 'approved' ? '✅ Disetujui Penjual' :
                                         t.status === 'countered' ? '💬 Penawaran Balik Penjual' :
                                         t.status === 'shipping' ? '🚚 Pengiriman HP Lama' :
                                         t.status === 'completed' ? '🎉 Selesai' : t.status}
                                      </span>
                                    </div>
                                  </div>

                                  {t.status === 'countered' && (
                                    <div className="p-5 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-3 shadow-lg">
                                      <div>
                                        <p className="text-xs font-bold text-blue-300">💬 Penjual Mengajukan Penawaran Balik (Nego Harga):</p>
                                        <p className="text-2xl font-black text-emerald-400 mt-1">{formatPrice(t.final_trade_in_value)}</p>
                                        {t.rejection_reason && <p className="text-xs text-slate-300 italic mt-1 bg-white/5 p-2.5 rounded-xl border border-white/5">&quot;{t.rejection_reason}&quot;</p>}
                                      </div>
                                      <div className="flex gap-2.5 pt-1">
                                        <button
                                          onClick={() => handleRejectCounterOffer(t)}
                                          className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase transition-colors border border-red-500/20"
                                        >
                                          Tolak Nego
                                        </button>
                                        <button
                                          onClick={() => handleAcceptCounterOffer(t)}
                                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
                                        >
                                          <span>✅ Setujui Harga & Lanjut Checkout</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Case 1: Buyer hasn't shipped old device yet */}
                                  {!t.old_device_waybill && (t.status === 'approved' || t.status === 'pending') && (
                                    <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2 shadow-lg">
                                      <p className="text-sm font-bold text-amber-300">📦 Langkah Selanjutnya: Kirimkan HP Lama Anda ke Penjual</p>
                                      <p className="text-xs text-slate-300 leading-relaxed">
                                        Silakan kirimkan unit HP lama Anda ke toko Penjual, lalu masukkan nomor resinya di bawah. Penjual akan memeriksa fisik HP lama Anda terlebih dahulu sebelum membuka tombol checkout pembayaran diskon.
                                      </p>
                                    </div>
                                  )}

                                  {/* Case 2: Old device shipped, waiting for seller inspection */}
                                  {t.old_device_waybill && !t.old_device_received && t.status !== 'rejected' && (
                                    <div className="p-5 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-2 shadow-lg">
                                      <p className="text-sm font-bold text-blue-300">🚚 HP Lama Sedang Dikirim — Menunggu Verifikasi Fisik oleh Penjual</p>
                                      <p className="text-xs text-slate-300 leading-relaxed">
                                        Nomor resi Anda (<strong className="text-amber-400 font-mono">{t.old_device_courier} - {t.old_device_waybill}</strong>) telah dicatat. Setelah Penjual menerima paket dan mengonfirmasi fisik HP lama Anda tanpa komplain, tombol pembayaran checkout diskon akan otomatis aktif di sini.
                                      </p>
                                    </div>
                                  )}

                                  {/* Case 3: Seller confirmed old device without complaint -> Checkout button ACTIVATED */}
                                  {(t.old_device_received || (t.status === 'completed' && !t.order_id)) && !t.order_id && t.status !== 'rejected' && (
                                    <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg animate-fade-in">
                                      <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/30">
                                          Verifikasi Fisik Lolos (Tanpa Komplain)
                                        </span>
                                        <p className="text-sm font-bold text-emerald-300 mt-1">🎉 Fisik HP Lama Diterima Penjual! Tombol Checkout Aktif</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                          Potongan harga sebesar <strong className="text-emerald-400 font-bold">{formatPrice(t.final_trade_in_value || t.ai_estimated_value)}</strong> telah disetujui. Silakan lanjutkan ke pembayaran checkout untuk membeli HP Baru Anda.
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => handleProceedTradeInCheckout(t)}
                                        disabled={checkoutLoadingId === t.id}
                                        className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
                                      >
                                        {checkoutLoadingId === t.id ? (
                                          <>
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Menyiapkan Checkout...</span>
                                          </>
                                        ) : (
                                          <>
                                            <span>🛒 Lanjutkan ke Pembayaran Checkout</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  )}

                                  {/* Case 4: Order already created & paid */}
                                  {t.order_id && (
                                    <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 flex justify-between items-center text-xs">
                                      <div>
                                        <span className="text-emerald-400 font-bold">✅ Checkout Berhasil (Order #{t.order_id.slice(-8)})</span>
                                        <p className="text-slate-400 text-[11px]">Penjual sedang menyiapkan pengiriman HP Baru ke alamat Anda.</p>
                                      </div>
                                    </div>
                                  )}

                                  {t.status === 'rejected' && (() => {
                                    let parsedRejection = null;
                                    try {
                                      if (t.rejection_reason && t.rejection_reason.startsWith('{')) {
                                        parsedRejection = JSON.parse(t.rejection_reason);
                                      }
                                    } catch (e) {}

                                    const reasonText = parsedRejection?.reason || t.rejection_reason || 'Tidak memenuhi kriteria kelayakan penjual';
                                    const categoryText = parsedRejection?.category;
                                    const proofImages = parsedRejection?.proofImages || [];
                                    const returnWaybill = parsedRejection?.returnWaybill;
                                    const returnCourier = parsedRejection?.returnCourier || 'JNE Express';

                                    return (
                                      <div className="p-5 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-3 shadow-lg">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="text-sm font-bold text-red-300">🚫 Pengajuan Tukar Tambah Ditolak & Diretur oleh Penjual</p>
                                            {categoryText && <span className="text-[10px] font-black uppercase text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 inline-block mt-1">{categoryText}</span>}
                                          </div>
                                        </div>

                                        <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                                          Catatan Alasan Penjual: <strong className="text-red-300 font-bold">&quot;{reasonText}&quot;</strong>
                                        </p>

                                        {/* Grid Foto Bukti Kerusakan Fisik */}
                                        {proofImages.length > 0 && (
                                          <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">📸 Foto Bukti Kerusakan Fisik dari Penjual:</p>
                                            <div className="flex flex-wrap gap-2">
                                              {proofImages.map((imgUrl, i) => (
                                                <button
                                                  key={i}
                                                  type="button"
                                                  onClick={() => setPreviewImageModal(imgUrl)}
                                                  className="w-16 h-16 rounded-xl overflow-hidden border border-red-500/40 hover:scale-105 transition-transform bg-slate-900 cursor-pointer focus:outline-none"
                                                  title="Klik untuk memperbesar foto"
                                                >
                                                  <img src={imgUrl} alt={`Bukti Kerusakan ${i + 1}`} className="w-full h-full object-cover" />
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Info Resi Pengembalian Barang */}
                                        {returnWaybill && (
                                          <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-500/30 text-xs text-purple-300 space-y-1">
                                            <div>Kurir Pengembalian HP Lama: <strong>{returnCourier}</strong></div>
                                            <div>Resi Retur Balik: <strong className="font-mono text-amber-400">{returnWaybill}</strong></div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/5 text-xs">
                                    <div className="flex items-start gap-3.5">
                                      {/* Foto Produk Target / HP Lama */}
                                      <div
                                        className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 border border-white/10 flex-shrink-0 relative group cursor-pointer"
                                        onClick={() => setPreviewImageModal(t.device?.image || (t.old_device_images && t.old_device_images[0]) || '/placeholder.png')}
                                      >
                                        <img
                                          src={t.device?.image || (t.old_device_images && t.old_device_images[0]) || '/placeholder.png'}
                                          alt={t.old_device_name || t.device?.name}
                                          className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold text-white transition-opacity">
                                          🔍 Perbesar
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-[10px] font-black uppercase text-slate-500 block mb-0.5">Perangkat Lama Anda</span>
                                        <p className="text-sm font-bold text-white">{t.old_device_name} ({t.old_device_storage} / {t.old_device_ram})</p>
                                        <p className="text-slate-400 mt-0.5">Kondisi: <span className="text-amber-400 font-bold">{t.old_device_condition}</span> • Battery Health: <span className="text-emerald-400 font-bold">{t.old_device_battery_health || '-'}%</span></p>

                                        {/* Foto Fisik HP Lama Thumbnails */}
                                        {t.old_device_images && t.old_device_images.length > 0 && (
                                          <div className="flex items-center gap-1.5 mt-2">
                                            <span className="text-[9px] font-bold text-slate-500">Foto Fisik:</span>
                                            {t.old_device_images.map((imgUrl, i) => (
                                              <button
                                                key={i}
                                                type="button"
                                                onClick={() => setPreviewImageModal(imgUrl)}
                                                className="w-6 h-6 rounded-md overflow-hidden border border-white/10 hover:border-purple-400 transition-all cursor-pointer"
                                              >
                                                <img src={imgUrl} alt={`Foto fisik ${i + 1}`} className="w-full h-full object-cover" />
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Potongan Harga Trade-In</span>
                                      <p className="text-xl font-black text-emerald-400">{formatPrice(t.final_trade_in_value || t.ai_estimated_value)}</p>
                                      {t.old_device_waybill && (
                                        <p className="text-[11px] text-purple-300 mt-2 font-bold">Resi Kirim HP Lama: {t.old_device_courier} - {t.old_device_waybill}</p>
                                      )}
                                      <div className="flex flex-wrap gap-2 justify-end pt-2">
                                        <button
                                          onClick={() => setDetailTradeInModal(t)}
                                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                                        >
                                          <span>📋 Detail Form Data</span>
                                        </button>
                                        {t.old_device_waybill && (
                                          <button
                                            onClick={() => setTrackingModal({ isOpen: true, order: null, tradeIn: t })}
                                            className="px-4 py-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/10"
                                          >
                                            <span>🚚 Lacak Pengiriman</span>
                                          </button>
                                        )}
                                        <button
                                          onClick={() => setTradeInShipModal({ isOpen: true, tradeInId: t.id, waybill: t.old_device_waybill || '', courier: t.old_device_courier || 'JNE Express' })}
                                          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-500/20 cursor-pointer"
                                        >
                                          📦 {t.old_device_waybill ? 'Ubah Resi Kirim' : 'Input Resi Kirim'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {/* Pagination Bar (Maksimal 10 HP Bekas Per Halaman) */}
                              {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-[#0d1117] border border-white/[0.08] text-xs mt-6">
                                  <span className="text-slate-400 font-bold">
                                    Menampilkan <strong className="text-white">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, buyerTradeInRequests.length)}</strong> dari <strong className="text-white">{buyerTradeInRequests.length}</strong> pengajuan HP Bekas (Halaman {currentPage} dari {totalPages})
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setTradeInPage((p) => Math.max(p - 1, 1))}
                                      disabled={currentPage === 1}
                                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all border border-slate-700"
                                    >
                                      ← Sebelumnya
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTradeInPage((p) => Math.min(p + 1, totalPages))}
                                      disabled={currentPage === totalPages}
                                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all border border-purple-500 shadow-lg shadow-purple-500/20"
                                    >
                                      Selanjutnya →
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()
                      ) : (
                        <div className="glass-panel p-8 text-center text-slate-500 text-sm">
                          Belum ada pengajuan tukar tambah aktif.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: HP Bekas Saya (Dipisah) */}
              {activeTab === 'my_used_phones' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-black text-white tracking-tight">Daftar HP Bekas Saya</h2>
                      <p className="text-slate-500 text-sm mt-1">Daftar perangkat bekas milik Anda yang terdaftar untuk dijual atau ditukar tambah.</p>
                    </div>
                    <button
                      onClick={() => window.location.href = '/trade-in?tab=sell'}
                      className="btn-primary !px-6 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-purple-500/20"
                    >
                      <span>+ Pasang Perangkat Bekas</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {myTradeIns.length > 0 ? (
                      (() => {
                        const itemsPerPage = 10;
                        const totalPages = Math.ceil(myTradeIns.length / itemsPerPage) || 1;
                        const currentPage = Math.min(myUsedPage, totalPages);
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const paginatedUsed = myTradeIns.slice(startIndex, startIndex + itemsPerPage);

                        return (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {paginatedUsed.map((device) => {
                                const waybill = device.old_device_waybill || device.waybill || device.resi;
                                const courier = device.old_device_courier || device.courier || 'JNE Express';

                                return (
                                  <div
                                    key={device.id}
                                    className="glass-panel p-5 border border-purple-500/20 hover:border-purple-500/50 transition-all flex flex-col justify-between cursor-pointer group"
                                    onClick={() => setDetailTradeInModal(device)}
                                  >
                                    <div>
                                      <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20">
                                          {device.brand || 'BEKAS'}
                                        </span>
                                        <div className="flex gap-1.5">
                                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                                            {device.condition || 'Good'}
                                          </span>
                                          {device.battery_health && (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                              BH {device.battery_health}%
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-4 mb-3">
                                        <div
                                          className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-white/10 flex-shrink-0 relative group/img cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewImageModal(device.image || '/placeholder.png');
                                          }}
                                        >
                                          <img
                                            src={device.image || '/placeholder.png'}
                                            alt={device.name}
                                            className="w-full h-full object-contain p-1 group-hover/img:scale-110 transition-transform"
                                          />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-[8px] font-bold text-white transition-opacity">
                                            🔍
                                          </div>
                                        </div>
                                        <div>
                                          <h4 className="text-white font-bold text-base leading-tight group-hover:text-purple-400 transition-colors">
                                            {device.name}
                                          </h4>
                                          <p className="text-emerald-400 font-black text-lg mt-0.5">{formatPrice(device.price || 0)}</p>
                                          <p className="text-[11px] text-slate-400 mt-0.5">
                                            RAM {device.ram || '-'} / Storage {device.storage || '-'}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Resi & Shipping Status Info Badge */}
                                      <div className="mb-3 p-2.5 rounded-xl bg-slate-900/80 border border-white/5 text-[11px]">
                                        {waybill ? (
                                          <div className="flex items-center justify-between text-purple-300 font-bold">
                                            <span>📦 Resi Kirim: <strong className="font-mono text-amber-400">{waybill}</strong> ({courier})</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-between text-emerald-400 font-bold">
                                            <span>🟢 Status: Tersedia di Marketplace (Siap Dijual)</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDetailTradeInModal(device);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold uppercase tracking-wider transition-colors border border-slate-700 flex items-center gap-1 cursor-pointer"
                                      >
                                        <span>📋 Detail Form Data</span>
                                      </button>

                                      <div className="flex items-center gap-1.5">
                                        {waybill && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setTrackingModal({ isOpen: true, order: null, tradeIn: device });
                                            }}
                                            className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider transition-colors border border-purple-500/30 flex items-center gap-1 cursor-pointer"
                                          >
                                            <span>🚚 Lacak Paket</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Pagination Bar (Maksimal 10 Per Halaman) */}
                            {totalPages > 1 && (
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-[#0d1117] border border-white/[0.08] text-xs mt-6">
                                <span className="text-slate-400 font-bold">
                                  Menampilkan <strong className="text-white">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, myTradeIns.length)}</strong> dari <strong className="text-white">{myTradeIns.length}</strong> HP Bekas (Halaman {currentPage} dari {totalPages})
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setMyUsedPage((p) => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all border border-slate-700"
                                  >
                                    ← Sebelumnya
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setMyUsedPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all border border-purple-500 shadow-lg shadow-purple-500/20"
                                  >
                                    Selanjutnya →
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()
                    ) : (
                      <div className="glass-panel p-12 text-center text-slate-500">
                        <p className="font-bold text-white mb-2 text-base">Belum Ada HP Bekas Didaftarkan</p>
                        <p className="text-xs text-slate-400 mb-6">Mulai pasang perangkat bekas milik Anda untuk ditukar tambah atau dijual.</p>
                        <button onClick={() => window.location.href = '/trade-in?tab=sell'} className="btn-primary !px-8">
                          Pasang HP Bekas Sekarang
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="glass-panel p-10 animate-fade-in">
                  <h2 className="text-3xl font-black text-white mb-2">Pengaturan Akun</h2>
                  <p className="text-slate-500 mb-10 text-sm">Kelola info pengiriman dan detail profil Anda.</p>

                  <form onSubmit={handleProfileSave} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="md:col-span-2 flex items-center gap-6 p-6 rounded-3xl bg-slate-900 border border-slate-800">
                        <div className="relative group w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white/5">
                          {avatarPreview ? <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800" />}
                          <label htmlFor="avatar-up" className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                          </label>
                          <input id="avatar-up" name="avatarFile" type="file" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (file) setAvatarPreview(URL.createObjectURL(file)); }} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white mb-1">Identitas Avatar</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Rekomendasi 512x512 PNG/JPG</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Nama Tampilan</label>
                        <input
                          type="text"
                          maxLength={70}
                          placeholder="Nama Lengkap"
                          className="input-field"
                          value={profileForm.name}
                          onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Nomor Kontak (Wajib Angka)</label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={15}
                          placeholder="Contoh: 081234567890"
                          className="input-field font-mono"
                          value={profileForm.phone}
                          onChange={e => setProfileForm({ ...profileForm, phone: sanitizePhone(e.target.value) })}
                        />
                        <p className="text-[10px] text-slate-500 mt-1">Hanya angka (10-15 digit, diawali 08...)</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Alamat Pengiriman</label>
                        <AddressPicker value={profileForm.address} onChange={(address) => setProfileForm({ ...profileForm, address })} />
                      </div>
                    </div>

                    <button type="submit" disabled={savingProfile} className="btn-primary !py-5 !px-10 flex items-center justify-center gap-3">
                      {savingProfile ? 'Memperbarui...' : 'Simpan Semua Perubahan'}
                    </button>
                  </form>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal.isOpen && reviewModal.item && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
          <div className="glass-panel !rounded-3xl w-full max-w-lg overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Ulas Produk</h3>
              <button onClick={() => setReviewModal({ ...reviewModal, isOpen: false })} className="p-2 rounded-xl bg-slate-900 text-slate-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleReviewSubmit} className="p-8 space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 mb-6">
                <img src={reviewModal.item.image} alt={reviewModal.item.name} className="w-16 h-16 rounded-xl object-contain bg-[#0a0f1a] p-1" />
                <div>
                  <h4 className="font-bold text-white">{reviewModal.item.name}</h4>
                  <p className="text-xs text-slate-500">Bagaimana pengalaman Anda?</p>
                </div>
              </div>

              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewModal({ ...reviewModal, rating: star })}
                    className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${reviewModal.rating >= star ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-900 text-slate-600'}`}
                  >
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Komentar Ulasan</label>
                <textarea
                  required
                  rows="4"
                  className="input-field !py-4"
                  placeholder="Ceritakan kondisi perangkat, performa, atau layanan seller..."
                  value={reviewModal.comment}
                  onChange={e => setReviewModal({ ...reviewModal, comment: e.target.value })}
                ></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Foto (Opsional)</label>
                <input type="file" className="w-full text-xs text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-amber-500 file:text-white" onChange={e => setReviewModal({ ...reviewModal, imageFile: e.target.files[0] })} />
              </div>

              <button type="submit" disabled={uploadingReview} className="w-full btn-primary !bg-amber-500 !py-5 font-black uppercase tracking-widest text-xs shadow-2xl shadow-amber-500/20">
                {uploadingReview ? 'Mempublikasikan...' : 'Kirim Ulasan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {returnModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
          <div className="glass-panel !rounded-3xl w-full max-w-lg overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Request Return</h3>
              <button onClick={() => setReturnModal({ ...returnModal, isOpen: false })} className="p-2 rounded-xl bg-slate-900 text-slate-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleReturnSubmit} className="p-8 space-y-6">
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-6">
                <p className="text-xs text-red-400 font-bold leading-relaxed">
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  Request return harus dibuat dalam 48 jam setelah pengiriman diterima. Biaya verifikasi TrustX tidak dapat dikembalikan.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Alasan Return</label>
                <select
                  required
                  className="input-field appearance-none cursor-pointer"
                  value={returnModal.reason}
                  onChange={e => setReturnModal({ ...returnModal, reason: e.target.value })}
                >
                  <option value="">Pilih alasan...</option>
                  <option>Rusak / Tidak berfungsi</option>
                  <option>Item tidak sesuai deskripsi</option>
                  <option>Item yang diterima salah</option>
                  <option>Kekhawatiran keaslian</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Detail Masalah</label>
                <textarea
                  required
                  rows="4"
                  className="input-field !py-4"
                  placeholder="Jelaskan masalah secara detail. Jika rusak, jelaskan bagian yang tidak berfungsi..."
                ></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Foto Bukti (Evidence)</label>
                <input type="file" name="returnImageFile" required className="w-full text-xs text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-slate-700 file:text-white" />
              </div>

              <button type="submit" disabled={submittingReturn} className="w-full btn-primary !bg-red-600 !py-5 font-black uppercase tracking-widest text-xs shadow-2xl shadow-red-500/20">
                {submittingReturn ? 'Mengirim Request...' : 'Kirim Request Return'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Details Custom Modal Form */}
      {paymentModal.isOpen && (
        <PaymentDetailsModal
          order={paymentModal.order}
          onClose={() => setPaymentModal({ isOpen: false, order: null })}
          onCancelOrder={handleCancelOrder}
          onRefreshOrders={refreshOrders}
          onOpenSnap={handleOpenMidtransSnap}
        />
      )}

      {/* Live Parcel Tracking Modal */}
      {trackingModal.isOpen && (
        <TrackingModal
          order={trackingModal.order}
          tradeIn={trackingModal.tradeIn}
          onClose={() => setTrackingModal({ isOpen: false, order: null, tradeIn: null })}
        />
      )}

      {/* Trade-In Resi Input Modal for Buyer */}
      {tradeInShipModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
          <div className="glass-panel !rounded-3xl w-full max-w-md overflow-hidden border border-purple-500/30 p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Input Resi Kirim Perangkat Lama</h3>
              <button onClick={() => setTradeInShipModal({ isOpen: false, tradeInId: null, waybill: '', courier: 'JNE Express' })} className="p-2 rounded-xl bg-slate-900 text-slate-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await apiFetch(`/api/trade-in/${tradeInShipModal.tradeInId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'ship_old_device',
                    waybill: tradeInShipModal.waybill,
                    courier: tradeInShipModal.courier,
                  }),
                });
                if (res.ok) {
                  const data = await res.json();
                  setBuyerTradeInRequests(prev => prev.map(t => t.id === tradeInShipModal.tradeInId ? data.tradeIn : t));
                  setTradeInShipModal({ isOpen: false, tradeInId: null, waybill: '', courier: 'JNE Express' });
                  alert('Nomor resi pengiriman perangkat lama berhasil disimpan!');
                }
              } catch (err) {
                alert('Gagal menyimpan nomor resi.');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Kurir Pengiriman</label>
                <select className="input-field appearance-none cursor-pointer" value={tradeInShipModal.courier} onChange={e => setTradeInShipModal({ ...tradeInShipModal, courier: e.target.value })}>
                  {['JNE Express', 'J&T Express', 'SiCepat Ekspres', 'Anteraja', 'POS Indonesia'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nomor Resi / Waybill Perangkat Lama</label>
                <input type="text" required placeholder="e.g. JNE882910291" className="input-field !text-base" value={tradeInShipModal.waybill} onChange={e => setTradeInShipModal({ ...tradeInShipModal, waybill: e.target.value })} />
              </div>

              <button type="submit" className="w-full btn-primary !bg-purple-600 !py-4 font-black uppercase tracking-widest text-xs shadow-2xl shadow-purple-500/20">
                Simpan & Kirim Perangkat Lama
              </button>
            </form>
          </div>
        </div>
      )}

        {/* Fullscreen Photo Preview Modal */}
        {previewImageModal && (
          <div
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in cursor-pointer"
            onClick={() => setPreviewImageModal(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl p-3 shadow-2xl flex flex-col items-center justify-center animate-scale-in cursor-default overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all border border-white/10 shadow-lg text-sm font-bold"
                title="Tutup Foto"
              >
                ✕
              </button>
              <img
                src={previewImageModal}
                alt="Foto Perangkat"
                className="max-w-full max-h-[82vh] object-contain rounded-2xl"
              />
            </div>
          </div>
        )}

      {/* Modal Detail Form Data Tukar Tambah */}
      {detailTradeInModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
          onClick={() => setDetailTradeInModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                  Form Detail Tukar Tambah #{detailTradeInModal.id ? detailTradeInModal.id.slice(0, 8) : 'SUBMITTED'}
                </span>
                <h3 className="text-xl font-black text-white mt-2">
                  {detailTradeInModal.old_device_name || detailTradeInModal.name || detailTradeInModal.device?.name || 'Perangkat Tukar Tambah'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Didaftarkan oleh: <strong className="text-slate-200">{user?.name || 'Buyer'}</strong> ({user?.email})
                </p>
              </div>
              <button
                onClick={() => setDetailTradeInModal(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-xs font-bold"
              >
                ✕ Tutup
              </button>
            </div>

            {/* Detail Specification Grid */}
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-white/5 flex items-center justify-between">
                <span className="font-bold text-slate-300">Status Pengajuan:</span>
                <span className="px-3 py-1 rounded-lg font-black uppercase text-[10px] tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {detailTradeInModal.status || 'Aktif'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Merek & Model</span>
                  <p className="font-bold text-sm text-white">{detailTradeInModal.old_device_name || detailTradeInModal.name || '-'}</p>
                </div>
                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Kapasitas RAM / Memory</span>
                  <p className="font-bold text-sm text-white">RAM {detailTradeInModal.old_device_ram || detailTradeInModal.ram || '-'} / Storage {detailTradeInModal.old_device_storage || detailTradeInModal.storage || '-'}</p>
                </div>
                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Kondisi Kelayakan</span>
                  <p className="font-bold text-sm text-amber-400">{detailTradeInModal.old_device_condition || detailTradeInModal.condition || 'Good'}</p>
                </div>
                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Battery Health</span>
                  <p className="font-bold text-sm text-emerald-400">{detailTradeInModal.old_device_battery_health ? `${detailTradeInModal.old_device_battery_health}%` : 'Normal'}</p>
                </div>
                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Nilai Potongan / Harga</span>
                  <p className="font-black text-sm text-emerald-400">{formatPrice(detailTradeInModal.final_trade_in_value || detailTradeInModal.ai_estimated_value || detailTradeInModal.price || 0)}</p>
                </div>
                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Kurir Pengiriman</span>
                  <p className="font-bold text-sm text-purple-300">{detailTradeInModal.old_device_courier || detailTradeInModal.courier || 'JNE Express'}</p>
                </div>
              </div>

              {/* Waybill / Resi & Shipping Section */}
              {(() => {
                const waybill = detailTradeInModal.old_device_waybill || detailTradeInModal.waybill || detailTradeInModal.resi;
                const courier = detailTradeInModal.old_device_courier || detailTradeInModal.courier || 'JNE Express';
                // Item is an active trade-in or sold C2C order if device exists or old_device_name exists or status is active shipping/approved
                const isActiveOrderOrTradeIn = Boolean(
                  detailTradeInModal.device ||
                  detailTradeInModal.old_device_name ||
                  detailTradeInModal.soldToBuyer ||
                  ['approved', 'shipping', 'sold', 'shipping_old_device'].includes(detailTradeInModal.status)
                );

                if (!isActiveOrderOrTradeIn) {
                  return (
                    <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                          <span>🟢 STATUS: TERSEDIA DI MARKETPLACE</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">Siap Dipesan Pembeli</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Perangkat bekas milik Anda saat ini aktif terdaftar di platform GadgetTrustX. <strong>Nomor resi pengiriman baru diperlukan jika sudah ada transaksi pesanan masuk dari pembeli.</strong>
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-300">
                        📦 Informasi Resi & Status Pengiriman
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Kurir: <strong className="text-white">{courier}</strong>
                      </span>
                    </div>

                    {waybill ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-900 rounded-xl border border-white/10">
                        <div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Nomor Resi / Waybill Perangkat:</span>
                          <span className="font-mono text-base font-black text-amber-400">{waybill}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setDetailTradeInModal(null);
                              setTrackingModal({ isOpen: true, order: null, tradeIn: detailTradeInModal });
                            }}
                            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-purple-500/20 cursor-pointer"
                          >
                            🚚 Lacak Live Pengiriman
                          </button>
                          {detailTradeInModal.id && (
                            <button
                              type="button"
                              onClick={() => {
                                setDetailTradeInModal(null);
                                setTradeInShipModal({
                                  isOpen: true,
                                  tradeInId: detailTradeInModal.id,
                                  waybill: waybill,
                                  courier: courier,
                                });
                              }}
                              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors border border-slate-700 cursor-pointer"
                            >
                              ✏️ Edit Resi
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-300">
                        <div>
                          <span className="font-bold block text-amber-200">Nomor Resi Kirim Belum Di-input</span>
                          <span className="text-[11px] text-amber-400/80">Silakan input nomor resi pengiriman perangkat lama Anda agar seller/pihak platform dapat memverifikasi fisik perangkat.</span>
                        </div>
                        {detailTradeInModal.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setDetailTradeInModal(null);
                              setTradeInShipModal({
                                isOpen: true,
                                tradeInId: detailTradeInModal.id,
                                waybill: '',
                                courier: courier,
                              });
                            }}
                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase text-[10px] tracking-wider transition-colors shadow-md shadow-purple-500/20 whitespace-nowrap cursor-pointer"
                          >
                            📦 Input Resi Kirim Sekarang
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Target Device info if trade-in request */}
              {detailTradeInModal.device && (
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-center gap-4">
                  <img src={detailTradeInModal.device.image} alt={detailTradeInModal.device.name} className="w-14 h-14 object-contain rounded-xl bg-slate-900 p-1 border border-white/10" />
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">Produk HP Baru yang Ingin Dibeli</span>
                    <p className="font-bold text-white text-sm">{detailTradeInModal.device.name}</p>
                    <p className="text-emerald-400 font-black text-xs">{formatPrice(detailTradeInModal.device.price)}</p>
                  </div>
                </div>
              )}

              {/* Photos Gallery */}
              {(detailTradeInModal.old_device_images?.length > 0 || detailTradeInModal.image) && (
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">📸 Galeri Foto Fisik Unit Perangkat</span>
                  <div className="flex flex-wrap gap-2.5">
                    {detailTradeInModal.old_device_images?.length > 0 ? (
                      detailTradeInModal.old_device_images.map((imgUrl, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPreviewImageModal(imgUrl)}
                          className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 hover:border-purple-400 transition-all bg-slate-950 group relative cursor-pointer"
                        >
                          <img src={imgUrl} alt={`Foto ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold text-white">
                            🔍 Perbesar
                          </div>
                        </button>
                      ))
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPreviewImageModal(detailTradeInModal.image)}
                        className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 hover:border-purple-400 transition-all bg-slate-950 group relative cursor-pointer"
                      >
                        <img src={detailTradeInModal.image} alt="Foto" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold text-white">
                          🔍 Perbesar
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2">
              <button
                onClick={() => setDetailTradeInModal(null)}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors border border-slate-700"
              >
                Tutup Form Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={orderDetailModal.isOpen}
        order={orderDetailModal.order}
        onClose={() => setOrderDetailModal({ isOpen: false, order: null })}
        onOpenPayment={(ord) => setPaymentModal({ isOpen: true, order: ord })}
        onOpenTracking={(ord) => setTrackingModal({ isOpen: true, order: ord })}
        onConfirmDelivery={(ord) => handleConfirmOrderCompleted(ord.id)}
        onOpenReview={(ord) => {
          const firstItem = ord.items?.[0];
          if (firstItem) setReviewModal({ isOpen: true, item: firstItem, orderItemId: firstItem.orderItemId, orderId: ord.id });
        }}
        onOpenReturn={(ord) => {
          const firstItem = ord.items?.[0];
          if (firstItem) setReturnModal({ isOpen: true, item: firstItem, orderItemId: firstItem.orderItemId, orderId: ord.id });
        }}
      />
    </AuthGuard>
  );
}
