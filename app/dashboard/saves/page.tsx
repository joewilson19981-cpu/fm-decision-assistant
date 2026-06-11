import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function SavesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const saves = await prisma.save.findMany({
    where: { userId: user.id },
    include: { seasons: { orderBy: { createdAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Saves</h1>
          <p className="text-zinc-500 text-sm mt-1">All your FM saves</p>
        </div>
        <Link
          href="/dashboard/saves/new"
          className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + New Save
        </Link>
      </div>

      {saves.length === 0 ? (
        <div className="rounded-xl card-panel border border-white/[0.06] p-10 text-center">
          <div className="text-4xl mb-3">⚽</div>
          <h2 className="text-lg font-semibold text-white mb-2">No saves yet</h2>
          <Link href="/dashboard/saves/new" className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Create your first save
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {saves.map(save => (
            <Link key={save.id} href={`/dashboard/saves/${save.id}`}>
              <div className="rounded-xl card-panel border border-white/[0.06] p-5 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{save.name}</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {save.fmVersion} · {save.startingClub} · {save.country}
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">{save.seasons.length} season{save.seasons.length !== 1 ? 's' : ''}</p>
                </div>
                <span className="text-xs  text-zinc-400 px-3 py-1 rounded-full">{save.fmVersion}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
