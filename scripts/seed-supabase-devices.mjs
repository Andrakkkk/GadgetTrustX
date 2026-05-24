import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { dummyDevices } from '../src/data/dummyDevices.js';

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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const sellerEmails = [...new Set(dummyDevices.map((device) => device.seller?.id).filter(Boolean))];
const { data: sellerProfiles, error: sellerError } = await supabase
  .from('profiles')
  .select('id, email')
  .in('email', sellerEmails);

if (sellerError) {
  throw sellerError;
}

const sellerIds = new Map((sellerProfiles || []).map((profile) => [profile.email, profile.id]));

const payload = dummyDevices.map((device) => ({
  id: device.id,
  seller_id: sellerIds.get(device.seller?.id) ?? null,
  name: device.name,
  brand: device.brand,
  category: device.category,
  price: device.price,
  stock: device.stock,
  condition: device.condition ?? null,
  ram: device.ram,
  storage: device.storage,
  chipset: device.chipset,
  description: device.description ?? null,
  image: device.image,
  verified_by_trustx: device.verifiedByTrustX ?? false,
  is_trade_in: device.isTradeIn ?? false,
}));

const { error } = await supabase.from('devices').upsert(payload, { onConflict: 'id' });

if (error) {
  throw error;
}

console.log(`Seeded ${payload.length} devices into Supabase.`);
