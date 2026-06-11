'use client'

import { useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Suggestion = {
  category: 'Attacking' | 'Defensive' | string
  instruction: string
  from: string | null
  to: string
  reason: string
  source: string
}

type Analysis = {
  formation: string | null
  mentality: string | null
  // Attacking sliders
  attackingTransition: string | null
  buildUpStrategy: string | null
  creativeFreedom: string | null
  crossingStyle: string | null
  dribbling: string | null
  gkDistribution: string | null
  gkDistributionSpeed: string | null
  goalKicks: string | null
  passReception: string | null
  passingDirectness: string | null
  patience: string | null
  playForSetPieces: string | null
  progressThrough: string | null
  shotsFromDistance: string | null
  overlap: string | null
  underlap: string | null
  tempo: string | null
  timeWasting: string | null
  // Defensive sliders
  crossEngagement: string | null
  defensiveLine: string | null
  defensiveLineBehaviour: string | null
  defensiveTransition: string | null
  lineOfEngagement: string | null
  pressingTrap: string | null
  shortGkDistribution: string | null
  triggerPress: string | null
  // AI output
  overallAnalysis: string
  suggestions: Suggestion[]
  researchSources: string[]
}

const ATTACKING_FIELDS: { key: keyof Analysis; label: string }[] = [
  { key: 'tempo',               label: 'Tempo' },
  { key: 'passingDirectness',   label: 'Passing Directness' },
  { key: 'passReception',       label: 'Pass Reception' },
  { key: 'attackingTransition', label: 'Attacking Transition' },
  { key: 'buildUpStrategy',     label: 'Build-Up Strategy' },
  { key: 'creativeFreedom',     label: 'Creative Freedom' },
  { key: 'patience',            label: 'Patience' },
  { key: 'progressThrough',     label: 'Progress Through' },
  { key: 'dribbling',           label: 'Dribbling' },
  { key: 'crossingStyle',       label: 'Crossing Style' },
  { key: 'overlap',             label: 'Overlap' },
  { key: 'underlap',            label: 'Underlap' },
  { key: 'shotsFromDistance',   label: 'Shots from Distance' },
  { key: 'playForSetPieces',    label: 'Play for Set Pieces' },
  { key: 'gkDistribution',      label: 'GK Distribution' },
  { key: 'gkDistributionSpeed', label: 'GK Distribution Speed' },
  { key: 'goalKicks',           label: 'Goal Kicks' },
  { key: 'timeWasting',         label: 'Time Wasting' },
]

const DEFENSIVE_FIELDS: { key: keyof Analysis; label: string }[] = [
  { key: 'lineOfEngagement',       label: 'Line of Engagement' },
  { key: 'defensiveLine',          label: 'Defensive Line' },
  { key: 'defensiveLineBehaviour', label: 'Defensive Line Behaviour' },
  { key: 'defensiveTransition',    label: 'Defensive Transition' },
  { key: 'triggerPress',           label: 'Trigger Press' },
  { key: 'pressingTrap',           label: 'Pressing Trap' },
  { key: 'crossEngagement',        label: 'Cross Engagement' },
  { key: 'shortGkDistribution',    label: 'Short GK Distribution' },
]

const SOURCE_CHIP: Record<string, string> = {
  'FMScout':              'bg-blue-100 text-blue-700',
  'Passion4FM':           'bg-purple-100 text-purple-700',
  'FM-Base':              'bg-green-100 text-green-700',
  'FM26 tactical theory (no external source)': ' text-zinc-400',
}

export default function TacticLabPage() {
  const params = useParams()
  const { saveId, seasonId, checkpointId } = params as Record<string, string>
  const base = `/dashboard/saves/${saveId}/seasons/${seasonId}/checkpoints/${checkpointId}`

  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'done' | 'error'>('idle')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setPreview(URL.createObjectURL(file))
    setStatus('analyzing')
    setError('')
    setAnalysis(null)

    try {
      const imageBase64 = await toBase64(file)
      const res = await fetch('/api/ai/analyze-tactic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType: file.type || 'image/png', checkpointId, saveId, seasonId }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Analysis failed')
      }
      const { analysis: data } = await res.json()
      setAnalysis(data)
      setStatus('done')
    } catch (err: any) {
      setError(err.message || 'Analysis failed')
      setStatus('error')
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
          <Link href={base} className="hover:text-zinc-300">Checkpoint</Link>
          <span>/</span>
          <span>Tactic Lab</span>
        </div>
        <h1 className="text-2xl font-bold text-white">🎮 Tactic Lab</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Upload your FM26 tactic screenshot. The AI reads your current setup, checks FM community sources, and suggests improvements using exact FM26 instruction names.
        </p>
      </div>

      {/* Upload area */}
      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => status !== 'analyzing' && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-all ${
          status === 'analyzing'
            ? 'border-purple-300 bg-purple-50 cursor-wait'
            : 'border-slate-300 bg-slate-50/50 cursor-pointer hover:border-slate-500 hover:bg-slate-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
        />

        {status === 'analyzing' ? (
          <div>
            <div className="text-4xl mb-3 animate-pulse">🔍</div>
            <p className="text-sm font-semibold text-purple-800">Analysing your tactic...</p>
            <p className="text-xs text-purple-500 mt-1">Reading instructions · Fetching FM community research · Generating suggestions</p>
          </div>
        ) : preview ? (
          <div className="flex flex-col items-center gap-3">
            <img src={preview} alt="Tactic screenshot" className="max-h-48 rounded-lg border border-white/[0.06]" />
            <p className="text-xs text-zinc-600">Click or drop a new screenshot to re-analyse</p>
          </div>
        ) : (
          <div>
            <div className="text-5xl mb-3">🎮</div>
            <p className="text-sm font-semibold text-zinc-300">Drop your FM26 tactic screenshot here</p>
            <p className="text-xs text-zinc-600 mt-1">Works best with the main tactic screen showing your formation and instructions panel</p>
            <p className="text-xs text-zinc-600 mt-0.5">PNG, JPG, WebP</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-600">{error}</div>
      )}

      {/* Analysis results */}
      {analysis && status === 'done' && (
        <div className="space-y-5">

          {/* Formation + Mentality hero */}
          <div className="rounded-xl card-panel border border-white/[0.06] p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-4">Current Setup</p>

            <div className="flex items-center gap-5 mb-5">
              <div className="text-center">
                <p className="text-4xl font-black text-white">{analysis.formation || '—'}</p>
                <p className="text-xs text-zinc-600 mt-0.5">Formation</p>
              </div>
              <div className="text-gray-200 text-2xl">|</div>
              <div>
                <p className="text-xl font-bold text-white">{analysis.mentality || '—'}</p>
                <p className="text-xs text-zinc-600">Mentality</p>
              </div>
            </div>

            {/* Attacking sliders */}
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-2">⚽ Attacking</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                {ATTACKING_FIELDS.filter(f => analysis[f.key] != null).map(f => (
                  <div key={f.key} className="flex items-baseline justify-between gap-2 min-w-0">
                    <span className="text-xs text-zinc-600 shrink-0">{f.label}</span>
                    <span className="text-xs font-semibold text-white text-right truncate">{String(analysis[f.key])}</span>
                  </div>
                ))}
                {ATTACKING_FIELDS.every(f => analysis[f.key] == null) && (
                  <p className="text-xs text-zinc-600 italic col-span-3">No attacking instructions visible</p>
                )}
              </div>
            </div>

            {/* Defensive sliders */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-2">🛡️ Defensive</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                {DEFENSIVE_FIELDS.filter(f => analysis[f.key] != null).map(f => (
                  <div key={f.key} className="flex items-baseline justify-between gap-2 min-w-0">
                    <span className="text-xs text-zinc-600 shrink-0">{f.label}</span>
                    <span className="text-xs font-semibold text-white text-right truncate">{String(analysis[f.key])}</span>
                  </div>
                ))}
                {DEFENSIVE_FIELDS.every(f => analysis[f.key] == null) && (
                  <p className="text-xs text-zinc-600 italic col-span-3">No defensive instructions visible</p>
                )}
              </div>
            </div>
          </div>

          {/* Research sources badge */}
          {analysis.researchSources?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-zinc-600">Suggestions grounded by:</span>
              {analysis.researchSources.map(src => (
                <span key={src} className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_CHIP[src] ?? ' text-zinc-400'}`}>
                  {src}
                </span>
              ))}
            </div>
          )}

          {/* Overall analysis */}
          {analysis.overallAnalysis && (
            <div className="bg-slate-800 rounded-xl p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">AI Analysis</p>
              <p className="text-sm text-slate-200 leading-relaxed">{analysis.overallAnalysis}</p>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions?.length > 0 && (
            <div>
              <p className="font-bold text-white mb-3">
                Suggested changes
                <span className="text-xs font-normal text-zinc-600 ml-2">— exact FM26 instruction names</span>
              </p>
              <div className="space-y-3">
                {analysis.suggestions.map((s, i) => {
                  const isAttacking = s.category === 'Attacking'
                  const cardCls = isAttacking
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                  const icon = isAttacking ? '⚽' : '🛡️'

                  return (
                    <div key={i} className={`rounded-xl border p-4 ${cardCls}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-lg shrink-0 mt-0.5">{icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wide opacity-60">{s.category}</span>
                            <code className="text-xs font-bold card-panel/70 px-2 py-0.5 rounded border border-black/10">
                              {s.instruction}
                            </code>
                          </div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap text-sm">
                            {s.from && (
                              <>
                                <span className="font-semibold opacity-60 line-through">{s.from}</span>
                                <span className="opacity-40">→</span>
                              </>
                            )}
                            <span className="font-bold">{s.to}</span>
                          </div>
                          <p className="text-sm opacity-80 mb-2">{s.reason}</p>
                          {s.source && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_CHIP[s.source] ?? ' text-zinc-400'}`}>
                              {s.source}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="pt-2">
            <p className="text-xs text-zinc-600">
              Instruction names match the exact FM26 in-game options. Always verify against your own in-game setup before making changes.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
