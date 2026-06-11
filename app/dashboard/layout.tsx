import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, LayoutDashboard, Database, Calendar, Camera, Star, ClipboardList, BarChart2, Users, BookOpen } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col fixed inset-y-0">
        <div className="px-4 py-5 border-b border-gray-700">
          <h1 className="text-sm font-bold text-white leading-tight">FM Decision<br />Assistant</h1>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          <NavLink href="/dashboard" icon={<LayoutDashboard size={16} />} label="Dashboard" />
          <NavLink href="/dashboard/saves" icon={<Database size={16} />} label="Saves" />
          <NavLink href="/dashboard/seasons" icon={<Calendar size={16} />} label="Seasons" />
          <NavLink href="/dashboard/checkpoints" icon={<Camera size={16} />} label="Checkpoints" />
          <NavLink href="/dashboard/compare" icon={<BarChart2 size={16} />} label="Compare" />
          <NavLink href="/dashboard/players" icon={<Users size={16} />} label="Players" />
          <NavLink href="/dashboard/recommendations" icon={<Star size={16} />} label="Recommendations" />
          <NavLink href="/dashboard/action-plan" icon={<ClipboardList size={16} />} label="Action Plan" />
          <NavLink href="/dashboard/tactic-library" icon={<BookOpen size={16} />} label="Tactic Library" />
        </nav>

        <div className="px-4 py-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-3 truncate">{user.email}</p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-white w-full"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 flex-1 p-6">
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
    >
      {icon}
      {label}
    </Link>
  )
}
