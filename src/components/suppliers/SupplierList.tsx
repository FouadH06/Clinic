'use client'

import { useState, useMemo } from 'react'
import { Supplier, Item } from '@/lib/types'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

function Field({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400" />
    </div>
  )
}

interface ItemSuppliersJoin {
  item_id: string
  item?: Pick<Item, 'id' | 'name' | 'icon' | 'quantity' | 'min_stock_threshold' | 'unit'>
}

interface SupplierWithItems extends Supplier {
  item_suppliers?: ItemSuppliersJoin[]
}

interface Props {
  initialSuppliers: SupplierWithItems[]
  allItems: Pick<Item, 'id' | 'name' | 'icon' | 'unit' | 'category'>[]
}

const EMPTY: Partial<Supplier> = { name: '', phone: '', email: '', notes: '' }

// ─── Product assignment sub-component ────────────────────────────────────────
function AssignItemSection({
  supplierId,
  linkedItems,
  allItems,
  onUpdate,
}: {
  supplierId: string
  linkedItems: NonNullable<ItemSuppliersJoin['item']>[]
  allItems: Props['allItems']
  onUpdate: (updated: NonNullable<ItemSuppliersJoin['item']>[]) => void
}) {
  const [assigning, setAssigning] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const linkedIds = new Set(linkedItems.map(i => i.id))
  const available = allItems.filter(i => !linkedIds.has(i.id) && i.name.toLowerCase().includes(search.toLowerCase()))

  async function assign() {
    if (!selectedId) return
    setSaving(true)
    // Insert into item_suppliers junction
    const { data } = await supabase
      .from('item_suppliers')
      .insert({ item_id: selectedId, supplier_id: supplierId })
      .select('item_id, item:items(id, name, icon, quantity, min_stock_threshold, unit)')
      .single()
    if (data && (data as any).item) {
      onUpdate([...linkedItems, (data as any).item])
    }
    setSelectedId(''); setSearch(''); setAssigning(false); setSaving(false)
  }

  async function unassign(itemId: string) {
    await supabase.from('item_suppliers').delete().eq('supplier_id', supplierId).eq('item_id', itemId)
    onUpdate(linkedItems.filter(i => i.id !== itemId))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Linked items{linkedItems.length > 0 ? ` · ${linkedItems.length}` : ''}
        </p>
        {!assigning && (
          <button onClick={() => setAssigning(true)} className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Assign product
          </button>
        )}
      </div>

      {/* Assign product panel */}
      {assigning && (
        <div className="mb-3 bg-teal-50 border border-teal-200 rounded-xl p-3 animate-fade-in">
          <div className="relative mb-2">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-teal-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" /></svg>
            <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
              className="w-full h-8 pl-8 pr-3 text-xs border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white" />
          </div>
          {available.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2 text-center">
              {allItems.length === linkedIds.size ? 'All products already assigned' : 'No products match'}
            </p>
          ) : (
            <div className="border border-teal-200 rounded-lg overflow-hidden bg-white max-h-36 overflow-y-auto">
              {available.map(item => (
                <button key={item.id} onClick={() => setSelectedId(selectedId === item.id ? '' : item.id)}
                  className={`w-full text-left px-3 py-2 text-xs border-b border-slate-100 last:border-b-0 transition-colors ${selectedId === item.id ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}>
                  {item.name}
                  {item.category && <span className="ml-2 text-slate-400">{item.category}</span>}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <button onClick={assign} disabled={!selectedId || saving} className="h-7 px-3 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Assigning…' : 'Assign'}
            </button>
            <button onClick={() => { setAssigning(false); setSearch(''); setSelectedId('') }} className="h-7 px-3 text-xs font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Linked items list */}
      {linkedItems.length > 0 ? (
        <div className="border border-slate-100 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-slate-50">
              {linkedItems.map(item => {
                const isItemLow = item.quantity > 0 && item.quantity < item.min_stock_threshold
                const isItemOut = item.quantity === 0
                return (
                  <tr key={item.id} className={`group ${isItemOut ? 'bg-red-50/60' : isItemLow ? 'bg-amber-50/60' : ''}`}>
                    <td className="px-3 py-2">
                      <Link href={`/inventory/${item.id}`} className="font-medium text-slate-700 hover:text-teal-700 hover:underline transition-colors truncate max-w-[160px] block">
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <span className={`font-semibold ${isItemOut ? 'text-red-600' : isItemLow ? 'text-amber-600' : 'text-slate-600'}`}>{item.quantity}</span>
                      {(isItemOut || isItemLow) && (
                        <span className={`ml-1 text-[9px] font-bold uppercase tracking-wider ${isItemOut ? 'text-red-500' : 'text-amber-500'}`}>{isItemOut ? 'out' : 'low'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right w-8">
                      <button onClick={() => unassign(item.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all" aria-label="Remove">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        !assigning && <p className="text-xs text-slate-400 italic">No products linked</p>
      )}
    </div>
  )
}

// ─── Main SupplierList ────────────────────────────────────────────────────────
export default function SupplierList({ initialSuppliers, allItems }: Props) {
  const [suppliers, setSuppliers] = useState<SupplierWithItems[]>(initialSuppliers)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Supplier>>(EMPTY)
  const [showAdd, setShowAdd] = useState(false)
  const [newVals, setNewVals] = useState<Partial<Supplier>>(EMPTY)
  const [saving, setSaving] = useState(false)
  // Track linked items per supplier in component state (for optimistic updates)
  const [linkedItemsMap, setLinkedItemsMap] = useState<Record<string, NonNullable<ItemSuppliersJoin['item']>[]>>(() => {
    const map: Record<string, NonNullable<ItemSuppliersJoin['item']>[]> = {}
    for (const s of initialSuppliers) {
      map[s.id] = (s.item_suppliers ?? []).map(is => is.item).filter(Boolean) as NonNullable<ItemSuppliersJoin['item']>[]
    }
    return map
  })
  const supabase = createClient()

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
    if (!confirm('Delete this supplier? Items will be unlinked automatically.')) return
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

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-slate-500 font-medium">{suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}</p>
        <button id="add-supplier-btn" onClick={() => { setShowAdd(p => !p); setEditing(null) }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Supplier
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5 shadow-card animate-fade-in">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">New Supplier</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Field label="Name *" value={newVals.name ?? ''} onChange={v => setField('name', v, 'new')} placeholder="Dental Supply Co." />
            <Field label="Phone" value={newVals.phone ?? ''} onChange={v => setField('phone', v, 'new')} type="tel" placeholder="+966 5X XXX XXXX" />
            <Field label="Email" value={newVals.email ?? ''} onChange={v => setField('email', v, 'new')} type="email" placeholder="orders@supplier.com" />
            <Field label="Notes" value={newVals.notes ?? ''} onChange={v => setField('notes', v, 'new')} placeholder="Optional notes" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
            <button onClick={addSupplier} disabled={!newVals.name?.trim() || saving} className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Supplier'}
            </button>
          </div>
        </div>
      )}

      {/* Supplier list */}
      <div className="space-y-2">
        {suppliers.map(supplier => {
          const isExpanded = expanded === supplier.id
          const isEditing = editing === supplier.id
          const linkedItems = linkedItemsMap[supplier.id] ?? []
          const lowItems = linkedItems.filter(i => i.quantity < i.min_stock_threshold)

          return (
            <div key={supplier.id} className={`bg-white border rounded-xl transition-all duration-200 overflow-hidden shadow-card ${isExpanded ? 'border-slate-300' : 'border-slate-200 hover:border-slate-300'}`}>
              {/* Header row */}
              <button onClick={() => { if (!isEditing) setExpanded(prev => prev === supplier.id ? null : supplier.id) }}
                className="w-full flex items-center gap-4 px-4 py-3.5 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900">{supplier.name}</span>
                    {lowItems.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        {lowItems.length} low
                      </span>
                    )}
                  </div>
                  {supplier.phone && <p className="text-xs text-slate-400 mt-0.5 font-medium">{supplier.phone}</p>}
                </div>
                <span className="hidden sm:block text-xs text-slate-400 font-medium shrink-0">{linkedItems.length} item{linkedItems.length !== 1 ? 's' : ''}</span>
                <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-4 py-4">
                  {isEditing ? (
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <Field label="Name *" value={editValues.name ?? ''} onChange={v => setField('name', v, 'edit')} />
                        <Field label="Phone" value={editValues.phone ?? ''} onChange={v => setField('phone', v, 'edit')} type="tel" />
                        <Field label="Email" value={editValues.email ?? ''} onChange={v => setField('email', v, 'edit')} type="email" />
                        <Field label="Notes" value={editValues.notes ?? ''} onChange={v => setField('notes', v, 'edit')} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditing(null)} className="h-8 px-3 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                        <button onClick={() => saveEdit(supplier.id)} disabled={saving} className="h-8 px-3 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors disabled:opacity-50">
                          {saving ? 'Saving…' : 'Save changes'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Contact */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact</p>
                        <div className="space-y-2">
                          {supplier.phone && (
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-10 shrink-0">Phone</span>
                              <a href={`tel:${supplier.phone}`} className="text-sm font-medium text-teal-700 hover:text-teal-900 hover:underline">{supplier.phone}</a>
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-10 shrink-0">Email</span>
                              <a href={`mailto:${supplier.email}`} className="text-sm font-medium text-teal-700 hover:text-teal-900 hover:underline truncate">{supplier.email}</a>
                            </div>
                          )}
                          {!supplier.phone && !supplier.email && <p className="text-xs text-slate-400 italic">No contact information</p>}
                        </div>
                        {supplier.notes && (
                          <div className="pt-3 border-t border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Notes</p>
                            <p className="text-xs text-slate-600 leading-relaxed">{supplier.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Linked items with assignment */}
                      <AssignItemSection
                        supplierId={supplier.id}
                        linkedItems={linkedItems}
                        allItems={allItems}
                        onUpdate={updated => setLinkedItemsMap(prev => ({ ...prev, [supplier.id]: updated }))}
                      />
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
                      <button onClick={() => { setEditing(supplier.id); setEditValues({ name: supplier.name, phone: supplier.phone ?? '', email: supplier.email ?? '', notes: supplier.notes ?? '' }) }}
                        className="text-xs font-medium text-teal-700 hover:text-teal-900 transition-colors">
                        Edit supplier
                      </button>
                      <span className="text-slate-200">·</span>
                      <button onClick={() => deleteSupplier(supplier.id)} className="text-xs font-medium text-slate-400 hover:text-red-600 transition-colors">Delete</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {suppliers.length === 0 && (
          <div className="bg-white border border-dashed border-slate-200 rounded-xl py-16 text-center">
            <div className="flex justify-center mb-4 text-slate-200"><svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
            <p className="text-sm font-semibold text-slate-600">No suppliers yet</p>
            <p className="text-xs text-slate-400 mt-1">Add a supplier to track your dental supply vendors</p>
          </div>
        )}
      </div>
    </div>
  )
}
