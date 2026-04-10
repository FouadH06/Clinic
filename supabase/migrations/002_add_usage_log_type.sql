-- ============================================================
-- Teissir Dental Clinic Inventory — Add type column to usage_log
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Add type column to distinguish between 'usage' and 'restock'
alter table usage_log
  add column if not exists type text not null default 'usage';

-- Add cost_per_unit for restock entries (nullable, only used for restocks)
alter table usage_log
  add column if not exists cost_per_unit numeric(10,2);

-- Index for efficient querying of restock entries
create index if not exists idx_usage_log_type on usage_log(type);
