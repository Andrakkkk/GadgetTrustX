import { NextResponse } from 'next/server';
import { estimateDevicePrice } from '@/lib/gemini-ai';

export async function POST(req) {
  try {
    const { device = '', brand = '', condition = 'Good', storage = '128GB', ram = '8GB', category = 'Smartphone', ttlMs } = await req.json();

    if (!device && !brand) {
      return NextResponse.json({ error: 'Device or brand name is required' }, { status: 400 });
    }

    const valuation = await estimateDevicePrice({ device, brand, condition, storage, ram, category, ttlMs });

    return NextResponse.json({
      price: valuation.estimatedPrice,
      estimatedPrice: valuation.estimatedPrice,
      priceRange: valuation.priceRange,
      confidence: valuation.confidence,
      marketDemand: valuation.marketDemand,
      reasoning: valuation.reasoning
    });
  } catch (error) {
    console.error('AI Valuation route error:', error);
    return NextResponse.json({ error: 'AI Valuation Failed' }, { status: 500 });
  }
}
