import { Item, Supplier } from '@/lib/types'

interface Props {
  items: Item[]
}

export default function LowStockBanner({ items }: Props) {
  const lowItems = items.filter(i => i.quantity < i.min_stock_threshold)
  if (lowItems.length === 0) return null

  return (
    <div className="bg-amber-50/50 border-y border-amber-200/50 border-l-4 border-l-amber-500 px-4 py-2.5 md:px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center gap-3 md:gap-4 text-[13px]">
        <div className="font-semibold text-amber-900 shrink-0">
          Reorder required ({lowItems.length})
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {lowItems.map(item => (
            <div key={item.id} className="flex items-center gap-1.5 text-slate-700">
              <span className="font-bold text-amber-900">{item.name}</span>
              <span className="text-slate-500 text-xs font-medium">({item.quantity} left)</span>
              {item.supplier && (
                <span className="text-slate-400 text-xs flex items-center gap-1">
                  &middot; <span className="text-slate-600">{item.supplier.name}</span>
                  {item.supplier.phone && (
                    <a
                      href={`tel:${item.supplier.phone}`}
                      className="ml-0.5 text-teal-700 font-medium hover:underline flex items-center"
                    >
                      {item.supplier.phone}
                    </a>
                  )}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
