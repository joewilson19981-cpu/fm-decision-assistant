'use client'

import { useState } from 'react'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────────

export type TeamStats = {
  leaguePosition: number | null
  played: number | null
  points: number | null
  wins: number | null
  draws: number | null
  losses: number | null
  goalsFor: number | null
  goalsAgainst: number | null
  xg: number | null
  cleanSheets: number | null
  possession: number | null
  passCompletion: number | null
  shotsPerGame: number | null
}

export type LeagueRow = {
  position: number
  teamName: string
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  form: string | null
  isYourTeam: boolean
}

export type SeasonJourney = {
  seasonId: string
  label: string
  league: string
  isCurrent: boolean
  bestMilestone: string
  gamesPlayed: number | null
  position: number | null
  points: number | null
  goalsFor: number | null
  goalsAgainst: number | null
  wins: number | null
  draws: number | null
  losses: number | null
  topScorer: { name: string; goals: number } | null
  isComplete: boolean
}

export type MilestoneCard = {
  type: string
  label: string
  gamesTarget: number
  hasData: boolean
  isCurrent: boolean
  position: number | null
  points: number | null
  goalsFor: number | null
  wins: number | null
}

export type SquadPlayer = {
  id: string
  name: string
  position: string | null
  age: number | null
  apps: number | null
  goals: number | null
  assists: number | null
  cleanSheets: number | null
  avgRating: number | null
}

export type AllTimeRecord = {
  id: string
  name: string
  position: string | null
  seasons: number
  apps: number
  goals: number
  assists: number
  cleanSheets: number
  avgRating: number | null
}

type Props = {
  empty?: boolean
  noCheckpoint?: boolean

  saveId: string
  saveName: string
  clubName: string
  seasonId: string
  seasonLabel: string
  leagueName: string
  checkpointId: string
  checkpointType: string
  inGameDate: string | null
  transferWindow: string | null

  teamStats: TeamStats | null
  formStr: string | null
  tactic: { formation: string | null; mentality: string | null } | null
  finance: { balance: number | null; transferBudget: number | null; wageBudget: number | null; wageSpend: number | null } | null
  medical: { currentInjuries: number | null; totalInjuries: number | null; condition: string | null; notes: string | null } | null
  leagueTable: LeagueRow[]

  journeySeasons: SeasonJourney[]
  milestoneComparison: {
    milestone: string
    currentPts: number
    prevPts: number
    ptsDiff: number
    currentPos: number
    prevPos: number
    posDiff: number
  } | null

  milestones: MilestoneCard[]
  currentSquad: SquadPlayer[]
  allTimeRecords: AllTimeRecord[]

  otherSaves: {
    id: string
    name: string
    club: string
    fmVersion: string
    league: string | null
    season: string | null
    position: number | null
    points: number | null
  }[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return '—'
  if (Math.abs(n) >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `£${(n / 1_000).toFixed(0)}K`
  return `£${n}`
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function ordinal(n: number): string {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

function getPositionCtx(pos: number | null | undefined) {
  if (pos == null) return { label: '', color: 'gray', accent: '#64748b', bg: 'from-slate-800 to-slate-700' }
  if (pos <= 2) return { label: 'Automatic promotion', color: 'emerald', accent: '#10b981', bg: 'from-emerald-900 to-slate-800' }
  if (pos <= 7) return { label: 'Playoff contender', color: 'blue', accent: '#3b82f6', bg: 'from-blue-900 to-slate-800' }
  if (pos <= 12) return { label: 'Mid-table', color: 'slate', accent: '#64748b', bg: 'from-slate-800 to-slate-700' }
  if (pos <= 18) return { label: 'Lower half', color: 'amber', accent: '#f59e0b', bg: 'from-amber-900 to-slate-800' }
  return { label: 'Relegation danger', color: 'red', accent: '#ef4444', bg: 'from-red-900 to-slate-800' }
}

function getFormStory(form: string | null): string {
  if (!form || form.length === 0) return ''
  const recent = form.slice(-5).split('')
  const wins = recent.filter(r => r === 'W').length
  const losses = recent.filter(r => r === 'L').length
  const consecutive = (() => {
    let streak = 1
    for (let i = recent.length - 1; i > 0; i--) {
      if (recent[i] === recent[i - 1]) streak++
      else break
    }
    return { type: recent[recent.length - 1], count: streak }
  })()
  if (consecutive.count >= 3 && consecutive.type === 'W') return `${consecutive.count}-game winning run`
  if (consecutive.count >= 3 && consecutive.type === 'L') return `${consecutive.count} losses on the spin`
  if (consecutive.count >= 3 && consecutive.type === 'D') return `${consecutive.count} draws in a row`
  if (wins >= 4) return 'Flying form'
  if (wins >= 3) return 'Strong recent run'
  if (losses >= 4) return 'Struggling for results'
  if (wins === 0 && losses >= 2) return 'Winless streak'
  return ''
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function DashboardClient(props: Props) {
  const [tab, setTab] = useState<'hub' | 'journey' | 'season' | 'squad'>('hub')

  if (props.empty) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Your FM overview</p>
          </div>
          <Link href="/dashboard/saves/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            + New save
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <div className="text-5xl mb-4">⚽</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No saves yet</h2>
          <p className="text-gray-500 text-sm mb-6">Create your first FM save to see your career unfold here.</p>
          <Link href="/dashboard/saves/new" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
            Create your first save
          </Link>
        </div>
      </div>
    )
  }

  if (props.noCheckpoint) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">{props.saveName}</p>
          </div>
          <Link href="/dashboard/saves/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            + New save
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No checkpoint data yet</h2>
          <p className="text-gray-500 text-sm mb-6">Add a season + checkpoint, then use AI Import to start tracking your career.</p>
          <Link href={`/dashboard/saves/${props.saveId}`} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
            Set up {props.clubName || 'your save'}
          </Link>
        </div>
      </div>
    )
  }

  const pos = props.teamStats?.leaguePosition
  const posCtx = getPositionCtx(pos)
  const formStory = getFormStory(props.formStr)

  const TABS = [
    { key: 'hub' as const, label: 'Hub', icon: '🏠' },
    { key: 'journey' as const, label: 'Journey', icon: '📈' },
    { key: 'season' as const, label: 'This Season', icon: '🗓' },
    { key: 'squad' as const, label: 'Squad & Records', icon: '👥' },
  ]

  return (
    <div className="space-y-4">
      {/* ── HERO BANNER ─────────────────────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${posCtx.bg} rounded-2xl p-6 text-white relative overflow-hidden`}>
        {/* Accent left bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: posCtx.accent }} />

        <div className="flex items-start justify-between mb-4 pl-2">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">{props.saveName}</p>
            <h2 className="text-2xl font-black tracking-tight text-white">{props.clubName}</h2>
            <p className="text-slate-300 text-sm mt-0.5">{props.leagueName} · {props.seasonLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs mb-1">{fmtDate(props.inGameDate)}</p>
            {props.transferWindow && (
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                props.transferWindow.toLowerCase().includes('closed')
                  ? 'bg-red-500/30 text-red-200 border border-red-500/20'
                  : 'bg-green-500/30 text-green-200 border border-green-500/20'
              }`}>
                {props.transferWindow}
              </span>
            )}
          </div>
        </div>

        {/* Position + context */}
        {pos != null && (
          <div className="pl-2 mb-4 flex items-baseline gap-3">
            <span className="text-5xl font-black" style={{ color: posCtx.accent }}>{ordinal(pos)}</span>
            <div>
              <span className="text-sm font-semibold text-white/80">{posCtx.label}</span>
              {formStory && (
                <p className="text-xs text-slate-400 mt-0.5">· {formStory}</p>
              )}
            </div>
          </div>
        )}

        {/* Stats strip */}
        {props.teamStats && (
          <div className="pl-2 grid grid-cols-4 sm:grid-cols-5 gap-2 mb-4">
            {[
              { label: 'Points', value: props.teamStats.points ?? '—' },
              { label: 'W / D / L', value: props.teamStats.wins != null ? `${props.teamStats.wins}–${props.teamStats.draws}–${props.teamStats.losses}` : '—' },
              { label: 'Goals', value: props.teamStats.goalsFor != null ? `${props.teamStats.goalsFor}–${props.teamStats.goalsAgainst}` : '—' },
              { label: 'xG', value: props.teamStats.xg != null ? `${props.teamStats.xg}` : '—' },
              { label: 'Clean sheets', value: props.teamStats.cleanSheets ?? '—' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl px-3 py-2 text-center">
                <p className="text-slate-400 text-[10px] uppercase tracking-wide">{s.label}</p>
                <p className="text-white font-bold text-sm mt-0.5">{String(s.value)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Form dots */}
        {props.formStr && (
          <div className="pl-2 flex items-center gap-2 mb-4">
            <span className="text-slate-400 text-xs uppercase tracking-wide">Form</span>
            <div className="flex gap-1">
              {props.formStr.split('').slice(-8).map((r, i) => (
                <span key={i} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                  r === 'W' ? 'bg-emerald-500 text-white' :
                  r === 'D' ? 'bg-amber-400 text-gray-900' :
                  'bg-red-500 text-white'
                }`}>{r}</span>
              ))}
            </div>
          </div>
        )}

        {/* Milestone comparison callout */}
        {props.milestoneComparison && (
          <div className="pl-2 mb-4">
            <div className="bg-white/10 rounded-xl px-4 py-3 inline-flex items-center gap-3">
              <span className="text-lg">{props.milestoneComparison.ptsDiff > 0 ? '📈' : props.milestoneComparison.ptsDiff < 0 ? '📉' : '➡️'}</span>
              <div>
                <p className="text-white font-semibold text-sm">
                  {props.milestoneComparison.ptsDiff > 0
                    ? `+${props.milestoneComparison.ptsDiff} pts vs last season at ${props.milestoneComparison.milestone}`
                    : props.milestoneComparison.ptsDiff < 0
                    ? `${props.milestoneComparison.ptsDiff} pts vs last season at ${props.milestoneComparison.milestone}`
                    : `Same points as last season at ${props.milestoneComparison.milestone}`}
                </p>
                <p className="text-slate-400 text-xs">
                  {props.milestoneComparison.posDiff < 0
                    ? `${Math.abs(props.milestoneComparison.posDiff)} place${Math.abs(props.milestoneComparison.posDiff) !== 1 ? 's' : ''} higher`
                    : props.milestoneComparison.posDiff > 0
                    ? `${props.milestoneComparison.posDiff} place${props.milestoneComparison.posDiff !== 1 ? 's' : ''} lower`
                    : 'Same position'} · Last season: {ordinal(props.milestoneComparison.prevPos)}, {props.milestoneComparison.prevPts} pts
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="pl-2 flex gap-3">
          <Link
            href={`/dashboard/saves/${props.saveId}/seasons/${props.seasonId}/checkpoints/${props.checkpointId}/ai-import`}
            className="bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            🤖 AI Import
          </Link>
          <Link
            href={`/dashboard/saves/${props.saveId}/seasons/${props.seasonId}/checkpoints/${props.checkpointId}`}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          >
            View checkpoint →
          </Link>
          <Link
            href={`/dashboard/saves/${props.saveId}`}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Manage save
          </Link>
        </div>
      </div>

      {/* ── TAB NAV ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="hidden sm:inline">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ──────────────────────────────────────────────────────── */}
      {tab === 'hub' && <HubTab {...props} />}
      {tab === 'journey' && <JourneyTab {...props} />}
      {tab === 'season' && <SeasonTab {...props} />}
      {tab === 'squad' && <SquadTab {...props} />}
    </div>
  )
}

// ── HUB TAB ───────────────────────────────────────────────────────────────────

function HubTab(props: Props) {
  const ts = props.teamStats
  const lt = props.leagueTable
  const tac = props.tactic
  const fin = props.finance
  const med = props.medical

  return (
    <div className="space-y-4">
      {/* Extended stats row */}
      {ts && (ts.possession != null || ts.passCompletion != null || ts.shotsPerGame != null || ts.cleanSheets != null) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Possession', value: ts.possession != null ? `${ts.possession}%` : null },
            { label: 'Pass accuracy', value: ts.passCompletion != null ? `${ts.passCompletion}%` : null },
            { label: 'Shots / game', value: ts.shotsPerGame != null ? `${ts.shotsPerGame}` : null },
            { label: 'Clean sheets', value: ts.cleanSheets != null ? `${ts.cleanSheets}` : null },
          ].filter(s => s.value != null).map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-xl font-black text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tactic */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">⚙️ Tactic</p>
          {tac ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Formation</span>
                <span className="font-black text-gray-900 text-lg">{tac.formation ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Mentality</span>
                <span className="font-semibold text-gray-800">{tac.mentality ?? '—'}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No tactic data</p>
          )}
        </div>

        {/* Finances */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">💰 Finances</p>
          {fin ? (
            <div className="space-y-2">
              {[
                { label: 'Balance', value: fmtMoney(fin.balance), warn: (fin.balance ?? 0) < 0 },
                { label: 'Transfer budget', value: fmtMoney(fin.transferBudget) },
                { label: 'Wage budget', value: fmtMoney(fin.wageBudget) },
                { label: 'Wage spend', value: fmtMoney(fin.wageSpend) },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">{row.label}</span>
                  <span className={`font-semibold text-sm ${row.warn ? 'text-red-600' : 'text-gray-900'}`}>{row.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No finance data</p>
          )}
        </div>

        {/* Medical */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">🏥 Squad health</p>
          {med ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Current injuries</span>
                <span className={`font-black text-xl ${
                  (med.currentInjuries ?? 0) > 4 ? 'text-red-600' :
                  (med.currentInjuries ?? 0) > 2 ? 'text-amber-600' : 'text-emerald-600'
                }`}>{med.currentInjuries ?? '—'}</span>
              </div>
              {med.totalInjuries != null && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Season total</span>
                  <span className="font-semibold text-gray-900">{med.totalInjuries}</span>
                </div>
              )}
              {med.condition && (
                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <span className="text-gray-500 text-sm">Condition</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    med.condition === 'Excellent' ? 'bg-emerald-100 text-emerald-700' :
                    med.condition === 'Good' ? 'bg-blue-100 text-blue-700' :
                    med.condition === 'Average' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{med.condition}</span>
                </div>
              )}
              {med.notes && (
                <p className="text-xs text-gray-400 pt-1 border-t border-gray-100 line-clamp-3">{med.notes}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No medical data</p>
          )}
        </div>
      </div>

      {/* League table */}
      {lt.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="font-bold text-gray-800">League Table</p>
            <p className="text-xs text-gray-400">{props.leagueName}</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-400 font-medium w-8">#</th>
                <th className="px-3 py-2 text-left text-xs text-gray-400 font-medium">Club</th>
                <th className="px-3 py-2 text-center text-xs text-gray-400 font-medium">P</th>
                <th className="px-3 py-2 text-center text-xs text-gray-400 font-medium hidden sm:table-cell">W</th>
                <th className="px-3 py-2 text-center text-xs text-gray-400 font-medium hidden sm:table-cell">D</th>
                <th className="px-3 py-2 text-center text-xs text-gray-400 font-medium hidden sm:table-cell">L</th>
                <th className="px-3 py-2 text-center text-xs text-gray-400 font-medium hidden sm:table-cell">GD</th>
                <th className="px-3 py-2 text-center text-xs text-gray-400 font-medium">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lt.slice(0, 10).map(row => (
                <tr key={row.position} className={row.isYourTeam ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-2.5 text-gray-500 font-medium text-sm">{row.position}</td>
                  <td className="px-3 py-2.5">
                    <span className={`font-medium text-sm ${row.isYourTeam ? 'text-blue-700' : 'text-gray-800'}`}>
                      {row.teamName}{row.isYourTeam ? ' ★' : ''}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-600 text-sm">{row.played}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600 text-sm hidden sm:table-cell">{row.wins}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600 text-sm hidden sm:table-cell">{row.draws}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600 text-sm hidden sm:table-cell">{row.losses}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600 text-sm hidden sm:table-cell">
                    {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                  </td>
                  <td className={`px-3 py-2.5 text-center font-bold text-sm ${row.isYourTeam ? 'text-blue-700' : 'text-gray-800'}`}>
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lt.length > 10 && (
            <div className="px-5 py-3 border-t border-gray-100 text-center">
              <Link
                href={`/dashboard/saves/${props.saveId}/seasons/${props.seasonId}/checkpoints/${props.checkpointId}`}
                className="text-xs text-blue-600 hover:underline"
              >
                View full table ({lt.length} teams) →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Other saves */}
      {props.otherSaves.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 text-sm mb-3">Other saves</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {props.otherSaves.map(save => (
              <Link key={save.id} href={`/dashboard/saves/${save.id}`}>
                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-gray-900 text-sm">{save.name}</p>
                    <span className="text-xs text-gray-400">FM{save.fmVersion}</span>
                  </div>
                  <p className="text-xs text-gray-400">{save.club}</p>
                  {save.league && <p className="text-xs text-gray-500 mt-1">{save.league} · {save.season}</p>}
                  {(save.position != null || save.points != null) && (
                    <div className="flex gap-3 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                      {save.position != null && <span className="font-semibold">{ordinal(save.position)}</span>}
                      {save.points != null && <span>{save.points} pts</span>}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── JOURNEY TAB ───────────────────────────────────────────────────────────────

function JourneyTab(props: Props) {
  const seasons = props.journeySeasons

  if (seasons.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-3xl mb-3">📈</p>
        <p className="text-gray-600 font-semibold">No journey data yet</p>
        <p className="text-gray-400 text-sm mt-1">Your season-by-season story will build up here over time.</p>
      </div>
    )
  }

  const maxPts = Math.max(...seasons.map(s => s.points ?? 0), 1)

  return (
    <div className="space-y-5">
      {/* Headline comparison */}
      {props.milestoneComparison && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: 'Points',
              current: `${props.milestoneComparison.currentPts}`,
              prev: `${props.milestoneComparison.prevPts}`,
              diff: props.milestoneComparison.ptsDiff,
              better: props.milestoneComparison.ptsDiff > 0,
            },
            {
              label: 'Position',
              current: ordinal(props.milestoneComparison.currentPos),
              prev: ordinal(props.milestoneComparison.prevPos),
              diff: -props.milestoneComparison.posDiff,
              better: props.milestoneComparison.posDiff < 0,
              suffix: ' places',
            },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{card.label} at {props.milestoneComparison!.milestone}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black text-gray-900">{card.current}</p>
                  <p className="text-xs text-gray-400 mt-1">vs {card.prev} last season</p>
                </div>
                <div className={`flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-lg ${
                  card.diff > 0 ? 'bg-emerald-50 text-emerald-600' :
                  card.diff < 0 ? 'bg-red-50 text-red-600' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  {card.diff > 0 ? '↑' : card.diff < 0 ? '↓' : '→'}
                  {' '}
                  {Math.abs(card.diff)}{card.suffix ?? ' pts'}
                </div>
              </div>
            </div>
          ))}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col justify-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Snapshot point</p>
            <p className="text-lg font-bold text-gray-800">{props.milestoneComparison.milestone}</p>
            <p className="text-xs text-gray-400 mt-1">Direct like-for-like comparison</p>
          </div>
        </div>
      )}

      {/* Season-by-season table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="font-bold text-gray-800">Season History</p>
          <p className="text-xs text-gray-400 mt-0.5">Stats taken at best available checkpoint per season</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Season</th>
                <th className="px-3 py-3 text-left text-xs text-gray-400 font-medium hidden sm:table-cell">League</th>
                <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium">At</th>
                <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium">Pos</th>
                <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium">Pts</th>
                <th className="px-3 py-3 text-left text-xs text-gray-400 font-medium hidden md:table-cell">Points bar</th>
                <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium hidden sm:table-cell">Goals</th>
                <th className="px-3 py-3 text-left text-xs text-gray-400 font-medium hidden lg:table-cell">Top scorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {seasons.map(s => (
                <tr key={s.seasonId} className={s.isCurrent ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${s.isCurrent ? 'text-blue-700' : 'text-gray-900'}`}>
                        {s.label}
                      </span>
                      {s.isCurrent && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">now</span>
                      )}
                      {s.isComplete && !s.isCurrent && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">done</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-500 text-xs hidden sm:table-cell">{s.league}</td>
                  <td className="px-3 py-3 text-center text-gray-500 text-xs">{s.bestMilestone}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`font-bold text-sm ${s.isCurrent ? 'text-blue-700' : 'text-gray-800'}`}>
                      {s.position != null ? ordinal(s.position) : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`font-bold text-sm ${s.isCurrent ? 'text-blue-700' : 'text-gray-800'}`}>
                      {s.points ?? '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    {s.points != null && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[100px]">
                          <div
                            className={`h-2 rounded-full ${s.isCurrent ? 'bg-blue-500' : 'bg-slate-400'}`}
                            style={{ width: `${Math.round((s.points / maxPts) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center text-gray-600 text-sm hidden sm:table-cell">
                    {s.goalsFor != null ? `${s.goalsFor}–${s.goalsAgainst ?? '?'}` : '—'}
                  </td>
                  <td className="px-3 py-3 text-gray-600 text-xs hidden lg:table-cell">
                    {s.topScorer ? (
                      <span><span className="font-semibold text-gray-800">{s.topScorer.name}</span> <span className="text-gray-400">({s.topScorer.goals})</span></span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {seasons.length < 2 && (
        <p className="text-xs text-gray-400 text-center">
          The Journey tab gets more powerful with each season you track — comparisons unlock once you have 2+ seasons of data.
        </p>
      )}
    </div>
  )
}

// ── THIS SEASON TAB ───────────────────────────────────────────────────────────

function SeasonTab(props: Props) {
  const milestones = props.milestones
  const hasAnyData = milestones.some(m => m.hasData)

  if (!hasAnyData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-3xl mb-3">🗓</p>
        <p className="text-gray-600 font-semibold">No season checkpoints yet</p>
        <p className="text-gray-400 text-sm mt-1">Import screenshots for each of the 5 checkpoints to see your season unfold here.</p>
      </div>
    )
  }

  const completedCount = milestones.filter(m => m.hasData).length
  const progress = Math.round((completedCount / milestones.length) * 100)

  return (
    <div className="space-y-5">
      {/* Season header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-bold text-gray-800">{props.seasonLabel} — {props.leagueName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{completedCount} of {milestones.length} checkpoints logged</p>
          </div>
          <span className="text-2xl font-black text-blue-600">{progress}%</span>
        </div>
        <div className="relative">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Milestone cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {milestones.map((m, idx) => (
          <div
            key={m.type}
            className={`rounded-xl border p-4 relative ${
              m.isCurrent
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                : m.hasData
                ? 'bg-white border-gray-200'
                : 'bg-gray-50 border-dashed border-gray-200'
            }`}
          >
            {/* Step number */}
            <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${
              m.isCurrent ? 'text-blue-200' : 'text-gray-400'
            }`}>
              Step {idx + 1}
            </div>

            {/* Label */}
            <p className={`font-bold text-sm mb-3 ${m.isCurrent ? 'text-white' : m.hasData ? 'text-gray-800' : 'text-gray-400'}`}>
              {m.label}
            </p>

            {m.hasData ? (
              <div className="space-y-1.5">
                {m.position != null && (
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${m.isCurrent ? 'text-blue-200' : 'text-gray-400'}`}>Position</span>
                    <span className={`font-black text-sm ${m.isCurrent ? 'text-white' : 'text-gray-900'}`}>{ordinal(m.position)}</span>
                  </div>
                )}
                {m.points != null && (
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${m.isCurrent ? 'text-blue-200' : 'text-gray-400'}`}>Points</span>
                    <span className={`font-bold text-sm ${m.isCurrent ? 'text-white' : 'text-gray-900'}`}>{m.points}</span>
                  </div>
                )}
                {m.goalsFor != null && (
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${m.isCurrent ? 'text-blue-200' : 'text-gray-400'}`}>Goals</span>
                    <span className={`font-bold text-sm ${m.isCurrent ? 'text-white' : 'text-gray-900'}`}>{m.goalsFor}</span>
                  </div>
                )}
                {m.wins != null && (
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${m.isCurrent ? 'text-blue-200' : 'text-gray-400'}`}>Wins</span>
                    <span className={`font-bold text-sm ${m.isCurrent ? 'text-white' : 'text-gray-900'}`}>{m.wins}</span>
                  </div>
                )}
                {m.isCurrent && (
                  <div className="pt-1 mt-1 border-t border-blue-500">
                    <span className="text-[10px] text-blue-200 font-semibold uppercase tracking-wide">Current checkpoint</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Not yet logged</p>
            )}
          </div>
        ))}
      </div>

      {/* Season progression summary (if 2+ checkpoints) */}
      {milestones.filter(m => m.hasData).length >= 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="font-bold text-gray-800 mb-4">Season progression</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left text-xs text-gray-400 font-medium">Checkpoint</th>
                  <th className="pb-2 text-center text-xs text-gray-400 font-medium">Position</th>
                  <th className="pb-2 text-center text-xs text-gray-400 font-medium">Points</th>
                  <th className="pb-2 text-center text-xs text-gray-400 font-medium">Goals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {milestones.filter(m => m.hasData).map(m => (
                  <tr key={m.type} className={m.isCurrent ? 'bg-blue-50' : ''}>
                    <td className="py-2.5">
                      <span className={`font-semibold text-sm ${m.isCurrent ? 'text-blue-700' : 'text-gray-800'}`}>
                        {m.label}{m.isCurrent ? ' ★' : ''}
                      </span>
                    </td>
                    <td className="py-2.5 text-center font-bold text-sm text-gray-900">
                      {m.position != null ? ordinal(m.position) : '—'}
                    </td>
                    <td className="py-2.5 text-center font-bold text-sm text-gray-900">{m.points ?? '—'}</td>
                    <td className="py-2.5 text-center text-gray-700">{m.goalsFor ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── SQUAD + RECORDS TAB ───────────────────────────────────────────────────────

function SquadTab(props: Props) {
  const [recordSort, setRecordSort] = useState<'goals' | 'assists' | 'apps'>('goals')

  const sortedRecords = [...props.allTimeRecords].sort((a, b) => b[recordSort] - a[recordSort])

  return (
    <div className="space-y-6">
      {/* Current squad */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-800">Current squad</h3>
            <p className="text-xs text-gray-400 mt-0.5">{props.seasonLabel} · from latest checkpoint</p>
          </div>
          <Link
            href="/dashboard/players"
            className="text-xs text-blue-600 hover:underline"
          >
            All-time players →
          </Link>
        </div>

        {props.currentSquad.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium w-8">#</th>
                    <th className="px-3 py-3 text-left text-xs text-gray-400 font-medium">Player</th>
                    <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium">Age</th>
                    <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium">Apps</th>
                    <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium">Goals</th>
                    <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium">Assists</th>
                    <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium hidden sm:table-cell">CS</th>
                    <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {props.currentSquad.map((p, i) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                        {p.position && <p className="text-xs text-gray-400">{p.position}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-600 text-sm">{p.age ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center text-gray-700 text-sm font-medium">{p.apps ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-sm text-gray-900">{p.goals ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-sm text-gray-900">{p.assists ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center text-gray-700 text-sm hidden sm:table-cell">{p.cleanSheets ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center">
                        {p.avgRating != null ? (
                          <span className={`font-bold text-sm ${
                            p.avgRating >= 7.2 ? 'text-emerald-600' :
                            p.avgRating >= 6.5 ? 'text-blue-600' :
                            p.avgRating >= 6.0 ? 'text-gray-700' : 'text-red-500'
                          }`}>
                            {p.avgRating.toFixed(2)}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-gray-400 text-sm">No squad data for this checkpoint yet — use AI Import to add player stats.</p>
          </div>
        )}
      </div>

      {/* All-time records */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-800">All-time club records</h3>
            <p className="text-xs text-gray-400 mt-0.5">Every player who ever pulled on the shirt, including those who&apos;ve moved on</p>
          </div>
        </div>

        {props.allTimeRecords.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Sort controls */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">Sort by:</span>
              {(['goals', 'assists', 'apps'] as const).map(k => (
                <button
                  key={k}
                  onClick={() => setRecordSort(k)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    recordSort === k
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium w-8">#</th>
                    <th className="px-3 py-3 text-left text-xs text-gray-400 font-medium">Player</th>
                    <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium hidden sm:table-cell">Seasons</th>
                    <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium">Apps</th>
                    <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium">Goals</th>
                    <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium">Assists</th>
                    <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium hidden sm:table-cell">CS</th>
                    <th className="px-3 py-3 text-center text-xs text-gray-400 font-medium hidden md:table-cell">Avg Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedRecords.map((p, i) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                        {p.position && <p className="text-xs text-gray-400">{p.position}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-500 text-sm hidden sm:table-cell">{p.seasons}</td>
                      <td className={`px-3 py-2.5 text-center text-sm font-medium ${recordSort === 'apps' ? 'text-slate-800 font-bold' : 'text-gray-700'}`}>
                        {p.apps || '—'}
                      </td>
                      <td className={`px-3 py-2.5 text-center text-sm font-bold ${recordSort === 'goals' ? 'text-slate-800' : 'text-gray-900'}`}>
                        {p.goals || '—'}
                      </td>
                      <td className={`px-3 py-2.5 text-center text-sm font-bold ${recordSort === 'assists' ? 'text-slate-800' : 'text-gray-900'}`}>
                        {p.assists || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-600 text-sm hidden sm:table-cell">{p.cleanSheets || '—'}</td>
                      <td className="px-3 py-2.5 text-center hidden md:table-cell">
                        {p.avgRating != null ? (
                          <span className={`font-bold text-sm ${
                            p.avgRating >= 7.2 ? 'text-emerald-600' :
                            p.avgRating >= 6.5 ? 'text-blue-600' :
                            'text-gray-700'
                          }`}>
                            {p.avgRating.toFixed(2)}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-gray-400 text-sm">Player records will appear here once you&apos;ve imported player stats via AI Import.</p>
          </div>
        )}
      </div>
    </div>
  )
}
