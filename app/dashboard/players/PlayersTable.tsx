'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { PlayerRow } from './page'

type SortKey = 'goals' | 'assists' | 'apps' | 'avgRating' | 'cleanSheets'

export default function PlayersTable({ players }: { players: PlayerRow[] }) {
  const [sort, setSort] = useState<SortKey>('goals')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [filter, setFilter] = useState('')

  // Build unique league+season options from the data itself
  const leagueSeasonOptions = useMemo(() => {
    const seen = new Set<string>()
    const opts: { key: string; label: string }[] = []
    for (const p of players) {
      for (const s of p.seasonBreakdown) {
        const key = `${s.league}|${s.seasonLabel}`
        if (!seen.has(key) && s.league !== '—') {
          seen.add(key)
          opts.push({ key, label: `${s.league} ${s.seasonLabel}` })
        }
      }
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label))
  }, [players])

  const handleSort = (k: SortKey) => {
    if (sort === k) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSort(k)
      setSortDir('desc')
    }
  }

  const filtered = filter
    ? players.filter(p => {
        const [fl, fs] = filter.split('|')
        return p.seasonBreakdown.some(s => s.league === fl && s.seasonLabel === fs)
      })
    : players

  const sorted = [...filtered].sort((a, b) => {
    const diff = sort === 'avgRating'
      ? (b.avgRating ?? 0) - (a.avgRating ?? 0)
      : (b[sort] as number) - (a[sort] as number)
    return sortDir === 'asc' ? -diff : diff
  })

  const arrow = sortDir === 'desc' ? ' ↓' : ' ↑'

  const SortTh = ({ label, k }: { label: string; k: SortKey }) => (
    <th className="px-3 py-3 text-center">
      <button
        onClick={() => handleSort(k)}
        className={`text-xs font-semibold uppercase tracking-wide hover:text-white transition-colors ${
          sort === k ? 'text-white' : 'text-zinc-500'
        }`}
      >
        {label}{sort === k && arrow}
      </button>
    </th>
  )

  if (players.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">All-Time Player Stats</h1>
          <p className="text-zinc-500 text-sm mt-1">Aggregated season totals across every save — one row per player, no double-counting.</p>
        </div>
        <div className="rounded-xl card-panel border border-white/[0.06] p-10 text-center">
          <div className="text-4xl mb-3">👤</div>
          <h2 className="text-lg font-semibold text-white mb-2">No player data yet</h2>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Player stats appear here once you've used AI Import on a checkpoint containing a player stats screenshot.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">All-Time Player Stats</h1>
        <p className="text-zinc-500 text-sm mt-1">Aggregated season totals across every save — one row per player, no double-counting.</p>
      </div>

      {/* League+season filter */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-xs text-zinc-500 font-medium">Filter:</span>
        <button
          onClick={() => setFilter('')}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            !filter ? 'bg-white text-black border-blue-600' : 'card-panel text-zinc-400 border-white/10 hover:border-blue-400'
          }`}
        >
          All
        </button>
        {leagueSeasonOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(filter === opt.key ? '' : opt.key)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filter === opt.key ? 'bg-white text-black border-blue-600' : 'card-panel text-zinc-400 border-white/10 hover:border-blue-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="text-xs text-zinc-600 mb-3">
        {sorted.length} player{sorted.length !== 1 ? 's' : ''} · click column headers to sort · click again to reverse
      </div>

      <div className="rounded-xl card-panel border border-white/[0.06] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className=" border-b border-white/[0.04]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide w-8">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Player</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wide">Seasons</th>
              <SortTh label="Apps" k="apps" />
              <SortTh label="Goals" k="goals" />
              <SortTh label="Assists" k="assists" />
              <SortTh label="Rating" k="avgRating" />
              <SortTh label="CS" k="cleanSheets" />
              <th className="px-3 py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wide">YC</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wide">RC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((p, i) => (
              <tr key={p.id} className="hover:">
                <td className="px-4 py-3 text-zinc-600 text-sm">{i + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-white">{p.name}</p>
                  {p.position && <p className="text-xs text-zinc-600">{p.position}</p>}
                  {p.seasons > 1 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {p.seasonBreakdown
                        .sort((a, b) => a.seasonLabel.localeCompare(b.seasonLabel))
                        .map((s, si) => (
                          <Link
                            key={si}
                            href={`/dashboard/saves/${s.saveId}/seasons/${s.seasonId}`}
                            className="text-xs text-zinc-600 hover:text-white  rounded px-2 py-0.5"
                          >
                            {s.seasonLabel} ({s.league}) — {s.goals}G {s.assists}A
                          </Link>
                        ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-center text-zinc-400">{p.seasons}</td>
                <td className={`px-3 py-3 text-center ${sort === 'apps' ? 'text-white font-bold' : 'text-zinc-300'}`}>
                  {p.apps || '—'}
                </td>
                <td className={`px-3 py-3 text-center font-bold ${sort === 'goals' ? 'text-white' : 'text-white'}`}>
                  {p.goals || '—'}
                </td>
                <td className={`px-3 py-3 text-center font-bold ${sort === 'assists' ? 'text-white' : 'text-white'}`}>
                  {p.assists || '—'}
                </td>
                <td className={`px-3 py-3 text-center font-bold ${sort === 'avgRating' ? 'text-white' : 'text-white'}`}>
                  {p.avgRating != null ? p.avgRating.toFixed(2) : '—'}
                </td>
                <td className={`px-3 py-3 text-center ${sort === 'cleanSheets' ? 'text-white font-bold' : 'text-zinc-300'}`}>
                  {p.cleanSheets || '—'}
                </td>
                <td className="px-3 py-3 text-center text-amber-600">{p.yellowCards || '—'}</td>
                <td className="px-3 py-3 text-center text-red-600">{p.redCards || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-600 mt-3">
        Stats taken from the most complete checkpoint per season (46G &gt; 35G &gt; 23G &gt; 10G) to avoid double-counting cumulative figures.
        Players who only appear in mid-season checkpoints are included using their most recent available data.
      </p>
    </div>
  )
}
