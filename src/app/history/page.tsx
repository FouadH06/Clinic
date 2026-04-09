import { createClient } from '@/lib/supabase-server'
import NavBar from '@/components/NavBar'
import UsageLogTable from '@/components/history/UsageLogTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'History – Teissir Dental Inventory',
  description: 'Full usage log of all consumed dental supplies over time.',
}

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
    <div className="min-h-screen bg-gray-50 pb-20 md:pt-14">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Usage History</h1>
          <p className="text-sm text-gray-500 mt-0.5">Complete log of all item usage</p>
        </div>
        <UsageLogTable
          logs={(logs as any) ?? []}
          items={(items as any) ?? []}
        />
      </div>
    </div>
  )
}
