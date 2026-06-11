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

// ── Design tokens ──────────────────────────────────────────────────────────────
const CARD: React.CSSProperties = { background: '#0d1628', border: '1px solid rgba(255,255,255,0.06)' }
const CARD_HEADER: React.CSSProperties = { background: '#0a1120', borderBottom: '1px solid rgba(255,255,255,0.06)' }
const TABLE_HEAD: React.CSSProperties = { background: '#080f1d' }
const ROW_SELECTED: React.CSSProperties = { background: 'rgba(99,102,241,0.1)', borderLeft: '2px solid #6366f1' }

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
  if (pos == null) return { label: '', accent: '#64748b', gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }
  if (pos <= 2) return { label: 'Automatic promotion', accent: '#10b981', gradient: 'linear-gradient(135deg, #064e3b 0%, #0d1628 100%)' }
  if (pos <= 7) return { label: 'Playoff contender', accent: '#6366f1', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #0d1628 100%)' }
  if (pos <= 12) return { label: 'Mid-table', accent: '#64748b', gradient: 'linear-gradient(135deg, #1e293b 0%, #0d1628 100%)' }
  if (pos <= 18) return { label: 'Lower half', accent: '#f59e0b', gradient: 'linear-gradient(135deg, #431407 0%, #0d1628 100%)' }
  return { label: 'Relegation danger', accent: '#ef4444', gradient: 'linear-gradient(135deg, #450a0a 0%, #0d1628 100%)' }
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

  const emptyCard = (
    <div className="rounded-2xl p-16 text-center" style={CARD}>
      <div className="text-5xl mb-4">⚽</div>
      <h2 className="text-xl font-semibold text-white mb-2">No saves yet</h2>
      <p className="text-sm mb-6" style={{ color: '#4a5e80' }}>Create your first FM save to see your career unfold here.</p>
      <Link href="/dashboard/saves/new" className="inline-block text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
        Create your first save
      </Link>
    </div>
  )

  if (props.empty) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm mt-0.5" style={{ color: '#4a5e80' }}>Your FM overview</p>
          </div>
          <Link href="/dashboard/saves/new" className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            + New save
          </Link>
        </div>
        {emptyCard}
      </div>
    )
  }

  if (props.noCheckpoint) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm mt-0.5" style={{ color: '#4a5e80' }}>{props.saveName}</p>
          </div>
          <Link href="/dashboard/saves/new" className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            + New save
          </Link>
        </div>
        <div className="rounded-2xl p-16 text-center" style={CARD}>
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-white mb-2">No checkpoint data yet</h2>
          <p className="text-sm mb-6" style={{ color: '#4a5e80' }}>Add a season + checkpoint, then use AI Import to start tracking your career.</p>
          <Link href={`/dashboard/saves/${props.saveId}`} className="inline-block text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
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
    { key: 'hub' as const, label: 'Hub' },
    { key: 'journey' as const, label: 'Journey' },
    { key: 'season' as const, label: 'This Season' },
    { key: 'squad' as const, label: 'Squad & Records' },
  ]

  return (
    <div className="space-y-4">
      {/* ── HERO BANNER ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: posCtx.gradient, border: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Accent glow stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: posCtx.accent, boxShadow: `0 0 20px ${posCtx.accent}60` }} />

        <div className="flex items-start justify-between mb-4 pl-3">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#4a5e80' }}>{props.saveName}</p>
            <h2 className="text-2xl font-black tracking-tight text-white">{props.clubName}</h2>
            <p className="text-sm mt-0.5" style={{ color: '#6b7f99' }}>{props.leagueName} · {props.seasonLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-xs mb-1" style={{ color: '#4a5e80' }}>{fmtDate(props.inGameDate)}</p>
            {props.transferWindow && (
              <span className="inline-block text-xs px-2.5 py-0.5 rounded-full font-medium" style={
                props.transferWindow.toLowerCase().includes('closed')
                  ? { background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }
                  : { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)' }
              }>
                {props.transferWindow}
              </span>
            )}
          </div>
        </div>

        {/* Position */}
        {pos != null && (
          <div className="pl-3 mb-4 flex items-baseline gap-3">
            <span className="text-5xl font-black" style={{ color: posCtx.accent, textShadow: `0 0 30px ${posCtx.accent}60` }}>{ordinal(pos)}</span>
            <div>
              <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>{posCtx.label}</span>
              {formStory && <p className="text-xs mt-0.5" style={{ color: '#4a5e80' }}>· {formStory}</p>}
            </div>
          </div>
        )}

        {/* Stats strip */}
        {props.teamStats && (
          <div className="pl-3 grid grid-cols-4 sm:grid-cols-5 gap-2 mb-4">
            {[
              { label: 'Points', value: props.teamStats.points ?? '—' },
              { label: 'W / D / L', value: props.teamStats.wins != null ? `${props.teamStats.wins}–${props.teamStats.draws}–${props.teamStats.losses}` : '—' },
              { label: 'Goals', value: props.teamStats.goalsFor != null ? `${props.teamStats.goalsFor}–${props.teamStats.goalsAgainst}` : '—' },
              { label: 'xG', value: props.teamStats.xg != null ? `${props.teamStats.xg}` : '—' },
              { label: 'Clean Sheets', value: props.teamStats.cleanSheets ?? '—' },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-3 py-2 text-center" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}>
                <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: '#4a5e80' }}>{s.label}</p>
                <p className="text-white font-bold text-sm">{String(s.value)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Form */}
        {props.formStr && (
          <div className="pl-3 flex items-center gap-2 mb-4">
            <span className="text-xs uppercase tracking-wide" style={{ color: '#4a5e80' }}>Form</span>
            <div className="flex gap-1">
              {props.formStr.split('').slice(-8).map((r, i) => (
                <span key={i} className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center" style={
                  r === 'W' ? { background: '#10b981', color: 'white' } :
                  r === 'D' ? { background: '#f59e0b', color: '#0a0a0a' } :
                  { background: '#ef4444', color: 'white' }
                }>{r}</span>
              ))}
            </div>
          </div>
        )}

        {/* Milestone comparison */}
        {props.milestoneComparison && (
          <div className="pl-3 mb-4">
            <div className="inline-flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <span className="text-lg">{props.milestoneComparison.ptsDiff > 0 ? '📈' : props.milestoneComparison.ptsDiff < 0 ? '📉' : '➡️'}</span>
              <div>
                <p className="text-white font-semibold text-sm">
                  {props.milestoneComparison.ptsDiff > 0
                    ? `+${props.milestoneComparison.ptsDiff} pts vs last season at ${props.milestoneComparison.milestone}`
                    : props.milestoneComparison.ptsDiff < 0
                    ? `${props.milestoneComparison.ptsDiff} pts vs last season at ${props.milestoneComparison.milestone}`
                    : `Same points as last season at ${props.milestoneComparison.milestone}`}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#4a5e80' }}>
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
        <div className="pl-3 flex gap-3 flex-wrap">
          <Link
            href={`/dashboard/saves/${props.saveId}/seasons/${props.seasonId}/checkpoints/${props.checkpointId}/ai-import`}
            className="text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}
          >
            🤖 AI Import
          </Link>
          <Link
            href={`/dashboard/saves/${props.saveId}/seasons/${props.seasonId}/checkpoints/${props.checkpointId}`}
            className="text-xs font-medium px-4 py-2 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
          >
            View checkpoint →
          </Link>
          <Link
            href={`/dashboard/saves/${props.saveId}`}
            className="text-xs font-medium px-4 py-2 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
          >
            Manage save
          </Link>
        </div>
      </div>

      {/* ── TAB NAV ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl p-1" style={{ background: '#0a1020' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={tab === t.key
              ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', boxShadow: '0 2px 12px rgba(99,102,241,0.35)' }
              : { color: '#4a5e80' }
            }
          >
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
      {/* Extended stats */}
      {ts && (ts.possession != null || ts.passCompletion != null || ts.shotsPerGame != null || ts.cleanSheets != null) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Possession', value: ts.possession != null ? `${ts.possession}%` : null, color: '#6366f1' },
            { label: 'Pass Accuracy', value: ts.passCompletion != null ? `${ts.passCompletion}%` : null, color: '#10b981' },
            { label: 'Shots / Game', value: ts.shotsPerGame != null ? `${ts.shotsPerGame}` : null, color: '#f59e0b' },
            { label: 'Clean Sheets', value: ts.cleanSheets != null ? `${ts.cleanSheets}` : null, color: '#3b82f6' },
          ].filter(s => s.value != null).map(s => (
            <div key={s.label} className="rounded-xl p-4 text-center" style={CARD}>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: '#4a5e80' }}>{s.label}</p>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Widgets row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tactic */}
        <div className="rounded-xl p-5" style={CARD}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4a5e80' }}>⚙️ Tactic</p>
          {tac ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: '#4a5e80' }}>Formation</span>
                <span className="font-black text-white text-xl">{tac.formation ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: '#4a5e80' }}>Mentality</span>
                <span className="font-semibold" style={{ color: '#a5b4fc' }}>{tac.mentality ?? '—'}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm italic" style={{ color: '#4a5e80' }}>No tactic data</p>
          )}
        </div>

        {/* Finances */}
        <div className="rounded-xl p-5" style={CARD}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4a5e80' }}>💰 Finances</p>
          {fin ? (
            <div className="space-y-2.5">
              {[
                { label: 'Balance', value: fmtMoney(fin.balance), warn: (fin.balance ?? 0) < 0 },
                { label: 'Transfer budget', value: fmtMoney(fin.transferBudget) },
                { label: 'Wage budget', value: fmtMoney(fin.wageBudget) },
                { label: 'Wage spend', value: fmtMoney(fin.wageSpend) },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#4a5e80' }}>{row.label}</span>
                  <span className="font-semibold text-sm" style={{ color: row.warn ? '#f87171' : '#f1f5f9' }}>{row.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm italic" style={{ color: '#4a5e80' }}>No finance data</p>
          )}
        </div>

        {/* Medical */}
        <div className="rounded-xl p-5" style={CARD}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4a5e80' }}>🏥 Squad Health</p>
          {med ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: '#4a5e80' }}>Current injuries</span>
                <span className="font-black text-xl" style={{ color: (med.currentInjuries ?? 0) > 4 ? '#ef4444' : (med.currentInjuries ?? 0) > 2 ? '#f59e0b' : '#10b981' }}>
                  {med.currentInjuries ?? '—'}
                </span>
              </div>
              {med.totalInjuries != null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#4a5e80' }}>Season total</span>
                  <span className="font-semibold text-white">{med.totalInjuries}</span>
                </div>
              )}
              {med.condition && (
                <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-sm" style={{ color: '#4a5e80' }}>Condition</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={
                    med.condition === 'Excellent' ? { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' } :
                    med.condition === 'Good' ? { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' } :
                    med.condition === 'Average' ? { background: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.2)' } :
                    { background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }
                  }>{med.condition}</span>
                </div>
              )}
              {med.notes && (
                <p className="text-xs line-clamp-3 pt-2" style={{ color: '#4a5e80', borderTop: '1px solid rgba(255,255,255,0.05)' }}>{med.notes}</p>
              )}
            </div>
          ) : (
            <p className="text-sm italic" style={{ color: '#4a5e80' }}>No medical data</p>
          )}
        </div>
      </div>

      {/* League table */}
      {lt.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={CARD}>
          <div className="px-5 py-4 flex items-center justify-between" style={CARD_HEADER}>
            <p className="font-bold text-white">League Table</p>
            <p className="text-xs" style={{ color: '#4a5e80' }}>{props.leagueName}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={TABLE_HEAD}>
                <th className="px-4 py-2.5 text-left text-xs font-medium w-8" style={{ color: '#4a5e80' }}>#</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium" style={{ color: '#4a5e80' }}>Club</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium" style={{ color: '#4a5e80' }}>P</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium hidden sm:table-cell" style={{ color: '#4a5e80' }}>W</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium hidden sm:table-cell" style={{ color: '#4a5e80' }}>D</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium hidden sm:table-cell" style={{ color: '#4a5e80' }}>L</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium hidden sm:table-cell" style={{ color: '#4a5e80' }}>GD</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium" style={{ color: '#4a5e80' }}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {lt.slice(0, 10).map((row, i) => (
                <tr
                  key={row.position}
                  style={row.isYourTeam ? ROW_SELECTED : { borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : undefined }}
                >
                  <td className="px-4 py-2.5 text-sm font-medium" style={{ color: '#4a5e80' }}>{row.position}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-sm" style={{ color: row.isYourTeam ? '#a5b4fc' : '#cbd5e1' }}>
                      {row.teamName}{row.isYourTeam ? ' ★' : ''}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-sm" style={{ color: '#64748b' }}>{row.played}</td>
                  <td className="px-3 py-2.5 text-center text-sm hidden sm:table-cell" style={{ color: '#64748b' }}>{row.wins}</td>
                  <td className="px-3 py-2.5 text-center text-sm hidden sm:table-cell" style={{ color: '#64748b' }}>{row.draws}</td>
                  <td className="px-3 py-2.5 text-center text-sm hidden sm:table-cell" style={{ color: '#64748b' }}>{row.losses}</td>
                  <td className="px-3 py-2.5 text-center text-sm hidden sm:table-cell" style={{ color: '#64748b' }}>{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-sm" style={{ color: row.isYourTeam ? '#a5b4fc' : '#f1f5f9' }}>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {lt.length > 10 && (
            <div className="px-5 py-3 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <Link href={`/dashboard/saves/${props.saveId}/seasons/${props.seasonId}/checkpoints/${props.checkpointId}`} className="text-xs" style={{ color: '#6366f1' }}>
                View full table ({lt.length} teams) →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Other saves */}
      {props.otherSaves.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3" style={{ color: '#4a5e80' }}>Other saves</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {props.otherSaves.map(save => (
              <Link key={save.id} href={`/dashboard/saves/${save.id}`}>
                <div className="rounded-xl p-4 transition-all hover:border-indigo-500/40" style={{ ...CARD, cursor: 'pointer' }}>
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-white text-sm">{save.name}</p>
                    <span className="text-xs" style={{ color: '#4a5e80' }}>FM{save.fmVersion}</span>
                  </div>
                  <p className="text-xs" style={{ color: '#4a5e80' }}>{save.club}</p>
                  {save.league && <p className="text-xs mt-1" style={{ color: '#3d4f70' }}>{save.league} · {save.season}</p>}
                  {(save.position != null || save.points != null) && (
                    <div className="flex gap-3 mt-2 pt-2 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      {save.position != null && <span className="font-semibold" style={{ color: '#a5b4fc' }}>{ordinal(save.position)}</span>}
                      {save.points != null && <span style={{ color: '#64748b' }}>{save.points} pts</span>}
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
      <div className="rounded-xl p-12 text-center" style={CARD}>
        <p className="text-3xl mb-3">📈</p>
        <p className="font-semibold text-white">No journey data yet</p>
        <p className="text-sm mt-1" style={{ color: '#4a5e80' }}>Your season-by-season story will build up here over time.</p>
      </div>
    )
  }

  const maxPts = Math.max(...seasons.map(s => s.points ?? 0), 1)

  return (
    <div className="space-y-5">
      {/* Milestone comparison */}
      {props.milestoneComparison && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Points', current: `${props.milestoneComparison.currentPts}`, prev: `${props.milestoneComparison.prevPts}`, diff: props.milestoneComparison.ptsDiff, better: props.milestoneComparison.ptsDiff > 0 },
            { label: 'Position', current: ordinal(props.milestoneComparison.currentPos), prev: ordinal(props.milestoneComparison.prevPos), diff: -props.milestoneComparison.posDiff, better: props.milestoneComparison.posDiff < 0, suffix: ' places' },
          ].map(card => (
            <div key={card.label} className="rounded-xl p-4" style={CARD}>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: '#4a5e80' }}>{card.label} at {props.milestoneComparison!.milestone}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black text-white">{card.current}</p>
                  <p className="text-xs mt-1" style={{ color: '#4a5e80' }}>vs {card.prev} last season</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-lg" style={
                  card.diff > 0 ? { background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' } :
                  card.diff < 0 ? { background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' } :
                  { background: 'rgba(100,116,139,0.1)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.2)' }
                }>
                  {card.diff > 0 ? '↑' : card.diff < 0 ? '↓' : '→'} {Math.abs(card.diff)}{card.suffix ?? ' pts'}
                </div>
              </div>
            </div>
          ))}
          <div className="rounded-xl p-4 flex flex-col justify-center" style={CARD}>
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#4a5e80' }}>Snapshot point</p>
            <p className="text-lg font-bold text-white">{props.milestoneComparison.milestone}</p>
            <p className="text-xs mt-1" style={{ color: '#3d4f70' }}>Direct like-for-like comparison</p>
          </div>
        </div>
      )}

      {/* Season history table */}
      <div className="rounded-xl overflow-hidden" style={CARD}>
        <div className="px-5 py-4" style={CARD_HEADER}>
          <p className="font-bold text-white">Season History</p>
          <p className="text-xs mt-0.5" style={{ color: '#4a5e80' }}>Stats taken at best available checkpoint per season</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={TABLE_HEAD}>
                <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#4a5e80' }}>Season</th>
                <th className="px-3 py-3 text-left text-xs font-medium hidden sm:table-cell" style={{ color: '#4a5e80' }}>League</th>
                <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: '#4a5e80' }}>At</th>
                <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: '#4a5e80' }}>Pos</th>
                <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: '#4a5e80' }}>Pts</th>
                <th className="px-3 py-3 text-left text-xs font-medium hidden md:table-cell" style={{ color: '#4a5e80' }}>Points bar</th>
                <th className="px-3 py-3 text-center text-xs font-medium hidden sm:table-cell" style={{ color: '#4a5e80' }}>Goals</th>
                <th className="px-3 py-3 text-left text-xs font-medium hidden lg:table-cell" style={{ color: '#4a5e80' }}>Top scorer</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((s, i) => (
                <tr key={s.seasonId} style={s.isCurrent ? ROW_SELECTED : { borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : undefined }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: s.isCurrent ? '#a5b4fc' : '#cbd5e1' }}>{s.label}</span>
                      {s.isCurrent && <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>now</span>}
                      {s.isComplete && !s.isCurrent && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: '#4a5e80' }}>done</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs hidden sm:table-cell" style={{ color: '#4a5e80' }}>{s.league}</td>
                  <td className="px-3 py-3 text-center text-xs" style={{ color: '#4a5e80' }}>{s.bestMilestone}</td>
                  <td className="px-3 py-3 text-center font-bold text-sm" style={{ color: s.isCurrent ? '#a5b4fc' : '#f1f5f9' }}>{s.position != null ? ordinal(s.position) : '—'}</td>
                  <td className="px-3 py-3 text-center font-bold text-sm" style={{ color: s.isCurrent ? '#a5b4fc' : '#f1f5f9' }}>{s.points ?? '—'}</td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    {s.points != null && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-full h-1.5 max-w-[100px]" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${Math.round((s.points / maxPts) * 100)}%`, background: s.isCurrent ? 'linear-gradient(90deg, #6366f1, #8b5cf6)' : '#334155' }} />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center text-sm hidden sm:table-cell" style={{ color: '#64748b' }}>{s.goalsFor != null ? `${s.goalsFor}–${s.goalsAgainst ?? '?'}` : '—'}</td>
                  <td className="px-3 py-3 text-xs hidden lg:table-cell">
                    {s.topScorer ? (
                      <span><span className="font-semibold text-white">{s.topScorer.name}</span> <span style={{ color: '#4a5e80' }}>({s.topScorer.goals})</span></span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {seasons.length < 2 && (
        <p className="text-xs text-center" style={{ color: '#4a5e80' }}>The Journey tab gets more powerful with each season — comparisons unlock with 2+ seasons of data.</p>
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
      <div className="rounded-xl p-12 text-center" style={CARD}>
        <p className="text-3xl mb-3">🗓</p>
        <p className="font-semibold text-white">No season checkpoints yet</p>
        <p className="text-sm mt-1" style={{ color: '#4a5e80' }}>Import screenshots for each of the 5 checkpoints to see your season unfold here.</p>
      </div>
    )
  }

  const completedCount = milestones.filter(m => m.hasData).length
  const progress = Math.round((completedCount / milestones.length) * 100)

  return (
    <div className="space-y-5">
      {/* Season progress */}
      <div className="rounded-xl p-5" style={CARD}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-bold text-white">{props.seasonLabel} — {props.leagueName}</p>
            <p className="text-xs mt-0.5" style={{ color: '#4a5e80' }}>{completedCount} of {milestones.length} checkpoints logged</p>
          </div>
          <span className="text-2xl font-black" style={{ color: '#6366f1' }}>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
        </div>
      </div>

      {/* Milestone cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {milestones.map((m, idx) => (
          <div key={m.type} className="rounded-xl p-4 relative" style={
            m.isCurrent
              ? { background: 'linear-gradient(135deg, #312e81, #1e1b4b)', border: '1px solid rgba(99,102,241,0.4)', boxShadow: '0 0 24px rgba(99,102,241,0.2)' }
              : m.hasData
              ? CARD
              : { background: '#080f1d', border: '1px dashed rgba(255,255,255,0.07)' }
          }>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: m.isCurrent ? '#a5b4fc' : '#2d3f5a' }}>Step {idx + 1}</div>
            <p className="font-bold text-sm mb-3" style={{ color: m.isCurrent ? 'white' : m.hasData ? '#cbd5e1' : '#2d3f5a' }}>{m.label}</p>
            {m.hasData ? (
              <div className="space-y-1.5">
                {m.position != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: m.isCurrent ? '#a5b4fc' : '#4a5e80' }}>Position</span>
                    <span className="font-black text-sm" style={{ color: m.isCurrent ? 'white' : '#f1f5f9' }}>{ordinal(m.position)}</span>
                  </div>
                )}
                {m.points != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: m.isCurrent ? '#a5b4fc' : '#4a5e80' }}>Points</span>
                    <span className="font-bold text-sm" style={{ color: m.isCurrent ? 'white' : '#f1f5f9' }}>{m.points}</span>
                  </div>
                )}
                {m.goalsFor != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: m.isCurrent ? '#a5b4fc' : '#4a5e80' }}>Goals</span>
                    <span className="font-bold text-sm" style={{ color: m.isCurrent ? 'white' : '#f1f5f9' }}>{m.goalsFor}</span>
                  </div>
                )}
                {m.wins != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: m.isCurrent ? '#a5b4fc' : '#4a5e80' }}>Wins</span>
                    <span className="font-bold text-sm" style={{ color: m.isCurrent ? 'white' : '#f1f5f9' }}>{m.wins}</span>
                  </div>
                )}
                {m.isCurrent && (
                  <div className="pt-1 mt-1" style={{ borderTop: '1px solid rgba(99,102,241,0.3)' }}>
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#818cf8' }}>Current checkpoint</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs italic" style={{ color: '#2d3f5a' }}>Not yet logged</p>
            )}
          </div>
        ))}
      </div>

      {/* Season progression summary */}
      {milestones.filter(m => m.hasData).length >= 2 && (
        <div className="rounded-xl overflow-hidden" style={CARD}>
          <div className="px-5 py-4" style={CARD_HEADER}>
            <p className="font-bold text-white">Season progression</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={TABLE_HEAD}>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#4a5e80' }}>Checkpoint</th>
                  <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: '#4a5e80' }}>Position</th>
                  <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: '#4a5e80' }}>Points</th>
                  <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: '#4a5e80' }}>Goals</th>
                </tr>
              </thead>
              <tbody>
                {milestones.filter(m => m.hasData).map((m, i) => (
                  <tr key={m.type} style={m.isCurrent ? ROW_SELECTED : { borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : undefined }}>
                    <td className="px-4 py-2.5 font-semibold text-sm" style={{ color: m.isCurrent ? '#a5b4fc' : '#cbd5e1' }}>{m.label}{m.isCurrent ? ' ★' : ''}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-sm text-white">{m.position != null ? ordinal(m.position) : '—'}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-sm text-white">{m.points ?? '—'}</td>
                    <td className="px-3 py-2.5 text-center text-sm" style={{ color: '#64748b' }}>{m.goalsFor ?? '—'}</td>
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
            <h3 className="font-bold text-white">Current squad</h3>
            <p className="text-xs mt-0.5" style={{ color: '#4a5e80' }}>{props.seasonLabel} · from latest checkpoint</p>
          </div>
          <Link href="/dashboard/players" className="text-xs" style={{ color: '#6366f1' }}>All-time players →</Link>
        </div>

        {props.currentSquad.length > 0 ? (
          <div className="rounded-xl overflow-hidden" style={CARD}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={TABLE_HEAD}>
                    <th className="px-4 py-3 text-left text-xs font-medium w-8" style={{ color: '#4a5e80' }}>#</th>
                    <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#4a5e80' }}>Player</th>
                    <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: '#4a5e80' }}>Age</th>
                    <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: '#4a5e80' }}>Apps</th>
                    <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: '#4a5e80' }}>Goals</th>
                    <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: '#4a5e80' }}>Assists</th>
                    <th className="px-3 py-3 text-center text-xs font-medium hidden sm:table-cell" style={{ color: '#4a5e80' }}>CS</th>
                    <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: '#4a5e80' }}>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {props.currentSquad.map((p, i) => (
                    <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : undefined }}>
                      <td className="px-4 py-2.5 text-xs" style={{ color: '#4a5e80' }}>{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-sm text-white">{p.name}</p>
                        {p.position && <p className="text-xs" style={{ color: '#4a5e80' }}>{p.position}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-center text-sm" style={{ color: '#64748b' }}>{p.age ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center text-sm font-medium" style={{ color: '#94a3b8' }}>{p.apps ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-sm text-white">{p.goals ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-sm text-white">{p.assists ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center text-sm hidden sm:table-cell" style={{ color: '#64748b' }}>{p.cleanSheets ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center">
                        {p.avgRating != null ? (
                          <span className="font-bold text-sm" style={{ color: p.avgRating >= 7.2 ? '#10b981' : p.avgRating >= 6.5 ? '#6366f1' : p.avgRating >= 6.0 ? '#94a3b8' : '#ef4444' }}>
                            {p.avgRating.toFixed(2)}
                          </span>
                        ) : <span style={{ color: '#4a5e80' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-10 text-center" style={CARD}>
            <p className="text-sm" style={{ color: '#4a5e80' }}>No squad data for this checkpoint yet — use AI Import to add player stats.</p>
          </div>
        )}
      </div>

      {/* All-time records */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-white">All-time club records</h3>
            <p className="text-xs mt-0.5" style={{ color: '#4a5e80' }}>Every player who ever pulled on the shirt, including those who&apos;ve moved on</p>
          </div>
        </div>

        {props.allTimeRecords.length > 0 ? (
          <div className="rounded-xl overflow-hidden" style={CARD}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ ...CARD_HEADER }}>
              <span className="text-xs font-medium" style={{ color: '#4a5e80' }}>Sort by:</span>
              {(['goals', 'assists', 'apps'] as const).map(k => (
                <button
                  key={k}
                  onClick={() => setRecordSort(k)}
                  className="text-xs px-3 py-1 rounded-full border transition-all"
                  style={recordSort === k
                    ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: '1px solid transparent' }
                    : { background: 'transparent', color: '#4a5e80', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={TABLE_HEAD}>
                    <th className="px-4 py-3 text-left text-xs font-medium w-8" style={{ color: '#4a5e80' }}>#</th>
                    <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: '#4a5e80' }}>Player</th>
                    <th className="px-3 py-3 text-center text-xs font-medium hidden sm:table-cell" style={{ color: '#4a5e80' }}>Seasons</th>
                    <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: '#4a5e80' }}>Apps</th>
                    <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: '#4a5e80' }}>Goals</th>
                    <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: '#4a5e80' }}>Assists</th>
                    <th className="px-3 py-3 text-center text-xs font-medium hidden sm:table-cell" style={{ color: '#4a5e80' }}>CS</th>
                    <th className="px-3 py-3 text-center text-xs font-medium hidden md:table-cell" style={{ color: '#4a5e80' }}>Avg Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecords.map((p, i) => (
                    <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : undefined }}>
                      <td className="px-4 py-2.5 text-xs" style={{ color: '#4a5e80' }}>{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-sm text-white">{p.name}</p>
                        {p.position && <p className="text-xs" style={{ color: '#4a5e80' }}>{p.position}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-center text-sm hidden sm:table-cell" style={{ color: '#64748b' }}>{p.seasons}</td>
                      <td className="px-3 py-2.5 text-center text-sm font-medium" style={{ color: recordSort === 'apps' ? '#f1f5f9' : '#64748b', fontWeight: recordSort === 'apps' ? 700 : 500 }}>{p.apps || '—'}</td>
                      <td className="px-3 py-2.5 text-center text-sm font-bold" style={{ color: recordSort === 'goals' ? '#f1f5f9' : '#94a3b8' }}>{p.goals || '—'}</td>
                      <td className="px-3 py-2.5 text-center text-sm font-bold" style={{ color: recordSort === 'assists' ? '#f1f5f9' : '#94a3b8' }}>{p.assists || '—'}</td>
                      <td className="px-3 py-2.5 text-center text-sm hidden sm:table-cell" style={{ color: '#64748b' }}>{p.cleanSheets || '—'}</td>
                      <td className="px-3 py-2.5 text-center hidden md:table-cell">
                        {p.avgRating != null ? (
                          <span className="font-bold text-sm" style={{ color: p.avgRating >= 7.2 ? '#10b981' : p.avgRating >= 6.5 ? '#6366f1' : '#94a3b8' }}>
                            {p.avgRating.toFixed(2)}
                          </span>
                        ) : <span style={{ color: '#4a5e80' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-10 text-center" style={CARD}>
            <p className="text-sm" style={{ color: '#4a5e80' }}>Player records will appear here once you&apos;ve imported player stats via AI Import.</p>
          </div>
        )}
      </div>
    </div>
  )
}
