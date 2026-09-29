import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

// Verifikasi signature dari notifikasi Midtrans
function verifySignature(orderId, statusCode, grossAmount, serverKey) {
  const hash = crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest('hex');
  return hash;
}

export async function POST(request) {
  const body = await request.json();
  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
    fraud_status,
    payment_type,
  } = body;

  // Verifikasi signature Midtrans
  const expectedSignature = verifySignature(
    order_id,
    status_code,
    gross_amount,
    process.env.MIDTRANS_SERVER_KEY
  );

  if (expectedSignature !== signature_key) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const supabase = createAdminClient();

  // Tentukan status order berdasarkan transaction_status Midtrans
  let orderStatus = null;
  let paymentStatus = null;
  let isSettled = false;
  let isFailed = false;

  if (transaction_status === 'capture') {
    if (fraud_status === 'challenge') {
      orderStatus = 'Pending Payment';
      paymentStatus = 'challenge';
    } else if (fraud_status === 'accept') {
      orderStatus = 'Processing';
      paymentStatus = 'paid';
      isSettled = true;
    }
  } else if (transaction_status === 'settlement') {
    orderStatus = 'Processing';
    paymentStatus = 'paid';
    isSettled = true;
  } else if (transaction_status === 'pending') {
    orderStatus = 'Pending Payment';
    paymentStatus = 'pending';
  } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
    orderStatus = 'Cancelled';
    paymentStatus = 'failed';
    isFailed = true;
  } else if (transaction_status === 'refund') {
    orderStatus = 'Refunded';
    paymentStatus = 'refunded';
  }

  if (!orderStatus) {
    return NextResponse.json({ message: 'Status not handled' }, { status: 200 });
  }

  // Ambil order — coba exact match dulu, lalu prefix fallback
  let { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, payment_status, order_items(device_id, quantity)')
    .eq('midtrans_order_id', order_id)
    .single();

  if (!order) {
    // Fallback: cari berdasarkan base prefix (sebelum -GP- atau -R)
    const baseId = order_id.split('-GP-')[0].split('-R')[0];
    console.log('[webhook] Exact match not found, trying prefix fallback for base:', baseId);
    const { data: orderByPrefix } = await supabase
      .from('orders')
      .select('id, buyer_id, payment_status, order_items(device_id, quantity)')
      .ilike('midtrans_order_id', `${baseId}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    order = orderByPrefix || null;
  }

  if (!order) {
    console.error('[webhook] Order not found for midtrans_order_id:', order_id);
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Hindari update ganda jika sudah paid
  if (order.payment_status === 'paid' && isSettled) {
    console.log('[webhook] Order already paid, skipping duplicate settlement.');
    return NextResponse.json({ message: 'Already settled' }, { status: 200 });
  }

  // Update status order di Supabase
  const { error } = await supabase
    .from('orders')
    .update({
      status: orderStatus,
      payment_status: paymentStatus,
      payment_method: payment_type || null,
      updated_at: new Date().toISOString(),
    })
    .eq('midtrans_order_id', order_id);

  if (error) {
    console.error('[webhook] Supabase update error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Jika settlement (GoPay/VA berhasil): kurangi stock dan hapus cart
  if (isSettled && order.order_items?.length) {
    console.log('[webhook] Settlement confirmed — deducting stock for order:', order.id);
    for (const item of order.order_items) {
      const { data: device } = await supabase
        .from('devices')
        .select('stock')
        .eq('id', item.device_id)
        .single();

      if (device) {
        const newStock = Math.max(0, device.stock - item.quantity);
        await supabase
          .from('devices')
          .update({ stock: newStock, updated_at: new Date().toISOString() })
          .eq('id', item.device_id);
      }
    }

    // Hapus cart items buyer berdasarkan device di order ini
    const deviceIds = order.order_items.map((i) => i.device_id);
    if (deviceIds.length) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('buyer_id', order.buyer_id)
        .in('device_id', deviceIds);
    }
  }

  // Jika gagal (cancel/deny/expire): jangan restore stock
  // karena stock belum pernah dikurangi (baru dikurangi saat paid)
  if (isFailed) {
    console.log('[webhook] Payment failed for order:', order.id, '— no stock to restore.');
  }

  return NextResponse.json({ message: 'OK' }, { status: 200 });
}
