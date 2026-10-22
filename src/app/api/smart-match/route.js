import { NextResponse } from 'next/server';
import { evaluateSmartMatch } from '@/lib/gemini-ai';
import { createAdminClient } from '@/lib/supabase/admin';
import { mapDeviceRow } from '@/lib/supabase/devices';
import { dummyDevices } from '@/data/dummyDevices';

export async function POST(req) {
  try {
    const { preferences = {}, devices: inputDevices } = await req.json();

    let targetDevices = inputDevices;

    // If no devices provided, fetch real devices from Supabase database first
    if (!targetDevices || !Array.isArray(targetDevices) || targetDevices.length === 0) {
      try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
          .from('devices')
          .select(`
            id,
            name,
            brand,
            category,
            price,
            stock,
            condition,
            ram,
            storage,
            battery_health,
            chipset,
            description,
            image,
            location,
            verified_by_trustx,
            is_trade_in,
            is_custom_offer,
            offer_buyer_id,
            profiles:seller_id (
              id,
              email,
              name,
              store_name,
              address,
              is_verified,
              badges
            )
          `)
          .eq('is_custom_offer', false)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          targetDevices = data.map(mapDeviceRow);
        } else {
          targetDevices = dummyDevices;
        }
      } catch (dbErr) {
        console.warn('Smart Match DB fetch fallback:', dbErr.message);
        targetDevices = dummyDevices;
      }
    }

    const matchedDevices = await evaluateSmartMatch({ preferences, devices: targetDevices });

    return NextResponse.json({
      success: true,
      matches: matchedDevices,
      totalMatched: matchedDevices.length
    });
  } catch (error) {
    console.error('Smart Match API route error:', error);
    return NextResponse.json({ error: 'Smart Match evaluation failed' }, { status: 500 });
  }
}
