import { NextResponse } from 'next/server';
import { autoFillDeviceDetails } from '@/lib/gemini-ai';

export async function POST(req) {
  try {
    const { deviceName = '', category = 'smartphone' } = await req.json();

    if (!deviceName || !deviceName.trim()) {
      return NextResponse.json({ error: 'Nama perangkat wajib diisi untuk auto-fill AI.' }, { status: 400 });
    }

    const aiDetails = await autoFillDeviceDetails({ deviceName, category });
    return NextResponse.json({ success: true, data: aiDetails });
  } catch (error) {
    console.error('AI AutoFill Route Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghasilkan rincian AI' }, { status: 500 });
  }
}
