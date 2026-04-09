-- ============================================================
-- Teissir Dental Clinic Inventory — Initial Schema Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension (enabled by default in Supabase)
create extension if not exists "pgcrypto";

-- ============================================================
-- SUPPLIERS
-- ============================================================
create table if not exists suppliers (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  phone text,
  email text,
  notes text
);

-- ============================================================
-- ITEMS
-- ============================================================
create table if not exists items (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  icon                text not null default '📦',
  quantity            int  not null default 0 check (quantity >= 0),
  min_stock_threshold int  not null default 5  check (min_stock_threshold >= 0),
  unit                text not null default 'units',
  category            text,
  supplier_id         uuid references suppliers(id) on delete set null,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- USAGE LOG
-- ============================================================
create table if not exists usage_log (
  id             uuid primary key default gen_random_uuid(),
  item_id        uuid references items(id) on delete set null,
  quantity_used  int  not null check (quantity_used > 0),
  used_at        timestamptz not null default now(),
  note           text
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table suppliers  enable row level security;
alter table items      enable row level security;
alter table usage_log  enable row level security;

-- Allow authenticated users full access
create policy "Authenticated full access" on suppliers
  for all using (auth.role() = 'authenticated');

create policy "Authenticated full access" on items
  for all using (auth.role() = 'authenticated');

create policy "Authenticated full access" on usage_log
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- REALTIME (enable for items table)
-- ============================================================
-- Run these in the Supabase dashboard if needed:
-- alter publication supabase_realtime add table items;

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_items_supplier_id     on items(supplier_id);
create index if not exists idx_usage_log_item_id     on usage_log(item_id);
create index if not exists idx_usage_log_used_at     on usage_log(used_at desc);
