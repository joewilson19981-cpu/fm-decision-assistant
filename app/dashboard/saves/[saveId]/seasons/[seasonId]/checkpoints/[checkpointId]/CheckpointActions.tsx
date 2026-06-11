'use client'

import { useState } from 'react'

const VERDICT_STYLES: Record<string, { bg: string; text: string; badge: string }> = {
  flying:     { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-500 text-white' },
  solid:      { bg: 'bg-blue-50 border-blue-200',       text: 'text-blue-800',    badge: 'bg-white text-black' },
  mixed:      { bg: 'bg-yellow-50 border-yellow-200',   text: 'text-yellow-800',  badge: 'bg-yellow-500 text-white' },
  concerning: { bg: 'bg-orange-50 border-orange-200',   text: 'text-orange-800',  badge: 'bg-orange-500 text-white' },
  crisis:     { bg: 'bg-red-50 border-red-200',         text: 'text-red-800',     badge: 'bg-red-500 text-white' },
}

type Props = {
  checkpointId: string
  saveId: string
  seasonId: string
  existingDebrief: string | null
}

export default function CheckpointActions({ checkpointId, saveId, seasonId, existingDebrief }: Props) {
  const initial = existingDebrief ? (() => { try { return JSON.parse(existingDebrief) } catch { return null } })() : null
  const [debrief, setDebrief] = useState<any>(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(!!initial)

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/generate-debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkpointId, saveId, seasonId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to generate debrief')
      }
      const { debrief: d } = await res.json()
      setDebrief(d)
      setExpanded(true)
    } catch (err: any) {
      setError(err.message || 'Failed to generate debrief')
    }
    setLoading(false)
  }

  const style = debrief ? (VERDICT_STYLES[debrief.verdict] ?? VERDICT_STYLES.mixed) : null

  return (
    <div className="mb-6">
      {!debrief ? (
        <div className="rounded-xl card-panel border border-white/[0.06] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">📋 AI Debrief</p>
              <p className="text-xs text-zinc-600 mt-0.5">Get an honest analysis of where things stand — what&apos;s working, what&apos;s not, and what to focus on next</p>
            </div>
            <button
              onClick={generate}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2 shrink-0 ml-4"
            >
              {loading ? <><span className="animate-spin inline-block">⟳</span> Generating...</> : 'Generate Debrief'}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      ) : (
        <div className={`rounded-xl border ${style!.bg}`}>
          {/* Header row */}
          <div className="flex items-start justify-between p-5 cursor-pointer" onClick={() => setExpanded(e => !e)}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${style!.badge}`}>
                  {debrief.verdict}
                </span>
                {debrief.rating != null && (
                  <span className={`text-sm font-bold ${style!.text}`}>{debrief.rating}/10</span>
                )}
              </div>
              <p className={`font-bold text-base ${style!.text}`}>{debrief.headline}</p>
            </div>
            <div className="flex items-center gap-2 ml-3 shrink-0">
              <button
                onClick={e => { e.stopPropagation(); generate() }}
                disabled={loading}
                className="text-xs text-zinc-500 hover:text-zinc-300 border border-white/10 rounded-lg px-2.5 py-1 card-panel/60 hover:card-panel disabled:opacity-50"
              >
                {loading ? '⟳' : '↻ Regenerate'}
              </button>
              <span className={`text-sm ${style!.text}`}>{expanded ? '▲' : '▼'}</span>
            </div>
          </div>

          {expanded && (
            <div className="px-5 pb-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {debrief.positives?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-2">✅ What&apos;s working</p>
                    <ul className="space-y-1.5">
                      {debrief.positives.map((p: string, i: number) => (
                        <li key={i} className="text-sm text-zinc-300 flex gap-2">
                          <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {debrief.concerns?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-2">⚠️ Areas of concern</p>
                    <ul className="space-y-1.5">
                      {debrief.concerns.map((c: string, i: number) => (
                        <li key={i} className="text-sm text-zinc-300 flex gap-2">
                          <span className="text-amber-500 shrink-0 mt-0.5">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {(debrief.squadNote || debrief.financialNote) && (
                <div className="flex flex-wrap gap-3">
                  {debrief.squadNote && (
                    <div className="card-panel/60 rounded-lg px-3 py-2.5 text-sm text-zinc-300 flex-1 min-w-[200px]">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 block mb-0.5">🏥 Squad</span>
                      {debrief.squadNote}
                    </div>
                  )}
                  {debrief.financialNote && (
                    <div className="card-panel/60 rounded-lg px-3 py-2.5 text-sm text-zinc-300 flex-1 min-w-[200px]">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 block mb-0.5">💰 Finances</span>
                      {debrief.financialNote}
                    </div>
                  )}
                </div>
              )}

              {debrief.lookingAhead && (
                <div className="card-panel/70 rounded-lg px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">🔭 Looking ahead</p>
                  <p className="text-sm text-zinc-300">{debrief.lookingAhead}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
