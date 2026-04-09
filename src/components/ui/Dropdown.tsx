'use client'

import { useState, useRef, useEffect } from 'react'

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

export default function Dropdown({
  value, onChange, options, placeholder = 'Select…', size = 'sm', className = '', id,
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)
  const displayLabel = selected?.label ?? placeholder

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const heights = {
    sm: 'h-7 px-2.5 text-xs min-w-[130px]',
    md: 'h-10 px-3.5 text-sm min-w-[160px]',
  }

  const isPlaceholder = !value

  return (
    <div ref={ref} className={`relative ${className}`} id={id}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`
          flex items-center justify-between gap-2 w-full
          bg-white border rounded-lg cursor-pointer
          font-medium transition-colors
          focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
          ${open
            ? 'border-teal-500 ring-2 ring-teal-500'
            : 'border-slate-200 hover:border-slate-300'
          }
          ${heights[size]}
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

      {/* Menu */}
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-full overflow-hidden animate-fade-in">
          {/* Placeholder / clear option */}
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false) }}
            className={`w-full text-left px-3 py-2 text-xs transition-colors ${
              !value
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
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
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                value === opt.value
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}

          {options.length === 0 && (
            <p className="px-3 py-2 text-xs text-slate-400 italic">No options</p>
          )}
        </div>
      )}
    </div>
  )
}
