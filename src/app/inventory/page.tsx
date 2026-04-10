import { createClient } from '@/lib/supabase-server'
import NavBar from '@/components/NavBar'
import ItemTable from '@/components/inventory/ItemTable'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inventory – Teissir Dental Inventory',
  description: 'Manage all inventory items, edit stock levels, and import/export data.',
}

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const supabase = await createClient()

  // Try full join first; fall back if item_suppliers migration hasn't run yet
  let items: any[] = []
  const { data: fullItems } = await supabase
    .from('items')
    .select('*, item_suppliers(id, supplier_id, supplier:suppliers(id, name, phone, email, notes))')
    .order('name')

  if (fullItems) {
    items = fullItems
  } else {
    const { data: basicItems } = await supabase
      .from('items')
      .select('*, supplier:suppliers(id, name, phone, email, notes)')
      .order('name')
    items = (basicItems ?? []).map((i: any) => ({
      ...i,
      item_suppliers: i.supplier
        ? [{ id: 'legacy', item_id: i.id, supplier_id: i.supplier_id, supplier: i.supplier }]
        : [],
    }))
  }

  const [suppliersRes, categoriesRes, costLogsRes] = await Promise.all([
    supabase.from('suppliers').select('*').order('name'),
    // Managed categories table — falls back to empty array if migration not yet run
    supabase.from('categories').select('id, name').order('name'),
    supabase
      .from('usage_log')
      .select('item_id, cost_per_unit')
      .eq('type', 'restock')
      .not('cost_per_unit', 'is', null)
      .order('used_at', { ascending: false })
      .limit(1000),
  ])

  // Build map: item_id → latest cost per unit (logs are desc, first match = latest)
  const latestCostMap: Record<string, number> = {}
  for (const log of costLogsRes.data ?? []) {
    if (!latestCostMap[log.item_id] && log.cost_per_unit) {
      latestCostMap[log.item_id] = Number(log.cost_per_unit)
    }
  }

  // Total inventory value = sum(qty × latest cost) for priced items only
  const totalValue = (items ?? []).reduce((sum, item) => {
    const cost = latestCostMap[item.id] ?? 0
    return sum + item.quantity * cost
  }, 0)

  const itemsWithCost = (items ?? []).filter(i => latestCostMap[i.id])

  // If categories table doesn't exist yet, fall back to deriving from items
  const categories = categoriesRes.data ?? []

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
                Based on latest recorded unit costs ·{' '}
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
            latestCostMap={latestCostMap}
          />
        </Suspense>
      </div>
    </div>
  )
}
