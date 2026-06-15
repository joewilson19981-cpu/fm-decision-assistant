'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Target, Users, BarChart2, Minus } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrendPoint {
  label: string
  gamesPlayed: number | null
  position: number | null
  points: number | null
  wins: number | null
  draws: number | null
  losses: number | null
  goalsFor: number | null
  goalsAgainst: number | null
  goalDiff: number | null
  xg: number | null
  xga: number | null
  xgDiff: number | null
  cleanSheets: number | null
  possession: number | null
  passCompletion: number | null
  shotsPerGame: number | null
  setPieceGoalsFor: number | null
  setPieceGoalsAgainst: number | null
  setPiecePct: number | null
  transferBudget: number | null
}

interface Player {
  id: string
  name: string
  position: string | null
  goals: number
  assists: number
  apps: number
  cleanSheets: number
  avgRating: number | null
  yellowCards: number
  redCards: number
  contractExpiry: string | null
  wage: number | null
}

interface SeasonData {
  seasonId: string
  seasonLabel: string
  leagueName: string
  clubName: string
  boardExpectation: string | null
  seasonObjective: string | null
  isCurrent: boolean
  trend: TrendPoint[]
  players: Player[]
  contractAlerts: Player[]
  checkpointCount: number
}

interface AnalyticsData {
  saveId: string
  saveName: string
  clubName: string
  seasons: SeasonData[]
}

interface Save {
  id: string
  name: string
  currentClub: string | null
}

// ── Metric config ─────────────────────────────────────────────────────────────

const METRICS = [
  { key: 'position',          label: 'League Position',    invert: true,  format: (v: number) => `${v}th`,       color: '#ffffff' },
  { key: 'points',            label: 'Points',             invert: false, format: (v: number) => `${v}`,         color: '#60a5fa' },
  { key: 'goalsFor',          label: 'Goals Scored',       invert: false, format: (v: number) => `${v}`,         color: '#34d399' },
  { key: 'goalsAgainst',      label: 'Goals Conceded',     invert: true,  format: (v: number) => `${v}`,         color: '#f87171' },
  { key: 'xg',                label: 'xG',                 invert: false, format: (v: number) => v.toFixed(1),   color: '#a78bfa' },
  { key: 'xga',               label: 'xGA',                invert: true,  format: (v: number) => v.toFixed(1),   color: '#fb923c' },
  { key: 'xgDiff',            label: 'xG Difference',      invert: false, format: (v: number) => (v > 0 ? '+' : '') + v.toFixed(1), color: '#fbbf24' },
  { key: 'setPieceGoalsFor',  label: 'Set Piece Goals',    invert: false, format: (v: number) => `${v}`,         color: '#2dd4bf' },
  { key: 'setPiecePct',       label: 'Set Piece %',        invert: false, format: (v: number) => `${v}%`,        color: '#e879f9' },
  { key: 'cleanSheets',       label: 'Clean Sheets',       invert: false, format: (v: number) => `${v}`,         color: '#94a3b8' },
  { key: 'possession',        label: 'Possession %',       invert: false, format: (v: number) => `${v}%`,        color: '#38bdf8' },
  { key: 'goalDiff',          label: 'Goal Difference',    invert: false, format: (v: number) => (v > 0 ? '+' : '') + v, color: '#4ade80' },
] as const

type MetricKey = typeof METRICS[number]['key']

const PLAYER_METRICS = [
  { key: 'goals',       label: 'Top Scorers',    color: '#34d399', format: (v: number) => `${v}G` },
  { key: 'assists',     label: 'Most Assists',   color: '#60a5fa', format: (v: number) => `${v}A` },
  { key: 'avgRating',   label: 'Highest Rated',  color: '#fbbf24', format: (v: number) => v.toFixed(2) },
  { key: 'cleanSheets', label: 'Clean Sheets',   color: '#a78bfa', format: (v: number) => `${v}` },
  { key: 'apps',        label: 'Most Apps',      color: '#94a3b8', format: (v: number) => `${v}` },
] as const

type PlayerMetricKey = typeof PLAYER_METRICS[number]['key']

// ── SVG Line Chart ────────────────────────────────────────────────────────────

function LineChart({
  data,
  metricKey,
  color,
  invert,
  formatFn,
}: {
  data: TrendPoint[]
  metricKey: string
  color: string
  invert: boolean
  formatFn: (v: number) => string
}) {
  const W = 680
  const H = 220
  const PAD = { top: 20, right: 24, bottom: 36, left: 48 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const values = data.map(d => (d as any)[metricKey] as number | null)
  const validValues = values.filter(v => v !== null) as number[]

  if (validValues.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-sm" style={{ color: '#444' }}>
        Not enough data points yet — add more checkpoints
      </div>
    )
  }

  const minVal = Math.min(...validValues)
  const maxVal = Math.max(...validValues)
  const range = maxVal - minVal || 1
  const padVal = range * 0.15

  const yMin = minVal - padVal
  const yMax = maxVal + padVal

  function toX(i: number) {
    return PAD.left + (i / (data.length - 1)) * chartW
  }
  function toY(v: number) {
    const norm = (v - yMin) / (yMax - yMin)
    // If invert (lower is better), flip the Y axis so lower values appear higher on chart
    const y = invert ? PAD.top + norm * chartH : PAD.top + (1 - norm) * chartH
    return y
  }

  // Build path
  const points = data
    .map((d, i) => {
      const v = (d as any)[metricKey] as number | null
      if (v === null) return null
      return { x: toX(i), y: toY(v), v, label: d.label, i }
    })
    .filter(Boolean) as { x: number; y: number; v: number; label: string; i: number }[]

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  // Gradient fill path
  const fillPath = points.length > 0
    ? `${linePath} L ${points.at(-1)!.x} ${PAD.top + chartH} L ${points[0].x} ${PAD.top + chartH} Z`
    : ''

  // Y-axis gridlines
  const yTicks = 4
  const yLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = yMin + (i / yTicks) * (yMax - yMin)
    const y = invert ? PAD.top + (i / yTicks) * chartH : PAD.top + (1 - i / yTicks) * chartH
    return { v, y }
  })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id={`grad-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yLines.map(({ v, y }, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#444">
            {formatFn(Math.round(v * 10) / 10)}
          </text>
        </g>
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => (
        <text key={i} x={toX(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#555">
          {d.label}
        </text>
      ))}

      {/* Vertical tick lines */}
      {data.map((d, i) => (
        <line key={i} x1={toX(i)} y1={PAD.top + chartH} x2={toX(i)} y2={PAD.top + chartH + 4}
          stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}

      {/* Fill area */}
      {fillPath && (
        <path d={fillPath} fill={`url(#grad-${metricKey})`} />
      )}

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={color} stroke="#0d0d0d" strokeWidth="2" />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fill={color} fontWeight="600">
            {formatFn(p.v)}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────

function BarChart({
  players,
  metricKey,
  color,
  formatFn,
  topN = 10,
}: {
  players: Player[]
  metricKey: PlayerMetricKey
  color: string
  formatFn: (v: number) => string
  topN?: number
}) {
  const sorted = [...players]
    .filter(p => {
      const v = p[metricKey]
      return v !== null && (typeof v === 'number' ? v > 0 : true)
    })
    .sort((a, b) => {
      const av = (a[metricKey] as number) ?? 0
      const bv = (b[metricKey] as number) ?? 0
      return bv - av
    })
    .slice(0, topN)

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm" style={{ color: '#444' }}>
        No player data yet
      </div>
    )
  }

  const maxVal = Math.max(...sorted.map(p => (p[metricKey] as number) ?? 0)) || 1

  const ROW_H = 36
  const H = sorted.length * ROW_H + 8
  const W = 680
  const LABEL_W = 140
  const BAR_W = W - LABEL_W - 80
  const PAD_LEFT = LABEL_W + 8

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {sorted.map((p, i) => {
        const v = (p[metricKey] as number) ?? 0
        const barWidth = (v / maxVal) * BAR_W
        const y = i * ROW_H + 4
        const isTop = i === 0

        return (
          <g key={p.id}>
            {/* Name */}
            <text x={0} y={y + 22} fontSize="12" fill={isTop ? '#ffffff' : '#aaaaaa'} fontWeight={isTop ? '600' : '400'}>
              {p.name.length > 18 ? p.name.slice(0, 17) + '…' : p.name}
            </text>
            {/* Position badge */}
            <text x={LABEL_W - 4} y={y + 22} fontSize="10" fill="#444" textAnchor="end">
              {p.position ?? ''}
            </text>
            {/* Bar background */}
            <rect x={PAD_LEFT} y={y + 8} width={BAR_W} height={18} rx="3"
              fill="rgba(255,255,255,0.04)" />
            {/* Bar fill */}
            <rect x={PAD_LEFT} y={y + 8} width={barWidth} height={18} rx="3"
              fill={color} opacity={isTop ? 1 : 0.6} />
            {/* Value label */}
            <text x={PAD_LEFT + barWidth + 6} y={y + 21} fontSize="11" fill={color} fontWeight="600">
              {formatFn(v)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, trend }: {
  label: string
  value: string | number | null
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-[11px] font-medium uppercase tracking-widest mb-1.5" style={{ color: '#444' }}>{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white">{value ?? '—'}</span>
        {trend && trend !== 'neutral' && (
          trend === 'up'
            ? <TrendingUp size={14} style={{ color: '#34d399', marginBottom: 4 }} />
            : <TrendingDown size={14} style={{ color: '#f87171', marginBottom: 4 }} />
        )}
      </div>
      {sub && <p className="text-[11px] mt-1" style={{ color: '#555' }}>{sub}</p>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [saves, setSaves]         = useState<Save[]>([])
  const [saveId, setSaveId]       = useState<string>('')
  const [data, setData]           = useState<AnalyticsData | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<string>('all')
  const [activeMetric, setActiveMetric]     = useState<MetricKey>('position')
  const [playerMetric, setPlayerMetric]     = useState<PlayerMetricKey>('goals')
  const [loading, setLoading]     = useState(false)

  // Load saves
  useEffect(() => {
    fetch('/api/saves').then(r => r.json()).then((list: Save[]) => {
      setSaves(list || [])
      if (list?.length) setSaveId(list[0].id)
    })
  }, [])

  // Load analytics when save changes
  useEffect(() => {
    if (!saveId) return
    setLoading(true)
    fetch(`/api/analytics?saveId=${saveId}`)
      .then(r => r.json())
      .then(d => { setData(d); setSelectedSeason('all') })
      .finally(() => setLoading(false))
  }, [saveId])

  // Derive active season data
  const activeSeason = useMemo<SeasonData | null>(() => {
    if (!data) return null
    if (selectedSeason === 'all') {
      // Merge all seasons — flatten trend points
      return data.seasons.find(s => s.isCurrent) ?? data.seasons[data.seasons.length - 1] ?? null
    }
    return data.seasons.find(s => s.seasonId === selectedSeason) ?? null
  }, [data, selectedSeason])

  const trend = activeSeason?.trend ?? []
  const players = activeSeason?.players ?? []
  const contractAlerts = activeSeason?.contractAlerts ?? []

  const metricConfig = METRICS.find(m => m.key === activeMetric)!
  const playerMetricConfig = PLAYER_METRICS.find(m => m.key === playerMetric)!

  // Latest data point for stat cards
  const latest = trend.at(-1)
  const prev   = trend.at(-2)

  function trendDir(key: string, invert: boolean): 'up' | 'down' | 'neutral' {
    if (!latest || !prev) return 'neutral'
    const a = (prev as any)[key] as number | null
    const b = (latest as any)[key] as number | null
    if (a === null || b === null) return 'neutral'
    const improved = invert ? b < a : b > a
    return improved ? 'up' : b === a ? 'neutral' : 'down'
  }

  return (
    <div className="px-6 py-6 max-w-5xl" style={{ color: '#ffffff' }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Analytics</h1>
          <p className="text-[13px] mt-0.5" style={{ color: '#555' }}>
            Performance trends across your season checkpoints
          </p>
        </div>

        {/* Save selector */}
        <div className="flex items-center gap-3 flex-wrap">
          {saves.length > 1 && (
            <select
              value={saveId}
              onChange={e => setSaveId(e.target.value)}
              className="text-sm rounded-lg px-3 py-2 outline-none"
              style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
            >
              {saves.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#101010' }}>
                  {s.currentClub || s.name}
                </option>
              ))}
            </select>
          )}

          {data && data.seasons.length > 1 && (
            <select
              value={selectedSeason}
              onChange={e => setSelectedSeason(e.target.value)}
              className="text-sm rounded-lg px-3 py-2 outline-none"
              style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
            >
              {data.seasons.map(s => (
                <option key={s.seasonId} value={s.seasonId} style={{ background: '#101010' }}>
                  {s.seasonLabel} {s.isCurrent ? '(current)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-60 text-sm" style={{ color: '#444' }}>
          Loading analytics…
        </div>
      )}

      {!loading && !data && (
        <div className="flex items-center justify-center h-60 text-sm" style={{ color: '#444' }}>
          No saves found — set up a save in the Assistant first.
        </div>
      )}

      {!loading && data && activeSeason && (

        <div className="space-y-8">

          {/* ── Season context strip ── */}
          <div className="rounded-xl p-4 flex flex-wrap gap-4 items-start"
            style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest mb-1" style={{ color: '#444' }}>Season</p>
              <p className="text-sm font-semibold text-white">{activeSeason.seasonLabel}</p>
              <p className="text-[12px]" style={{ color: '#666' }}>{activeSeason.leagueName}</p>
            </div>
            {activeSeason.boardExpectation && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest mb-1" style={{ color: '#444' }}>Board Target</p>
                <div className="flex items-center gap-1.5">
                  <Target size={12} style={{ color: '#fbbf24' }} />
                  <p className="text-sm text-white">{activeSeason.boardExpectation}</p>
                </div>
              </div>
            )}
            {activeSeason.seasonObjective && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest mb-1" style={{ color: '#444' }}>Your Goal</p>
                <p className="text-sm text-white">{activeSeason.seasonObjective}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest mb-1" style={{ color: '#444' }}>Checkpoints</p>
              <p className="text-sm text-white">{activeSeason.checkpointCount} / 4 complete</p>
            </div>
          </div>

          {/* ── Quick stat cards ── */}
          {latest && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="Position"
                value={latest.position != null ? `${latest.position}th` : null}
                sub={`after ${latest.gamesPlayed ?? '?'} games`}
                trend={trendDir('position', true)}
              />
              <StatCard
                label="Points"
                value={latest.points}
                sub={`${latest.wins ?? '?'}W ${latest.draws ?? '?'}D ${latest.losses ?? '?'}L`}
                trend={trendDir('points', false)}
              />
              <StatCard
                label="xG Diff"
                value={latest.xgDiff != null ? (latest.xgDiff > 0 ? '+' : '') + latest.xgDiff.toFixed(1) : null}
                sub={latest.xg != null ? `${latest.xg.toFixed(1)} xG / ${latest.xga?.toFixed(1) ?? '?'} xGA` : undefined}
                trend={trendDir('xgDiff', false)}
              />
              <StatCard
                label="Set Piece Goals"
                value={latest.setPieceGoalsFor}
                sub={latest.setPiecePct != null ? `${latest.setPiecePct}% of all goals` : undefined}
                trend={trendDir('setPieceGoalsFor', false)}
              />
            </div>
          )}

          {/* ── Contract alerts ── */}
          {contractAlerts.length > 0 && (
            <div className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(251,191,36,0.2)', background: '#0d0d0d' }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b"
                style={{ borderColor: 'rgba(251,191,36,0.15)', background: 'rgba(251,191,36,0.05)' }}>
                <AlertTriangle size={13} style={{ color: '#fbbf24' }} />
                <span className="text-xs font-semibold" style={{ color: '#fbbf24' }}>
                  Contract Alerts — {contractAlerts.length} player{contractAlerts.length !== 1 ? 's' : ''} expiring soon
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {contractAlerts.map(p => {
                  const exp = new Date(p.contractExpiry!)
                  const months = Math.round((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
                  return (
                    <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-white font-medium">{p.name}</span>
                        <span className="text-[11px]" style={{ color: '#555' }}>{p.position}</span>
                      </div>
                      <span className="text-[11px] font-medium" style={{ color: months <= 3 ? '#f87171' : '#fbbf24' }}>
                        {months <= 0 ? 'Expiring' : `${months}mo`} · {exp.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Performance trend chart ── */}
          <div className="rounded-xl overflow-hidden"
            style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-5 pt-4 pb-3 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <BarChart2 size={14} style={{ color: metricConfig.color }} />
                  <span className="text-sm font-semibold text-white">{metricConfig.label}</span>
                  {metricConfig.invert && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#555' }}>
                      lower = better
                    </span>
                  )}
                </div>
                {/* Metric selector pills */}
                <div className="flex flex-wrap gap-1.5">
                  {METRICS.map(m => (
                    <button
                      key={m.key}
                      onClick={() => setActiveMetric(m.key as MetricKey)}
                      className="text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all"
                      style={activeMetric === m.key
                        ? { background: m.color, color: '#080808' }
                        : { background: 'rgba(255,255,255,0.05)', color: '#555' }
                      }
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-4 py-4">
              <LineChart
                data={trend}
                metricKey={activeMetric}
                color={metricConfig.color}
                invert={metricConfig.invert}
                formatFn={metricConfig.format as (v: number) => string}
              />
            </div>
          </div>

          {/* ── Player performance chart ── */}
          <div className="rounded-xl overflow-hidden"
            style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-5 pt-4 pb-3 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Users size={14} style={{ color: playerMetricConfig.color }} />
                  <span className="text-sm font-semibold text-white">{playerMetricConfig.label}</span>
                </div>
                <div className="flex gap-1.5">
                  {PLAYER_METRICS.map(m => (
                    <button
                      key={m.key}
                      onClick={() => setPlayerMetric(m.key as PlayerMetricKey)}
                      className="text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all"
                      style={playerMetric === m.key
                        ? { background: m.color, color: '#080808' }
                        : { background: 'rgba(255,255,255,0.05)', color: '#555' }
                      }
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              <BarChart
                players={players}
                metricKey={playerMetric}
                color={playerMetricConfig.color}
                formatFn={playerMetricConfig.format as (v: number) => string}
              />
            </div>
          </div>

          {/* ── Full player table ── */}
          <div className="rounded-xl overflow-hidden"
            style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <span className="text-sm font-semibold text-white">All Players</span>
              <span className="text-[11px] ml-2" style={{ color: '#444' }}>{players.length} in squad</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Player', 'Pos', 'Apps', 'G', 'A', 'CS', 'Avg Rtg', 'Y', 'R'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-widest"
                        style={{ color: '#444' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.slice(0, 25).map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td className="px-4 py-2.5">
                        <span className="text-[13px] font-medium" style={{ color: i < 3 ? '#ffffff' : '#aaaaaa' }}>
                          {p.name}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[11px]" style={{ color: '#555' }}>{p.position ?? '—'}</td>
                      <td className="px-4 py-2.5 text-[13px]" style={{ color: '#888' }}>{p.apps || '—'}</td>
                      <td className="px-4 py-2.5 text-[13px] font-semibold" style={{ color: p.goals > 0 ? '#34d399' : '#555' }}>
                        {p.goals || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-[13px]" style={{ color: p.assists > 0 ? '#60a5fa' : '#555' }}>
                        {p.assists || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-[13px]" style={{ color: '#888' }}>{p.cleanSheets || '—'}</td>
                      <td className="px-4 py-2.5 text-[13px] font-semibold" style={{
                        color: p.avgRating != null
                          ? p.avgRating >= 7.2 ? '#34d399' : p.avgRating >= 6.8 ? '#fbbf24' : '#f87171'
                          : '#555'
                      }}>
                        {p.avgRating != null ? p.avgRating.toFixed(2) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-[13px]" style={{ color: p.yellowCards > 0 ? '#fbbf24' : '#555' }}>
                        {p.yellowCards || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-[13px]" style={{ color: p.redCards > 0 ? '#f87171' : '#555' }}>
                        {p.redCards || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
