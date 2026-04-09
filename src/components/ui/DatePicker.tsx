'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string // YYYY-MM-DD format
  onChange: (date: string) => void
  placeholder?: string
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function parseDate(str: string) {
  if (!str) return new Date()
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function DatePicker({ value, onChange, placeholder = 'Select date' }: Props) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => parseDate(value))
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Sync view month with selected value when opened
  useEffect(() => {
    if (open) setViewDate(parseDate(value))
  }, [open, value])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const days = []
  
  // Previous month padding
  for (let i = 0; i < firstDay; i++) {
    const d = prevMonthDays - firstDay + i + 1
    const pDate = new Date(year, month - 1, d)
    days.push({ day: d, isCurrent: false, str: formatDate(pDate) })
  }
  
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    const cDate = new Date(year, month, i)
    days.push({ day: i, isCurrent: true, str: formatDate(cDate) })
  }

  // Next month padding (always complete 6 rows of 7 = 42 cells)
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const nDate = new Date(year, month + 1, i)
    days.push({ day: i, isCurrent: false, str: formatDate(nDate) })
  }

  function getDisplay() {
    if (!value) return placeholder
    const [y, m, d] = value.split('-')
    return `${d}/${m}/${y}`
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-2 h-7 px-2.5 text-xs border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-w-[120px] ${
          open ? 'border-teal-500 ring-2 ring-teal-500' : 'border-slate-200 hover:border-slate-300 bg-white'
        } ${value ? 'text-slate-800 font-medium' : 'text-slate-400'}`}
      >
        <span>{getDisplay()}</span>
        <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-card-hover p-2.5 w-[230px] animate-fade-in origin-top-left transition-all">
          
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-2">
            <button 
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors border border-transparent"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              {MONTHS[month]} {year}
            </span>
            <button 
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors border border-transparent"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(day => (
              <div key={day} className="text-[10px] font-bold text-slate-400 text-center py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              const isSelected = d.str === value
              const isToday = d.str === formatDate(new Date())
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => { onChange(d.str); setOpen(false) }}
                  className={`
                    relative h-7 flex items-center justify-center text-[11px] rounded-md transition-all duration-150
                    ${isSelected 
                      ? 'bg-teal-600 text-white font-bold shadow-sm' 
                      : d.isCurrent
                        ? 'text-slate-700 hover:bg-teal-50 hover:text-teal-800'
                        : 'text-slate-300 hover:bg-slate-50'
                    }
                  `}
                >
                  {d.day}
                  {isToday && !isSelected && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-teal-500" />
                  )}
                </button>
              )
            })}
          </div>
          
          {/* Quick Actions */}
          <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 transition-colors px-1"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => { onChange(formatDate(new Date())); setOpen(false) }}
              className="text-[11px] font-bold text-teal-600 hover:text-teal-800 transition-colors bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
