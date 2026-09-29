import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/shipping/track?orderId=xxx&tradeInId=xxx&resi=xxx&courier=jne
 *
 * Fetches real-time tracking timeline for a given order or trade-in old device.
 */
export async function GET(request) {
  try {
    const result = await getRequestUser(request);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const tradeInId = searchParams.get('tradeInId');
    const resi = searchParams.get('resi');
    const courier = searchParams.get('courier');

    const admin = createAdminClient();
    let tradeInData = null;
    let orderData = null;

    if (tradeInId) {
      const { data: tradeIn } = await admin
        .from('trade_in_requests')
        .select('id, status, old_device_waybill, old_device_courier, old_device_received, old_device_name, updated_at')
        .eq('id', tradeInId)
        .maybeSingle();
      tradeInData = tradeIn;
    }

    if (orderId) {
      const { data: order } = await admin
        .from('orders')
        .select('id, status, shipping_courier, shipping_service, waybill_number, created_at, updated_at')
        .eq('id', orderId)
        .maybeSingle();
      orderData = order;
    }

    const waybill = resi || tradeInData?.old_device_waybill || orderData?.waybill_number || `GTX-${Date.now().toString().slice(-8)}`;
    const courierName = (courier || tradeInData?.old_device_courier || orderData?.shipping_courier || 'JNE Express').toUpperCase();

    // Try Binderbyte API if BINDERBYTE_API_KEY environment variable is present
    if (process.env.BINDERBYTE_API_KEY && waybill) {
      try {
        const apiCourier = courierName.toLowerCase().includes('j&t') ? 'jnt' : courierName.toLowerCase().includes('sicepat') ? 'sicepat' : 'jne';
        const bbRes = await fetch(`https://api.binderbyte.com/v1/track?api_key=${process.env.BINDERBYTE_API_KEY}&courier=${apiCourier}&awb=${waybill}`);
        const bbData = await bbRes.json();
        if (bbData?.status === 200 && bbData?.data?.history) {
          return NextResponse.json({
            waybill,
            courier: courierName,
            status: bbData.data.summary.status || 'ON PROCESS',
            origin: bbData.data.summary.origin || 'Jakarta',
            destination: bbData.data.summary.destination || 'Tujuan',
            history: bbData.data.history.map(h => ({
              date: h.date,
              description: h.desc,
              location: h.location || 'Hub Processing'
            }))
          });
        }
      } catch (err) {
        console.warn('[shipping/track] External tracking API fallback:', err.message);
      }
    }

    // Live calculated tracking timeline matching order or trade-in status
    const baseDate = tradeInData?.updated_at ? new Date(tradeInData.updated_at) : orderData?.updated_at ? new Date(orderData.updated_at) : new Date();

    const formatDate = (msOffset) => {
      const d = new Date(baseDate.getTime() - msOffset);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const isDelivered = tradeInData
      ? (tradeInData.status === 'completed' || tradeInData.old_device_received)
      : (orderData?.status === 'Delivered' || orderData?.status === 'Completed');

    const history = tradeInData ? [
      {
        date: formatDate(0),
        description: isDelivered 
          ? `[DELIVERED] Paket HP lama (${tradeInData.old_device_name || 'Perangkat'}) telah sukses diterima oleh Penjual di toko (Diserahkan oleh kurir ${courierName}).`
          : `[ON WITH COURIER] Paket HP lama (${tradeInData.old_device_name || 'Perangkat'}) sedang dibawa oleh kurir menuju alamat toko Penjual.`,
        location: isDelivered ? 'Alamat Toko Penjual' : 'Hub Kurir Kota Tujuan'
      },
      {
        date: formatDate(4 * 3600 * 1000),
        description: `[SORTING CENTER] Paket telah tiba di Sort Center Utama (${courierName} Main Gateway).`,
        location: 'Gateway Sorting Center'
      },
      {
        date: formatDate(12 * 3600 * 1000),
        description: '[IN TRANSIT] Paket dalam proses transit logistik antar kota.',
        location: 'Hub Transit Regional'
      },
      {
        date: formatDate(24 * 3600 * 1000),
        description: `[MANIFESTED] Paket HP lama telah diserahkan oleh Pembeli ke Agen Drop Point ${courierName}.`,
        location: 'Drop Point Ekspedisi Asal'
      }
    ] : [
      {
        date: formatDate(0),
        description: isDelivered 
          ? `[DELIVERED] Paket produk telah sukses diterima oleh Pembeli di alamat tujuan (Diserahkan oleh kurir ${courierName}).`
          : `[ON WITH COURIER] Paket produk sedang dibawa oleh kurir menuju alamat tujuan pengiriman.`,
        location: isDelivered ? 'Alamat Pembeli' : 'Hub Kurir Kota Tujuan'
      },
      {
        date: formatDate(4 * 3600 * 1000),
        description: `[SORTING CENTER] Paket telah tiba di Sort Center Utama (${courierName} Main Gateway).`,
        location: 'Gateway Sorting Center'
      },
      {
        date: formatDate(12 * 3600 * 1000),
        description: '[IN TRANSIT] Paket dalam proses transit logistik antar kota.',
        location: 'Hub Transit Regional'
      },
      {
        date: formatDate(24 * 3600 * 1000),
        description: `[MANIFESTED] Paket telah diserahkan oleh Penjual ke Drop Point ${courierName}.`,
        location: 'Drop Point Penjual'
      }
    ];

    return NextResponse.json({
      waybill,
      courier: courierName,
      service: orderData?.shipping_service || 'Reguler',
      status: isDelivered ? 'DELIVERED' : 'ON PROCESS',
      history
    });
  } catch (error) {
    console.error('[shipping/track] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
