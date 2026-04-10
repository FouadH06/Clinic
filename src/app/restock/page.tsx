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

  // Try with item_suppliers join; fall back if migration hasn't run yet
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

  const { data: suppliers } = await supabase.from('suppliers').select('*').order('name')

  // Try with supplier join on usage_log; fall back if supplier_id column missing
  let restockLogs: any[] = []
  const { data: fullLogs, error: logsErr } = await supabase
    .from('usage_log')
    .select('*, item:items(id, name, icon, unit), supplier:suppliers(id, name)')
    .eq('type', 'restock')
    .order('used_at', { ascending: false })
    .limit(200)

  if (!logsErr) {
    restockLogs = fullLogs ?? []
  } else {
    // Fallback: no supplier join, or type column doesn't exist
    const { data: basicLogs } = await supabase
      .from('usage_log')
      .select('*, item:items(id, name, icon, unit)')
      .order('used_at', { ascending: false })
      .limit(200)
    restockLogs = basicLogs ?? []
  }

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
