import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#070c1b' }}>
      <Sidebar email={user.email ?? ''} />
      <main className="ml-60 flex-1 min-h-screen p-6">
        {children}
      </main>
    </div>
  )
}
