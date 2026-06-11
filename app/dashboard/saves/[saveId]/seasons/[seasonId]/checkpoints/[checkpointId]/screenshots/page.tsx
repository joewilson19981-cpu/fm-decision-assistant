'use client'

import { useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const SCREENSHOT_TYPES = [
  'League table', 'Match result', 'Team stats', 'Player stats',
  'Tactic', 'Finances', 'Transfer', 'Training', 'Other'
]

type UploadedFile = {
  id?: string
  file?: File
  preview: string
  type: string
  originalFilename: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  fileUrl?: string
  storagePath?: string
}

export default function ScreenshotsPage() {
  const params = useParams()
  const { saveId, seasonId, checkpointId } = params as Record<string, string>
  const base = `/dashboard/saves/${saveId}/seasons/${seasonId}/checkpoints/${checkpointId}`

  const [files, setFiles] = useState<UploadedFile[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    addFiles(dropped)
  }, [])

  function addFiles(newFiles: File[]) {
    const items: UploadedFile[] = newFiles.map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
      type: '',
      originalFilename: f.name,
      status: 'pending',
    }))
    setFiles(prev => [...prev, ...items])
  }

  function removeFile(i: number) {
    setFiles(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateType(i: number, type: string) {
    setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, type } : f))
  }

  async function handleSave() {
    const pending = files.filter(f => f.status === 'pending' && f.file)
    if (pending.length === 0) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    const uploaded: UploadedFile[] = []

    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      if (f.status !== 'pending' || !f.file) continue

      setFiles(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'uploading' } : item))

      const ext = f.file.name.split('.').pop()
      const path = `${checkpointId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('screenshots')
        .upload(path, f.file, { cacheControl: '3600', upsert: false })

      if (uploadErr) {
        setFiles(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'error' } : item))
        continue
      }

      const { data: { publicUrl } } = supabase.storage.from('screenshots').getPublicUrl(path)

      setFiles(prev => prev.map((item, idx) => idx === i
        ? { ...item, status: 'done', fileUrl: publicUrl, storagePath: path }
        : item
      ))

      uploaded.push({ ...f, fileUrl: publicUrl, storagePath: path })
    }

    if (uploaded.length > 0) {
      const res = await fetch(`/api/saves/${saveId}/seasons/${seasonId}/checkpoints/${checkpointId}/screenshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshots: uploaded.map(u => ({
            fileUrl: u.fileUrl,
            storagePath: u.storagePath,
            originalFilename: u.originalFilename,
            screenshotType: u.type || null,
            mimeType: u.file?.type || null,
            fileSize: u.file?.size || null,
          })),
        }),
      })

      if (!res.ok) {
        setError('Files uploaded but failed to save records')
      } else {
        setSaved(true)
      }
    }

    setSaving(false)
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
          <Link href={base} className="hover:text-zinc-300">Checkpoint</Link>
          <span>/</span>
          <span>Screenshots</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Screenshots</h1>
        <p className="text-zinc-500 text-sm mt-1">Upload screenshots from your FM save. Drag and drop or click to select.</p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-white/10 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all mb-6"
      >
        <div className="text-4xl mb-2">📸</div>
        <p className="text-sm font-medium text-zinc-300">Drop screenshots here or click to browse</p>
        <p className="text-xs text-zinc-600 mt-1">PNG, JPG, WebP — any number of files</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)) }}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3 mb-6">
          {files.map((f, i) => (
            <div key={i} className="rounded-xl card-panel border border-white/[0.06] p-3 flex items-center gap-4">
              <img src={f.preview} alt="" className="w-16 h-12 object-cover rounded-lg shrink-0 border border-white/[0.06]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{f.originalFilename}</p>
                <select
                  value={f.type}
                  onChange={e => updateType(i, e.target.value)}
                  className="mt-1 border border-white/[0.06] rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  <option value="">No category</option>
                  {SCREENSHOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {f.status === 'uploading' && <span className="text-xs text-blue-500">Uploading...</span>}
                {f.status === 'done' && <span className="text-xs text-green-600">✓ Done</span>}
                {f.status === 'error' && <span className="text-xs text-red-500">Failed</span>}
                {f.status === 'pending' && (
                  <button onClick={() => removeFile(i)} className="text-zinc-600 hover:text-red-400 text-sm">✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">{error}</p>}
      {saved && <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded px-3 py-2 mb-4">Screenshots saved successfully!</p>}

      <div className="flex gap-3">
        {files.some(f => f.status === 'pending') && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-white text-black px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Uploading...' : `Upload ${files.filter(f => f.status === 'pending').length} screenshot${files.filter(f => f.status === 'pending').length !== 1 ? 's' : ''}`}
          </button>
        )}
        <Link href={base} className="border border-white/10 text-zinc-300 px-5 py-2 rounded-lg text-sm font-medium hover:">
          {saved ? 'Back to checkpoint' : 'Cancel'}
        </Link>
      </div>
    </div>
  )
}
