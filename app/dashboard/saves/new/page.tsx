'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FM_VERSIONS = ['FM26', 'FM25', 'FM24', 'FM23']

export default function NewSavePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    fmVersion: 'FM26',
    managerName: '',
    startingClub: '',
    currentClub: '',
    country: '',
    notes: '',
    philosophy: {
      preferredFormation: '',
      recruitmentStyle: '',
      maxNormalWagePw: '',
      maxKeyPlayerWagePw: '',
      longTermGoal: '',
    }
  })

  function update(field: string, value: string) {
    setForm((f: any) => ({ ...f, [field]: value }))
  }

  function updatePhilosophy(field: string, value: string) {
    setForm((f: any) => ({ ...f, philosophy: { ...f.philosophy, [field]: value } }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/saves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        currentClub: form.currentClub || form.startingClub,
        philosophy: {
          ...form.philosophy,
          maxNormalWagePw: form.philosophy.maxNormalWagePw ? Number(form.philosophy.maxNormalWagePw) : null,
          maxKeyPlayerWagePw: form.philosophy.maxKeyPlayerWagePw ? Number(form.philosophy.maxKeyPlayerWagePw) : null,
        }
      }),
    })

    if (res.ok) {
      const save = await res.json()
      router.push(`/dashboard/saves/${save.id}`)
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to create save')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Save</h1>
        <p className="text-gray-500 text-sm mt-1">Set up your FM save details.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Save Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Save name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="e.g. Dagenham Road to Glory"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">FM Version <span className="text-red-500">*</span></label>
              <select
                value={form.fmVersion}
                onChange={e => update('fmVersion', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FM_VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manager name</label>
              <input
                type="text"
                value={form.managerName}
                onChange={e => update('managerName', e.target.value)}
                placeholder="Your manager name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starting club <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={form.startingClub}
                onChange={e => update('startingClub', e.target.value)}
                placeholder="e.g. Dagenham & Redbridge"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={form.country}
                onChange={e => update('country', e.target.value)}
                placeholder="e.g. England"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="Any notes about this save..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Save Philosophy */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Save Philosophy <span className="text-xs font-normal text-gray-400">(optional — helps with recommendations)</span></h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred formation</label>
              <input
                type="text"
                value={form.philosophy.preferredFormation}
                onChange={e => updatePhilosophy('preferredFormation', e.target.value)}
                placeholder="e.g. 4-2-3-1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recruitment style</label>
              <select
                value={form.philosophy.recruitmentStyle}
                onChange={e => updatePhilosophy('recruitmentStyle', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select style</option>
                <option value="young_resale">Young with resale value</option>
                <option value="moneyball">Moneyball / attribute-focused</option>
                <option value="loan_heavy">Loan heavy</option>
                <option value="development">Youth development</option>
                <option value="promotion_push">Promotion push</option>
                <option value="financial_rebuild">Financial rebuild</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max normal wage (£/week)</label>
              <input
                type="number"
                value={form.philosophy.maxNormalWagePw}
                onChange={e => updatePhilosophy('maxNormalWagePw', e.target.value)}
                placeholder="e.g. 2000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max key player wage (£/week)</label>
              <input
                type="number"
                value={form.philosophy.maxKeyPlayerWagePw}
                onChange={e => updatePhilosophy('maxKeyPlayerWagePw', e.target.value)}
                placeholder="e.g. 4000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Long-term goal</label>
            <input
              type="text"
              value={form.philosophy.longTermGoal}
              onChange={e => updatePhilosophy('longTermGoal', e.target.value)}
              placeholder="e.g. Reach the Championship within 5 seasons"
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
            {loading ? 'Creating...' : 'Create Save'}
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
