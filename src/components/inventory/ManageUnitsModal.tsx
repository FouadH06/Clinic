'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export interface Unit {
  id: string
  name: string
}

interface Props {
  units: Unit[]
  /** map: unit name → number of items currently using it */
  itemCounts: Record<string, number>
  onClose: () => void
  /** called after any create/rename/delete so the parent can re-fetch */
  onChange: (updated: Unit[]) => void
}

// ─── Confirm delete dialog ─────────────────────────────────────────────────────
function ConfirmDelete({
  name,
  count,
  onConfirm,
  onCancel,
}: {
  name: string
  count: number
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="animate-fade-in flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-1">
      <p className="text-xs text-red-700 flex-1">
        {count > 0
          ? `Remove "${name}"? ${count} item${count !== 1 ? 's' : ''} will keep the unit text.`
          : `Remove "${name}"?`}
      </p>
      <button
        onClick={onCancel}
        className="text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className="h-6 px-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
      >
        Delete
      </button>
    </div>
  )
}

// ─── Unit row ──────────────────────────────────────────────────────────────────
function UnitRow({
  unit,
  count,
  onRename,
  onDelete,
}: {
  unit: Unit
  count: number
  onRename: (id: string, oldName: string, newName: string) => Promise<void>
  onDelete: (id: string, name: string) => Promise<void>
}) {
  const [nameVal, setNameVal]       = useState(unit.name)
  const [saving, setSaving]         = useState(false)
  const [confirming, setConfirming] = useState(false)
  const isDirty = nameVal.trim() !== unit.name && nameVal.trim() !== ''

  async function handleRename() {
    if (!isDirty) return
    setSaving(true)
    await onRename(unit.id, unit.name, nameVal.trim())
    setSaving(false)
  }

  async function handleDelete() {
    setSaving(true)
    await onDelete(unit.id, unit.name)
    setSaving(false)
    setConfirming(false)
  }

  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2">
        {/* Name input */}
        <input
          value={nameVal}
          onChange={e => setNameVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleRename() }}
          className="flex-1 px-2.5 py-1.5 text-sm border border-slate-200 hover:border-slate-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-400 focus:outline-none rounded-lg bg-white transition-colors"
        />
        {/* Item count */}
        <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
          {count} item{count !== 1 ? 's' : ''}
        </span>
        {/* Save rename */}
        {isDirty && (
          <button
            onClick={handleRename}
            disabled={saving}
            className="h-7 px-2.5 text-xs font-semibold text-teal-700 border border-teal-300 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? '…' : 'Save'}
          </button>
        )}
        {/* Delete */}
        {!isDirty && (
          <button
            onClick={() => setConfirming(true)}
            disabled={saving}
            className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50 rounded"
            title="Delete unit"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      {confirming && (
        <ConfirmDelete
          name={unit.name}
          count={count}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}

// ─── Main Modal ────────────────────────────────────────────────────────────────
export default function ManageUnitsModal({ units, itemCounts, onClose, onChange }: Props) {
  const supabase = createClient()
  const [unitList, setUnitList]   = useState<Unit[]>(units)
  const [newName, setNewName]     = useState('')
  const [adding, setAdding]       = useState(false)
  const [addError, setAddError]   = useState('')
  const newInputRef               = useRef<HTMLInputElement>(null)

  useEffect(() => { newInputRef.current?.focus() }, [])

  // ── Create ──
  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    if (unitList.some(u => u.name.toLowerCase() === name.toLowerCase())) {
      setAddError('That unit already exists')
      return
    }
    setAdding(true)
    setAddError('')
    const { data, error } = await supabase
      .from('units')
      .insert({ name })
      .select('id, name')
      .single()
    if (!error && data) {
      const updated = [...unitList, data as Unit].sort((a, b) => a.name.localeCompare(b.name))
      setUnitList(updated)
      onChange(updated)
      setNewName('')
    } else {
      setAddError(error?.message ?? 'Could not create unit')
    }
    setAdding(false)
  }

  // ── Rename ──
  async function handleRename(id: string, oldName: string, newName: string) {
    // 1. Update unit record
    const { error: unitErr } = await supabase
      .from('units')
      .update({ name: newName })
      .eq('id', id)
    if (unitErr) return

    // 2. Update all items that had the old unit name
    await supabase
      .from('items')
      .update({ unit: newName })
      .eq('unit', oldName)

    const updated = unitList.map(u => u.id === id ? { ...u, name: newName } : u)
      .sort((a, b) => a.name.localeCompare(b.name))
    setUnitList(updated)
    onChange(updated)
  }

  // ── Delete ──
  async function handleDelete(id: string, name: string) {
    // Delete the unit record (items keep their unit text as-is)
    await supabase.from('units').delete().eq('id', id)

    const updated = unitList.filter(u => u.id !== id)
    setUnitList(updated)
    onChange(updated)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Manage Units</h2>
            <p className="text-xs text-slate-400 mt-0.5">{unitList.length} unit{unitList.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Create new */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40 shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">New Unit</p>
          <div className="flex gap-2">
            <input
              ref={newInputRef}
              value={newName}
              onChange={e => { setNewName(e.target.value); setAddError('') }}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
              placeholder="e.g. bottles, vials, packs…"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 hover:border-slate-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-400 focus:outline-none rounded-lg bg-white transition-colors"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || adding}
              className="h-9 px-3.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {adding ? '…' : 'Add'}
            </button>
          </div>
          {addError && <p className="text-xs text-red-600 mt-1.5">{addError}</p>}
        </div>

        {/* Unit list */}
        <div className="px-6 py-2 overflow-y-auto flex-1">
          {unitList.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-400">No units yet</p>
              <p className="text-xs text-slate-300 mt-1">Create your first unit above</p>
            </div>
          ) : (
            <div>
              {unitList.map(unit => (
                <UnitRow
                  key={unit.id}
                  unit={unit}
                  count={itemCounts[unit.name] ?? 0}
                  onRename={handleRename}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
