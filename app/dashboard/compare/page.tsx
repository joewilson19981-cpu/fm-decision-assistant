import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const MILESTONES = [
  { type: 'pre_season', label: 'Pre-season', short: 'Pre' },
  { type: 'game_10',    label: 'After 10',   short: '10G' },
  { type: 'game_23',    label: 'After 23',   short: '23G' },
  { type: 'game_35',    label: 'After 35',   short: '35G' },
  { type: 'game_46',    label: 'After 46',   short: '46G' },
]

export default async function ComparePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const seasons = await prisma.season.findMany({
    where: { save: { userId: user.id } },
    include: {
      save: true,
      checkpoints: { include: { teamStats: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const byLeague: Record<string, typeof seasons> = {}
  for (const s of seasons) {
    const key = s.leagueName ?? 'Unknown'
    if (!byLeague[key]) byLeague[key] = []
    byLeague[key].push(s)
  }

  const allLeagues = Object.entries(byLeague)

  if (allLeagues.length === 0) {
    return (
      <div className="px-6 py-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Season Comparison</h1>
          <p className="text-[13px] mt-0.5" style={{ color: '#555' }}>Same league · same milestone · different seasons</p>
        </div>
        <div className="rounded-xl p-12 text-center"
          style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-4xl mb-3">📊</p>
          <h2 className="text-base font-semibold text-white mb-1">No data yet</h2>
          <p className="text-sm max-w-sm mx-auto" style={{ color: '#555' }}>
            Send screenshots at your game milestones — comparisons appear here automatically once you have data from multiple seasons.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Season Comparison</h1>
        <p className="text-[13px] mt-0.5" style={{ color: '#555' }}>
          Same league · same milestone · different seasons — see how you're progressing
        </p>
      </div>

      <div className="space-y-10">
        {allLeagues.map(([league, leagueSeasons]) => {
          const rows = leagueSeasons.map(season => {
            const cpByType: Record<string, any> = {}
            for (const cp of season.checkpoints) cpByType[cp.checkpointType] = cp
            return { season, cpByType }
          })

          const activeMilestones = MILESTONES.filter(m =>
            rows.some(r => r.cpByType[m.type]?.teamStats)
          )

          return (
            <div key={league}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-white">{league}</h2>
                <span className="text-[11px]" style={{ color: '#444' }}>
                  {leagueSeasons.length} season{leagueSeasons.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Overview matrix */}
              <div className="rounded-xl overflow-hidden mb-4"
                style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-widest w-44"
                          style={{ color: '#444' }}>Season</th>
                        {MILESTONES.map(m => (
                          <th key={m.type} className="px-3 py-3 text-center min-w-[90px]">
                            <span className="text-[12px] font-bold text-white block">{m.short}</span>
                            <span className="text-[10px]" style={{ color: '#444' }}>{m.label}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(({ season, cpByType }) => (
                        <tr key={season.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td className="px-4 py-3">
                            <Link href={`/dashboard/saves/${season.saveId}/seasons/${season.id}`}>
                              <p className="text-[13px] font-semibold text-white hover:text-zinc-300 transition-colors">
                                {season.seasonLabel}
                              </p>
                              <p className="text-[11px]" style={{ color: '#444' }}>{season.save.name}</p>
                            </Link>
                            <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-md"
                              style={season.status === 'active'
                                ? { background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }
                                : { background: 'rgba(255,255,255,0.05)', color: '#555', border: '1px solid rgba(255,255,255,0.06)' }
                              }>
                              {season.status}
                            </span>
                          </td>
                          {MILESTONES.map(m => {
                            const cp = cpByType[m.type]
                            const ts = cp?.teamStats
                            if (!ts) {
                              return (
                                <td key={m.type} className="px-3 py-3 text-center">
                                  <span style={{ color: '#333' }}>—</span>
                                </td>
                              )
                            }
                            return (
                              <td key={m.type} className="px-3 py-3 text-center">
                                <Link href={`/dashboard/saves/${season.saveId}/seasons/${season.id}/checkpoints/${cp.id}`}>
                                  <div className="rounded-lg px-1 py-1 transition-colors inline-block hover:bg-white/5">
                                    {ts.leaguePosition != null && (
                                      <p className="font-bold text-white text-[13px] leading-tight">
                                        {ts.leaguePosition}<span className="text-[10px]" style={{ color: '#555' }}>th</span>
                                      </p>
                                    )}
                                    {ts.points != null && (
                                      <p className="text-[11px]" style={{ color: '#666' }}>{ts.points}pts</p>
                                    )}
                                    {ts.wins != null && (
                                      <p className="text-[10px]" style={{ color: '#444' }}>{ts.wins}W·{ts.draws}D·{ts.losses}L</p>
                                    )}
                                  </div>
                                </Link>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-2.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-[11px]" style={{ color: '#444' }}>
                    {activeMilestones.length === 0
                      ? 'No checkpoint data yet — send screenshots at each milestone'
                      : `${activeMilestones.length} of 5 milestones have data · click any cell to view that checkpoint`}
                  </p>
                </div>
              </div>

              {/* Detailed breakdown for milestones with 2+ seasons */}
              {activeMilestones
                .filter(m => rows.filter(r => r.cpByType[m.type]?.teamStats).length >= 2)
                .map(m => {
                  const dataRows = rows.filter(r => r.cpByType[m.type]?.teamStats)
                  const best = {
                    leaguePosition: Math.min(...dataRows.map(r => r.cpByType[m.type].teamStats.leaguePosition ?? 99)),
                    points:         Math.max(...dataRows.map(r => r.cpByType[m.type].teamStats.points ?? 0)),
                    goalDiff:       Math.max(...dataRows.map(r => r.cpByType[m.type].teamStats.goalDiff ?? -99)),
                    goalsFor:       Math.max(...dataRows.map(r => r.cpByType[m.type].teamStats.goalsFor ?? 0)),
                  }

                  return (
                    <div key={m.type} className="rounded-xl overflow-hidden mb-4"
                      style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <p className="text-[13px] font-semibold text-white">{m.label} — full breakdown</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              {['Season','Pos','P','W','D','L','GF','GA','GD','Pts','xG','Poss%'].map(h => (
                                <th key={h} className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-widest text-center first:text-left first:px-4"
                                  style={{ color: '#444' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {dataRows.map(({ season, cpByType }) => {
                              const ts = cpByType[m.type].teamStats
                              const cp = cpByType[m.type]
                              const isBestPos = ts.leaguePosition === best.leaguePosition
                              const isBestPts = ts.points === best.points
                              const isBestGD  = ts.goalDiff === best.goalDiff

                              return (
                                <tr key={season.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                  <td className="px-4 py-2.5">
                                    <Link href={`/dashboard/saves/${season.saveId}/seasons/${season.id}/checkpoints/${cp.id}`}>
                                      <p className="text-[13px] font-semibold text-white hover:text-zinc-300 transition-colors">
                                        {season.seasonLabel}
                                      </p>
                                    </Link>
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <span className="text-[13px] font-bold" style={{ color: isBestPos ? '#34d399' : '#ffffff' }}>
                                      {ts.leaguePosition ?? '—'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-[13px]" style={{ color: '#777' }}>{ts.played ?? '—'}</td>
                                  <td className="px-3 py-2.5 text-center text-[13px]" style={{ color: '#777' }}>{ts.wins ?? '—'}</td>
                                  <td className="px-3 py-2.5 text-center text-[13px]" style={{ color: '#777' }}>{ts.draws ?? '—'}</td>
                                  <td className="px-3 py-2.5 text-center text-[13px]" style={{ color: '#777' }}>{ts.losses ?? '—'}</td>
                                  <td className="px-3 py-2.5 text-center text-[13px]" style={{ color: '#777' }}>{ts.goalsFor ?? '—'}</td>
                                  <td className="px-3 py-2.5 text-center text-[13px]" style={{ color: '#777' }}>{ts.goalsAgainst ?? '—'}</td>
                                  <td className="px-3 py-2.5 text-center">
                                    <span className="text-[13px] font-medium" style={{ color: isBestGD ? '#34d399' : '#777' }}>
                                      {ts.goalDiff != null ? (ts.goalDiff > 0 ? `+${ts.goalDiff}` : ts.goalDiff) : '—'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <span className="text-[13px] font-bold" style={{ color: isBestPts ? '#34d399' : '#ffffff' }}>
                                      {ts.points ?? '—'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-[13px]" style={{ color: '#666' }}>
                                    {ts.xg != null ? Number(ts.xg).toFixed(1) : '—'}
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-[13px]" style={{ color: '#666' }}>
                                    {ts.possession != null ? `${Number(ts.possession).toFixed(0)}%` : '—'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-4 py-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <p className="text-[11px]" style={{ color: '#444' }}>Green = best value across seasons</p>
                      </div>
                    </div>
                  )
                })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
