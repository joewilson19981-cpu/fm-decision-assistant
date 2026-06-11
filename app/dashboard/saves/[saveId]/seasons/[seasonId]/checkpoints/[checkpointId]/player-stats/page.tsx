'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type PlayerRow = {
  name: string; position: string; age: string; appearances: string; goals: string
  assists: string; cleanSheets: string; avgRating: string; yellowCards: string
  redCards: string; wage: string; contractExpiry: string; morale: string
}

const emptyPlayer = (): PlayerRow => ({
  name: '', position: '', age: '', appearances: '', goals: '', assists: '',
  cleanSheets: '', avgRating: '', yellowCards: '', redCards: '',
  wage: '', contractExpiry: '', morale: '',
})

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST']
const MORALE = ['Superb', 'Good', 'Okay', 'Poor', 'Very Poor']

export default function PlayerStatsPage() {
  const router = useRouter()
  const params = useParams()
  const { saveId, seasonId, checkpointId } = params as Record<string, string>
  const base = `/dashboard/saves/${saveId}/seasons/${seasonId}/checkpoints/${checkpointId}`

  const [players, setPlayers] = useState<PlayerRow[]>(Array.from({ length: 5 }, emptyPlayer))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updatePlayer(i: number, key: keyof PlayerRow, value: string) {
    setPlayers(ps => ps.map((p, idx) => idx === i ? { ...p, [key]: value } : p))
  }

  function addPlayer() {
    setPlayers(ps => [...ps, emptyPlayer()])
  }

  function removePlayer(i: number) {
    setPlayers(ps => ps.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const validPlayers = players.filter(p => p.name.trim() !== '')
    if (validPlayers.length === 0) {
      setError('Add at least one player')
      setLoading(false)
      return
    }

    const res = await fetch(`/api/saves/${saveId}/seasons/${seasonId}/checkpoints/${checkpointId}/player-stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ players: validPlayers }),
    })
    if (res.ok) {
      router.push(base)
    } else {
      setError('Failed to save')
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
          <Link href={base} className="hover:text-zinc-300">Checkpoint</Link>
          <span>/</span>
          <span>Player Stats</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Player Stats</h1>
        <p className="text-zinc-500 text-sm mt-1">Enter stats for each player. Leave blank anything you don't have.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mb-4">
          {players.map((player, i) => (
            <div key={i} className="rounded-xl card-panel border border-white/[0.06] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-500 uppercase">Player {i + 1}</span>
                <button type="button" onClick={() => removePlayer(i)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Name *</label>
                  <input type="text" value={player.name} onChange={e => updatePlayer(i, 'name', e.target.value)}
                    placeholder="Player name"
                    className="w-full border border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Position</label>
                  <select value={player.position} onChange={e => updatePlayer(i, 'position', e.target.value)}
                    className="w-full border border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20">
                    <option value="">—</option>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Age</label>
                  <input type="number" value={player.age} onChange={e => updatePlayer(i, 'age', e.target.value)}
                    className="w-full border border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20" />
                </div>
                {[
                  { key: 'appearances', label: 'Apps' },
                  { key: 'goals', label: 'Goals' },
                  { key: 'assists', label: 'Assists' },
                  { key: 'cleanSheets', label: 'CS' },
                  { key: 'avgRating', label: 'Avg Rating' },
                  { key: 'yellowCards', label: 'Yellows' },
                  { key: 'redCards', label: 'Reds' },
                  { key: 'wage', label: 'Wage (£/wk)' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">{label}</label>
                    <input type="number" step={key === 'avgRating' ? '0.1' : '1'}
                      value={player[key as keyof PlayerRow]}
                      onChange={e => updatePlayer(i, key as keyof PlayerRow, e.target.value)}
                      className="w-full border border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Contract expiry</label>
                  <input type="date" value={player.contractExpiry} onChange={e => updatePlayer(i, 'contractExpiry', e.target.value)}
                    className="w-full border border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Morale</label>
                  <select value={player.morale} onChange={e => updatePlayer(i, 'morale', e.target.value)}
                    className="w-full border border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20">
                    <option value="">—</option>
                    {MORALE.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={addPlayer} className="text-sm text-white hover:opacity-70 mb-6">+ Add player</button>

        {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-white text-black px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Player Stats'}
          </button>
          <Link href={base} className="border border-white/10 text-zinc-300 px-5 py-2 rounded-lg text-sm font-medium hover:">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
