'use client'

import { useState, useEffect } from 'react'
import { Cpu, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Target, ArrowUpRight, RefreshCw } from 'lucide-react'

interface TransferPriority {
  priority: 'High' | 'Medium' | 'Low'
  action: 'Buy' | 'Sell' | 'Loan In' | 'Loan Out' | 'Contract'
  position: string
  reasoning: string
  budget: string
  profile: string
}

interface SellCandidate {
  playerName: string
  reason: string
  estimatedValue: string
}

interface TransferPlan {
  summary: string
  priorities: TransferPriority[]
  sellCandidates: SellCandidate[]
  keyRisks: string[]
  budgetAdvice: string
  overallVerdict: string
}

interface Save {
  id: string
  name: string
  currentClub: string | null
}

const S: Record<string, React.CSSProperties> = {
  card:   { background: '#101010', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem' },
  cardHd: { background: '#0c0c0c', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  input:  { background: '#080808', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '0.5rem' },
}

function priorityColor(p: string) {
  if (p === 'High') return { bg: 'rgba(239,68,68,0.1)', text: '#f87171', border: 'rgba(239,68,68,0.25)' }
  if (p === 'Medium') return { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24', border: 'rgba(251,191,36,0.25)' }
  return { bg: 'rgba(16,185,129,0.1)', text: '#34d399', border: 'rgba(16,185,129,0.25)' }
}

function actionColor(a: string) {
  if (a === 'Buy') return 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/40'
  if (a === 'Sell') return 'bg-red-900/30 text-red-300 border border-red-700/40'
  if (a === 'Loan In') return 'bg-blue-900/30 text-blue-300 border border-blue-700/40'
  if (a === 'Loan Out') return 'bg-orange-900/30 text-orange-300 border border-orange-700/40'
  return 'bg-zinc-800 text-zinc-400 border border-zinc-700'
}

export default function TransferPlannerPage() {
  const [saves, setSaves] = useState<Save[]>([])
  const [selectedSave, setSelectedSave] = useState('')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<TransferPlan | null>(null)
  const [saveCtx, setSaveCtx] = useState<{ club: string | null; season: string | null } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/saves').then(r => r.json()).then(data => {
      setSaves(data || [])
      if (data?.length) setSelectedSave(data[0].id)
    })
  }, [])

  async function runAnalysis() {
    if (!selectedSave) return
    setLoading(true)
    setError('')
    setPlan(null)

    const res = await fetch('/api/ai/transfer-planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saveId: selectedSave, additionalContext: context }),
    })

    if (res.ok) {
      const data = await res.json()
      setPlan(data.plan)
      setSaveCtx(data.saveContext)
    } else {
      setError('Analysis failed. Make sure you have checkpoint data with finances and player stats.')
    }
    setLoading(false)
  }

  const highPriority = plan?.priorities.filter(p => p.priority === 'High') || []
  const otherPriority = plan?.priorities.filter(p => p.priority !== 'High') || []

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Transfer Planner</h1>
          <p className="text-sm mt-1" style={{ color: '#888888' }}>
            AI analysis of your squad gaps and budget to plan the transfer window
          </p>
        </div>
      </div>

      {/* Configuration */}
      <div style={S.card} className="overflow-hidden">
        <div className="px-5 py-3" style={S.cardHd}>
          <span className="text-sm font-semibold text-white">Configure Analysis</span>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#666666' }}>Save</label>
              <select
                value={selectedSave}
                onChange={e => setSelectedSave(e.target.value)}
                className="w-full px-3 py-2 text-sm" style={S.input}
              >
                {saves.map(s => (
                  <option key={s.id} value={s.id}>{s.name}{s.currentClub ? ` — ${s.currentClub}` : ''}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#666666' }}>
              Additional Context (optional)
            </label>
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm resize-none" style={S.input}
              placeholder="e.g. I'm in January window, targeting Champions League next season, striker is injured for 3 months, board wants me to sell young players..."
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={runAnalysis}
              disabled={loading || !selectedSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: '#ffffff', color: '#080808' }}
            >
              {loading ? (
                <><RefreshCw size={14} className="animate-spin" /> Analysing…</>
              ) : (
                <><Cpu size={14} /> Analyse Squad</>
              )}
            </button>
            {plan && (
              <span className="text-xs" style={{ color: '#555555' }}>
                {saveCtx?.club} · {saveCtx?.season}
              </span>
            )}
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Results */}
      {plan && (
        <div className="space-y-4">
          {/* Verdict banner */}
          <div
            className="rounded-xl px-5 py-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-start gap-3">
              <Cpu size={16} style={{ color: '#888888', marginTop: 2 }} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#555555' }}>AI Verdict</p>
                <p className="text-sm leading-relaxed text-white font-medium">{plan.overallVerdict}</p>
                <p className="text-sm leading-relaxed mt-1" style={{ color: '#aaaaaa' }}>{plan.summary}</p>
              </div>
            </div>
          </div>

          {/* High priority targets */}
          {highPriority.length > 0 && (
            <div style={S.card} className="overflow-hidden">
              <div className="px-5 py-3 flex items-center gap-2" style={S.cardHd}>
                <AlertTriangle size={13} style={{ color: '#f87171' }} />
                <span className="text-sm font-semibold text-white">High Priority</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                  {highPriority.length} actions
                </span>
              </div>
              <div className="p-4 space-y-3">
                {highPriority.map((item, i) => (
                  <PriorityCard key={i} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Other priorities */}
          {otherPriority.length > 0 && (
            <div style={S.card} className="overflow-hidden">
              <div className="px-5 py-3" style={S.cardHd}>
                <span className="text-sm font-semibold text-white">Other Priorities</span>
              </div>
              <div className="p-4 space-y-3">
                {otherPriority.map((item, i) => (
                  <PriorityCard key={i} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Two-col: sell candidates + risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sell candidates */}
            {plan.sellCandidates.length > 0 && (
              <div style={S.card} className="overflow-hidden">
                <div className="px-5 py-3 flex items-center gap-2" style={S.cardHd}>
                  <TrendingDown size={13} style={{ color: '#f87171' }} />
                  <span className="text-sm font-semibold text-white">Sell Candidates</span>
                </div>
                <div className="p-4 space-y-3">
                  {plan.sellCandidates.map((s, i) => (
                    <div key={i} className="rounded-lg p-3"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">{s.playerName}</span>
                        <span className="text-xs font-medium" style={{ color: '#34d399' }}>{s.estimatedValue}</span>
                      </div>
                      <p className="text-xs" style={{ color: '#888888' }}>{s.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key risks + budget */}
            <div className="space-y-4">
              {plan.keyRisks.length > 0 && (
                <div style={S.card} className="overflow-hidden">
                  <div className="px-5 py-3 flex items-center gap-2" style={S.cardHd}>
                    <AlertTriangle size={13} style={{ color: '#fbbf24' }} />
                    <span className="text-sm font-semibold text-white">Key Risks</span>
                  </div>
                  <div className="p-4 space-y-2">
                    {plan.keyRisks.map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#fbbf24' }} />
                        <p className="text-xs leading-relaxed" style={{ color: '#aaaaaa' }}>{r}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={S.card} className="overflow-hidden">
                <div className="px-5 py-3 flex items-center gap-2" style={S.cardHd}>
                  <DollarSign size={13} style={{ color: '#34d399' }} />
                  <span className="text-sm font-semibold text-white">Budget Strategy</span>
                </div>
                <div className="p-4">
                  <p className="text-sm leading-relaxed" style={{ color: '#aaaaaa' }}>{plan.budgetAdvice}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PriorityCard({ item }: { item: TransferPriority }) {
  const pc = priorityColor(item.priority)
  return (
    <div className="rounded-xl p-4"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-2 flex-shrink-0 pt-0.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
            style={{ background: pc.bg, color: pc.text, border: `1px solid ${pc.border}` }}>
            {item.priority}
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${actionColor(item.action)}`}>
            {item.action}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white">{item.position}</span>
            {item.budget && (
              <span className="text-xs" style={{ color: '#34d399' }}>{item.budget}</span>
            )}
          </div>
          <p className="text-xs leading-relaxed mb-2" style={{ color: '#aaaaaa' }}>{item.reasoning}</p>
          {item.profile && (
            <div className="rounded-lg px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#444444' }}>
                Target Profile
              </p>
              <p className="text-xs" style={{ color: '#888888' }}>{item.profile}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
