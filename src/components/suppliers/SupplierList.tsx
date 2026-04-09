'use client'

import { useState } from 'react'
import { Supplier, Item } from '@/lib/types'
import { createClient } from '@/lib/supabase'

// Defined at module scope so React never recreates the component type on re-render
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 text-sm border border-teal-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
      />
    </div>
  )
}

interface SupplierWithItems extends Supplier {
  items?: Pick<Item, 'id' | 'name' | 'icon'>[]
}

interface Props {
  initialSuppliers: SupplierWithItems[]
}

const EMPTY: Partial<Supplier> = { name: '', phone: '', email: '', notes: '' }

export default function SupplierList({ initialSuppliers }: Props) {
  const [suppliers, setSuppliers] = useState<SupplierWithItems[]>(initialSuppliers)
  const [editing, setEditing] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Supplier>>(EMPTY)
  const [showAdd, setShowAdd] = useState(false)
  const [newVals, setNewVals] = useState<Partial<Supplier>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  function set<K extends keyof Supplier>(field: K, value: string, target: 'edit' | 'new') {
    if (target === 'edit') setEditValues(p => ({ ...p, [field]: value }))
    else setNewVals(p => ({ ...p, [field]: value }))
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const { data } = await supabase
      .from('suppliers')
      .update({ name: editValues.name, phone: editValues.phone || null, email: editValues.email || null, notes: editValues.notes || null })
      .eq('id', id)
      .select()
      .single()
    if (data) setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
    setEditing(null)
    setSaving(false)
  }

  async function deleteSupplier(id: string) {
    if (!confirm('Delete this supplier? Items linked to them will lose the supplier reference.')) return
    await supabase.from('suppliers').delete().eq('id', id)
    setSuppliers(prev => prev.filter(s => s.id !== id))
  }

  async function addSupplier() {
    if (!newVals.name?.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from('suppliers')
      .insert({ name: newVals.name, phone: newVals.phone || null, email: newVals.email || null, notes: newVals.notes || null })
      .select()
      .single()
    if (data) setSuppliers(prev => [...prev, { ...data, items: [] }])
    setNewVals(EMPTY)
    setShowAdd(false)
    setSaving(false)
  }


  return (

    <div>
      {/* Add button */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">{suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}</span>
        <button
          id="add-supplier-btn"
          onClick={() => setShowAdd(p => !p)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition-colors shadow"
        >
          + Add Supplier
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border-2 border-teal-200 rounded-2xl p-5 mb-4 card-shadow animate-fade-in">
          <h3 className="text-sm font-bold text-gray-800 mb-3">New Supplier</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Field label="Name *" value={newVals.name ?? ''} onChange={v => set('name', v, 'new')} />
            <Field label="Phone" value={newVals.phone ?? ''} onChange={v => set('phone', v, 'new')} />
            <Field label="Email" value={newVals.email ?? ''} onChange={v => set('email', v, 'new')} />
            <Field label="Notes" value={newVals.notes ?? ''} onChange={v => set('notes', v, 'new')} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
            <button onClick={addSupplier} disabled={!newVals.name?.trim() || saving} className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
              {saving ? 'Saving…' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Supplier cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(supplier => {
          const isEditing = editing === supplier.id
          return (
            <div key={supplier.id} className="bg-white rounded-2xl card-shadow p-5 border border-gray-100">
              {isEditing ? (
                <div className="space-y-3">
                  <Field label="Name *" value={editValues.name ?? ''} onChange={v => set('name', v, 'edit')} />
                  <Field label="Phone" value={editValues.phone ?? ''} onChange={v => set('phone', v, 'edit')} />
                  <Field label="Email" value={editValues.email ?? ''} onChange={v => set('email', v, 'edit')} />
                  <Field label="Notes" value={editValues.notes ?? ''} onChange={v => set('notes', v, 'edit')} />
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setEditing(null)} className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl">Cancel</button>
                    <button onClick={() => saveEdit(supplier.id)} disabled={saving} className="flex-1 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl disabled:opacity-60">
                      {saving ? '…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{supplier.name}</h3>
                      {supplier.phone && (
                        <a href={`tel:${supplier.phone}`} className="text-sm text-teal-600 hover:underline">{supplier.phone}</a>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(supplier.id); setEditValues({ name: supplier.name, phone: supplier.phone ?? '', email: supplier.email ?? '', notes: supplier.notes ?? '' }) }}
                        className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors text-sm">✏️</button>
                      <button onClick={() => deleteSupplier(supplier.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm">🗑</button>
                    </div>
                  </div>

                  {supplier.email && <p className="text-sm text-gray-500 mb-1">{supplier.email}</p>}
                  {supplier.notes && <p className="text-xs text-gray-400 italic mb-3">{supplier.notes}</p>}

                  {/* Linked items */}
                  {(supplier.items?.length ?? 0) > 0 && (
                    <div className="border-t border-gray-100 pt-3 mt-2">
                      <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Items ({supplier.items!.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {supplier.items!.map(item => (
                          <span key={item.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {item.icon} {item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}

        {suppliers.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🏢</div>
            <p className="font-medium">No suppliers yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
