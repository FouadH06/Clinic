-- ============================================================
-- Migration 005: FIFO Inventory Lots
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Table ──────────────────────────────────────────────────────────────────────
create table if not exists inventory_lots (
  id                 uuid         primary key default gen_random_uuid(),
  item_id            uuid         not null references items(id) on delete cascade,
  restock_log_id     uuid         references usage_log(id) on delete set null,
  quantity_original  integer      not null check (quantity_original > 0),
  quantity_remaining integer      not null check (quantity_remaining >= 0),
  cost_per_unit      numeric(12, 4),
  created_at         timestamptz  not null default now()
);

-- ── Indexes ────────────────────────────────────────────────────────────────────
-- FIFO consumption always orders by created_at ASC per item
create index if not exists idx_inventory_lots_item_created
  on inventory_lots(item_id, created_at asc);

-- Fast lookup of remaining value per item
create index if not exists idx_inventory_lots_item_remaining
  on inventory_lots(item_id) where quantity_remaining > 0;

-- ── RLS ────────────────────────────────────────────────────────────────────────
alter table inventory_lots enable row level security;

create policy "Authenticated full access" on inventory_lots
  for all using (auth.role() = 'authenticated');

-- ── Data migration ─────────────────────────────────────────────────────────────
-- One lot per existing restock entry.
-- quantity_remaining = quantity_original (no retroactive FIFO consumption).
-- Lots with null item_id (orphaned logs) are skipped.
insert into inventory_lots (
  item_id,
  restock_log_id,
  quantity_original,
  quantity_remaining,
  cost_per_unit,
  created_at
)
select
  ul.item_id,
  ul.id,
  ul.quantity_used,
  ul.quantity_used,
  ul.cost_per_unit,   -- null for free restocks — that's fine, excluded from value
  ul.used_at
from usage_log ul
where ul.type = 'restock'
  and ul.item_id is not null
on conflict do nothing;
