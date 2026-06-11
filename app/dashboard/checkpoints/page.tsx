import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const TYPE_LABELS: Record<string, string> = {
  pre_season: 'Pre-season',
  transfer_window: 'Transfer window',
  mid_season: 'Mid-season',
  end_of_season: 'End of season',
  custom: 'Custom',
}

export default async function CheckpointsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const checkpoints = await prisma.checkpoint.findMany({
    where: { season: { save: { userId: user.id } } },
    include: { season: { include: { save: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Checkpoints</h1>
        <p className="text-zinc-500 text-sm mt-1">All checkpoints across your saves</p>
      </div>

      {checkpoints.length === 0 ? (
        <div className="rounded-xl card-panel border border-white/[0.06] p-10 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="text-lg font-semibold text-white mb-2">No checkpoints yet</h2>
          <p className="text-sm text-zinc-500 mb-4">Open a season and create a checkpoint.</p>
          <Link href="/dashboard/seasons" className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Go to Seasons
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {checkpoints.map(cp => (
            <Link key={cp.id} href={`/dashboard/saves/${cp.season.saveId}/seasons/${cp.seasonId}/checkpoints/${cp.id}`}>
              <div className="rounded-xl card-panel border border-white/[0.06] p-5 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{TYPE_LABELS[cp.checkpointType] ?? cp.checkpointType}</h3>
                    <span className="text-xs text-zinc-600">· {cp.season.seasonLabel} · {cp.season.save.name}</span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {cp.calendarPhase && `${cp.calendarPhase}`}
                    {cp.gamesPlayed != null && ` · ${cp.gamesPlayed} games`}
                    {cp.inGameDate && ` · ${new Date(cp.inGameDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${
                  cp.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {cp.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
