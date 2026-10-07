import { NextResponse } from 'next/server';
import { getSupabasePassword } from '@/lib/authPassword';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPublicClient } from '@/lib/supabase/public';
import { getRequestIp, verifyTurnstileToken } from '@/lib/verifyTurnstile';
import { validatePassword } from '@/utils/validation';

export async function POST(request) {
  try {
    const body = await request.json();
    const authorization = request.headers.get('authorization');
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Session reset password tidak valid.' }, { status: 401 });
    }

    const passVal = validatePassword(body.password, { isNew: true });
    if (!passVal.isValid) {
      return NextResponse.json({ error: passVal.error }, { status: 400 });
    }

    const password = body.password;

    const captchaResult = await verifyTurnstileToken(body.captchaToken, getRequestIp(request));
    if (!captchaResult.success) {
      return NextResponse.json({ error: captchaResult.error }, { status: 400 });
    }

    const publicClient = createPublicClient();
    const { data: userData, error: userError } = await publicClient.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Session reset password sudah kedaluwarsa.' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userData.user.id, {
      password: getSupabasePassword(password),
    });

    if (error) {
      return NextResponse.json({ error: error.message || 'Gagal memperbarui password.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diperbarui. Silakan masuk dengan password baru.',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Gagal memperbarui password.' }, { status: 500 });
  }
}
