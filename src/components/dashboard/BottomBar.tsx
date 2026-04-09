'use client'

import { useState } from 'react'
import { Item, UsageEntry } from '@/lib/types'

interface SelectedItem {
  item: Item
  qty: number
}

interface Props {
  selectedItems: SelectedItem[]
  onQtyChange: (itemId: string, qty: number) => void
  onClear: () => void
  onSubmit: (entries: UsageEntry[], note: string) => void
  submitting: boolean
}

export default function BottomBar({ selectedItems, onQtyChange, onClear, onSubmit, submitting }: Props) {
  const [note, setNote] = useState('')

  if (selectedItems.length === 0) return null

  const totalUnits = selectedItems.reduce((sum, { qty }) => sum + qty, 0)

  function handleSubmit() {
    const entries: UsageEntry[] = selectedItems.map(({ item, qty }) => ({
      item_id: item.id,
      quantity_used: qty,
    }))
    onSubmit(entries, note)
    setNote('')
  }

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30 animate-slide-up">
      <div className="bg-white border-t-2 border-teal-100 shadow-2xl rounded-t-2xl max-h-72 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-3 md:px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={onClear}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
            >
              Clear all
            </button>
          </div>

          {/* Selected items */}
          <div className="space-y-2 mb-3">
            {selectedItems.map(({ item, qty }) => (
              <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <span className="flex-1 text-sm font-medium text-gray-800 truncate">{item.name}</span>

                {/* Qty controls */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onQtyChange(item.id, qty - 1)}
                    className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-700 font-bold text-lg flex items-center justify-center transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={qty}
                    onChange={e => onQtyChange(item.id, parseInt(e.target.value) || 0)}
                    min={1}
                    max={item.quantity}
                    className="w-12 h-8 text-center text-sm font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <button
                    onClick={() => onQtyChange(item.id, qty + 1)}
                    className="w-8 h-8 rounded-lg bg-teal-100 hover:bg-teal-200 active:bg-teal-300 text-teal-700 font-bold text-lg flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 w-12 text-right">{item.unit}</span>
              </div>
            ))}
          </div>

          {/* Note (optional) */}
          <input
            type="text"
            placeholder="Add a note (optional)…"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 mb-3 text-gray-700 placeholder-gray-400"
          />

          {/* Submit */}
          <button
            id="use-items-submit"
            onClick={handleSubmit}
            disabled={submitting || totalUnits === 0}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-base rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting
              ? 'Processing…'
              : `Use ${totalUnits} unit${totalUnits !== 1 ? 's' : ''} across ${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''}`
            }
          </button>
        </div>
      </div>
    </div>
  )
}
