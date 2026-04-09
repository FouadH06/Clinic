import { createClient } from '@/lib/supabase-server'
import NavBar from '@/components/NavBar'
import SupplierList from '@/components/suppliers/SupplierList'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Suppliers – Teissir Dental Inventory',
  description: 'Manage dental supply vendors and their contact information.',
}

export default async function SuppliersPage() {
  const supabase = await createClient()

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*, items(id, name, icon)')
    .order('name')

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pt-14">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your supply vendors</p>
        </div>
        <SupplierList initialSuppliers={(suppliers as any) ?? []} />
      </div>
    </div>
  )
}
