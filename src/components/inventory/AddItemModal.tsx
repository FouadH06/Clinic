'use client'

import { useState } from 'react'
import { Item, Supplier, Category } from '@/lib/types'
import { Unit } from './ManageUnitsModal'
import IconPicker from '@/components/ui/IconPicker'
import Dropdown from '@/components/ui/Dropdown'
import SupplierMultiSelect from '@/components/ui/SupplierMultiSelect'

interface Props {
  suppliers:  Supplier[]
  categories: Category[]
  units?:     Unit[]
  onClose: () => void
  /** values carries the scalar fields; supplierIds carries the junction-table selections */
  onSave: (values: Partial<Item>, supplierIds: Set<string>) => void
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

export default function AddItemModal({ suppliers, categories, units = [], onClose, onSave }: Props) {
  const [values, setValues] = useState<Partial<Item>>({
    icon: 'box',
    name: '',
    unit: 'units',
    category: '',
  })
  // Store numeric fields as strings so inputs are free-form (no leading-zero and no pre-fill)
  const [threshold, setThreshold] = useState('')
  const [supplierIds, setSupplierIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  function set(field: keyof Item, value: unknown) {
    setValues(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!values.name?.trim()) return
    setSaving(true)
    await onSave({
      ...values,
      quantity: 0,
      min_stock_threshold: threshold === '' ? 0 : Math.max(0, parseInt(threshold, 10) || 0),
    }, supplierIds)
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

            {/* Supplier + Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Supplier(s)</Label>
                <SupplierMultiSelect
                  suppliers={suppliers}
                  selectedIds={supplierIds}
                  onChange={setSupplierIds}
                  size="md"
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Dropdown
                  value={values.unit ?? 'units'}
                  onChange={v => set('unit', v)}
                  options={
                    units.length > 0
                      ? units.map(u => ({ value: u.name, label: u.name }))
                      : [
                          { value: 'units', label: 'Units' },
                          { value: 'boxes', label: 'Boxes' },
                        ]
                  }
                  size="md"
                />
              </div>
            </div>

            {/* Min threshold + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min stock threshold</Label>
                <Input
                  type="number"
                  value={threshold}
                  onChange={e => setThreshold(e.target.value)}
                  placeholder="e.g. 5"
                  min={0}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Dropdown
                  value={values.category ?? ''}
                  onChange={v => set('category', v)}
                  options={categories.map(c => ({ value: c.name, label: c.name }))}
                  placeholder="No category"
                  size="md"
                />
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
