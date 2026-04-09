'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const NAV = [
  { href: '/',           label: 'Dashboard',  icon: '🏠' },
  { href: '/inventory',  label: 'Inventory',  icon: '📦' },
  { href: '/suppliers',  label: 'Suppliers',  icon: '🏢' },
  { href: '/history',    label: 'History',    icon: '📋' },
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 card-shadow md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="flex items-center justify-between max-w-6xl mx-auto px-2 md:px-6">
        {/* Logo — desktop only */}
        <div className="hidden md:flex items-center gap-2 py-3">
          <span className="text-2xl">🦷</span>
          <span className="font-bold text-teal-600 text-lg tracking-tight">Teissir</span>
        </div>

        {/* Nav links */}
        <div className="flex flex-1 md:flex-none justify-around md:justify-center md:gap-1">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-3 md:py-2 md:px-4 rounded-xl text-xs md:text-sm font-medium transition-all ${
                  active
                    ? 'text-teal-600 bg-teal-50'
                    : 'text-gray-500 hover:text-teal-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl md:text-base">{icon}</span>
                <span className="hidden md:block">{label}</span>
                <span className={`block md:hidden text-[10px] ${active ? 'text-teal-600' : 'text-gray-400'}`}>{label}</span>
              </Link>
            )
          })}
        </div>

        {/* Logout — desktop */}
        <button
          onClick={handleLogout}
          className="hidden md:flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </nav>
  )
}
