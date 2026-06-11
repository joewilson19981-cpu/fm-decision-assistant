'use client'

import { useState, useEffect } from 'react'
import { Users, AlertTriangle, CheckCircle2, Circle } from 'lucide-react'

interface PlayerStat {
  id: string
  playerId: string
  position: string | null
  appearances: number | null
  avgRating: number | null
  player: {
    id: string
    name: string
    position: string | null
  }
}

interface Save {
  id: string
  name: string
  currentClub: string | null
}

interface PositionSlot {
  label: string
  abbr: string
  x: number  // % from left
  y: number  // % from top
}

// FM position map — key positions on a 4-3-3 shape
const POSITION_MAP: PositionSlot[] = [
  { label: 'Goalkeeper', abbr: 'GK', x: 50, y: 88 },
  { label: 'Right Back', abbr: 'RB', x: 82, y: 72 },
  { label: 'Centre Back', abbr: 'CB', x: 63, y: 72 },
  { label: 'Centre Back', abbr: 'CB', x: 37, y: 72 },
  { label: 'Left Back', abbr: 'LB', x: 18, y: 72 },
  { label: 'Right Mid', abbr: 'RM', x: 80, y: 50 },
  { label: 'Central Mid', abbr: 'CM', x: 60, y: 48 },
  { label: 'Central Mid', abbr: 'CM', x: 40, y: 48 },
  { label: 'Left Mid', abbr: 'LM', x: 20, y: 50 },
  { label: 'Striker', abbr: 'ST', x: 62, y: 24 },
  { label: 'Striker', abbr: 'ST', x: 38, y: 24 },
]

// Maps common position strings to our slot abbreviations
const POS_MAP: Record<string, string[]> = {
  GK:  ['GK', 'Goalkeeper'],
  CB:  ['CB', 'CD', 'Centre Back', 'Center Back'],
  RB:  ['RB', 'Right Back', 'WBR', 'Right Wing Back'],
  LB:  ['LB', 'Left Back', 'WBL', 'Left Wing Back'],
  CM:  ['CM', 'MC', 'Central Mid', 'Central Midfielder', 'DM', 'AM', 'CAM', 'CDM'],
  RM:  ['RM', 'MR', 'Right Mid', 'Right Midfielder', 'RW', 'Right Wing'],
  LM:  ['LM', 'ML', 'Left Mid', 'Left Midfielder', 'LW', 'Left Wing'],
  ST:  ['ST', 'CF', 'Centre Forward', 'Striker', 'Forwards'],
}

function matchPosition(rawPos: string | null, abbr: string): boolean {
  if (!rawPos) return false
  const aliases = POS_MAP[abbr] || []
  return aliases.some(a => rawPos.toLowerCase().includes(a.toLowerCase()))
}

// Group players by position slot
function assignPlayersToSlots(players: PlayerStat[], slots: PositionSlot[]) {
  const result: Record<number, PlayerStat[]> = {}
  slots.forEach((_, i) => { result[i] = [] })

  const used = new Set<string>()

  // Two passes: first exact position, then flexible
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    players.forEach(p => {
      if (used.has(p.playerId)) return
      if (matchPosition(p.position, slot.abbr)) {
        result[i].push(p)
        // Don't mark as used — a player can appear in multiple matching slots (CB × 2, ST × 2)
      }
    })
  }

  return result
}

type DepthLevel = 'starter' | 'backup' | 'gap'

function depthColor(level: DepthLevel) {
  if (level === 'starter') return { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', text: '#34d399' }
  if (level === 'backup')  return { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' }
  return { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#f87171' }
}

function getDepthLevel(count: number): DepthLevel {
  if (count >= 2) return 'starter'
  if (count === 1) return 'backup'
  return 'gap'
}

export default function SquadDepthPage() {
  const [saves, setSaves] = useState<Save[]>([])
  const [selectedSave, setSelectedSave] = useState('')
  const [players, setPlayers] = useState<PlayerStat[]>([])
  const [loading, setLoading] = useState(false)
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/saves').then(r => r.json()).then(data => {
      setSaves(data || [])
      if (data?.length) setSelectedSave(data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedSave) return
    setLoading(true)
    // Get latest checkpoint's player stats
    fetch(`/api/saves/${selectedSave}`)
      .then(r => r.json())
      .then(data => {
        // Extract player stats from latest checkpoint
        const allStats: PlayerStat[] = []
        const seasons = data.seasons || []
        for (const season of seasons) {
          for (const checkpoint of (season.checkpoints || [])) {
            for (const stat of (checkpoint.playerStats || [])) {
              if (stat.player) allStats.push(stat)
            }
          }
        }
        // Deduplicate by playerId (keep latest)
        const seen = new Set<string>()
        const deduped: PlayerStat[] = []
        for (const s of allStats.reverse()) {
          if (!seen.has(s.playerId)) {
            seen.add(s.playerId)
            deduped.push(s)
          }
        }
        setPlayers(deduped)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedSave])

  const assignments = assignPlayersToSlots(players, POSITION_MAP)
  const currentSave = saves.find(s => s.id === selectedSave)

  const gapCount = POSITION_MAP.filter((_, i) => assignments[i].length === 0).length
  const backupOnlyCount = POSITION_MAP.filter((_, i) => assignments[i].length === 1).length
  const coveredCount = POSITION_MAP.filter((_, i) => assignments[i].length >= 2).length

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Squad Depth</h1>
          <p className="text-sm mt-1" style={{ color: '#888888' }}>
            Visual position map showing coverage across your squad
          </p>
        </div>
      </div>

      {/* Save selector */}
      <div className="rounded-xl p-4 flex items-center gap-3 flex-wrap"
        style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#555555' }}>Save</span>
        <select
          value={selectedSave}
          onChange={e => setSelectedSave(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg"
          style={{ background: '#080808', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '0.5rem' }}
        >
          {saves.map(s => (
            <option key={s.id} value={s.id}>{s.name}{s.currentClub ? ` — ${s.currentClub}` : ''}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: '#444444' }}>Loading squad data…</div>
      ) : players.length === 0 ? (
        <div className="text-center py-16 space-y-2" style={{ color: '#444444' }}>
          <Users size={32} className="mx-auto opacity-30" />
          <p className="text-sm">No player data found for this save.</p>
          <p className="text-xs">Add players via a checkpoint to see squad depth.</p>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Well Covered', count: coveredCount, level: 'starter' as DepthLevel, icon: CheckCircle2 },
              { label: 'Thin Cover', count: backupOnlyCount, level: 'backup' as DepthLevel, icon: Circle },
              { label: 'Gaps', count: gapCount, level: 'gap' as DepthLevel, icon: AlertTriangle },
            ].map(({ label, count, level, icon: Icon }) => {
              const c = depthColor(level)
              return (
                <div key={label} className="rounded-xl p-4"
                  style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={13} style={{ color: c.text }} />
                    <span className="text-xs font-semibold" style={{ color: c.text }}>{label}</span>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: c.text }}>{count}</span>
                  <span className="text-xs ml-1" style={{ color: c.text + '99' }}>positions</span>
                </div>
              )
            })}
          </div>

          {/* Pitch map */}
          <div className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-5 py-3 flex items-center justify-between"
              style={{ background: '#0c0c0c', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-sm font-semibold text-white">
                {currentSave?.currentClub || 'Your Club'}
              </span>
              <div className="flex items-center gap-4 text-[11px]" style={{ color: '#555555' }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#34d399' }} /> 2+ players
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#fbbf24' }} /> 1 player
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#f87171' }} /> Gap
                </span>
              </div>
            </div>

            <div className="relative" style={{ background: '#0d1a10', paddingBottom: '60%' }}>
              {/* Pitch markings */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 60"
                preserveAspectRatio="none"
              >
                {/* Pitch outline */}
                <rect x="2" y="2" width="96" height="56" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
                {/* Centre line */}
                <line x1="50" y1="2" x2="50" y2="58" stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />
                {/* Centre circle */}
                <circle cx="50" cy="30" r="8" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />
                {/* Penalty areas */}
                <rect x="2" y="16" width="14" height="28" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />
                <rect x="84" y="16" width="14" height="28" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />
                {/* 6-yard boxes */}
                <rect x="2" y="22" width="5" height="16" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
                <rect x="93" y="22" width="5" height="16" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
                {/* Vertical pitch stripes */}
                {[20, 35, 50, 65, 80].map(x => (
                  <line key={x} x1={x} y1="2" x2={x} y2="58"
                    stroke="rgba(255,255,255,0.015)" strokeWidth="0.3" />
                ))}
              </svg>

              {/* Position nodes */}
              {POSITION_MAP.map((slot, i) => {
                const slotPlayers = assignments[i]
                const level = getDepthLevel(slotPlayers.length)
                const c = depthColor(level)
                const isHovered = hoveredSlot === i

                return (
                  <div
                    key={`${slot.abbr}-${i}`}
                    className="absolute cursor-pointer transition-all"
                    style={{
                      left: `${slot.x}%`,
                      top: `${slot.y}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: isHovered ? 10 : 1,
                    }}
                    onMouseEnter={() => setHoveredSlot(i)}
                    onMouseLeave={() => setHoveredSlot(null)}
                  >
                    {/* Node */}
                    <div
                      className="w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all"
                      style={{
                        background: c.bg,
                        border: `2px solid ${c.border}`,
                        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      <span className="text-[10px] font-bold" style={{ color: c.text }}>{slot.abbr}</span>
                      <span className="text-[9px]" style={{ color: c.text + '99' }}>
                        {slotPlayers.length}/{2}
                      </span>
                    </div>

                    {/* Tooltip on hover */}
                    {isHovered && (
                      <div
                        className="absolute z-20 rounded-xl p-3 min-w-[140px] pointer-events-none"
                        style={{
                          background: '#141414',
                          border: '1px solid rgba(255,255,255,0.1)',
                          left: slot.x > 60 ? 'auto' : '120%',
                          right: slot.x > 60 ? '120%' : 'auto',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                          style={{ color: '#555555' }}>{slot.label}</p>
                        {slotPlayers.length === 0 ? (
                          <p className="text-xs" style={{ color: '#f87171' }}>No players found</p>
                        ) : (
                          slotPlayers.slice(0, 4).map(p => (
                            <p key={p.playerId} className="text-xs" style={{ color: '#cccccc' }}>
                              {p.player.name}
                              {p.avgRating ? <span style={{ color: '#555555' }}> · {p.avgRating.toFixed(1)}</span> : null}
                            </p>
                          ))
                        )}
                        {slotPlayers.length > 4 && (
                          <p className="text-[10px] mt-1" style={{ color: '#555555' }}>+{slotPlayers.length - 4} more</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Gap analysis */}
          {gapCount > 0 && (
            <div className="rounded-xl p-4"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: '#f87171' }}>
                ⚠ Squad Gaps ({gapCount} positions)
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#aaaaaa' }}>
                {POSITION_MAP
                  .filter((_, i) => assignments[i].length === 0)
                  .map(s => s.label)
                  .join(', ')} {gapCount > 1 ? 'have' : 'has'} no players mapped.
                Consider adding player stats via a checkpoint or using the Transfer Planner.
              </p>
            </div>
          )}

          {/* Player list table */}
          <div className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-5 py-3"
              style={{ background: '#0c0c0c', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-sm font-semibold text-white">All Players ({players.length})</span>
            </div>
            <div style={{ background: '#101010' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Player', 'Position', 'Apps', 'Goals', 'Assists', 'Avg Rating'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: '#444444' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, i) => (
                    <tr key={p.id}
                      style={{ borderBottom: i < players.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td className="px-4 py-2.5 text-white font-medium">{p.player.name}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded text-xs"
                          style={{ background: 'rgba(255,255,255,0.05)', color: '#888888' }}>
                          {p.position || p.player.position || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5" style={{ color: '#888888' }}>{p.appearances ?? '—'}</td>
                      <td className="px-4 py-2.5" style={{ color: '#888888' }}>—</td>
                      <td className="px-4 py-2.5" style={{ color: '#888888' }}>—</td>
                      <td className="px-4 py-2.5">
                        {p.avgRating != null ? (
                          <span className={`font-semibold ${p.avgRating >= 7 ? 'text-emerald-400' : p.avgRating >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {p.avgRating.toFixed(2)}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
