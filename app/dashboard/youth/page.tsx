'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, ChevronDown, ChevronUp, Cpu, Upload, X, Users, TrendingUp, Calendar, Trash2, Edit3 } from 'lucide-react'

interface YouthUpdate {
  id: string
  loggedAt: string
  inGameDate: string | null
  rating: number | null
  apps: number | null
  goals: number | null
  assists: number | null
  avgRating: number | null
  morale: string | null
  fitness: number | null
  injuryStatus: string | null
  summary: string | null
  aiImported: boolean
}

interface YouthPlayer {
  id: string
  name: string
  age: number | null
  position: string | null
  nationality: string | null
  club: string | null
  playerType: string
  loanReturnDate: string | null
  potential: string | null
  notes: string | null
  createdAt: string
  updates: YouthUpdate[]
}

interface Save {
  id: string
  name: string
  currentClub: string | null
}

const S: Record<string, React.CSSProperties> = {
  card:    { background: '#101010', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem' },
  cardHd:  { background: '#0c0c0c', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  input:   { background: '#080808', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '0.5rem' },
}

function typeTag(t: string) {
  return t === 'loan'
    ? 'bg-blue-900/30 text-blue-300 border border-blue-700/40'
    : 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/40'
}

export default function YouthTrackerPage() {
  const [saves, setSaves] = useState<Save[]>([])
  const [selectedSave, setSelectedSave] = useState<string>('')
  const [players, setPlayers] = useState<YouthPlayer[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [addingUpdate, setAddingUpdateFor] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Add player form
  const [pForm, setPForm] = useState({
    name: '', age: '', position: '', nationality: '', club: '',
    playerType: 'academy', loanReturnDate: '', potential: '', notes: '',
  })

  // Add update form
  const [uForm, setUForm] = useState({
    inGameDate: '', rating: '', apps: '', goals: '', assists: '',
    avgRating: '', morale: '', fitness: '', injuryStatus: '', summary: '',
  })

  useEffect(() => {
    fetch('/api/saves').then(r => r.json()).then(data => {
      setSaves(data || [])
      if (data?.length) setSelectedSave(data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedSave) return
    setLoading(true)
    fetch(`/api/youth?saveId=${selectedSave}`)
      .then(r => r.json())
      .then(data => { setPlayers(data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedSave])

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/youth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pForm, saveId: selectedSave }),
    })
    if (res.ok) {
      const p = await res.json()
      setPlayers(prev => [p, ...prev])
      setPForm({ name: '', age: '', position: '', nationality: '', club: '', playerType: 'academy', loanReturnDate: '', potential: '', notes: '' })
      setShowAddPlayer(false)
    }
  }

  async function addUpdate(playerId: string, e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch(`/api/youth/${playerId}/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uForm),
    })
    if (res.ok) {
      const update = await res.json()
      setPlayers(prev => prev.map(p => p.id === playerId
        ? { ...p, updates: [update, ...p.updates] }
        : p
      ))
      setUForm({ inGameDate: '', rating: '', apps: '', goals: '', assists: '', avgRating: '', morale: '', fitness: '', injuryStatus: '', summary: '' })
      setAddingUpdateFor(null)
    }
  }

  async function handleAiImport(playerId: string, file: File) {
    setAiLoading(playerId)
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      const res = await fetch(`/api/youth/${playerId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, aiImported: true }),
      })
      if (res.ok) {
        const update = await res.json()
        setPlayers(prev => prev.map(p => p.id === playerId
          ? { ...p, updates: [update, ...p.updates] }
          : p
        ))
      }
      setAiLoading(null)
    }
    reader.readAsDataURL(file)
  }

  async function deletePlayer(playerId: string) {
    if (!confirm('Delete this player and all their updates?')) return
    await fetch(`/api/youth/${playerId}`, { method: 'DELETE' })
    setPlayers(prev => prev.filter(p => p.id !== playerId))
  }

  const currentSave = saves.find(s => s.id === selectedSave)
  const academyCount = players.filter(p => p.playerType === 'academy').length
  const loanCount = players.filter(p => p.playerType === 'loan').length

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Youth Tracker</h1>
          <p className="text-sm mt-1" style={{ color: '#888888' }}>
            Monitor academy players and loan stars with periodic updates
          </p>
        </div>
        {selectedSave && (
          <button
            onClick={() => setShowAddPlayer(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: '#ffffff', color: '#080808' }}
          >
            <Plus size={14} />
            Add Player
          </button>
        )}
      </div>

      {/* Save selector */}
      <div style={S.card} className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#555555' }}>Save</span>
          <select
            value={selectedSave}
            onChange={e => setSelectedSave(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg"
            style={S.input}
          >
            {saves.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.currentClub ? ` — ${s.currentClub}` : ''}</option>
            ))}
          </select>
          {selectedSave && (
            <div className="flex items-center gap-3 ml-2">
              <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                <Users size={11} /> {academyCount} academy
              </span>
              <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md"
                style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                <TrendingUp size={11} /> {loanCount} on loan
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Add Player form */}
      {showAddPlayer && (
        <div style={S.card} className="overflow-hidden">
          <div className="px-5 py-3 flex items-center justify-between" style={S.cardHd}>
            <span className="text-sm font-semibold text-white">New Player</span>
            <button onClick={() => setShowAddPlayer(false)} style={{ color: '#555555' }}><X size={14} /></button>
          </div>
          <form onSubmit={addPlayer} className="p-5 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[11px] font-medium mb-1" style={{ color: '#666666' }}>Name *</label>
                <input required value={pForm.name} onChange={e => setPForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm" style={S.input} placeholder="Player name" />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: '#666666' }}>Age</label>
                <input type="number" value={pForm.age} onChange={e => setPForm(p => ({ ...p, age: e.target.value }))}
                  className="w-full px-3 py-2 text-sm" style={S.input} placeholder="17" />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: '#666666' }}>Position</label>
                <input value={pForm.position} onChange={e => setPForm(p => ({ ...p, position: e.target.value }))}
                  className="w-full px-3 py-2 text-sm" style={S.input} placeholder="ST, CM..." />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: '#666666' }}>Type</label>
                <select value={pForm.playerType} onChange={e => setPForm(p => ({ ...p, playerType: e.target.value }))}
                  className="w-full px-3 py-2 text-sm" style={S.input}>
                  <option value="academy">Academy</option>
                  <option value="loan">On Loan</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: '#666666' }}>Club</label>
                <input value={pForm.club} onChange={e => setPForm(p => ({ ...p, club: e.target.value }))}
                  className="w-full px-3 py-2 text-sm" style={S.input}
                  placeholder={pForm.playerType === 'loan' ? 'Loan club' : 'Academy'} />
              </div>
              {pForm.playerType === 'loan' && (
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: '#666666' }}>Return Date</label>
                  <input type="date" value={pForm.loanReturnDate} onChange={e => setPForm(p => ({ ...p, loanReturnDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm" style={S.input} />
                </div>
              )}
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: '#666666' }}>Potential</label>
                <input value={pForm.potential} onChange={e => setPForm(p => ({ ...p, potential: e.target.value }))}
                  className="w-full px-3 py-2 text-sm" style={S.input} placeholder="Determined, 140-160..." />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: '#666666' }}>Nationality</label>
                <input value={pForm.nationality} onChange={e => setPForm(p => ({ ...p, nationality: e.target.value }))}
                  className="w-full px-3 py-2 text-sm" style={S.input} placeholder="English" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: '#666666' }}>Notes</label>
              <textarea value={pForm.notes} onChange={e => setPForm(p => ({ ...p, notes: e.target.value }))}
                rows={2} className="w-full px-3 py-2 text-sm resize-none" style={S.input}
                placeholder="Any additional context..." />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddPlayer(false)}
                className="px-4 py-2 text-sm rounded-lg" style={{ color: '#666666' }}>Cancel</button>
              <button type="submit"
                className="px-4 py-2 text-sm font-semibold rounded-lg"
                style={{ background: '#ffffff', color: '#080808' }}>Add Player</button>
            </div>
          </form>
        </div>
      )}

      {/* Players list */}
      {loading ? (
        <div className="text-center py-16" style={{ color: '#444444' }}>Loading…</div>
      ) : players.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#444444' }}>
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No players tracked yet.</p>
          <p className="text-xs mt-1">Add academy or loan players to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {players.map(player => {
            const isOpen = expandedId === player.id
            const latest = player.updates[0]
            return (
              <div key={player.id} style={{ ...S.card, overflow: 'hidden' }}>
                {/* Player header */}
                <div className="px-5 py-4 flex items-start gap-3" style={{ background: '#101010' }}>
                  <button className="flex-1 text-left" onClick={() => setExpandedId(isOpen ? null : player.id)}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-white">{player.name}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${typeTag(player.playerType)}`}>
                        {player.playerType === 'loan' ? 'On Loan' : 'Academy'}
                      </span>
                      {player.position && (
                        <span className="text-xs px-2 py-0.5 rounded-md"
                          style={{ background: 'rgba(255,255,255,0.05)', color: '#888888' }}>
                          {player.position}
                        </span>
                      )}
                      {player.age && <span className="text-xs" style={{ color: '#666666' }}>Age {player.age}</span>}
                      {player.club && <span className="text-xs" style={{ color: '#666666' }}>· {player.club}</span>}
                    </div>
                    {latest && (
                      <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                        {latest.apps !== null && (
                          <span className="text-xs" style={{ color: '#888888' }}>{latest.apps} apps</span>
                        )}
                        {latest.goals !== null && (
                          <span className="text-xs" style={{ color: '#888888' }}>{latest.goals}G</span>
                        )}
                        {latest.assists !== null && (
                          <span className="text-xs" style={{ color: '#888888' }}>{latest.assists}A</span>
                        )}
                        {latest.avgRating !== null && (
                          <span className="text-xs" style={{ color: '#888888' }}>Avg {latest.avgRating}</span>
                        )}
                        {latest.aiImported && (
                          <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                            <Cpu size={9} /> AI
                          </span>
                        )}
                      </div>
                    )}
                  </button>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs" style={{ color: '#444444' }}>{player.updates.length} updates</span>
                    <button onClick={() => deletePlayer(player.id)} className="opacity-30 hover:opacity-70 transition-opacity" style={{ color: '#ef4444' }}>
                      <Trash2 size={13} />
                    </button>
                    <button onClick={() => setExpandedId(isOpen ? null : player.id)} style={{ color: '#444444' }}>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0c0c0c' }}>
                    {/* Player meta */}
                    {(player.potential || player.notes || player.loanReturnDate) && (
                      <div className="px-5 py-3 flex flex-wrap gap-4"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {player.potential && (
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#444444' }}>Potential</span>
                            <p className="text-xs mt-0.5" style={{ color: '#cccccc' }}>{player.potential}</p>
                          </div>
                        )}
                        {player.loanReturnDate && (
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#444444' }}>Loan Return</span>
                            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#cccccc' }}>
                              <Calendar size={10} />
                              {new Date(player.loanReturnDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {player.notes && (
                          <div className="flex-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#444444' }}>Notes</span>
                            <p className="text-xs mt-0.5" style={{ color: '#888888' }}>{player.notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Updates */}
                    <div className="px-5 py-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#555555' }}>
                          Updates
                        </span>
                        <div className="flex items-center gap-2">
                          {/* AI import */}
                          <button
                            onClick={() => fileRef.current?.click()}
                            disabled={!!aiLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}
                          >
                            {aiLoading === player.id ? '…' : <><Cpu size={11} /> AI Import</>}
                          </button>
                          <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0]
                              if (f) handleAiImport(player.id, f)
                              e.target.value = ''
                            }}
                          />
                          <button
                            onClick={() => setAddingUpdateFor(addingUpdate === player.id ? null : player.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{ background: 'rgba(255,255,255,0.05)', color: '#cccccc', border: '1px solid rgba(255,255,255,0.08)' }}
                          >
                            <Plus size={11} /> Manual
                          </button>
                        </div>
                      </div>

                      {/* Manual update form */}
                      {addingUpdate === player.id && (
                        <form onSubmit={e => addUpdate(player.id, e)}
                          className="rounded-xl p-4 space-y-3"
                          style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                            {[
                              { k: 'apps', label: 'Apps', type: 'number' },
                              { k: 'goals', label: 'Goals', type: 'number' },
                              { k: 'assists', label: 'Assists', type: 'number' },
                              { k: 'avgRating', label: 'Avg Rating', type: 'number' },
                              { k: 'rating', label: 'CA Rating', type: 'number' },
                              { k: 'fitness', label: 'Fitness %', type: 'number' },
                              { k: 'morale', label: 'Morale', type: 'text' },
                              { k: 'injuryStatus', label: 'Injury', type: 'text' },
                              { k: 'inGameDate', label: 'Date', type: 'date' },
                            ].map(({ k, label, type }) => (
                              <div key={k}>
                                <label className="block text-[10px] mb-1" style={{ color: '#555555' }}>{label}</label>
                                <input
                                  type={type}
                                  value={(uForm as Record<string, string>)[k]}
                                  onChange={e => setUForm(f => ({ ...f, [k]: e.target.value }))}
                                  className="w-full px-2 py-1.5 text-xs" style={S.input}
                                  step={type === 'number' ? '0.01' : undefined}
                                />
                              </div>
                            ))}
                          </div>
                          <div>
                            <label className="block text-[10px] mb-1" style={{ color: '#555555' }}>Summary</label>
                            <textarea
                              value={uForm.summary}
                              onChange={e => setUForm(f => ({ ...f, summary: e.target.value }))}
                              rows={2} className="w-full px-2 py-1.5 text-xs resize-none" style={S.input}
                              placeholder="How is the player developing?" />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setAddingUpdateFor(null)}
                              className="px-3 py-1.5 text-xs rounded-lg" style={{ color: '#666666' }}>Cancel</button>
                            <button type="submit"
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg"
                              style={{ background: '#ffffff', color: '#080808' }}>Save Update</button>
                          </div>
                        </form>
                      )}

                      {/* Updates list */}
                      {player.updates.length === 0 ? (
                        <p className="text-xs py-4 text-center" style={{ color: '#444444' }}>No updates yet</p>
                      ) : (
                        <div className="space-y-2">
                          {player.updates.map(u => (
                            <div key={u.id} className="rounded-xl p-3"
                              style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 flex-wrap mb-1.5">
                                    <span className="text-[10px]" style={{ color: '#555555' }}>
                                      {u.inGameDate
                                        ? new Date(u.inGameDate).toLocaleDateString()
                                        : new Date(u.loggedAt).toLocaleDateString()}
                                    </span>
                                    {u.aiImported && (
                                      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                                        style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                                        <Cpu size={9} /> AI imported
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    {u.apps !== null && <span className="text-xs" style={{ color: '#aaaaaa' }}><span style={{ color: '#555555' }}>Apps</span> {u.apps}</span>}
                                    {u.goals !== null && <span className="text-xs" style={{ color: '#aaaaaa' }}><span style={{ color: '#555555' }}>G</span> {u.goals}</span>}
                                    {u.assists !== null && <span className="text-xs" style={{ color: '#aaaaaa' }}><span style={{ color: '#555555' }}>A</span> {u.assists}</span>}
                                    {u.avgRating !== null && <span className="text-xs" style={{ color: '#aaaaaa' }}><span style={{ color: '#555555' }}>Avg</span> {u.avgRating}</span>}
                                    {u.rating !== null && <span className="text-xs" style={{ color: '#aaaaaa' }}><span style={{ color: '#555555' }}>CA</span> {u.rating}</span>}
                                    {u.fitness !== null && <span className="text-xs" style={{ color: '#aaaaaa' }}><span style={{ color: '#555555' }}>Fit</span> {u.fitness}%</span>}
                                    {u.morale && <span className="text-xs" style={{ color: '#aaaaaa' }}>{u.morale}</span>}
                                    {u.injuryStatus && (
                                      <span className="text-xs px-1.5 py-0.5 rounded"
                                        style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                                        {u.injuryStatus}
                                      </span>
                                    )}
                                  </div>
                                  {u.summary && (
                                    <p className="text-xs mt-1.5" style={{ color: '#888888' }}>{u.summary}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
