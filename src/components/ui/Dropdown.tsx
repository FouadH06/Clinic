'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

export interface DropdownOption {
  value: string
  label: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  placeholder?: string
  size?: 'sm' | 'md'
  className?: string
  id?: string
}

// ─── Portal menu ──────────────────────────────────────────────────────────────
// Rendered into <body> so it is never clipped by any ancestor's overflow,
// border-radius stacking context, or z-index.
interface MenuProps {
  buttonRef: React.RefObject<HTMLButtonElement | null>
  menuRef:   React.RefObject<HTMLDivElement | null>
  children:  React.ReactNode
}

function DropdownMenu({ buttonRef, menuRef, children }: MenuProps) {
  const [coords, setCoords] = useState<{
    top: number; bottom: number; left: number; minWidth: number; openUp: boolean
  } | null>(null)

  useEffect(() => {
    function compute() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const menuHeight = 260 // max-h estimate
      const spaceBelow = window.innerHeight - rect.bottom
      const openUp = spaceBelow < menuHeight && rect.top > menuHeight
      setCoords({
        top:      rect.bottom + 4,
        bottom:   window.innerHeight - rect.top + 4,
        left:     rect.left,
        minWidth: Math.min(Math.max(rect.width, 130), 280),
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
  }, [buttonRef])

  if (!coords) return null

  return createPortal(
    <div
      ref={menuRef as React.RefObject<HTMLDivElement>}
      style={{
        position: 'fixed',
        top:      coords.openUp ? 'auto' : coords.top,
        bottom:   coords.openUp ? coords.bottom : 'auto',
        left:     coords.left,
        minWidth: coords.minWidth,
        maxWidth: 280,
        zIndex:   9999,
      }}
      className="bg-white border border-slate-200 rounded-xl shadow-lg py-1 animate-fade-in max-h-60 overflow-y-auto"
    >
      {children}
    </div>,
    document.body
  )
}

// ─── Main dropdown ─────────────────────────────────────────────────────────────
export default function Dropdown({
  value, onChange, options, placeholder = 'Select…', size = 'sm', className = '', id,
}: Props) {
  const [open, setOpen]     = useState(false)
  const wrapperRef          = useRef<HTMLDivElement>(null)
  const buttonRef           = useRef<HTMLButtonElement>(null)
  const menuRef             = useRef<HTMLDivElement>(null)

  const selected      = options.find(o => o.value === value)
  const displayLabel  = selected?.label ?? placeholder
  const isPlaceholder = !value

  // Close on outside click — exclude both the trigger wrapper and the portal menu
  const handleOutsideClick = useCallback((e: MouseEvent) => {
    const target = e.target as Node
    if (wrapperRef.current?.contains(target)) return
    if (menuRef.current?.contains(target))    return
    setOpen(false)
  }, [])

  useEffect(() => {
    if (open) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open, handleOutsideClick])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  // Button sizing — no w-full so it never stretches to fill a flex container
  const sizeClass = size === 'md'
    ? 'h-10 px-3.5 text-sm min-w-[160px]'
    : 'h-7  px-2.5 text-xs min-w-[130px]'

  return (
    <div ref={wrapperRef} className={`relative inline-block ${className}`} id={id}>
      {/* Trigger button — sized by its own min-w, not by parent flex width */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`
          inline-flex items-center justify-between gap-2
          bg-white border rounded-lg cursor-pointer font-medium transition-colors
          focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
          ${open ? 'border-teal-500 ring-2 ring-teal-500' : 'border-slate-200 hover:border-slate-300'}
          ${sizeClass}
          ${isPlaceholder ? 'text-slate-400' : 'text-slate-800'}
        `}
      >
        <span className="truncate">{displayLabel}</span>
        <svg
          className={`w-3 h-3 shrink-0 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menu — portalled into <body>, never clipped by parent containers */}
      {open && (
        <DropdownMenu buttonRef={buttonRef} menuRef={menuRef}>
          {/* Clear / all option */}
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false) }}
            className={`w-full text-left px-3 py-2 text-xs transition-colors ${
              !value
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-400 hover:bg-teal-50/60 hover:text-teal-700'
            }`}
          >
            {placeholder}
          </button>

          {options.length > 0 && <div className="border-t border-slate-100 my-1" />}

          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                value === opt.value
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-700 hover:bg-teal-50/70 hover:text-teal-800'
              }`}
            >
              {/* Selected checkmark */}
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                value === opt.value ? 'bg-teal-500' : 'bg-transparent'
              }`} />
              {opt.label}
            </button>
          ))}

          {options.length === 0 && (
            <p className="px-3 py-2 text-xs text-slate-400 italic">No options</p>
          )}
        </DropdownMenu>
      )}
    </div>
  )
}
