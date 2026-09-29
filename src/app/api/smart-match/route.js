import { NextResponse } from 'next/server';
import { evaluateSmartMatch } from '@/lib/gemini-ai';
import { dummyDevices } from '@/data/dummyDevices';

export async function POST(req) {
  try {
    const { preferences = {}, devices: inputDevices } = await req.json();

    let targetDevices = inputDevices;

    // If no devices provided, fetch from internal devices or fallback dummy
    if (!targetDevices || !Array.isArray(targetDevices) || targetDevices.length === 0) {
      targetDevices = dummyDevices;
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
