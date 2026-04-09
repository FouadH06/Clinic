'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Item, Supplier } from '@/lib/types'
import { createClient } from '@/lib/supabase'
import AddItemModal from './AddItemModal'
import Dropdown from '@/components/ui/Dropdown'
import IconPicker from '@/components/ui/IconPicker'

interface Props {
  initialItems: Item[]
  suppliers: Supplier[]
}

// ─── Bulk Action Bar ────────────────────────────────────────────────────────
interface BulkBarProps {
  count: number
  suppliers: Supplier[]
  categories: string[]
  onQtyAdjust: (delta: number) => void
  onAssignSupplier: (id: string) => void
  onAssignCategory: (cat: string) => void
  onDelete: () => void
  onClear: () => void
  operating: boolean
}

function BulkBar({
  count, suppliers, categories,
  onQtyAdjust, onAssignSupplier, onAssignCategory,
  onDelete, onClear, operating,
}: BulkBarProps) {
  const [qtyInput, setQtyInput] = useState<string>('1')
  const [supplierInput, setSupplierInput] = useState('')
  const [categoryInput, setCategoryInput] = useState('')
  const [newCategoryInput, setNewCategoryInput] = useState('')
  const [showCatInput, setShowCatInput] = useState(false)
  const qty = Math.max(1, parseInt(qtyInput) || 1)

  return (
    <div className="bg-teal-900 text-white rounded-xl px-4 py-3 mb-4 animate-fade-in shadow-lg">
      <div className="flex flex-wrap items-center gap-3">
        {/* Selection count */}
        <span className="text-sm font-semibold text-teal-100 shrink-0">
          {count} item{count !== 1 ? 's' : ''} selected
        </span>

        <div className="w-px h-5 bg-teal-700 shrink-0 hidden sm:block" />

        {/* Qty delta input + Add/Subtract */}
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={qtyInput}
            onChange={e => setQtyInput(e.target.value)}
            min={1}
            className="w-14 h-7 px-2 text-xs font-semibold text-center border border-teal-700 bg-teal-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder-teal-500"
            placeholder="qty"
          />
          <button
            onClick={() => onQtyAdjust(+qty)}
            disabled={operating}
            className="h-7 px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors disabled:opacity-50"
          >
            + Add stock
          </button>
          <button
            onClick={() => onQtyAdjust(-qty)}
            disabled={operating}
            className="h-7 px-2.5 text-xs font-semibold bg-teal-700 hover:bg-teal-600 text-white rounded-md transition-colors disabled:opacity-50"
          >
            − Subtract
          </button>
        </div>

        <div className="w-px h-5 bg-teal-700 shrink-0 hidden sm:block" />

        {/* Assign supplier */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <select
              value={supplierInput}
              onChange={e => setSupplierInput(e.target.value)}
              className="h-7 pl-2 pr-6 text-xs bg-teal-800 border border-teal-700 text-teal-100 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer min-w-[110px]"
            >
              <option value="">Assign supplier…</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-teal-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {supplierInput && (
            <button
              onClick={() => { onAssignSupplier(supplierInput); setSupplierInput('') }}
              disabled={operating}
              className="h-7 px-2.5 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-md transition-colors disabled:opacity-50"
            >
              Apply
            </button>
          )}
        </div>

        {/* Assign category */}
        <div className="flex items-center gap-1.5">
          {showCatInput ? (
            <>
              <input
                autoFocus
                value={newCategoryInput}
                onChange={e => setNewCategoryInput(e.target.value)}
                placeholder="Category name…"
                className="h-7 px-2 text-xs bg-teal-800 border border-teal-700 text-teal-100 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder-teal-500 w-32"
                onKeyDown={e => {
                  if (e.key === 'Enter' && newCategoryInput.trim()) {
                    onAssignCategory(newCategoryInput.trim())
                    setNewCategoryInput('')
                    setShowCatInput(false)
                  }
                  if (e.key === 'Escape') setShowCatInput(false)
                }}
              />
              {newCategoryInput.trim() && (
                <button
                  onClick={() => { onAssignCategory(newCategoryInput.trim()); setNewCategoryInput(''); setShowCatInput(false) }}
                  disabled={operating}
                  className="h-7 px-2.5 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-md transition-colors disabled:opacity-50"
                >
                  Apply
                </button>
              )}
              <button onClick={() => setShowCatInput(false)} className="text-teal-400 hover:text-white text-xs">✕</button>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <select
                  value={categoryInput}
                  onChange={e => setCategoryInput(e.target.value)}
                  className="h-7 pl-2 pr-6 text-xs bg-teal-800 border border-teal-700 text-teal-100 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer min-w-[120px]"
                >
                  <option value="">Assign category…</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__new__">+ New category…</option>
                </select>
                <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-teal-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {categoryInput && categoryInput !== '__new__' && (
                <button
                  onClick={() => { onAssignCategory(categoryInput); setCategoryInput('') }}
                  disabled={operating}
                  className="h-7 px-2.5 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-md transition-colors disabled:opacity-50"
                >
                  Apply
                </button>
              )}
              {categoryInput === '__new__' && (
                <button
                  onClick={() => { setCategoryInput(''); setShowCatInput(true) }}
                  className="h-7 px-2.5 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-md transition-colors"
                >
                  Enter name →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Spacer + Delete + Clear */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onDelete}
            disabled={operating}
            className="h-7 px-2.5 text-xs font-semibold text-red-300 hover:text-white hover:bg-red-700 border border-red-700/60 rounded-md transition-colors disabled:opacity-50"
          >
            Delete {count}
          </button>
          <button
            onClick={onClear}
            className="text-teal-400 hover:text-white text-xs font-medium transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Restock Inline ─────────────────────────────────────────────────────────
function RestockCell({ item, onRestock }: { item: Item; onRestock: (id: string, delta: number) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('1')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleOpen() {
    setOpen(true)
    setTimeout(() => inputRef.current?.select(), 50)
  }

  async function handleSave() {
    const delta = parseInt(value)
    if (!delta || isNaN(delta)) return
    setSaving(true)
    await onRestock(item.id, delta)
    setOpen(false)
    setValue('1')
    setSaving(false)
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline transition-colors"
      >
        +Stock
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="number"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setOpen(false) }}
        className="w-14 h-6 px-1.5 text-xs font-semibold text-center border border-emerald-400 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
        min={1}
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="h-6 px-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:opacity-50"
      >
        {saving ? '…' : '✓'}
      </button>
      <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs leading-none">✕</button>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ItemTable({ initialItems, suppliers }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Item>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [operatingBulk, setOperatingBulk] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Filter state
  const searchParams = useSearchParams()
  const router = useRouter()
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [filterStock, setFilterStock] = useState(
    searchParams.get('filter') === 'low' ? 'low' : ''
  )

  useEffect(() => {
    const filter = searchParams.get('filter')
    if (filter === 'low') setFilterStock('low')
  }, [searchParams])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('items-realtime-table')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setItems(prev => prev.map(item =>
            item.id === (payload.new as Item).id ? { ...item, ...(payload.new as Item) } : item
          ))
        } else if (payload.eventType === 'INSERT') {
          setItems(prev => {
            if (prev.some(i => i.id === (payload.new as Item).id)) return prev
            return [...prev, payload.new as Item]
          })
        } else if (payload.eventType === 'DELETE') {
          setItems(prev => prev.filter(i => i.id !== (payload.old as Item).id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))] as string[]

  const filteredItems = items.filter(item => {
    if (filterCategory && item.category !== filterCategory) return false
    if (filterSupplier && (item.supplier as any)?.id !== filterSupplier) return false
    if (filterStock === 'low') return item.quantity < item.min_stock_threshold && item.quantity > 0
    if (filterStock === 'out') return item.quantity === 0
    if (filterStock === 'ok') return item.quantity >= item.min_stock_threshold
    return true
  })

  const hasFilters = filterCategory || filterSupplier || filterStock
  function clearFilters() {
    setFilterCategory(''); setFilterSupplier(''); setFilterStock('')
    router.replace('/inventory')
  }

  // ── Inline edit ──
  function startEdit(item: Item) {
    setEditingId(item.id)
    setEditValues({
      name: item.name, icon: item.icon,
      quantity: item.quantity, min_stock_threshold: item.min_stock_threshold,
      unit: item.unit, category: item.category ?? '', supplier_id: item.supplier_id ?? '',
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const { data, error } = await supabase
      .from('items')
      .update({
        name: editValues.name, icon: editValues.icon,
        quantity: Number(editValues.quantity),
        min_stock_threshold: Number(editValues.min_stock_threshold),
        unit: editValues.unit, category: editValues.category || null,
        supplier_id: editValues.supplier_id || null,
      })
      .eq('id', id)
      .select('*, supplier:suppliers(id, name, phone, email)')
      .single()
    if (!error && data) {
      setItems(prev => prev.map(i => i.id === id ? data as Item : i))
      setEditingId(null)
    }
    setSaving(false)
  }

  function cancelEdit() { setEditingId(null); setEditValues({}) }

  // ── Restock (per-row) ──
  async function handleRestock(itemId: string, delta: number) {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const newQty = Math.max(0, item.quantity + delta)
    const { data, error } = await supabase
      .from('items').update({ quantity: newQty }).eq('id', itemId)
      .select('*, supplier:suppliers(id, name, phone, email)').single()
    if (!error && data) setItems(prev => prev.map(i => i.id === itemId ? data as Item : i))
  }

  // ── Single delete ──
  async function deleteItem(id: string) {
    if (!confirm('Delete this item from inventory?')) return
    await supabase.from('items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  // ── Selection ──
  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleAll() {
    setSelected(prev =>
      prev.size === filteredItems.length ? new Set() : new Set(filteredItems.map(i => i.id))
    )
  }

  // ── Bulk actions ──
  async function bulkQtyAdjust(delta: number) {
    setOperatingBulk(true)
    const ids = [...selected]
    await Promise.all(ids.map(async id => {
      const item = items.find(i => i.id === id)
      if (!item) return
      const newQty = Math.max(0, item.quantity + delta)
      const { data } = await supabase
        .from('items').update({ quantity: newQty }).eq('id', id)
        .select('*, supplier:suppliers(id, name, phone, email)').single()
      if (data) setItems(prev => prev.map(i => i.id === id ? data as Item : i))
    }))
    setOperatingBulk(false)
  }

  async function bulkAssignSupplier(supplierId: string) {
    setOperatingBulk(true)
    const ids = [...selected]
    await Promise.all(ids.map(async id => {
      const { data } = await supabase
        .from('items').update({ supplier_id: supplierId || null }).eq('id', id)
        .select('*, supplier:suppliers(id, name, phone, email)').single()
      if (data) setItems(prev => prev.map(i => i.id === id ? data as Item : i))
    }))
    setOperatingBulk(false)
  }

  async function bulkAssignCategory(category: string) {
    setOperatingBulk(true)
    const ids = [...selected]
    await Promise.all(ids.map(async id => {
      const { data } = await supabase
        .from('items').update({ category: category || null }).eq('id', id)
        .select('*, supplier:suppliers(id, name, phone, email)').single()
      if (data) setItems(prev => prev.map(i => i.id === id ? data as Item : i))
    }))
    setOperatingBulk(false)
  }

  async function bulkDelete() {
    if (!selected.size) return
    if (!confirm(`Permanently delete ${selected.size} item(s)?`)) return
    setOperatingBulk(true)
    await supabase.from('items').delete().in('id', [...selected])
    setItems(prev => prev.filter(i => !selected.has(i.id)))
    setSelected(new Set())
    setOperatingBulk(false)
  }

  // ── CSV ──
  function exportCSV() {
    const header = 'Name,Quantity,Unit,Min Threshold,Category,Supplier'
    const rows = items.map(i =>
      [i.name, i.quantity, i.unit, i.min_stock_threshold, i.category ?? '', (i.supplier as any)?.name ?? '']
        .map(v => `"${v}"`).join(',')
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'inventory.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async evt => {
      const lines = (evt.target?.result as string).split('\n').slice(1)
      for (const line of lines) {
        if (!line.trim()) continue
        const [name, icon, quantity, unit, minThreshold, category] = line.split(',').map(v => v.replace(/^"|"$/g, '').trim())
        if (!name) continue
        const { data } = await supabase
          .from('items').insert({ name, icon: icon || '📦', quantity: Number(quantity) || 0, unit: unit || 'units', min_stock_threshold: Number(minThreshold) || 5, category: category || null })
          .select('*, supplier:suppliers(id, name, phone, email)').single()
        if (data) setItems(prev => [...prev, data as Item])
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleAdd(values: Partial<Item>) {
    const { data, error } = await supabase
      .from('items').insert({
        name: values.name, icon: values.icon ?? '📦',
        quantity: Number(values.quantity ?? 0),
        min_stock_threshold: Number(values.min_stock_threshold ?? 5),
        unit: values.unit ?? 'units',
        category: values.category || null, supplier_id: values.supplier_id || null,
      })
      .select('*, supplier:suppliers(id, name, phone, email)').single()
    if (!error && data) { setItems(prev => [...prev, data as Item]); setShowModal(false) }
  }

  const allSelectedInView = filteredItems.length > 0 && filteredItems.every(i => selected.has(i.id))

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          id="add-item-btn"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
        <div className="flex-1" />
        <button onClick={exportCSV} className="h-8 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg transition-colors">Export CSV</button>
        <button onClick={() => fileInputRef.current?.click()} className="h-8 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg transition-colors">Import CSV</button>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={importCSV} className="hidden" />
      </div>

      {/* Bulk action bar — appears when rows are selected */}
      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          suppliers={suppliers}
          categories={categories}
          onQtyAdjust={bulkQtyAdjust}
          onAssignSupplier={bulkAssignSupplier}
          onAssignCategory={bulkAssignCategory}
          onDelete={bulkDelete}
          onClear={() => setSelected(new Set())}
          operating={operatingBulk}
        />
      )}

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 mb-4 flex flex-wrap gap-x-3 gap-y-2 items-center shadow-card">
        <Dropdown
          value={filterCategory}
          onChange={setFilterCategory}
          options={categories.map(c => ({ value: c, label: c }))}
          placeholder="All categories"
          size="sm"
        />
        <Dropdown
          value={filterSupplier}
          onChange={setFilterSupplier}
          options={suppliers.map(s => ({ value: s.id, label: s.name }))}
          placeholder="All suppliers"
          size="sm"
        />
        <div className="flex items-center gap-1">
          {(['', 'ok', 'low', 'out'] as const).map(val => (
            <button key={val} onClick={() => setFilterStock(val)}
              className={`h-7 px-2.5 text-xs font-medium rounded-md border transition-all ${
                filterStock === val
                  ? val === 'low' ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : val === 'out' ? 'bg-red-100 text-red-800 border-red-300'
                  : 'bg-teal-50 text-teal-800 border-teal-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}>
              {val === '' ? 'All' : val === 'ok' ? 'In stock' : val === 'low' ? 'Low stock' : 'Out'}
            </button>
          ))}
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="h-7 px-2.5 text-xs font-medium text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-md bg-white transition-colors">Clear</button>
        )}
        <span className="ml-auto text-xs text-slate-400 font-medium tabular-nums">
          {filteredItems.length}<span className="text-slate-300">/{items.length}</span>
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-3 py-3 w-9">
                <input type="checkbox" checked={allSelectedInView} onChange={toggleAll}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
              </th>
              <th className="px-3 py-3">Item name</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Qty</th>
              <th className="px-3 py-3">Unit</th>
              <th className="px-3 py-3 hidden md:table-cell">Min</th>
              <th className="px-3 py-3 hidden md:table-cell">Supplier</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map(item => {
              const isEditing = editingId === item.id
              const isLow = item.quantity > 0 && item.quantity < item.min_stock_threshold
              const isOut = item.quantity === 0

              return (
                <tr key={item.id} className={`transition-colors ${
                  selected.has(item.id) ? 'bg-teal-50/50'
                  : isEditing ? 'bg-slate-50'
                  : isOut && !isEditing ? 'bg-red-50/30 hover:bg-red-50/50'
                  : isLow && !isEditing ? 'bg-amber-50/25 hover:bg-amber-50/40'
                  : 'hover:bg-slate-50/60'
                }`}>
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                  </td>

                  {/* Name + Icon */}
                  <td className="px-3 py-2.5 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      {/* Stock dot */}
                      {!isEditing && (
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isOut ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-transparent'
                        }`} />
                      )}
                      {isEditing
                        ? <div className="space-y-2 w-full min-w-[200px]">
                            <input value={editValues.name ?? ''} onChange={e => setEditValues(p => ({ ...p, name: e.target.value }))}
                              className="w-full px-2 py-1 text-sm border border-teal-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white" />
                            <IconPicker
                              value={editValues.icon ?? 'box'}
                              onChange={id => setEditValues(p => ({ ...p, icon: id }))}
                            />
                          </div>
                        : <span className="text-sm">{item.name}</span>
                      }
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-3 py-2.5 text-slate-500 text-xs">
                    {isEditing
                      ? <input value={editValues.category ?? ''} onChange={e => setEditValues(p => ({ ...p, category: e.target.value }))}
                          className="w-full min-w-[90px] px-2 py-1 text-sm border border-teal-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white" placeholder="e.g. PPE" />
                      : item.category
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">{item.category}</span>
                        : <span className="text-slate-300">—</span>
                    }
                  </td>

                  {/* Qty */}
                  <td className="px-3 py-2.5">
                    {isEditing
                      ? <input type="number" value={editValues.quantity ?? 0} onChange={e => setEditValues(p => ({ ...p, quantity: Number(e.target.value) }))}
                          className="w-16 px-2 py-1 text-sm border border-teal-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white font-semibold" />
                      : <span className={`font-bold text-[13px] ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>{item.quantity}</span>
                    }
                  </td>

                  {/* Unit */}
                  <td className="px-3 py-2.5 text-slate-500 text-xs">
                    {isEditing
                      ? <input value={editValues.unit ?? ''} onChange={e => setEditValues(p => ({ ...p, unit: e.target.value }))}
                          className="w-16 px-2 py-1 text-sm border border-teal-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white" />
                      : item.unit
                    }
                  </td>

                  {/* Min */}
                  <td className="px-3 py-2.5 text-slate-500 text-xs hidden md:table-cell">
                    {isEditing
                      ? <input type="number" value={editValues.min_stock_threshold ?? 0} onChange={e => setEditValues(p => ({ ...p, min_stock_threshold: Number(e.target.value) }))}
                          className="w-14 px-2 py-1 text-sm border border-teal-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-center" />
                      : item.min_stock_threshold
                    }
                  </td>

                  {/* Supplier */}
                  <td className="px-3 py-2.5 text-slate-500 text-xs hidden md:table-cell">
                    {isEditing
                      ? <div className="relative">
                          <select value={editValues.supplier_id ?? ''} onChange={e => setEditValues(p => ({ ...p, supplier_id: e.target.value }))}
                            className="w-full min-w-[140px] appearance-none pl-2 pr-7 py-1 text-sm border border-teal-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white cursor-pointer">
                            <option value="">No supplier</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      : ((item.supplier as any)?.name ?? <span className="text-slate-300">—</span>)
                    }
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2.5 text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-1.5">
                        <button onClick={cancelEdit} className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors">Cancel</button>
                        <button onClick={() => saveEdit(item.id)} disabled={saving} className="px-2.5 py-1 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors disabled:opacity-50">
                          {saving ? '…' : 'Save'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-3">
                        <RestockCell item={item} onRestock={handleRestock} />
                        <button onClick={() => startEdit(item)} className="text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline transition-colors">Edit</button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                          aria-label="Delete item"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center bg-slate-50/50">
                  <div className="flex justify-center mb-4 text-slate-300">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-600">
                    {hasFilters ? 'No items match your filters' : 'No items configured'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {hasFilters
                      ? <button onClick={clearFilters} className="text-teal-700 hover:underline">Clear filters</button>
                      : 'Click "Add Item" to add stock to the inventory'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AddItemModal suppliers={suppliers} onClose={() => setShowModal(false)} onSave={handleAdd} />
      )}
    </>
  )
}
