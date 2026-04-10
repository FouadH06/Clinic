/**
 * FIFO Lot Consumption Helper
 *
 * Called after every stock-deduction event to drain inventory_lots
 * from oldest to newest until `qty` is fully allocated.
 *
 * Rules:
 * - Consumes lots in ascending created_at order (oldest first = FIFO).
 * - Partially consumes a lot when the lot's remaining quantity exceeds
 *   the deduction remaining.
 * - If lots don't cover the full deduction (data inconsistency), logs a
 *   warning and stops — does NOT throw.
 * - Silently no-ops if the inventory_lots table does not exist yet.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function consumeFifoLots(
  supabase: any,
  itemId: string,
  qty: number
): Promise<void> {
  if (qty <= 0) return

  console.log(`[FIFO] consumeFifoLots START — item=${itemId}, deduct=${qty}`)

  // Fetch lots with remaining stock, oldest first
  const { data: lots, error } = await supabase
    .from('inventory_lots')
    .select('id, quantity_remaining, cost_per_unit, created_at')
    .eq('item_id', itemId)
    .gt('quantity_remaining', 0)
    .order('created_at', { ascending: true })

  if (error) {
    // Table may not exist yet — degrade gracefully
    console.warn('[FIFO] consumeFifoLots: fetch error', error.message, error.code)
    return
  }

  if (!lots || lots.length === 0) {
    console.warn(
      `[FIFO] consumeFifoLots: no lots with remaining stock found for item ${itemId}.`,
      `${qty} units cannot be allocated to any lot.`
    )
    return
  }

  console.log(`[FIFO] Found ${lots.length} lot(s) with remaining stock:`)
  for (const lot of lots) {
    console.log(`  └ lot=${lot.id}  remaining=${lot.quantity_remaining}  cost=${lot.cost_per_unit}  created=${lot.created_at}`)
  }

  let remaining = qty

  for (const lot of lots) {
    if (remaining <= 0) break

    const consume = Math.min(remaining, lot.quantity_remaining)
    const newRemaining = lot.quantity_remaining - consume

    console.log(`[FIFO] Consuming lot=${lot.id}: ${lot.quantity_remaining} → ${newRemaining} (consumed ${consume})`)

    const { data: updated, error: updateErr } = await supabase
      .from('inventory_lots')
      .update({ quantity_remaining: newRemaining })
      .eq('id', lot.id)
      .select('id, quantity_remaining')

    if (updateErr) {
      console.error(`[FIFO] UPDATE FAILED on lot ${lot.id}:`, updateErr.message, updateErr.code, updateErr.details)
      // Do NOT continue — if one lot update fails, stop to avoid partial corruption
      return
    }

    if (!updated || updated.length === 0) {
      console.error(`[FIFO] UPDATE returned no rows for lot ${lot.id} — row may not exist or RLS blocked it`)
      return
    }

    console.log(`[FIFO] UPDATE confirmed: lot=${updated[0].id} quantity_remaining=${updated[0].quantity_remaining}`)

    remaining -= consume
  }

  if (remaining > 0) {
    console.warn(
      `[FIFO] INCOMPLETE: ${remaining} of ${qty} units for item ${itemId} could not be allocated.`,
      'Lots exhausted before full deduction. Check for data inconsistency.'
    )
  } else {
    console.log(`[FIFO] consumeFifoLots COMPLETE — all ${qty} units allocated successfully.`)
  }

  // Post-deduction verification: re-fetch and log final state
  const { data: postLots } = await supabase
    .from('inventory_lots')
    .select('id, quantity_remaining, cost_per_unit')
    .eq('item_id', itemId)
    .gt('quantity_remaining', 0)
    .order('created_at', { ascending: true })

  if (postLots && postLots.length > 0) {
    let totalValue = 0
    let totalUnits = 0
    for (const lot of postLots) {
      const cost = Number(lot.cost_per_unit) || 0
      const val = lot.quantity_remaining * cost
      totalUnits += lot.quantity_remaining
      totalValue += val
      console.log(`[FIFO] Post-deduction lot=${lot.id}  remaining=${lot.quantity_remaining}  cost=${cost}  value=${val.toFixed(2)}`)
    }
    const avgCost = totalUnits > 0 ? totalValue / totalUnits : 0
    console.log(`[FIFO] Post-deduction FIFO summary: units=${totalUnits}  value=$${totalValue.toFixed(2)}  avgCost=$${avgCost.toFixed(4)}/unit`)
  } else {
    console.log('[FIFO] Post-deduction: no lots with remaining stock.')
  }
}
