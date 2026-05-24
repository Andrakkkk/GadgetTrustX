import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs
    .readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator), line.slice(separator + 1)];
    })
);

const email = env.ADMIN_SECRET_EMAIL;
const password = env.ADMIN_SECRET_PASSWORD;

if (!email || !password) {
  throw new Error('ADMIN_SECRET_EMAIL and ADMIN_SECRET_PASSWORD are required.');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (listError) throw listError;

let adminUser = usersData.users.find((user) => user.email === email);

if (!adminUser) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: 'Platform Admin',
      role: 'admin',
    },
  });

  if (error) throw error;
  adminUser = data.user;
} else {
  const { data, error } = await supabase.auth.admin.updateUserById(adminUser.id, {
    password,
    email_confirm: true,
    user_metadata: {
      ...adminUser.user_metadata,
      name: adminUser.user_metadata?.name || 'Platform Admin',
      role: 'admin',
    },
  });

  if (error) throw error;
  adminUser = data.user;
}

const { error: profileError } = await supabase.from('profiles').upsert({
  id: adminUser.id,
  email,
  name: 'Platform Admin',
  role: 'admin',
  is_verified: true,
}, { onConflict: 'id' });

if (profileError) throw profileError;

console.log(`Ensured admin account: ${email}`);
