import { createClient } from '@/lib/supabase-server'
import NavBar from '@/components/NavBar'
import ItemGrid from '@/components/dashboard/ItemGrid'
import type { Item } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard – Teissir Dental Inventory',
  description: 'Quickly log item usage and monitor stock levels in real time.',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('items')
    .select('*, supplier:suppliers(id, name, phone, email)')
    .order('name')

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pt-14">
      <NavBar />
      <ItemGrid initialItems={(items as Item[]) ?? []} />
    </div>
  )
}
