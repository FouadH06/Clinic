'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Item, Supplier, Category, ItemSupplierJoin } from '@/lib/types'
import { createClient } from '@/lib/supabase'
import { consumeFifoLots } from '@/lib/fifo'
import AddItemModal from './AddItemModal'
import ManageCategoriesModal from './ManageCategoriesModal'
import Dropdown from '@/components/ui/Dropdown'
import IconPicker, { IconPopoverTrigger } from '@/components/ui/IconPicker'
import SupplierMultiSelect from '@/components/ui/SupplierMultiSelect'
import { createPortal } from 'react-dom'

interface Props {
  initialItems:   Item[]
  suppliers:      Supplier[]
  initialCategories: Category[]
  latestCostMap?: Record<string, number>   // kept for type compat — unused
  fifoValueMap?:  Record<string, number>   // FIFO item value (sum of lot.qty_remaining × lot.cost)
}

// ─── Bulk delete confirmation dialog ──────────────────────────────────────────
function BulkDeleteDialog({
  count,
  onConfirm,
  onCancel,
}: {
  count: number
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-sm animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg className="w-4.5 h-4.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Delete {count} item{count !== 1 ? 's' : ''}?</p>
            <p className="text-xs text-slate-500 mt-0.5">This cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Delete {count}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Bulk Action Bar ────────────────────────────────────────────────────────
interface BulkBarProps {
  count:        number
  suppliers:    Supplier[]
  categories:   Category[]
  /** null = mixed icons across selected items */
  currentIcon:  string | null
  onQtyAdjust:       (delta: number) => void
  onAssignSupplier:  (id: string)    => void
  onAssignCategory:  (name: string)  => void
  onAssignIcon:      (icon: string)  => void
  onDelete:   () => void
  onClear:    () => void
  operating:  boolean
}

function BulkBar({
  count, suppliers, categories, currentIcon,
  onQtyAdjust, onAssignSupplier, onAssignCategory, onAssignIcon,
  onDelete, onClear, operating,
}: BulkBarProps) {
  const [qtyInput,      setQtyInput]      = useState<string>('1')
  const [supplierInput, setSupplierInput] = useState('')
  const [categoryInput, setCategoryInput] = useState('')
  const qty = Math.max(1, parseInt(qtyInput) || 1)

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 mb-4 animate-fade-in shadow-sm overflow-visible">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">

        {/* Selection count */}
        <span className="text-xs font-semibold text-slate-700 shrink-0">
          {count} selected
        </span>

        <div className="w-px h-4 bg-slate-200 shrink-0 hidden sm:block" />

        {/* Qty input + Add / Remove */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-slate-400 mr-0.5">Qty</span>
          <input
            type="number"
            value={qtyInput}
            onChange={e => setQtyInput(e.target.value)}
            min={1}
            className="w-12 h-7 px-2 text-xs font-semibold text-center border border-slate-200 bg-white text-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-slate-300 transition-colors"
          />
          <button
            onClick={() => onQtyAdjust(+qty)}
            disabled={operating}
            className="h-7 px-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors disabled:opacity-50"
          >
            + Add
          </button>
          <button
            onClick={() => onQtyAdjust(-qty)}
            disabled={operating}
            className="h-7 px-2.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 rounded-md transition-colors disabled:opacity-50"
          >
            − Remove
          </button>
        </div>

        <div className="w-px h-4 bg-slate-200 shrink-0 hidden sm:block" />

        {/* Assign supplier — portal Dropdown, same as filter bar */}
        <div className="flex items-center gap-1.5">
          <Dropdown
            value={supplierInput}
            onChange={setSupplierInput}
            options={suppliers.map(s => ({ value: s.id, label: s.name }))}
            placeholder="Assign supplier…"
            size="sm"
          />
          {supplierInput && (
            <button
              onClick={() => { onAssignSupplier(supplierInput); setSupplierInput('') }}
              disabled={operating}
              className="h-7 px-2.5 text-xs font-semibold text-teal-700 border border-teal-300 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors disabled:opacity-50"
            >
              Apply
            </button>
          )}
        </div>

        {/* Assign category — portal Dropdown, same as filter bar */}
        <div className="flex items-center gap-1.5">
          <Dropdown
            value={categoryInput}
            onChange={setCategoryInput}
            options={categories.map(c => ({ value: c.name, label: c.name }))}
            placeholder="Assign category…"
            size="sm"
          />
          {categoryInput && (
            <button
              onClick={() => { onAssignCategory(categoryInput); setCategoryInput('') }}
              disabled={operating}
              className="h-7 px-2.5 text-xs font-semibold text-teal-700 border border-teal-300 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors disabled:opacity-50"
            >
              Apply
            </button>
          )}
        </div>

        {/* Set icon — portal popover; reflects shared icon or mixed state */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-slate-400">Icon</span>
          {currentIcon === null ? (
            // Mixed icons across selection — show neutral trigger
            <IconPopoverTrigger
              value="box"
              onChange={onAssignIcon}
              mixedState
            />
          ) : (
            <IconPopoverTrigger
              value={currentIcon}
              onChange={onAssignIcon}
            />
          )}
        </div>

        {/* Delete (plain red text) + Clear (muted gray text) — right-aligned */}
        <div className="flex items-center gap-4 ml-auto">
          <button
            onClick={onDelete}
            disabled={operating}
            className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
          >
            Delete {count}
          </button>
          <button
            onClick={onClear}
            className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            Clear
          </button>
        </div>

      </div>
    </div>
  )
}


// ─── Supplier multi-select (inline edit row) ────────────────────────────────
// Shared component — see src/components/ui/SupplierMultiSelect.tsx

// ─── Quick +Stock cell ───────────────────────────────────────────────────────────────────
function QuickStockCell({ item, onAdd }: { item: Item; onAdd: (id: string, delta: number) => Promise<void> }) {
  const [open,   setOpen]   = useState(false)
  const [value,  setValue]  = useState('1')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleOpen() {
    setOpen(true)
    setTimeout(() => inputRef.current?.select(), 50)
  }

  async function handleSave() {
    const delta = parseInt(value)
    if (!delta || isNaN(delta) || delta <= 0) return
    setSaving(true)
    await onAdd(item.id, delta)
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
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="number"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setOpen(false) }}
        placeholder="Add qty"
        className="w-20 h-7 px-2 text-xs font-semibold text-center border border-emerald-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white hover:border-emerald-400 transition-colors"
        min={1}
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="h-7 px-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:opacity-50"
      >
        {saving ? '…' : 'Add'}
      </button>
      <button
        onClick={() => setOpen(false)}
        className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ItemTable({ initialItems, suppliers, initialCategories, latestCostMap = {}, fifoValueMap = {} }: Props) {
  const [items,      setItems]      = useState<Item[]>(initialItems)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Item>>({})
  /** IDs of suppliers selected in the inline edit row (multi-supplier) */
  const [editSupplierIds, setEditSupplierIds] = useState<Set<string>>(new Set())
  const [selected,   setSelected]   = useState<Set<string>>(new Set())
  const [showModal,         setShowModal]         = useState(false)
  const [showCatModal,      setShowCatModal]      = useState(false)
  const [showBulkDelDialog, setShowBulkDelDialog] = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [operatingBulk,  setOperatingBulk]  = useState(false)
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

  // Item counts per category (for manage modal)
  const itemCounts: Record<string, number> = {}
  for (const item of items) {
    if (item.category) itemCounts[item.category] = (itemCounts[item.category] ?? 0) + 1
  }

  /**
   * effectiveCategories — the list used everywhere in the UI.
   * Priority: managed table (categories state) > derived from items.
   * This means the page works correctly before the SQL migration is run:
   * existing item.category strings are surfaced as options automatically.
   */
  const effectiveCategories: Category[] = categories.length > 0
    ? categories
    : [...new Set(items.map(i => i.category).filter(Boolean))]
        .sort()
        .map((name, idx) => ({ id: `derived-${idx}`, name: name as string }))

  const filteredItems = items.filter(item => {
    if (filterCategory && item.category !== filterCategory) return false
    if (filterSupplier && (item.supplier as any)?.id !== filterSupplier) return false
    if (filterStock === 'low') return item.quantity < item.min_stock_threshold && item.quantity > 0
    if (filterStock === 'out') return item.quantity === 0
    if (filterStock === 'ok')  return item.quantity >= item.min_stock_threshold
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
      unit: item.unit, category: item.category ?? '',
    })
    // Seed multi-supplier state from item_suppliers junction data
    const existingIds = ((item.item_suppliers ?? []) as ItemSupplierJoin[])
      .map(is => is.supplier_id)
      .filter(Boolean)
    setEditSupplierIds(new Set(existingIds))
  }

  async function saveEdit(id: string) {
    setSaving(true)

    // 1. Save scalar fields on items table
    const { data, error } = await supabase
      .from('items')
      .update({
        name: editValues.name, icon: editValues.icon,
        quantity: Number(editValues.quantity),
        min_stock_threshold: Number(editValues.min_stock_threshold),
        unit: editValues.unit, category: editValues.category || null,
      })
      .eq('id', id)
      .select('*, item_suppliers(id, supplier_id, supplier:suppliers(id, name, phone, email, notes))')
      .single()

    if (!error && data) {
      // If quantity was reduced, consume FIFO lots for the difference
      const oldQty = items.find(i => i.id === id)?.quantity ?? 0
      const newQty = Number(editValues.quantity)
      if (newQty < oldQty) {
        const deducted = oldQty - newQty
        console.log(`[FIFO] Inline edit reduced qty by ${deducted} on item ${id}`)
        await consumeFifoLots(supabase, id, deducted)
      }

      // 2. Diff supplier changes against the junction table
      const existing = ((data as any).item_suppliers ?? []) as ItemSupplierJoin[]
      const existingIds = new Set(existing.map((is: ItemSupplierJoin) => is.supplier_id))
      const wantedIds   = editSupplierIds

      // Delete removed suppliers
      const toRemove = existing.filter(is => !wantedIds.has(is.supplier_id))
      if (toRemove.length) {
        await supabase.from('item_suppliers').delete().in('id', toRemove.map(is => is.id))
      }

      // Insert newly added suppliers
      const toAdd = [...wantedIds].filter(sid => !existingIds.has(sid))
      if (toAdd.length) {
        await supabase.from('item_suppliers').insert(toAdd.map(sid => ({ item_id: id, supplier_id: sid })))
      }

      // Re-fetch the item with fresh junction data
      const { data: fresh } = await supabase
        .from('items')
        .select('*, item_suppliers(id, supplier_id, supplier:suppliers(id, name, phone, email, notes))')
        .eq('id', id)
        .single()

      if (fresh) setItems(prev => prev.map(i => i.id === id ? fresh as Item : i))
      setEditingId(null)
    }
    setSaving(false)
  }

  function cancelEdit() { setEditingId(null); setEditValues({}); setEditSupplierIds(new Set()) }

  // ── Quick +Stock (no full edit mode) ──
  async function handleQuickAdd(itemId: string, delta: number) {
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
      // If this was a deduction, consume FIFO lots
      if (delta < 0) {
        const actualDeducted = item.quantity - newQty  // how much was actually removed
        if (actualDeducted > 0) {
          console.log(`[FIFO] Bulk adjust deducted ${actualDeducted} from item ${id}`)
          await consumeFifoLots(supabase, id, actualDeducted)
        }
      }
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

  async function bulkDeleteConfirmed() {
    setShowBulkDelDialog(false)
    setOperatingBulk(true)
    await supabase.from('items').delete().in('id', [...selected])
    setItems(prev => prev.filter(i => !selected.has(i.id)))
    setSelected(new Set())
    setOperatingBulk(false)
  }

  async function bulkAssignIcon(icon: string) {
    setOperatingBulk(true)
    const ids = [...selected]
    await Promise.all(ids.map(async id => {
      const { data } = await supabase
        .from('items').update({ icon }).eq('id', id)
        .select('*, supplier:suppliers(id, name, phone, email)').single()
      if (data) setItems(prev => prev.map(i => i.id === id ? data as Item : i))
    }))
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

  async function handleAdd(values: Partial<Item>, supplierIds: Set<string>) {
    const { data, error } = await supabase
      .from('items').insert({
        name: values.name, icon: values.icon ?? '📦',
        quantity: 0,
        min_stock_threshold: Number(values.min_stock_threshold ?? 5),
        unit: values.unit ?? 'units',
        category: values.category || null,
      })
      .select('*, item_suppliers(id, supplier_id, supplier:suppliers(id, name, phone, email, notes))')
      .single()
    if (!error && data) {
      // Write junction records for each selected supplier
      if (supplierIds.size > 0) {
        await supabase.from('item_suppliers').insert(
          [...supplierIds].map(sid => ({ item_id: (data as any).id, supplier_id: sid }))
        )
        // Re-fetch with fresh junction data
        const { data: fresh } = await supabase
          .from('items')
          .select('*, item_suppliers(id, supplier_id, supplier:suppliers(id, name, phone, email, notes))')
          .eq('id', (data as any).id)
          .single()
        if (fresh) { setItems(prev => [...prev, fresh as Item]); setShowModal(false); return }
      }
      setItems(prev => [...prev, data as Item])
      setShowModal(false)
    }
  }

  // Checkbox states
  const allSelectedInView   = filteredItems.length > 0 && filteredItems.every(i => selected.has(i.id))
  const someSelectedInView  = filteredItems.some(i => selected.has(i.id)) && !allSelectedInView

  /**
   * currentIcon — for the bulk icon trigger.
   * If all selected items share the same icon → that icon.
   * If they differ → null (mixed state).
   */
  const currentIcon = useMemo(() => {
    if (selected.size === 0) return 'box'
    const selectedItems = items.filter(i => selected.has(i.id))
    const icons = [...new Set(selectedItems.map(i => i.icon ?? 'box'))]
    return icons.length === 1 ? icons[0] : null
  }, [selected, items])

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

        {/* Manage categories — secondary action */}
        <button
          id="manage-categories-btn"
          onClick={() => setShowCatModal(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 text-xs font-medium rounded-lg transition-colors"
        >
          <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 12h.01M7 17h.01M11 7h6M11 12h6M11 17h6" />
          </svg>
          Categories
        </button>

        <div className="flex-1" />
        <button onClick={exportCSV} className="h-8 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg transition-colors">Export CSV</button>
        <button onClick={() => fileInputRef.current?.click()} className="h-8 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg transition-colors">Import CSV</button>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={importCSV} className="hidden" />
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          suppliers={suppliers}
          categories={effectiveCategories}
          currentIcon={currentIcon}
          onQtyAdjust={bulkQtyAdjust}
          onAssignSupplier={bulkAssignSupplier}
          onAssignCategory={bulkAssignCategory}
          onAssignIcon={bulkAssignIcon}
          onDelete={() => setShowBulkDelDialog(true)}
          onClear={() => setSelected(new Set())}
          operating={operatingBulk}
        />
      )}

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 mb-4 flex flex-wrap gap-x-3 gap-y-2 items-center shadow-card">
        <Dropdown
          value={filterCategory}
          onChange={setFilterCategory}
          options={effectiveCategories.map(c => ({ value: c.name, label: c.name }))}
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
                <input
                  type="checkbox"
                  checked={allSelectedInView}
                  ref={el => { if (el) el.indeterminate = someSelectedInView }}
                  onChange={toggleAll}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
              </th>
              <th className="px-3 py-3">Item name</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Qty</th>
              <th className="px-3 py-3">Unit</th>
              <th className="px-3 py-3 hidden md:table-cell">Min</th>
              <th className="px-3 py-3 hidden md:table-cell">Supplier</th>
              <th className="px-3 py-3 hidden lg:table-cell">Value</th>
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
                      {!isEditing && (
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isOut ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-transparent'
                        }`} />
                      )}
                      {isEditing
                        ? <div className="flex items-center gap-2 w-full min-w-[200px]">
                            {/* Icon popover — floats, does not push rows down */}
                            <IconPopoverTrigger
                              value={editValues.icon ?? 'box'}
                              onChange={id => setEditValues(p => ({ ...p, icon: id }))}
                            />
                            <input
                              value={editValues.name ?? ''}
                              onChange={e => setEditValues(p => ({ ...p, name: e.target.value }))}
                              className="flex-1 px-2 py-1 text-sm border border-teal-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                            />
                          </div>
                        : <span className="text-sm">{item.name}</span>
                      }
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-3 py-2.5 text-slate-500 text-xs">
                    {isEditing
                      ? <Dropdown
                          value={editValues.category ?? ''}
                          onChange={v => setEditValues(p => ({ ...p, category: v }))}
                          options={effectiveCategories.map(c => ({ value: c.name, label: c.name }))}
                          placeholder="No category"
                          size="sm"
                        />
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

                  {/* Supplier — multi-select (junction table) */}
                  <td className="px-3 py-2.5 text-slate-500 text-xs hidden md:table-cell">
                    {isEditing
                      ? <SupplierMultiSelect
                          suppliers={suppliers}
                          selectedIds={editSupplierIds}
                          onChange={setEditSupplierIds}
                        />
                      : (() => {
                          const assigned = (item.item_suppliers as any[])
                          const names = assigned?.map((is: any) => is.supplier?.name).filter(Boolean) ?? []
                          return names.length > 0
                            ? <span>{names.join(', ')}</span>
                            : <span className="text-slate-300">—</span>
                        })()
                    }
                  </td>

                  {/* Value — FIFO lot-based: sum(qty_remaining × cost) for all active lots */}
                  <td className="px-3 py-2.5 text-slate-600 text-xs tabular-nums hidden lg:table-cell">
                    {(() => {
                      const val = fifoValueMap[item.id]
                      if (val === undefined || val === null) return (
                        <span
                          className="text-slate-300 cursor-help"
                          title="No FIFO lot data yet — run migration 005 in Supabase"
                        >—</span>
                      )
                      if (val === 0) return (
                        <span className="text-slate-300 cursor-help" title="All lots have zero cost">—</span>
                      )
                      return (
                        <span className="font-medium">
                          ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )
                    })()}
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
                        {/* Quick +Stock — does NOT open edit mode */}
                        <QuickStockCell item={item} onAdd={handleQuickAdd} />
                        <button onClick={() => router.push(`/inventory/${item.id}`)} className="text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline transition-colors">Details</button>
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
                <td colSpan={9} className="px-4 py-16 text-center bg-slate-50/50">
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

      {/* Modals */}
      {showModal && (
        <AddItemModal
          suppliers={suppliers}
          categories={effectiveCategories}
          onClose={() => setShowModal(false)}
          onSave={handleAdd}
        />
      )}

      {showCatModal && (
        <ManageCategoriesModal
          categories={effectiveCategories}
          itemCounts={itemCounts}
          onClose={() => setShowCatModal(false)}
          onChange={updated => setCategories(updated)}
        />
      )}

      {showBulkDelDialog && (
        <BulkDeleteDialog
          count={selected.size}
          onConfirm={bulkDeleteConfirmed}
          onCancel={() => setShowBulkDelDialog(false)}
        />
      )}
    </>
  )
}
