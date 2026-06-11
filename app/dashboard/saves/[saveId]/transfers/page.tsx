'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type ImageItem = {
  file: File
  base64: string
  preview: string
  label: 'transfer_offer' | 'player_profile' | 'club_finances' | 'other'
}

type KeyFactor = {
  factor: string
  sentiment: 'positive' | 'negative' | 'neutral'
  detail: string
}

type AnalysisResult = {
  extracted: Record<string, any>
  verdict: 'Accept' | 'Reject' | 'Negotiate'
  confidence: 'High' | 'Medium' | 'Low'
  reasoning: string
  keyFactors: KeyFactor[]
  negotiationAdvice: string | null
  reinvestmentSuggestion: string | null
  contextCheckpointId: string | null
}

type TransferDecision = {
  id: string
  playerName: string
  playerAge: number | null
  playerPosition: string | null
  buyingClub: string | null
  offerAmount: number | null
  offerCurrency: string | null
  aiVerdict: string | null
  aiConfidence: string | null
  aiReasoning: string | null
  aiKeyFactors: KeyFactor[] | null
  userDecision: string | null
  finalFee: number | null
  decisionNotes: string | null
  createdAt: string
}

const LABEL_OPTIONS = [
  { value: 'transfer_offer', label: 'Transfer Offer' },
  { value: 'player_profile', label: 'Player Profile' },
  { value: 'club_finances', label: 'Club Finances' },
  { value: 'other', label: 'Other' },
] as const

const VERDICT_STYLE: Record<string, string> = {
  Accept: 'bg-green-100 border-green-300 text-green-800',
  Reject: 'bg-red-100 border-red-300 text-red-800',
  Negotiate: 'bg-amber-100 border-amber-300 text-amber-800',
}

const VERDICT_EMOJI: Record<string, string> = {
  Accept: '✅',
  Reject: '❌',
  Negotiate: '🤝',
}

const DECISION_OPTIONS = ['Accepted', 'Rejected', 'Negotiated', 'Pending']

function formatFee(amount: number | null, currency: string | null) {
  if (!amount) return '—'
  const c = currency || '£'
  if (amount >= 1e6) return `${c}${(amount / 1e6).toFixed(1)}M`
  if (amount >= 1e3) return `${c}${(amount / 1e3).toFixed(0)}K`
  return `${c}${amount}`
}

export default function TransferAdvisorPage() {
  const params = useParams()
  const { saveId } = params as Record<string, string>

  const [images, setImages] = useState<ImageItem[]>([])
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'done' | 'error'>('idle')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [userDecision, setUserDecision] = useState('Pending')
  const [finalFee, setFinalFee] = useState('')
  const [decisionNotes, setDecisionNotes] = useState('')
  const [history, setHistory] = useState<TransferDecision[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/saves/${saveId}/transfers`)
      .then(r => r.json())
      .then(data => { setHistory(Array.isArray(data) ? data : []); setLoadingHistory(false) })
      .catch(() => setLoadingHistory(false))
  }, [saveId])

  const toBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const reader = new FileReader()
      reader.onload = () => res((reader.result as string).split(',')[1])
      reader.onerror = rej
      reader.readAsDataURL(file)
    })

  async function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    const items: ImageItem[] = await Promise.all(
      arr.map(async f => ({
        file: f,
        base64: await toBase64(f),
        preview: URL.createObjectURL(f),
        label: 'transfer_offer' as const,
      }))
    )
    setImages(prev => [...prev, ...items])
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }, [])

  function removeImage(idx: number) {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  function updateLabel(idx: number, label: ImageItem['label']) {
    setImages(prev => prev.map((img, i) => i === idx ? { ...img, label } : img))
  }

  async function handleAnalyze() {
    if (images.length === 0) return
    setStatus('analyzing')
    setError('')
    setAnalysis(null)
    setSavedId(null)

    try {
      const res = await fetch('/api/ai/analyze-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saveId,
          images: images.map(img => ({ base64: img.base64, mimeType: img.file.type || 'image/png', label: img.label })),
        }),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        throw new Error(b.error || 'Analysis failed')
      }
      const data = await res.json()
      setAnalysis(data)
      setStatus('done')
    } catch (err: any) {
      setError(err.message || 'Analysis failed')
      setStatus('error')
    }
  }

  async function handleSave() {
    if (!analysis) return
    setSaving(true)
    const ex = analysis.extracted
    const res = await fetch(`/api/saves/${saveId}/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: ex.playerName || 'Unknown Player',
        playerAge: ex.playerAge,
        playerPosition: ex.playerPosition,
        buyingClub: ex.buyingClub,
        offerAmount: ex.offerAmount,
        offerCurrency: ex.offerCurrency || '£',
        aiVerdict: analysis.verdict,
        aiConfidence: analysis.confidence,
        aiReasoning: analysis.reasoning,
        aiKeyFactors: analysis.keyFactors,
        userDecision,
        finalFee: finalFee || null,
        decisionNotes,
        contextCheckpointId: analysis.contextCheckpointId,
      }),
    })
    if (res.ok) {
      const saved = await res.json()
      setSavedId(saved.id)
      setHistory(prev => [saved, ...prev])
    }
    setSaving(false)
  }

  async function updateDecision(id: string, patch: Record<string, any>) {
    await fetch(`/api/saves/${saveId}/transfers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setHistory(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  }

  async function deleteDecision(id: string) {
    if (!confirm('Delete this transfer decision?')) return
    await fetch(`/api/saves/${saveId}/transfers/${id}`, { method: 'DELETE' })
    setHistory(prev => prev.filter(t => t.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  function reset() {
    setImages([])
    setStatus('idle')
    setAnalysis(null)
    setError('')
    setSavedId(null)
    setUserDecision('Pending')
    setFinalFee('')
    setDecisionNotes('')
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href={`/dashboard/saves/${saveId}`} className="hover:text-gray-700">Save</Link>
          <span>/</span>
          <span>Transfer Advisor</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">💸 Transfer Advisor</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload transfer offer screenshots. The AI analyses the offer against your save context and advises whether to accept, reject, or negotiate.
        </p>
      </div>

      {/* Upload & Analyse */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">New Transfer Offer</h2>

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => images.length === 0 && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center mb-4 transition-all ${
            images.length === 0 ? 'cursor-pointer border-slate-300 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30' : 'border-slate-200 bg-slate-50/30'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => { if (e.target.files) addFiles(e.target.files) }}
          />
          {images.length === 0 ? (
            <div>
              <div className="text-4xl mb-2">📸</div>
              <p className="text-sm font-semibold text-gray-700">Drop screenshots here or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">Transfer offer · Player profile · Club finances — upload as many as needed</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img.preview} alt="" className="w-full h-28 object-cover rounded-lg border border-gray-200" />
                    <button
                      onClick={e => { e.stopPropagation(); removeImage(i) }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >×</button>
                    <select
                      value={img.label}
                      onChange={e => { e.stopPropagation(); updateLabel(i, e.target.value as ImageItem['label']) }}
                      onClick={e => e.stopPropagation()}
                      className="absolute bottom-1 left-1 right-1 text-xs bg-black/60 text-white border-0 rounded px-1 py-0.5 cursor-pointer"
                    >
                      {LABEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                ))}
                <button
                  onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
                  className="h-28 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all text-xs"
                >
                  <span className="text-2xl">+</span>
                  <span>Add more</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {images.length > 0 && status !== 'analyzing' && (
          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Analyse Offer
            </button>
            <button onClick={reset} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
              Clear
            </button>
          </div>
        )}

        {status === 'analyzing' && (
          <div className="flex items-center gap-3 py-4">
            <div className="text-2xl animate-pulse">🔍</div>
            <div>
              <p className="text-sm font-semibold text-purple-800">Analysing transfer offer...</p>
              <p className="text-xs text-purple-500 mt-0.5">Reading screenshots · Checking squad context · Generating verdict</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3 text-sm text-red-600">{error}</div>
        )}
      </div>

      {/* Analysis Result */}
      {analysis && status === 'done' && (
        <div className="space-y-4 mb-6">
          {/* Verdict hero */}
          <div className={`rounded-xl border-2 p-5 ${VERDICT_STYLE[analysis.verdict] || 'bg-gray-100 border-gray-300 text-gray-800'}`}>
            <div className="flex items-start gap-4">
              <div className="text-5xl">{VERDICT_EMOJI[analysis.verdict]}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="text-2xl font-black">{analysis.verdict}</span>
                  <span className="text-sm font-medium opacity-70">{analysis.confidence} confidence</span>
                </div>
                {analysis.extracted.playerName && (
                  <p className="text-sm font-semibold opacity-80 mb-2">
                    {analysis.extracted.playerName}
                    {analysis.extracted.playerAge ? `, age ${analysis.extracted.playerAge}` : ''}
                    {analysis.extracted.playerPosition ? ` · ${analysis.extracted.playerPosition}` : ''}
                    {analysis.extracted.buyingClub ? ` — offer from ${analysis.extracted.buyingClub}` : ''}
                    {analysis.extracted.offerAmount ? ` for ${formatFee(analysis.extracted.offerAmount, analysis.extracted.offerCurrency)}` : ''}
                  </p>
                )}
                <p className="text-sm leading-relaxed">{analysis.reasoning}</p>
              </div>
            </div>
          </div>

          {/* Key factors */}
          {analysis.keyFactors.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Key Factors</p>
              <div className="space-y-2">
                {analysis.keyFactors.map((kf, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-sm mt-0.5 shrink-0">
                      {kf.sentiment === 'positive' ? '✅' : kf.sentiment === 'negative' ? '❌' : '⚖️'}
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-gray-800">{kf.factor}: </span>
                      <span className="text-sm text-gray-600">{kf.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Negotiation / reinvestment advice */}
          {(analysis.negotiationAdvice || analysis.reinvestmentSuggestion) && (
            <div className="bg-slate-800 rounded-xl p-4 text-white">
              {analysis.negotiationAdvice && (
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Negotiation Advice</p>
                  <p className="text-sm text-slate-200">{analysis.negotiationAdvice}</p>
                </div>
              )}
              {analysis.reinvestmentSuggestion && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Reinvestment Suggestion</p>
                  <p className="text-sm text-slate-200">{analysis.reinvestmentSuggestion}</p>
                </div>
              )}
            </div>
          )}

          {/* Record Decision */}
          {!savedId ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Record Your Decision</h3>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Your decision</label>
                  <select
                    value={userDecision}
                    onChange={e => setUserDecision(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DECISION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Final fee (if sold)</label>
                  <input
                    type="number"
                    value={finalFee}
                    onChange={e => setFinalFee(e.target.value)}
                    placeholder="e.g. 5000000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  value={decisionNotes}
                  onChange={e => setDecisionNotes(e.target.value)}
                  rows={2}
                  placeholder="Why you made this decision..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save to History'}
                </button>
                <button onClick={reset} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Start New
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
              <p className="text-sm text-green-700 font-medium">✅ Decision saved to history</p>
              <button onClick={reset} className="text-sm text-blue-600 hover:underline">Analyse another offer →</button>
            </div>
          )}
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">Transfer History</h2>
        {loadingHistory ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : history.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm text-gray-500">No transfer decisions recorded yet. Analyse your first offer above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(t => {
              const isExpanded = expandedId === t.id
              const kf = t.aiKeyFactors as KeyFactor[] | null
              return (
                <div key={t.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedId(isExpanded ? null : t.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{VERDICT_EMOJI[t.aiVerdict || ''] || '❓'}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{t.playerName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t.buyingClub ? `${t.buyingClub} · ` : ''}
                          {formatFee(t.offerAmount, t.offerCurrency)}
                          {t.playerAge ? ` · Age ${t.playerAge}` : ''}
                          {t.playerPosition ? ` · ${t.playerPosition}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {t.userDecision && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          t.userDecision === 'Accepted' ? 'bg-green-100 text-green-700' :
                          t.userDecision === 'Rejected' ? 'bg-red-100 text-red-700' :
                          t.userDecision === 'Negotiated' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {t.userDecision}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString('en-GB')}</span>
                      <span className="text-gray-300 text-sm">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 space-y-3">
                      {t.aiReasoning && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">AI Reasoning</p>
                          <p className="text-sm text-gray-700">{t.aiReasoning}</p>
                        </div>
                      )}
                      {kf && kf.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Key Factors</p>
                          <div className="space-y-1">
                            {kf.map((f, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-sm">
                                <span className="shrink-0">{f.sentiment === 'positive' ? '✅' : f.sentiment === 'negative' ? '❌' : '⚖️'}</span>
                                <span><span className="font-medium">{f.factor}:</span> {f.detail}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {t.decisionNotes && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Your Notes</p>
                          <p className="text-sm text-gray-700">{t.decisionNotes}</p>
                        </div>
                      )}
                      {t.finalFee && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Final Fee</p>
                          <p className="text-sm text-gray-700">{formatFee(t.finalFee, t.offerCurrency)}</p>
                        </div>
                      )}

                      {/* Inline update decision */}
                      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                        <select
                          defaultValue={t.userDecision || 'Pending'}
                          onChange={e => updateDecision(t.id, { userDecision: e.target.value })}
                          className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {DECISION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <button
                          onClick={() => deleteDecision(t.id)}
                          className="text-xs text-red-500 hover:text-red-700 ml-auto"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
