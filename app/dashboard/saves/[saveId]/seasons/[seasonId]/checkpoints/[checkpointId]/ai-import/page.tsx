'use client'

import { useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type FileStatus = 'pending' | 'uploading' | 'analyzing' | 'done' | 'error'

type AnalyzedFile = {
  file: File
  preview: string
  status: FileStatus
  fileUrl?: string
  storagePath?: string
  extracted?: any
  error?: string
}

function mergeExtracted(files: AnalyzedFile[]): any {
  const done = files.filter(f => f.extracted)
  if (done.length === 0) return null

  const merged: any = {}

  // Pick first non-null value for scalar fields
  for (const field of ['gameDate', 'transferWindow', 'leagueName', 'clubName']) {
    merged[field] = done.map(f => f.extracted[field]).find(v => v != null) ?? null
  }

  // Team stats: use last screenshot that has stats (most up-to-date usually)
  const withTeamStats = done.filter(f => f.extracted.teamStats && Object.values(f.extracted.teamStats).some(v => v != null))
  if (withTeamStats.length > 0) {
    const combined = {} as Record<string, any>
    // Start with first, then overlay later ones
    for (const f of withTeamStats) {
      for (const [k, v] of Object.entries(f.extracted.teamStats)) {
        if (v != null) combined[k] = v
      }
    }
    merged.teamStats = combined
  }

  // League table: prefer the one with the most rows
  const tables = done.filter(f => f.extracted.leagueTable?.length > 0)
  if (tables.length > 0) {
    merged.leagueTable = tables.reduce((best, f) =>
      f.extracted.leagueTable.length > best.extracted.leagueTable.length ? f : best
    ).extracted.leagueTable
  }

  // Tactic: first found
  merged.tactic = done.map(f => f.extracted.tactic).find(t => t?.formation || t?.mentality) ?? null

  // Finances: first found
  merged.finances = done.map(f => f.extracted.finances).find(f => f && Object.values(f).some(v => v != null)) ?? null

  // Medical: first found
  merged.medical = done.map(f => f.extracted.medical).find(m => m && Object.values(m).some(v => v != null)) ?? null

  // Player stats: merge all unique names
  const playerMap: Record<string, any> = {}
  for (const f of done) {
    if (!f.extracted.playerStats) continue
    for (const p of f.extracted.playerStats) {
      if (p.name?.trim()) {
        const key = p.name.trim().toLowerCase()
        if (!playerMap[key]) playerMap[key] = p
        else {
          // Merge non-null values
          for (const [k, v] of Object.entries(p)) {
            if (v != null && playerMap[key][k] == null) playerMap[key][k] = v
          }
        }
      }
    }
  }
  merged.playerStats = Object.values(playerMap)

  return merged
}

const VERDICT_STYLES: Record<string, { bg: string; text: string; badge: string }> = {
  flying:     { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700' },
  solid:      { bg: 'bg-blue-50 border-blue-200',       text: 'text-blue-800',    badge: 'bg-blue-100 text-blue-700' },
  mixed:      { bg: 'bg-yellow-50 border-yellow-200',   text: 'text-yellow-800',  badge: 'bg-yellow-100 text-yellow-700' },
  concerning: { bg: 'bg-orange-50 border-orange-200',   text: 'text-orange-800',  badge: 'bg-amber-500/10 text-amber-400' },
  crisis:     { bg: 'bg-red-50 border-red-200',         text: 'text-red-800',     badge: 'bg-red-100 text-red-700' },
}

function DebriefCard({ debrief, base }: { debrief: any; base?: string }) {
  const style = VERDICT_STYLES[debrief.verdict] ?? VERDICT_STYLES.mixed
  return (
    <div className={`rounded-xl border p-6 ${style.bg}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${style.badge}`}>
              {debrief.verdict?.toUpperCase()}
            </span>
            {debrief.rating != null && (
              <span className={`text-xs font-semibold ${style.text}`}>{debrief.rating}/10</span>
            )}
          </div>
          <h3 className={`text-lg font-bold ${style.text}`}>{debrief.headline}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Positives */}
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

        {/* Concerns */}
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

      {/* Squad / finance notes */}
      {(debrief.squadNote || debrief.financialNote) && (
        <div className="flex flex-wrap gap-3 mb-4">
          {debrief.squadNote && (
            <div className="card-panel/60 rounded-lg px-3 py-2 text-sm text-zinc-300 flex-1 min-w-[200px]">
              <span className="font-semibold text-zinc-500 text-xs uppercase tracking-wide block mb-0.5">🏥 Squad</span>
              {debrief.squadNote}
            </div>
          )}
          {debrief.financialNote && (
            <div className="card-panel/60 rounded-lg px-3 py-2 text-sm text-zinc-300 flex-1 min-w-[200px]">
              <span className="font-semibold text-zinc-500 text-xs uppercase tracking-wide block mb-0.5">💰 Finances</span>
              {debrief.financialNote}
            </div>
          )}
        </div>
      )}

      {/* Looking ahead */}
      {debrief.lookingAhead && (
        <div className="card-panel/70 rounded-lg px-4 py-3 border border-white/50">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 mb-1">🔭 Looking ahead</p>
          <p className="text-sm text-zinc-300">{debrief.lookingAhead}</p>
        </div>
      )}

      {base && (
        <div className="mt-4 pt-3 border-t border-white/50">
          <Link href={base} className="text-xs text-zinc-500 hover:text-zinc-300">
            Back to checkpoint →
          </Link>
        </div>
      )}
    </div>
  )
}

function DataPreview({ extracted }: { extracted: any }) {
  if (!extracted) return null
  const items: string[] = []
  if (extracted.screenshotType) items.push(`Type: ${extracted.screenshotType.replace(/_/g, ' ')}`)
  if (extracted.gameDate) items.push(`Date: ${extracted.gameDate}`)
  if (extracted.transferWindow) items.push(`Transfer window: ${extracted.transferWindow}`)
  if (extracted.clubName) items.push(`Club: ${extracted.clubName}`)
  if (extracted.leagueName) items.push(`League: ${extracted.leagueName}`)
  if (extracted.teamStats?.leaguePosition) items.push(`Position: ${extracted.teamStats.leaguePosition}`)
  if (extracted.teamStats?.points != null) items.push(`Points: ${extracted.teamStats.points}`)
  if (extracted.leagueTable?.length) items.push(`League table: ${extracted.leagueTable.length} teams`)
  if (extracted.tactic?.formation) items.push(`Formation: ${extracted.tactic.formation}`)
  if (extracted.finances?.balance != null) items.push(`Balance: £${Number(extracted.finances.balance).toLocaleString()}`)
  if (extracted.medical?.currentInjuries != null) items.push(`Injuries: ${extracted.medical.currentInjuries}`)
  if (extracted.playerStats?.length) items.push(`Players: ${extracted.playerStats.length}`)

  if (items.length === 0) return <p className="text-xs text-zinc-600 mt-1">No data recognised</p>

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {items.map((item, i) => (
        <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{item}</span>
      ))}
    </div>
  )
}

export default function AiImportPage() {
  const params = useParams()
  const router = useRouter()
  const { saveId, seasonId, checkpointId } = params as Record<string, string>
  const base = `/dashboard/saves/${saveId}/seasons/${seasonId}/checkpoints/${checkpointId}`

  const [files, setFiles] = useState<AnalyzedFile[]>([])
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState<string[] | null>(null)
  const [applyError, setApplyError] = useState('')
  const [debrief, setDebrief] = useState<any>(null)
  const [debriefLoading, setDebriefLoading] = useState(false)
  const [debriefError, setDebriefError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    addFiles(dropped)
  }, [])

  function addFiles(newFiles: File[]) {
    const items: AnalyzedFile[] = newFiles.map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
      status: 'pending',
    }))
    setFiles(prev => [...prev, ...items])
    processFiles(items)
  }

  async function processFiles(newItems: AnalyzedFile[]) {
    const supabase = createClient()

    for (const item of newItems) {
      setFiles(prev => prev.map(f => f.preview === item.preview ? { ...f, status: 'uploading' } : f))

      // Convert file to base64 client-side (avoids storage URL access issues)
      const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            // Strip the data:image/...;base64, prefix
            resolve(result.split(',')[1])
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

      // Upload to storage and convert to base64 in parallel
      const ext = item.file.name.split('.').pop() || 'png'
      const path = `ai-import/${checkpointId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const [uploadResult, imageBase64] = await Promise.all([
        supabase.storage.from('screenshots').upload(path, item.file, { cacheControl: '3600', upsert: false }),
        toBase64(item.file),
      ])

      let fileUrl: string | undefined
      let storagePath: string | undefined

      if (!uploadResult.error) {
        const { data: { publicUrl } } = supabase.storage.from('screenshots').getPublicUrl(path)
        fileUrl = publicUrl
        storagePath = path
      }
      // Upload failure is non-fatal — we can still analyse

      setFiles(prev => prev.map(f => f.preview === item.preview
        ? { ...f, status: 'analyzing', fileUrl, storagePath } : f))

      // Analyse with Claude Vision using base64 directly
      try {
        const mimeType = item.file.type || 'image/png'
        const res = await fetch('/api/ai/analyze-screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64, mimeType }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Analysis failed')
        }
        const { data } = await res.json()

        setFiles(prev => prev.map(f => f.preview === item.preview
          ? { ...f, status: 'done', extracted: data } : f))
      } catch (err: any) {
        setFiles(prev => prev.map(f => f.preview === item.preview
          ? { ...f, status: 'error', error: err.message || 'Analysis failed' } : f))
      }
    }
  }

  async function handleApplyAll() {
    const merged = mergeExtracted(files)
    if (!merged) return

    setApplying(true)
    setApplyError('')

    try {
      const res = await fetch('/api/ai/apply-checkpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saveId, seasonId, checkpointId, extracted: merged }),
      })

      if (!res.ok) throw new Error('Failed to apply data')
      const { saved } = await res.json()

      // Also register the screenshots in the DB
      const donePics = files.filter(f => f.status === 'done' && f.fileUrl && f.storagePath)
      if (donePics.length > 0) {
        await fetch(`/api/saves/${saveId}/seasons/${seasonId}/checkpoints/${checkpointId}/screenshots`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            screenshots: donePics.map((f, i) => ({
              fileUrl: f.fileUrl,
              storagePath: f.storagePath,
              originalFilename: f.file.name,
              screenshotType: f.extracted?.screenshotType?.replace(/_/g, ' ') || null,
              mimeType: f.file.type || null,
              fileSize: f.file.size || null,
            })),
          }),
        })
      }

      setApplied(saved)
    } catch (err: any) {
      setApplyError(err.message || 'Failed to save data')
    }

    setApplying(false)
  }

  async function handleGenerateDebrief() {
    setDebriefLoading(true)
    setDebriefError('')
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
      const { debrief } = await res.json()
      setDebrief(debrief)
    } catch (err: any) {
      setDebriefError(err.message || 'Failed to generate debrief')
    }
    setDebriefLoading(false)
  }

  const allDone = files.length > 0 && files.every(f => f.status === 'done' || f.status === 'error')
  const anyDone = files.some(f => f.status === 'done')
  const busy = files.some(f => f.status === 'uploading' || f.status === 'analyzing')
  const merged = allDone && anyDone ? mergeExtracted(files) : null

  const statusIcon: Record<FileStatus, string> = {
    pending: '⏳',
    uploading: '⬆️',
    analyzing: '🤖',
    done: '✅',
    error: '❌',
  }
  const statusLabel: Record<FileStatus, string> = {
    pending: 'Queued',
    uploading: 'Uploading...',
    analyzing: 'Analysing...',
    done: 'Done',
    error: 'Failed',
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
          <Link href={base} className="hover:text-zinc-300">Checkpoint</Link>
          <span>/</span>
          <span>AI Import</span>
        </div>
        <h1 className="text-2xl font-bold text-white">🤖 AI Import from Screenshots</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Drop your FM screenshots here. Claude will read every stat, table, and figure automatically, then save it all to this checkpoint in one click.
        </p>
      </div>

      {applied ? (
        <div className="space-y-5 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🎉</span>
              <div>
                <h2 className="font-semibold text-green-800">Data applied successfully!</h2>
                <p className="text-sm text-green-600">Saved: {applied.join(', ')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGenerateDebrief}
                disabled={debriefLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {debriefLoading ? <><span className="animate-spin">⟳</span> Generating...</> : '📋 Generate Debrief'}
              </button>
              <Link
                href={base}
                className="border border-green-300 text-green-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-50"
              >
                Back to checkpoint →
              </Link>
            </div>
            {debriefError && <p className="text-red-500 text-sm mt-2">{debriefError}</p>}
          </div>

          {debrief && <DebriefCard debrief={debrief} base={base} />}
        </div>
      ) : (
        <>
          {/* Drop zone */}
          <div
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-blue-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all mb-6 bg-blue-50/30"
          >
            <div className="text-5xl mb-3">🤖</div>
            <p className="text-sm font-semibold text-blue-800">Drop FM screenshots here</p>
            <p className="text-xs text-blue-500 mt-1">Claude will read them automatically — no manual entry needed</p>
            <p className="text-xs text-zinc-600 mt-2">PNG, JPG, WebP · multiple files supported</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)) }}
            />
          </div>

          {/* File cards */}
          {files.length > 0 && (
            <div className="space-y-3 mb-6">
              {files.map((f, i) => (
                <div key={i} className={`rounded-xl card-panel border p-4 ${
                  f.status === 'done' ? 'border-green-200' :
                  f.status === 'error' ? 'border-red-200' :
                  'border-white/[0.06]'
                }`}>
                  <div className="flex items-start gap-3">
                    <img src={f.preview} alt="" className="w-20 h-14 object-cover rounded-lg border border-white/[0.06] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{statusIcon[f.status]}</span>
                        <p className="text-sm font-medium text-white truncate">{f.file.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-auto ${
                          f.status === 'done' ? 'bg-green-100 text-green-700' :
                          f.status === 'error' ? 'bg-red-100 text-red-600' :
                          f.status === 'analyzing' ? 'bg-purple-100 text-purple-700' :
                          ' text-zinc-500'
                        }`}>
                          {statusLabel[f.status]}
                        </span>
                      </div>
                      {f.status === 'analyzing' && (
                        <p className="text-xs text-purple-600 mt-1 animate-pulse">Claude is reading this screenshot...</p>
                      )}
                      {f.error && <p className="text-xs text-red-500 mt-1">{f.error}</p>}
                      {f.extracted && <DataPreview extracted={f.extracted} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary of what will be saved */}
          {merged && (
            <div className="card-panel border border-blue-200 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-white mb-3">📋 Ready to apply</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {merged.gameDate && <div><span className="text-zinc-500">Game date:</span> <span className="font-medium">{merged.gameDate}</span></div>}
                {merged.transferWindow && <div><span className="text-zinc-500">Transfer window:</span> <span className="font-medium">{merged.transferWindow}</span></div>}
                {merged.clubName && <div><span className="text-zinc-500">Club:</span> <span className="font-medium">{merged.clubName}</span></div>}
                {merged.leagueName && <div><span className="text-zinc-500">League:</span> <span className="font-medium">{merged.leagueName}</span></div>}
                {merged.teamStats?.leaguePosition && <div><span className="text-zinc-500">League pos:</span> <span className="font-medium">{merged.teamStats.leaguePosition}</span></div>}
                {merged.teamStats?.points != null && <div><span className="text-zinc-500">Points:</span> <span className="font-medium">{merged.teamStats.points}</span></div>}
                {merged.leagueTable?.length > 0 && <div><span className="text-zinc-500">League table:</span> <span className="font-medium">{merged.leagueTable.length} teams</span></div>}
                {merged.tactic?.formation && <div><span className="text-zinc-500">Formation:</span> <span className="font-medium">{merged.tactic.formation}</span></div>}
                {merged.finances?.balance != null && <div><span className="text-zinc-500">Balance:</span> <span className="font-medium">£{Number(merged.finances.balance).toLocaleString()}</span></div>}
                {merged.medical?.currentInjuries != null && <div><span className="text-zinc-500">Injuries:</span> <span className="font-medium">{merged.medical.currentInjuries}</span></div>}
                {merged.playerStats?.length > 0 && <div><span className="text-zinc-500">Players:</span> <span className="font-medium">{merged.playerStats.length} found</span></div>}
              </div>
            </div>
          )}

          {applyError && (
            <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-600 mb-4">
              {applyError}
            </div>
          )}

          <div className="flex gap-3">
            {anyDone && !busy && (
              <button
                onClick={handleApplyAll}
                disabled={applying}
                className="bg-white text-black px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {applying ? (
                  <>Saving... <span className="animate-spin">⟳</span></>
                ) : (
                  <>✅ Apply All & Save to Checkpoint</>
                )}
              </button>
            )}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                <span className="animate-spin inline-block">⟳</span>
                Analysing screenshots...
              </div>
            )}
            <Link href={base} className="border border-white/10 text-zinc-300 px-5 py-2 rounded-lg text-sm font-medium hover:">
              Cancel
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
