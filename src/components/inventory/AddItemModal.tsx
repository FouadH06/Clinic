'use client'

import { useState } from 'react'
import { Item, Supplier } from '@/lib/types'

interface Props {
  suppliers: Supplier[]
  onClose: () => void
  onSave: (values: Partial<Item>) => void
}

const COMMON_EMOJIS = ['🦷','🧤','😷','💉','🩺','💊','🩹','🧴','📋','🧪','🔬','🩻','🧽','🫙','📦']

export default function AddItemModal({ suppliers, onClose, onSave }: Props) {
  const [values, setValues] = useState<Partial<Item>>({
    icon: '📦',
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] animate-slide-up md:animate-fade-in">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Add New Item</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">✕</button>
          </div>

          <div className="space-y-4">
            {/* Emoji picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {COMMON_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => set('icon', emoji)}
                    className={`text-2xl w-10 h-10 rounded-xl border-2 transition-all ${values.icon === emoji ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <input
                value={values.icon ?? ''}
                onChange={e => set('icon', e.target.value)}
                placeholder="Or type any emoji…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Item Name *</label>
              <input
                id="new-item-name"
                value={values.name ?? ''}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Latex Gloves"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
              />
            </div>

            {/* Qty + Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
                <input
                  type="number"
                  value={values.quantity ?? 0}
                  onChange={e => set('quantity', Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
                <input
                  value={values.unit ?? ''}
                  onChange={e => set('unit', e.target.value)}
                  placeholder="boxes, units…"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
                />
              </div>
            </div>

            {/* Min threshold + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Stock</label>
                <input
                  type="number"
                  value={values.min_stock_threshold ?? 5}
                  onChange={e => set('min_stock_threshold', Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <input
                  value={values.category ?? ''}
                  onChange={e => set('category', e.target.value)}
                  placeholder="e.g. PPE, Tools…"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
                />
              </div>
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier</label>
              <select
                value={values.supplier_id ?? ''}
                onChange={e => set('supplier_id', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm bg-white"
              >
                <option value="">No supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors">
              Cancel
            </button>
            <button
              id="add-item-save"
              onClick={handleSave}
              disabled={!values.name?.trim() || saving}
              className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors shadow-md disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Add Item'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
