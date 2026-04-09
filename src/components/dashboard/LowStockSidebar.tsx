'use client'

import Link from 'next/link'
import { Item } from '@/lib/types'

interface Props {
  items: Item[]
}

export default function LowStockSidebar({ items }: Props) {
  const lowItems = items.filter(i => i.quantity < i.min_stock_threshold)
  if (lowItems.length === 0) return null

  const outCount = lowItems.filter(i => i.quantity === 0).length
  const lowCount = lowItems.length - outCount

  return (
    <Link
      href="/inventory?filter=low"
      className="group block w-full mb-2 rounded-xl border transition-colors hover:border-amber-300 overflow-hidden"
      style={{ borderColor: '#fde68a', background: '#fffbeb' }}
    >
      <div className="px-3 py-2.5 flex items-start gap-2.5">
        {/* Icon */}
        <div className="mt-0.5 shrink-0">
          <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-amber-800 leading-snug">
            {outCount > 0 && <span className="text-red-600">{outCount} out of stock</span>}
            {outCount > 0 && lowCount > 0 && <span className="text-amber-600"> · </span>}
            {lowCount > 0 && <span className="text-amber-700">{lowCount} low</span>}
          </p>
          <p className="text-[10px] text-amber-600 mt-0.5 group-hover:text-amber-800 transition-colors">
            Tap to view in inventory →
          </p>
        </div>
      </div>
    </Link>
  )
}
