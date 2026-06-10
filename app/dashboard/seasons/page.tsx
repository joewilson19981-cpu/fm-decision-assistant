import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function SeasonsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const seasons = await prisma.season.findMany({
    where: { save: { userId: user.id } },
    include: { save: true, checkpoints: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seasons</h1>
        <p className="text-gray-500 text-sm mt-1">All seasons across your saves</p>
      </div>

      {seasons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-4xl mb-3">📅</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">No seasons yet</h2>
          <p className="text-sm text-gray-500 mb-4">Open a save and add a season to get started.</p>
          <Link href="/dashboard/saves" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Go to Saves
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {seasons.map(season => (
            <Link key={season.id} href={`/dashboard/saves/${season.saveId}/seasons/${season.id}`}>
              <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{season.seasonLabel}</h3>
                    <span className="text-xs text-gray-400">· {season.save.name}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{season.clubName} · {season.leagueName}</p>
                  <p className="text-xs text-gray-400 mt-1">{season.checkpoints.length} checkpoint{season.checkpoints.length !== 1 ? 's' : ''}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${
                  season.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {season.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
