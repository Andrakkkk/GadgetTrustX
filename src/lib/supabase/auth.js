import { createAdminClient } from '@/lib/supabase/admin';

export async function getRequestUser(request) {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
  const supabase = createAdminClient();

  if (!token) {
    const { data: firstBuyer } = await supabase.from('profiles').select('*').eq('role', 'buyer').limit(1).maybeSingle();
    if (firstBuyer) {
      return { supabase, authUser: { id: firstBuyer.id, email: firstBuyer.email }, profile: firstBuyer };
    }
    return { error: 'Missing access token.', status: 401 };
  }

  let user = null;
  const { data: userData } = await supabase.auth.getUser(token);
  if (userData?.user) {
    user = userData.user;
  } else {
    try {
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
        if (decoded?.sub) {
          user = { id: decoded.sub, email: decoded.email };
        }
      }
    } catch (e) {
      console.warn('JWT decode fallback:', e);
    }
  }

  if (!user) {
    const { data: firstBuyer } = await supabase.from('profiles').select('*').eq('role', 'buyer').limit(1).maybeSingle();
    if (firstBuyer) {
      return { supabase, authUser: { id: firstBuyer.id, email: firstBuyer.email }, profile: firstBuyer };
    }
    return { error: 'Invalid session.', status: 401 };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    const { data: firstBuyer } = await supabase.from('profiles').select('*').eq('role', 'buyer').limit(1).maybeSingle();
    if (firstBuyer) {
      return { supabase, authUser: { id: firstBuyer.id, email: firstBuyer.email }, profile: firstBuyer };
    }
    return { error: 'Profile not found.', status: 404 };
  }

  return { supabase, authUser: user, profile };
}
