import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import CheckpointActions from './CheckpointActions'

const TYPE_LABELS: Record<string, string> = {
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

export default async function CheckpointDetailPage({
  params,
}: {
  params: Promise<{ saveId: string; seasonId: string; checkpointId: string }>
}) {
  const { saveId, seasonId, checkpointId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const checkpoint = await prisma.checkpoint.findFirst({
    where: { id: checkpointId, seasonId },
    include: {
      season: { include: { save: true } },
      teamStats: true,
      leagueTableSnapshots: { orderBy: { position: 'asc' } },
      tacticSnapshot: true,
      financeSnapshot: true,
      medicalSnapshot: true,
      playerStats: { include: { player: true } },
      screenshots: true,
    },
  })

  if (!checkpoint || checkpoint.season.save.userId !== user.id) notFound()

  const base = `/dashboard/saves/${saveId}/seasons/${seasonId}/checkpoints/${checkpointId}`
  const typeLabel = TYPE_LABELS[checkpoint.checkpointType] ?? checkpoint.checkpointType

  const sections = [
    {
      key: 'team-stats',
      label: '📊 Team Stats',
      done: !!checkpoint.teamStats,
      summary: checkpoint.teamStats
        ? `${checkpoint.teamStats.leaguePosition != null ? `P${checkpoint.teamStats.leaguePosition}` : '—'} · ${checkpoint.teamStats.played ?? '—'} played · ${checkpoint.teamStats.points ?? '—'} pts`
        : null,
    },
    {
      key: 'league-table',
      label: '🏆 League Table',
      done: checkpoint.leagueTableSnapshots.length > 0,
      summary: checkpoint.leagueTableSnapshots.length > 0
        ? `${checkpoint.leagueTableSnapshots.length} teams entered`
        : null,
    },
    {
      key: 'tactic',
      label: '🎮 Tactic',
      done: !!checkpoint.tacticSnapshot,
      summary: checkpoint.tacticSnapshot?.formation ?? null,
    },
    {
      key: 'finances',
      label: '💰 Finances',
      done: !!checkpoint.financeSnapshot,
      summary: checkpoint.financeSnapshot?.balance != null
        ? `Balance: £${checkpoint.financeSnapshot.balance.toLocaleString()}`
        : null,
    },
    {
      key: 'medical',
      label: '🏥 Medical',
      done: !!checkpoint.medicalSnapshot,
      summary: checkpoint.medicalSnapshot?.currentInjuries != null
        ? `${checkpoint.medicalSnapshot.currentInjuries} current injuries`
        : null,
    },
    {
      key: 'player-stats',
      label: '👤 Player Stats',
      done: checkpoint.playerStats.length > 0,
      summary: checkpoint.playerStats.length > 0
        ? `${checkpoint.playerStats.length} players entered`
        : null,
    },
    {
      key: 'screenshots',
      label: '📸 Screenshots',
      done: checkpoint.screenshots.length > 0,
      summary: checkpoint.screenshots.length > 0
        ? `${checkpoint.screenshots.length} screenshot${checkpoint.screenshots.length !== 1 ? 's' : ''}`
        : null,
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href={`/dashboard/saves/${saveId}`} className="hover:text-gray-700">{checkpoint.season.save.name}</Link>
            <span>/</span>
            <Link href={`/dashboard/saves/${saveId}/seasons/${seasonId}`} className="hover:text-gray-700">{checkpoint.season.seasonLabel}</Link>
            <span>/</span>
            <span>{typeLabel}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{typeLabel}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {checkpoint.calendarPhase && `${checkpoint.calendarPhase} · `}
            {checkpoint.gamesPlayed != null && `${checkpoint.gamesPlayed} games played`}
          </p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${
          checkpoint.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {checkpoint.status === 'confirmed' ? 'Confirmed' : 'Draft'}
        </span>
      </div>

      {checkpoint.notes && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <p className="text-xs font-medium text-gray-500 mb-0.5">Notes</p>
          <p className="text-sm text-gray-900">{checkpoint.notes}</p>
        </div>
      )}

      {/* AI actions row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Link href={`${base}/ai-import`} className="sm:col-span-2">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 hover:from-blue-700 hover:to-purple-700 transition-all cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">🤖 AI Import</p>
                <p className="text-blue-100 text-xs mt-0.5">Drop screenshots — Claude fills all sections</p>
              </div>
              <span className="text-white text-lg">→</span>
            </div>
          </div>
        </Link>
        <Link href={`${base}/tactic-lab`}>
          <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-4 hover:from-slate-600 hover:to-slate-500 transition-all cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">🎮 Tactic Lab</p>
                <p className="text-slate-300 text-xs mt-0.5">Upload tactic screenshot for AI analysis</p>
              </div>
              <span className="text-white text-lg">→</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Debrief section */}
      <CheckpointActions
        checkpointId={checkpointId}
        saveId={saveId}
        seasonId={seasonId}
        existingDebrief={(checkpoint as any).aiDebrief ?? null}
      />

      {/* Data sections */}
      <h2 className="font-semibold text-gray-800 mb-3">Data Entry</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map(section => (
          <Link key={section.key} href={`${base}/${section.key}`}>
            <div className={`bg-white rounded-xl border p-5 hover:shadow-sm transition-all cursor-pointer ${
              section.done ? 'border-green-200' : 'border-gray-200 hover:border-blue-300'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-800">{section.label}</p>
                  {section.summary
                    ? <p className="text-xs text-gray-500 mt-1">{section.summary}</p>
                    : <p className="text-xs text-gray-400 mt-1">Not entered yet</p>
                  }
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                  section.done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {section.done ? 'Done' : 'Add'}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
