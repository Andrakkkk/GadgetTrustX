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

export async function GET(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const admin = createAdminClient();
  let query = admin.from('trade_in_requests').select(tradeInSelect).order('created_at', { ascending: false });

  if (result.profile.role !== 'admin') {
    if (result.profile.role === 'seller') {
      query = query.eq('seller_id', result.profile.id);
    } else {
      query = query.eq('buyer_id', result.profile.id);
    }
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tradeIns: data || [] });
}

export async function POST(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const admin = createAdminClient();

  // Find target device & its seller
  const { data: targetDevice, error: deviceError } = await admin
    .from('devices')
    .select('id, seller_id, price, name')
    .eq('id', body.deviceId)
    .single();

  if (deviceError || !targetDevice) {
    return NextResponse.json({ error: 'Target device not found.' }, { status: 404 });
  }

  if (targetDevice.seller_id === result.profile.id) {
    return NextResponse.json({ error: 'Anda tidak dapat tukar tambah pada produk Anda sendiri.' }, { status: 400 });
  }

  const estimatedVal = Number(body.aiEstimatedValue) || 0;

  const { data: newTradeIn, error: createError } = await admin
    .from('trade_in_requests')
    .insert({
      device_id: targetDevice.id,
      buyer_id: result.profile.id,
      seller_id: targetDevice.seller_id,
      old_device_name: body.oldDeviceName,
      old_device_brand: body.oldDeviceBrand || 'Other',
      old_device_condition: body.oldDeviceCondition || 'Good',
      old_device_storage: body.oldDeviceStorage || '128GB',
      old_device_ram: body.oldDeviceRam || '8GB',
      old_device_battery_health: body.oldDeviceBatteryHealth ? Number(body.oldDeviceBatteryHealth) : null,
      old_device_accessories: body.oldDeviceAccessories || '',
      old_device_description: body.oldDeviceDescription || '',
      old_device_images: body.oldDeviceImages || [],
      ai_estimated_value: estimatedVal,
      final_trade_in_value: estimatedVal,
      status: 'pending'
    })
    .select(tradeInSelect)
    .single();

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  return NextResponse.json({ tradeIn: newTradeIn }, { status: 201 });
}
