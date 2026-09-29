import { NextResponse } from 'next/server';
import Midtrans from 'midtrans-client';
import { getRequestUser } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// Midtrans Core API client (bukan Snap) — ini yang bisa buat GoPay charge langsung
const core = new Midtrans.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

/**
 * POST /api/payment/gopay-qris
 * Body: { orderId }
 *
 * Membuat atau mengambil GoPay charge yang valid untuk orderId tersebut.
 * Mengembalikan { qrString, qrUrl, deeplinkUrl, actions, expireTime }
 */
export async function POST(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const { orderId } = body;
  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .select(`
      id,
      midtrans_order_id,
      status,
      payment_status,
      payment_method,
      total,
      shipping_fee,
      shipping_courier,
      shipping_service,
      trade_in_discount,
      buyer_id,
      order_items (
        id,
        quantity,
        unit_price,
        device_id,
        devices:device_id (
          id,
          name,
          brand
        )
      )
    `)
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.buyer_id !== result.profile.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (order.status !== 'Pending Payment') {
    return NextResponse.json({ error: 'Order is not pending payment.' }, { status: 400 });
  }

  // Coba ambil status transaksi yang sudah ada dulu
  if (order.midtrans_order_id) {
    try {
      const existingStatus = await core.transaction.status(order.midtrans_order_id);

      // Jika pending & punya QR/actions, kembalikan langsung tanpa buat charge baru
      if (
        existingStatus.transaction_status === 'pending' &&
        (existingStatus.actions?.length || existingStatus.qr_string)
      ) {
        return NextResponse.json(buildQrisResponse(existingStatus));
      }
      // Jika sudah expire/cancel/settlement → lanjut buat charge baru
    } catch (statusErr) {
      // 404 dari Midtrans = transaksi Snap (bukan Core GoPay) — lanjut buat GoPay charge
      console.warn('[gopay-qris] Could not fetch existing status:', statusErr?.message);
    }
  }

  // Buat GoPay charge baru.
  const baseMidtransId = order.midtrans_order_id
    ? order.midtrans_order_id.split('-R')[0].split('-GP-')[0]
    : `GTX-${order.id.slice(0, 8)}`;
  const gopayOrderId = `${baseMidtransId}-GP-${Date.now().toString().slice(-8)}`;

  // Simpan gopay_order_id ke DB supaya webhook bisa match exact
  await admin
    .from('orders')
    .update({ midtrans_order_id: gopayOrderId, updated_at: new Date().toISOString() })
    .eq('id', order.id);

  // Construct item details
  const itemDetails = (order.order_items || []).map((item) => ({
    id: item.device_id,
    price: item.unit_price,
    quantity: item.quantity,
    name: `${item.devices?.brand || ''} ${item.devices?.name || 'Device'}`.slice(0, 50),
  }));

  const shippingFee = Number(order.shipping_fee) || 0;
  if (shippingFee > 0) {
    itemDetails.push({
      id: 'SHIPPING-FEE',
      price: shippingFee,
      quantity: 1,
      name: `Ongkir (${order.shipping_courier || 'JNE'} - ${order.shipping_service || 'REG'})`.slice(0, 50),
    });
  }

  const tradeInDiscount = Number(order.trade_in_discount) || 0;
  if (tradeInDiscount > 0) {
    itemDetails.push({
      id: 'TRADE-IN-DISCOUNT',
      price: -tradeInDiscount,
      quantity: 1,
      name: 'Diskon Tukar Tambah',
    });
  }

  const calculatedTotal = itemDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const grossAmount = Math.max(calculatedTotal, 1);

  const parameter = {
    payment_type: 'gopay',
    transaction_details: {
      order_id: gopayOrderId,
      gross_amount: grossAmount,
    },
    gopay: {
      enable_callback: false,
    },
    customer_details: {
      first_name: result.profile.name || 'Buyer',
      email: result.profile.email,
      phone: result.profile.phone || '',
    },
    item_details: itemDetails,
  };

  try {
    const chargeResponse = await core.charge(parameter);
    return NextResponse.json(buildQrisResponse(chargeResponse));
  } catch (err) {
    console.error('[gopay-qris] Core API charge error:', err?.message, err?.ApiResponse);
    return NextResponse.json(
      { error: 'Gagal membuat GoPay charge: ' + (err.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

/**
 * Extract QR/deeplink info dari response Midtrans Core API GoPay
 */
function buildQrisResponse(data) {
  const qrAction = data.actions?.find((a) => a.name === 'generate-qr-code') ||
    data.actions?.find((a) => a.name === 'qr-code') ||
    data.actions?.find((a) => a.url?.includes('qr'));

  const deeplinkAction = data.actions?.find((a) => a.name === 'deeplink-redirect');

  const qrString = data.qr_string || qrAction?.url || null;

  // Convert qr_string ke URL gambar pakai QR Server API
  const qrImageUrl = qrString
    ? qrString.startsWith('http')
      ? qrString
      : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(qrString)}`
    : null;

  return {
    paymentType: data.payment_type,
    transactionStatus: data.transaction_status,
    transactionTime: data.transaction_time,
    qrString,
    qrImageUrl,
    deeplinkUrl: deeplinkAction?.url || data.deeplink_url || null,
    actions: data.actions || [],
    expireTime: data.expiry_time || data.transaction_time,
    midtransOrderId: data.order_id,
    grossAmount: data.gross_amount,
  };
}
