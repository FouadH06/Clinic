'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const NAV = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/inventory',
    label: 'Inventory',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    href: '/suppliers',
    label: 'Suppliers',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'History',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:top-0 md:bottom-auto md:border-t-0 md:border-b md:border-slate-200 flex items-center h-[60px] md:h-[58px]">
      <div className="flex items-center justify-between w-full px-4 md:px-4 h-full">

        {/* Brand — desktop only */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <span className="text-[13px] font-bold text-slate-900 tracking-tight">Teissire Dental Clinic</span>
          <div className="w-px h-5 bg-slate-200 mx-1" />
        </div>

        {/* Nav links */}
        <div className="flex flex-1 md:flex-none justify-around md:justify-center md:gap-1 h-full items-center">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`
                  relative flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2
                  px-0 md:px-3 py-2 rounded-md text-[10px] md:text-[13px] font-medium
                  transition-all duration-150
                  ${active
                    ? 'text-teal-700 md:bg-teal-50/70 md:text-teal-800'
                    : 'text-slate-500 hover:text-slate-800 md:hover:bg-slate-50'
                  }
                `}
              >
                <span className={`transition-colors ${active ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {icon}
                </span>
                <span className={`tracking-wide ${active ? 'md:font-semibold' : ''}`}>{label}</span>
              </Link>
            )
          })}
        </div>

        {/* Logout — desktop */}
        <div className="hidden md:flex items-center gap-3">
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <button
            onClick={handleLogout}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
