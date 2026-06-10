'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const CONDITIONS = ['Excellent', 'Good', 'Average', 'Poor', 'Critical']

export default function MedicalPage() {
  const router = useRouter()
  const params = useParams()
  const { saveId, seasonId, checkpointId } = params as Record<string, string>
  const base = `/dashboard/saves/${saveId}/seasons/${seasonId}/checkpoints/${checkpointId}`

  const [form, setForm] = useState({
    totalInjuriesThisSeason: '',
    currentInjuries: '',
    overallSquadCondition: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(key: string, value: string) {
    setForm((f: any) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch(`/api/saves/${saveId}/seasons/${seasonId}/checkpoints/${checkpointId}/medical`, {
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
    <div className="max-w-xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href={base} className="hover:text-gray-700">Checkpoint</Link>
          <span>/</span>
          <span>Medical</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Medical Snapshot</h1>
        <p className="text-gray-500 text-sm mt-1">Record your squad's health status.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total injuries this season</label>
              <input
                type="number"
                value={form.totalInjuriesThisSeason}
                onChange={e => update('totalInjuriesThisSeason', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current injuries</label>
              <input
                type="number"
                value={form.currentInjuries}
                onChange={e => update('currentInjuries', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Overall squad condition</label>
            <select
              value={form.overallSquadCondition}
              onChange={e => update('overallSquadCondition', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select...</option>
              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              rows={3}
              placeholder="List injured players, return dates, fatigue concerns..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Medical'}
          </button>
          <Link href={base} className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
