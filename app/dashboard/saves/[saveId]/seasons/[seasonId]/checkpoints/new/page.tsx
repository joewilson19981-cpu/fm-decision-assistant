'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const CHECKPOINT_TYPES = [
  { value: 'pre_season', label: 'Pre-season' },
  { value: 'transfer_window', label: 'Transfer window' },
  { value: 'mid_season', label: 'Mid-season' },
  { value: 'end_of_season', label: 'End of season' },
  { value: 'custom', label: 'Custom' },
]


export default function NewCheckpointPage() {
  const router = useRouter()
  const params = useParams()
  const saveId = params.saveId as string
  const seasonId = params.seasonId as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<Record<string, string>>({
    checkpointType: 'mid_season',
    notes: '',
  })

  function update(field: string, value: string) {
    setForm((f: any) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch(`/api/saves/${saveId}/seasons/${seasonId}/checkpoints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      const checkpoint = await res.json()
      router.push(`/dashboard/saves/${saveId}/seasons/${seasonId}/checkpoints/${checkpoint.id}`)
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to create checkpoint')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href={`/dashboard/saves/${saveId}`} className="hover:text-gray-700">Save</Link>
          <span>/</span>
          <Link href={`/dashboard/saves/${saveId}/seasons/${seasonId}`} className="hover:text-gray-700">Season</Link>
          <span>/</span>
          <span>New Checkpoint</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">New Checkpoint</h1>
        <p className="text-gray-500 text-sm mt-1">Capture a snapshot of where your save is right now.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Checkpoint Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
            <select
              value={form.checkpointType}
              onChange={e => update('checkpointType', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CHECKPOINT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="Anything notable at this point in the season..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
            🤖 Games played, in-game date, calendar phase and transfer window will be read automatically from your screenshots after you create this checkpoint.
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
            {loading ? 'Creating...' : 'Create Checkpoint'}
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
