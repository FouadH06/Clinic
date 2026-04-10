'use client'

import { useState, useMemo, useCallback } from 'react'
import Dropdown from '@/components/ui/Dropdown'
import DatePicker from '@/components/ui/DatePicker'

// ─── Types ────────────────────────────────────────────────────────────────────
interface LogEntry {
  id: string
  item_id: string
  quantity_used: number
  type?: string | null
  cost_per_unit?: number | null
  supplier_id?: string | null
  used_at: string
  note?: string | null
  item?: {
    id: string
    name: string
    icon?: string
    unit?: string
    category?: string
    min_stock_threshold?: number
    quantity?: number
  } | null
  supplier?: { id: string; name: string } | null
}

interface Props {
  logs: LogEntry[]
  suppliers: { id: string; name: string }[]
  items: { id: string; name: string; category?: string | null; min_stock_threshold?: number; quantity?: number }[]
  /** Managed category list from the categories table */
  categories?: { id: string; name: string }[]
}

type Preset = 'today' | '7d' | '30d' | ''
type TypeFilter = '' | 'restock' | 'usage'
type DirectionFilter = '' | 'in' | 'out'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toDateStr(d: Date) { return d.toISOString().split('T')[0] }

function fmtDateTime(str: string) {
  return new Date(str).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtDate(str: string) {
  return new Date(str).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtMoney(n: number) {
  return `$${n.toFixed(2)}`
}

/**
 * The canonical source of truth for whether a log entry adds or removes stock.
 * - type === 'restock' (or any future positive type) → addition (+)
 * - type === 'usage'  (or null/undefined)            → removal  (−)
 *
 * The `quantity_used` field is ALWAYS stored as a positive integer in the DB.
 * The sign is derived from `type`, not from the stored value.
 */
function isAddition(log: LogEntry): boolean {
  if (!log.type || log.type === 'usage') return false
  return true // 'restock' or any other positive type
}

function getSign(log: LogEntry): '+' | '−' {
  return isAddition(log) ? '+' : '−'
}

function getTypeLabel(log: LogEntry): string {
  if (!log.type || log.type === 'usage') return 'Usage'
  if (log.type === 'restock') return 'Restock'
  return log.type.charAt(0).toUpperCase() + log.type.slice(1)
}

/**
 * Extract a clean user-written note from a log entry.
 * Restock notes stored by the app look like "Restocked +10 @ $0.50/unit = $5.00 total".
 * These are synthetic/generated notes — we render the structured fields instead,
 * so we suppress system-generated notes and only show genuine user notes.
 */
function getCleanNote(log: LogEntry): string | null {
  const raw = log.note?.trim()
  if (!raw) return null
  // Suppress auto-generated restock notes (they start with "Restocked ")
  if (isAddition(log) && /^Restocked\s/i.test(raw)) return null
  return raw
}

// ─── Export CSV ───────────────────────────────────────────────────────────────
function exportCSV(
  rows: LogEntry[],
  runningBalances: Record<string, number>,
  activePreset: string,
  filterFrom: string,
  filterTo: string
) {
  const headers = [
    'Date/Time', 'Item Name', 'Category', 'Movement Type',
    'Quantity Change', 'Unit', 'Supplier', 'Cost/Unit', 'Line Total',
    'Note', 'Balance After',
  ]
  const lines = rows.map(log => {
    const isIn = isAddition(log)
    const sign  = isIn ? '+' : '-'
    const cost  = Number(log.cost_per_unit ?? 0)
    const total = isIn && cost > 0 ? log.quantity_used * cost : 0
    const supplierName = (log.supplier as any)?.name ?? ''
    const cleanNote = getCleanNote(log) ?? ''
    const balance   = runningBalances[log.id]
    return [
      fmtDateTime(log.used_at),
      log.item?.name ?? 'Deleted item',
      log.item?.category ?? '',
      getTypeLabel(log),
      `${sign}${log.quantity_used}`,
      log.item?.unit ?? '',
      supplierName,
      cost > 0 ? cost.toFixed(2) : '',
      total > 0 ? total.toFixed(2) : '',
      cleanNote,
      balance !== undefined ? String(balance) : '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  })

  const csv = [headers.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  const dateTag =
    filterFrom && filterTo  ? `${filterFrom}_${filterTo}`
    : filterFrom            ? `from-${filterFrom}`
    : filterTo              ? `to-${filterTo}`
    : activePreset === 'today' ? toDateStr(new Date())
    : activePreset === '7d'    ? 'last-7d'
    : activePreset === '30d'   ? 'last-30d'
    : 'all'
  a.href     = url
  a.download = `history-${dateTag}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Type badge ───────────────────────────────────────────────────────────────
function TypeBadge({ log }: { log: LogEntry }) {
  const isIn = isAddition(log)
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide ${
      isIn
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-slate-100 text-slate-600 border border-slate-200'
    }`}>
      {isIn ? '↑' : '↓'} {getTypeLabel(log)}
    </span>
  )
}

// ─── Movement quantity cell ────────────────────────────────────────────────────
function MovementQty({ log }: { log: LogEntry }) {
  const isIn = isAddition(log)
  const sign = getSign(log)
  return (
    <span className={`font-bold tabular-nums text-sm ${isIn ? 'text-emerald-600' : 'text-red-500'}`}>
      {sign}{log.quantity_used}
      {log.item?.unit && (
        <span className="text-[10px] font-medium text-slate-400 ml-0.5">{log.item.unit}</span>
      )}
    </span>
  )
}

// ─── Detail line ──────────────────────────────────────────────────────────────
function DetailText({ log }: { log: LogEntry }) {
  const isIn       = isAddition(log)
  const cost       = Number(log.cost_per_unit ?? 0)
  const total      = cost > 0 ? log.quantity_used * cost : 0
  const supplierName = (log.supplier as any)?.name as string | undefined
  const cleanNote  = getCleanNote(log)

  if (isIn) {
    // Restock — show structured pricing info; suppress auto-generated note
    return (
      <div className="text-xs leading-snug space-y-0.5">
        {supplierName && (
          <div className="font-medium text-slate-700">
            <span className="text-slate-400 font-normal">Supplier: </span>{supplierName}
          </div>
        )}
        {cost > 0 && (
          <div className="text-slate-500">
            {fmtMoney(cost)}/unit
            {total > 0 && (
              <span className="ml-2 font-medium text-slate-600">Total: {fmtMoney(total)}</span>
            )}
          </div>
        )}
        {cleanNote && (
          <div className="text-slate-400 italic">{cleanNote}</div>
        )}
        {!supplierName && cost === 0 && !cleanNote && (
          <span className="text-slate-300">—</span>
        )}
      </div>
    )
  }

  // Usage — show note if any
  return (
    <div className="text-xs text-slate-400 italic leading-snug">
      {cleanNote ?? '—'}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AuditLogTable({ logs, suppliers, items, categories: managedCategories = [] }: Props) {
  const [search, setSearch]                 = useState('')
  const [filterItem, setFilterItem]         = useState('')
  const [filterType, setFilterType]         = useState<TypeFilter>('')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterDir, setFilterDir]           = useState<DirectionFilter>('')
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [preset, setPreset]                 = useState<Preset>('')
  const [filterFrom, setFilterFrom]         = useState('')
  const [filterTo, setFilterTo]             = useState('')

  // Use managed categories if available; fall back to deriving from items
  const categories = useMemo(() =>
    managedCategories.length > 0
      ? managedCategories.map(c => c.name)
      : ([...new Set(items.map(i => i.category).filter(Boolean))] as string[]),
    [managedCategories, items])

  // Build a quick lookup: item_id → min_stock_threshold
  const itemThresholds = useMemo(() => {
    const map: Record<string, number> = {}
    for (const item of items) {
      if (item.min_stock_threshold !== undefined) map[item.id] = item.min_stock_threshold
    }
    return map
  }, [items])

  // Effective date range from preset or custom
  const effectiveFrom = useMemo(() => {
    const now = new Date()
    if (preset === 'today') return toDateStr(now)
    if (preset === '7d')    { const d = new Date(now); d.setDate(d.getDate() - 6);  return toDateStr(d) }
    if (preset === '30d')   { const d = new Date(now); d.setDate(d.getDate() - 29); return toDateStr(d) }
    return filterFrom
  }, [preset, filterFrom])

  const effectiveTo = useMemo(() => {
    const now = new Date()
    if (preset === 'today' || preset === '7d' || preset === '30d') return toDateStr(now)
    return filterTo
  }, [preset, filterTo])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return logs.filter(log => {
      // Text search on item name
      if (q && !log.item?.name.toLowerCase().includes(q)) return false
      // Specific item dropdown
      if (filterItem && log.item_id !== filterItem) return false
      // Movement type
      if (filterType && (log.type || 'usage') !== filterType) return false
      // Supplier — compare supplier id on the log's supplier join
      if (filterSupplier && (log.supplier as any)?.id !== filterSupplier) return false
      // Category
      if (filterCategory && log.item?.category !== filterCategory) return false
      // Direction
      if (filterDir === 'in'  && !isAddition(log)) return false
      if (filterDir === 'out' &&  isAddition(log)) return false
      // Low stock items only (item's min_stock_threshold stored in items prop)
      if (filterLowStock) {
        const threshold = itemThresholds[log.item_id] ?? log.item?.min_stock_threshold
        if (threshold === undefined) return false
        const qty = (log.item as any)?.quantity
        // Show entries where the item's current stock is below threshold
        if (qty === undefined || qty >= threshold) return false
      }
      // Date range
      if (effectiveFrom && new Date(log.used_at) < new Date(effectiveFrom)) return false
      if (effectiveTo   && new Date(log.used_at) > new Date(effectiveTo + 'T23:59:59')) return false
      return true
    })
  }, [logs, search, filterItem, filterType, filterSupplier, filterCategory, filterDir, filterLowStock, effectiveFrom, effectiveTo, itemThresholds])

  // Running balance per item (computed over ALL logs, displayed for filtered rows)
  const runningBalances = useMemo<Record<string, number>>(() => {
    const byItem: Record<string, LogEntry[]> = {}
    for (const log of [...logs].reverse()) {
      if (!log.item_id) continue
      if (!byItem[log.item_id]) byItem[log.item_id] = []
      byItem[log.item_id].push(log)
    }
    const balanceMap: Record<string, number> = {}
    for (const entries of Object.values(byItem)) {
      let running = 0
      for (const log of entries) {
        running += isAddition(log) ? log.quantity_used : -log.quantity_used
        balanceMap[log.id] = Math.max(0, running)
      }
    }
    return balanceMap
  }, [logs])

  // Summary stats over filtered set
  const stats = useMemo(() => {
    let addedQty = 0, removedQty = 0, addedValue = 0
    for (const log of filtered) {
      if (isAddition(log)) {
        addedQty   += log.quantity_used
        addedValue += log.quantity_used * Number(log.cost_per_unit ?? 0)
      } else {
        removedQty += log.quantity_used
      }
    }
    return { addedQty, removedQty, addedValue }
  }, [filtered])

  const hasFilters = !!(
    search || filterItem || filterType || filterSupplier ||
    filterCategory || filterDir || filterLowStock ||
    preset || filterFrom || filterTo
  )

  const clearFilters = useCallback(() => {
    setSearch(''); setFilterItem(''); setFilterType(''); setFilterSupplier('')
    setFilterCategory(''); setFilterDir(''); setFilterLowStock(false)
    setPreset(''); setFilterFrom(''); setFilterTo('')
  }, [])

  function setPresetClick(p: Preset) {
    setPreset(prev => prev === p ? '' : p)
    setFilterFrom(''); setFilterTo('')
  }

  const PRESETS: { label: string; value: Preset }[] = [
    { label: 'Today', value: 'today' },
    { label: '7D',    value: '7d'    },
    { label: '30D',   value: '30d'   },
  ]

  return (
    <div>
      {/* ── Filter panel ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-card mb-4 overflow-hidden">

        {/* Row 1: Search + stats + export */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          {/* Search input */}
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
            <input
              id="history-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by item name…"
              className="w-full h-8 pl-8 pr-8 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {/* Summary stats — always reflect the currently filtered set */}
          <div className="hidden sm:flex items-center gap-3 ml-2">
            <span className="text-xs text-slate-500">
              <span className="font-semibold text-slate-800 tabular-nums">{filtered.length}</span>
              <span className="text-slate-400"> / {logs.length}</span>
            </span>
            {stats.addedQty > 0 && (
              <>
                <span className="text-slate-200 text-xs">·</span>
                <span className="text-xs text-emerald-600 font-semibold tabular-nums">+{stats.addedQty} in</span>
              </>
            )}
            {stats.removedQty > 0 && (
              <>
                <span className="text-slate-200 text-xs">·</span>
                <span className="text-xs text-red-500 font-semibold tabular-nums">−{stats.removedQty} out</span>
              </>
            )}
            {stats.addedValue > 0 && (
              <>
                <span className="text-slate-200 text-xs">·</span>
                <span className="text-xs text-slate-500 tabular-nums">{fmtMoney(stats.addedValue)} spent</span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-2">
            {hasFilters && (
              <button
                id="history-clear-filters"
                onClick={clearFilters}
                className="h-7 px-2.5 text-xs font-medium text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-md bg-white transition-colors"
              >
                Clear filters
              </button>
            )}
            <button
              id="history-export-csv"
              onClick={() => exportCSV(filtered, runningBalances, preset, filterFrom, filterTo)}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-md bg-white transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Row 2: Dimension filters */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/30">
          {/* Item dropdown */}
          <Dropdown
            value={filterItem}
            onChange={setFilterItem}
            options={items.map(i => ({ value: i.id, label: i.name }))}
            placeholder="All items"
            size="sm"
          />
          {/* Category */}
          <Dropdown
            value={filterCategory}
            onChange={setFilterCategory}
            options={categories.map(c => ({ value: c, label: c }))}
            placeholder="All categories"
            size="sm"
          />
          {/* Supplier */}
          <Dropdown
            value={filterSupplier}
            onChange={setFilterSupplier}
            options={suppliers.map(s => ({ value: s.id, label: s.name }))}
            placeholder="All suppliers"
            size="sm"
          />

          <div className="w-px h-5 bg-slate-200 hidden sm:block" />

          {/* Movement type toggle */}
          <div className="flex items-center gap-1">
            {([['', 'All'], ['restock', 'Restock'], ['usage', 'Usage']] as const).map(([val, label]) => (
              <button
                key={val}
                id={`history-type-${val || 'all'}`}
                onClick={() => setFilterType(val as TypeFilter)}
                className={`h-7 px-2.5 text-xs font-medium rounded-md border transition-all ${
                  filterType === val
                    ? val === 'restock' ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : val === 'usage'   ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Divider: Type → Direction */}
          <div className="w-px h-4 bg-slate-200 hidden sm:block" />

          {/* Direction toggle — ↑ In and ↓ Out are independent toggles; both off = show all */}
          <div className="flex items-center gap-1">
            <button
              id="history-dir-in"
              onClick={() => setFilterDir(prev => prev === 'in' ? '' : 'in')}
              className={`h-7 px-2.5 text-xs font-medium rounded-md border transition-all ${
                filterDir === 'in'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              ↑ In
            </button>
            <button
              id="history-dir-out"
              onClick={() => setFilterDir(prev => prev === 'out' ? '' : 'out')}
              className={`h-7 px-2.5 text-xs font-medium rounded-md border transition-all ${
                filterDir === 'out'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              ↓ Out
            </button>
          </div>

          {/* Divider: Direction → Low stock */}
          <div className="w-px h-4 bg-slate-200 hidden sm:block" />

          {/* Low stock toggle */}
          <button
            id="history-filter-lowstock"
            onClick={() => setFilterLowStock(v => !v)}
            title="Show only items currently below minimum stock threshold"
            className={`h-7 px-2.5 text-xs font-medium rounded-md border transition-all ${
              filterLowStock
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            ⚠ Low stock
          </button>
        </div>

        {/* Row 3: Date filters */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
          {/* Quick presets */}
          <div className="flex items-center gap-1">
            {PRESETS.map(p => (
              <button
                key={p.value}
                id={`history-preset-${p.value}`}
                onClick={() => setPresetClick(p.value)}
                className={`h-7 px-2.5 text-xs font-medium rounded-md border transition-all ${
                  preset === p.value
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
            {/* All time — just clears the preset / date filters */}
            <button
              id="history-preset-all"
              onClick={() => { setPreset(''); setFilterFrom(''); setFilterTo('') }}
              className={`h-7 px-2.5 text-xs font-medium rounded-md border transition-all ${
                !preset && !filterFrom && !filterTo
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              All time
            </button>
          </div>

          <div className="w-px h-5 bg-slate-200 hidden sm:block" />

          {/* Custom date range */}
          <div className="flex items-center gap-2">
            <DatePicker
              value={filterFrom}
              onChange={v => { setFilterFrom(v); setPreset('') }}
              placeholder="From date"
            />
            <span className="text-xs text-slate-400">→</span>
            <DatePicker
              value={filterTo}
              onChange={v => { setFilterTo(v); setPreset('') }}
              placeholder="To date"
            />
            {(filterFrom || filterTo) && (
              <button
                onClick={() => { setFilterFrom(''); setFilterTo('') }}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Active date chip */}
          {effectiveFrom && (
            <span className="text-[10px] font-medium text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
              {effectiveFrom === effectiveTo
                ? fmtDate(effectiveFrom)
                : `${fmtDate(effectiveFrom)} → ${fmtDate(effectiveTo)}`}
            </span>
          )}
        </div>
      </div>

      {/* Mobile stats row — reactive to filtered set */}
      <div className="flex sm:hidden items-center gap-2 px-1 mb-3 text-xs">
        <span className="text-slate-500">
          <span className="font-semibold text-slate-800 tabular-nums">{filtered.length}</span>
          <span className="text-slate-400"> / {logs.length}</span>
        </span>
        {stats.addedQty   > 0 && <><span className="text-slate-300">·</span><span className="text-emerald-600 font-semibold">+{stats.addedQty} in</span></>}
        {stats.removedQty > 0 && <><span className="text-slate-300">·</span><span className="text-red-500 font-semibold">−{stats.removedQty} out</span></>}
        {stats.addedValue > 0 && <><span className="text-slate-300">·</span><span className="text-slate-500">{fmtMoney(stats.addedValue)} spent</span></>}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-4 py-3">Date / Time</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-center">Change</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((log, idx) => {
                const balance = runningBalances[log.id]
                const isIn    = isAddition(log)
                return (
                  <tr
                    key={log.id}
                    className={`hover:bg-slate-50/60 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/20'}`}
                  >
                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap tabular-nums">
                      {fmtDateTime(log.used_at)}
                    </td>

                    {/* Item */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 text-sm leading-tight">
                        {log.item?.name ?? <span className="text-slate-400 italic text-xs">Deleted item</span>}
                      </div>
                      {log.item?.category && (
                        <span className="text-[10px] text-slate-400">{log.item.category}</span>
                      )}
                    </td>

                    {/* Type badge */}
                    <td className="px-4 py-3 text-center">
                      <TypeBadge log={log} />
                    </td>

                    {/* Quantity change — sign ALWAYS matches type */}
                    <td className="px-4 py-3 text-center">
                      <MovementQty log={log} />
                    </td>

                    {/* Details: supplier + cost for restocks; note for usage */}
                    <td className="px-4 py-3 max-w-[260px]">
                      <DetailText log={log} />
                    </td>

                    {/* Running balance */}
                    <td className={`px-4 py-3 text-right tabular-nums text-xs font-semibold ${isIn ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {balance !== undefined
                        ? <span>{balance} <span className="text-slate-400 font-normal">{log.item?.unit}</span></span>
                        : <span className="text-slate-300">—</span>
                      }
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex justify-center mb-3 text-slate-200">
                      <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                      {hasFilters ? 'No records match your filters' : 'No history yet'}
                    </p>
                    {hasFilters && (
                      <button onClick={clearFilters} className="text-xs text-teal-700 hover:underline mt-1.5">
                        Clear all filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile card list ── */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl py-14 text-center shadow-card">
            <p className="text-sm font-medium text-slate-500">
              {hasFilters ? 'No records match your filters' : 'No history yet'}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-teal-700 hover:underline mt-1.5 block mx-auto">
                Clear all filters
              </button>
            )}
          </div>
        ) : filtered.map(log => {
          const isIn    = isAddition(log)
          const balance = runningBalances[log.id]
          return (
            <div
              key={log.id}
              className={`bg-white rounded-xl px-4 py-3 shadow-card border border-slate-200 ${
                isIn ? 'border-l-[3px] border-l-emerald-300' : 'border-l-[3px] border-l-red-200'
              }`}
            >
              {/* Top: item name + movement qty */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-900 text-sm leading-tight block truncate">
                    {log.item?.name ?? <span className="text-slate-400 italic">Deleted item</span>}
                  </span>
                  {log.item?.category && (
                    <span className="text-[10px] text-slate-400">{log.item.category}</span>
                  )}
                </div>
                <MovementQty log={log} />
              </div>

              {/* Middle: badge + timestamp */}
              <div className="flex items-center gap-2 mb-2">
                <TypeBadge log={log} />
                <span className="text-xs text-slate-400 tabular-nums">{fmtDateTime(log.used_at)}</span>
              </div>

              {/* Detail row: supplier / cost / note */}
              <DetailText log={log} />

              {/* Balance after */}
              {balance !== undefined && (
                <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400">
                  Balance after:{' '}
                  <span className={`font-semibold tabular-nums ${isIn ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {balance} {log.item?.unit}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer count */}
      {filtered.length > 0 && (
        <p className="text-center text-xs text-slate-400 mt-4 tabular-nums">
          Showing {filtered.length} of {logs.length} records
          {hasFilters && (
            <> · <button onClick={clearFilters} className="text-teal-700 hover:underline">clear filters</button></>
          )}
        </p>
      )}
    </div>
  )
}
