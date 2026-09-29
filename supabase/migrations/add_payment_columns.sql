-- Migration: Add payment fields to orders table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ywlqttawpdhkujxuykeh/sql/new

alter table public.orders
  add column if not exists midtrans_order_id text unique,
  add column if not exists payment_status text not null default 'pending',
  add column if not exists payment_method text;

-- Update the orders status check to allow new statuses
-- (Supabase doesn't enforce check constraints by default in some versions, but let's be safe)
comment on column public.orders.status is 'Pending Payment, Processing, Shipped, Completed, Cancelled, Refunded';
comment on column public.orders.payment_status is 'pending, paid, failed, challenge, refunded';

-- Allow service role to update orders (for webhook)
-- This is already handled by createAdminClient() using the service role key
