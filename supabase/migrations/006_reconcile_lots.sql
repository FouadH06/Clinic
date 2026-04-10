-- ============================================================
-- Migration 006: Reconcile FIFO Lot Balances
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================
-- 
-- WHY: The FIFO lot consumption logic was not wired in correctly
-- during the initial rollout, so historical usage deductions
-- reduced items.quantity but never reduced inventory_lots.quantity_remaining.
--
-- This script reconstructs correct FIFO lot balances by computing
-- total consumed = SUM(quantity_original) - items.quantity
-- and draining that amount from the oldest lots first.
--
-- Safe to run multiple times — it is idempotent.
-- ============================================================

DO $$
DECLARE
  item_row   RECORD;
  lot_row    RECORD;
  total_orig INTEGER;
  to_consume INTEGER;
  drain      INTEGER;
BEGIN
  FOR item_row IN SELECT id, quantity FROM items LOOP

    -- Total original units across all lots for this item
    SELECT COALESCE(SUM(quantity_original), 0)
      INTO total_orig
      FROM inventory_lots
     WHERE item_id = item_row.id;

    -- Skip items with no lots
    IF total_orig = 0 THEN
      CONTINUE;
    END IF;

    -- How many units should have been consumed historically?
    to_consume := total_orig - item_row.quantity;

    -- If current stock >= total original, no consumption needed — reset all lots to full
    IF to_consume <= 0 THEN
      UPDATE inventory_lots
         SET quantity_remaining = quantity_original
       WHERE item_id = item_row.id;
      CONTINUE;
    END IF;

    -- Drain lots from oldest to newest (FIFO)
    FOR lot_row IN
      SELECT id, quantity_original
        FROM inventory_lots
       WHERE item_id = item_row.id
       ORDER BY created_at ASC
    LOOP
      IF to_consume <= 0 THEN
        -- No more to drain — this lot keeps its full original quantity
        UPDATE inventory_lots
           SET quantity_remaining = quantity_original
         WHERE id = lot_row.id;
      ELSE
        drain := LEAST(to_consume, lot_row.quantity_original);
        UPDATE inventory_lots
           SET quantity_remaining = quantity_original - drain
         WHERE id = lot_row.id;
        to_consume := to_consume - drain;
      END IF;
    END LOOP;

  END LOOP;

  RAISE NOTICE 'FIFO lot reconciliation complete.';
END $$;
