-- ============================================================
-- Teissir Dental Clinic Inventory — Managed Categories
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create the categories table
create table if not exists categories (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- 2. Populate from existing distinct category values on items
--    Safe to run multiple times (ON CONFLICT DO NOTHING)
insert into categories (name)
select distinct category
from items
where category is not null
  and trim(category) <> ''
on conflict (name) do nothing;

-- 3. Row-level security
alter table categories enable row level security;

drop policy if exists "Authenticated full access" on categories;
create policy "Authenticated full access" on categories
  for all using (auth.role() = 'authenticated');

-- 4. Index for fast name lookups
create index if not exists idx_categories_name on categories(name);
