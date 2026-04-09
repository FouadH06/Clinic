'use client'

import Link from 'next/link'
import { Item } from '@/lib/types'

interface Props {
  items: Item[]
}

export default function LowStockAlert({ items }: Props) {
  const lowItems = items.filter(i => i.quantity < i.min_stock_threshold)
  if (lowItems.length === 0) return null

  const outCount = lowItems.filter(i => i.quantity === 0).length
  const label = outCount > 0
    ? `${outCount} out of stock, ${lowItems.length - outCount} low`
    : `${lowItems.length} item${lowItems.length !== 1 ? 's' : ''} below minimum`

  return (
    <div className="bg-amber-50 border-b border-amber-100 px-4 md:px-6 py-1.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <p className="text-xs text-amber-700">{label}</p>
        <Link
          href="/inventory?filter=low"
          className="text-xs font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-2 whitespace-nowrap transition-colors"
        >
          View →
        </Link>
      </div>
    </div>
  )
}
