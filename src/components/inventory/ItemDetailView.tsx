'use client'

import { useState, useCallback } from 'react'
import { Item, Supplier, UsageLog, ItemSupplierJoin, Category } from '@/lib/types'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IconPopoverTrigger } from '@/components/ui/IconPicker'
import SupplierMultiSelect from '@/components/ui/SupplierMultiSelect'
import Dropdown from '@/components/ui/Dropdown'

interface Props {
  item: Item
  allSuppliers: Supplier[]
  initialLogs: UsageLog[]
  categories?: Category[]
  /** Pre-computed from inventory_lots on the server. null = no FIFO data yet. */
  fifoValue: number | null
  /** fifoValue ÷ current qty. null when no priced lots or qty = 0. */
  fifoAvgCost: number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(str: string) {
  return new Date(str).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}
function fmtDateTime(str: string) {
  return new Date(str).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
function fmtMoney(n: number) {
  return `$${n.toFixed(2)}`
}

/**
 * Strip auto-generated restock notes (e.g. "Restocked +10 @ $0.50/unit = $5.00 total").
 * These are synthetic entries written by the app; the structured columns already show
 * the same data, so we suppress them and only surface genuine user notes.
 */
function getCleanRestockNote(note: string | null | undefined): string | null {
  const raw = note?.trim()
  if (!raw) return null
  if (/^Restocked\s/i.test(raw)) return null // auto-generated — suppress
  return raw
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{children}</p>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <div className="text-sm font-bold text-slate-900">{value}</div>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Supplier assignment section ──────────────────────────────────────────────
function SupplierAssignSection({
  itemId,
  itemSuppliers,
  allSuppliers,
  onUpdate,
}: {
  itemId: string
  itemSuppliers: ItemSupplierJoin[]
  allSuppliers: Supplier[]
  onUpdate: (updated: ItemSupplierJoin[]) => void
}) {
  const [assigning, setAssigning] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  const assignedIds = new Set(itemSuppliers.map(is => is.supplier_id))
  const available = allSuppliers.filter(s =>
    !assignedIds.has(s.id) &&
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  async function assign() {
    if (!selectedId) return
    setSaving(true)
    const { data } = await supabase
      .from('item_suppliers')
      .insert({ item_id: itemId, supplier_id: selectedId })
      .select('id, item_id, supplier_id, supplier:suppliers(id, name, phone, email, notes)')
      .single()
    if (data) onUpdate([...itemSuppliers, data as unknown as ItemSupplierJoin])
    setSelectedId('')
    setSearch('')
    setAssigning(false)
    setSaving(false)
  }

  async function unassign(joinId: string) {
    await supabase.from('item_suppliers').delete().eq('id', joinId)
    onUpdate(itemSuppliers.filter(is => is.id !== joinId))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Assigned Suppliers</SectionLabel>
        {!assigning && (
          <button
            onClick={() => setAssigning(true)}
            className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Assign Supplier
          </button>
        )}
      </div>

      {/* Assign dropdown */}
      {assigning && (
        <div className="mb-4 bg-teal-50 border border-teal-200 rounded-xl p-4 animate-fade-in">
          <p className="text-xs font-semibold text-teal-800 mb-2">Select a supplier to assign</p>
          <div className="relative mb-2">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-teal-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search suppliers…"
              className="w-full h-8 pl-8 pr-3 text-xs border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
            />
          </div>
          {available.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2 text-center">
              {allSuppliers.length === assignedIds.size ? 'All suppliers already assigned' : 'No suppliers match'}
            </p>
          ) : (
            <div className="border border-teal-200 rounded-lg overflow-hidden bg-white max-h-40 overflow-y-auto">
              {available.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(selectedId === s.id ? '' : s.id)}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors border-b border-slate-100 last:border-b-0 ${
                    selectedId === s.id ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-medium">{s.name}</span>
                  {s.phone && <span className="text-slate-400 ml-2">{s.phone}</span>}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={assign}
              disabled={!selectedId || saving}
              className="h-7 px-3 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Assigning…' : 'Assign'}
            </button>
            <button
              onClick={() => { setAssigning(false); setSearch(''); setSelectedId('') }}
              className="h-7 px-3 text-xs font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Assigned suppliers list */}
      {itemSuppliers.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">
          <p className="text-xs text-slate-400">No suppliers assigned to this product</p>
          <button onClick={() => setAssigning(true)} className="text-xs text-teal-700 hover:underline mt-1">
            Assign a supplier →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {itemSuppliers.map(is => {
            const sup = is.supplier as Supplier
            if (!sup) return null
            return (
              <div key={is.id} className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900">{sup.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    {sup.phone && (
                      <a href={`tel:${sup.phone}`} className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-teal-700 hover:underline transition-colors">
                        <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {sup.phone}
                      </a>
                    )}
                    {sup.email && (
                      <a href={`mailto:${sup.email}`} className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-teal-700 hover:underline truncate transition-colors">
                        <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {sup.email}
                      </a>
                    )}
                  </div>
                  {sup.notes && (
                    <p className="text-xs text-slate-400 italic mt-1 line-clamp-1">{sup.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => unassign(is.id)}
                  className="shrink-0 text-slate-300 hover:text-red-500 transition-colors mt-0.5"
                  aria-label="Remove supplier"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Product Info Tab ─────────────────────────────────────────────────────────
function ProductInfoTab({ item, allSuppliers, itemSuppliers, onSuppliersUpdate }: {
  item: Item
  allSuppliers: Supplier[]
  itemSuppliers: ItemSupplierJoin[]
  onSuppliersUpdate: (s: ItemSupplierJoin[]) => void
}) {
  const isLow = item.quantity > 0 && item.quantity < item.min_stock_threshold
  const isOut = item.quantity === 0

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div>
        <SectionLabel>Product Summary</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <StatCard
            label="Current Stock"
            value={
              <span className={isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-700'}>
                {item.quantity}
                <span className="text-xs font-medium text-slate-400 ml-1">{item.unit}</span>
              </span>
            }
          />
          <StatCard label="Min Stock" value={`${item.min_stock_threshold} ${item.unit}`} />
          <StatCard
            label="Status"
            value={
              isOut ? <span className="text-red-600">Out of stock</span>
              : isLow ? <span className="text-amber-600">Low stock</span>
              : <span className="text-emerald-700">In stock</span>
            }
          />
          {item.category && <StatCard label="Category" value={item.category} />}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Supplier assignment */}
      <SupplierAssignSection
        itemId={item.id}
        itemSuppliers={itemSuppliers}
        allSuppliers={allSuppliers}
        onUpdate={onSuppliersUpdate}
      />
    </div>
  )
}

// ─── Restock & Usage Tab ──────────────────────────────────────────────────────
function RestockUsageTab({ item, logs, fifoValue, fifoAvgCost }: {
  item: Item
  logs: UsageLog[]
  fifoValue: number | null
  fifoAvgCost: number | null
}) {
  const restockLogs = logs.filter(l => l.type === 'restock')
  const allLogs = logs

  // Pricing stats — all numbers guarded against NaN/null
  const lastRestock = restockLogs[0] ?? null
  const costsWithValue = restockLogs.filter(l => l.cost_per_unit && Number(l.cost_per_unit) > 0)

  // Weighted average: sum(qty_i × cost_i) / sum(qty_i)  — never simple avg
  const totalWeightedCost = costsWithValue.reduce((s, l) => s + (l.quantity_used * Number(l.cost_per_unit!)), 0)
  const totalPricedQty   = costsWithValue.reduce((s, l) => s + l.quantity_used, 0)
  const avgCost = totalPricedQty > 0 ? Math.round((totalWeightedCost / totalPricedQty) * 10000) / 10000 : null

  const totalUnitsRestocked = restockLogs.reduce((s, l) => s + l.quantity_used, 0)
  const totalSpend = totalWeightedCost  // same calculation, re-use

  // Running balance (current qty → work backwards)
  const movements = allLogs.map((log, idx) => {
    let balanceAfter = item.quantity
    for (let i = 0; i < idx; i++) {
      const l = allLogs[i]
      if (!l.type || l.type === 'usage') balanceAfter += l.quantity_used
      else balanceAfter -= l.quantity_used
    }
    return { log, balanceAfter }
  })

  return (
    <div className="space-y-8">
      {/* Pricing summary */}
      <div>
        <SectionLabel>Pricing Overview</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard
            label="Last Cost/Unit"
            value={lastRestock?.cost_per_unit ? fmtMoney(Number(lastRestock.cost_per_unit)) : '—'}
            sub={lastRestock ? `on ${fmtDate(lastRestock.used_at)}` : undefined}
          />
          <StatCard
            label="FIFO Avg Cost/Unit"
            value={fifoAvgCost !== null ? fmtMoney(fifoAvgCost) : '—'}
            sub={
              fifoAvgCost !== null
                ? 'Based on remaining FIFO lots'
                : fifoValue === null ? 'No lot data — run migration 005' : 'All lots have zero cost'
            }
          />
          <StatCard
            label="FIFO Inventory Value"
            value={
              fifoValue !== null && fifoValue > 0
                ? <span className="text-teal-700">{fmtMoney(fifoValue)}</span>
                : <span className="text-slate-400">—</span>
            }
            sub={fifoValue !== null ? 'Live lot value (qty × cost)' : 'No lot data yet'}
          />
          <StatCard
            label="Total Spend"
            value={totalSpend > 0 ? fmtMoney(totalSpend) : '—'}
            sub="Historical cash outflow"
          />
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Restock history */}
      <div>
        <SectionLabel>Restock History</SectionLabel>
        {restockLogs.length === 0 ? (
          <div className="bg-slate-50 rounded-xl px-4 py-8 text-center text-xs text-slate-400">
            No restock records for this product yet
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-200">
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-3 py-2.5 text-left">Date</th>
                    <th className="px-3 py-2.5 text-left hidden sm:table-cell">Supplier</th>
                    <th className="px-3 py-2.5 text-right">Qty</th>
                    <th className="px-3 py-2.5 text-right hidden sm:table-cell">Cost/Unit</th>
                    <th className="px-3 py-2.5 text-right">Total</th>
                    <th className="px-3 py-2.5 text-left hidden md:table-cell">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {restockLogs.map(log => {
                    const cost       = log.cost_per_unit ? Number(log.cost_per_unit) : 0
                    // Restock transaction total = quantity restocked × cost per unit
                    const lineTotal  = log.quantity_used * cost
                    const supplierName = (log.supplier as any)?.name ?? '—'
                    // Show only genuine user notes; suppress auto-generated system notes
                    const cleanNote  = getCleanRestockNote(log.note)
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(log.used_at)}</td>
                        <td className="px-3 py-2.5 text-slate-700 font-medium hidden sm:table-cell">{supplierName}</td>
                        {/* Qty: positive — restock always adds stock */}
                        <td className="px-3 py-2.5 text-right tabular-nums font-bold text-emerald-700">+{log.quantity_used}</td>
                        {/* Cost/unit: latest recorded price for this restock transaction */}
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-600 hidden sm:table-cell">{cost > 0 ? fmtMoney(cost) : '—'}</td>
                        {/* Line total = quantity × cost (transaction spend) */}
                        <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-800">{lineTotal > 0 ? fmtMoney(lineTotal) : '—'}</td>
                        {/* Note: suppress auto-generated system notes, show real user notes only */}
                        <td className="px-3 py-2.5 text-slate-400 italic max-w-[160px] truncate hidden md:table-cell">{cleanNote ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* Full movement history */}
      <div>
        <SectionLabel>Stock Movements</SectionLabel>
        {allLogs.length === 0 ? (
          <div className="bg-slate-50 rounded-xl px-4 py-8 text-center text-xs text-slate-400">
            No movement history yet
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-200">
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-3 py-2.5 text-left">Date</th>
                    <th className="px-3 py-2.5 text-center">Type</th>
                    <th className="px-3 py-2.5 text-right">Change</th>
                    <th className="px-3 py-2.5 text-right">Balance After</th>
                    <th className="px-3 py-2.5 text-left hidden sm:table-cell">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map(({ log, balanceAfter }, idx) => {
                    const isRestock = log.type === 'restock'
                    return (
                      <tr key={log.id} className={`hover:bg-slate-50/50 transition-colors ${idx === 0 ? 'bg-teal-50/20' : ''}`}>
                        <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{fmtDateTime(log.used_at)}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isRestock ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isRestock ? 'Restock' : 'Usage'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-bold">
                          <span className={isRestock ? 'text-emerald-700' : 'text-red-500'}>
                            {isRestock ? '+' : '−'}{log.quantity_used}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-700">{balanceAfter}</td>
                        <td className="px-3 py-2 text-slate-400 italic truncate max-w-[200px] hidden sm:table-cell">{log.note ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Inline edit form ─────────────────────────────────────────────────────────
function EditForm({
  item,
  allSuppliers,
  itemSuppliers,
  categories,
  onSave,
  onCancel,
}: {
  item: Item
  allSuppliers: Supplier[]
  itemSuppliers: ItemSupplierJoin[]
  categories: Category[]
  onSave: (updated: Partial<Item>, supplierIds: Set<string>) => Promise<void>
  onCancel: () => void
}) {
  const [values, setValues] = useState<Partial<Item>>({
    name: item.name,
    icon: item.icon ?? 'box',
    quantity: item.quantity,
    min_stock_threshold: item.min_stock_threshold,
    unit: item.unit ?? 'units',
    category: item.category ?? '',
  })
  const [supplierIds, setSupplierIds] = useState<Set<string>>(
    new Set((itemSuppliers as ItemSupplierJoin[]).map(is => is.supplier_id))
  )
  const [saving, setSaving] = useState(false)

  function set<K extends keyof Item>(field: K, value: Item[K]) {
    setValues(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!values.name?.trim()) return
    setSaving(true)
    await onSave(values, supplierIds)
    setSaving(false)
  }

  return (
    <div className="space-y-5">

      {/* Row 1: Icon + Name */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Item Name</label>
        <div className="flex items-center gap-2">
          <IconPopoverTrigger
            value={values.icon ?? 'box'}
            onChange={v => set('icon', v)}
          />
          <input
            value={values.name ?? ''}
            onChange={e => set('name', e.target.value)}
            className="flex-1 h-10 px-3 text-sm font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-slate-900 hover:border-slate-300 transition-colors"
            placeholder="Item name"
            autoFocus
          />
        </div>
      </div>

      {/* Row 2: Qty + Unit + Min Threshold */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quantity</label>
          <input
            type="number"
            value={values.quantity ?? 0}
            onChange={e => set('quantity', Number(e.target.value))}
            min={0}
            className="w-full h-10 px-3 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-slate-900 hover:border-slate-300 transition-colors text-center"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Unit</label>
          <Dropdown
            value={values.unit ?? 'units'}
            onChange={v => set('unit', v)}
            options={[
              { value: 'units', label: 'Units' },
              { value: 'boxes', label: 'Boxes' },
              { value: 'bottles', label: 'Bottles' },
              { value: 'vials', label: 'Vials' },
              { value: 'packs', label: 'Packs' },
              { value: 'rolls', label: 'Rolls' },
              { value: 'pairs', label: 'Pairs' },
              { value: 'sheets', label: 'Sheets' },
            ]}
            size="md"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Min Threshold</label>
          <input
            type="number"
            value={values.min_stock_threshold ?? 0}
            onChange={e => set('min_stock_threshold', Number(e.target.value))}
            min={0}
            className="w-full h-10 px-3 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-slate-900 hover:border-slate-300 transition-colors text-center"
          />
        </div>
      </div>

      {/* Row 3: Category */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Category</label>
        {categories.length > 0 ? (
          <Dropdown
            value={values.category ?? ''}
            onChange={v => set('category', v)}
            options={categories.map(c => ({ value: c.name, label: c.name }))}
            placeholder="No category"
            size="md"
            className="w-full"
          />
        ) : (
          <input
            value={values.category ?? ''}
            onChange={e => set('category', e.target.value)}
            placeholder="e.g. PPE, Meds, Prosthetic dentistry…"
            className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-slate-900 hover:border-slate-300 transition-colors placeholder-slate-400"
          />
        )}
      </div>

      {/* Row 4: Suppliers */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Suppliers</label>
        <SupplierMultiSelect
          suppliers={allSuppliers}
          selectedIds={supplierIds}
          onChange={setSupplierIds}
          size="md"
        />
      </div>

      {/* Divider */}
      <hr className="border-slate-100" />

      {/* Save / Cancel */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 h-10 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!values.name?.trim() || saving}
          className="flex-1 h-10 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

    </div>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────
export default function ItemDetailView({ item, allSuppliers, initialLogs, categories = [], fifoValue, fifoAvgCost }: Props) {
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info')
  const [isEditing, setIsEditing] = useState(false)
  const [currentItem, setCurrentItem] = useState<Item>(item)
  const [itemSuppliers, setItemSuppliers] = useState<ItemSupplierJoin[]>(
    (item.item_suppliers as ItemSupplierJoin[]) ?? []
  )
  const supabase = createClient()
  const router = useRouter()

  const tabs = [
    { id: 'info' as const, label: 'Product Info' },
    { id: 'history' as const, label: 'Restock & Usage' },
  ]

  async function handleSave(updated: Partial<Item>, supplierIds: Set<string>) {
    // 1. Update scalar fields
    const { data, error } = await supabase
      .from('items')
      .update({
        name: updated.name,
        icon: updated.icon,
        quantity: Number(updated.quantity),
        min_stock_threshold: Number(updated.min_stock_threshold),
        unit: updated.unit,
        category: updated.category || null,
      })
      .eq('id', currentItem.id)
      .select('*, item_suppliers(id, supplier_id, supplier:suppliers(id, name, phone, email, notes))')
      .single()

    if (error || !data) return

    // 2. Diff supplier junction table
    const existing = (data as any).item_suppliers as ItemSupplierJoin[]
    const existingIds = new Set(existing.map((is: ItemSupplierJoin) => is.supplier_id))
    const toRemove = existing.filter(is => !supplierIds.has(is.supplier_id))
    const toAdd    = [...supplierIds].filter(sid => !existingIds.has(sid))

    if (toRemove.length) {
      await supabase.from('item_suppliers').delete().in('id', toRemove.map(is => is.id))
    }
    if (toAdd.length) {
      await supabase.from('item_suppliers').insert(toAdd.map(sid => ({ item_id: currentItem.id, supplier_id: sid })))
    }

    // 3. Re-fetch fresh item with updated junctions
    const { data: fresh } = await supabase
      .from('items')
      .select('*, item_suppliers(id, supplier_id, supplier:suppliers(id, name, phone, email, notes))')
      .eq('id', currentItem.id)
      .single()

    if (fresh) {
      setCurrentItem(fresh as Item)
      setItemSuppliers((fresh as any).item_suppliers ?? [])
    }
    setIsEditing(false)
    router.refresh()
  }

  return (
    <div>
      {/* Action bar */}
      <div className="flex items-center justify-between gap-4 mb-5">
        {/* Tabs — hidden while editing to keep the header clean */}
        {!isEditing ? (
          <div className="flex items-center gap-1 border-b border-slate-200 flex-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2.5 px-1 mr-4 text-sm font-medium border-b-2 transition-all duration-150 -mb-px ${
                  activeTab === tab.id
                    ? 'border-teal-700 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm font-semibold text-slate-700 border-b border-slate-200 flex-1 pb-2.5">
            Edit item
          </p>
        )}

        {/* Edit / Cancel toggle */}
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="shrink-0 flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit item
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(false)}
            className="shrink-0 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            ✕ Cancel
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-card p-6">
        {isEditing ? (
          <EditForm
            item={currentItem}
            allSuppliers={allSuppliers}
            itemSuppliers={itemSuppliers}
            categories={categories}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        ) : activeTab === 'info' ? (
          <ProductInfoTab
            item={currentItem}
            allSuppliers={allSuppliers}
            itemSuppliers={itemSuppliers}
            onSuppliersUpdate={setItemSuppliers}
          />
        ) : (
          <RestockUsageTab
            item={currentItem}
            logs={initialLogs}
            fifoValue={fifoValue}
            fifoAvgCost={fifoAvgCost}
          />
        )}
      </div>
    </div>
  )
}

