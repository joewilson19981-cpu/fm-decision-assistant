import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const MILESTONES = [
  { type: 'pre_season', label: 'Pre-season', short: 'Pre' },
  { type: 'game_10',   label: 'After 10',   short: '10G' },
  { type: 'game_23',   label: 'After 23',   short: '23G' },
  { type: 'game_35',   label: 'After 35',   short: '35G' },
  { type: 'game_46',   label: 'After 46',   short: '46G' },
]

export default async function ComparePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const seasons = await prisma.season.findMany({
    where: { save: { userId: user.id } },
    include: {
      save: true,
      checkpoints: {
        include: { teamStats: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Group seasons by league name
  const byLeague: Record<string, typeof seasons> = {}
  for (const s of seasons) {
    const key = s.leagueName ?? 'Unknown league'
    if (!byLeague[key]) byLeague[key] = []
    byLeague[key].push(s)
  }

  const allLeagues = Object.entries(byLeague)

  if (allLeagues.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Season Comparison</h1>
          <p className="text-gray-500 text-sm mt-1">Compare your stats at the same point across multiple seasons.</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-4xl mb-3">📊</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">No data yet</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Add seasons and use AI Import on checkpoints — comparisons will appear here automatically.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Season Comparison</h1>
        <p className="text-gray-500 text-sm mt-1">Same league · same milestone · different seasons — see how you're progressing.</p>
      </div>

      <div className="space-y-10">
        {allLeagues.map(([league, leagueSeasons]) => {
          const rows = leagueSeasons.map(season => {
            const cpByType: Record<string, any> = {}
            for (const cp of season.checkpoints) {
              cpByType[cp.checkpointType] = cp
            }
            return { season, cpByType }
          })

          // Which milestones have data in at least one season?
          const activeMilestones = MILESTONES.filter(m =>
            rows.some(r => r.cpByType[m.type]?.teamStats)
          )

          return (
            <div key={league}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 text-lg">{league}</h2>
                <span className="text-xs text-gray-400">{leagueSeasons.length} season{leagueSeasons.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Overview matrix */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-44">Season</th>
                      {MILESTONES.map(m => (
                        <th key={m.type} className="px-3 py-3 text-center min-w-[90px]">
                          <span className="text-xs font-bold text-gray-700 block">{m.short}</span>
                          <span className="text-xs text-gray-400 font-normal">{m.label}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.map(({ season, cpByType }) => (
                      <tr key={season.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <Link href={`/dashboard/saves/${season.saveId}/seasons/${season.id}`}>
                            <p className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-sm">
                              {season.seasonLabel}
                            </p>
                            <p className="text-xs text-gray-400">{season.save.name}</p>
                          </Link>
                          <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full ${
                            season.status === 'active' ? 'bg-green-100 text-green-700' :
                            season.status === 'completed' ? 'bg-gray-100 text-gray-500' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{season.status}</span>
                        </td>
                        {MILESTONES.map(m => {
                          const cp = cpByType[m.type]
                          const ts = cp?.teamStats
                          if (!ts) {
                            return (
                              <td key={m.type} className="px-3 py-3 text-center">
                                <span className="text-gray-200 text-sm">—</span>
                              </td>
                            )
                          }
                          return (
                            <td key={m.type} className="px-3 py-3 text-center">
                              <Link href={`/dashboard/saves/${season.saveId}/seasons/${season.id}/checkpoints/${cp.id}`}>
                                <div className="hover:bg-blue-50 rounded-lg px-1 py-1 transition-colors inline-block">
                                  {ts.leaguePosition != null && (
                                    <p className="font-bold text-gray-900 text-sm leading-tight">
                                      {ts.leaguePosition}<span className="text-xs text-gray-400 font-normal">th</span>
                                    </p>
                                  )}
                                  {ts.points != null && (
                                    <p className="text-xs text-gray-500">{ts.points} pts</p>
                                  )}
                                  {ts.wins != null && (
                                    <p className="text-xs text-gray-400">{ts.wins}W·{ts.draws}D·{ts.losses}L</p>
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

                <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
                  <p className="text-xs text-gray-400">
                    {activeMilestones.length === 0
                      ? 'No checkpoint data yet — use AI Import on each checkpoint to populate this table'
                      : `${activeMilestones.length} of 5 milestones filled · click any cell to view that checkpoint`
                    }
                  </p>
                </div>
              </div>

              {/* Detailed breakdown for each milestone that has 2+ seasons of data */}
              {activeMilestones.filter(m =>
                rows.filter(r => r.cpByType[m.type]?.teamStats).length >= 2
              ).map(m => {
                const dataRows = rows.filter(r => r.cpByType[m.type]?.teamStats)

                // Compute best values for each stat (for highlighting)
                const best = {
                  leaguePosition: Math.min(...dataRows.map(r => r.cpByType[m.type].teamStats.leaguePosition ?? 99)),
                  points: Math.max(...dataRows.map(r => r.cpByType[m.type].teamStats.points ?? 0)),
                  wins: Math.max(...dataRows.map(r => r.cpByType[m.type].teamStats.wins ?? 0)),
                  goalsFor: Math.max(...dataRows.map(r => r.cpByType[m.type].teamStats.goalsFor ?? 0)),
                  goalDiff: Math.max(...dataRows.map(r => r.cpByType[m.type].teamStats.goalDiff ?? -99)),
                }

                return (
                  <div key={m.type} className="bg-white rounded-xl border border-gray-200 overflow-x-auto mb-4">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <p className="font-semibold text-gray-800 text-sm">{m.label} — full breakdown</p>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Season','Pos','P','W','D','L','GF','GA','GD','Pts','xG','Poss%'].map(h => (
                            <th key={h} className="px-3 py-2 text-center text-xs text-gray-400 font-medium first:text-left first:px-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {dataRows.map(({ season, cpByType }) => {
                          const ts = cpByType[m.type].teamStats
                          const isBestPos = ts.leaguePosition === best.leaguePosition
                          const isBestPts = ts.points === best.points
                          const isBestGD = ts.goalDiff === best.goalDiff

                          return (
                            <tr key={season.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2.5">
                                <p className="font-semibold text-gray-900 text-xs">{season.seasonLabel}</p>
                              </td>
                              <td className={`px-3 py-2.5 text-center font-bold text-sm ${isBestPos ? 'text-green-600' : 'text-gray-800'}`}>
                                {ts.leaguePosition ?? <span className="text-gray-200">—</span>}
                              </td>
                              <td className="px-3 py-2.5 text-center text-gray-600">{ts.played ?? '—'}</td>
                              <td className="px-3 py-2.5 text-center text-gray-600">{ts.wins ?? '—'}</td>
                              <td className="px-3 py-2.5 text-center text-gray-600">{ts.draws ?? '—'}</td>
                              <td className="px-3 py-2.5 text-center text-gray-600">{ts.losses ?? '—'}</td>
                              <td className="px-3 py-2.5 text-center text-gray-600">{ts.goalsFor ?? '—'}</td>
                              <td className="px-3 py-2.5 text-center text-gray-600">{ts.goalsAgainst ?? '—'}</td>
                              <td className={`px-3 py-2.5 text-center font-medium ${isBestGD ? 'text-green-600' : 'text-gray-600'}`}>
                                {ts.goalDiff != null ? (ts.goalDiff > 0 ? `+${ts.goalDiff}` : ts.goalDiff) : '—'}
                              </td>
                              <td className={`px-3 py-2.5 text-center font-bold ${isBestPts ? 'text-green-600' : 'text-gray-800'}`}>
                                {ts.points ?? '—'}
                              </td>
                              <td className="px-3 py-2.5 text-center text-gray-600">{ts.xg ?? '—'}</td>
                              <td className="px-3 py-2.5 text-center text-gray-600">
                                {ts.possession != null ? `${ts.possession}%` : '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                      <p className="text-xs text-gray-400">Green = best value across seasons</p>
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
