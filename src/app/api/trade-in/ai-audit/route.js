import { NextResponse } from 'next/server';
import { evaluateAIEscrowTradeIn } from '@/lib/gemini-ai';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req) {
  try {
    const { tradeInId, oldDeviceName = '', oldDeviceCondition = 'Good', oldDeviceStorage = '128GB', oldDeviceRam = '8GB', oldDeviceDescription = '' } = await req.json();

    if (!oldDeviceName) {
      return NextResponse.json({ error: 'Device name is required' }, { status: 400 });
    }

    const aiAudit = await evaluateAIEscrowTradeIn({
      oldDeviceName,
      oldDeviceCondition,
      oldDeviceStorage,
      oldDeviceRam,
      oldDeviceDescription
    });

    // Save to Supabase DB if tradeInId is provided
    if (tradeInId) {
      try {
        const admin = createAdminClient();
        await admin
          .from('trade_in_requests')
          .update({ old_device_description: aiAudit.auditSummary })
          .eq('id', tradeInId);
      } catch (err) {
        console.warn('Could not persist AI audit to trade_in_requests table:', err.message);
      }
    }

    return NextResponse.json({ aiAudit });
  } catch (error) {
    console.error('AI Escrow Audit API error:', error);
    return NextResponse.json({ error: error.message || 'AI Escrow Audit failed' }, { status: 500 });
  }
}
