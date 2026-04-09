import { Item, Supplier } from '@/lib/types'

interface Props {
  items: Item[]
}

export default function LowStockBanner({ items }: Props) {
  const lowItems = items.filter(i => i.quantity < i.min_stock_threshold)
  if (lowItems.length === 0) return null

  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-3 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start gap-2">
          <span className="text-red-500 text-lg flex-shrink-0 mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-red-700 mb-1">
              {lowItems.length} item{lowItems.length !== 1 ? 's' : ''} low on stock — reorder needed
            </p>
            <div className="flex flex-wrap gap-2">
              {lowItems.map(item => (
                <div key={item.id} className="bg-white border border-red-200 rounded-lg px-3 py-1.5 text-xs">
                  <span className="font-semibold text-red-700">{item.icon} {item.name}</span>
                  <span className="text-gray-500 ml-1">({item.quantity} {item.unit} left)</span>
                  {item.supplier && (
                    <span className="text-gray-500 ml-1">
                      · {item.supplier.name}
                      {item.supplier.phone && (
                        <a
                          href={`tel:${item.supplier.phone}`}
                          className="ml-1 text-teal-600 font-medium hover:underline"
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
      </div>
    </div>
  )
}
