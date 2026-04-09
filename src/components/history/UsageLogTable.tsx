'use client'

import { useState, useMemo } from 'react'
import { UsageLog } from '@/lib/types'
import Dropdown from '@/components/ui/Dropdown'
import DatePicker from '@/components/ui/DatePicker'

interface Props {
  logs: UsageLog[]
  items: { id: string; name: string; icon: string }[]
}

type Preset = 'today' | '7d' | '30d' | 'custom' | ''

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function UsageLogTable({ logs, items }: Props) {
  const [filterItem, setFilterItem] = useState('')
  const [preset, setPreset] = useState<Preset>('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  // Apply preset → derive from/to
  const effectiveFrom = useMemo(() => {
    const now = new Date()
    if (preset === 'today') return toDateStr(now)
    if (preset === '7d') { const d = new Date(now); d.setDate(d.getDate() - 6); return toDateStr(d) }
    if (preset === '30d') { const d = new Date(now); d.setDate(d.getDate() - 29); return toDateStr(d) }
    return filterFrom
  }, [preset, filterFrom])

  const effectiveTo = useMemo(() => {
    const now = new Date()
    if (preset === 'today' || preset === '7d' || preset === '30d') return toDateStr(now)
    return filterTo
  }, [preset, filterTo])

  const filtered = useMemo(() => logs.filter(log => {
    if (filterItem && log.item_id !== filterItem) return false
    if (effectiveFrom && new Date(log.used_at) < new Date(effectiveFrom)) return false
    if (effectiveTo && new Date(log.used_at) > new Date(effectiveTo + 'T23:59:59')) return false
    return true
  }), [logs, filterItem, effectiveFrom, effectiveTo])

  const totalUsed = filtered.reduce((sum, l) => sum + l.quantity_used, 0)
  const hasFilters = filterItem || preset || filterFrom || filterTo

  function clearFilters() {
    setFilterItem('')
    setPreset('')
    setFilterFrom('')
    setFilterTo('')
  }

  function setPresetAndClearCustom(p: Preset) {
    setPreset(p)
    if (p !== 'custom') {
      setFilterFrom('')
      setFilterTo('')
    }
  }

  function fmt(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const PRESETS: { label: string; value: Preset }[] = [
    { label: 'Today', value: 'today' },
    { label: '7 days', value: '7d' },
    { label: '30 days', value: '30d' },
    { label: 'Custom', value: 'custom' },
  ]

  return (
    <div>
      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl mb-4 shadow-card">
        {/* Row 1 — item + period presets */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-b border-slate-100">
          {/* Item filter */}
          <div className="flex items-center gap-2 min-w-0">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">Item</label>
            <Dropdown
              value={filterItem}
              onChange={setFilterItem}
              options={items.map(i => ({ value: i.id, label: i.name }))}
              placeholder="All items"
              size="sm"
            />
          </div>

          {/* Period presets */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">Period</label>
            <div className="flex gap-1">
              {PRESETS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPresetAndClearCustom(preset === p.value ? '' : p.value)}
                  className={`h-7 px-2.5 text-xs font-medium rounded-md border transition-all ${
                    preset === p.value
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="h-7 px-2.5 text-xs font-medium text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-md bg-white transition-colors"
            >
              Clear
            </button>
          )}

          <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
            <span><span className="font-semibold text-slate-800 tabular-nums">{filtered.length}</span> entries</span>
            <span className="text-slate-200">·</span>
            <span><span className="font-semibold text-red-600 tabular-nums">{totalUsed}</span> units</span>
          </div>
        </div>

        {/* Row 2 — always-visible date range */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-slate-50/50 border-b border-slate-100">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">Date range</label>
          <div className="flex items-center gap-2">
            <DatePicker
              value={filterFrom}
              onChange={val => { setFilterFrom(val); setPreset('custom') }}
              placeholder="Start date"
            />
            <span className="text-xs text-slate-400 shrink-0">→</span>
            <DatePicker
              value={filterTo}
              onChange={val => { setFilterTo(val); setPreset('custom') }}
              placeholder="End date"
            />
          </div>
          {(filterFrom || filterTo) && (
            <button
              onClick={() => { setFilterFrom(''); setFilterTo(''); if (preset === 'custom') setPreset('') }}
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
            >
              Clear dates
            </button>
          )}
          {!filterFrom && !filterTo && (
            <span className="text-xs text-slate-400 italic">Pick a date or range to narrow results</span>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80">
              <tr className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="px-4 py-2.5">Item</th>
                <th className="px-4 py-2.5">Deducted</th>
                <th className="px-4 py-2.5">Date & Time</th>
                <th className="px-4 py-2.5 hidden sm:table-cell">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-4 py-2.5 font-medium text-slate-900 text-sm">
                    {log.item
                      ? log.item.name
                      : <span className="text-slate-400 italic text-xs">Deleted item</span>
                    }
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-baseline gap-1">
                      <span className="font-bold text-red-600 tabular-nums">−{log.quantity_used}</span>
                      {log.item?.unit && (
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {log.item.unit}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap tabular-nums">
                    {fmt(log.used_at)}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs italic hidden sm:table-cell max-w-[220px] truncate">
                    {log.note || <span className="text-slate-300 not-italic">—</span>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-14 text-center">
                    <div className="flex justify-center mb-3 text-slate-200">
                      <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                      {hasFilters ? 'No records match your filters' : 'No usage history yet'}
                    </p>
                    {hasFilters && (
                      <button onClick={clearFilters} className="text-xs text-teal-700 hover:underline mt-1.5">
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
