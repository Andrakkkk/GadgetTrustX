import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { device, brand, condition, storage } = await req.json();
    
    // Base prices for demonstration
    const basePrices = {
      'iPhone 15 Pro Max': 18000000,
      'iPhone 15 Pro': 16000000,
      'iPhone 15': 12000000,
      'iPhone 14 Pro Max': 14000000,
      'Samsung Galaxy S24 Ultra': 17000000,
      'Samsung Galaxy S23 Ultra': 13000000,
      'Google Pixel 8 Pro': 11000000,
    };

    // Find closest match or default
    let price = 5000000; // Default base
    Object.keys(basePrices).forEach(key => {
       if (device.toLowerCase().includes(key.toLowerCase())) {
          price = basePrices[key];
       }
    });

    // AI Logic: Multipliers
    const conditionMultipliers = {
      'Brand New': 1.1,
      'Like New': 1.0,
      'Excellent': 0.95,
      'Good': 0.85,
      'Fair': 0.70,
    };

    const storageMultipliers = {
      '128GB': 0.9,
      '256GB': 1.0,
      '512GB': 1.15,
      '1TB': 1.3,
    };

    price = price * (conditionMultipliers[condition] || 0.85);
    price = price * (storageMultipliers[storage] || 1.0);

    // Random AI jitter (±2%)
    const jitter = 0.98 + (Math.random() * 0.04);
    price = Math.round(price * jitter);

    // AI confidence score
    const confidence = 85 + Math.floor(Math.random() * 10);

    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return NextResponse.json({
      price,
      confidence,
      reasoning: `Berdasarkan analisis pasar terbaru untuk ${brand} ${device} dalam kondisi ${condition}, AI kami mendeteksi permintaan tinggi dengan tren harga stabil.`
    });
  } catch (error) {
    return NextResponse.json({ error: 'AI Valuation Failed' }, { status: 500 });
  }
}
