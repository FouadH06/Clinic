-- ============================================================
-- Teissir Dental Clinic Inventory — Many-to-many item-supplier
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Junction table: one product can have many suppliers
create table if not exists item_suppliers (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references items(id) on delete cascade,
  supplier_id uuid not null references suppliers(id) on delete cascade,
  unique(item_id, supplier_id)
);

-- 2. Migrate existing single-supplier assignments into junction table
insert into item_suppliers (item_id, supplier_id)
select id, supplier_id
from items
where supplier_id is not null
on conflict do nothing;

-- 3. Add supplier_id to usage_log (tracks which supplier was used per restock)
alter table usage_log
  add column if not exists supplier_id uuid references suppliers(id) on delete set null;

-- 4. Row-level security for the new table
alter table item_suppliers enable row level security;

drop policy if exists "Authenticated full access" on item_suppliers;
create policy "Authenticated full access" on item_suppliers
  for all using (auth.role() = 'authenticated');

-- 5. Indexes for fast lookups
create index if not exists idx_item_suppliers_item_id     on item_suppliers(item_id);
create index if not exists idx_item_suppliers_supplier_id on item_suppliers(supplier_id);
create index if not exists idx_usage_log_supplier_id      on usage_log(supplier_id);
