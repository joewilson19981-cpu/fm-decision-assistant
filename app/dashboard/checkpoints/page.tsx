import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const TYPE_LABELS: Record<string, string> = {
  pre_season: 'Pre-season',
  game_10: 'Game 10',
  game_23: 'Game 23',
  game_35: 'Game 35',
  game_46: 'Game 46',
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
    <div className="px-6 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Checkpoints</h1>
        <p className="text-[13px] mt-0.5" style={{ color: '#555' }}>All checkpoints across your saves</p>
      </div>

      {checkpoints.length === 0 ? (
        <div className="rounded-xl p-12 text-center"
          style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-4xl mb-3">📋</p>
          <h2 className="text-base font-semibold text-white mb-1">No checkpoints yet</h2>
          <p className="text-sm mb-4" style={{ color: '#555' }}>
            Use the Assistant to set up your save and send screenshots at 10, 23, 35, and 46 games.
          </p>
          <Link href="/dashboard/assistant"
            className="inline-block text-sm font-medium px-4 py-2 rounded-lg text-black bg-white hover:bg-zinc-200 transition-colors">
            Open Assistant
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {checkpoints.map(cp => (
            <Link key={cp.id} href={`/dashboard/saves/${cp.season.saveId}/seasons/${cp.seasonId}/checkpoints/${cp.id}`}>
              <div className="rounded-xl px-5 py-4 flex items-center justify-between transition-colors hover:border-white/10 cursor-pointer"
                style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[14px] font-semibold text-white">
                      {TYPE_LABELS[cp.checkpointType] ?? cp.checkpointType}
                    </h3>
                    <span className="text-[11px]" style={{ color: '#444' }}>
                      {cp.season.seasonLabel} · {cp.season.save.name}
                    </span>
                  </div>
                  <p className="text-[12px] mt-0.5" style={{ color: '#555' }}>
                    {[
                      cp.calendarPhase,
                      cp.gamesPlayed != null ? `${cp.gamesPlayed} games` : null,
                      cp.inGameDate ? new Date(cp.inGameDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg flex-shrink-0"
                  style={cp.status === 'confirmed'
                    ? { background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }
                    : { background: 'rgba(255,255,255,0.05)', color: '#555', border: '1px solid rgba(255,255,255,0.06)' }
                  }
                >
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
