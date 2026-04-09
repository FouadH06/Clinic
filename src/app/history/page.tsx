import { createClient } from '@/lib/supabase-server'
import NavBar from '@/components/NavBar'
import UsageLogTable from '@/components/history/UsageLogTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'History – Teissir Dental Inventory',
  description: 'Full usage log of all consumed dental supplies over time.',
}

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const supabase = await createClient()

  const [{ data: logs }, { data: items }] = await Promise.all([
    supabase
      .from('usage_log')
      .select('*, item:items(id, name, icon, unit)')
      .order('used_at', { ascending: false })
      .limit(500),
    supabase.from('items').select('id, name, icon').order('name'),
  ])

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pt-[60px]">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 py-8 md:px-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Usage History</h1>
          <p className="text-sm text-slate-500 mt-1">Complete log of all item usage</p>
        </div>
        <UsageLogTable
          logs={(logs as any) ?? []}
          items={(items as any) ?? []}
        />
      </div>
    </div>
  )
}
