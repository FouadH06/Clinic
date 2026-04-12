import { createClient } from '@/lib/supabase-server'
import NavBar from '@/components/NavBar'
import ItemTable from '@/components/inventory/ItemTable'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inventory',
  description: 'Manage all inventory items, edit stock levels, and import/export data.',
}

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const supabase = await createClient()

  // All queries in parallel — no sequential waterfalls
  const [itemsResult, suppliersRes, categoriesRes, lotsRes, unitsRes] = await Promise.all([
    // Items: try full join, fall back if item_suppliers migration hasn't run
    supabase
      .from('items')
      .select('*, item_suppliers(id, supplier_id, supplier:suppliers(id, name, phone, email, notes))')
      .order('name')
      .then(res => {
        if (res.data) return res.data
        // Fallback: shim legacy supplier into item_suppliers shape
        return supabase
          .from('items')
          .select('*, supplier:suppliers(id, name, phone, email, notes)')
          .order('name')
          .then(fallback => (fallback.data ?? []).map((i: any) => ({
            ...i,
            item_suppliers: i.supplier
              ? [{ id: 'legacy', item_id: i.id, supplier_id: i.supplier_id, supplier: i.supplier }]
              : [],
          })))
      }),
    supabase.from('suppliers').select('*').order('name'),
    supabase.from('categories').select('id, name').order('name'),
    // FIFO: fetch remaining lot value per item
    // quantity_remaining * cost_per_unit, grouped by item_id
    // Falls back gracefully if inventory_lots table doesn't exist yet.
    supabase
      .from('inventory_lots')
      .select('item_id, quantity_remaining, cost_per_unit')
      .gt('quantity_remaining', 0)
      .not('cost_per_unit', 'is', null)
      .gt('cost_per_unit', 0)
      .then(res => res.error ? { data: [] } : res),
    // Units: falls back gracefully if the table doesn't exist yet
    supabase
      .from('units')
      .select('id, name')
      .order('name')
      .then(res => res.error ? { data: [] } : res),
  ])

  const items = itemsResult as any[]

  // Build FIFO value map: item_id → sum(quantity_remaining * cost_per_unit)
  const fifoValueMap: Record<string, number> = {}
  for (const lot of (lotsRes as any).data ?? []) {
    const lotValue = Number(lot.quantity_remaining) * Number(lot.cost_per_unit)
    fifoValueMap[lot.item_id] = (fifoValueMap[lot.item_id] ?? 0) + lotValue
  }

  // Total inventory value = sum of FIFO values across all items
  const totalValue = Object.values(fifoValueMap).reduce((s, v) => s + v, 0)
  const itemsWithCost = (items ?? []).filter(i => fifoValueMap[i.id])

  // If categories table doesn't exist yet, fall back to deriving from items
  const categories = categoriesRes.data ?? []
  const units = (unitsRes as any).data ?? []

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pt-[60px]">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 md:px-6">

        {/* Page header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Inventory</h1>
            <p className="text-sm text-slate-500 mt-1">{items?.length ?? 0} items configured</p>
          </div>

          {/* Total Inventory Value KPI */}
          <div className="flex-shrink-0 bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-card flex items-center gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Inventory Value</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                FIFO costing
                {' · '}
                <span className="text-slate-500 font-medium">{itemsWithCost.length}/{items?.length ?? 0}</span> items priced
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <Suspense fallback={<div className="h-40 flex items-center justify-center text-sm text-slate-400">Loading…</div>}>
          <ItemTable
            initialItems={(items as any) ?? []}
            suppliers={suppliersRes.data ?? []}
            initialCategories={categories as any}
            initialUnits={units as any}
            fifoValueMap={fifoValueMap}
          />
        </Suspense>
      </div>
    </div>
  )
}
