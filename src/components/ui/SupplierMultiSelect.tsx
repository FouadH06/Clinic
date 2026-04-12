'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Supplier } from '@/lib/types'

/**
 * Portal-based multi-select checklist for suppliers.
 * Does not close on each pick — lets user select multiple in one session.
 * Uses fixed viewport coords so it is never clipped by overflow containers.
 */
export default function SupplierMultiSelect({
  suppliers,
  selectedIds,
  onChange,
  size = 'sm',
}: {
  suppliers:   Supplier[]
  selectedIds: Set<string>
  onChange:    (updated: Set<string>) => void
  size?:       'sm' | 'md'
}) {
  const [open, setOpen] = useState(false)
  const btnRef  = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handle)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  // Fixed viewport coords — never drifts inside overflow/table containers
  const [coords, setCoords] = useState<{
    top: number; bottom: number; left: number; minWidth: number; openUp: boolean
  } | null>(null)

  useEffect(() => {
    if (!open) return
    function compute() {
      const rect = btnRef.current?.getBoundingClientRect()
      if (!rect) return
      const menuHeight  = 220
      const spaceBelow  = window.innerHeight - rect.bottom
      const openUp      = spaceBelow < menuHeight && rect.top > menuHeight
      setCoords({
        top:      openUp ? rect.top - 4  : rect.bottom + 4,
        bottom:   openUp ? window.innerHeight - rect.top + 4 : (undefined as any),
        left:     rect.left,
        minWidth: Math.max(rect.width, 190),
        openUp,
      })
    }
    compute()
    window.addEventListener('scroll', compute, true)
    window.addEventListener('resize', compute)
    return () => {
      window.removeEventListener('scroll', compute, true)
      window.removeEventListener('resize', compute)
    }
  }, [open])

  function toggle(id: string) {
    const next = new Set(selectedIds)
    next.has(id) ? next.delete(id) : next.add(id)
    onChange(next)
  }

  const count = selectedIds.size
  const label =
    count === 0 ? 'No supplier' :
    count === 1 ? (suppliers.find(s => selectedIds.has(s.id))?.name ?? '1 supplier') :
    `${count} suppliers`

  const heightClass  = size === 'md' ? 'h-10' : 'h-7'
  const paddingClass = size === 'md' ? 'pl-3.5 pr-3 text-sm' : 'pl-2.5 pr-2 text-xs'
  const minWClass    = size === 'md' ? 'min-w-[160px]' : 'min-w-[140px]'

  return (
    <div className="relative inline-block w-full">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`
          w-full inline-flex items-center justify-between gap-2 font-medium
          bg-white border rounded-lg cursor-pointer transition-colors
          focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
          ${heightClass} ${paddingClass} ${minWClass}
          ${open
            ? 'border-teal-500 ring-2 ring-teal-500 text-slate-800'
            : 'border-slate-200 text-slate-700 hover:border-slate-300'}
        `}
      >
        <span className={`truncate ${count === 0 ? 'text-slate-400' : 'text-slate-800'}`}>{label}</span>
        <svg
          className={`w-3 h-3 shrink-0 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && coords && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top:      coords.openUp ? 'auto' : coords.top,
            bottom:   coords.openUp ? coords.bottom : 'auto',
            left:     coords.left,
            minWidth: coords.minWidth,
            maxWidth: 280,
            zIndex:   9999,
          }}
          onMouseDown={e => e.stopPropagation()}
          className="bg-white border border-slate-200 rounded-xl shadow-xl py-1 animate-fade-in max-h-52 overflow-y-auto"
        >
          {/* None option */}
          <button
            type="button"
            onClick={() => onChange(new Set())}
            className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
              count === 0
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-400 hover:bg-teal-50/60 hover:text-teal-700'
            }`}
          >
            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
              count === 0 ? 'bg-teal-500 border-teal-500' : 'border-slate-300 bg-white'
            }`}>
              {count === 0 && (
                <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            No supplier
          </button>

          {suppliers.length > 0 && <div className="border-t border-slate-100 my-1" />}

          {suppliers.map(s => {
            const checked = selectedIds.has(s.id)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                  checked
                    ? 'bg-teal-50 text-teal-800 font-semibold'
                    : 'text-slate-700 hover:bg-teal-50/70 hover:text-teal-800'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  checked ? 'bg-teal-500 border-teal-500' : 'border-slate-300 bg-white'
                }`}>
                  {checked && (
                    <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                {s.name}
              </button>
            )
          })}

          {suppliers.length === 0 && (
            <p className="px-3 py-2 text-xs text-slate-400 italic">No suppliers configured</p>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
