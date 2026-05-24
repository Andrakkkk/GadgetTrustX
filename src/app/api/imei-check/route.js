import { NextResponse } from 'next/server';

// Luhn Algorithm to validate IMEI
function validateIMEI(imei) {
  if (!/^\d{15}$/.test(imei)) return false;

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let d = parseInt(imei[i]);
    if (i % 2 !== 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export async function POST(req) {
  try {
    const { imei } = await req.json();

    if (!imei || imei.length !== 15) {
      return NextResponse.json({ error: 'IMEI must be 15 digits' }, { status: 400 });
    }

    const isValid = validateIMEI(imei);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (!isValid) {
      return NextResponse.json({
        status: 'INVALID',
        message: 'IMEI failed mathematical validation (Luhn checksum error).'
      });
    }

    // Improved TAC (Type Allocation Code) mapping
    const tac = imei.substring(0, 8);
    let deviceData = {
      brand: 'Global Device',
      model: 'Android Smartphone',
      specs: 'Octa-core, 128GB/256GB'
    };

    // Mapping some common TAC patterns
    if (tac.startsWith('352')) {
      deviceData = { brand: 'Apple', model: 'iPhone 13 / 14 Series', specs: 'A-series Bionic Chip' };
    } else if (tac.startsWith('354')) {
      deviceData = { brand: 'Apple', model: 'iPhone 15 / 15 Pro', specs: 'A17 Pro / A16 Bionic' };
    } else if (tac.startsWith('358')) {
      deviceData = { brand: 'Samsung', model: 'Galaxy S Series (S23/S24)', specs: 'Snapdragon / Exynos' };
    } else if (tac.startsWith('86')) {
      deviceData = { brand: 'Xiaomi / Poco', model: 'Redmi & Mi Global', specs: 'HyperOS / MIUI' };
    } else if (tac.startsWith('351')) {
      deviceData = { brand: 'Oppo / Vivo', model: 'Global Reno / V Series', specs: 'ColorOS / Funtouch OS' };
    } else if (tac.startsWith('01')) {
      deviceData = { brand: 'Google Pixel', model: 'Pixel 7 / 8 Pro', specs: 'Google Tensor G3' };
    }

    return NextResponse.json({
      status: 'VERIFIED',
      imei: imei,
      device: deviceData,
      registration: {
        kemperin: 'Registered',
        status: 'Active',
        network: 'All Operators (ID)',
        warranty: 'Active until 2025-12-10'
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
