import { Item } from '@/lib/types'

interface Props {
  item: Item
  selected: boolean
  onClick: () => void
}

export default function ItemCard({ item, selected, onClick }: Props) {
  const isLow = item.quantity < item.min_stock_threshold
  const isZero = item.quantity === 0

  return (
    <button
      id={`item-card-${item.id}`}
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center gap-2
        w-full aspect-square rounded-2xl p-3 transition-all duration-150
        card-shadow font-medium select-none
        active:scale-95
        ${selected
          ? 'bg-teal-50 border-2 border-teal-500 card-shadow-hover ring-2 ring-teal-200'
          : isLow
            ? 'bg-white border-2 border-red-300 hover:border-red-400'
            : 'bg-white border-2 border-transparent hover:border-teal-200 hover:card-shadow-hover'
        }
      `}
    >
      {/* Low stock badge */}
      {isLow && (
        <span className="absolute top-2 right-2 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">
          {isZero ? 'OUT' : 'LOW'}
        </span>
      )}

      {/* Selected checkmark */}
      {selected && (
        <span className="absolute top-2 left-2 text-teal-600 text-sm leading-none">✓</span>
      )}

      {/* Icon */}
      <span className="text-3xl md:text-4xl leading-none">{item.icon}</span>

      {/* Name */}
      <span className={`text-xs md:text-sm text-center leading-tight font-semibold line-clamp-2 ${
        selected ? 'text-teal-700' : 'text-gray-800'
      }`}>
        {item.name}
      </span>

      {/* Quantity */}
      <span className={`text-lg md:text-xl font-bold leading-none ${
        isZero ? 'text-red-600' : isLow ? 'text-red-500' : 'text-teal-600'
      }`}>
        {item.quantity}
        <span className="text-xs font-normal text-gray-400 ml-0.5">{item.unit}</span>
      </span>
    </button>
  )
}
