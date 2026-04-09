import { Item } from '@/lib/types'
import { getIcon } from '@/components/ui/icons'

interface Props {
  item: Item
  qty: number
  onAdd: () => void
  onRemove: () => void
}

export default function ItemCard({ item, qty, onAdd, onRemove }: Props) {
  const isLow  = item.quantity > 0 && item.quantity < item.min_stock_threshold
  const isZero = item.quantity === 0
  const isActive = qty > 0
  const atMax  = qty >= item.quantity
  const icon   = getIcon(item.icon)

  return (
    <div
      id={`item-card-${item.id}`}
      className={`
        relative flex flex-col items-center
        w-full rounded-xl px-3 pt-3.5 pb-3 select-none
        transition-all duration-150
        ${isZero
          ? 'bg-slate-50 border border-slate-200 opacity-40'
          : isActive
          ? 'bg-teal-50 border-2 border-teal-600 shadow-md'
          : 'bg-white border border-slate-200 shadow-card hover:shadow-card-hover hover:border-slate-300'
        }
      `}
    >
      {/* Low stock left accent */}
      {isLow && !isActive && (
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-amber-400" />
      )}

      {/* Icon */}
      <div className={`mb-1.5 ${isActive ? 'text-teal-500' : 'text-slate-300'}`}>
        {icon.render('w-8 h-8')}
      </div>

      {/* Name */}
      <p className={`text-[15px] font-bold leading-tight text-center line-clamp-2 w-full mb-1 ${
        isActive ? 'text-teal-900' : 'text-slate-900'
      }`}>
        {item.name}
      </p>

      {/* Stock info */}
      <div className="flex items-baseline gap-1 mb-3">
        <span className={`text-xs font-bold tabular-nums ${
          isZero   ? 'text-red-400'   :
          isLow    ? 'text-amber-500' :
          isActive ? 'text-teal-600'  :
          'text-slate-400'
        }`}>
          {item.quantity}
        </span>
        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
          {item.unit}
        </span>
      </div>

      {/* Inline stepper — always visible */}
      {isZero ? (
        <div className="w-full h-8 flex items-center justify-center">
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Out of stock</span>
        </div>
      ) : (
        <div className="flex items-center w-full gap-2">
          {/* Minus */}
          <button
            onClick={onRemove}
            disabled={qty === 0}
            className={`
              flex-1 h-8 flex items-center justify-center rounded-lg
              text-lg font-bold transition-all duration-100
              ${qty === 0
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 active:scale-95'
              }
            `}
            aria-label="Decrease"
          >
            −
          </button>

          {/* Quantity display */}
          <span className={`
            w-9 text-center text-[17px] font-extrabold tabular-nums shrink-0
            ${isActive ? 'text-teal-700' : 'text-slate-300'}
          `}>
            {qty}
          </span>

          {/* Plus */}
          <button
            onClick={onAdd}
            disabled={atMax}
            className={`
              flex-1 h-8 flex items-center justify-center rounded-lg
              text-lg font-bold transition-all duration-100
              ${atMax
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : isActive
                  ? 'bg-teal-600 text-white hover:bg-teal-700 active:scale-95 border border-teal-600'
                  : 'bg-slate-100 text-slate-500 hover:bg-teal-50 hover:text-teal-700 hover:border hover:border-teal-200 active:scale-95'
              }
            `}
            aria-label="Increase"
          >
            +
          </button>
        </div>
      )}
    </div>
  )
}
