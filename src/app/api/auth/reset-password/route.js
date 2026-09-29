import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';
import { getRequestIp, verifyTurnstileToken } from '@/lib/verifyTurnstile';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json({ error: 'Alamat email wajib diisi.' }, { status: 400 });
    }

    const captchaResult = await verifyTurnstileToken(body.captchaToken, getRequestIp(request));
    if (!captchaResult.success) {
      return NextResponse.json({ error: captchaResult.error }, { status: 400 });
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const supabase = createPublicClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    if (error) {
      console.warn('Password recovery request failed:', error.message);
    }

    return NextResponse.json({
      success: true,
      message: `Jika email ${email} terdaftar, link reset password resmi sudah dikirim. Periksa inbox atau spam Anda.`,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Gagal mengirim reset password.' }, { status: 500 });
  }
}
