import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRequestUser } from '@/lib/supabase/auth';

const tradeInSelect = `
  id,
  order_id,
  device_id,
  buyer_id,
  seller_id,
  old_device_name,
  old_device_brand,
  old_device_condition,
  old_device_storage,
  old_device_ram,
  old_device_battery_health,
  old_device_accessories,
  old_device_description,
  old_device_images,
  ai_estimated_value,
  final_trade_in_value,
  status,
  rejection_reason,
  old_device_waybill,
  old_device_courier,
  old_device_received,
  inspection_images,
  created_at,
  updated_at,
  buyer:buyer_id (
    id,
    email,
    name
  ),
  seller:seller_id (
    id,
    email,
    name,
    store_name
  ),
  device:device_id (
    id,
    name,
    price,
    image,
    brand
  )
`;

export async function GET(request, { params }) {
  const { id } = await params;
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('trade_in_requests')
    .select(tradeInSelect)
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Trade-in request not found.' }, { status: 404 });
  }

  if (
    result.profile.role !== 'admin' &&
    data.buyer_id !== result.profile.id &&
    data.seller_id !== result.profile.id
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ tradeIn: data });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const admin = createAdminClient();

  const { data: existing, error: fetchErr } = await admin
    .from('trade_in_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Trade-in request not found.' }, { status: 404 });
  }

  const isSellerOrAdmin = result.profile.role === 'admin' || existing.seller_id === result.profile.id;
  const isBuyerOrAdmin = result.profile.role === 'admin' || existing.buyer_id === result.profile.id;

  let updateFields = { updated_at: new Date().toISOString() };

  if (body.action === 'approve') {
    if (!isSellerOrAdmin) return NextResponse.json({ error: 'Only seller can approve trade-in.' }, { status: 403 });
    updateFields.status = 'approved';
    if (body.finalValue) updateFields.final_trade_in_value = Number(body.finalValue);
  } else if (body.action === 'counter_offer') {
    if (!isSellerOrAdmin) return NextResponse.json({ error: 'Only seller can counter offer.' }, { status: 403 });
    updateFields.status = 'countered';
    updateFields.final_trade_in_value = Number(body.counterPrice || 0);
    if (body.reason) updateFields.rejection_reason = body.reason;
  } else if (body.action === 'accept_counter') {
    if (!isBuyerOrAdmin) return NextResponse.json({ error: 'Only buyer can accept counter offer.' }, { status: 403 });
    updateFields.status = 'approved';
  } else if (body.action === 'reject') {
    if (!isSellerOrAdmin && !isBuyerOrAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    updateFields.status = 'rejected';
    updateFields.rejection_reason = body.reason || 'Ditolak';
  } else if (body.action === 'ship_old_device') {
    if (!isBuyerOrAdmin) return NextResponse.json({ error: 'Only buyer can input shipping waybill.' }, { status: 403 });
    if (existing.status !== 'approved') {
      return NextResponse.json({ error: 'Trade-in must be approved before shipping.' }, { status: 400 });
    }
    updateFields.status = 'shipping';
    updateFields.old_device_waybill = body.waybill;
    updateFields.old_device_courier = body.courier || 'JNE Express';
  } else if (body.action === 'confirm_received') {
    if (!isSellerOrAdmin) return NextResponse.json({ error: 'Only seller can confirm receiving old device.' }, { status: 403 });
    updateFields.status = 'completed';
    updateFields.old_device_received = true;
    if (Array.isArray(body.inspectionImages) && body.inspectionImages.length > 0) {
      updateFields.inspection_images = body.inspectionImages;
    }
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const { data: updated, error: updateErr } = await admin
    .from('trade_in_requests')
    .update(updateFields)
    .eq('id', id)
    .select(tradeInSelect)
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // If trade-in confirmed received, ensure linked order is marked ready for seller to ship new device
  if (body.action === 'confirm_received' && updated.order_id) {
    await admin
      .from('orders')
      .update({ status: 'Processing' })
      .eq('id', updated.order_id);
  }

  return NextResponse.json({ tradeIn: updated });
}
