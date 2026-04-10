import { createClient } from '@/lib/supabase-server'
import NavBar from '@/components/NavBar'
import AuditLogTable from '@/components/history/AuditLogTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'History – Teissir Dental Inventory',
  description: 'Full audit log of all inventory movements — restocks, usage, and adjustments.',
}

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const supabase = await createClient()

  const [logsRes, suppliersRes, itemsRes, categoriesRes] = await Promise.all([
    /**
     * Fetch usage_log with item + supplier joins.
     * item sub-select includes min_stock_threshold and quantity for low-stock filter.
     */
    supabase
      .from('usage_log')
      .select('*, item:items(id, name, icon, unit, category, min_stock_threshold, quantity), supplier:suppliers(id, name)')
      .order('used_at', { ascending: false })
      .limit(1000)
      .then(res =>
        res.error
          ? supabase
              .from('usage_log')
              .select('*, item:items(id, name, icon, unit, category, min_stock_threshold, quantity)')
              .order('used_at', { ascending: false })
              .limit(1000)
          : res
      ),
    supabase.from('suppliers').select('id, name').order('name'),
    supabase.from('items').select('id, name, category, min_stock_threshold, quantity').order('name'),
    // Managed categories — falls back gracefully if table not yet created
    supabase.from('categories').select('id, name').order('name'),
  ])

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pt-[60px]">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 md:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Inventory History</h1>
            <p className="text-sm text-slate-500 mt-1">Full audit log of all stock movements</p>
          </div>
        </div>
        <AuditLogTable
          logs={(logsRes.data as any) ?? []}
          suppliers={(suppliersRes.data as any) ?? []}
          items={(itemsRes.data as any) ?? []}
          categories={(categoriesRes.data as any) ?? []}
        />
      </div>
    </div>
  )
}
