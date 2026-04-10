'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Supplier, Item } from '@/lib/types'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LinkedItem {
  id: string
  name: string
  icon: string
  quantity: number
  min_stock_threshold: number
  unit: string
  category?: string | null
}

interface ItemSuppliersJoin {
  item_id: string
  item?: LinkedItem
}

interface SupplierWithItems extends Supplier {
  item_suppliers?: ItemSuppliersJoin[]
}

interface SupplierStat {
  lastRestock: string
  totalSpend: number
}

interface Props {
  initialSuppliers: SupplierWithItems[]
  allItems: Pick<Item, 'id' | 'name' | 'icon' | 'unit' | 'category'>[]
  supplierStats: Record<string, SupplierStat>
}

const EMPTY: Partial<Supplier> = { name: '', phone: '', email: '', notes: '' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function stockStatus(item: LinkedItem): 'out' | 'low' | 'ok' {
  if (item.quantity === 0) return 'out'
  if (item.quantity < item.min_stock_threshold) return 'low'
  return 'ok'
}

function StockBadge({ item }: { item: LinkedItem }) {
  const s = stockStatus(item)
  if (s === 'out') return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 rounded whitespace-nowrap">
      Out of stock
    </span>
  )
  if (s === 'low') return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded whitespace-nowrap">
      Low stock
    </span>
  )
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded whitespace-nowrap">
      In stock
    </span>
  )
}

// ─── Compact form field ───────────────────────────────────────────────────────

function Field({ label, value, onChange, type = 'text', placeholder = '', className = '' }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-300"
      />
    </div>
  )
}

// ─── KPI tile ─────────────────────────────────────────────────────────────────

function KpiTile({
  label, value, sub,
  variant = 'normal',
}: {
  label: string
  value: React.ReactNode
  sub?: string
  variant?: 'normal' | 'warn' | 'danger'
}) {
  const valueColor =
    variant === 'danger' ? 'text-red-600' :
    variant === 'warn'   ? 'text-amber-600' :
    'text-slate-800'

  return (
    <div className="flex flex-col min-w-0">
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 whitespace-nowrap">{label}</span>
      <span className={`text-sm font-bold tabular-nums leading-tight ${valueColor}`}>{value}</span>
      {sub && <span className="text-[10px] text-slate-400 mt-0.5">{sub}</span>}
    </div>
  )
}

// ─── Assign panel ─────────────────────────────────────────────────────────────

function AssignPanel({
  supplierId, linkedItems, allItems, onUpdate, onClose,
}: {
  supplierId: string
  linkedItems: LinkedItem[]
  allItems: Props['allItems']
  onUpdate: (updated: LinkedItem[]) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [justAdded, setJustAdded] = useState<string | null>(null)
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const linkedIds = useMemo(() => new Set(linkedItems.map(i => i.id)), [linkedItems])
  const available = useMemo(() =>
    allItems.filter(i => !linkedIds.has(i.id) && i.name.toLowerCase().includes(search.toLowerCase())),
    [allItems, linkedIds, search]
  )

  async function assign(itemId: string) {
    if (saving) return
    setSaving(true)
    setJustAdded(itemId)
    const { data } = await supabase
      .from('item_suppliers')
      .insert({ item_id: itemId, supplier_id: supplierId })
      .select('item_id, item:items(id, name, icon, quantity, min_stock_threshold, unit, category)')
      .single()
    if (data && (data as any).item) {
      onUpdate([...linkedItems, (data as any).item])
    }
    setSaving(false)
    setJustAdded(null)
    // Keep panel open so user can add more
    setSearch('')
  }

  return (
    <div className="rounded-xl border border-teal-200 bg-white shadow-sm overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-teal-50 border-b border-teal-100">
        <div className="flex items-center gap-1.5">
          <svg className="w-3 h-3 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">Assign Product</span>
        </div>
        <button onClick={onClose} className="text-teal-400 hover:text-teal-700 transition-colors p-0.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-slate-100">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${allItems.length - linkedIds.size} available products…`}
            className="w-full h-7 pl-7 pr-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white placeholder-slate-300"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Product list */}
      <div className="max-h-40 overflow-y-auto divide-y divide-slate-50">
        {available.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            {allItems.length === linkedIds.size ? 'All products already assigned to this supplier' : 'No products match your search'}
          </p>
        ) : (
          available.map(item => {
            const isLoading = justAdded === item.id
            return (
              <button
                key={item.id}
                onClick={() => assign(item.id)}
                disabled={saving}
                className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-teal-50 text-slate-700 hover:text-teal-800 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium truncate">{item.name}</span>
                  {item.category && (
                    <span className="text-slate-400 text-[10px] hidden sm:block shrink-0">
                      {item.category}
                    </span>
                  )}
                </div>
                {isLoading ? (
                  <svg className="w-3.5 h-3.5 text-teal-500 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>
            )
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100">
        <p className="text-[10px] text-slate-400">Click any product to assign it instantly</p>
      </div>
    </div>
  )
}

// ─── Linked products section ──────────────────────────────────────────────────

function LinkedProductsSection({
  linkedItems, supplierId, allItems, onUpdate,
}: {
  linkedItems: LinkedItem[]
  supplierId: string
  allItems: Props['allItems']
  onUpdate: (updated: LinkedItem[]) => void
}) {
  const [assigning, setAssigning]         = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [showLowOnly, setShowLowOnly]     = useState(false)
  const supabase = createClient()

  async function unassign(itemId: string) {
    await supabase.from('item_suppliers').delete().eq('supplier_id', supplierId).eq('item_id', itemId)
    onUpdate(linkedItems.filter(i => i.id !== itemId))
  }

  const lowCount = linkedItems.filter(i => stockStatus(i) === 'low').length
  const outCount = linkedItems.filter(i => stockStatus(i) === 'out').length

  const filtered = useMemo(() => {
    let list = linkedItems
    if (showLowOnly) list = list.filter(i => stockStatus(i) !== 'ok')
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase()
      list = list.filter(i => i.name.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q))
    }
    return list
  }, [linkedItems, showLowOnly, productSearch])

  return (
    <div className="flex flex-col gap-2">

      {/* Section toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Products
          {linkedItems.length > 0 && <span className="text-slate-300 ml-1">· {linkedItems.length}</span>}
        </p>

        {/* Filters — only show if there are items */}
        {linkedItems.length > 1 && (
          <div className="flex items-center gap-1.5 ml-1">
            {/* Search within products */}
            <div className="relative">
              <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
              </svg>
              <input
                type="text"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Filter…"
                className="h-5 pl-5 pr-2 w-24 text-[10px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white placeholder-slate-300"
              />
            </div>

            {/* Low stock filter */}
            {(lowCount + outCount) > 0 && (
              <button
                onClick={() => setShowLowOnly(p => !p)}
                className={`h-5 px-2 text-[10px] font-semibold rounded border transition-colors ${
                  showLowOnly
                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600'
                }`}
              >
                ⚠ Needs attention {lowCount + outCount > 0 && `(${lowCount + outCount})`}
              </button>
            )}
          </div>
        )}

        <div className="flex-1" />

        {!assigning && (
          <button
            onClick={() => setAssigning(true)}
            className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors shadow-sm shrink-0"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Assign product
          </button>
        )}
      </div>

      {/* Assign panel */}
      {assigning && (
        <AssignPanel
          supplierId={supplierId}
          linkedItems={linkedItems}
          allItems={allItems}
          onUpdate={updated => onUpdate(updated)}
          onClose={() => setAssigning(false)}
        />
      )}

      {/* Products table */}
      {linkedItems.length > 0 ? (
        filtered.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2 text-center">No products match the filter</p>
        ) : (
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-3 py-2 text-left text-[9px] font-bold text-slate-400 uppercase tracking-wider">Product</th>
                  <th className="px-2 py-2 text-left text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="px-2 py-2 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider">Stock</th>
                  <th className="px-2 py-2 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Min</th>
                  <th className="px-2 py-2 text-left text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-2 py-2 w-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(item => {
                  const s  = stockStatus(item)
                  const isOut = s === 'out'
                  const isLow = s === 'low'
                  return (
                    <tr
                      key={item.id}
                      className={`group transition-colors ${
                        isOut ? 'bg-red-50/50 hover:bg-red-50' :
                        isLow ? 'bg-amber-50/40 hover:bg-amber-50' :
                        'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="px-3 py-1.5">
                        <Link
                          href={`/inventory/${item.id}`}
                          className="font-medium text-slate-700 hover:text-teal-700 transition-colors truncate max-w-[150px] block"
                        >
                          {item.name}
                        </Link>
                      </td>
                      <td className="px-2 py-1.5 text-slate-400 hidden sm:table-cell">
                        <span className="truncate block max-w-[90px]">
                          {item.category ?? <span className="text-slate-200">—</span>}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        <span className={`font-bold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-700'}`}>
                          {item.quantity}
                        </span>
                        <span className="text-slate-300 text-[10px] ml-0.5">{item.unit}</span>
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-400 hidden md:table-cell">
                        {item.min_stock_threshold}
                      </td>
                      <td className="px-2 py-1.5">
                        <StockBadge item={item} />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          onClick={() => unassign(item.id)}
                          title="Unassign"
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        !assigning && (
          <div className="border border-dashed border-slate-200 rounded-xl py-6 text-center">
            <p className="text-xs text-slate-400">No products linked to this supplier yet</p>
            <button
              onClick={() => setAssigning(true)}
              className="mt-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors"
            >
              Assign a product →
            </button>
          </div>
        )
      )}
    </div>
  )
}

// ─── Main SupplierList ────────────────────────────────────────────────────────

export default function SupplierList({ initialSuppliers, allItems, supplierStats }: Props) {
  const [suppliers, setSuppliers]   = useState<SupplierWithItems[]>(initialSuppliers)
  const [expanded, setExpanded]     = useState<string | null>(null)
  const [editing, setEditing]       = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Supplier>>(EMPTY)
  const [showAdd, setShowAdd]       = useState(false)
  const [newVals, setNewVals]       = useState<Partial<Supplier>>(EMPTY)
  const [saving, setSaving]         = useState(false)
  const [pageSearch, setPageSearch] = useState('')

  const [linkedItemsMap, setLinkedItemsMap] = useState<Record<string, LinkedItem[]>>(() => {
    const map: Record<string, LinkedItem[]> = {}
    for (const s of initialSuppliers) {
      map[s.id] = (s.item_suppliers ?? []).map(is => is.item).filter(Boolean) as LinkedItem[]
    }
    return map
  })

  const supabase = createClient()

  const filteredSuppliers = useMemo(() => {
    if (!pageSearch.trim()) return suppliers
    const q = pageSearch.toLowerCase()
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    )
  }, [suppliers, pageSearch])

  function setField<K extends keyof Supplier>(field: K, value: string, target: 'edit' | 'new') {
    if (target === 'edit') setEditValues(p => ({ ...p, [field]: value }))
    else setNewVals(p => ({ ...p, [field]: value }))
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const { data } = await supabase.from('suppliers')
      .update({ name: editValues.name, phone: editValues.phone || null, email: editValues.email || null, notes: editValues.notes || null })
      .eq('id', id).select().single()
    if (data) setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
    setEditing(null); setSaving(false)
  }

  async function deleteSupplier(id: string) {
    if (!confirm('Delete this supplier? Products will be unlinked automatically.')) return
    await supabase.from('suppliers').delete().eq('id', id)
    setSuppliers(prev => prev.filter(s => s.id !== id))
    if (expanded === id) setExpanded(null)
  }

  async function addSupplier() {
    if (!newVals.name?.trim()) return
    setSaving(true)
    const { data } = await supabase.from('suppliers')
      .insert({ name: newVals.name, phone: newVals.phone || null, email: newVals.email || null, notes: newVals.notes || null })
      .select().single()
    if (data) {
      setSuppliers(prev => [...prev, { ...data, item_suppliers: [] }])
      setLinkedItemsMap(prev => ({ ...prev, [data.id]: [] }))
    }
    setNewVals(EMPTY); setShowAdd(false); setSaving(false)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* ── Page toolbar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={pageSearch}
            onChange={e => setPageSearch(e.target.value)}
            placeholder="Search by name, phone, or email…"
            className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-slate-400 transition-shadow"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium shrink-0">
          {filteredSuppliers.length}{pageSearch ? ` of ${suppliers.length}` : ''} supplier{suppliers.length !== 1 ? 's' : ''}
        </span>
        <div className="flex-1" />
        <button
          id="add-supplier-btn"
          onClick={() => { setShowAdd(p => !p); setEditing(null) }}
          className="inline-flex items-center gap-1.5 h-8 px-3 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Supplier
        </button>
      </div>

      {/* ── Add form ──────────────────────────────────────────────────── */}
      {showAdd && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">New Supplier</h3>
            <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
            <Field className="col-span-2" label="Name *" value={newVals.name ?? ''} onChange={v => setField('name', v, 'new')} placeholder="Dental Supply Co." />
            <Field label="Phone" value={newVals.phone ?? ''} onChange={v => setField('phone', v, 'new')} type="tel" placeholder="+966 5X XXX XXXX" />
            <Field label="Email" value={newVals.email ?? ''} onChange={v => setField('email', v, 'new')} type="email" placeholder="orders@supplier.com" />
            <Field className="col-span-2 sm:col-span-4" label="Notes" value={newVals.notes ?? ''} onChange={v => setField('notes', v, 'new')} placeholder="Optional notes…" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="h-7 px-3 text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
            <button onClick={addSupplier} disabled={!newVals.name?.trim() || saving} className="h-7 px-3 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Supplier'}
            </button>
          </div>
        </div>
      )}

      {/* ── Supplier list ──────────────────────────────────────────────── */}
      <div className="space-y-2">
        {filteredSuppliers.map(supplier => {
          const isExpanded  = expanded === supplier.id
          const isEditing   = editing  === supplier.id
          const linkedItems = linkedItemsMap[supplier.id] ?? []
          const lowItems    = linkedItems.filter(i => stockStatus(i) === 'low')
          const outItems    = linkedItems.filter(i => stockStatus(i) === 'out')
          const stats       = supplierStats[supplier.id]
          const alertCount  = lowItems.length + outItems.length

          return (
            <div
              key={supplier.id}
              className={`bg-white border rounded-xl transition-all duration-200 overflow-hidden ${
                isExpanded ? 'border-slate-300 shadow-md' : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow'
              }`}
            >

              {/* ── Collapsed row ─────────────────────────────────────── */}
              <button
                onClick={() => { if (!isEditing) setExpanded(prev => prev === supplier.id ? null : supplier.id) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                {/* Initial avatar */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm ${
                  alertCount > 0 ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-teal-50 border border-teal-100 text-teal-700'
                }`}>
                  {supplier.name.charAt(0).toUpperCase()}
                </div>

                {/* Name + secondary info */}
                <div className="flex-1 min-w-0">
                  {/* Row 1: name + alert badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900 leading-tight">{supplier.name}</span>
                    {outItems.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                        {outItems.length} out of stock
                      </span>
                    )}
                    {lowItems.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        {lowItems.length} low stock
                      </span>
                    )}
                  </div>
                  {/* Row 2: contact · products · last restock */}
                  <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                    {supplier.phone && (
                      <span className="text-[11px] text-slate-400 font-medium tabular-nums">{supplier.phone}</span>
                    )}
                    {supplier.email && (
                      <span className="text-[11px] text-slate-400 hidden md:block truncate">{supplier.email}</span>
                    )}
                    {(supplier.phone || supplier.email) && linkedItems.length > 0 && (
                      <span className="text-slate-200 hidden sm:block">·</span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {linkedItems.length > 0 ? `${linkedItems.length} product${linkedItems.length !== 1 ? 's' : ''}` : 'No products linked'}
                    </span>
                    {stats?.lastRestock && (
                      <>
                        <span className="text-slate-200 hidden sm:block">·</span>
                        <span className="text-[11px] text-slate-400 hidden sm:block">
                          Last restock {formatDateShort(stats.lastRestock)}
                        </span>
                      </>
                    )}
                    {stats?.totalSpend > 0 && (
                      <>
                        <span className="text-slate-200 hidden md:block">·</span>
                        <span className="text-[11px] text-slate-400 hidden md:block">
                          ${stats.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} total spend
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Chevron */}
                <svg
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* ── Expanded section ───────────────────────────────────── */}
              {isExpanded && (
                <div className="border-t border-slate-100">

                  {/* ── Edit mode ─────────────────────────────────────── */}
                  {isEditing ? (
                    <div className="px-4 py-3 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Edit Supplier</span>
                        <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                        <Field className="col-span-2" label="Name *" value={editValues.name ?? ''} onChange={v => setField('name', v, 'edit')} />
                        <Field label="Phone" value={editValues.phone ?? ''} onChange={v => setField('phone', v, 'edit')} type="tel" />
                        <Field label="Email" value={editValues.email ?? ''} onChange={v => setField('email', v, 'edit')} type="email" />
                        <Field className="col-span-2 sm:col-span-4" label="Notes" value={editValues.notes ?? ''} onChange={v => setField('notes', v, 'edit')} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditing(null)} className="h-7 px-3 text-xs font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                        <button onClick={() => saveEdit(supplier.id)} disabled={saving} className="h-7 px-3 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors disabled:opacity-50">
                          {saving ? 'Saving…' : 'Save changes'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* ── Profile header bar ──────────────────────── */}
                      <div className="px-4 py-3 border-b border-slate-100 flex items-start justify-between gap-4 flex-wrap">
                        {/* Identity */}
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Supplier Profile</p>
                          <p className="text-base font-bold text-slate-900 leading-tight">{supplier.name}</p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {supplier.phone && (
                              <a href={`tel:${supplier.phone}`} className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 hover:underline transition-colors">
                                <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {supplier.phone}
                              </a>
                            )}
                            {supplier.email && (
                              <a href={`mailto:${supplier.email}`} className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 hover:underline transition-colors">
                                <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {supplier.email}
                              </a>
                            )}
                            {!supplier.phone && !supplier.email && (
                              <span className="text-xs text-slate-300 italic">No contact info</span>
                            )}
                          </div>
                          {supplier.notes && (
                            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed max-w-sm">{supplier.notes}</p>
                          )}
                        </div>

                        {/* Quick actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setEditing(supplier.id)
                              setEditValues({ name: supplier.name, phone: supplier.phone ?? '', email: supplier.email ?? '', notes: supplier.notes ?? '' })
                            }}
                            className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-medium text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => deleteSupplier(supplier.id)}
                            className="h-7 px-2 text-xs font-medium text-slate-400 hover:text-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* ── KPI strip ──────────────────────────────────── */}
                      <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center gap-0 overflow-x-auto">
                        <KpiTile label="Products" value={linkedItems.length || '—'} />
                        <div className="w-px h-8 bg-slate-200 mx-4 shrink-0" />
                        <KpiTile
                          label="Low Stock"
                          value={lowItems.length || '—'}
                          variant={lowItems.length > 0 ? 'warn' : 'normal'}
                        />
                        <div className="w-px h-8 bg-slate-200 mx-4 shrink-0" />
                        <KpiTile
                          label="Out of Stock"
                          value={outItems.length || '—'}
                          variant={outItems.length > 0 ? 'danger' : 'normal'}
                        />
                        <div className="w-px h-8 bg-slate-200 mx-4 shrink-0" />
                        <KpiTile
                          label="Last Restock"
                          value={stats?.lastRestock ? formatDate(stats.lastRestock) : '—'}
                        />
                        {stats?.totalSpend > 0 && (
                          <>
                            <div className="w-px h-8 bg-slate-200 mx-4 shrink-0" />
                            <KpiTile
                              label="Total Spend"
                              value={`$${stats.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            />
                          </>
                        )}
                      </div>

                      {/* ── Main body ──────────────────────────────────── */}
                      <div className="px-4 py-4">
                        <LinkedProductsSection
                          linkedItems={linkedItems}
                          supplierId={supplier.id}
                          allItems={allItems}
                          onUpdate={updated => setLinkedItemsMap(prev => ({ ...prev, [supplier.id]: updated }))}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {filteredSuppliers.length === 0 && suppliers.length > 0 && (
          <div className="bg-white border border-dashed border-slate-200 rounded-xl py-10 text-center">
            <p className="text-sm font-medium text-slate-500">No suppliers match "{pageSearch}"</p>
            <button onClick={() => setPageSearch('')} className="mt-1 text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors">Clear search</button>
          </div>
        )}

        {suppliers.length === 0 && (
          <div className="bg-white border border-dashed border-slate-200 rounded-xl py-16 text-center">
            <div className="flex justify-center mb-3 text-slate-200">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-600">No suppliers yet</p>
            <p className="text-xs text-slate-400 mt-1">Add your first supplier to start tracking vendors</p>
          </div>
        )}
      </div>
    </div>
  )
}
