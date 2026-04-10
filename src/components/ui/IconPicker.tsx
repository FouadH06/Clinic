'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ICONS } from './icons'

interface Props {
  value: string
  onChange: (id: string) => void
}

// ─── Inline grid (used in full Add Item modal — unchanged) ────────────────────
export default function IconPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {ICONS.map(icon => {
        const isActive = value === icon.id
        return (
          <button
            key={icon.id}
            type="button"
            onClick={() => onChange(icon.id)}
            className={`
              flex items-center justify-center
              h-10 rounded-lg border
              transition-all duration-100
              ${isActive
                ? 'bg-teal-50 border-teal-500 text-teal-700 ring-2 ring-teal-400 ring-offset-1'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
              }
            `}
          >
            <span className={isActive ? 'text-teal-600' : 'text-slate-400'}>
              {icon.render('w-5 h-5')}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Icon popover (portal-based, does not push rows down) ─────────────────────
// Renders as a floating compact 4-column grid anchored to a trigger element.
interface PopoverProps {
  triggerRef: React.RefObject<HTMLElement | null>
  value:      string
  onChange:   (id: string) => void
  onClose:    () => void
}

function IconPopoverMenu({ triggerRef, value, onChange, onClose }: PopoverProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    function compute() {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      setCoords({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX })
    }
    compute()
    window.addEventListener('scroll', compute, true)
    window.addEventListener('resize', compute)
    return () => {
      window.removeEventListener('scroll', compute, true)
      window.removeEventListener('resize', compute)
    }
  }, [triggerRef])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      onClose()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [triggerRef, onClose])

  if (!coords) return null

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: coords.top,
        left: coords.left,
        zIndex: 9999,
        width: 224,
      }}
      className="bg-white border border-slate-200 rounded-xl shadow-lg p-2 animate-fade-in max-h-64 overflow-y-auto"
    >
      <div className="grid grid-cols-4 gap-1">
        {ICONS.map(icon => {
          const isActive = value === icon.id
          return (
            <button
              key={icon.id}
              type="button"
              onClick={() => { onChange(icon.id); onClose() }}
              className={`
                flex items-center justify-center
                h-10 rounded-lg border
                transition-all duration-75
                ${isActive
                  ? 'bg-teal-50 border-teal-400 text-teal-700 ring-1 ring-teal-400'
                  : 'bg-white border-transparent text-slate-400 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                }
              `}
            >
              <span className={isActive ? 'text-teal-600' : ''}>
                {icon.render('w-5 h-5')}
              </span>
            </button>
          )
        })}
      </div>
    </div>,
    document.body
  )
}

// ─── IconPopoverTrigger ───────────────────────────────────────────────────────
// Drop-in: renders the current icon as a small button; clicking opens the
// portal popover without disrupting surrounding layout.
export function IconPopoverTrigger({
  value,
  onChange,
  mixedState = false,
}: {
  value:      string
  onChange:   (id: string) => void
  mixedState?: boolean
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const icon = ICONS.find(i => i.id === value) ?? ICONS[0]

  return (
    <>
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        type="button"
        onClick={() => setOpen(o => !o)}
        title={mixedState ? 'Mixed icons — click to assign one' : 'Change icon'}
        className={`
          inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors
          ${open
            ? 'border-teal-400 bg-teal-50 ring-2 ring-teal-400'
            : mixedState
              ? 'border-slate-300 bg-slate-50 hover:border-slate-400'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
          }
        `}
      >
        {mixedState
          ? <span className="text-xs font-semibold text-slate-400 select-none">~</span>
          : <span className="text-slate-500">{icon.render('w-4 h-4')}</span>
        }
      </button>
      {open && (
        <IconPopoverMenu
          triggerRef={triggerRef as React.RefObject<HTMLElement | null>}
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
