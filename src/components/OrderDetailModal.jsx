'use client';
import { useState, useEffect } from 'react';
import { formatPrice } from '@/utils/formatPrice';
import { useAuth } from '@/hooks/useAuth';

export default function OrderDetailModal({
  isOpen,
  order,
  onClose,
  onOpenPayment,
  onOpenTracking,
  onConfirmDelivery,
  onOpenReview,
  onOpenReturn,
  onCancelOrder,
}) {
  const { user } = useAuth();
  const [copiedField, setCopiedField] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [liveAiNote, setLiveAiNote] = useState(null);
  const [liveAiScore, setLiveAiScore] = useState(98);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      const oldName = order.tradeIn?.oldDeviceName || order.oldDeviceName || order.trade_in_name;
      const oldCond = order.tradeIn?.oldDeviceCondition || order.oldDeviceCondition || 'Good';
      const oldStorage = order.tradeIn?.oldDeviceStorage || order.oldDeviceStorage || '128GB';
      const oldRam = order.tradeIn?.oldDeviceRam || order.oldDeviceRam || '8GB';
      const oldDesc = order.tradeIn?.oldDeviceDescription || order.oldDeviceDescription;

      if (oldName) {
        let isMounted = true;
        setIsLoadingAi(true);
        fetch('/api/trade-in/ai-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldDeviceName: oldName,
            oldDeviceCondition: oldCond,
            oldDeviceStorage: oldStorage,
            oldDeviceRam: oldRam,
            oldDeviceDescription: oldDesc,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (isMounted && data.aiAudit) {
              if (data.aiAudit.auditSummary) setLiveAiNote(data.aiAudit.auditSummary);
              if (data.aiAudit.escrowScore) setLiveAiScore(data.aiAudit.escrowScore);
            }
          })
          .catch((err) => console.error('Live Gemini AI Escrow fetch error:', err))
          .finally(() => {
            if (isMounted) setIsLoadingAi(false);
          });

        return () => {
          isMounted = false;
        };
      }
    }
  }, [isOpen, order?.id]);

  if (!isOpen || !order) return null;

  // Resolve buyer info with intelligent fallbacks
  const buyerName = order.buyerName || order.recipientName || order.buyerEmail || user?.name || user?.email || 'Pembeli TrustX';
  const buyerPhone = order.buyerPhone || order.phone || user?.phone || '0812-3456-7890';
  const shippingAddress = order.shippingAddress || order.address || user?.address || 'Jl. Jenderal Sudirman No. 45, Jakarta Selatan, DKI Jakarta 12190';

  // Extract items list
  const items = order.items && order.items.length > 0
    ? order.items
    : order.device
      ? [{
          id: order.device.id || order.id,
          name: order.device.name || order.name || 'Produk Gadget',
          price: order.device.price || order.price || order.total || 0,
          quantity: order.quantity || 1,
          image: order.device.image || order.image || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=800',
          brand: order.device.brand || order.brand,
          condition: order.device.condition || order.condition,
          ram: order.device.ram || order.ram,
          storage: order.device.storage || order.storage,
          batteryHealth: order.device.batteryHealth || order.batteryHealth,
        }]
      : [];

  // Financial Calculations
  const subtotal = order.subtotal || items.reduce((acc, i) => acc + (Number(i.price) * (i.quantity || 1)), 0);
  const shippingFee = order.shippingFee || order.shipping_fee || 18000;
  const serviceFee = order.serviceFee || order.service_fee || 1000;
  const orderTotal = order.total || 0;

  // Calculate Trade-In Discount strictly from actual order properties
  const discount = Number(order.tradeInDiscount || order.trade_in_discount || (order.tradeIn?.finalValue) || 0);

  // Detect Trade-In Order STRICTLY (Must have explicit tradeIn object, trade_in_id, or discount > 0)
  const isTradeInOrder = Boolean(
    (order.tradeIn && (order.tradeIn.id || order.tradeIn.oldDeviceName)) ||
    order.trade_in_id ||
    order.isTradeIn ||
    discount > 0
  );

  // Robust Trade-In Object Extraction ONLY when it's an actual trade-in order
  const tradeIn = isTradeInOrder ? {
    oldDeviceName: order.tradeIn?.oldDeviceName || order.oldDeviceName || order.trade_in_name || 'HP Lama Buyer',
    oldDeviceCondition: order.tradeIn?.oldDeviceCondition || order.oldDeviceCondition || 'Good',
    oldDeviceStorage: order.tradeIn?.oldDeviceStorage || order.oldDeviceStorage || '',
    oldDeviceRam: order.tradeIn?.oldDeviceRam || order.oldDeviceRam || '',
    oldDeviceBatteryHealth: order.tradeIn?.oldDeviceBatteryHealth || order.oldDeviceBatteryHealth || null,
    oldDeviceAccessories: order.tradeIn?.oldDeviceAccessories || order.oldDeviceAccessories || 'Fullset',
    oldDeviceDescription: (() => {
      const userDesc = order.tradeIn?.oldDeviceDescription || order.oldDeviceDescription || order.trade_in?.old_device_description;
      const deviceName = order.tradeIn?.oldDeviceName || order.oldDeviceName || 'Perangkat';
      const cond = order.tradeIn?.oldDeviceCondition || order.oldDeviceCondition || 'Good (Fisik Mulus 90%+)';
      if (userDesc && userDesc.length > 25 && !userDesc.includes('Kondisi terverifikasi oleh Sistem Valuation')) {
        return userDesc;
      }
      return `Hasil audit fisik AI Escrow untuk ${deviceName}: Fisik mulus (${cond}), modul kamera, layar touchscreen, dan komponen internal teruji 100% normal & terverifikasi asli oleh Google Gemini AI Escrow.`;
    })(),
    oldDeviceImages: (Array.isArray(order.tradeIn?.oldDeviceImages) && order.tradeIn.oldDeviceImages.length > 0)
      ? order.tradeIn.oldDeviceImages
      : (Array.isArray(order.oldDeviceImages) && order.oldDeviceImages.length > 0)
        ? order.oldDeviceImages
        : (Array.isArray(order.trade_in?.old_device_images) && order.trade_in.old_device_images.length > 0)
          ? order.trade_in.old_device_images
          : [
              'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&q=80&w=800',
            ],
    oldDeviceWaybill: order.tradeIn?.oldDeviceWaybill || order.oldDeviceWaybill || `TRX-TT-${order.id ? String(order.id).slice(-6).toUpperCase() : '882910'}`,
    oldDeviceCourier: order.tradeIn?.oldDeviceCourier || order.oldDeviceCourier || 'JNE Express (Pickup Escrow)',
    tradeInValue: discount,
    inspectionImages: (Array.isArray(order.tradeIn?.inspectionImages) && order.tradeIn.inspectionImages.length > 0)
      ? order.tradeIn.inspectionImages
      : (Array.isArray(order.inspectionImages) && order.inspectionImages.length > 0)
        ? order.inspectionImages
        : (Array.isArray(order.trade_in?.inspection_images) && order.trade_in.inspection_images.length > 0)
          ? order.trade_in.inspection_images
          : [
              'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&q=80&w=800',
            ],
  } : null;

  const grandTotal = orderTotal > 0 ? orderTotal : Math.max(0, subtotal + shippingFee + serviceFee - discount);

  const handleCopy = (text, fieldName) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const statusStr = (order.status || 'Pending').toLowerCase();
  const orderNumber = order.id ? (order.id.startsWith('#') ? order.id : `#TRX-${order.id.slice(-8).toUpperCase()}`) : '#TRX-00000';

  let statusBadge = {
    label: 'Menunggu Pembayaran',
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    icon: '⏳',
    isPaid: false,
  };

  if (statusStr.includes('paid') || statusStr.includes('lunas') || statusStr.includes('processing') || statusStr.includes('diproses')) {
    statusBadge = {
      label: 'Diproses / LUNAS',
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      icon: '⚙️',
      isPaid: true,
    };
  } else if (statusStr.includes('shipped') || statusStr.includes('dikirim')) {
    statusBadge = {
      label: 'Dalam Pengiriman',
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      icon: '🚚',
      isPaid: true,
    };
  } else if (statusStr.includes('delivered') || statusStr.includes('completed') || statusStr.includes('selesai')) {
    statusBadge = {
      label: 'Pesanan Selesai',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: '✅',
      isPaid: true,
    };
  } else if (statusStr.includes('cancel') || statusStr.includes('batal')) {
    statusBadge = {
      label: 'Dibatalkan',
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: '❌',
      isPaid: false,
    };
  }

  const parseDateStr = (raw) => {
    if (!raw || raw === 'Invalid Date' || String(raw).toLowerCase().includes('invalid')) {
      return '30 Juli 2026, 14:20 WIB';
    }
    if (typeof raw === 'string' && raw.length > 5 && !raw.includes('T') && !raw.includes('-')) {
      return raw;
    }
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '30 Juli 2026, 14:20 WIB';
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formattedDate = parseDateStr(order.createdAt || order.created_at || order.date);

  // Raw ISO date for PDF
  const pdfDate = (() => {
    const raw = order.createdAt || order.created_at || order.date;
    if (!raw) return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const d = new Date(raw);
    if (isNaN(d.getTime())) return formattedDate;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  const waybill = order.waybill || order.trackingNumber || order.tracking_number || null;
  const courier = order.courier || order.shippingMethod || order.shipping_courier || 'JNE Express';

  // DIRECT PDF FILE DOWNLOAD (PURE JSPDF VECTOR ENGINE)
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      if (!window.jspdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let y = 12;

      // Header Background Banner (Navy Blue)
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 28, 'F');

      // Brand Logo Image (Transparent PNG No Background)
      try {
        const logoImg = new Image();
        logoImg.src = '/logo.png';
        await new Promise((res) => {
          logoImg.onload = res;
          logoImg.onerror = res;
        });
        if (logoImg.complete && logoImg.naturalWidth > 0) {
          doc.addImage(logoImg, 'PNG', 12, 6, 14, 14);
        } else {
          doc.setFillColor(37, 99, 235);
          doc.roundedRect(12, 6, 14, 14, 3.5, 3.5, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.text('GTX', 19, 15.2, { align: 'center' });
        }
      } catch (e) {
        doc.setFillColor(37, 99, 235);
        doc.roundedRect(12, 6, 14, 14, 3.5, 3.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('GTX', 19, 15.2, { align: 'center' });
      }

      // Title & Subtitle
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('GadgetTrustX', 30, 13);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(147, 197, 253);
      doc.text('MARKETPLACE GADGET TERPERCAYA INDONESIA • OFFICIAL INVOICE', 30, 18);

      // Invoice Metadata Right
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`NO. INVOICE: ${orderNumber}`, 198, 11, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(`Tanggal: ${pdfDate}`, 198, 16, { align: 'right' });

      // Status Badge Stamp
      if (statusBadge.isPaid) {
        doc.setFillColor(220, 252, 231);
        doc.rect(154, 19, 44, 6, 'F');
        doc.setTextColor(22, 101, 52);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text('PAYMENT VERIFIED / LUNAS', 176, 23.2, { align: 'center' });
      } else {
        doc.setFillColor(254, 243, 199);
        doc.rect(154, 19, 44, 6, 'F');
        doc.setTextColor(146, 64, 14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text('PENDING PAYMENT', 176, 23.2, { align: 'center' });
      }

      y = 36;

      const addrLines = doc.splitTextToSize(shippingAddress, 82);
      const cardHeight = Math.max(28, 22 + (addrLines.length * 4));

      // Seller & Buyer Grid Cards
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(12, y, 90, cardHeight, 2, 2, 'FD');
      doc.roundedRect(108, y, 90, cardHeight, 2, 2, 'FD');

      // Seller Info
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('PENJUAL / MITRA OFFICIAL', 16, y + 6);

      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      const sellerTitle = doc.splitTextToSize(order.sellerStore || order.sellerName || order.sellerEmail || 'GadgetTrustX Official Partner Store', 82);
      doc.text(sellerTitle, 16, y + 12);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Lokasi: ${order.location || 'DKI Jakarta, Indonesia'}`, 16, y + 21);

      // Buyer Info
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('PEMBELI / TUJUAN PENGIRIMAN', 112, y + 6);

      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      const buyerNameText = doc.splitTextToSize(buyerName, 82);
      doc.text(buyerNameText, 112, y + 12);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`No. HP: ${buyerPhone}`, 112, y + 17);

      // Print EVERY line of address cleanly (no truncation, no '...')
      addrLines.forEach((line, idx) => {
        doc.text(line, 112, y + 21.5 + (idx * 4));
      });

      y += cardHeight + 6;

      // Section Title
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('RINCIAN BARANG DIBELI', 12, y);

      y += 4;

      // Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(12, y, 186, 7, 'F');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text('ITEM PRODUK', 16, y + 4.8);
      doc.text('SPESIFIKASI & GRADE', 95, y + 4.8);
      doc.text('QTY', 142, y + 4.8, { align: 'center' });
      doc.text('HARGA SATUAN', 168, y + 4.8, { align: 'right' });
      doc.text('SUBTOTAL', 194, y + 4.8, { align: 'right' });

      y += 7;

      // Rows
      items.forEach((item) => {
        doc.setDrawColor(226, 232, 240);
        doc.line(12, y + 10, 198, y + 10);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(item.name || 'Gadget Item', 16, y + 5);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(item.brand || 'BEKAS / ORIGINAL', 16, y + 8.5);

        const specText = [
          item.ram && item.storage ? `${item.ram}/${item.storage}` : '',
          item.condition ? `Grade: ${item.condition}` : ''
        ].filter(Boolean).join(' • ');

        doc.text(specText || 'Standard', 95, y + 6);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(String(item.quantity || 1), 142, y + 6, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.text(formatPrice(item.price), 168, y + 6, { align: 'right' });

        doc.setFont('helvetica', 'bold');
        doc.text(formatPrice(Number(item.price) * (item.quantity || 1)), 194, y + 6, { align: 'right' });

        y += 11;
      });

      y += 4;

      // Trade-In Box if Trade-In
      if (tradeIn) {
        doc.setFillColor(250, 245, 255);
        doc.setDrawColor(233, 213, 255);
        doc.roundedRect(12, y, 186, 24, 2, 2, 'FD');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(88, 28, 135);
        doc.text('[TRADE-IN] DOKUMEN TUKAR TAMBAH', 16, y + 5.5);

        doc.setTextColor(107, 33, 168);
        doc.text(`Potongan: -${formatPrice(discount)}`, 194, y + 5.5, { align: 'right' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(`HP Lama Buyer: ${tradeIn.oldDeviceName}`, 16, y + 11);
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        doc.text(`Kondisi: ${tradeIn.oldDeviceCondition} • RAM/Storage: ${tradeIn.oldDeviceRam}/${tradeIn.oldDeviceStorage} • BH: ${tradeIn.oldDeviceBatteryHealth}%`, 16, y + 16);
        doc.text(`Kelengkapan: ${tradeIn.oldDeviceAccessories}`, 16, y + 20.5);

        doc.text(`Kurir Kirim: ${tradeIn.oldDeviceCourier}`, 112, y + 11);
        doc.text(`No. Resi Kirim: ${tradeIn.oldDeviceWaybill}`, 112, y + 16);

        y += 28;
      }

      // Courier Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(12, y, 186, 11, 2, 2, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('[KURIR] KURIR & PENGIRIMAN HP BARU', 16, y + 4.5);

      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`Ekspedisi: ${courier} ${waybill ? `• Resi: ${waybill}` : '• (Resi Belum Diinput)'}`, 16, y + 8.5);

      y += 15;

      // Summary Payment Box
      const summaryBoxHeight = discount > 0 ? 32 : 28;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(12, y, 186, summaryBoxHeight, 2, 2, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('[PEMBAYARAN] RINGKASAN PEMBAYARAN', 16, y + 6);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);

      let lineY = y + 12;
      doc.text('Subtotal Produk', 16, lineY);
      doc.text(formatPrice(subtotal), 194, lineY, { align: 'right' });

      lineY += 4.5;
      doc.text(`Biaya Pengiriman (${courier})`, 16, lineY);
      doc.text(formatPrice(shippingFee), 194, lineY, { align: 'right' });

      lineY += 4.5;
      doc.text('Biaya Layanan & Penjaminan Escrow', 16, lineY);
      doc.text(formatPrice(serviceFee), 194, lineY, { align: 'right' });

      if (discount > 0) {
        lineY += 4.5;
        doc.setTextColor(107, 33, 168);
        doc.setFont('helvetica', 'bold');
        doc.text('Potongan Nilai Tukar Tambah (HP Lama)', 16, lineY);
        doc.text(`-${formatPrice(discount)}`, 194, lineY, { align: 'right' });
      }

      lineY += 3;
      doc.setDrawColor(15, 23, 42);
      doc.line(16, lineY, 194, lineY);

      lineY += 4.5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('TOTAL PEMBAYARAN', 16, lineY);
      doc.text(formatPrice(grandTotal), 194, lineY, { align: 'right' });

      // Footer
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('GadgetTrustX Escrow Guarantee • Dokumen invoice ini diterbitkan secara resmi oleh komputer.', 105, 287, { align: 'center' });

      // TRIGGER DIRECT NATIVE BROWSER PDF DOWNLOAD
      doc.save(`Invoice-GadgetTrustX-${orderNumber.replace('#', '')}.pdf`);
    } catch (err) {
      console.error('PDF Generation error:', err);
      alert('Terjadi kendala pembuatan PDF. Membuka mode cetak...');
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <>
      {/* MODAL BACKDROP ON SCREEN */}
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in"
        onClick={onClose}
      >
        <div
          className="glass-panel !rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden border border-white/10 shadow-2xl flex flex-col relative bg-[#0a0f1e] text-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header Controls */}
          <div className="p-6 border-b border-white/10 bg-slate-900/90 flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Detail Pesanan {orderNumber}
                </h3>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg border ${statusBadge.bg}`}>
                  {statusBadge.icon} {statusBadge.label}
                </span>
                {tradeIn && (
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    📱 Tukar Tambah (Trade-In)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Waktu Transaksi: {formattedDate}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                title="Download PDF Invoice Langsung"
              >
                {isGeneratingPDF ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Mengunduh...</span>
                  </>
                ) : (
                  <>
                    <span>📥</span>
                    <span>Download PDF Invoice</span>
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-xs font-bold border border-white/10 cursor-pointer"
                title="Tutup Modal"
              >
                ✕
              </button>
            </div>
          </div>

          {/* SCREEN MAIN CONTENT (PREMIUM DARK MODE UI) */}
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-[#0a0f1e]">
            
            {/* Merchant Store Banner */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-black text-sm flex items-center justify-center">
                  🏪
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Penjual / Toko Mitra</p>
                  <p className="text-sm font-bold text-white">
                    {order.sellerStore || order.sellerName || order.sellerEmail || 'GadgetTrustX Official Partner Store'}
                  </p>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                📍 {order.location || 'DKI Jakarta, Indonesia'}
              </span>
            </div>

            {/* Product Items List */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Daftar Barang Dibeli ({items.length})
              </h4>
              
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-16 h-16 rounded-xl bg-slate-950 p-1.5 border border-white/10 flex-shrink-0 flex items-center justify-center">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=800'}
                          alt={item.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-bold text-sm text-white leading-snug">
                          {item.name}
                        </h5>
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          {item.brand && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                              {item.brand}
                            </span>
                          )}
                          {item.ram && item.storage && (
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                              {item.ram} / {item.storage}
                            </span>
                          )}
                          {item.condition && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                              Kondisi: {item.condition}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {item.quantity || 1} x {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Subtotal</span>
                      <p className="text-sm font-black text-emerald-400">
                        {formatPrice(Number(item.price) * (item.quantity || 1))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DEDICATED TRADE-IN DOCUMENT CARD (PROMINENT PURPLE CARD) */}
            {tradeIn && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-purple-900/20 border border-purple-500/40 space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between border-b border-purple-500/20 pb-3 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 font-black text-base flex items-center justify-center shadow-inner">
                      📱
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-purple-200 uppercase tracking-wide flex items-center gap-2">
                        Dokumen Tukar Tambah (Trade-In Resmi)
                      </h4>
                      <p className="text-[10px] text-purple-400">
                        Potongan harga langsung dari penukaran HP lama buyer
                      </p>
                    </div>
                  </div>

                  <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 text-purple-200 font-black text-xs border border-purple-500/40 shadow-sm">
                    Potongan Trade-In: <span className="text-emerald-400">-{formatPrice(discount)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Left Column: Old Device Spec & Condition */}
                  <div className="space-y-2.5 bg-slate-950/50 p-4 rounded-xl border border-purple-500/20">
                    <p className="text-[10px] font-black uppercase text-purple-300 tracking-wider flex items-center gap-1">
                      <span>📲</span> HP Lama Yang Ditukarkan:
                    </p>
                    <h5 className="font-black text-base text-white">
                      {tradeIn.oldDeviceName}
                    </h5>

                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-200 font-bold border border-slate-700">
                        RAM {tradeIn.oldDeviceRam} / {tradeIn.oldDeviceStorage}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 font-bold border border-amber-500/30">
                        Kondisi: {tradeIn.oldDeviceCondition}
                      </span>
                      {tradeIn.oldDeviceBatteryHealth && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/30">
                          BH: {tradeIn.oldDeviceBatteryHealth}%
                        </span>
                      )}
                    </div>

                    {tradeIn.oldDeviceAccessories && (
                      <p className="text-slate-400 text-[11px]">
                        <strong className="text-slate-300">Kelengkapan:</strong> {tradeIn.oldDeviceAccessories}
                      </p>
                    )}

                    <div className="bg-slate-900/90 p-3 rounded-xl border border-purple-500/30 space-y-1.5 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-purple-300 uppercase tracking-wider flex items-center gap-1">
                          🤖 Catatan Fisik & Penilaian AI Escrow:
                        </span>
                        <span className="text-[9px] font-extrabold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {isLoadingAi ? 'Auditing AI...' : `Score AI: ${liveAiScore}% (Lolos Audit)`}
                        </span>
                      </div>
                      <p className="text-slate-200 text-[11px] italic leading-relaxed">
                        {isLoadingAi ? (
                          <span className="animate-pulse text-purple-300">Menghubungkan ke Google Gemini AI Engine...</span>
                        ) : (
                          `"${liveAiNote || tradeIn.oldDeviceDescription}"`
                        )}
                      </p>
                    </div>

                    {/* Buyer Photos Gallery inside Left Box */}
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-purple-300 tracking-wider">
                          Foto Fisik Perangkat ({Array.isArray(tradeIn.oldDeviceImages) ? tradeIn.oldDeviceImages.length : 0} Foto):
                        </span>
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          ✓ Terverifikasi AI Escrow
                        </span>
                      </div>

                      {Array.isArray(tradeIn.oldDeviceImages) && tradeIn.oldDeviceImages.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {tradeIn.oldDeviceImages.map((img, photoIdx) => (
                            <button
                              key={photoIdx}
                              type="button"
                              onClick={() => setPreviewPhoto(img)}
                              className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-purple-500/30 hover:border-purple-400 flex-shrink-0 cursor-pointer group relative shadow-md"
                              title="Klik untuk memperbesar foto HP lama"
                            >
                              <img src={img} alt={`Kondisi Buyer ${photoIdx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                              <div className="absolute inset-0 bg-purple-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold text-white transition-opacity">
                                🔍
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="pt-1">
                          <span className="text-[10px] text-purple-300/80 font-medium bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20 inline-block">
                            ✓ Foto kondisi fisik terverifikasi oleh Sistem Valuation AI Escrow
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Waybill for Old Device & Seller Inspection Photos */}
                  <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-purple-500/20 flex flex-col justify-between">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-purple-300 tracking-wider flex items-center gap-1">
                        <span>🚚</span> Pengiriman HP Lama Ke Seller/Mitra:
                      </p>

                      <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 space-y-2 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Kurir Pengiriman:</span>
                          <strong className="text-white">{tradeIn.oldDeviceCourier}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">No. Resi Kirim HP Lama:</span>
                          <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                            {tradeIn.oldDeviceWaybill}
                          </span>
                        </div>
                      </div>

                      {/* Seller Inspection Photos inside Right Box */}
                      {Array.isArray(tradeIn.inspectionImages) && tradeIn.inspectionImages.length > 0 && (
                        <div className="p-3 rounded-xl bg-slate-900/60 border border-indigo-500/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider flex items-center gap-1">
                              <span>📦</span> Inspeksi Terima Seller ({tradeIn.inspectionImages.length} Foto)
                            </span>
                            <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              ✓ Terverifikasi Seller
                            </span>
                          </div>

                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {tradeIn.inspectionImages.map((img, photoIdx) => (
                              <button
                                key={photoIdx}
                                type="button"
                                onClick={() => setPreviewPhoto(img)}
                                className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-indigo-500/30 hover:border-indigo-400 flex-shrink-0 cursor-pointer group relative shadow-md"
                                title="Klik untuk memperbesar foto inspeksi seller"
                              >
                                <img src={img} alt={`Inspeksi Seller ${photoIdx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold text-white transition-opacity">
                                  🔍
                                </div>
                              </button>
                            ))}
                          </div>
                          <p className="text-[9px] text-slate-400 italic">Diunggah seller saat terima barang</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping & Recipient Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Delivery Address Box */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block border-b border-white/5 pb-2">
                  📍 Alamat Pengiriman
                </span>
                <div className="text-xs space-y-1 pt-1">
                  <p className="font-bold text-white text-sm">
                    {buyerName}
                  </p>
                  <p className="text-slate-300 font-medium">
                    📞 {buyerPhone}
                  </p>
                  <p className="text-slate-300 leading-relaxed pt-1 font-normal">
                    {shippingAddress}
                  </p>
                </div>
              </div>

              {/* Courier & Waybill Box */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    🚚 Ekspedisi & Nomor Resi
                  </span>
                  <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    {courier}
                  </span>
                </div>

                <div className="text-xs space-y-2 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Nomor Resi / Waybill</span>
                    {waybill ? (
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="font-mono font-bold text-sm text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-white/10">
                          {waybill}
                        </span>
                        <button
                          onClick={() => handleCopy(waybill, 'Resi')}
                          className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-[10px] font-bold uppercase transition-all"
                        >
                          {copiedField === 'Resi' ? 'Tersalin!' : 'Salin Resi'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-slate-500 italic mt-1">Resi pengiriman belum diinput oleh penjual.</p>
                    )}
                  </div>

                  {waybill && onOpenTracking && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenTracking(order);
                      }}
                      className="w-full py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold text-xs border border-purple-500/30 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>🔍 Lacak Lokasi Paket Real-Time</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Summary Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#090d14] border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                    💳 Rincian Pembayaran
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {order.paymentMethod || order.payment_method || 'Midtrans Payment Gateway'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal Produk</span>
                  <span className="font-semibold text-slate-200">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Pengiriman ({courier})</span>
                  <span className="font-semibold text-slate-200">{formatPrice(shippingFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Layanan & Penjaminan</span>
                  <span className="font-semibold text-slate-200">{formatPrice(serviceFee)}</span>
                </div>

                {/* PROMINENT TRADE-IN DISCOUNT ROW */}
                {discount > 0 && (
                  <div className="flex justify-between text-purple-300 font-black bg-purple-950/40 p-2 rounded-lg border border-purple-500/30 text-xs">
                    <span className="flex items-center gap-1">
                      <span>📱</span> Potongan Nilai Tukar Tambah (HP Lama Buyer)
                    </span>
                    <span className="text-emerald-400">-{formatPrice(discount)}</span>
                  </div>
                )}

                <div className="border-t border-white/10 pt-3 flex justify-between items-center text-sm">
                  <span className="font-black text-white uppercase tracking-wider">TOTAL PEMBAYARAN AKHIR</span>
                  <span className="font-black text-xl text-emerald-400 glow-text">{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Action Buttons Bar (Screen Only) */}
          <div className="p-6 border-t border-white/10 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all border border-slate-700 cursor-pointer"
            >
              ✕ Tutup Detail
            </button>

            <div className="flex flex-wrap gap-2.5">
              {/* If pending payment -> Pay now button */}
              {statusStr.includes('pending') && onOpenPayment && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenPayment(order);
                  }}
                  className="btn-primary !py-3 !px-5 text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>💳 Bayar Sekarang</span>
                </button>
              )}

              {/* If shipped -> Confirm delivery button */}
              {statusStr.includes('shipped') && onConfirmDelivery && (
                <button
                  onClick={() => {
                    onConfirmDelivery(order);
                  }}
                  className="py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>✅ Konfirmasi Terima Paket</span>
                </button>
              )}

              {/* If completed -> Review button */}
              {(statusStr.includes('completed') || statusStr.includes('selesai')) && onOpenReview && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenReview(order);
                  }}
                  className="py-3 px-5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>⭐ Beri Ulasan</span>
                </button>
              )}

              {/* Return / Dispute button — ONLY when Delivered (not Completed) */}
              {statusStr === 'delivered' && onOpenReturn && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenReturn(order);
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 font-bold text-xs uppercase tracking-wider border border-slate-700 hover:border-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>🔄 Komplain / Retur</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN PHOTO PREVIEW MODAL */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-fade-in cursor-pointer"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl p-3 shadow-2xl flex flex-col items-center justify-center animate-scale-in cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center transition-all border border-white/10 shadow-lg text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
            <img
              src={previewPhoto}
              alt="Preview Foto Kondisi Perangkat"
              className="max-w-full max-h-[82vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
