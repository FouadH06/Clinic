import { createClient } from '@/lib/supabase-server'
import NavBar from '@/components/NavBar'
import ItemGrid from '@/components/dashboard/ItemGrid'
import type { Item } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  description: 'Quickly log item usage and monitor stock levels in real time.',
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('items')
    .select('id, name, icon, quantity, min_stock_threshold, unit, category')
    .order('name')

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pt-[60px]">
      <NavBar />
      <ItemGrid initialItems={(items as Item[]) ?? []} />
    </div>
  )
}
