import React from 'react'

export interface IconDef {
  id: string
  label: string
  render: (className?: string) => React.ReactNode
}

// Strictly uniform, clinical-grade icon system for dental inventory.
// Object-first metaphors, zero generic symbols. Uniform 2px stroke, round caps/joins.
export const ICONS: IconDef[] = [
  {
    id: 'box',
    label: 'Supplies',
    render: (c = 'w-5 h-5') => (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8h16" />
        <path d="M5 8l-2 12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2l-2-12" />
        <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    ),
  },
  {
    id: 'glove',
    label: 'Gloves',
    render: (c = 'w-5 h-5') => (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 11V6a2 2 0 0 0-4 0v4" />
        <path d="M14 10V4a2 2 0 0 0-4 0v6" />
        <path d="M10 10.5V5a2 2 0 0 0-4 0v9l-2.6-1.5a1.8 1.8 0 0 0-2.5.5 1.8 1.8 0 0 0 .5 2.5l5.2 3C7.2 19.1 7.9 20 8.8 20H15l3.5-3V9a2 2 0 0 0-4 0v2" />
        <rect x="7" y="20" width="10" height="3" rx="1" />
      </svg>
    ),
  },
  {
    id: 'syringe',
    label: 'Syringes',
    render: (c = 'w-5 h-5') => (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="m18 2 4 4" />
        <path d="m17 7 3-3" />
        <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />
        <path d="m9 11 4 4" />
        <path d="m5 19-3 3" />
        <path d="m14 4 6 6" />
      </svg>
    ),
  },
  {
    id: 'mask',
    label: 'Masks',
    render: (c = 'w-5 h-5') => (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9c-3 1-3 5 0 6" />
        <path d="M20 9c3 1 3 5 0 6" />
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="M4 10h16" />
        <path d="M4 14h16" />
      </svg>
    ),
  },
  {
    id: 'gauze',
    label: 'Gauze',
    render: (c = 'w-5 h-5') => (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="8" width="20" height="8" rx="4" />
        <rect x="9" y="8" width="6" height="8" />
        <circle cx="12" cy="10" r="0.5" />
        <circle cx="12" cy="14" r="0.5" />
      </svg>
    ),
  },
  {
    id: 'pill',
    label: 'Meds',
    render: (c = 'w-5 h-5') => (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
        <path d="m8.5 8.5 7 7" />
      </svg>
    ),
  },
  {
    id: 'tooth',
    label: 'General',
    render: (c = 'w-5 h-5') => (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 7v10" />
        <path d="M7 12h10" />
      </svg>
    ),
  },
  {
    id: 'scissors',
    label: 'Instruments',
    render: (c = 'w-5 h-5') => (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="8" r="4" />
        <path d="M13.2 10.8L4 20" />
      </svg>
    ),
  },
  {
    id: 'vial',
    label: 'Vials',
    render: (c = 'w-5 h-5') => (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H10" />
        <path d="M12 2v6" />
        <path d="M16 8v12a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z" />
        <path d="M6 14h12" />
      </svg>
    ),
  },
  {
    id: 'liquid',
    label: 'Solutions',
    render: (c = 'w-5 h-5') => (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="10" width="12" height="12" rx="2" />
        <path d="M9 10V8h6v2" />
        <path d="M10 8L11 2h2l1 6" />
        <path d="M12 14v4" />
        <path d="M10 16h4" />
      </svg>
    ),
  },
  {
    id: 'paper',
    label: 'Paper',
    render: (c = 'w-5 h-5') => (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 4v16" />
        <path d="M18 4v16" />
        <ellipse cx="12" cy="20" rx="6" ry="2" />
        <ellipse cx="12" cy="4" rx="6" ry="2" />
        <path d="M18 10h4v6h-4" />
      </svg>
    ),
  },
  {
    id: 'implant',
    label: 'Implants',
    render: (c = 'w-5 h-5') => (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 2h6" />
        <path d="M12 2v5" />
        <path d="M10 7h4v13a2 2 0 0 1-4 0V7Z" />
        <path d="M8 10h8" />
        <path d="M8 14h8" />
        <path d="M8 18h8" />
      </svg>
    ),
  },
  {
    id: 'braces',
    label: 'Ortho',
    render: (c = 'w-5 h-5') => (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21a2 2 0 0 1-2-2c0-1.5-1-3-2.5-3.5a4 4 0 0 1-2.5-3.5c0-3 2-5 5-5s5 2 5 5c0 1.5 1 3 2.5 3.5a4 4 0 0 1 2.5 3.5C13 16 12 17.5 12 19a2 2 0 0 1-2 2Z" />
        <path d="M4 11h16" />
        <rect x="6" y="9" width="3" height="4" rx="1" />
        <rect x="15" y="9" width="3" height="4" rx="1" />
      </svg>
    ),
  },
  {
    id: 'cotton',
    label: 'Cotton',
    render: (c = 'w-5 h-5') => (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3Z" />
        <path d="M6 14a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3Z" />
        <path d="M15.5 8.5L8.5 15.5" />
      </svg>
    ),
  },
  {
    id: 'drill',
    label: 'Burs',
    render: (c = 'w-5 h-5') => (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3 4v3h-6V6z" />
        <rect x="11" y="9" width="2" height="13" rx="1" />
      </svg>
    ),
  },
  {
    id: 'cup',
    label: 'Disposables',
    render: (c = 'w-5 h-5') => (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 4h14l-1.5 16h-11Z" />
        <path d="M12 4V2" />
        <path d="M7 10h10" />
        <path d="M7.5 15h9" />
      </svg>
    ),
  },
  {
    id: 'cleaning',
    label: 'Sanitation',
    render: (c = 'w-5 h-5') => (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 10v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10" />
        <path d="M12 6v4" />
        <path d="M10 6h4" />
        <path d="M12 6c0-2-1-3-3-3H6" />
        <path d="M6 3a2 2 0 0 0 0 4h3" />
      </svg>
    ),
  },
  {
    id: 'shield',
    label: 'Eyewear',
    render: (c = 'w-5 h-5') => (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 10s3-2 10-2 10 2 10 2v4c0 3-4 4-10 4S2 17 2 14v-4Z" />
        <path d="M12 8v10" />
        <path d="M2 10L1 6" />
        <path d="M22 10l1-4" />
      </svg>
    ),
  },
]

/** Find an icon by ID */
export function getIcon(id?: string | null): IconDef {
  return ICONS.find(i => i.id === id) ?? ICONS[0]
}
