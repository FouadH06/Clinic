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
  const allUnits   = [...new Set(selectedItems.map(s => s.item.unit))]
  const unitLabel  = allUnits.length === 1 ? allUnits[0] : 'units'

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
      {/* Thick teal accent line at top */}
      <div className="h-[3px] bg-teal-600" />

      <div className="bg-teal-800 shadow-2xl px-4 py-4 md:px-6">
        <div className="flex items-center gap-4 max-w-7xl mx-auto">

          {/* Summary — item count + total units */}
          <div className="shrink-0 flex flex-col items-start gap-0.5">
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/15 text-white text-sm font-bold tabular-nums">
              <svg className="w-3.5 h-3.5 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
            </span>
            <span className="text-[10px] text-teal-300 font-semibold pl-1 tabular-nums">
              {totalUnits} {unitLabel} total
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-10 bg-white/15 shrink-0" />

          {/* Note */}
          <input
            type="text"
            placeholder="Add a note (optional)…"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="flex-1 h-10 px-4 text-sm border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-900 placeholder-slate-400 bg-white/90 min-w-0"
          />

          {/* Clear */}
          <button
            onClick={onClear}
            className="shrink-0 h-10 px-4 text-sm font-semibold text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-lg transition-colors"
          >
            Clear
          </button>

          {/* CTA */}
          <button
            id="use-items-submit"
            onClick={handleSubmit}
            disabled={submitting || totalUnits === 0}
            className="shrink-0 h-10 px-6 bg-white hover:bg-teal-50 active:bg-slate-100 text-teal-800 font-bold text-sm rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin text-teal-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Processing…
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Deduct {totalUnits} {unitLabel}
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  )
}
