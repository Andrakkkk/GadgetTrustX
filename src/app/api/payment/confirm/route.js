import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRequestUser } from '@/lib/supabase/auth';

// PATCH /api/payment/confirm
// Dipanggil oleh frontend setelah Midtrans onSuccess (paid) atau onPending (GoPay/VA).
export async function PATCH(request) {
  // Baca body DULU (stream hanya bisa dikonsumsi sekali)
  const body = await request.json();
  const { orderId, midtransResult, paymentFinalStatus, cartItemIds } = body;

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  // Verifikasi identitas user via Bearer token
  const result = await getRequestUser(request);
  if (result.error) {
    console.error('[confirm] Auth error:', result.error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  console.log('[confirm] Buyer:', result.profile.id, '| Order:', orderId, '| FinalStatus:', paymentFinalStatus);

  // Selalu gunakan admin client agar tidak terblokir RLS
  const admin = createAdminClient();

  // Ambil order untuk verifikasi kepemilikan
  const { data: order, error: fetchErr } = await admin
    .from('orders')
    .select('id, buyer_id, status, payment_status, order_items(device_id, quantity)')
    .eq('id', orderId)
    .single();

  if (fetchErr || !order) {
    console.error('[confirm] Order not found:', fetchErr?.message);
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.buyer_id !== result.profile.id) {
    console.error('[confirm] Ownership mismatch:', order.buyer_id, '!==', result.profile.id);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Jangan proses ulang jika sudah paid
  if (order.payment_status === 'paid') {
    console.log('[confirm] Order already paid, skipping.');
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Tentukan status baru:
  // 'paid'       → sudah settle (kartu kredit/onSuccess) → Processing + kurangi stock + hapus cart
  // 'processing' → menunggu settlement GoPay/VA (onPending) → tetap Pending Payment, tunggu webhook
  let newOrderStatus, newPaymentStatus;
  if (paymentFinalStatus === 'paid') {
    newOrderStatus = 'Processing';
    newPaymentStatus = 'paid';
  } else if (paymentFinalStatus === 'processing') {
    // GoPay / VA: pembayaran BELUM settle, tetap Pending Payment
    newOrderStatus = 'Pending Payment';
    newPaymentStatus = 'pending';
  } else {
    newOrderStatus = 'Pending Payment';
    newPaymentStatus = 'pending';
  }

  const updatePayload = {
    status: newOrderStatus,
    payment_status: newPaymentStatus,
    updated_at: new Date().toISOString(),
  };

  if (midtransResult?.payment_type) {
    updatePayload.payment_method = midtransResult.payment_type;
  }

  console.log('[confirm] Updating order with payload:', JSON.stringify(updatePayload));

  const { data: updated, error: updateErr } = await admin
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId)
    .select('id, status, payment_status, payment_method');

  if (updateErr) {
    console.error('[confirm] Update error:', JSON.stringify(updateErr));
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Hapus cart items dari keranjang pembeli agar keranjang bersih
  if (cartItemIds?.length) {
    await admin
      .from('cart_items')
      .delete()
      .in('id', cartItemIds)
      .eq('buyer_id', result.profile.id);
  } else if (order.order_items?.length) {
    const deviceIds = order.order_items.map((i) => i.device_id);
    if (deviceIds.length) {
      await admin
        .from('cart_items')
        .delete()
        .eq('buyer_id', result.profile.id)
        .in('device_id', deviceIds);
    }
  }

  // Hanya saat benar-benar PAID: kurangi stock
  if (paymentFinalStatus === 'paid') {
    console.log('[confirm] Payment paid — deducting stock.');

    // Kurangi stock per item order
    for (const item of order.order_items) {
      const { data: device } = await admin
        .from('devices')
        .select('stock')
        .eq('id', item.device_id)
        .single();

      if (device) {
        const newStock = Math.max(0, device.stock - item.quantity);
        await admin
          .from('devices')
          .update({ stock: newStock, updated_at: new Date().toISOString() })
          .eq('id', item.device_id);
      }
    }

    console.log('[confirm] Stock deducted.');
  }

  console.log('[confirm] Done:', JSON.stringify(updated));
  return NextResponse.json({ ok: true, order: updated?.[0] });
}
