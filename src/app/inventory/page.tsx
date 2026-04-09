import { createClient } from '@/lib/supabase-server'
import NavBar from '@/components/NavBar'
import ItemTable from '@/components/inventory/ItemTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inventory – Teissir Dental Inventory',
  description: 'Manage all inventory items, edit stock levels, and import/export data.',
}

export default async function InventoryPage() {
  const supabase = await createClient()

  const [{ data: items }, { data: suppliers }] = await Promise.all([
    supabase.from('items').select('*, supplier:suppliers(id, name, phone, email)').order('name'),
    supabase.from('suppliers').select('*').order('name'),
  ])

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pt-14">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items?.length ?? 0} items total</p>
        </div>
        <ItemTable
          initialItems={(items as any) ?? []}
          suppliers={suppliers ?? []}
        />
      </div>
    </div>
  )
}
