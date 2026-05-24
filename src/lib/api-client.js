'use client';

import { createClient } from '@/lib/supabase/client';

export async function apiFetch(path, options = {}) {
  const supabase = createClient();
  let session = null;

  if (supabase) {
    ({
      data: { session },
    } = await supabase.auth.getSession());

    if (!session?.access_token) {
      const {
        data: { session: refreshedSession },
      } = await supabase.auth.refreshSession();
      session = refreshedSession;
    }
  }

  const headers = new Headers(options.headers || {});
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  return fetch(path, {
    ...options,
    headers,
  });
}
