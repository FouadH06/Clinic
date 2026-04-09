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

  const [{ data: items }, { data: suppliers }] = await Promise.all([
    supabase.from('items').select('*, supplier:suppliers(id, name, phone, email)').order('name'),
    supabase.from('suppliers').select('*').order('name'),
  ])

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pt-[60px]">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 md:px-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Inventory</h1>
            <p className="text-sm text-slate-500 mt-1">{items?.length ?? 0} items configured</p>
          </div>
        </div>
        <Suspense fallback={<div className="h-40 flex items-center justify-center text-sm text-slate-400">Loading…</div>}>
          <ItemTable
            initialItems={(items as any) ?? []}
            suppliers={suppliers ?? []}
          />
        </Suspense>
      </div>
    </div>
  )
}

