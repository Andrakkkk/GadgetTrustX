import { NextResponse } from 'next/server';
import { estimateDevicePrice } from '@/lib/gemini-ai';
import { validatePriceCheckerInput } from '@/utils/validation';

export async function POST(req) {
  try {
    const body = await req.json();
    const validation = validatePriceCheckerInput({
      device: body.device || body.model || '',
      brand: body.brand,
      condition: body.condition,
      storage: body.storage,
      ram: body.ram,
    });

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { device, brand, condition, storage, ram } = validation.sanitized;
    const valuation = await estimateDevicePrice({
      device,
      brand,
      condition,
      storage,
      ram,
      category: body.category || 'Smartphone',
      ttlMs: body.ttlMs,
    });

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
