import React from 'react'
import { Hand, Pill } from 'lucide-react'

export interface IconDef {
  id: string
  label: string
  render: (className?: string) => React.ReactNode
}

const SVG = ({ c, children }: { c: string; children: React.ReactNode }) => (
  <svg
    className={c}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
)

export const ICONS: IconDef[] = [
  // ── Supplies ────────────────────────────────────────────────────────────────
  {
    id: 'box',
    label: 'Supplies',
    render: (c = 'w-5 h-5') => (
      <SVG c={c}>
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </SVG>
    ),
  },

  // ── Gloves → Lucide Hand (palm-forward, 5 fingers) ──────────────────────────
  {
    id: 'glove',
    label: 'Gloves',
    render: (c = 'w-5 h-5') => <Hand className={c} strokeWidth={2} />,
  },

  // ── Syringe (dental aspirating — cap, barrel outline, needle only) ─────────
  {
    id: 'syringe',
    label: 'Syringes',
    render: (c = 'w-5 h-5') => (
      <SVG c={c}>
        <path d="m18 2 4 4" />
        <path d="m17 7 3-3" />
        <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />
        <path d="m5 19-3 3" />
        <path d="m14 4 6 6" />
      </SVG>
    ),
  },

  // ── Mask (surgical face mask — ear loops kept inside viewBox) ─────────────
  {
    id: 'mask',
    label: 'Masks',
    render: (c = 'w-5 h-5') => (
      <SVG c={c}>
        {/* Mask body */}
        <path d="M5 9 Q5 7 8 7 L16 7 Q19 7 19 9 L17.5 15 Q17 17 12 17 Q7 17 6.5 15 Z" />
        {/* Pleats */}
        <path d="M6.5 11 L17.5 11" />
        <path d="M6 14 L18 14" />
        {/* Left ear loop — generous C-shape, stays within viewBox */}
        <path d="M5 9 Q1 11 1.5 14 Q2 17 6.5 15" />
        {/* Right ear loop */}
        <path d="M19 9 Q23 11 22.5 14 Q22 17 17.5 15" />
      </SVG>
    ),
  },

  // ── Gauze (single pad with clean 3×3 mesh grid) ────────────────────────────
  {
    id: 'gauze',
    label: 'Gauze',
    render: (c = 'w-5 h-5') => (
      <SVG c={c}>
        {/* Pad outline */}
        <rect x="3" y="3" width="18" height="18" rx="2" />
        {/* Vertical weave lines */}
        <line x1="9"  y1="3" x2="9"  y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
        {/* Horizontal weave lines */}
        <line x1="3" y1="9"  x2="21" y2="9"  />
        <line x1="3" y1="15" x2="21" y2="15" />
      </SVG>
    ),
  },

  // ── Meds → Lucide Pill (clean standard capsule at angle) ─────────────────
  {
    id: 'pill',
    label: 'Meds',
    render: (c = 'w-5 h-5') => <Pill className={c} strokeWidth={2} />,
  },

  // ── General (tooth shape — unchanged) ────────────────────────────────────
  {
    id: 'tooth',
    label: 'General',
    render: (c = 'w-5 h-5') => (
      <SVG c={c}>
        <path d="M15.5 3c-1.5 0-2.5.5-3.5 1.5C11 3.5 10 3 8.5 3 6 3 4 5 4 7.5v2.5c0 4 2 8 3.5 11 .5 1 1.5 1 2 0 1.5-3.5 1.5-6.5 2.5-6.5S13 17.5 14.5 21c.5 1 1.5 1 2 0C18 18 20 14 20 10V7.5C20 5 18 3 15.5 3Z" />
      </SVG>
    ),
  },

  // ── Vials (dental carpule — unchanged) ────────────────────────────────────
  {
    id: 'vial',
    label: 'Vials',
    render: (c = 'w-5 h-5') => (
      <SVG c={c}>
        <rect x="7" y="6" width="10" height="16" rx="2" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        <path d="M7 11h10" />
        <path d="M12 11v11" />
      </SVG>
    ),
  },

  // ── Paper (unchanged) ─────────────────────────────────────────────────────
  {
    id: 'paper',
    label: 'Paper',
    render: (c = 'w-5 h-5') => (
      <SVG c={c}>
        <rect x="5" y="6" width="14" height="16" rx="2" />
        <path d="M7 6V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
        <circle cx="9" cy="8" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="15" cy="8" r="1.5" fill="currentColor" stroke="none" />
      </SVG>
    ),
  },

  // ── Implants (unchanged) ──────────────────────────────────────────────────
  {
    id: 'implant',
    label: 'Implants',
    render: (c = 'w-5 h-5') => (
      <SVG c={c}>
        <path d="M10 12v2" />
        <path d="M14 12v2" />
        <path d="M9 14h6" />
        <path d="M9 17h6" />
        <path d="M10 20h4" />
        <path d="M12 20v2" />
        <path d="M15.5 3c-1.5 0-2.5.5-3.5 1.5C11 3.5 10 3 8.5 3 6 3 5 5 5 7.5v2C5 11 8 12 12 12s7-1 7-2.5v-2C19 5 18 3 15.5 3Z" />
      </SVG>
    ),
  },

  // ── Ortho (unchanged) ─────────────────────────────────────────────────────
  {
    id: 'braces',
    label: 'Ortho',
    render: (c = 'w-5 h-5') => (
      <SVG c={c}>
        <path d="M15.5 3c-1.5 0-2.5.5-3.5 1.5C11 3.5 10 3 8.5 3 6 3 4 5 4 7.5v2.5c0 4 2 8 3.5 11 .5 1 1.5 1 2 0 1.5-3.5 1.5-6.5 2.5-6.5S13 17.5 14.5 21c.5 1 1.5 1 2 0C18 18 20 14 20 10V7.5C20 5 18 3 15.5 3Z" />
        <path d="M2 10h20" />
        <rect x="9.5" y="8.5" width="5" height="3" rx="0.5" />
      </SVG>
    ),
  },

  // ── Cotton swab (angled ~45°, two puff circles at each end) ────────────────
  {
    id: 'cotton',
    label: 'Cotton',
    render: (c = 'w-5 h-5') => (
      <SVG c={c}>
        {/* Top-right puff */}
        <circle cx="17" cy="5" r="2.5" />
        {/* Stick from puff edge to puff edge at ~45° */}
        <line x1="15.2" y1="6.8" x2="8.8" y2="17.2" />
        {/* Bottom-left puff */}
        <circle cx="7" cy="19" r="2.5" />
      </SVG>
    ),
  },

  // ── Bur (flipped: pointed cutting tip at TOP, shank at BOTTOM) ─────────────
  {
    id: 'drill',
    label: 'Burs',
    render: (c = 'w-5 h-5') => (
      <SVG c={c}>
        {/* Pointed cutting tip at top */}
        <path d="M9.5 4 L12 1.5 L14.5 4" />
        {/* Head — straight parallel sides */}
        <line x1="9.5" y1="4" x2="9.5" y2="11" />
        <line x1="14.5" y1="4" x2="14.5" y2="11" />
        {/* Serration lines across head */}
        <line x1="9.5" y1="6.5" x2="14.5" y2="6.5" />
        <line x1="9.5" y1="9" x2="14.5" y2="9" />
        {/* Neck taper: head fans in to shank */}
        <path d="M9.5 11 L12 13" />
        <path d="M14.5 11 L12 13" />
        {/* Shank — long thin rod at bottom */}
        <line x1="12" y1="13" x2="12" y2="22" />
      </SVG>
    ),
  },

  // ── Disposables (cup — unchanged) ─────────────────────────────────────────
  {
    id: 'cup',
    label: 'Disposables',
    render: (c = 'w-5 h-5') => (
      <SVG c={c}>
        <path d="M6 5l2 15h8l2-15Z" />
        <path d="M4 5h16" />
        <path d="M8 10h8" />
        <path d="M8.5 15h7" />
      </SVG>
    ),
  },


  {
    id: 'shield',
    label: 'Eyewear',
    render: (c = 'w-5 h-5') => (
      <SVG c={c}>
        {/* Left lens — inset from edge */}
        <rect x="2" y="9" width="8" height="6" rx="3" />
        {/* Right lens */}
        <rect x="14" y="9" width="8" height="6" rx="3" />
        {/* Bridge */}
        <line x1="10" y1="12" x2="14" y2="12" />
        {/* Left temple arm — stays inside bounds */}
        <line x1="2" y1="10" x2="1" y2="4" />
        {/* Right temple arm */}
        <line x1="22" y1="10" x2="23" y2="4" />
      </SVG>
    ),
  },
]

export function getIcon(id?: string | null): IconDef {
  return ICONS.find(i => i.id === id) ?? ICONS[0]
}
