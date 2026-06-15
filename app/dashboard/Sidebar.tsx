'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Database, Camera,
  BarChart2, Users, Star, ClipboardList, BookOpen, LogOut,
  Layers, GraduationCap, ArrowLeftRight, Target, Zap, MessageSquare, TrendingUp,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard/assistant', icon: MessageSquare, label: 'Assistant', highlight: true },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/dashboard/analytics', icon: TrendingUp, label: 'Analytics' },
  { href: '/dashboard/saves', icon: Database, label: 'Saves' },
  { href: '/dashboard/checkpoints', icon: Camera, label: 'Checkpoints' },
  { href: '/dashboard/compare', icon: BarChart2, label: 'Compare' },
  { href: '/dashboard/players', icon: Users, label: 'Players' },
  { href: '/dashboard/recommendations', icon: Star, label: 'Recommendations' },
  { href: '/dashboard/action-plan', icon: ClipboardList, label: 'Action Plan' },
]

const TOOLS = [
  { href: '/dashboard/game-update', icon: Zap, label: 'Game Update' },
  { href: '/dashboard/tactic-library', icon: BookOpen, label: 'Tactic Library' },
  { href: '/dashboard/set-pieces', icon: Target, label: 'Set Pieces' },
  { href: '/dashboard/squad-depth', icon: Layers, label: 'Squad Depth' },
  { href: '/dashboard/youth', icon: GraduationCap, label: 'Youth Tracker' },
  { href: '/dashboard/transfer-planner', icon: ArrowLeftRight, label: 'Transfer Planner' },
]

export default function Sidebar({ email }: { email: string }) {
  const pathname = usePathname()

  function active(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <aside
      className="w-56 flex flex-col fixed inset-y-0 z-20"
      style={{ background: '#080808', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Brand */}
      <div className="px-5 h-14 flex items-center flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#080808" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">FM Assistant</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="px-3 space-y-0.5">
          {NAV.map(item => {
            const on = active(item.href, item.exact)
            const isHighlight = (item as any).highlight && !on
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors duration-100"
                style={on
                  ? { color: '#ffffff', background: 'rgba(255,255,255,0.06)' }
                  : isHighlight
                  ? { color: '#ffffff', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }
                  : { color: '#555555' }
                }
              >
                <item.icon size={14} className="flex-shrink-0" strokeWidth={on || isHighlight ? 2.5 : 2} />
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="mx-4 my-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />

        <div className="px-3 space-y-0.5">
          <p className="px-2.5 pb-1.5 text-[10px] font-medium uppercase tracking-widest" style={{ color: '#333333' }}>Tools</p>
          {TOOLS.map(item => {
            const on = active(item.href)
            const isHighlight = (item as any).highlight && !on
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors duration-100"
                style={on
                  ? { color: '#ffffff', background: 'rgba(255,255,255,0.06)' }
                  : isHighlight
                  ? { color: '#ffffff', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }
                  : { color: '#555555' }
                }
              >
                <item.icon size={14} className="flex-shrink-0" strokeWidth={on || isHighlight ? 2.5 : 2} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-[11px] truncate mb-2.5" style={{ color: '#333333' }}>{email}</p>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex items-center gap-1.5 text-[12px] transition-colors duration-100 hover:text-white"
            style={{ color: '#444444' }}
          >
            <LogOut size={12} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
