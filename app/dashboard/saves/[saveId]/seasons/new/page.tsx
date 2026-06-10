'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

// English football pyramid + Scottish + generic fallback
const LEAGUE_OPTIONS = [
  { group: 'England', leagues: [
    'Premier League',
    'Championship',
    'League One',
    'League Two',
    'National League',
    'National League North',
    'National League South',
    'Northern Premier League Premier Division',
    'Northern Premier League East',
    'Northern Premier League West',
    'Southern League Premier Division Central',
    'Southern League Premier Division South',
    'Isthmian League Premier Division',
    'Isthmian League North',
    'Isthmian League South Central',
    'Isthmian League South East',
  ]},
  { group: 'Scotland', leagues: [
    'Scottish Premiership',
    'Scottish Championship',
    'Scottish League One',
    'Scottish League Two',
    'Highland Football League',
    'Lowland Football League',
  ]},
  { group: 'Wales', leagues: [
    'Cymru Premier',
    'Cymru North',
    'Cymru South',
  ]},
  { group: 'Other', leagues: [
    'Other / Custom',
  ]},
]

export default function NewSeasonPage() {
  const router = useRouter()
  const params = useParams()
  const saveId = params.saveId as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<Record<string, string>>({
    seasonLabel: '',
    clubName: '',
    leagueName: '',
    divisionLevel: '',
    boardExpectation: '',
    transferBudget: '',
    wageBudget: '',
    seasonObjective: '',
    tacticNotes: '',
    recruitmentPriorities: '',
    notes: '',
  })

  function update(field: string, value: string) {
    setForm((f: any) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch(`/api/saves/${saveId}/seasons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      const season = await res.json()
      router.push(`/dashboard/saves/${saveId}/seasons/${season.id}`)
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to create season')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard/saves" className="hover:text-gray-700">Saves</Link>
          <span>/</span>
          <Link href={`/dashboard/saves/${saveId}`} className="hover:text-gray-700">Save</Link>
          <span>/</span>
          <span>New Season</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">New Season</h1>
        <p className="text-gray-500 text-sm mt-1">Set up this season's details.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Season Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Season label <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={form.seasonLabel}
                onChange={e => update('seasonLabel', e.target.value)}
                placeholder="e.g. 2025/26"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Club <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={form.clubName}
                onChange={e => update('clubName', e.target.value)}
                placeholder="e.g. Dagenham & Redbridge"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">League <span className="text-red-500">*</span></label>
            <select
              required
              value={form.leagueName}
              onChange={e => {
                const val = e.target.value
                // Auto-fill division level for English pyramid
                const divMap: Record<string, string> = {
                  'Premier League': '1', 'Championship': '2', 'League One': '3',
                  'League Two': '4', 'National League': '5',
                  'National League North': '6', 'National League South': '6',
                  'Northern Premier League Premier Division': '7',
                  'Northern Premier League East': '8', 'Northern Premier League West': '8',
                  'Southern League Premier Division Central': '7', 'Southern League Premier Division South': '7',
                  'Isthmian League Premier Division': '7',
                  'Isthmian League North': '8', 'Isthmian League South Central': '8', 'Isthmian League South East': '8',
                  'Scottish Premiership': '1', 'Scottish Championship': '2',
                  'Scottish League One': '3', 'Scottish League Two': '4',
                }
                update('leagueName', val)
                if (divMap[val]) update('divisionLevel', divMap[val])
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select a league…</option>
              {LEAGUE_OPTIONS.map(group => (
                <optgroup key={group.group} label={group.group}>
                  {group.leagues.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {form.leagueName === 'Other / Custom' && (
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                placeholder="Enter league name…"
                onChange={e => update('leagueName', e.target.value || 'Other / Custom')}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Board expectation</label>
            <input
              type="text"
              value={form.boardExpectation}
              onChange={e => update('boardExpectation', e.target.value)}
              placeholder="e.g. Avoid relegation"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Season objective</label>
            <input
              type="text"
              value={form.seasonObjective}
              onChange={e => update('seasonObjective', e.target.value)}
              placeholder="e.g. Push for playoffs, develop youth players"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Budget */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Budget</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transfer budget (£)</label>
              <input
                type="number"
                value={form.transferBudget}
                onChange={e => update('transferBudget', e.target.value)}
                placeholder="e.g. 50000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wage budget (£/week)</label>
              <input
                type="number"
                value={form.wageBudget}
                onChange={e => update('wageBudget', e.target.value)}
                placeholder="e.g. 15000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Optional notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Notes <span className="text-xs font-normal text-gray-400">(optional)</span></h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tactic notes</label>
            <textarea
              value={form.tacticNotes}
              onChange={e => update('tacticNotes', e.target.value)}
              placeholder="e.g. Trying 4-3-3 with high press..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recruitment priorities</label>
            <textarea
              value={form.recruitmentPriorities}
              onChange={e => update('recruitmentPriorities', e.target.value)}
              placeholder="e.g. Need a striker and a right back on free transfers..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">General notes</label>
            <textarea
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="Anything else..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Season'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
