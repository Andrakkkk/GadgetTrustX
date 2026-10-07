'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DeviceCard from '@/components/DeviceCard';
import AuthGuard from '@/components/AuthGuard';
import { formatPrice } from '@/utils/formatPrice';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import TrackingModal from '@/components/TrackingModal';
import AddressPicker from '@/components/AddressPicker';
import OrderDetailModal from '@/components/OrderDetailModal';
import { validatePhone, validateName, sanitizePhone } from '@/utils/validation';

export default function SellerProfilePage() {
  const { user, isLoading, updateProfile } = useAuth();
  const sellerEmail = user?.email || '';
  const sellerName = user?.name || 'Seller';
  const sellerStoreName = user?.storeName || sellerName;
  const sellerAvatar = user?.avatar || '';

  const [devices, setDevices] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMobileTabMenu, setShowMobileTabMenu] = useState(false);
  const [wtbList, setWtbList] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [tradeInRequests, setTradeInRequests] = useState([]);
  const [tradeInPage, setTradeInPage] = useState(1);
  const [catalogPage, setCatalogPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [previewImageModal, setPreviewImageModal] = useState(null);
  const [orderDetailModal, setOrderDetailModal] = useState({ isOpen: false, order: null });
  const [sellerTrackingModal, setSellerTrackingModal] = useState({ isOpen: false, tradeIn: null, order: null });
  const [rejectTradeInModal, setRejectTradeInModal] = useState({
    isOpen: false,
    tradeInId: null,
    reason: '',
    category: 'Layar retak / Touchscreen tidak merespon',
    proofImages: [],
    returnCourier: 'JNE Express',
    returnWaybill: '',
    submitting: false,
    uploadingImage: false,
  });
  const [counterTradeInModal, setCounterTradeInModal] = useState({ isOpen: false, tradeInId: null, counterPrice: 0, reason: '', submitting: false });
  const [inspectionModal, setInspectionModal] = useState({ isOpen: false, tradeInId: null, images: [], uploading: false, submitting: false });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [offerModal, setOfferModal] = useState(null);
  const [formData, setFormData] = useState({
    name: '', brand: 'Apple', category: 'Smartphone', price: '', stock: 1, condition: 'Brand New', ram: '8GB', storage: '256GB', chipset: '', description: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [shipModal, setShipModal] = useState({ isOpen: false, orderId: null, resi: '', courier: 'JNE Express' });

  // AI Price & AutoFill Helper State
  const [aiPriceLoading, setAiPriceLoading] = useState(false);
  const [aiPriceInfo, setAiPriceInfo] = useState(null);
  const [aiAutoFillLoading, setAiAutoFillLoading] = useState(false);

  const handleAiAutoFill = async () => {
    if (!formData.name.trim()) {
      alert('Ketikkan Nama / Model Perangkat terlebih dahulu (misal: "iPhone 15 Pro Max 256GB" atau "Samsung S24 Ultra").');
      return;
    }
    setAiAutoFillLoading(true);
    try {
      const res = await apiFetch('/api/devices/ai-autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName: formData.name, category: formData.category })
      });
      const result = await res.json();
      if (res.ok && result.data) {
        const d = result.data;
        setFormData(prev => ({
          ...prev,
          name: d.name || prev.name,
          brand: d.brand || prev.brand,
          category: d.category ? (d.category.charAt(0).toUpperCase() + d.category.slice(1)) : prev.category,
          price: d.price || prev.price,
          condition: d.condition || prev.condition,
          ram: d.ram || prev.ram,
          storage: d.storage || prev.storage,
          chipset: d.processor || prev.chipset,
          description: d.description || prev.description,
        }));
        alert('✨ Berhasil mengisi otomatis Harga, Merek, Spesifikasi & Deskripsi Produk dengan Gemini AI!');
      } else {
        alert(result.error || 'Gagal mengisi otomatis dengan AI.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghubungi service AI Auto-Fill.');
    } finally {
      setAiAutoFillLoading(false);
    }
  };

  const handleEstimatePrice = async (isWtb = false) => {
    const targetName = isWtb ? offerForm.deviceName : formData.name;
    if (!targetName) {
      alert('Masukkan nama/model perangkat terlebih dahulu untuk dianalisis AI.');
      return;
    }
    setAiPriceLoading(true);
    setAiPriceInfo(null);
    try {
      const payload = isWtb
        ? { device: offerForm.deviceName, brand: 'Device', condition: offerForm.condition, storage: offerForm.storage || '128GB', ram: offerForm.ram || '8GB' }
        : { device: formData.name, brand: formData.brand, condition: formData.condition, storage: formData.storage, ram: formData.ram, category: formData.category };

      const res = await fetch('/api/price-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.price) {
        if (isWtb) {
          setOfferForm(prev => ({ ...prev, price: data.price }));
        } else {
          setFormData(prev => ({ ...prev, price: data.price }));
        }
        setAiPriceInfo(data);
      } else {
        alert('Gagal mendapatkan estimasi harga AI.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghubungi AI Price Checker.');
    } finally {
      setAiPriceLoading(false);
    }
  };

  // Profile State
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '', bio: '', storeName: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [offerForm, setOfferForm] = useState({ deviceName: '', price: '', condition: 'Good', ram: '8GB', storage: '256GB', description: '', imageFile: null, imagePreview: null });
  const [sendingOffer, setSendingOffer] = useState(false);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        setProfileForm({
          name: user.name || '',
          phone: user.phone || '',
          address: user.address || '',
          bio: user.bio || '',
          storeName: user.storeName || user.name || ''
        });
        if (user?.avatar) setAvatarPreview(user.avatar);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (profileForm.storeName && profileForm.storeName.trim().length > 50) {
      alert('Gagal: Nama toko maksimal 50 karakter.');
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
    alert('Profil toko berhasil diperbarui!');
  };

  const handleSendOffer = async (e) => {
    e.preventDefault();
    if (!offerModal || !user) return;
    setSendingOffer(true);

    let imageUrl = null;
    if (offerForm.imageFile) {
      const fd = new FormData();
      fd.append('file', offerForm.imageFile);
      try {
        const res = await apiFetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) imageUrl = data.url;
      } catch (err) { console.error('Image upload failed', err); }
    }

    const buyer = offerModal.wtbItem;
    const catalog = {
      deviceName: offerForm.deviceName,
      price: offerForm.price,
      condition: offerForm.condition,
      ram: offerForm.ram,
      storage: offerForm.storage,
      description: offerForm.description,
      image: imageUrl,
      sellerName,
      sellerEmail
    };
    const res = await apiFetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        otherEmail: buyer.authorEmail,
        message: {
          type: 'catalog',
          text: `Penawaran: ${offerForm.deviceName}`,
          metadata: { catalog },
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSendingOffer(false);
      alert(data.error || 'Gagal mengirim penawaran.');
      return;
    }
    window.dispatchEvent(new Event('chatUpdated'));

    setSendingOffer(false);
    setOfferModal(null);
    setOfferForm({ deviceName: '', price: '', condition: 'Good', ram: '8GB', storage: '256GB', description: '', imageFile: null, imagePreview: null });
    alert(`Penawaran berhasil dikirim ke ${buyer.authorName}!`);
  };
  
  useEffect(() => {
    fetch('/api/devices')
      .then((res) => res.json())
      .then((data) => setDevices(data.devices || []))
      .catch((error) => console.error('Failed to load devices', error));

    fetch('/api/wtb')
      .then((res) => res.json())
      .then((data) => setWtbList(data.listings || []))
      .catch((error) => console.error('Failed to load WTB listings', error));

    if (sellerEmail) {
      apiFetch('/api/orders')
        .then((res) => res.json())
        .then((data) => setAllOrders(data.orders || []))
        .catch((error) => console.error('Failed to load seller orders', error));

      fetch(`/api/reviews?sellerEmail=${encodeURIComponent(sellerEmail)}`)
        .then((res) => res.json())
        .then((data) => setAllReviews(data.reviews || []))
        .catch((error) => console.error('Failed to load seller reviews', error));

      apiFetch('/api/trade-in')
        .then((res) => res.json())
        .then((data) => setTradeInRequests(data.tradeIns || []))
        .catch((error) => console.error('Failed to load seller trade-in requests', error));
    }
  }, [sellerEmail]);

  const handleApproveTradeIn = async (id, finalVal) => {
    try {
      const res = await apiFetch(`/api/trade-in/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', finalValue: finalVal })
      });
      if (res.ok) {
        const data = await res.json();
        setTradeInRequests(prev => prev.map(t => t.id === id ? data.tradeIn : t));
        alert('Permintaan tukar tambah berhasil disetujui!');
      }
    } catch (e) {
      alert('Gagal menyetujui tukar tambah.');
    }
  };

  const handleRejectTradeIn = (id) => {
    setRejectTradeInModal({
      isOpen: true,
      tradeInId: id,
      reason: '',
      category: 'Layar retak / Touchscreen tidak merespon',
      proofImages: [],
      returnCourier: 'JNE Express',
      returnWaybill: '',
      submitting: false,
      uploadingImage: false,
    });
  };

  const handleUploadProofImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRejectTradeInModal(prev => ({ ...prev, uploadingImage: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setRejectTradeInModal(prev => ({
          ...prev,
          proofImages: [...prev.proofImages, data.url].slice(0, 4),
        }));
      } else {
        alert('Gagal mengunggah foto bukti.');
      }
    } catch (err) {
      alert('Gagal mengunggah foto bukti.');
    } finally {
      setRejectTradeInModal(prev => ({ ...prev, uploadingImage: false }));
    }
  };

  const handleRemoveProofImage = (index) => {
    setRejectTradeInModal(prev => ({
      ...prev,
      proofImages: prev.proofImages.filter((_, i) => i !== index),
    }));
  };

  const submitRejectTradeIn = async (e) => {
    e.preventDefault();
    if (!rejectTradeInModal.tradeInId) return;
    setRejectTradeInModal(prev => ({ ...prev, submitting: true }));

    const rejectionPayload = JSON.stringify({
      reason: rejectTradeInModal.reason || 'Kondisi fisik perangkat tidak memenuhi standar kelayakan toko.',
      category: rejectTradeInModal.category,
      proofImages: rejectTradeInModal.proofImages,
      returnCourier: rejectTradeInModal.returnCourier,
      returnWaybill: rejectTradeInModal.returnWaybill,
    });

    try {
      const res = await apiFetch(`/api/trade-in/${rejectTradeInModal.tradeInId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: rejectionPayload })
      });
      if (res.ok) {
        const data = await res.json();
        setTradeInRequests(prev => prev.map(t => t.id === rejectTradeInModal.tradeInId ? data.tradeIn : t));
        setRejectTradeInModal({
          isOpen: false,
          tradeInId: null,
          reason: '',
          category: 'Layar retak / Touchscreen tidak merespon',
          proofImages: [],
          returnCourier: 'JNE Express',
          returnWaybill: '',
          submitting: false,
          uploadingImage: false,
        });
        alert('Pengajuan tukar tambah berhasil ditolak & diretur dengan foto bukti!');
      }
    } catch (e) {
      alert('Gagal menolak tukar tambah.');
    } finally {
      setRejectTradeInModal(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleCounterOfferTradeIn = (id, currentVal) => {
    setCounterTradeInModal({
      isOpen: true,
      tradeInId: id,
      counterPrice: currentVal || 0,
      reason: 'Harga disesuaikan dengan estimasi pasar',
      submitting: false,
    });
  };

  const submitCounterOfferTradeIn = async (e) => {
    e.preventDefault();
    if (!counterTradeInModal.tradeInId) return;
    setCounterTradeInModal(prev => ({ ...prev, submitting: true }));
    try {
      const res = await apiFetch(`/api/trade-in/${counterTradeInModal.tradeInId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'counter_offer',
          counterPrice: Number(counterTradeInModal.counterPrice),
          reason: counterTradeInModal.reason || 'Penawaran disesuaikan seller',
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTradeInRequests(prev => prev.map(t => t.id === counterTradeInModal.tradeInId ? data.tradeIn : t));
        setCounterTradeInModal({ isOpen: false, tradeInId: null, counterPrice: 0, reason: '', submitting: false });
        alert('Penawaran balik (Nego) berhasil dikirim ke pembeli!');
      }
    } catch (e) {
      alert('Gagal mengirim penawaran balik.');
    } finally {
      setCounterTradeInModal(prev => ({ ...prev, submitting: false }));
    }
  };

  // Open inspection photo modal (seller photos when receiving old device)
  const handleConfirmReceivedTradeIn = (id) => {
    setInspectionModal({ isOpen: true, tradeInId: id, images: [], uploading: false, submitting: false });
  };

  // Upload single inspection photo
  const handleInspectionUpload = async (file) => {
    if (!file) return;
    setInspectionModal(prev => ({ ...prev, uploading: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiFetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) {
        setInspectionModal(prev => ({ ...prev, images: [...prev.images, data.url] }));
      } else {
        alert(data.error || 'Gagal upload foto.');
      }
    } catch (e) {
      alert('Gagal upload foto inspeksi.');
    } finally {
      setInspectionModal(prev => ({ ...prev, uploading: false }));
    }
  };

  // Remove a photo from inspection list
  const handleRemoveInspectionPhoto = (idx) => {
    setInspectionModal(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  // Submit confirm_received with inspection photos
  const handleSubmitInspection = async () => {
    if (inspectionModal.images.length === 0) {
      alert('Mohon upload minimal 1 foto kondisi fisik perangkat lama yang diterima.');
      return;
    }
    setInspectionModal(prev => ({ ...prev, submitting: true }));
    try {
      const res = await apiFetch(`/api/trade-in/${inspectionModal.tradeInId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_received',
          inspectionImages: inspectionModal.images,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTradeInRequests(prev => prev.map(t => t.id === inspectionModal.tradeInId ? data.tradeIn : t));
        apiFetch('/api/orders?scope=all')
          .then(r => r.json())
          .then(orderData => setAllOrders(orderData.orders || []));
        setInspectionModal({ isOpen: false, tradeInId: null, images: [], uploading: false, submitting: false });
        alert('🎉 Perangkat lama berhasil dikonfirmasi dengan foto inspeksi!\n\nSilakan buka tab "Pesanan Buyer" untuk kirim HP baru ke pembeli.');
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal mengonfirmasi penerimaan.');
      }
    } catch (e) {
      alert('Gagal menghubungi server.');
    } finally {
      setInspectionModal(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleMarkOrderDelivered = async (orderId) => {
    try {
      const res = await apiFetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: 'Delivered' }),
      });
      if (res.ok) {
        apiFetch('/api/orders?scope=all')
          .then((res) => res.json())
          .then((data) => setAllOrders(data.orders || []));
        alert('Status pesanan berhasil diubah menjadi Delivered (Sampai di Tujuan)!');
      }
    } catch (e) {
      alert('Gagal memperbarui status pesanan.');
    }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!user) return;
    let imageUrl = null;
    const fileInput = e.target.elements.imageFile;
    if (fileInput && fileInput.files[0]) {
      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', fileInput.files[0]);
      try {
        const res = await apiFetch('/api/upload', { method: 'POST', body: formDataUpload });
        const data = await res.json();
        if (data.url) imageUrl = data.url;
      } catch (err) { console.error("Failed to upload image", err); }
      setUploading(false);
    }

    let updatedDevices;
    if (editingId) {
      const payload = {
        ...formData,
        price: parseInt(formData.price),
        stock: parseInt(formData.stock) || 0,
        image: imageUrl || devices.find((d) => d.id === editingId)?.image,
      };
      const res = await apiFetch(`/api/devices/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      updatedDevices = devices.map(d => {
        if (d.id === editingId) {
          return data.device;
        }
        return d;
      });
    } else {
      const payload = {
        ...formData,
        price: parseInt(formData.price),
        stock: parseInt(formData.stock) || 1,
        image: imageUrl || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=800',
        sellerEmail,
        verifiedByTrustX: false,
      };
      const res = await apiFetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      updatedDevices = [data.device, ...devices];
    }

    setDevices(updatedDevices);
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ name: '', brand: 'Apple', category: 'Smartphone', price: '', stock: 1, condition: 'Brand New', ram: '8GB', storage: '256GB', chipset: '', description: '' });
    setImagePreview(null);
    setAiPriceInfo(null);
  };

  const handleEditDevice = (device) => {
    setFormData({
      name: device.name || '', brand: device.brand || 'Apple', category: device.category || 'Smartphone',
      price: device.price !== undefined ? device.price : '', stock: device.stock !== undefined ? device.stock : 1,
      condition: device.condition || 'Brand New', ram: device.ram || '8GB', storage: device.storage || '256GB',
      chipset: device.chipset || '', description: device.description || '',
    });
    setEditingId(device.id);
    setImagePreview(device.image || null);
    setShowAddForm(true);
    setAiPriceInfo(null);
  };

  const handleDeleteDevice = async (id) => {
    await apiFetch(`/api/devices/${id}`, { method: 'DELETE' });
    const updatedDevices = devices.filter(d => d.id !== id);
    setDevices(updatedDevices);
  };

  const myListings = devices.filter(d => d.seller?.id === sellerEmail);

  const sellerOrders = useMemo(() => allOrders.filter(order =>
    order.items?.some(item => item.seller?.id === sellerEmail)
  ), [allOrders, sellerEmail]);

  const sellerReviews = useMemo(() => allReviews.filter(r => r.sellerEmail === sellerEmail), [allReviews, sellerEmail]);

  const monthlySales = useMemo(() => {
    const now = new Date(); const m = now.getMonth(); const y = now.getFullYear();
    return sellerOrders.reduce((sum, order) => {
      const d = new Date(order.date);
      if (d.getMonth() === m && d.getFullYear() === y) {
          return sum + (order.items || []).filter(i => i?.seller?.id === sellerEmail)
            .reduce((s, i) => s + (i.price * (i.cartQty || 1)), 0);
      }
      return sum;
    }, 0);
  }, [sellerOrders, sellerEmail]);

  const trustScore = useMemo(() => {
    if (!sellerReviews.length) return null;
    const avg = sellerReviews.reduce((s, r) => s + r.rating, 0) / sellerReviews.length;
    return Math.round(avg * 20 * 10) / 10;
  }, [sellerReviews]);

  const lowStockCount = myListings.filter(d => d.stock > 0 && d.stock <= 3).length;

  const recentActivities = useMemo(() => {
    const acts = [];
    sellerOrders.slice(0, 3).forEach(order => acts.push({
      text: `Pesanan ${order.id} — ${order.status}`,
      time: order.date,
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: order.status === 'Completed' ? 'text-blue-400' : order.status === 'Delivered' ? 'text-emerald-400' : 'text-slate-400'
    }));
    sellerReviews.slice(0, 2).forEach(rev => acts.push({
      text: `${rev.buyerName} memberi ${rev.rating}★ untuk ${rev.deviceName}`,
      time: rev.date,
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      color: 'text-amber-400'
    }));
    return acts.slice(0, 5);
  }, [sellerOrders, sellerReviews]);

  if (isLoading || !user || user.role !== 'seller') {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="glass-panel p-10 text-center max-w-md animate-fade-in">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Akses Seller Dibatasi</h3>
            <p className="text-slate-500 mb-8">Dashboard ini hanya untuk seller profesional. Hubungi support untuk upgrade akun.</p>
            <button onClick={() => window.location.href = '/buyer-profile'} className="btn-primary !w-full">Kembali ke Profil</button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen pb-20 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-3 space-y-6">
              <div className="glass-panel p-6 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden ring-4 ring-white/5 shadow-2xl">
                    {sellerAvatar ? (
                      <img src={sellerAvatar} alt={sellerName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-2xl font-black text-white">
                        {sellerName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl border-4 border-slate-900 shadow-xl" title="Seller terverifikasi">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{sellerStoreName}</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{sellerEmail}</p>
                
                <div className="flex gap-2 mt-4">
                   <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black text-blue-400 uppercase tracking-tighter">Pro Seller</div>
                    <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-black text-emerald-400 uppercase tracking-tighter">
                      {trustScore !== null ? `${trustScore}% Positif` : 'Seller Baru'}
                    </div>
                </div>
              </div>

              {/* Navigation Items Data */}
              {(() => {
                const sellerNavItems = [
                  { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                  { id: 'listings', label: 'Listing Saya', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                  { id: 'orders', label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', count: sellerOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length },
                  { id: 'tradein', label: 'Tukar Tambah', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', count: tradeInRequests.filter(t => t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'Completed' && t.status !== 'Cancelled' && t.status !== 'rejected').length },
                  { id: 'wtb', label: 'Request', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', count: wtbList.length },
                  { id: 'profile', label: 'Pengaturan', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
                ];
                const activeNavObj = sellerNavItems.find(item => item.id === activeTab) || sellerNavItems[0];

                return (
                  <>
                    {/* Mobile Navigation Pop-up Selector Button (Mobile Only) */}
                    <div className="lg:hidden w-full mt-4">
                      <button
                        type="button"
                        onClick={() => setShowMobileTabMenu(true)}
                        className="w-full glass-panel p-4 flex items-center justify-between border-blue-500/40 bg-slate-900/90 text-white font-bold text-xs sm:text-sm shadow-xl rounded-2xl cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Menu:</span>
                          <span className="flex items-center gap-2 text-blue-400 font-black">
                            <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={activeNavObj.icon}></path></svg>
                            {activeNavObj.label}
                          </span>
                          {activeNavObj.count > 0 && (
                            <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                              {activeNavObj.count}
                            </span>
                          )}
                        </div>
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
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
                              <h3 className="text-base font-black text-white">Menu Dashboard Seller</h3>
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
                            {sellerNavItems.map(item => (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setActiveTab(item.id);
                                  setShowAddForm(false);
                                  setShowMobileTabMenu(false);
                                }}
                                className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all font-bold text-xs ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 border border-white/5'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-blue-400'}`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg>
                                  </div>
                                  <span className="text-left font-bold text-sm">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {item.count > 0 && (
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
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
                      {sellerNavItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => { setActiveTab(item.id); setShowAddForm(false); }}
                          className={`flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-sm ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
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

              <button 
                onClick={() => { setEditingId(null); setFormData({name: '', brand: 'Apple', category: 'Smartphone', price: '', stock: 1, condition: 'Good', ram: '8GB', storage: '256GB', chipset: '', description: ''}); setShowAddForm(true); setActiveTab('listings'); }}
                className="w-full btn-primary !py-5 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/30 font-black uppercase tracking-widest text-xs"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                Posting Listing Baru
              </button>
            </aside>

            {/* Main Content Area */}
            <main className="lg:col-span-9">
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                    <div className="glass-panel p-4 sm:p-6 md:p-8 bg-gradient-to-br from-blue-600/10 to-transparent border-blue-500/20">
                       <p className="text-[9px] sm:text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1 sm:mb-2">Penjualan Bulanan</p>
                       <h3 className="text-xl sm:text-3xl md:text-4xl font-black text-white mb-1 sm:mb-2 break-all">{monthlySales > 0 ? formatPrice(monthlySales) : 'Rp 0'}</h3>
                       <p className="text-[10px] sm:text-xs text-slate-500 font-medium">{sellerOrders.length} total pesanan</p>
                    </div>
                    <div className="glass-panel p-4 sm:p-6 md:p-8">
                       <p className="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 sm:mb-2">Listing Aktif</p>
                       <h3 className="text-2xl sm:text-4xl font-black text-white mb-1 sm:mb-2">{myListings.length}</h3>
                       <p className="text-[10px] sm:text-xs text-slate-500 font-medium">{lowStockCount > 0 ? `${lowStockCount} stok menipis` : 'Semua stok aman'}</p>
                    </div>
                    <div className="glass-panel p-4 sm:p-6 md:p-8">
                       <p className="text-[9px] sm:text-[10px] text-purple-400 font-black uppercase tracking-widest mb-1 sm:mb-2">Trust Score</p>
                       {trustScore !== null ? (
                         <>
                           <h3 className="text-2xl sm:text-4xl font-black text-white mb-1 sm:mb-2">{trustScore}</h3>
                            <p className="text-xs text-slate-500 mb-2">Berdasarkan {sellerReviews.length} ulasan</p>
                           <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all" style={{width: `${trustScore}%`}}></div>
                           </div>
                         </>
                       ) : (
                         <>
                           <h3 className="text-4xl font-black text-slate-600 mb-2">—</h3>
                            <p className="text-xs text-slate-600">Belum ada ulasan</p>
                         </>
                       )}
                    </div>
                  </div>

                  <div className="glass-panel p-8">
                     <h3 className="text-xl font-bold text-white mb-6">Aktivitas Terbaru</h3>
                     {recentActivities.length === 0 ? (
                       <p className="text-slate-500 text-sm text-center py-6">Belum ada aktivitas. Mulai jualan untuk melihat data di sini.</p>
                     ) : (
                       <div className="space-y-6 text-slate-400">
                         {recentActivities.map((act, i) => (
                           <div key={i} className="flex gap-4 items-start">
                              <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${act.color}`}>
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={act.icon}></path></svg>
                              </div>
                              <div>
                                 <p className="text-sm text-slate-200 font-medium">{act.text}</p>
                                 <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">{act.time}</p>
                              </div>
                           </div>
                         ))}
                       </div>
                     )}
                  </div>
                </div>
              )}

              {activeTab === 'listings' && (
                <div className="animate-fade-in">
                  {showAddForm ? (
                    <div className="glass-panel p-8 relative overflow-hidden">
                       <div className="flex items-center justify-between mb-10">
                          <h2 className="text-3xl font-black text-white tracking-tight">{editingId ? 'Edit Listing' : 'Posting Listing Baru'}</h2>
                          <button onClick={() => { setShowAddForm(false); setImagePreview(null); }} className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white transition-colors">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                       </div>
                       
                       <form onSubmit={handleAddDevice} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Device Title & AI Auto-Fill */}
                            <div className="md:col-span-2 space-y-2">
                               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Judul / Model Perangkat</label>
                                 <button
                                   type="button"
                                   onClick={handleAiAutoFill}
                                   disabled={aiAutoFillLoading}
                                   className="text-xs font-black uppercase tracking-wider text-emerald-300 hover:text-white flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/30 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all disabled:opacity-50"
                                 >
                                   {aiAutoFillLoading ? (
                                     <>
                                       <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                       <span>Gemini AI Sedang Mengisi Spek...</span>
                                     </>
                                   ) : (
                                     <>
                                       <span>✨ Isi Otomatis dengan AI (Spek, Harga & Deskripsi)</span>
                                     </>
                                   )}
                                 </button>
                               </div>
                               <input type="text" required placeholder="e.g. iPhone 15 Pro Max 256GB / Samsung S24 Ultra" className="input-field !text-lg !py-4" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                               <p className="text-[11px] text-slate-400">
                                 💡 <strong>Tip Cepat:</strong> Ketik nama model (contoh: <em>&quot;iPhone 13 Pro 128GB&quot;</em>), lalu klik tombol <strong>✨ Isi Otomatis dengan AI</strong> di atas untuk membuat deskripsi & spek instan.
                               </p>
                            </div>
                           
                           {/* Brand */}
                           <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Brand</label>
                              <select className="input-field appearance-none cursor-pointer" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                                 {['Apple', 'Samsung', 'Google', 'Xiaomi', 'Oppo', 'Vivo', 'Asus', 'Other'].map(b => <option key={b}>{b}</option>)}
                              </select>
                           </div>

                           {/* Category */}
                           <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Kategori</label>
                              <select className="input-field appearance-none cursor-pointer" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                 {['Smartphone', 'Tablet', 'Laptop', 'Smartwatch', 'Accessory', 'Other'].map(c => <option key={c}>{c}</option>)}
                              </select>
                           </div>
                           
                           {/* Price with AI Button */}
                           <div className="md:col-span-2 p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20">
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga Jual (IDR)</label>
                                <button
                                  type="button"
                                  onClick={() => handleEstimatePrice(false)}
                                  disabled={aiPriceLoading}
                                  className="text-[10px] font-black uppercase tracking-wider text-purple-400 hover:text-purple-300 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30"
                                >
                                  {aiPriceLoading ? (
                                    <span>AI sedang menilai...</span>
                                  ) : (
                                    <>
                                      <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                      <span>✨ Dapatkan Estimasi Harga AI</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <input type="number" required placeholder="15000000" className="input-field !text-xl font-bold text-white" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                              
                              {aiPriceInfo && (
                                <div className="mt-3 text-xs text-purple-300 flex items-center justify-between border-t border-purple-500/20 pt-2">
                                  <span>Rentang Pasar Wajar AI: <strong>{formatPrice(aiPriceInfo.priceRange?.[0] || 0)} - {formatPrice(aiPriceInfo.priceRange?.[1] || 0)}</strong></span>
                                  <span className="text-[10px] uppercase font-bold text-emerald-400">Tingkat Keyakinan: {aiPriceInfo.confidence}%</span>
                                </div>
                              )}
                           </div>

                           {/* Stock */}
                           <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Stok (Qty)</label>
                              <input type="number" min="1" required placeholder="1" className="input-field" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 1})} />
                           </div>

                           {/* Condition */}
                           <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Kondisi</label>
                              <select className="input-field appearance-none cursor-pointer" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                                 {['Brand New', 'Like New', 'Excellent', 'Good', 'Fair', 'Cracked'].map(cond => <option key={cond}>{cond}</option>)}
                              </select>
                           </div>

                           {/* RAM */}
                           <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">RAM</label>
                              <select className="input-field appearance-none cursor-pointer" value={formData.ram} onChange={e => setFormData({...formData, ram: e.target.value})}>
                                 {['4GB', '6GB', '8GB', '12GB', '16GB', '24GB', '32GB'].map(r => <option key={r}>{r}</option>)}
                              </select>
                           </div>

                           {/* Storage */}
                           <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Penyimpanan</label>
                              <select className="input-field appearance-none cursor-pointer" value={formData.storage} onChange={e => setFormData({...formData, storage: e.target.value})}>
                                 {['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'].map(s => <option key={s}>{s}</option>)}
                              </select>
                           </div>

                           {/* Chipset */}
                           <div className="md:col-span-2">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Chipset / Processor</label>
                              <input type="text" placeholder="e.g. Apple A17 Pro / Snapdragon 8 Gen 3" className="input-field" value={formData.chipset} onChange={e => setFormData({...formData, chipset: e.target.value})} />
                            
                            {/* Description */}
                            <div className="md:col-span-2">
                               <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Deskripsi & Detail Kondisi</label>
                               <textarea required rows="4" className="input-field !py-4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Sebutkan BH, lecet, status garansi..."></textarea>
                            </div>

                            {/* Product Image & Live Card Preview */}
                            <div className="md:col-span-2 space-y-4">
                               <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Foto & Pratinjau Tampilan Card Marketplace</label>
                               
                               <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                  {/* Upload Zone */}
                                  <div className="lg:col-span-7">
                                     <div className="relative group w-full h-64 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 border-dashed hover:border-blue-500 transition-all flex items-center justify-center">
                                        {imagePreview ? (
                                           <div className="relative w-full h-full flex items-center justify-center bg-[#0a0f1a]">
                                              <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-3" />
                                              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                                                 <span className="text-xs font-bold text-white px-3.5 py-2 rounded-xl bg-blue-600 shadow-xl">Klik untuk ganti foto</span>
                                                 <button
                                                    type="button"
                                                    onClick={(e) => {
                                                       e.stopPropagation();
                                                       setImagePreview(null);
                                                       const fileInput = document.querySelector('input[name="imageFile"]');
                                                       if (fileInput) fileInput.value = '';
                                                    }}
                                                    className="text-xs font-bold text-red-400 hover:text-red-300 px-3.5 py-2 rounded-xl bg-red-500/20 border border-red-500/30 backdrop-blur-sm z-20"
                                                 >
                                                    Hapus Foto
                                                 </button>
                                              </div>
                                           </div>
                                        ) : (
                                           <div className="flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                                              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3 text-blue-400 group-hover:scale-110 transition-transform">
                                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                              </div>
                                              <span className="text-xs font-bold text-slate-300 mb-1">Klik untuk upload foto produk</span>
                                              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Format PNG, JPG, WEBP (Otomatis Presisi)</span>
                                           </div>
                                        )}
                                        <input
                                           type="file"
                                           name="imageFile"
                                           accept="image/*"
                                           className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                           onChange={(e) => {
                                              const file = e.target.files[0];
                                              if (file) {
                                                 setImagePreview(URL.createObjectURL(file));
                                              }
                                           }}
                                        />
                                     </div>
                                  </div>

                                  {/* Live Card Mockup Preview */}
                                  <div className="lg:col-span-5 space-y-2">
                                     <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Live Preview Card</span>
                                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                           Presisi / Tidak Terpotong
                                        </span>
                                     </div>

                                     <DeviceCard
                                        device={{
                                           id: 'live-preview',
                                           name: formData.name || 'Judul Model Perangkat',
                                           brand: formData.brand || 'Brand',
                                           price: parseInt(formData.price) || 0,
                                           stock: parseInt(formData.stock) || 1,
                                           ram: formData.ram,
                                           storage: formData.storage,
                                           condition: formData.condition || 'Brand New',
                                           image: imagePreview || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=800',
                                           verifiedByTrustX: true,
                                           seller: {
                                              id: sellerEmail,
                                              name: sellerStoreName,
                                              reputationScore: 100,
                                              verified: true,
                                           }
                                        }}
                                     />
                                  </div>
                               </div>
                            </div>
                           </div>

                           {/* Submit Button */}
                           <div className="md:col-span-2 pt-6">
                              <button type="submit" disabled={uploading} className="btn-primary !py-5 w-full flex items-center justify-center gap-3">
                                 {uploading ? 'Memproses...' : (editingId ? 'Simpan Perubahan' : 'Publikasikan ke Marketplace')}
                              </button>
                           </div>
                        </form>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myListings.length > 0 ? (
                        (() => {
                          const itemsPerPage = 10;
                          const totalPages = Math.ceil(myListings.length / itemsPerPage) || 1;
                          const currentPage = Math.min(catalogPage, totalPages);
                          const startIndex = (currentPage - 1) * itemsPerPage;
                          const paginatedListings = myListings.slice(startIndex, startIndex + itemsPerPage);

                          return (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginatedListings.map((device) => (
                                  <div key={device.id} className="relative group animate-fade-in">
                                    <div className="absolute top-4 right-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                      <button onClick={() => handleEditDevice(device)} className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xl hover:bg-blue-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                      </button>
                                      <button onClick={() => handleDeleteDevice(device.id)} className="p-2.5 rounded-xl bg-red-600 text-white shadow-xl hover:bg-red-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                      </button>
                                    </div>
                                    <DeviceCard device={device} />
                                  </div>
                                ))}
                              </div>

                              {/* Pagination Bar (Maksimal 10 Produk Per Halaman) */}
                              {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-[#0d1117] border border-white/[0.08] text-xs mt-8">
                                  <span className="text-slate-400 font-bold">
                                    Menampilkan <strong className="text-white">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, myListings.length)}</strong> dari <strong className="text-white">{myListings.length}</strong> produk toko (Halaman {currentPage} dari {totalPages})
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setCatalogPage((p) => Math.max(p - 1, 1))}
                                      disabled={currentPage === 1}
                                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all border border-slate-700"
                                    >
                                      ← Sebelumnya
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setCatalogPage((p) => Math.min(p + 1, totalPages))}
                                      disabled={currentPage === totalPages}
                                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all border border-blue-500 shadow-lg shadow-blue-500/20"
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
                        <div className="lg:col-span-3 py-20 text-center glass-panel">
                           <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
                              <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                           </div>
                           <h3 className="text-xl font-bold text-white mb-2">Belum ada listing</h3>
                           <p className="text-slate-500 mb-8">Mulai perjalanan jualan dengan posting perangkat pertama.</p>
                           <button onClick={() => setShowAddForm(true)} className="btn-primary !px-8">Buat Listing</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="text-2xl font-black text-white mb-2">Pesanan Buyer</h2>
                  <p className="text-slate-500 mb-8">Kelola pesanan produk, pantau status, dan tangani return.</p>
                  
                  <div className="space-y-4">
                    {sellerOrders.length > 0 ? (
                      (() => {
                        const itemsPerPage = 10;
                        const totalPages = Math.ceil(sellerOrders.length / itemsPerPage) || 1;
                        const currentPage = Math.min(ordersPage, totalPages);
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const paginatedOrders = sellerOrders.slice(startIndex, startIndex + itemsPerPage);

                        return (
                          <>
                            {paginatedOrders.map(order => (
                              <div key={order.id} className="glass-panel p-6 border border-slate-800/50 hover:border-blue-500/30 transition-all">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Pesanan #{order.id}</span>
                                      <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(order.date).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white">{order.buyerEmail}</h3>
                                    <div className="flex items-center gap-3">
                                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                        order.status === 'Completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                        order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        order.status === 'Shipped' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                        order.status === 'Returned' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        'bg-slate-800 text-slate-400 border-slate-700'
                                      }`}>
                                        {order.status}
                                      </span>
                                      {(order.status === 'Processing' || order.status === 'Shipped') && (
                                        <div className="flex flex-wrap gap-1.5 items-center">
                                          <button
                                            onClick={() => setShipModal({ isOpen: true, orderId: order.id, resi: order.waybillNumber || '', courier: order.shippingCourier || 'JNE Express' })}
                                            className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all flex items-center gap-1 cursor-pointer"
                                          >
                                            <span>🚚 {order.waybillNumber ? 'Edit Resi' : 'Input Resi'}</span>
                                          </button>
                                          {order.waybillNumber && (
                                            <button
                                              type="button"
                                              onClick={() => setSellerTrackingModal({ isOpen: true, tradeIn: null, order })}
                                              className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 transition-all flex items-center gap-1 cursor-pointer"
                                            >
                                              <span>🚚 Lacak Paket HP Baru (Live)</span>
                                            </button>
                                          )}
                                          {order.status === 'Shipped' && (
                                            <button
                                              onClick={() => handleMarkOrderDelivered(order.id)}
                                              className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all flex items-center gap-1 cursor-pointer"
                                            >
                                              <span>✅ Tandai Sampai (Delivered)</span>
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  {(order.items || [])
                                    .filter(item => item.seller?.id === sellerEmail)
                                    .map((item, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-white/5">
                                        <div className="flex items-center gap-4">
                                          <div
                                            className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform group relative border border-white/5"
                                            onClick={() => item.image && setPreviewImageModal(item.image)}
                                            title="Klik untuk memperbesar foto produk"
                                          >
                                            <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1.5" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-bold text-white transition-opacity">
                                              🔍
                                            </div>
                                          </div>
                                          <div>
                                            <h4 className="text-sm font-bold text-white leading-tight">{item.name}</h4>
                                            <p className="text-xs text-slate-500">{formatPrice(item.price)} x {item.cartQty || 1}</p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          {item.returnStatus ? (
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                                              item.returnStatus === 'Approved' ? 'text-emerald-400' :
                                              item.returnStatus === 'Pending' ? 'text-amber-400' :
                                              'text-red-400'
                                            }`}>
                                              {item.returnStatus === 'Approved' ? '↩ Direturn' : `↩ Return ${item.returnStatus}`}
                                            </span>
                                          ) : item.rated ? (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">★ Sudah Diulas</span>
                                          ) : (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Tidak Ada Return</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            ))}

                            {/* Pagination Bar (Maksimal 10 Pesanan Per Halaman) */}
                            {totalPages > 1 && (
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-[#0d1117] border border-white/[0.08] text-xs mt-6">
                                <span className="text-slate-400 font-bold">
                                  Menampilkan <strong className="text-white">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, sellerOrders.length)}</strong> dari <strong className="text-white">{sellerOrders.length}</strong> pesanan buyer (Halaman {currentPage} dari {totalPages})
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
                                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all border border-blue-500 shadow-lg shadow-blue-500/20"
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
                      <div className="py-20 text-center glass-panel">
                        <p className="text-slate-500">Belum ada pesanan buyer untuk produk Anda.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'wtb' && (
                <div className="space-y-6 animate-fade-in">
                   <h2 className="text-2xl font-black text-white mb-2">Request Buyer</h2>
                   <p className="text-slate-500 mb-8">Tanggapi buyer yang mencari perangkat tertentu dengan penawaran katalog custom.</p>
                   
                   <div className="grid grid-cols-1 gap-4">
                     {wtbList.map(item => (
                       <div key={item.id} className="glass-panel p-8 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-blue-500/30 transition-all">
                          <div className="flex gap-6 items-center w-full">
                             <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl font-black text-blue-500 shadow-inner group-hover:scale-110 transition-transform">
                                {item.device.charAt(0)}
                             </div>
                             <div>
                                <div className="flex items-center gap-2 mb-1">
                                   <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{item.authorName}</span>
                                   <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.date}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{item.device}</h3>
                                <div className="flex gap-4">
                                   <div className="text-emerald-400 font-bold text-sm">Budget: Hingga {item.budget}</div>
                                   <div className="text-slate-500 font-bold text-sm uppercase tracking-tighter">Kondisi: {item.condition}</div>
                                </div>
                             </div>
                          </div>
                          <button 
                            onClick={() => { setOfferModal({ wtbItem: item }); setOfferForm(prev => ({ ...prev, deviceName: item.device, condition: item.condition })); }}
                            className="w-full md:w-auto px-8 py-3 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all"
                          >
                            Kirim Penawaran
                          </button>
                       </div>
                     ))}
                   </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="glass-panel p-10 animate-fade-in">
                   <h2 className="text-3xl font-black text-white mb-2">Pengaturan Toko</h2>
                   <p className="text-slate-500 mb-10 text-sm">Perbarui tampilan publik toko untuk membangun kepercayaan buyer.</p>
                   <form onSubmit={handleProfileSave} className="space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="md:col-span-2 flex items-center gap-6 p-6 rounded-3xl bg-slate-900 border border-slate-800">
                             <div className="relative group w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white/5">
                                {avatarPreview ? <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800" />}
                                <label htmlFor="avatar-up-seller" className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                   <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                                </label>
                                <input id="avatar-up-seller" name="avatarFile" type="file" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (file) setAvatarPreview(URL.createObjectURL(file)); }} />
                             </div>
                             <div>
                                <p className="text-sm font-black text-white mb-1">Avatar Toko</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Identitas toko Anda</p>
                             </div>
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Nama Toko</label>
                             <input
                               type="text"
                               maxLength={50}
                               placeholder="Nama Toko Anda"
                               className="input-field"
                               value={profileForm.storeName}
                               onChange={e => setProfileForm({...profileForm, storeName: e.target.value})}
                             />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Nomor Publik / WA (Wajib Angka)</label>
                             <input
                               type="tel"
                               inputMode="numeric"
                               maxLength={15}
                               placeholder="Contoh: 081234567890"
                               className="input-field font-mono"
                               value={profileForm.phone}
                               onChange={e => setProfileForm({...profileForm, phone: sanitizePhone(e.target.value)})}
                             />
                             <p className="text-[10px] text-slate-500 mt-1">Hanya angka (10-15 digit, diawali 08...)</p>
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                                Lokasi Toko & Alamat Pengiriman Asal <span className="text-red-400">*</span>
                                <span className="text-slate-600 font-medium normal-case ml-2 text-[9px]">(Digunakan untuk kalkulasi ongkir pengiriman produk Anda)</span>
                              </label>
                              <AddressPicker value={profileForm.address} onChange={(address) => setProfileForm({ ...profileForm, address })} />
                           </div>
                           <div className="md:col-span-2">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Store Bio</label>
                              <textarea
                                rows="3"
                                maxLength={500}
                                className="input-field !py-4"
                                value={profileForm.bio}
                                onChange={e => setProfileForm({...profileForm, bio: e.target.value})}
                                placeholder="Ceritakan hal yang membuat toko Anda spesial (maks 500 karakter)..."
                              ></textarea>
                           </div>
                       </div>
                       
                       <button type="submit" disabled={savingProfile} className="btn-primary !py-5 !px-10 flex items-center justify-center gap-3">
                          {savingProfile ? 'Menyimpan...' : 'Perbarui Profil Toko'}
                       </button>
                    </form>
                 </div>
               )}

               {activeTab === 'tradein' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-slate-900/40 p-6 rounded-3xl border border-purple-500/20 shadow-xl">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/30">
                          Trade-In Portal
                        </span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400 font-bold">Total {tradeInRequests.length} Pengajuan</span>
                      </div>
                      <h2 className="text-2xl font-black text-white tracking-tight">Permintaan Tukar Tambah (Trade-In)</h2>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Kelola penawaran tukar tambah dari buyer. Maksimal menampilkan 10 pengajuan per halaman.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {tradeInRequests.length > 0 ? (
                      (() => {
                        const itemsPerPage = 10;
                        const totalPages = Math.ceil(tradeInRequests.length / itemsPerPage) || 1;
                        const currentPage = Math.min(tradeInPage, totalPages);
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const currentItems = tradeInRequests.slice(startIndex, startIndex + itemsPerPage);

                        return (
                          <>
                            {currentItems.map((t) => (
                              <div
                                key={t.id}
                                className="group relative bg-slate-900/80 backdrop-blur-xl p-6 md:p-7 rounded-3xl border border-slate-800 hover:border-purple-500/40 transition-all duration-300 space-y-6 shadow-2xl overflow-hidden"
                              >
                                <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

                                {/* Header */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/[0.07] pb-5">
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                                        #TRADE-IN-{t.id.slice(0, 8).toUpperCase()}
                                      </span>
                                      <span className="text-slate-600 text-xs">•</span>
                                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {new Date(t.created_at).toLocaleDateString('id-ID')}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 pt-1">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 font-black text-xs">
                                          {(t.buyer?.name || 'B').charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-bold text-white">
                                          {t.buyer?.name || 'Buyer'} <span className="text-xs text-slate-400 font-normal">({t.buyer?.email})</span>
                                        </span>
                                      </div>
                                    </div>
                                    {t.device && (
                                      <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Produk Target:</span>
                                        <div className="flex items-center gap-1.5 bg-white/[0.03] px-2.5 py-1 rounded-xl border border-white/[0.06]">
                                          {t.device.image && (
                                            <img src={t.device.image} alt={t.device.name} className="w-4 h-4 object-contain" />
                                          )}
                                          <span className="font-bold text-white">{t.device.name}</span>
                                          <span className="text-purple-400 font-extrabold">({formatPrice(t.device.price || 0)})</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-shrink-0">
                                    <span className={`px-3.5 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 backdrop-blur-md shadow-lg ${
                                      t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10' :
                                      t.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10' :
                                      t.status === 'countered' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-blue-500/10' :
                                      t.status === 'shipping' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-500/10 animate-pulse' :
                                      t.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-red-500/10' :
                                      'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/10'
                                    }`}>
                                      {t.status === 'pending' ? '⏳ MENUNGGU CONFIRMATION' :
                                       t.status === 'approved' ? '✅ DISETUJUI (APPROVED)' :
                                       t.status === 'countered' ? '💬 NEGO DIKIRIM' :
                                       t.status === 'shipping' ? '🚚 PENGIRIMAN HP LAMA' :
                                       t.status === 'completed' ? '🎉 SELESAI (COMPLETED)' : t.status.toUpperCase()}
                                    </span>
                                  </div>
                                </div>

                                {/* Body Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950/60 p-5 md:p-6 rounded-2xl border border-white/[0.05] text-xs">
                                  {/* Left Details */}
                                  <div className="lg:col-span-7 space-y-3">
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                      </svg>
                                      <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Perangkat Lama Buyer</span>
                                    </div>

                                    <h4 className="text-lg font-black text-white tracking-tight">
                                      {t.old_device_name}
                                    </h4>

                                    <div className="flex flex-wrap gap-2">
                                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                                        Kondisi: {t.old_device_condition}
                                      </span>
                                      <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                                        {t.old_device_storage} / {t.old_device_ram}
                                      </span>
                                      {t.old_device_battery_health && (
                                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                                          🔋 BH: {t.old_device_battery_health}%
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-slate-400 space-y-1 pt-1">
                                      <p><strong className="text-slate-300">Kelengkapan:</strong> {t.old_device_accessories || '-'}</p>
                                      {t.old_device_description && (
                                        <div className="mt-2 bg-white/[0.03] p-3 rounded-xl border border-white/[0.06] text-slate-300 italic leading-relaxed">
                                          &quot;{t.old_device_description}&quot;
                                        </div>
                                      )}
                                    </div>

                                    {/* Images Preview if available */}
                                    {Array.isArray(t.old_device_images) && t.old_device_images.length > 0 && (
                                      <div className="pt-2">
                                        <span className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Foto Fisik Perangkat:</span>
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                          {t.old_device_images.map((img, idx) => (
                                            <button
                                              key={idx}
                                              type="button"
                                              onClick={() => setPreviewImageModal(img)}
                                              className="block w-14 h-14 rounded-xl overflow-hidden border border-white/10 hover:border-purple-500 hover:scale-105 transition-all flex-shrink-0 cursor-pointer focus:outline-none"
                                              title="Klik untuk memperbesar foto"
                                            >
                                              <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Right Trade-In Valuation & Shipping */}
                                  <div className="lg:col-span-5 flex flex-col justify-between items-start lg:items-end text-left lg:text-right gap-4">
                                    <div className="w-full lg:w-auto bg-emerald-950/30 p-4 rounded-2xl border border-emerald-500/20 shadow-inner">
                                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest block mb-1">
                                        Potongan Harga Trade-In
                                      </span>
                                      <p className="text-2xl lg:text-3xl font-black text-emerald-400 glow-text">
                                        {formatPrice(t.final_trade_in_value || t.ai_estimated_value)}
                                      </p>
                                    </div>

                                    {t.old_device_waybill && (
                                      <div className="w-full p-4 bg-purple-950/40 rounded-2xl border border-purple-500/30 text-left text-xs space-y-2 shadow-xl">
                                        <div className="flex justify-between items-center text-purple-300">
                                          <span>Kurir Pengiriman:</span>
                                          <strong className="text-white font-bold">{t.old_device_courier}</strong>
                                        </div>
                                        <div className="flex justify-between items-center text-purple-300">
                                          <span>No. Resi Kirim:</span>
                                          <strong className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{t.old_device_waybill}</strong>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setSellerTrackingModal({ isOpen: true, tradeIn: t })}
                                          className="mt-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30"
                                        >
                                          <span>🚚 Lacak Paket Perangkat Lama (Live)</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Footer Action Buttons */}
                                <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-white/[0.07]">
                                  {t.status === 'pending' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleRejectTradeIn(t.id)}
                                        className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider transition-colors border border-red-500/20"
                                      >
                                        ❌ Tolak Pengajuan
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCounterOfferTradeIn(t.id, t.final_trade_in_value || t.ai_estimated_value)}
                                        className="px-4 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider transition-colors border border-blue-500/20"
                                      >
                                        💬 Nego / Penawaran Balik
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleApproveTradeIn(t.id, t.final_trade_in_value || t.ai_estimated_value)}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                                      >
                                        <span>✅ Setujui Penawaran ({formatPrice(t.final_trade_in_value || t.ai_estimated_value)})</span>
                                      </button>
                                    </>
                                  )}

                                  {t.status === 'countered' && (
                                    <span className="text-xs text-blue-300 italic font-medium bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20">
                                      Menunggu respon pembeli atas penawaran balik ({formatPrice(t.final_trade_in_value)})
                                    </span>
                                  )}

                                  {(t.status === 'shipping' || t.old_device_waybill) && !t.old_device_received && t.status !== 'rejected' && (
                                    <div className="flex flex-wrap gap-2 justify-end">
                                      <button
                                        type="button"
                                        onClick={() => handleRejectTradeIn(t.id)}
                                        className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider transition-colors border border-red-500/20"
                                      >
                                        🚫 Tolak & Retur HP Lama (Fisik Bermasalah)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleConfirmReceivedTradeIn(t.id)}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-500/30 flex items-center gap-1.5"
                                      >
                                        <span>📸 Upload Foto & Konfirmasi Terima</span>
                                      </button>
                                    </div>
                                  )}

                                  {/* Completed: Show inspection photos uploaded by seller */}
                                  {t.status === 'completed' && Array.isArray(t.inspection_images) && t.inspection_images.length > 0 && (
                                    <div className="mt-3 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
                                      <p className="text-[10px] font-black uppercase tracking-wider text-indigo-400 mb-2">📸 Foto Inspeksi Perangkat (Diterima Seller):</p>
                                      <div className="flex gap-2 overflow-x-auto pb-1">
                                        {t.inspection_images.map((img, idx) => (
                                          <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setPreviewImageModal(img)}
                                            className="w-16 h-16 rounded-xl overflow-hidden border border-indigo-500/30 hover:border-indigo-400 hover:scale-105 transition-all flex-shrink-0 focus:outline-none relative group"
                                          >
                                            <img src={img} alt={`Inspeksi ${idx + 1}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold text-white transition-opacity">
                                              🔍
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}

                            {/* Pagination Bar (Maksimal 10 Aja) */}
                            {totalPages > 1 && (
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-white/10 text-xs mt-6">
                                <span className="text-slate-400 font-bold">
                                  Menampilkan <strong className="text-white">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, tradeInRequests.length)}</strong> dari <strong className="text-white">{tradeInRequests.length}</strong> permintaan (Halaman {currentPage} dari {totalPages})
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
                                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all border border-purple-500"
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
                      <div className="py-20 text-center glass-panel rounded-3xl border border-slate-800">
                        <p className="text-slate-500 font-bold">Belum ada permintaan tukar tambah dari buyer.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Offer Modal Redesigned */}
       {offerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in" onClick={() => setOfferModal(null)}>
           <div className="glass-panel !rounded-3xl w-full max-w-2xl overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
              <div className="p-8 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-black text-white mb-1">Penawaran Katalog Custom</h3>
                    <p className="text-xs text-slate-500 font-medium">Dikirim ke <span className="text-blue-400 font-bold">{offerModal.wtbItem.authorName}</span></p>
                 </div>
                 <button onClick={() => setOfferModal(null)} className="p-2 rounded-xl bg-slate-900 text-slate-500 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
              </div>
              
              <form onSubmit={handleSendOffer} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nama Perangkat</label>
                       <input type="text" required className="input-field" value={offerForm.deviceName} onChange={e => setOfferForm({...offerForm, deviceName: e.target.value})} placeholder="e.g. iPhone 13 Pro 256GB Sierra Blue" />
                    </div>

                    <div className="md:col-span-2 flex justify-between items-center">
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Harga Penawaran (IDR)</label>
                       <button
                         type="button"
                         onClick={() => handleEstimatePrice(true)}
                         disabled={aiPriceLoading}
                         className="text-[10px] font-black uppercase text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-lg"
                       >
                         {aiPriceLoading ? 'Cek AI...' : '✨ Estimasi AI'}
                       </button>
                    </div>
                    <div className="md:col-span-2">
                       <input type="number" required className="input-field !text-xl font-bold text-emerald-400" value={offerForm.price} onChange={e => setOfferForm({...offerForm, price: e.target.value})} />
                    </div>
                    
                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Kondisi</label>
                       <select className="input-field appearance-none" value={offerForm.condition} onChange={e => setOfferForm({...offerForm, condition: e.target.value})}>
                          <option>Brand New</option>
                          <option>Like New</option>
                          <option>Good</option>
                          <option>Fair</option>
                       </select>
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">RAM</label>
                       <select className="input-field appearance-none" value={offerForm.ram} onChange={e => setOfferForm({...offerForm, ram: e.target.value})}>
                          {['4GB', '6GB', '8GB', '12GB', '16GB', '24GB'].map(r => <option key={r} value={r}>{r}</option>)}
                       </select>
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Penyimpanan</label>
                       <select className="input-field appearance-none" value={offerForm.storage} onChange={e => setOfferForm({...offerForm, storage: e.target.value})}>
                          {['64GB', '128GB', '256GB', '512GB', '1TB'].map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>

                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Deskripsi Penawaran</label>
                       <textarea rows="3" className="input-field !py-4" value={offerForm.description} onChange={e => setOfferForm({...offerForm, description: e.target.value})} placeholder="Tambahkan detail seperti battery health, garansi, atau lecet kecil..."></textarea>
                    </div>

                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Foto Perangkat (Opsional)</label>
                       <div className="relative group w-full h-32 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 border-dashed hover:border-blue-500/50 transition-all flex items-center justify-center">
                          {offerForm.imagePreview ? (
                             <img src={offerForm.imagePreview} alt="Preview" className="w-full h-full object-contain p-2" />
                          ) : (
                             <div className="flex flex-col items-center text-slate-600">
                                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <span className="text-[10px] font-black uppercase tracking-widest">Tambah Foto Produk</span>
                             </div>
                          )}
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                             const file = e.target.files[0];
                             if (file) setOfferForm({...offerForm, imageFile: file, imagePreview: URL.createObjectURL(file)});
                          }} />
                       </div>
                    </div>
                 </div>
                 
                 <button type="submit" disabled={sendingOffer} className="btn-primary !py-5 w-full flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/30">
                    {sendingOffer ? (
                       <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Memproses Penawaran...</span>
                       </>
                    ) : (
                       <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                          <span>Kirim Penawaran Premium</span>
                       </>
                    )}
                 </button>
               </form>
            </div>
         </div>
      )}
      {/* Ship / Resi Input Modal */}
      {shipModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
          <div className="glass-panel !rounded-3xl w-full max-w-md overflow-hidden border border-white/10 p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Input Resi Pengiriman</h3>
              <button onClick={() => setShipModal({ isOpen: false, orderId: null, resi: '', courier: 'JNE Express' })} className="p-2 rounded-xl bg-slate-900 text-slate-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await apiFetch('/api/orders', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: shipModal.orderId,
                    status: 'Shipped',
                    waybillNumber: shipModal.resi,
                    shippingCourier: shipModal.courier,
                  }),
                });
                if (res.ok) {
                  const data = await res.json();
                  setAllOrders(prev => prev.map(o => o.id === shipModal.orderId ? data.order : o));
                  setShipModal({ isOpen: false, orderId: null, resi: '', courier: 'JNE Express' });
                  alert('Nomor resi berhasil disimpan & status pesanan diperbarui menjadi Shipped!');
                }
              } catch (err) {
                alert('Gagal menyimpan resi.');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Kurir Pengiriman</label>
                <select className="input-field appearance-none cursor-pointer" value={shipModal.courier} onChange={e => setShipModal({ ...shipModal, courier: e.target.value })}>
                  {['JNE Express', 'J&T Express', 'SiCepat Ekspres', 'Anteraja', 'POS Indonesia'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nomor Resi / Waybill</label>
                <input type="text" required placeholder="e.g. JNE882910291" className="input-field !text-base" value={shipModal.resi} onChange={e => setShipModal({ ...shipModal, resi: e.target.value })} />
              </div>

              <button type="submit" className="w-full btn-primary !py-4 font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-500/20">
                Simpan & Kirim Paket
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Seller Tracking Modal (Supports order & tradeIn) */}
      {sellerTrackingModal.isOpen && (
        <TrackingModal
          order={sellerTrackingModal.order}
          tradeIn={sellerTrackingModal.tradeIn}
          onClose={() => setSellerTrackingModal({ isOpen: false, tradeIn: null, order: null })}
        />
      )}

      {/* Reject Trade-In Form Modal with Photo Upload & Return Info */}
      {rejectTradeInModal.isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in"
          onClick={() => setRejectTradeInModal(prev => ({ ...prev, isOpen: false }))}
        >
          <div
            className="glass-panel !rounded-3xl w-full max-w-lg overflow-hidden border border-red-500/30 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-red-400 text-xl">🚫</span>
                <div>
                  <h3 className="text-lg font-black text-white">Form Penolakan & Retur Perangkat</h3>
                  <p className="text-[10px] text-slate-400">Unggah foto bukti kerusakan & info pengembalian unit HP ke Pembeli.</p>
                </div>
              </div>
              <button
                onClick={() => setRejectTradeInModal(prev => ({ ...prev, isOpen: false }))}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitRejectTradeIn} className="space-y-4">
              {/* Category selector */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Kategori Kerusakan / Masalah Fisik</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    'Layar retak / Touchscreen tidak merespon',
                    'Baterai kembung / Mati total',
                    'IMEI terblokir / Tidak terdaftar',
                    'Kelengkapan / Fisik unit tidak sesuai'
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setRejectTradeInModal(prev => ({ ...prev, category: cat, reason: cat }))}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                        rejectTradeInModal.category === cat
                          ? 'bg-red-500/20 border-red-500 text-red-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Proof Images */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Unggah Foto Bukti Kerusakan Fisik (Maks 4 Foto)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {rejectTradeInModal.proofImages.map((url, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-red-500/30">
                      <img src={url} alt={`Bukti ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveProofImage(idx)}
                        className="absolute top-1 right-1 bg-red-600/90 text-white rounded-full p-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {rejectTradeInModal.proofImages.length < 4 && (
                    <label className="border-2 border-dashed border-red-500/30 hover:border-red-500/60 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer bg-red-500/5 hover:bg-red-500/10 transition-colors">
                      {rejectTradeInModal.uploadingImage ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span className="text-red-400 text-lg">📷</span>
                          <span className="text-[9px] font-bold text-slate-400 mt-1">+ Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadProofImage}
                        disabled={rejectTradeInModal.uploadingImage}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Reason detail textarea */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Catatan Detail Penolakan & Kerusakan</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Tuliskan catatan penjelasan kerusakan fisik secara detail untuk Pembeli..."
                  className="input-field !py-3 !text-xs"
                  value={rejectTradeInModal.reason}
                  onChange={(e) => setRejectTradeInModal(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              {/* Return Shipping Info */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-400">Informasi Pengembalian Barang (Retur Balik ke Buyer)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kurir Pengiriman Retur</label>
                    <select
                      className="input-field !py-2 !text-xs"
                      value={rejectTradeInModal.returnCourier}
                      onChange={(e) => setRejectTradeInModal(prev => ({ ...prev, returnCourier: e.target.value }))}
                    >
                      {['JNE Express', 'J&T Express', 'SiCepat Ekspres', 'Anteraja', 'POS Indonesia'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Resi Pengembalian (Opsional)</label>
                    <input
                      type="text"
                      placeholder="e.g. JNE-RET-881923"
                      className="input-field !py-2 !text-xs"
                      value={rejectTradeInModal.returnWaybill}
                      onChange={(e) => setRejectTradeInModal(prev => ({ ...prev, returnWaybill: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectTradeInModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-5 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider flex-1"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={rejectTradeInModal.submitting || !rejectTradeInModal.reason.trim()}
                  className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider flex-1 shadow-lg shadow-red-600/30 disabled:opacity-50"
                >
                  {rejectTradeInModal.submitting ? 'Memproses...' : '🚫 Kirim Balik & Retur HP Lama'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Counter Offer (Nego) Form Modal */}
      {counterTradeInModal.isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in"
          onClick={() => setCounterTradeInModal({ isOpen: false, tradeInId: null, counterPrice: 0, reason: '', submitting: false })}
        >
          <div
            className="glass-panel !rounded-3xl w-full max-w-md overflow-hidden border border-blue-500/20 shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-blue-400 text-xl">💬</span>
                <h3 className="text-lg font-black text-white">Ajukan Harga Ulang (Nego)</h3>
              </div>
              <button
                onClick={() => setCounterTradeInModal({ isOpen: false, tradeInId: null, counterPrice: 0, reason: '', submitting: false })}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitCounterOfferTradeIn} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Nominal Harga Penawaran Ulang (IDR) <span className="text-red-400">*</span>
                </label>
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                  <input
                    type="number"
                    required
                    min="1000"
                    className="input-field !pl-12 !text-lg font-bold text-emerald-400"
                    value={counterTradeInModal.counterPrice}
                    onChange={(e) => setCounterTradeInModal(prev => ({ ...prev, counterPrice: Number(e.target.value) }))}
                  />
                </div>

                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Catatan Penawaran Ulang (Opsional)</label>
                <textarea
                  rows="2"
                  placeholder="Jelaskan alasan penawaran harga ini ke pembeli..."
                  className="input-field !py-3 !text-xs"
                  value={counterTradeInModal.reason}
                  onChange={(e) => setCounterTradeInModal(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCounterTradeInModal({ isOpen: false, tradeInId: null, counterPrice: 0, reason: '', submitting: false })}
                  className="px-5 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider flex-1"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={counterTradeInModal.submitting || !counterTradeInModal.counterPrice}
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider flex-1 shadow-lg shadow-blue-600/30 disabled:opacity-50"
                >
                  {counterTradeInModal.submitting ? 'Memproses...' : '📩 Kirim Penawaran Balik'}
                </button>
              </div>
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

      {/* ============ INSPECTION PHOTO UPLOAD MODAL ============ */}
      {inspectionModal.isOpen && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in"
          onClick={() => !inspectionModal.submitting && setInspectionModal(prev => ({ ...prev, isOpen: false }))}
        >
          <div
            className="relative w-full max-w-lg bg-gradient-to-br from-[#0d0f1e] to-[#0a0c1a] border border-indigo-500/30 rounded-3xl shadow-2xl shadow-indigo-950/50 overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-indigo-900/80 to-purple-900/80 px-6 pt-6 pb-5 border-b border-indigo-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-2xl border border-indigo-400/30 shadow-lg flex-shrink-0">
                  📸
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight leading-tight">Foto Inspeksi Penerimaan</h3>
                  <p className="text-xs text-indigo-300/80 mt-0.5 leading-relaxed">
                    Upload foto fisik perangkat lama yang Anda terima dari buyer sebagai bukti kondisi sebelum konfirmasi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !inspectionModal.submitting && setInspectionModal(prev => ({ ...prev, isOpen: false }))}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-all"
              >✕</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Upload Zone */}
              <div>
                <label
                  htmlFor="inspection-upload"
                  className={`flex flex-col items-center justify-center gap-2 w-full h-32 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${inspectionModal.uploading ? 'border-indigo-400/50 bg-indigo-500/10 cursor-wait' : 'border-indigo-500/40 hover:border-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10'}`}
                >
                  {inspectionModal.uploading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-indigo-400 font-bold">Mengupload foto...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl">📷</span>
                      <span className="text-xs font-bold text-indigo-300">Klik untuk Upload Foto Inspeksi</span>
                      <span className="text-[10px] text-slate-500">JPG, PNG, WEBP — Maks. 5MB per foto</span>
                    </>
                  )}
                  <input
                    id="inspection-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={inspectionModal.uploading || inspectionModal.submitting}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleInspectionUpload(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>

              {/* Photo Grid Preview */}
              {inspectionModal.images.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                    Foto Terupload ({inspectionModal.images.length}):
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {inspectionModal.images.map((img, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 shadow">
                        <img src={img} alt={`Inspeksi ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveInspectionPhoto(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          title="Hapus foto"
                        >✕</button>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {inspectionModal.images.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-amber-400 text-sm">⚠️</span>
                  <p className="text-[11px] text-amber-300 font-medium">Upload minimal 1 foto kondisi fisik perangkat yang diterima untuk melanjutkan konfirmasi.</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  disabled={inspectionModal.submitting}
                  onClick={() => setInspectionModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-5 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider flex-1 transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={inspectionModal.submitting || inspectionModal.uploading || inspectionModal.images.length === 0}
                  onClick={handleSubmitInspection}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black uppercase tracking-wider flex-1 shadow-lg shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {inspectionModal.submitting ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Memproses...</span></>
                  ) : (
                    <span>✅ Konfirmasi Terima ({inspectionModal.images.length} Foto)</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal for Sellers */}
      <OrderDetailModal
        isOpen={orderDetailModal.isOpen}
        order={orderDetailModal.order}
        onClose={() => setOrderDetailModal({ isOpen: false, order: null })}
        onOpenTracking={(ord) => setSellerTrackingModal({ isOpen: true, tradeIn: null, order: ord })}
      />
    </AuthGuard>
  );
}
