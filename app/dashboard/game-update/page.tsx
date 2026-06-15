'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Upload, CheckCircle2, XCircle, Cpu, Loader2, Camera, FileImage, X, ChevronRight, AlertTriangle } from 'lucide-react'

interface Save {
  id: string
  name: string
  currentClub: string | null
  seasons?: { id: string; seasonLabel: string; status: string }[]
}

interface ImageFile {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'done' | 'error'
}

interface ImportResult {
  ok: boolean
  saved: string[]
  youthUpdated: string[]
  imageResults: { filename: string; success: boolean; type: string; error?: string }[]
  summary: {
    imagesProcessed: number
    imagesSuccessful: number
    tablesUpdated: number
    youthPlayersUpdated: number
  }
  error?: string
}

const MILESTONES = [
  { value: 10, label: '10 Games', description: 'Early season check-in' },
  { value: 23, label: '23 Games', description: 'Halfway point' },
  { value: 35, label: '35 Games', description: 'Business end of season' },
  { value: 46, label: '46 Games', description: 'End of season' },
]

const SCREENSHOT_TIPS = [
  { icon: '📊', label: 'League Table', tip: 'Shows standings, points, GF/GA' },
  { icon: '👥', label: 'Player Stats', tip: 'Goals, assists, apps, ratings' },
  { icon: '💰', label: 'Finances', tip: 'Budget, balance, wage spend' },
  { icon: '🏥', label: 'Medical', tip: 'Injuries and squad fitness' },
  { icon: '⚽', label: 'Squad Overview', tip: 'All players, positions, values' },
  { icon: '🎯', label: 'Team Stats', tip: 'xG, possession, shots per game' },
]

const S: Record<string, React.CSSProperties> = {
  card:   { background: '#101010', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem' },
  cardHd: { background: '#0c0c0c', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  input:  { background: '#080808', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '0.5rem' },
}

export default function GameUpdatePage() {
  const [saves, setSaves] = useState<Save[]>([])
  const [selectedSave, setSelectedSave] = useState('')
  const [gamesPlayed, setGamesPlayed] = useState<number>(10)
  const [images, setImages] = useState<ImageFile[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/saves')
      .then(r => r.json())
      .then(data => {
        setSaves(data || [])
        if (data?.length) setSelectedSave(data[0].id)
      })
  }, [])

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    const newImages: ImageFile[] = arr.map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
    }))
    setImages(prev => [...prev, ...newImages])
    setResult(null)
  }, [])

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id)
      if (img) URL.revokeObjectURL(img.preview)
      return prev.filter(i => i.id !== id)
    })
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function runImport() {
    if (!selectedSave || images.length === 0) return
    setLoading(true)
    setResult(null)

    try {
      // Convert all images to base64
      const imagePayloads = await Promise.all(
        images.map(async (img) => ({
          base64: await fileToBase64(img.file),
          mimeType: img.file.type || 'image/png',
          filename: img.file.name,
        }))
      )

      const res = await fetch('/api/ai/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saveId: selectedSave,
          gamesPlayed,
          images: imagePayloads,
        }),
      })

      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setResult({ ok: false, error: err.message, saved: [], youthUpdated: [], imageResults: [], summary: { imagesProcessed: 0, imagesSuccessful: 0, tablesUpdated: 0, youthPlayersUpdated: 0 } })
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    images.forEach(i => URL.revokeObjectURL(i.preview))
    setImages([])
    setResult(null)
  }

  const currentSave = saves.find(s => s.id === selectedSave)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Game Update</h1>
        <p className="text-sm mt-1" style={{ color: '#888888' }}>
          Upload your FM screenshots at 10, 23, 35, or 46 games — AI extracts everything automatically
        </p>
      </div>

      {/* What to screenshot */}
      <div style={S.card} className="overflow-hidden">
        <div className="px-5 py-3 flex items-center gap-2" style={S.cardHd}>
          <Camera size={13} style={{ color: '#555555' }} />
          <span className="text-sm font-semibold text-white">What to screenshot</span>
          <span className="ml-auto text-xs" style={{ color: '#444444' }}>more screenshots = more data</span>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {SCREENSHOT_TIPS.map(tip => (
            <div key={tip.label} className="flex items-start gap-2.5 rounded-lg p-2.5"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-base leading-none">{tip.icon}</span>
              <div>
                <p className="text-xs font-medium text-white">{tip.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#555555' }}>{tip.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Config: save + milestone */}
      <div style={S.card} className="overflow-hidden">
        <div className="px-5 py-3" style={S.cardHd}>
          <span className="text-sm font-semibold text-white">Step 1 — Choose save & milestone</span>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#666666' }}>Save</label>
            <select
              value={selectedSave}
              onChange={e => setSelectedSave(e.target.value)}
              className="w-full px-3 py-2 text-sm" style={S.input}
            >
              {saves.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.currentClub ? ` — ${s.currentClub}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-2" style={{ color: '#666666' }}>Games played milestone</label>
            <div className="grid grid-cols-4 gap-2">
              {MILESTONES.map(m => (
                <button
                  key={m.value}
                  onClick={() => setGamesPlayed(m.value)}
                  className="rounded-xl py-3 px-3 text-left transition-all"
                  style={gamesPlayed === m.value
                    ? { background: '#ffffff', color: '#080808', border: '1px solid #ffffff' }
                    : { background: 'rgba(255,255,255,0.03)', color: '#888888', border: '1px solid rgba(255,255,255,0.06)' }
                  }
                >
                  <p className="text-sm font-bold">{m.value}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{m.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upload zone */}
      <div style={S.card} className="overflow-hidden">
        <div className="px-5 py-3" style={S.cardHd}>
          <span className="text-sm font-semibold text-white">Step 2 — Upload screenshots</span>
        </div>
        <div className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-10 cursor-pointer transition-all"
            style={{
              borderColor: dragOver ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
              background: dragOver ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)',
            }}
          >
            <Upload size={24} className="mb-3" style={{ color: '#444444' }} />
            <p className="text-sm font-medium text-white">Drop screenshots here</p>
            <p className="text-xs mt-1" style={{ color: '#555555' }}>or click to browse — PNG, JPG, WebP</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {/* Image thumbnails */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {images.map(img => (
                <div key={img.id} className="relative rounded-xl overflow-hidden aspect-video group"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.preview} alt={img.file.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => removeImage(img.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.8)' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1"
                    style={{ background: 'rgba(0,0,0,0.7)' }}>
                    <p className="text-[9px] text-white truncate">{img.file.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Process button */}
      <div className="flex items-center gap-3">
        <button
          onClick={runImport}
          disabled={loading || images.length === 0 || !selectedSave}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80 disabled:opacity-30"
          style={{ background: '#ffffff', color: '#080808' }}
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Analysing {images.length} screenshot{images.length !== 1 ? 's' : ''}…</>
          ) : (
            <><Cpu size={15} /> Process {images.length > 0 ? `${images.length} screenshot${images.length !== 1 ? 's' : ''}` : 'screenshots'}</>
          )}
        </button>
        {images.length > 0 && !loading && (
          <button onClick={resetForm} className="text-sm transition-opacity hover:opacity-70" style={{ color: '#555555' }}>
            Clear all
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={S.card} className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 size={16} className="animate-spin" style={{ color: '#888888' }} />
            <span className="text-sm text-white">AI is reading your screenshots…</span>
          </div>
          <div className="space-y-2">
            {['Analysing images with vision AI', 'Extracting stats and table data', 'Saving to your tracker', 'Updating youth player records'].map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
                <span className="text-xs" style={{ color: '#555555' }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Summary banner */}
          <div
            className="rounded-xl p-5"
            style={result.ok
              ? { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }
              : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }
            }
          >
            <div className="flex items-start gap-3">
              {result.ok
                ? <CheckCircle2 size={18} style={{ color: '#34d399', marginTop: 1 }} />
                : <XCircle size={18} style={{ color: '#f87171', marginTop: 1 }} />
              }
              <div>
                <p className="text-sm font-semibold text-white mb-1">
                  {result.ok ? 'Import complete' : 'Import failed'}
                </p>
                {result.ok ? (
                  <div className="flex flex-wrap gap-4">
                    <span className="text-xs" style={{ color: '#34d399' }}>
                      ✓ {result.summary.imagesSuccessful}/{result.summary.imagesProcessed} screenshots read
                    </span>
                    <span className="text-xs" style={{ color: '#34d399' }}>
                      ✓ {result.summary.tablesUpdated} data tables updated
                    </span>
                    {result.summary.youthPlayersUpdated > 0 && (
                      <span className="text-xs" style={{ color: '#34d399' }}>
                        ✓ {result.summary.youthPlayersUpdated} youth players auto-updated
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: '#f87171' }}>{result.error}</p>
                )}
              </div>
            </div>
          </div>

          {result.ok && (
            <>
              {/* What was saved */}
              <div style={S.card} className="overflow-hidden">
                <div className="px-5 py-3" style={S.cardHd}>
                  <span className="text-sm font-semibold text-white">Data saved</span>
                </div>
                <div className="p-4 space-y-2">
                  {result.saved.map(item => (
                    <div key={item} className="flex items-center gap-2.5">
                      <CheckCircle2 size={13} style={{ color: '#34d399' }} />
                      <span className="text-sm text-white capitalize">{item}</span>
                    </div>
                  ))}
                  {result.youthUpdated.length > 0 && (
                    <div className="flex items-start gap-2.5 mt-2 pt-2"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <CheckCircle2 size={13} style={{ color: '#a78bfa', marginTop: 2 }} />
                      <div>
                        <span className="text-sm" style={{ color: '#a78bfa' }}>Youth tracker auto-updated</span>
                        <p className="text-xs mt-0.5" style={{ color: '#666666' }}>
                          {result.youthUpdated.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Per-screenshot breakdown */}
              <div style={S.card} className="overflow-hidden">
                <div className="px-5 py-3" style={S.cardHd}>
                  <span className="text-sm font-semibold text-white">Screenshots processed</span>
                </div>
                <div className="p-4 space-y-2">
                  {result.imageResults.map((img, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {img.success
                        ? <CheckCircle2 size={13} style={{ color: '#34d399' }} />
                        : <XCircle size={13} style={{ color: '#f87171' }} />
                      }
                      <span className="text-sm flex-1 text-white truncate">{img.filename}</span>
                      {img.success && (
                        <span className="text-[10px] px-2 py-0.5 rounded"
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#888888' }}>
                          {img.type?.replace(/_/g, ' ')}
                        </span>
                      )}
                      {!img.success && (
                        <span className="text-xs" style={{ color: '#f87171' }}>failed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* What's now updated */}
              <div className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#444444' }}>
                  Everything that's now updated
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { label: 'Dashboard', desc: 'Season overview' },
                    { label: 'Checkpoints', desc: `${gamesPlayed}-game data locked` },
                    { label: 'Compare', desc: 'League standings' },
                    { label: 'Players', desc: 'Stats updated' },
                    { label: 'Squad Depth', desc: 'Position map refreshed' },
                    { label: 'Transfer Planner', desc: 'Squad analysis current' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <ChevronRight size={11} style={{ color: '#34d399' }} />
                      <div>
                        <span className="text-xs text-white">{item.label}</span>
                        <span className="text-[10px] ml-1" style={{ color: '#555555' }}>{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={resetForm}
                className="text-sm px-4 py-2 rounded-lg transition-opacity hover:opacity-70"
                style={{ color: '#888888', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Upload more screenshots
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
