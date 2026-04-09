'use client'

import { useState, useRef } from 'react'
import { Item, Supplier } from '@/lib/types'
import { createClient } from '@/lib/supabase'
import AddItemModal from './AddItemModal'

interface Props {
  initialItems: Item[]
  suppliers: Supplier[]
}

export default function ItemTable({ initialItems, suppliers }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Item>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Inline edit helpers
  function startEdit(item: Item) {
    setEditingId(item.id)
    setEditValues({
      name: item.name,
      icon: item.icon,
      quantity: item.quantity,
      min_stock_threshold: item.min_stock_threshold,
      unit: item.unit,
      category: item.category ?? '',
      supplier_id: item.supplier_id ?? '',
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const { data, error } = await supabase
      .from('items')
      .update({
        name: editValues.name,
        icon: editValues.icon,
        quantity: Number(editValues.quantity),
        min_stock_threshold: Number(editValues.min_stock_threshold),
        unit: editValues.unit,
        category: editValues.category || null,
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

  function cancelEdit() {
    setEditingId(null)
    setEditValues({})
  }

  // Selection
  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(prev =>
      prev.size === items.length
        ? new Set()
        : new Set(items.map(i => i.id))
    )
  }

  async function bulkDelete() {
    if (!selected.size) return
    if (!confirm(`Delete ${selected.size} item(s)?`)) return
    setDeleting(true)
    await supabase.from('items').delete().in('id', [...selected])
    setItems(prev => prev.filter(i => !selected.has(i.id)))
    setSelected(new Set())
    setDeleting(false)
  }

  // Add item
  async function handleAdd(values: Partial<Item>) {
    const { data, error } = await supabase
      .from('items')
      .insert({
        name: values.name,
        icon: values.icon ?? '📦',
        quantity: Number(values.quantity ?? 0),
        min_stock_threshold: Number(values.min_stock_threshold ?? 5),
        unit: values.unit ?? 'units',
        category: values.category || null,
        supplier_id: values.supplier_id || null,
      })
      .select('*, supplier:suppliers(id, name, phone, email)')
      .single()

    if (!error && data) {
      setItems(prev => [...prev, data as Item])
      setShowModal(false)
    }
  }

  // CSV Export
  function exportCSV() {
    const header = 'Name,Icon,Quantity,Unit,Min Threshold,Category,Supplier'
    const rows = items.map(i =>
      [i.name, i.icon, i.quantity, i.unit, i.min_stock_threshold, i.category ?? '', (i.supplier as any)?.name ?? '']
        .map(v => `"${v}"`).join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventory.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // CSV Import
  function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async evt => {
      const text = evt.target?.result as string
      const lines = text.split('\n').slice(1) // skip header
      for (const line of lines) {
        if (!line.trim()) continue
        const [name, icon, quantity, unit, minThreshold, category] = line
          .split(',')
          .map(v => v.replace(/^"|"$/g, '').trim())
        if (!name) continue
        const { data } = await supabase
          .from('items')
          .insert({ name, icon: icon || '📦', quantity: Number(quantity) || 0, unit: unit || 'units', min_stock_threshold: Number(minThreshold) || 5, category: category || null })
          .select('*, supplier:suppliers(id, name, phone, email)')
          .single()
        if (data) setItems(prev => [...prev, data as Item])
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const editField = (field: keyof Item, width = 'w-24') => (
    editingId ? (
      <input
        value={String(editValues[field] ?? '')}
        onChange={e => setEditValues(prev => ({ ...prev, [field]: e.target.value }))}
        className={`${width} px-2 py-1 text-sm border border-teal-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white`}
      />
    ) : null
  )

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          id="add-item-btn"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition-colors shadow"
        >
          + Add Item
        </button>
        {selected.size > 0 && (
          <button
            onClick={bulkDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            🗑 Delete {selected.size}
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-sm rounded-xl transition-colors"
        >
          ⬇ Export CSV
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-sm rounded-xl transition-colors"
        >
          ⬆ Import CSV
        </button>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={importCSV} className="hidden" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl card-shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selected.size === items.length && items.length > 0}
                  onChange={toggleAll}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
              </th>
              <th className="px-4 py-3">Icon</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Min Stock</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(item => {
              const isEditing = editingId === item.id
              const isLow = item.quantity < item.min_stock_threshold
              return (
                <tr
                  key={item.id}
                  className={`transition-colors ${selected.has(item.id) ? 'bg-teal-50' : isLow ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-gray-50/60'}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {isEditing
                      ? <input value={editValues.icon ?? ''} onChange={e => setEditValues(p => ({ ...p, icon: e.target.value }))} className="w-14 px-2 py-1 text-center border border-teal-400 rounded-lg text-lg" />
                      : <span className="text-2xl">{item.icon}</span>
                    }
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {isEditing
                      ? <input value={editValues.name ?? ''} onChange={e => setEditValues(p => ({ ...p, name: e.target.value }))} className="w-36 px-2 py-1 border border-teal-400 rounded-lg text-sm" />
                      : item.name
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {isEditing
                      ? <input value={editValues.category ?? ''} onChange={e => setEditValues(p => ({ ...p, category: e.target.value }))} className="w-28 px-2 py-1 border border-teal-400 rounded-lg text-sm" placeholder="e.g. PPE" />
                      : item.category ?? <span className="text-gray-300">—</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${isLow ? 'text-red-500' : 'text-teal-600'}`}>
                      {isEditing
                        ? <input type="number" value={editValues.quantity ?? 0} onChange={e => setEditValues(p => ({ ...p, quantity: Number(e.target.value) }))} className="w-16 px-2 py-1 border border-teal-400 rounded-lg text-sm" />
                        : item.quantity
                      }
                    </span>
                    {isLow && !isEditing && <span className="ml-1 text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">LOW</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {isEditing
                      ? <input value={editValues.unit ?? ''} onChange={e => setEditValues(p => ({ ...p, unit: e.target.value }))} className="w-20 px-2 py-1 border border-teal-400 rounded-lg text-sm" />
                      : item.unit
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {isEditing
                      ? <input type="number" value={editValues.min_stock_threshold ?? 0} onChange={e => setEditValues(p => ({ ...p, min_stock_threshold: Number(e.target.value) }))} className="w-16 px-2 py-1 border border-teal-400 rounded-lg text-sm" />
                      : item.min_stock_threshold
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {isEditing
                      ? (
                        <select
                          value={editValues.supplier_id ?? ''}
                          onChange={e => setEditValues(p => ({ ...p, supplier_id: e.target.value }))}
                          className="w-32 px-2 py-1 border border-teal-400 rounded-lg text-sm"
                        >
                          <option value="">None</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      )
                      : ((item.supplier as any)?.name ?? <span className="text-gray-300">—</span>)
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => saveEdit(item.id)} disabled={saving} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors">
                          {saving ? '…' : 'Save'}
                        </button>
                        <button onClick={cancelEdit} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg transition-colors">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(item)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-teal-600 hover:bg-teal-50 font-medium rounded-lg transition-colors">
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-gray-400">
                  <div className="text-4xl mb-2">📦</div>
                  <p className="font-medium">No items yet — click "Add Item" to get started</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
      {showModal && (
        <AddItemModal
          suppliers={suppliers}
          onClose={() => setShowModal(false)}
          onSave={handleAdd}
        />
      )}
    </>
  )
}
