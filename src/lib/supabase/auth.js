import { createAdminClient } from '@/lib/supabase/admin';

export async function getRequestUser(request) {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return { error: 'Missing access token.', status: 401 };
  }

  const supabase = createAdminClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { error: 'Invalid session.', status: 401 };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { error: 'Profile not found.', status: 404 };
  }

  return { supabase, authUser: user, profile };
}
