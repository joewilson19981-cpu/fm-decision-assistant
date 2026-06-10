'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type Row = {
  position: string; teamName: string; played: string; wins: string; draws: string
  losses: string; goalsFor: string; goalsAgainst: string; goalDiff: string
  points: string; form: string; isYourTeam: boolean
}

const emptyRow = (): Row => ({
  position: '', teamName: '', played: '', wins: '', draws: '', losses: '',
  goalsFor: '', goalsAgainst: '', goalDiff: '', points: '', form: '', isYourTeam: false,
})

export default function LeagueTablePage() {
  const router = useRouter()
  const params = useParams()
  const { saveId, seasonId, checkpointId } = params as Record<string, string>
  const base = `/dashboard/saves/${saveId}/seasons/${seasonId}/checkpoints/${checkpointId}`

  const [rows, setRows] = useState<Row[]>(Array.from({ length: 10 }, emptyRow))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updateRow(i: number, key: keyof Row, value: string | boolean) {
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, [key]: value } : r))
  }

  function addRow() {
    setRows(rs => [...rs, emptyRow()])
  }

  function removeRow(i: number) {
    setRows(rs => rs.filter((_, idx) => idx !== i))
  }

  function autoCalc(i: number, key: 'goalsFor' | 'goalsAgainst', value: string) {
    updateRow(i, key, value)
    const row = rows[i]
    const gf = key === 'goalsFor' ? Number(value) : Number(row.goalsFor)
    const ga = key === 'goalsAgainst' ? Number(value) : Number(row.goalsAgainst)
    if (!isNaN(gf) && !isNaN(ga)) {
      setRows(rs => rs.map((r, idx) => idx === i ? { ...r, [key]: value, goalDiff: String(gf - ga) } : r))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const validRows = rows.filter(r => r.teamName.trim() !== '')
    const res = await fetch(`/api/saves/${saveId}/seasons/${seasonId}/checkpoints/${checkpointId}/league-table`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: validRows }),
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
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href={base} className="hover:text-gray-700">Checkpoint</Link>
          <span>/</span>
          <span>League Table</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">League Table</h1>
        <p className="text-gray-500 text-sm mt-1">Enter the current league standings. Tick "Mine" for your team.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">#</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Team</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-10">P</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-10">W</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-10">D</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-10">L</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-10">GF</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-10">GA</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-10">GD</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-12">Pts</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-16">Form</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-12">Mine</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={`border-b border-gray-100 ${row.isYourTeam ? 'bg-blue-50' : ''}`}>
                  <td className="px-3 py-1.5">
                    <input type="number" value={row.position} onChange={e => updateRow(i, 'position', e.target.value)}
                      className="w-10 border border-gray-200 rounded px-1.5 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </td>
                  <td className="px-3 py-1.5">
                    <input type="text" value={row.teamName} onChange={e => updateRow(i, 'teamName', e.target.value)}
                      placeholder="Team name"
                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </td>
                  {(['played','wins','draws','losses'] as const).map(key => (
                    <td key={key} className="px-2 py-1.5">
                      <input type="number" value={row[key]} onChange={e => updateRow(i, key, e.target.value)}
                        className="w-10 border border-gray-200 rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </td>
                  ))}
                  <td className="px-2 py-1.5">
                    <input type="number" value={row.goalsFor} onChange={e => autoCalc(i, 'goalsFor', e.target.value)}
                      className="w-10 border border-gray-200 rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" value={row.goalsAgainst} onChange={e => autoCalc(i, 'goalsAgainst', e.target.value)}
                      className="w-10 border border-gray-200 rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" value={row.goalDiff} onChange={e => updateRow(i, 'goalDiff', e.target.value)}
                      className="w-10 border border-gray-200 rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" value={row.points} onChange={e => updateRow(i, 'points', e.target.value)}
                      className="w-12 border border-gray-200 rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="text" value={row.form} onChange={e => updateRow(i, 'form', e.target.value)}
                      placeholder="WWDLL"
                      className="w-16 border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <input type="checkbox" checked={row.isYourTeam} onChange={e => updateRow(i, 'isYourTeam', e.target.checked)}
                      className="w-4 h-4 accent-blue-600" />
                  </td>
                  <td className="px-1 py-1.5">
                    <button type="button" onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-400 text-xs px-1">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="button" onClick={addRow} className="text-sm text-blue-600 hover:underline mb-6">+ Add row</button>

        {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Table'}
          </button>
          <Link href={base} className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
