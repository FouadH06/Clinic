'use client'

import { useState } from 'react'
import { Item, Supplier } from '@/lib/types'
import IconPicker from '@/components/ui/IconPicker'

interface Props {
  suppliers: Supplier[]
  onClose: () => void
  onSave: (values: Partial<Item>) => void
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-slate-500 mb-1.5">{children}</label>
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400 transition-colors hover:border-slate-300"
    />
  )
}

export default function AddItemModal({ suppliers, onClose, onSave }: Props) {
  const [values, setValues] = useState<Partial<Item>>({
    icon: 'box',
    name: '',
    quantity: 0,
    min_stock_threshold: 5,
    unit: 'units',
    category: '',
    supplier_id: '',
  })
  const [saving, setSaving] = useState(false)

  function set(field: keyof Item, value: unknown) {
    setValues(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!values.name?.trim()) return
    setSaving(true)
    await onSave(values)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Add New Item</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[75vh]">
          <div className="space-y-4">
            {/* Item name */}
            <div>
              <Label>Item name *</Label>
              <Input
                id="new-item-name"
                value={values.name ?? ''}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Latex Gloves"
                autoFocus
              />
            </div>

            {/* Icon picker */}
            <div>
              <Label>Icon</Label>
              <IconPicker
                value={values.icon ?? 'box'}
                onChange={id => set('icon', id)}
              />
            </div>

            {/* Qty + Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={values.quantity ?? 0}
                  onChange={e => set('quantity', Number(e.target.value))}
                  min={0}
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Input
                  value={values.unit ?? ''}
                  onChange={e => set('unit', e.target.value)}
                  placeholder="boxes, units…"
                />
              </div>
            </div>

            {/* Min threshold + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min stock threshold</Label>
                <Input
                  type="number"
                  value={values.min_stock_threshold ?? 5}
                  onChange={e => set('min_stock_threshold', Number(e.target.value))}
                  min={0}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={values.category ?? ''}
                  onChange={e => set('category', e.target.value)}
                  placeholder="PPE, Tools…"
                />
              </div>
            </div>

            {/* Supplier */}
            <div>
              <Label>Supplier</Label>
              <div className="relative">
                <select
                  value={values.supplier_id ?? ''}
                  onChange={e => set('supplier_id', e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 pr-9 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-slate-800 hover:border-slate-300 transition-colors cursor-pointer"
                >
                  <option value="">No supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            id="add-item-save"
            onClick={handleSave}
            disabled={!values.name?.trim() || saving}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  )
}
