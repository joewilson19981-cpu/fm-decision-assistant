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

const S: Record<string, React.CSSProperties> = {
  card:   { background: '#101010', border: '1px solid rgba(255,255,255,0.06)' },
  cardHd: { background: '#0c0c0c', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  tblHd:  { background: '#080808' },
  rowMe:  { background: 'rgba(255,255,255,0.04)', borderLeft: '2px solid #ffffff' },
  divider:{ borderTop: '1px solid rgba(255,255,255,0.05)' },
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
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ordinal(n: number): string {
  if (n === 11 || n === 12 || n === 13) return `${n}th`
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`
}

function positionContext(pos: number | null | undefined) {
  if (pos == null) return { label: '', color: '#525252' }
  if (pos <= 2)  return { label: 'Automatic promotion', color: '#22c55e' }
  if (pos <= 7)  return { label: 'Playoff contender',  color: '#86efac' }
  if (pos <= 12) return { label: 'Mid-table',          color: '#a1a1aa' }
  if (pos <= 18) return { label: 'Lower half',         color: '#f59e0b' }
  return           { label: 'Relegation zone',         color: '#ef4444' }
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function DashboardClient(props: Props) {
  const [tab, setTab] = useState<'hub'|'journey'|'season'|'squad'>('hub')

  if (props.empty) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <div className="rounded-2xl p-16 text-center" style={S.card}>
          <p className="text-4xl mb-4">⚽</p>
          <p className="text-white font-semibold mb-1">No saves yet</p>
          <p className="text-sm mb-6" style={{ color: '#525252' }}>Create your first FM save to start tracking your career.</p>
          <Link href="/dashboard/saves/new" className="inline-block bg-white text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
            Create save
          </Link>
        </div>
      </div>
    )
  }

  if (props.noCheckpoint) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-white">{props.saveName}</h1>
        <div className="rounded-2xl p-16 text-center" style={S.card}>
          <p className="text-4xl mb-4">📊</p>
          <p className="text-white font-semibold mb-1">No checkpoint data yet</p>
          <p className="text-sm mb-6" style={{ color: '#525252' }}>Add a season and checkpoint, then use AI Import to start tracking.</p>
          <Link href={`/dashboard/saves/${props.saveId}`} className="inline-block bg-white text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
            Set up {props.clubName || 'save'}
          </Link>
        </div>
      </div>
    )
  }

  const pos = props.teamStats?.leaguePosition
  const ctx = positionContext(pos)

  const TABS = [
    { key: 'hub'    as const, label: 'Overview' },
    { key: 'journey'as const, label: 'Journey'  },
    { key: 'season' as const, label: 'Season'   },
    { key: 'squad'  as const, label: 'Squad'    },
  ]

  return (
    <div className="space-y-5">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[12px]" style={{ color: '#525252' }}>{props.saveName}</span>
            <span style={{ color: '#333333' }}>·</span>
            <span className="text-[12px]" style={{ color: '#525252' }}>{props.leagueName}</span>
            <span style={{ color: '#333333' }}>·</span>
            <span className="text-[12px]" style={{ color: '#525252' }}>{props.seasonLabel}</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">{props.clubName}</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {props.transferWindow && (
            <span
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
              style={props.transferWindow.toLowerCase().includes('closed')
                ? { background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.12)' }
                : { background: 'rgba(34,197,94,0.08)', color: '#86efac', border: '1px solid rgba(34,197,94,0.12)' }
              }
            >
              {props.transferWindow}
            </span>
          )}
          <Link
            href={`/dashboard/saves/${props.saveId}/seasons/${props.seasonId}/checkpoints/${props.checkpointId}/ai-import`}
            className="bg-white text-black text-[12px] font-semibold px-3.5 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            AI Import
          </Link>
        </div>
      </div>

      {/* ── STAT ROW ───────────────────────────────────────────────────────── */}
      {(pos != null || props.teamStats?.points != null) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {pos != null && (
            <div className="rounded-xl p-4 col-span-2 sm:col-span-1" style={S.card}>
              <p className="text-[11px] mb-1.5" style={{ color: '#525252' }}>Position</p>
              <p className="text-3xl font-bold" style={{ color: ctx.color }}>{ordinal(pos)}</p>
              <p className="text-[11px] mt-1" style={{ color: '#525252' }}>{ctx.label}</p>
            </div>
          )}
          {[
            { label: 'Points',    value: props.teamStats?.points,               fmt: (v: number) => String(v) },
            { label: 'Record',    value: props.teamStats?.wins != null ? 'X' : null, fmt: () => `${props.teamStats?.wins}W ${props.teamStats?.draws}D ${props.teamStats?.losses}L` },
            { label: 'Goals',     value: props.teamStats?.goalsFor != null ? 'X' : null, fmt: () => `${props.teamStats?.goalsFor} – ${props.teamStats?.goalsAgainst}` },
            { label: 'xG',        value: props.teamStats?.xg,                   fmt: (v: number) => String(v) },
            { label: 'Clean sheets', value: props.teamStats?.cleanSheets,       fmt: (v: number) => String(v) },
          ].filter(s => s.value != null).map(s => (
            <div key={s.label} className="rounded-xl p-4" style={S.card}>
              <p className="text-[11px] mb-1.5" style={{ color: '#525252' }}>{s.label}</p>
              <p className="text-xl font-bold text-white">{s.fmt(s.value as number)}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── FORM ───────────────────────────────────────────────────────────── */}
      {props.formStr && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={S.card}>
          <span className="text-[11px] font-medium" style={{ color: '#525252' }}>FORM</span>
          <div className="flex gap-1.5">
            {props.formStr.split('').slice(-8).map((r, i) => (
              <span
                key={i}
                className="w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center"
                style={
                  r === 'W' ? { background: '#22c55e', color: '#000' } :
                  r === 'D' ? { background: '#525252', color: '#fff' } :
                              { background: '#ef4444', color: '#fff' }
                }
              >{r}</span>
            ))}
          </div>
          {props.inGameDate && (
            <span className="ml-auto text-[11px]" style={{ color: '#333333' }}>{fmtDate(props.inGameDate)}</span>
          )}
        </div>
      )}

      {/* ── TABS ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-[13px] font-medium transition-colors relative"
            style={{ color: tab === t.key ? '#ffffff' : '#525252' }}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-white" />
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ────────────────────────────────────────────────────────── */}
      {tab === 'hub'     && <HubTab     {...props} ctx={ctx} />}
      {tab === 'journey' && <JourneyTab {...props} />}
      {tab === 'season'  && <SeasonTab  {...props} />}
      {tab === 'squad'   && <SquadTab   {...props} />}
    </div>
  )
}

// ── HUB ───────────────────────────────────────────────────────────────────────

function HubTab(props: Props & { ctx: { label: string; color: string } }) {
  const { tactic: tac, finance: fin, medical: med, leagueTable: lt } = props

  return (
    <div className="space-y-4">
      {/* Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Tactic */}
        <div className="rounded-xl p-5" style={S.card}>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-4" style={{ color: '#525252' }}>Tactic</p>
          {tac ? (
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[13px]" style={{ color: '#777777' }}>Formation</span>
                <span className="text-2xl font-bold text-white">{tac.formation ?? '—'}</span>
              </div>
              <div className="flex justify-between items-baseline" style={S.divider}>
                <span className="text-[13px] pt-3" style={{ color: '#777777' }}>Mentality</span>
                <span className="text-[13px] font-medium text-white pt-3">{tac.mentality ?? '—'}</span>
              </div>
            </div>
          ) : <p className="text-[13px]" style={{ color: '#525252' }}>No tactic data</p>}
        </div>

        {/* Finance */}
        <div className="rounded-xl p-5" style={S.card}>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-4" style={{ color: '#525252' }}>Finances</p>
          {fin ? (
            <div className="space-y-2.5">
              {[
                { label: 'Balance',         value: fmtMoney(fin.balance),         warn: (fin.balance ?? 0) < 0 },
                { label: 'Transfer budget', value: fmtMoney(fin.transferBudget) },
                { label: 'Wage budget',     value: fmtMoney(fin.wageBudget) },
                { label: 'Wage spend',      value: fmtMoney(fin.wageSpend) },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-[13px]">
                  <span style={{ color: '#777777' }}>{row.label}</span>
                  <span className="font-medium" style={{ color: row.warn ? '#f87171' : '#ffffff' }}>{row.value}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-[13px]" style={{ color: '#525252' }}>No finance data</p>}
        </div>

        {/* Medical */}
        <div className="rounded-xl p-5" style={S.card}>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-4" style={{ color: '#525252' }}>Squad health</p>
          {med ? (
            <div className="space-y-2.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[13px]" style={{ color: '#777777' }}>Current injuries</span>
                <span className="text-2xl font-bold" style={{ color: (med.currentInjuries ?? 0) > 4 ? '#ef4444' : (med.currentInjuries ?? 0) > 2 ? '#f59e0b' : '#22c55e' }}>
                  {med.currentInjuries ?? '—'}
                </span>
              </div>
              {med.totalInjuries != null && (
                <div className="flex justify-between text-[13px]" style={S.divider}>
                  <span className="pt-2.5" style={{ color: '#777777' }}>Season total</span>
                  <span className="font-medium text-white pt-2.5">{med.totalInjuries}</span>
                </div>
              )}
              {med.condition && (
                <div className="flex justify-between items-center text-[13px]" style={S.divider}>
                  <span className="pt-2.5" style={{ color: '#777777' }}>Condition</span>
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md mt-2.5"
                    style={
                      med.condition === 'Excellent' ? { background: 'rgba(34,197,94,0.1)', color: '#86efac' } :
                      med.condition === 'Good'      ? { background: 'rgba(255,255,255,0.06)', color: '#a1a1aa' } :
                      med.condition === 'Average'   ? { background: 'rgba(245,158,11,0.1)', color: '#fcd34d' } :
                                                      { background: 'rgba(239,68,68,0.1)', color: '#f87171' }
                    }
                  >{med.condition}</span>
                </div>
              )}
            </div>
          ) : <p className="text-[13px]" style={{ color: '#525252' }}>No medical data</p>}
        </div>
      </div>

      {/* Milestone comparison */}
      {props.milestoneComparison && (
        <div className="rounded-xl px-5 py-4 flex items-center gap-5" style={S.card}>
          <span className="text-2xl">{props.milestoneComparison.ptsDiff > 0 ? '↑' : props.milestoneComparison.ptsDiff < 0 ? '↓' : '→'}</span>
          <div>
            <p className="text-[13px] font-medium text-white">
              {props.milestoneComparison.ptsDiff > 0
                ? `${props.milestoneComparison.ptsDiff} pts ahead of last season at this point`
                : props.milestoneComparison.ptsDiff < 0
                ? `${Math.abs(props.milestoneComparison.ptsDiff)} pts behind last season at this point`
                : 'Same points as last season at this point'}
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: '#525252' }}>
              At {props.milestoneComparison.milestone} — last season: {ordinal(props.milestoneComparison.prevPos)}, {props.milestoneComparison.prevPts} pts
            </p>
          </div>
        </div>
      )}

      {/* League table */}
      {lt.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={S.card}>
          <div className="px-5 py-3.5 flex justify-between items-center" style={S.cardHd}>
            <p className="text-[13px] font-semibold text-white">League table</p>
            <p className="text-[12px]" style={{ color: '#525252' }}>{props.leagueName}</p>
          </div>
          <table className="w-full">
            <thead>
              <tr style={S.tblHd}>
                {['#','Club','P','W','D','L','GD','Pts'].map((h,i) => (
                  <th key={h} className={`px-4 py-2.5 text-[11px] font-medium text-left ${i > 2 && i < 7 ? 'hidden sm:table-cell' : ''} ${i >= 2 ? 'text-center' : ''}`} style={{ color: '#525252' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lt.slice(0, 12).map((row, i) => (
                <tr key={row.position} style={row.isYourTeam ? S.rowMe : { borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : undefined }}>
                  <td className="px-4 py-2.5 text-[12px]" style={{ color: '#525252' }}>{row.position}</td>
                  <td className="px-4 py-2.5 text-[13px] font-medium" style={{ color: row.isYourTeam ? '#ffffff' : '#a1a1aa' }}>
                    {row.teamName}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-center" style={{ color: '#525252' }}>{row.played}</td>
                  <td className="px-4 py-2.5 text-[12px] text-center hidden sm:table-cell" style={{ color: '#525252' }}>{row.wins}</td>
                  <td className="px-4 py-2.5 text-[12px] text-center hidden sm:table-cell" style={{ color: '#525252' }}>{row.draws}</td>
                  <td className="px-4 py-2.5 text-[12px] text-center hidden sm:table-cell" style={{ color: '#525252' }}>{row.losses}</td>
                  <td className="px-4 py-2.5 text-[12px] text-center hidden sm:table-cell" style={{ color: '#525252' }}>{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</td>
                  <td className="px-4 py-2.5 text-[13px] text-center font-semibold" style={{ color: row.isYourTeam ? '#ffffff' : '#a1a1aa' }}>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {lt.length > 12 && (
            <div className="px-5 py-3 text-center" style={S.divider}>
              <Link href={`/dashboard/saves/${props.saveId}/seasons/${props.seasonId}/checkpoints/${props.checkpointId}`} className="text-[12px]" style={{ color: '#525252' }}>
                View full table →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Other saves */}
      {props.otherSaves.length > 0 && (
        <div>
          <p className="text-[12px] font-medium mb-3" style={{ color: '#525252' }}>Other saves</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {props.otherSaves.map(save => (
              <Link key={save.id} href={`/dashboard/saves/${save.id}`}>
                <div className="rounded-xl p-4 hover:border-white/10 transition-colors cursor-pointer" style={S.card}>
                  <div className="flex justify-between mb-0.5">
                    <p className="text-[13px] font-medium text-white">{save.name}</p>
                    <span className="text-[11px]" style={{ color: '#525252' }}>FM{save.fmVersion}</span>
                  </div>
                  <p className="text-[12px]" style={{ color: '#525252' }}>{save.club}</p>
                  {(save.position != null || save.points != null) && (
                    <div className="flex gap-3 mt-2 pt-2 text-[12px]" style={S.divider}>
                      {save.position != null && <span className="font-semibold text-white">{ordinal(save.position)}</span>}
                      {save.points != null && <span style={{ color: '#525252' }}>{save.points} pts</span>}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Action links */}
      <div className="flex gap-2 pt-1">
        <Link
          href={`/dashboard/saves/${props.saveId}/seasons/${props.seasonId}/checkpoints/${props.checkpointId}`}
          className="text-[12px] font-medium px-3.5 py-2 rounded-lg transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#a1a1aa' }}
        >
          View checkpoint
        </Link>
        <Link
          href={`/dashboard/saves/${props.saveId}`}
          className="text-[12px] font-medium px-3.5 py-2 rounded-lg transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#a1a1aa' }}
        >
          Manage save
        </Link>
      </div>
    </div>
  )
}

// ── JOURNEY ───────────────────────────────────────────────────────────────────

function JourneyTab(props: Props) {
  const seasons = props.journeySeasons
  if (!seasons.length) return (
    <div className="rounded-xl p-12 text-center" style={S.card}>
      <p className="text-3xl mb-3">📈</p>
      <p className="text-white font-medium">No journey data yet</p>
      <p className="text-[13px] mt-1" style={{ color: '#525252' }}>Your season history will build up here over time.</p>
    </div>
  )

  const maxPts = Math.max(...seasons.map(s => s.points ?? 0), 1)

  return (
    <div className="space-y-4">
      {/* Comparison stats */}
      {props.milestoneComparison && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Points now',     value: `${props.milestoneComparison.currentPts}` },
            { label: 'Points last yr', value: `${props.milestoneComparison.prevPts}` },
            { label: 'Difference',     value: props.milestoneComparison.ptsDiff > 0 ? `+${props.milestoneComparison.ptsDiff}` : `${props.milestoneComparison.ptsDiff}`,
              color: props.milestoneComparison.ptsDiff > 0 ? '#22c55e' : props.milestoneComparison.ptsDiff < 0 ? '#ef4444' : '#a1a1aa' },
          ].map(card => (
            <div key={card.label} className="rounded-xl p-4" style={S.card}>
              <p className="text-[11px] mb-1.5" style={{ color: '#525252' }}>{card.label}</p>
              <p className="text-2xl font-bold" style={{ color: (card as {color?: string}).color ?? '#ffffff' }}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Season table */}
      <div className="rounded-xl overflow-hidden" style={S.card}>
        <div className="px-5 py-3.5" style={S.cardHd}>
          <p className="text-[13px] font-semibold text-white">Season history</p>
          <p className="text-[11px] mt-0.5" style={{ color: '#525252' }}>Best checkpoint per season</p>
        </div>
        <table className="w-full">
          <thead>
            <tr style={S.tblHd}>
              {['Season','League','At','Pos','Pts','','Goals','Top scorer'].map((h,i) => (
                <th key={i} className={`px-4 py-2.5 text-[11px] font-medium text-left ${[2,6,7].includes(i) ? 'hidden sm:table-cell' : ''} ${i===7 ? 'hidden lg:table-cell' : ''}`} style={{ color: '#525252' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {seasons.map((s, i) => (
              <tr key={s.seasonId} style={s.isCurrent ? S.rowMe : { borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : undefined }}>
                <td className="px-4 py-2.5">
                  <span className="text-[13px] font-medium" style={{ color: s.isCurrent ? '#ffffff' : '#a1a1aa' }}>{s.label}</span>
                  {s.isCurrent && <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)', color: '#777777' }}>now</span>}
                </td>
                <td className="px-4 py-2.5 text-[12px] hidden sm:table-cell" style={{ color: '#525252' }}>{s.league}</td>
                <td className="px-4 py-2.5 text-[11px] hidden sm:table-cell" style={{ color: '#525252' }}>{s.bestMilestone}</td>
                <td className="px-4 py-2.5 text-[13px] font-semibold" style={{ color: s.isCurrent ? '#ffffff' : '#a1a1aa' }}>{s.position != null ? ordinal(s.position) : '—'}</td>
                <td className="px-4 py-2.5 text-[13px] font-semibold" style={{ color: s.isCurrent ? '#ffffff' : '#a1a1aa' }}>{s.points ?? '—'}</td>
                <td className="px-4 py-2.5 hidden md:table-cell" style={{ width: 80 }}>
                  {s.points != null && (
                    <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-1 rounded-full" style={{ width: `${Math.round((s.points / maxPts) * 100)}%`, background: s.isCurrent ? '#ffffff' : '#333333' }} />
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5 text-[12px] hidden sm:table-cell" style={{ color: '#525252' }}>{s.goalsFor != null ? `${s.goalsFor}–${s.goalsAgainst}` : '—'}</td>
                <td className="px-4 py-2.5 text-[12px] hidden lg:table-cell">
                  {s.topScorer ? <><span className="text-white">{s.topScorer.name}</span> <span style={{ color: '#525252' }}>({s.topScorer.goals})</span></> : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── SEASON ────────────────────────────────────────────────────────────────────

function SeasonTab(props: Props) {
  const milestones = props.milestones
  if (!milestones.some(m => m.hasData)) return (
    <div className="rounded-xl p-12 text-center" style={S.card}>
      <p className="text-3xl mb-3">🗓</p>
      <p className="text-white font-medium">No season checkpoints yet</p>
      <p className="text-[13px] mt-1" style={{ color: '#525252' }}>Import screenshots for each of the 5 checkpoints to see your season unfold.</p>
    </div>
  )

  const done = milestones.filter(m => m.hasData).length
  const pct = Math.round((done / milestones.length) * 100)

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="rounded-xl p-5" style={S.card}>
        <div className="flex justify-between mb-3">
          <div>
            <p className="text-[13px] font-medium text-white">{props.seasonLabel}</p>
            <p className="text-[12px] mt-0.5" style={{ color: '#525252' }}>{done} of {milestones.length} checkpoints logged</p>
          </div>
          <span className="text-xl font-bold text-white">{pct}%</span>
        </div>
        <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-1 rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Milestone cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {milestones.map((m, idx) => (
          <div
            key={m.type}
            className="rounded-xl p-4"
            style={m.isCurrent
              ? { background: '#161616', border: '1px solid rgba(255,255,255,0.12)' }
              : m.hasData
              ? S.card
              : { background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.04)' }
            }
          >
            <p className="text-[10px] font-medium uppercase tracking-widest mb-1.5" style={{ color: m.hasData ? '#525252' : '#2a2a2a' }}>Step {idx+1}</p>
            <p className="text-[12px] font-semibold mb-3" style={{ color: m.isCurrent ? '#ffffff' : m.hasData ? '#a1a1aa' : '#2a2a2a' }}>{m.label}</p>
            {m.hasData ? (
              <div className="space-y-1.5">
                {m.position != null && <div className="flex justify-between text-[12px]"><span style={{ color: '#525252' }}>Pos</span><span className="font-semibold text-white">{ordinal(m.position)}</span></div>}
                {m.points   != null && <div className="flex justify-between text-[12px]"><span style={{ color: '#525252' }}>Pts</span><span className="font-semibold text-white">{m.points}</span></div>}
                {m.wins     != null && <div className="flex justify-between text-[12px]"><span style={{ color: '#525252' }}>W</span><span className="font-semibold text-white">{m.wins}</span></div>}
                {m.isCurrent && <p className="text-[10px] font-medium mt-2 pt-2" style={{ color: '#525252', borderTop: '1px solid rgba(255,255,255,0.06)' }}>Current</p>}
              </div>
            ) : (
              <p className="text-[11px] italic" style={{ color: '#2a2a2a' }}>Not logged</p>
            )}
          </div>
        ))}
      </div>

      {/* Season progression table */}
      {milestones.filter(m => m.hasData).length >= 2 && (
        <div className="rounded-xl overflow-hidden" style={S.card}>
          <div className="px-5 py-3.5" style={S.cardHd}>
            <p className="text-[13px] font-semibold text-white">Season progression</p>
          </div>
          <table className="w-full">
            <thead>
              <tr style={S.tblHd}>
                {['Checkpoint','Position','Points','Goals'].map((h,i) => (
                  <th key={h} className={`px-4 py-2.5 text-[11px] font-medium ${i>0?'text-center':''}`} style={{ color: '#525252' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {milestones.filter(m => m.hasData).map((m, i) => (
                <tr key={m.type} style={m.isCurrent ? S.rowMe : { borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : undefined }}>
                  <td className="px-4 py-2.5 text-[13px] font-medium" style={{ color: m.isCurrent ? '#ffffff' : '#a1a1aa' }}>{m.label}</td>
                  <td className="px-4 py-2.5 text-[13px] font-semibold text-center text-white">{m.position != null ? ordinal(m.position) : '—'}</td>
                  <td className="px-4 py-2.5 text-[13px] font-semibold text-center text-white">{m.points ?? '—'}</td>
                  <td className="px-4 py-2.5 text-[12px] text-center" style={{ color: '#525252' }}>{m.goalsFor ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── SQUAD ─────────────────────────────────────────────────────────────────────

function SquadTab(props: Props) {
  const [recordSort, setRecordSort] = useState<'goals'|'assists'|'apps'>('goals')
  const sorted = [...props.allTimeRecords].sort((a, b) => b[recordSort] - a[recordSort])

  function ratingStyle(r: number): React.CSSProperties {
    if (r >= 7.2) return { color: '#22c55e' }
    if (r >= 6.5) return { color: '#a1a1aa' }
    return { color: '#ef4444' }
  }

  return (
    <div className="space-y-6">
      {/* Current squad */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <p className="text-[13px] font-semibold text-white">Current squad — {props.seasonLabel}</p>
          <Link href="/dashboard/players" className="text-[12px]" style={{ color: '#525252' }}>All-time →</Link>
        </div>
        {props.currentSquad.length > 0 ? (
          <div className="rounded-xl overflow-hidden" style={S.card}>
            <table className="w-full">
              <thead>
                <tr style={S.tblHd}>
                  {['#','Player','Age','Apps','Goals','Ast','CS','Rating'].map((h,i) => (
                    <th key={h} className={`px-4 py-2.5 text-[11px] font-medium ${i>0?'text-center':''} ${[2,6].includes(i)?'hidden sm:table-cell':''}`} style={{ color: '#525252', textAlign: i===1?'left':'center' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {props.currentSquad.map((p, i) => (
                  <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : undefined }}>
                    <td className="px-4 py-2.5 text-[12px]" style={{ color: '#525252' }}>{i+1}</td>
                    <td className="px-4 py-2.5">
                      <p className="text-[13px] font-medium text-white">{p.name}</p>
                      {p.position && <p className="text-[11px]" style={{ color: '#525252' }}>{p.position}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-center hidden sm:table-cell" style={{ color: '#525252' }}>{p.age ?? '—'}</td>
                    <td className="px-4 py-2.5 text-[12px] text-center" style={{ color: '#777777' }}>{p.apps ?? '—'}</td>
                    <td className="px-4 py-2.5 text-[13px] font-semibold text-center text-white">{p.goals ?? '—'}</td>
                    <td className="px-4 py-2.5 text-[13px] font-semibold text-center text-white">{p.assists ?? '—'}</td>
                    <td className="px-4 py-2.5 text-[12px] text-center hidden sm:table-cell" style={{ color: '#525252' }}>{p.cleanSheets ?? '—'}</td>
                    <td className="px-4 py-2.5 text-[13px] font-bold text-center" style={p.avgRating != null ? ratingStyle(p.avgRating) : { color: '#525252' }}>
                      {p.avgRating != null ? p.avgRating.toFixed(2) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl p-10 text-center" style={S.card}>
            <p className="text-[13px]" style={{ color: '#525252' }}>No squad data yet — use AI Import to add player stats.</p>
          </div>
        )}
      </div>

      {/* All-time records */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <p className="text-[13px] font-semibold text-white">All-time club records</p>
          <div className="flex gap-1">
            {(['goals','assists','apps'] as const).map(k => (
              <button
                key={k}
                onClick={() => setRecordSort(k)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors"
                style={recordSort === k
                  ? { background: 'rgba(255,255,255,0.1)', color: '#ffffff' }
                  : { color: '#525252' }
                }
              >
                {k.charAt(0).toUpperCase()+k.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {sorted.length > 0 ? (
          <div className="rounded-xl overflow-hidden" style={S.card}>
            <table className="w-full">
              <thead>
                <tr style={S.tblHd}>
                  {['#','Player','Seasons','Apps','Goals','Ast','CS','Avg Rating'].map((h,i) => (
                    <th key={h} className={`px-4 py-2.5 text-[11px] font-medium ${i>0?'text-center':''} ${[2,6,7].includes(i)?'hidden sm:table-cell':''}`} style={{ color: '#525252', textAlign: i===1?'left':'center' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => (
                  <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : undefined }}>
                    <td className="px-4 py-2.5 text-[12px]" style={{ color: '#525252' }}>{i+1}</td>
                    <td className="px-4 py-2.5">
                      <p className="text-[13px] font-medium text-white">{p.name}</p>
                      {p.position && <p className="text-[11px]" style={{ color: '#525252' }}>{p.position}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-center hidden sm:table-cell" style={{ color: '#525252' }}>{p.seasons}</td>
                    <td className="px-4 py-2.5 text-[13px] text-center font-semibold" style={{ color: recordSort==='apps'?'#ffffff':'#777777' }}>{p.apps||'—'}</td>
                    <td className="px-4 py-2.5 text-[13px] text-center font-semibold" style={{ color: recordSort==='goals'?'#ffffff':'#777777' }}>{p.goals||'—'}</td>
                    <td className="px-4 py-2.5 text-[13px] text-center font-semibold" style={{ color: recordSort==='assists'?'#ffffff':'#777777' }}>{p.assists||'—'}</td>
                    <td className="px-4 py-2.5 text-[12px] text-center hidden sm:table-cell" style={{ color: '#525252' }}>{p.cleanSheets||'—'}</td>
                    <td className="px-4 py-2.5 text-[13px] font-bold text-center hidden sm:table-cell" style={p.avgRating != null ? ratingStyle(p.avgRating) : { color: '#525252' }}>
                      {p.avgRating != null ? p.avgRating.toFixed(2) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl p-10 text-center" style={S.card}>
            <p className="text-[13px]" style={{ color: '#525252' }}>Records appear once you import player stats via AI Import.</p>
          </div>
        )}
      </div>
    </div>
  )
}
