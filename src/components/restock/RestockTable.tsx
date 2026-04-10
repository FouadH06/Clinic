'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { Item, Supplier, UsageLog, ItemSupplierJoin } from '@/lib/types'
import { createClient } from '@/lib/supabase'
import Dropdown from '@/components/ui/Dropdown'
import DatePicker from '@/components/ui/DatePicker'

interface Props {
  initialItems: Item[]
  suppliers: Supplier[]
  restockLogs: UsageLog[]
}

// ─── Row state ────────────────────────────────────────────────────────────────
interface RowState {
  qty: number
  cost: number
  total: number
  lastEdited: 'cost' | 'total' | null
  supplierId: string
}

function initRows(items: Item[]): Record<string, RowState> {
  const result: Record<string, RowState> = {}
  for (const item of items) {
    const qty = item.quantity < item.min_stock_threshold
      ? Math.max(0, item.min_stock_threshold - item.quantity)
      : 0
    // Pre-select first assigned supplier if any
    const firstSupplier = (item.item_suppliers as ItemSupplierJoin[])?.[0]?.supplier_id ?? ''
    result[item.id] = { qty, cost: 0, total: 0, lastEdited: null, supplierId: firstSupplier }
  }
  return result
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onDismiss }: {
  message: string; type?: 'success' | 'error'; onDismiss: () => void
}) {
  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto animate-slide-up">
      <div className={`flex items-center gap-2.5 pl-4 pr-3 py-2.5 rounded-xl shadow-lg ${type === 'success' ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'}`}>
        {type === 'success'
          ? <svg className="w-4 h-4 shrink-0 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          : <svg className="w-4 h-4 shrink-0 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        }
        <span className="text-sm font-medium whitespace-nowrap">{message}</span>
        <button onClick={onDismiss} className="ml-1 opacity-70 hover:opacity-100 transition-opacity">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  )
}

// ─── Previous Orders helpers ──────────────────────────────────────────────────
interface RestockGroup {
  key: string
  date: string
  items: { item_name: string; supplier_name: string; quantity: number; cost_per_unit: number; line_total: number }[]
  total_cost: number
}

function groupRestockLogs(logs: UsageLog[]): RestockGroup[] {
  const groups = new Map<string, UsageLog[]>()
  for (const log of logs) {
    const d = new Date(log.used_at)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(log)
  }
  return Array.from(groups.entries()).map(([key, entries]) => {
    const items = entries.map(e => ({
      item_name: e.item?.name ?? 'Deleted item',
      supplier_name: (e.supplier as any)?.name ?? '—',
      quantity: e.quantity_used,
      cost_per_unit: Number(e.cost_per_unit ?? 0),
      line_total: e.quantity_used * Number(e.cost_per_unit ?? 0),
    }))
    return { key, date: entries[0].used_at, items, total_cost: items.reduce((s, i) => s + i.line_total, 0) }
  })
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Previous Orders Tab ──────────────────────────────────────────────────────
function PreviousOrdersTab({ logs, suppliers }: { logs: UsageLog[]; suppliers: Supplier[] }) {
  const [filterSupplier, setFilterSupplier] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const allGroups = useMemo(() => groupRestockLogs(logs), [logs])
  const filtered = useMemo(() =>
    allGroups.filter(g => {
      if (filterFrom && new Date(g.date) < new Date(filterFrom)) return false
      if (filterTo && new Date(g.date) > new Date(filterTo + 'T23:59:59')) return false
      return true
    }), [allGroups, filterFrom, filterTo])

  if (allGroups.length === 0) return (
    <div className="py-20 text-center">
      <div className="flex justify-center mb-4 text-slate-300">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-slate-600">No restock orders yet</p>
      <p className="text-xs text-slate-400 mt-1">Confirmed orders will appear here</p>
    </div>
  )

  return (
    <div>
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 mb-4 flex flex-wrap gap-x-3 gap-y-2 items-center shadow-card">
        <Dropdown value={filterSupplier} onChange={setFilterSupplier} options={suppliers.map(s => ({ value: s.id, label: s.name }))} placeholder="All suppliers" size="sm" />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">From</span>
          <DatePicker value={filterFrom} onChange={setFilterFrom} placeholder="Start date" />
          <span className="text-xs text-slate-400 shrink-0">→</span>
          <DatePicker value={filterTo} onChange={setFilterTo} placeholder="End date" />
        </div>
        {(filterSupplier || filterFrom || filterTo) && (
          <button onClick={() => { setFilterSupplier(''); setFilterFrom(''); setFilterTo('') }} className="h-7 px-2.5 text-xs font-medium text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-md bg-white transition-colors">Clear</button>
        )}
        <span className="ml-auto text-xs text-slate-400 tabular-nums font-medium">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-14 text-center text-sm text-slate-500">No orders match your filters</div>
        ) : (
          filtered.map((group, idx) => (
            <div key={group.key} className={`border-b border-slate-100 last:border-b-0 ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
              <button onClick={() => setExpandedKey(expandedKey === group.key ? null : group.key)} className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-slate-50 transition-colors">
                <svg className={`w-3 h-3 text-slate-400 shrink-0 transition-transform duration-150 ${expandedKey === group.key ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                <span className="text-xs font-medium text-slate-700 tabular-nums">{fmt(group.date)}</span>
                <span className="text-xs text-slate-400 hidden sm:inline">{group.items.length} item{group.items.length !== 1 ? 's' : ''}</span>
                <span className="ml-auto text-xs font-semibold text-slate-800 tabular-nums">{group.total_cost > 0 ? `$${group.total_cost.toFixed(2)}` : <span className="text-slate-400 font-normal">no cost</span>}</span>
              </button>
              {expandedKey === group.key && (
                <div className="border-t border-slate-100 bg-slate-50/50 animate-fade-in">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="px-4 py-2 text-left">Item</th>
                        <th className="px-4 py-2 text-left hidden sm:table-cell">Supplier</th>
                        <th className="px-4 py-2 text-right">Qty</th>
                        <th className="px-4 py-2 text-right hidden sm:table-cell">Cost/unit</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.items.map((item, i) => (
                        <tr key={i} className="text-slate-600">
                          <td className="px-4 py-2 font-medium text-slate-800">{item.item_name}</td>
                          <td className="px-4 py-2 text-slate-500 hidden sm:table-cell">{item.supplier_name}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-emerald-700 font-semibold">+{item.quantity}</td>
                          <td className="px-4 py-2 text-right tabular-nums hidden sm:table-cell">{item.cost_per_unit > 0 ? `$${item.cost_per_unit.toFixed(2)}` : '—'}</td>
                          <td className="px-4 py-2 text-right tabular-nums font-medium">{item.line_total > 0 ? `$${item.line_total.toFixed(2)}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Current Restock Tab ──────────────────────────────────────────────────────
function CurrentRestockTab({ items: initialItems, suppliers, onConfirmSuccess }: {
  items: Item[]; suppliers: Supplier[]; onConfirmSuccess: (newLogs: UsageLog[]) => void
}) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [rows, setRows] = useState<Record<string, RowState>>(() => initRows(initialItems))
  const [search, setSearch] = useState('')
  const [filterStock, setFilterStock] = useState<'' | 'low' | 'out'>('')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [sortBy, setSortBy] = useState<'deficit' | 'name'>('deficit')
  const [confirming, setConfirming] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const supabase = createClient()

  const categories = useMemo(() => [...new Set(items.map(i => i.category).filter(Boolean))] as string[], [items])

  const handleQtyChange = useCallback((id: string, raw: string) => {
    const qty = Math.max(0, parseInt(raw) || 0)
    setRows(prev => {
      const row = prev[id]
      if (row.lastEdited === 'total' && row.total > 0) {
        const cost = qty > 0 ? Math.round((row.total / qty) * 100) / 100 : 0
        return { ...prev, [id]: { ...row, qty, cost } }
      } else {
        const total = qty > 0 ? Math.round(qty * row.cost * 100) / 100 : 0
        return { ...prev, [id]: { ...row, qty, total } }
      }
    })
  }, [])

  const handleCostChange = useCallback((id: string, raw: string) => {
    const cost = Math.max(0, parseFloat(raw) || 0)
    setRows(prev => {
      const row = prev[id]
      const total = row.qty > 0 ? Math.round(row.qty * cost * 100) / 100 : 0
      return { ...prev, [id]: { ...row, cost, total, lastEdited: 'cost' } }
    })
  }, [])

  const handleTotalChange = useCallback((id: string, raw: string) => {
    const total = Math.max(0, parseFloat(raw) || 0)
    setRows(prev => {
      const row = prev[id]
      const cost = row.qty > 0 ? Math.round((total / row.qty) * 100) / 100 : 0
      return { ...prev, [id]: { ...row, total, cost, lastEdited: 'total' } }
    })
  }, [])

  const handleSupplierChange = useCallback((id: string, supplierId: string) => {
    setRows(prev => ({ ...prev, [id]: { ...prev[id], supplierId } }))
  }, [])

  const resetRow = useCallback((id: string) => {
    setRows(prev => ({ ...prev, [id]: { ...prev[id], qty: 0, cost: 0, total: 0, lastEdited: null } }))
  }, [])

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim()
    let result = items.filter(item => {
      if (q && !item.name.toLowerCase().includes(q)) return false
      if (filterCategory && item.category !== filterCategory) return false
      if (filterSupplier) {
        const assigned = (item.item_suppliers as ItemSupplierJoin[]) ?? []
        if (!assigned.some(is => is.supplier_id === filterSupplier)) return false
      }
      if (filterStock === 'low') return item.quantity > 0 && item.quantity < item.min_stock_threshold
      if (filterStock === 'out') return item.quantity === 0
      return true
    })
    if (sortBy === 'deficit') {
      result = [...result].sort((a, b) => {
        const aBelow = a.quantity < a.min_stock_threshold ? 1 : 0
        const bBelow = b.quantity < b.min_stock_threshold ? 1 : 0
        if (aBelow !== bBelow) return bBelow - aBelow
        if (aBelow && bBelow) return (b.min_stock_threshold - b.quantity) - (a.min_stock_threshold - a.quantity)
        return a.name.localeCompare(b.name)
      })
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    }
    return result
  }, [items, search, filterStock, filterSupplier, filterCategory, sortBy])

  const hasFilters = !!(search || filterCategory || filterSupplier || filterStock)

  const summary = useMemo(() => {
    let itemCount = 0, totalUnits = 0, grandTotal = 0
    for (const item of items) {
      const row = rows[item.id]
      if (!row || row.qty === 0) continue
      itemCount++; totalUnits += row.qty; grandTotal += row.total
    }
    return { itemCount, totalUnits, grandTotal }
  }, [items, rows])

  async function handleConfirm() {
    const toRestock = items.filter(i => (rows[i.id]?.qty ?? 0) > 0)
    if (toRestock.length === 0) return
    setConfirming(true)
    try {
      const now = new Date().toISOString()
      const newLogs: UsageLog[] = []
      await Promise.all(toRestock.map(async item => {
        const row = rows[item.id]
        // Sanitise — guarantee no NaN or negative values reach the DB
        const qty     = Math.max(0, Math.round(Number(row.qty)  || 0))
        const cost    = Math.max(0,            Number(row.cost) || 0)
        const total   = Math.max(0,            Number(row.total)|| 0)
        // Recompute total from cost×qty as the final source of truth
        // (handles cases where lastEdited state drifted out of sync)
        const finalCost  = cost  > 0 ? Math.round(cost  * 10000) / 10000 : null
        const finalTotal = finalCost && qty > 0 ? Math.round(qty * finalCost * 100) / 100
                         : total > 0            ? Math.round(total * 100) / 100
                         : null
        // Derive cost from total if cost was 0 but total was given
        const storedCost = finalCost ?? (finalTotal && qty > 0 ? Math.round((finalTotal / qty) * 10000) / 10000 : null)

        if (qty === 0) return  // safety guard

        const { data: updatedItem } = await supabase
          .from('items').update({ quantity: item.quantity + qty }).eq('id', item.id)
          .select('*, item_suppliers(id, supplier_id, supplier:suppliers(id, name, phone, email, notes))').single()
        if (updatedItem) setItems(prev => prev.map(i => i.id === item.id ? updatedItem as Item : i))

        const noteParts = [`+${qty}`]
        if (storedCost) noteParts.push(`@ $${storedCost.toFixed(2)}/unit`)
        if (finalTotal) noteParts.push(`= $${finalTotal.toFixed(2)} total`)

        const { data: logEntry } = await supabase
          .from('usage_log')
          .insert({
            item_id: item.id,
            quantity_used: qty,
            type: 'restock',
            cost_per_unit: storedCost,
            supplier_id: row.supplierId || null,
            used_at: now,
            note: `Restocked ${noteParts.join(' ')}`,
          })
          .select('*, item:items(id, name, icon, unit), supplier:suppliers(id, name)')
          .single()
        if (logEntry) newLogs.push(logEntry as UsageLog)
      }))

      setRows(prev => {
        const reset = { ...prev }
        for (const key of Object.keys(reset)) reset[key] = { ...reset[key], qty: 0, cost: 0, total: 0, lastEdited: null }
        return reset
      })
      onConfirmSuccess(newLogs)
      setToast({ message: `Restocked ${toRestock.length} item${toRestock.length !== 1 ? 's' : ''} successfully`, type: 'success' })
      setTimeout(() => setToast(null), 3500)
    } catch {
      setToast({ message: 'Restock failed — please try again', type: 'error' })
      setTimeout(() => setToast(null), 4000)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="pb-[88px]">
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" /></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…" className="w-full h-9 pl-8 pr-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white placeholder-slate-400" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 mb-4 flex flex-wrap gap-x-3 gap-y-2 items-center shadow-card">
        <Dropdown value={filterCategory} onChange={setFilterCategory} options={categories.map(c => ({ value: c, label: c }))} placeholder="All categories" size="sm" />
        <Dropdown value={filterSupplier} onChange={setFilterSupplier} options={suppliers.map(s => ({ value: s.id, label: s.name }))} placeholder="All suppliers" size="sm" />
        <div className="flex items-center gap-1">
          {(['', 'low', 'out'] as const).map(val => (
            <button key={val} onClick={() => setFilterStock(val)} className={`h-7 px-2.5 text-xs font-medium rounded-md border transition-all ${filterStock === val ? val === 'low' ? 'bg-amber-100 text-amber-800 border-amber-300' : val === 'out' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
              {val === '' ? 'All' : val === 'low' ? 'Low' : 'Out'}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-slate-200 hidden sm:block" />
        <button onClick={() => setSortBy(s => s === 'deficit' ? 'name' : 'deficit')} className={`h-7 px-2.5 text-xs font-medium rounded-md border transition-all ${sortBy === 'deficit' ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
          {sortBy === 'deficit' ? '↓ Lowest stock' : 'A–Z'}
        </button>
        {hasFilters && <button onClick={() => { setSearch(''); setFilterCategory(''); setFilterSupplier(''); setFilterStock('') }} className="h-7 px-2.5 text-xs font-medium text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-md bg-white transition-colors">Clear</button>}
        <span className="ml-auto text-xs text-slate-400 font-medium tabular-nums">{filteredItems.length}<span className="text-slate-300">/{items.length}</span></span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-3 py-3">Item</th>
              <th className="px-3 py-3 hidden lg:table-cell">Supplier</th>
              <th className="px-3 py-3 text-center">Stock</th>
              <th className="px-3 py-3 text-center hidden sm:table-cell">Min</th>
              <th className="px-3 py-3 text-center">Restock Qty</th>
              <th className="px-3 py-3 text-center hidden sm:table-cell">Cost/Unit</th>
              <th className="px-3 py-3 text-center hidden sm:table-cell">Line Total</th>
              <th className="px-3 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map(item => {
              const isLow = item.quantity > 0 && item.quantity < item.min_stock_threshold
              const isOut = item.quantity === 0
              const row = rows[item.id] ?? { qty: 0, cost: 0, total: 0, lastEdited: null, supplierId: '' }
              const isActive = row.qty > 0
              const noCost = isActive && row.cost === 0
              // Suppliers assigned to this item
              const assignedSuppliers = (item.item_suppliers as ItemSupplierJoin[])?.map(is => is.supplier).filter(Boolean) as Supplier[] ?? []

              return (
                <tr key={item.id} className={`transition-colors ${isActive ? 'bg-teal-50/30 hover:bg-teal-50/50' : isOut ? 'bg-red-50/20 hover:bg-red-50/30' : isLow ? 'bg-amber-50/20 hover:bg-amber-50/30' : 'hover:bg-slate-50/60'} ${!isActive ? 'opacity-70' : ''}`}>
                  {/* Item */}
                  <td className="px-3 py-2.5 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 flex-none ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-transparent'}`} />
                      <div>
                        <span className="text-sm leading-tight">{item.name}</span>
                        {noCost && <span className="ml-2 text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-1 py-px">no cost</span>}
                      </div>
                    </div>
                  </td>

                  {/* Supplier dropdown (only assigned suppliers) */}
                  <td className="px-3 py-2.5 hidden lg:table-cell">
                    {assignedSuppliers.length > 0 ? (
                      <div className="relative">
                        <select
                          value={row.supplierId}
                          onChange={e => handleSupplierChange(item.id, e.target.value)}
                          className="h-7 pl-2 pr-6 text-xs border border-slate-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-slate-700 min-w-[120px] max-w-[160px]"
                        >
                          <option value="">No supplier</option>
                          {assignedSuppliers.map(s => <option key={s!.id} value={s!.id}>{s!.name}</option>)}
                        </select>
                        <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 italic">No suppliers</span>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="px-3 py-2.5 text-center">
                    <span className={`font-bold text-[13px] tabular-nums ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>{item.quantity}</span>
                    <span className="text-[10px] text-slate-400 ml-0.5">{item.unit}</span>
                  </td>

                  {/* Min */}
                  <td className="px-3 py-2.5 text-center text-xs text-slate-500 tabular-nums hidden sm:table-cell">{item.min_stock_threshold}</td>

                  {/* Restock qty */}
                  <td className="px-3 py-2.5 text-center">
                    <input type="number" value={row.qty || ''} onChange={e => handleQtyChange(item.id, e.target.value)} min={0} placeholder="0"
                      className={`w-16 h-7 px-2 text-xs font-bold text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white transition-colors ${isActive ? 'border-teal-400 text-teal-800 bg-teal-50/30' : 'border-slate-200 text-slate-500'}`} />
                  </td>

                  {/* Cost/unit */}
                  <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                    <label className="inline-flex items-center gap-0.5">
                      <span className="text-[10px] text-slate-400">$</span>
                      <input type="number" value={row.cost || ''} onChange={e => handleCostChange(item.id, e.target.value)} min={0} step={0.01} placeholder="0.00" disabled={!isActive}
                        className={`w-[68px] h-7 px-2 text-xs font-medium text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed ${row.cost > 0 ? 'border-teal-400 text-teal-800' : 'border-slate-200 text-slate-400'}`} />
                    </label>
                  </td>

                  {/* Line total */}
                  <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                    <label className="inline-flex items-center gap-0.5">
                      <span className="text-[10px] text-slate-400">$</span>
                      <input type="number" value={row.total || ''} onChange={e => handleTotalChange(item.id, e.target.value)} min={0} step={0.01} placeholder="—" disabled={!isActive}
                        className={`w-[72px] h-7 px-2 text-xs font-semibold text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed ${row.total > 0 ? 'border-teal-400 text-teal-800' : 'border-slate-200 text-slate-400'}`} />
                    </label>
                  </td>

                  {/* Reset */}
                  <td className="px-2 py-2.5 text-center">
                    {isActive && <button onClick={() => resetRow(item.id)} className="text-slate-300 hover:text-slate-500 transition-colors" aria-label="Reset row"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
                  </td>
                </tr>
              )
            })}

            {filteredItems.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-16 text-center">
                <div className="flex justify-center mb-4 text-slate-300"><svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
                <p className="text-sm font-semibold text-slate-600">{hasFilters ? 'No items match your search' : 'No items in inventory'}</p>
                {hasFilters && <button onClick={() => { setSearch(''); setFilterCategory(''); setFilterSupplier(''); setFilterStock('') }} className="text-xs text-teal-700 hover:underline mt-1">Clear filters</button>}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sticky confirm bar */}
      <div className="fixed bottom-[60px] md:bottom-0 left-0 right-0 z-40 pointer-events-none">
        <div className="max-w-6xl mx-auto px-4 md:px-6 pb-3 md:pb-4 pointer-events-auto">
          <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 rounded-xl shadow-lg border transition-all duration-200 ${summary.itemCount > 0 ? 'bg-white border-teal-200 shadow-[0_4px_24px_0_rgba(45,106,95,0.12)]' : 'bg-white/90 border-slate-200 backdrop-blur-sm'}`}>
            <div className="flex items-center gap-4">
              {[['Items', summary.itemCount, summary.itemCount > 0 ? 'text-teal-700' : 'text-slate-400'],
                ['Units', summary.totalUnits, summary.totalUnits > 0 ? 'text-emerald-700' : 'text-slate-400'],
                ['Grand Total', `$${summary.grandTotal.toFixed(2)}`, summary.grandTotal > 0 ? 'text-slate-900' : 'text-slate-400']
              ].map(([label, val, cls], i) => (
                <div key={i} className="flex items-center gap-4">
                  {i > 0 && <div className="w-px h-7 bg-slate-200" />}
                  <div className="text-center">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</div>
                    <div className={`text-base font-bold tabular-nums leading-tight ${cls}`}>{val}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="ml-auto">
              <button id="confirm-restock-btn" onClick={handleConfirm} disabled={confirming || summary.itemCount === 0}
                className={`inline-flex items-center gap-2 h-9 px-5 text-sm font-semibold rounded-lg shadow-sm transition-all duration-150 active:scale-[0.98] ${summary.itemCount > 0 ? 'bg-teal-700 hover:bg-teal-800 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'} disabled:opacity-60`}>
                {confirming
                  ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Restocking…</>
                  : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Confirm Restock</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function RestockTable({ initialItems, suppliers, restockLogs }: Props) {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current')
  const [logs, setLogs] = useState<UsageLog[]>(restockLogs)

  const tabs = [
    { id: 'current' as const, label: 'Current Restock' },
    { id: 'history' as const, label: 'Previous Orders', badge: groupRestockLogs(logs).length || undefined },
  ]

  return (
    <div>
      <div className="flex items-center gap-1 mb-5 border-b border-slate-200">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 pb-2.5 px-1 mr-3 text-sm font-medium border-b-2 transition-all duration-150 -mb-px ${activeTab === tab.id ? 'border-teal-700 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
            {tab.label}
            {tab.badge ? <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 rounded-full px-1.5 py-px tabular-nums">{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      {activeTab === 'current' && (
        <CurrentRestockTab items={initialItems} suppliers={suppliers} onConfirmSuccess={newLogs => setLogs(prev => [...newLogs, ...prev])} />
      )}
      {activeTab === 'history' && (
        <PreviousOrdersTab logs={logs} suppliers={suppliers} />
      )}
    </div>
  )
}
