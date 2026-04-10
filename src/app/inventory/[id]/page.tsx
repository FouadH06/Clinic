import { createClient } from '@/lib/supabase-server'
import NavBar from '@/components/NavBar'
import ItemDetailView from '@/components/inventory/ItemDetailView'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

/**
 * Cached item fetcher — React.cache deduplicates within a single request,
 * so generateMetadata and the page body share the same DB round-trip.
 */
const getItem = cache(async (id: string) => {
  const supabase = await createClient()
  const { data: fullItem } = await supabase
    .from('items')
    .select('*, item_suppliers(id, supplier_id, supplier:suppliers(id, name, phone, email, notes))')
    .eq('id', id)
    .single()

  if (fullItem) return fullItem

  // Fallback: item_suppliers migration may not have run yet
  const { data: basicItem } = await supabase
    .from('items')
    .select('*, supplier:suppliers(id, name, phone, email, notes)')
    .eq('id', id)
    .single()

  if (!basicItem) return null

  return {
    ...basicItem,
    item_suppliers: basicItem.supplier
      ? [{ id: 'legacy', item_id: id, supplier_id: basicItem.supplier_id, supplier: basicItem.supplier }]
      : [],
  }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const item = await getItem(id)
  return {
    title: item ? `${item.name} – Teissir Dental Inventory` : 'Product Details',
    description: 'View product details, supplier assignments, and stock history.',
  }
}

export default async function ItemDetailPage({ params }: Props) {
  const { id } = await params
  const item = await getItem(id) as any
  if (!item) notFound()

  const supabase = await createClient()
  const [{ data: suppliers }, { data: logs }, { data: lots }] = await Promise.all([
    supabase.from('suppliers').select('*').order('name'),
    // Try with supplier join; silently fall back if supplier_id column missing
    supabase
      .from('usage_log')
      .select('*, supplier:suppliers(id, name)')
      .eq('item_id', id)
      .order('used_at', { ascending: false })
      .limit(200)
      .then(res => res.error
        ? supabase.from('usage_log').select('*').eq('item_id', id).order('used_at', { ascending: false }).limit(200)
        : res
      ),
    // FIFO lots for this item (graceful fallback if table missing)
    supabase
      .from('inventory_lots')
      .select('quantity_remaining, cost_per_unit')
      .eq('item_id', id)
      .gt('quantity_remaining', 0)
      .then(res => res.error ? { data: [] } : res),
  ])

  // Compute FIFO value and avg cost from active lots
  let fifoValue: number | null = null
  let fifoAvgCost: number | null = null
  if (lots && lots.length > 0) {
    const pricedLots = lots.filter(l => l.cost_per_unit && Number(l.cost_per_unit) > 0)
    if (pricedLots.length > 0) {
      fifoValue = pricedLots.reduce((s, l) => s + Number(l.quantity_remaining) * Number(l.cost_per_unit), 0)
      const totalQty = item.quantity
      fifoAvgCost = totalQty > 0 ? fifoValue / totalQty : null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pt-[60px]">
      <NavBar />
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 md:px-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/inventory"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Inventory
            </Link>
            <span className="text-slate-300 text-sm">/</span>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight truncate">{item.name}</h1>
            {item.quantity === 0 && (
              <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-red-700 bg-red-100 rounded border border-red-200">OUT</span>
            )}
            {item.quantity > 0 && item.quantity < item.min_stock_threshold && (
              <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 rounded border border-amber-200">LOW</span>
            )}
          </div>
        </div>

        <ItemDetailView
          item={item}
          allSuppliers={(suppliers as any) ?? []}
          initialLogs={(logs as any) ?? []}
          fifoValue={fifoValue}
          fifoAvgCost={fifoAvgCost}
        />
      </div>
    </div>
  )
}
