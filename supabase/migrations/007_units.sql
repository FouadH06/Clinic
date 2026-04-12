-- ============================================================
-- Teissir Dental Clinic Inventory — Managed Units
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create the units table
create table if not exists units (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- 2. Populate from existing distinct unit values on items
--    Safe to run multiple times (ON CONFLICT DO NOTHING)
insert into units (name)
select distinct unit
from items
where unit is not null
  and trim(unit) <> ''
on conflict (name) do nothing;

-- 3. Row-level security
alter table units enable row level security;

drop policy if exists "Authenticated full access" on units;
create policy "Authenticated full access" on units
  for all using (auth.role() = 'authenticated');

-- 4. Index for fast name lookups
create index if not exists idx_units_name on units(name);
