'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type Field = { key: string; label: string; type?: 'float' }

const FIELDS: Field[] = [
  { key: 'leaguePosition', label: 'League position' },
  { key: 'played', label: 'Played' },
  { key: 'wins', label: 'Wins' },
  { key: 'draws', label: 'Draws' },
  { key: 'losses', label: 'Losses' },
  { key: 'points', label: 'Points' },
  { key: 'goalsFor', label: 'Goals for' },
  { key: 'goalsAgainst', label: 'Goals against' },
  { key: 'goalDiff', label: 'Goal difference' },
  { key: 'cleanSheets', label: 'Clean sheets' },
  { key: 'xg', label: 'xG', type: 'float' },
  { key: 'xga', label: 'xGA', type: 'float' },
  { key: 'possession', label: 'Possession %', type: 'float' },
  { key: 'shotsPerGame', label: 'Shots per game', type: 'float' },
  { key: 'passCompletion', label: 'Pass completion %', type: 'float' },
  { key: 'clearCutChancesFor', label: 'Clear-cut chances for' },
  { key: 'clearCutChancesAgainst', label: 'Clear-cut chances against' },
  { key: 'setPieceGoalsFor', label: 'Set piece goals for' },
  { key: 'setPieceGoalsAgainst', label: 'Set piece goals against' },
  { key: 'crossAssistsFor', label: 'Cross assists for' },
  { key: 'crossAssistsAgainst', label: 'Cross assists against' },
]

const empty = Object.fromEntries(FIELDS.map(f => [f.key, '']))

export default function TeamStatsPage() {
  const router = useRouter()
  const params = useParams()
  const { saveId, seasonId, checkpointId } = params as Record<string, string>
  const base = `/dashboard/saves/${saveId}/seasons/${seasonId}/checkpoints/${checkpointId}`

  const [form, setForm] = useState({ ...empty, notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auto-calculate goal diff
  useEffect(() => {
    const gf = Number(form.goalsFor)
    const ga = Number(form.goalsAgainst)
    if (form.goalsFor !== '' && form.goalsAgainst !== '') {
      setForm((f: any) => ({ ...f, goalDiff: String(gf - ga) }))
    }
  }, [form.goalsFor, form.goalsAgainst])

  function update(key: string, value: string) {
    setForm((f: any) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch(`/api/saves/${saveId}/seasons/${seasonId}/checkpoints/${checkpointId}/team-stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      router.push(base)
    } else {
      setError('Failed to save')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href={base} className="hover:text-gray-700">Checkpoint</Link>
          <span>/</span>
          <span>Team Stats</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Team Stats</h1>
        <p className="text-gray-500 text-sm mt-1">Enter your team's current league stats. Leave blank anything you don't have.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* League table stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">League Position</h2>
          <div className="grid grid-cols-3 gap-3">
            {['leaguePosition', 'played', 'wins', 'draws', 'losses', 'points', 'goalsFor', 'goalsAgainst', 'goalDiff', 'cleanSheets'].map(key => {
              const field = FIELDS.find(f => f.key === key)!
              return (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                  <input
                    type="number"
                    step={field.type === 'float' ? '0.01' : '1'}
                    value={form[key as keyof typeof form]}
                    onChange={e => update(key, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Performance metrics */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Performance Metrics</h2>
          <div className="grid grid-cols-3 gap-3">
            {['xg', 'xga', 'possession', 'shotsPerGame', 'passCompletion', 'clearCutChancesFor', 'clearCutChancesAgainst', 'setPieceGoalsFor', 'setPieceGoalsAgainst', 'crossAssistsFor', 'crossAssistsAgainst'].map(key => {
              const field = FIELDS.find(f => f.key === key)!
              return (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                  <input
                    type="number"
                    step={field.type === 'float' ? '0.01' : '1'}
                    value={form[key as keyof typeof form]}
                    onChange={e => update(key, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            rows={2}
            placeholder="Any observations..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Stats'}
          </button>
          <Link href={base} className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
