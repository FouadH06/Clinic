'use client'

import { useState } from 'react'
import { Item, UsageEntry } from '@/lib/types'

interface Props {
  selectedItems: { item: Item; qty: number }[]
  onClear: () => void
  onSubmit: (entries: UsageEntry[], note: string) => void
  submitting: boolean
}

export default function BottomBar({ selectedItems, onClear, onSubmit, submitting }: Props) {
  const [note, setNote] = useState('')

  if (selectedItems.length === 0) return null

  const totalUnits = selectedItems.reduce((sum, { qty }) => sum + qty, 0)
  const allUnits = [...new Set(selectedItems.map(s => s.item.unit))]
  const unitLabel = allUnits.length === 1 ? allUnits[0] : 'units'

  function handleSubmit() {
    const entries: UsageEntry[] = selectedItems.map(({ item, qty }) => ({
      item_id: item.id,
      quantity_used: qty,
    }))
    onSubmit(entries, note)
    setNote('')
  }

  return (
    <div className="fixed bottom-[60px] md:bottom-0 left-0 right-0 z-30 animate-slide-up">
      <div className="bg-white/95 backdrop-blur border-t border-slate-200 shadow-bar px-4 py-3 md:px-6">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">

          {/* Summary chip */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center h-7 px-2.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold tabular-nums">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Note */}
          <input
            type="text"
            placeholder="Note (optional)…"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="flex-1 h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 placeholder-slate-400 bg-white min-w-0"
          />

          {/* Clear */}
          <button
            onClick={onClear}
            className="shrink-0 h-9 px-3 text-xs font-semibold text-slate-400 hover:text-red-500 border border-slate-200 rounded-lg transition-colors bg-white"
          >
            Clear
          </button>

          {/* CTA */}
          <button
            id="use-items-submit"
            onClick={handleSubmit}
            disabled={submitting || totalUnits === 0}
            className="shrink-0 h-9 px-5 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {submitting ? 'Processing…' : `Deduct ${totalUnits} ${unitLabel}`}
          </button>
        </div>
      </div>
    </div>
  )
}
