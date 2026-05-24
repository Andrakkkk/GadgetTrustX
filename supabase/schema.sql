create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  role text not null check (role in ('buyer', 'seller', 'admin')),
  phone text,
  address text,
  bio text,
  store_name text,
  avatar text,
  badges text[] not null default '{}',
  is_verified boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'buyer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.devices (
  id text primary key,
  seller_id uuid references public.profiles(id) on delete set null,
  name text not null,
  brand text not null,
  category text not null,
  price integer not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  condition text,
  ram text,
  storage text,
  chipset text,
  description text,
  image text,
  verified_by_trustx boolean not null default false,
  is_trade_in boolean not null default false,
  is_custom_offer boolean not null default false,
  offer_buyer_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  device_id text references public.devices(id) on delete cascade,
  seller_id uuid references public.profiles(id) on delete cascade,
  buyer_id uuid references public.profiles(id) on delete set null,
  buyer_name text,
  rating integer not null check (rating between 1 and 5),
  comment text,
  image text,
  created_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  device_id text not null references public.devices(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (buyer_id, device_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'Pending',
  total integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reviews
  add column if not exists order_id uuid references public.orders(id) on delete set null;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  device_id text references public.devices(id) on delete set null,
  seller_id uuid references public.profiles(id) on delete set null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  return_status text,
  return_reason text,
  return_image text,
  return_date timestamptz
);

alter table public.reviews
  add column if not exists order_item_id uuid references public.order_items(id) on delete set null;

create table if not exists public.wtb_listings (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  budget integer,
  created_at timestamptz not null default now()
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.profiles(id) on delete cascade,
  seller_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  body text,
  message_type text not null default 'text',
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.devices enable row level security;
alter table public.reviews enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.wtb_listings enable row level security;
alter table public.chats enable row level security;
alter table public.chat_messages enable row level security;

create policy "profiles are readable" on public.profiles
for select using (true);

create policy "users update own profile" on public.profiles
for update using (auth.uid() = id);

drop policy if exists "devices are readable" on public.devices;
create policy "devices are readable" on public.devices
for select using (not is_custom_offer);

create policy "offer participants read devices" on public.devices
for select using (
  is_custom_offer
  and (seller_id = auth.uid() or offer_buyer_id = auth.uid())
);

create policy "sellers manage own devices" on public.devices
for all using (seller_id = auth.uid()) with check (seller_id = auth.uid());

create policy "reviews are readable" on public.reviews
for select using (true);

create policy "buyers create own reviews" on public.reviews
for insert with check (buyer_id = auth.uid());

create policy "buyers manage own cart" on public.cart_items
for all using (buyer_id = auth.uid()) with check (buyer_id = auth.uid());

create policy "buyers read own orders" on public.orders
for select using (buyer_id = auth.uid());

create policy "buyers create own orders" on public.orders
for insert with check (buyer_id = auth.uid());

create policy "order participants read items" on public.order_items
for select using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.buyer_id = auth.uid()
  )
  or seller_id = auth.uid()
);

create policy "buyers manage own wtb" on public.wtb_listings
for all using (buyer_id = auth.uid()) with check (buyer_id = auth.uid());

create policy "chat participants read chats" on public.chats
for select using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "chat participants read messages" on public.chat_messages
for select using (
  exists (
    select 1
    from public.chats
    where chats.id = chat_messages.chat_id
      and (chats.buyer_id = auth.uid() or chats.seller_id = auth.uid())
  )
);

create policy "chat participants create messages" on public.chat_messages
for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.chats
    where chats.id = chat_messages.chat_id
      and (chats.buyer_id = auth.uid() or chats.seller_id = auth.uid())
  )
);

insert into storage.buckets (id, name, public)
values ('device-media', 'device-media', true)
on conflict (id) do nothing;

create policy "public device media read" on storage.objects
for select using (bucket_id = 'device-media');

create policy "authenticated device media upload" on storage.objects
for insert to authenticated
with check (bucket_id = 'device-media');
