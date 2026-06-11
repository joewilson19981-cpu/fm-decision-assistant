import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import DeleteSaveButton from './DeleteSaveButton'

export default async function SaveDetailPage({ params }: { params: Promise<{ saveId: string }> }) {
  const { saveId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const save = await prisma.save.findFirst({
    where: { id: saveId, userId: user.id },
    include: {
      seasons: {
        orderBy: { createdAt: 'desc' },
        include: {
          checkpoints: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { teamStats: true },
          },
        },
      },
    },
  })

  if (!save) notFound()

  // Find the most recent checkpoint across all seasons that has data
  const latestCheckpoint = save.seasons
    .flatMap(s => s.checkpoints.map(cp => ({ ...cp, season: s })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  const latest = latestCheckpoint
  const ts = latest?.teamStats

  const formatDate = (d: Date | null | undefined) => {
    if (!d) return null
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
            <Link href="/dashboard/saves" className="hover:text-zinc-300">Saves</Link>
            <span>/</span>
            <span>{save.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{save.name}</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {save.startingClub}{save.country ? ` · ${save.country}` : ''} · FM{save.fmVersion}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/saves/${save.id}/transfers`}
            className="border border-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50"
          >
            💸 Transfer Advisor
          </Link>
          <Link
            href={`/dashboard/saves/${save.id}/seasons/new`}
            className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + New Season
          </Link>
          <DeleteSaveButton saveId={save.id} saveName={save.name} />
        </div>
      </div>

      {/* Current snapshot */}
      {latest ? (
        <div className="rounded-xl card-panel border border-white/[0.06] p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Current Snapshot</h2>
            <Link
              href={`/dashboard/saves/${saveId}/seasons/${latest.seasonId}/checkpoints/${latest.id}`}
              className="text-xs text-white hover:opacity-70"
            >
              View checkpoint →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-zinc-500 mb-1">In-game date</p>
              <p className="font-semibold text-white">{formatDate(latest.inGameDate) ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Season</p>
              <p className="font-semibold text-white">{latest.season.seasonLabel}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Transfer window</p>
              <p className="font-semibold text-white">{latest.transferWindowStatus ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Calendar phase</p>
              <p className="font-semibold text-white">{latest.calendarPhase ?? '—'}</p>
            </div>
          </div>

          {ts && (
            <>
              <div className="border-t border-white/[0.04] mt-4 pt-4 grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
                {[
                  { label: 'Position', value: ts.leaguePosition != null ? `${ts.leaguePosition}` : '—' },
                  { label: 'Played', value: ts.played ?? '—' },
                  { label: 'W / D / L', value: ts.wins != null ? `${ts.wins} / ${ts.draws} / ${ts.losses}` : '—' },
                  { label: 'Goals', value: ts.goalsFor != null ? `${ts.goalsFor} – ${ts.goalsAgainst}` : '—' },
                  { label: 'Points', value: ts.points ?? '—' },
                  { label: 'xG', value: ts.xg ?? '—' },
                ].map(stat => (
                  <div key={stat.label} className="rounded-lg p-2">
                    <p className="text-xs text-zinc-500 mb-0.5">{stat.label}</p>
                    <p className="font-bold text-white text-sm">{String(stat.value)}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {!ts && (
            <p className="text-xs text-zinc-600 mt-3 pt-3 border-t border-white/[0.04]">
              No team stats yet — use AI Import on the checkpoint to fill these in.
            </p>
          )}
        </div>
      ) : (
        <div className=" border border-dashed border-white/10 rounded-xl p-6 mb-6 text-center">
          <p className="text-sm text-zinc-500">No checkpoints yet. Create a season and add a checkpoint to see your save snapshot here.</p>
        </div>
      )}

      {/* Philosophy */}
      {save.philosophy && (
        <div className="rounded-xl card-panel border border-white/[0.06] p-5 mb-6">
          <h2 className="font-semibold text-white mb-3">Save Philosophy</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {(save.philosophy as any).preferredFormation && (
              <div>
                <span className="text-zinc-500">Formation: </span>
                <span className="text-white">{(save.philosophy as any).preferredFormation}</span>
              </div>
            )}
            {(save.philosophy as any).recruitmentStyle && (
              <div>
                <span className="text-zinc-500">Recruitment: </span>
                <span className="text-white">{(save.philosophy as any).recruitmentStyle.replace(/_/g, ' ')}</span>
              </div>
            )}
            {(save.philosophy as any).longTermGoal && (
              <div className="col-span-2">
                <span className="text-zinc-500">Goal: </span>
                <span className="text-white">{(save.philosophy as any).longTermGoal}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seasons */}
      <div>
        <h2 className="font-semibold text-white mb-3">Seasons</h2>
        {save.seasons.length === 0 ? (
          <div className="rounded-xl card-panel border border-white/[0.06] p-10 text-center">
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-lg font-semibold text-white mb-2">No seasons yet</h3>
            <p className="text-sm text-zinc-500 mb-4">Add your first season to start tracking your progress.</p>
            <Link
              href={`/dashboard/saves/${save.id}/seasons/new`}
              className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Create first season
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {save.seasons.map(season => {
              const cp = season.checkpoints[0]
              const sts = cp?.teamStats
              return (
                <Link key={season.id} href={`/dashboard/saves/${save.id}/seasons/${season.id}`}>
                  <div className="rounded-xl card-panel border border-white/[0.06] p-5 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{season.seasonLabel}</h3>
                        <p className="text-sm text-zinc-500 mt-0.5">{season.clubName}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full shrink-0 ${
                        season.status === 'active' ? 'bg-green-100 text-green-700' :
                        season.status === 'completed' ? ' text-zinc-400' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {season.status}
                      </span>
                    </div>
                    {sts && (
                      <div className="flex gap-4 mt-3 pt-3 border-t border-white/[0.04] text-sm text-zinc-400">
                        {sts.leaguePosition != null && <span>📍 {sts.leaguePosition}{sts.leaguePosition === 1 ? 'st' : sts.leaguePosition === 2 ? 'nd' : sts.leaguePosition === 3 ? 'rd' : 'th'}</span>}
                        {sts.points != null && <span>🏆 {sts.points} pts</span>}
                        {sts.played != null && <span>⚽ {sts.played} played</span>}
                        {cp.inGameDate && <span>📅 {new Date(cp.inGameDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {save.notes && (
        <div className="rounded-xl card-panel border border-white/[0.06] p-5 mt-6">
          <h2 className="font-semibold text-white mb-2">Notes</h2>
          <p className="text-sm text-zinc-400 whitespace-pre-wrap">{save.notes}</p>
        </div>
      )}
    </div>
  )
}
