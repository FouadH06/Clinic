import { createClient } from '@/lib/supabase-server'
import NavBar from '@/components/NavBar'
import SupplierList from '@/components/suppliers/SupplierList'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Suppliers',
  description: 'Manage dental supply vendors and their contact information.',
}

export const dynamic = 'force-dynamic'

export default async function SuppliersPage() {
  const supabase = await createClient()

  const [{ data: suppliers }, { data: items }, { data: restockLogs }] = await Promise.all([
    supabase
      .from('suppliers')
      .select('*, item_suppliers(item_id, item:items(id, name, icon, quantity, min_stock_threshold, unit, category))')
      .order('name'),
    supabase.from('items').select('id, name, icon, unit, category').order('name'),
    // Last restock + spend per supplier
    supabase
      .from('usage_log')
      .select('supplier_id, used_at, cost_per_unit, quantity_used')
      .eq('type', 'restock')
      .not('supplier_id', 'is', null)
      .order('used_at', { ascending: false })
      .limit(2000),
  ])

  // Aggregate per-supplier stats from restock logs
  const supplierStats: Record<string, { lastRestock: string; totalSpend: number }> = {}
  for (const log of restockLogs ?? []) {
    const sid = log.supplier_id as string
    if (!supplierStats[sid]) {
      supplierStats[sid] = { lastRestock: log.used_at, totalSpend: 0 }
    }
    // used_at is already desc so first seen = latest
    const spend = (log.cost_per_unit ?? 0) * (log.quantity_used ?? 0)
    supplierStats[sid].totalSpend += spend
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pt-[60px]">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 py-8 md:px-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Suppliers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your supply vendors</p>
        </div>
        <SupplierList
          initialSuppliers={(suppliers as any) ?? []}
          allItems={(items as any) ?? []}
          supplierStats={supplierStats}
        />
      </div>
    </div>
  )
}
