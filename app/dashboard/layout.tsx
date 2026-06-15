import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'
import DashboardShell from './DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#080808' }}>
      <Sidebar email={user.email ?? ''} />
      {/* ml-56 matches the sidebar width */}
      <div className="ml-56 flex-1 flex relative">
        <DashboardShell>
          {children}
        </DashboardShell>
      </div>
    </div>
  )
}
