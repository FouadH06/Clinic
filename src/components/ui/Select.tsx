import React from 'react'

interface Option {
  value: string
  label: string
}

interface Props extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: Option[]
  placeholder?: string
  size?: 'sm' | 'md'
}

/**
 * A styled select wrapper that looks consistent with the design system.
 * Replaces naked browser-default <select> elements across the app.
 */
export default function Select({
  options,
  placeholder,
  size = 'md',
  className = '',
  ...props
}: Props) {
  const heights = {
    sm: 'h-7 pl-2.5 pr-7 text-xs',
    md: 'h-10 pl-3.5 pr-9 text-sm',
  }

  return (
    <div className="relative">
      <select
        {...props}
        className={`
          w-full appearance-none cursor-pointer bg-white
          border border-slate-200 rounded-lg
          font-medium text-slate-800
          focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
          hover:border-slate-300
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${heights[size]}
          ${className}
        `}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {/* Custom chevron */}
      <svg
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}
