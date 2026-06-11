'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Database, Calendar, Camera,
  BarChart2, Users, Star, ClipboardList, BookOpen, Zap, LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/dashboard/saves', icon: Database, label: 'Saves' },
  { href: '/dashboard/seasons', icon: Calendar, label: 'Seasons' },
  { href: '/dashboard/checkpoints', icon: Camera, label: 'Checkpoints' },
  { href: '/dashboard/compare', icon: BarChart2, label: 'Compare' },
  { href: '/dashboard/players', icon: Users, label: 'Players' },
  { href: '/dashboard/recommendations', icon: Star, label: 'Recommendations' },
  { href: '/dashboard/action-plan', icon: ClipboardList, label: 'Action Plan' },
]

const TOOL_ITEMS = [
  { href: '/dashboard/tactic-library', icon: BookOpen, label: 'Tactic Library' },
]

export default function Sidebar({ email }: { email: string }) {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="w-60 flex flex-col fixed inset-y-0 z-20"
      style={{
        background: 'linear-gradient(180deg, #08102a 0%, #070d21 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Brand */}
      <div className="px-5 py-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}
          >
            <Zap size={14} className="text-white" fill="white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white tracking-tight leading-tight">FM Assistant</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: '#3d4f70' }}>Career Analytics</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={active ? {
                background: 'rgba(99,102,241,0.14)',
                color: '#a5b4fc',
                boxShadow: 'inset 2px 0 0 #6366f1',
              } : {
                color: '#4a5e80',
              }}
            >
              <item.icon size={15} className="flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}

        <div className="mx-1 my-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} />

        <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#2a3a55' }}>Tools</p>
        {TOOL_ITEMS.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={active ? {
                background: 'rgba(99,102,241,0.14)',
                color: '#a5b4fc',
                boxShadow: 'inset 2px 0 0 #6366f1',
              } : {
                color: '#4a5e80',
              }}
            >
              <item.icon size={15} className="flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-xs truncate mb-3" style={{ color: '#2e4060' }}>{email}</p>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex items-center gap-2 text-xs transition-colors duration-150 hover:text-slate-400"
            style={{ color: '#2e4060' }}
          >
            <LogOut size={13} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
