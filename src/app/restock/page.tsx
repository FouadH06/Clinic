import { createClient } from '@/lib/supabase-server'
import NavBar from '@/components/NavBar'
import RestockTable from '@/components/restock/RestockTable'
import type { Item, UsageLog } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Restock – Teissir Dental Inventory',
  description: 'Plan and confirm refill orders for dental clinic supplies.',
}

export const dynamic = 'force-dynamic'

export default async function RestockPage() {
  const supabase = await createClient()

  // All queries in parallel — no sequential waterfalls
  const [itemsResult, { data: suppliers }, restockLogsResult] = await Promise.all([
    // Items: try full join, fall back if item_suppliers migration hasn't run
    supabase
      .from('items')
      .select('*, item_suppliers(id, supplier_id, supplier:suppliers(id, name, phone, email, notes))')
      .order('name')
      .then(res => {
        if (res.data) return res.data
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
    // Restock logs: try with supplier join, fall back if supplier_id column missing
    supabase
      .from('usage_log')
      .select('*, item:items(id, name, icon, unit), supplier:suppliers(id, name)')
      .eq('type', 'restock')
      .order('used_at', { ascending: false })
      .limit(200)
      .then(res => {
        if (!res.error) return res.data ?? []
        return supabase
          .from('usage_log')
          .select('*, item:items(id, name, icon, unit)')
          .order('used_at', { ascending: false })
          .limit(200)
          .then(fallback => fallback.data ?? [])
      }),
  ])

  const items = itemsResult as any[]
  const restockLogs = restockLogsResult as any[]

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pt-[60px]">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 md:px-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Restock</h1>
          <p className="text-sm text-slate-500 mt-1">Plan and confirm refill orders for your inventory</p>
        </div>
        <RestockTable
          initialItems={(items as Item[]) ?? []}
          suppliers={suppliers ?? []}
          restockLogs={(restockLogs as UsageLog[]) ?? []}
        />
      </div>
    </div>
  )
}
