import { createClient } from '@/lib/supabase-server'
import NavBar from '@/components/NavBar'
import SupplierList from '@/components/suppliers/SupplierList'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Suppliers – Teissir Dental Inventory',
  description: 'Manage dental supply vendors and their contact information.',
}

export const dynamic = 'force-dynamic'

export default async function SuppliersPage() {
  const supabase = await createClient()

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*, items(id, name, icon, quantity, min_stock_threshold)')
    .order('name')

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pt-[60px]">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 py-8 md:px-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Suppliers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your supply vendors</p>
        </div>
        <SupplierList initialSuppliers={(suppliers as any) ?? []} />
      </div>
    </div>
  )
}
