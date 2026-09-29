import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRequestUser } from '@/lib/supabase/auth';

// DELETE /api/payment/cancel
// Dipanggil oleh frontend saat user menutup popup Midtrans tanpa menyelesaikan pembayaran.
// Hanya boleh cancel order yang masih berstatus Pending Payment dan payment_status pending.
export async function DELETE(request) {
  const body = await request.json();
  const { orderId } = body;

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const admin = createAdminClient();

  // Ambil order beserta item-itemnya
  const { data: order, error: fetchErr } = await admin
    .from('orders')
    .select('id, buyer_id, status, payment_status, order_items(device_id, quantity)')
    .eq('id', orderId)
    .single();

  if (fetchErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.buyer_id !== result.profile.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Hanya cancel jika belum dibayar
  if (order.payment_status === 'paid') {
    return NextResponse.json({ error: 'Order sudah dibayar, tidak bisa dibatalkan.' }, { status: 409 });
  }

  // Tandai order sebagai Cancelled
  const { error: cancelErr } = await admin
    .from('orders')
    .update({
      status: 'Cancelled',
      payment_status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (cancelErr) {
    console.error('[cancel] Update error:', cancelErr.message);
    return NextResponse.json({ error: cancelErr.message }, { status: 500 });
  }

  console.log('[cancel] Order cancelled:', orderId);
  return NextResponse.json({ ok: true });
}
