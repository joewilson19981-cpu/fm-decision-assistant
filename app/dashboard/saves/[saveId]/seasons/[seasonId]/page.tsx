import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const MILESTONES = [
  { type: 'pre_season', label: 'Pre-season',  shortLabel: 'Pre',  games: null, description: 'Before the season starts' },
  { type: 'game_10',   label: 'After 10 games', shortLabel: '10G', games: 10,  description: 'Early season check-in' },
  { type: 'game_23',   label: 'After 23 games', shortLabel: '23G', games: 23,  description: 'Halfway point' },
  { type: 'game_35',   label: 'After 35 games', shortLabel: '35G', games: 35,  description: 'Final stretch' },
  { type: 'game_46',   label: 'After 46 games', shortLabel: '46G', games: 46,  description: 'End of season review' },
]

// Also handle legacy types from before the milestone system
export const CHECKPOINT_LABELS: Record<string, string> = {
  pre_season:      'Pre-season',
  game_10:         'After 10 games',
  game_23:         'After 23 games',
  game_35:         'After 35 games',
  game_46:         'After 46 games',
  transfer_window: 'Transfer window',
  mid_season:      'Mid-season',
  end_of_season:   'End of season',
  custom:          'Custom',
}

export default async function SeasonDetailPage({
  params,
}: {
  params: Promise<{ saveId: string; seasonId: string }>
}) {
  const { saveId, seasonId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const season = await prisma.season.findFirst({
    where: { id: seasonId, saveId },
    include: {
      save: true,
      checkpoints: {
        orderBy: { createdAt: 'asc' },
        include: { teamStats: true },
      },
    },
  })

  if (!season || season.save.userId !== user.id) notFound()

  const base = `/dashboard/saves/${saveId}/seasons/${seasonId}`

  // Match each milestone to a checkpoint (by type)
  const milestoneCheckpoints = MILESTONES.map(m => ({
    milestone: m,
    checkpoint: season.checkpoints.find(cp => cp.checkpointType === m.type) ?? null,
  }))

  // Any checkpoints with legacy types (not in our milestone set)
  const legacyCheckpoints = season.checkpoints.filter(
    cp => !MILESTONES.some(m => m.type === cp.checkpointType)
  )

  const hasMilestones = milestoneCheckpoints.some(m => m.checkpoint)
  const completedCount = milestoneCheckpoints.filter(m => m.checkpoint?.teamStats).length

  const fmt = (d: Date | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard/saves" className="hover:text-gray-700">Saves</Link>
            <span>/</span>
            <Link href={`/dashboard/saves/${saveId}`} className="hover:text-gray-700">{season.save.name}</Link>
            <span>/</span>
            <span>{season.seasonLabel}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{season.seasonLabel}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{season.clubName} · {season.leagueName}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${
          season.status === 'active' ? 'bg-green-100 text-green-700' :
          season.status === 'completed' ? 'bg-gray-100 text-gray-600' :
          'bg-yellow-100 text-yellow-700'
        }`}>{season.status}</span>
      </div>

      {/* Season meta */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {season.boardExpectation && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Board expectation</p>
            <p className="font-semibold text-gray-900 text-sm">{season.boardExpectation}</p>
          </div>
        )}
        {season.transferBudget != null && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Transfer budget</p>
            <p className="font-semibold text-gray-900">£{season.transferBudget.toLocaleString()}</p>
          </div>
        )}
        {season.wageBudget != null && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Wage budget /wk</p>
            <p className="font-semibold text-gray-900">£{season.wageBudget.toLocaleString()}</p>
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Progress</p>
          <p className="font-semibold text-gray-900">{completedCount} / 5 checkpoints</p>
        </div>
      </div>

      {/* Objectives */}
      {(season.seasonObjective || season.tacticNotes || season.recruitmentPriorities) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 space-y-3">
          {season.seasonObjective && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-0.5">Objective</p>
              <p className="text-sm text-gray-900">{season.seasonObjective}</p>
            </div>
          )}
          {season.tacticNotes && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-0.5">Tactic notes</p>
              <p className="text-sm text-gray-900">{season.tacticNotes}</p>
            </div>
          )}
          {season.recruitmentPriorities && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-0.5">Recruitment priorities</p>
              <p className="text-sm text-gray-900">{season.recruitmentPriorities}</p>
            </div>
          )}
        </div>
      )}

      {/* Season roadmap */}
      <h2 className="font-semibold text-gray-800 mb-4">Season Checkpoints</h2>

      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-5">
        {milestoneCheckpoints.map(({ milestone, checkpoint }, i) => {
          const hasData = !!checkpoint?.teamStats
          const hasCheckpoint = !!checkpoint
          return (
            <div key={milestone.type} className="flex items-center flex-1">
              <div className={`flex-1 h-1.5 rounded-full ${
                hasData ? 'bg-blue-500' : hasCheckpoint ? 'bg-gray-200' : 'bg-gray-100'
              }`} />
              {i < milestoneCheckpoints.length - 1 && <div className="w-1" />}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {milestoneCheckpoints.map(({ milestone, checkpoint }, i) => {
          const hasData = !!checkpoint?.teamStats
          const ts = checkpoint?.teamStats

          if (!checkpoint) {
            // Shouldn't happen for new seasons, but handle gracefully
            return (
              <div key={milestone.type} className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-4 opacity-50">
                <p className="text-xs text-gray-400 font-medium">{milestone.label}</p>
                <p className="text-xs text-gray-400 mt-1">Not created</p>
              </div>
            )
          }

          return (
            <Link key={milestone.type} href={`${base}/checkpoints/${checkpoint.id}`}>
              <div className={`rounded-xl border p-4 hover:shadow-sm transition-all cursor-pointer h-full ${
                hasData
                  ? 'bg-white border-blue-200 hover:border-blue-400'
                  : 'bg-white border-gray-200 hover:border-blue-300'
              }`}>
                {/* Milestone label + status dot */}
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    hasData ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}>{milestone.shortLabel}</span>
                  <span className={`w-2 h-2 rounded-full mt-1 ${
                    hasData ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                </div>

                <p className="font-semibold text-gray-900 text-sm leading-tight">{milestone.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 mb-3">{milestone.description}</p>

                {ts ? (
                  <div className="space-y-1 pt-2 border-t border-gray-100">
                    {ts.leaguePosition != null && (
                      <p className="text-xs text-gray-600">
                        <span className="text-gray-400">Pos </span>
                        <span className="font-bold text-gray-900">{ts.leaguePosition}</span>
                      </p>
                    )}
                    {ts.points != null && (
                      <p className="text-xs text-gray-600">
                        <span className="text-gray-400">Pts </span>
                        <span className="font-bold text-gray-900">{ts.points}</span>
                      </p>
                    )}
                    {ts.wins != null && (
                      <p className="text-xs text-gray-500">{ts.wins}W {ts.draws}D {ts.losses}L</p>
                    )}
                    {checkpoint.inGameDate && (
                      <p className="text-xs text-gray-400">{fmt(checkpoint.inGameDate)}</p>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <span>🤖</span> AI Import ready
                    </p>
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Legacy checkpoints */}
      {legacyCheckpoints.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold text-gray-800 mb-3 text-sm text-gray-500">Previous checkpoints</h2>
          <div className="space-y-2">
            {legacyCheckpoints.map(cp => (
              <Link key={cp.id} href={`${base}/checkpoints/${cp.id}`}>
                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{CHECKPOINT_LABELS[cp.checkpointType] ?? cp.checkpointType}</p>
                    {cp.inGameDate && <p className="text-xs text-gray-400">{fmt(cp.inGameDate)}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    cp.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{cp.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
