'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Paperclip, Send, X, Loader2, CheckCircle2, AlertCircle, Zap, Camera } from 'lucide-react'

interface Save {
  id: string
  name: string
  currentClub: string | null
}

interface ChecklistItem {
  key: string
  label: string
  required: boolean
  found: boolean
  screenshotHint: string
}

interface ChecklistData {
  gamesPlayed: number
  items: ChecklistItem[]
  complete: boolean
  missingRequired: string[]
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: string[]
  savedItems?: string[]
  youthUpdated?: string[]
  checklist?: ChecklistData
  isLoading?: boolean
}

interface AttachedImage {
  id: string
  file: File
  preview: string
  base64?: string
}

// ── Markdown-lite renderer ────────────────────────────────────────────────────

function renderMessage(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) return <br key={i} />

    const isCheck = trimmed.startsWith('✅')
    const isMiss  = trimmed.startsWith('❌')

    const parts = trimmed.split(/(\*\*[^*]+\*\*)/)
    const rendered = parts.map((p, j) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={j} className="text-white font-semibold">{p.slice(2, -2)}</strong>
        : <span key={j}>{p}</span>
    )

    return (
      <p
        key={i}
        className="leading-relaxed mb-1"
        style={{
          color: isCheck ? '#34d399' : isMiss ? '#f87171' : '#cccccc',
          fontSize: '14px',
        }}
      >
        {rendered}
      </p>
    )
  })
}

// ── Checkpoint checklist card ─────────────────────────────────────────────────

function ChecklistCard({ checklist }: { checklist: ChecklistData }) {
  const required = checklist.items.filter(i => i.required)
  const optional = checklist.items.filter(i => !i.required)
  const foundRequired = required.filter(i => i.found).length
  const pct = required.length > 0 ? Math.round((foundRequired / required.length) * 100) : 100

  return (
    <div className="mt-3 rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0d0d0d' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#111111' }}>
        <div className="flex items-center gap-2">
          <Camera size={13} style={{ color: '#888888' }} />
          <span className="text-xs font-semibold text-white">{checklist.gamesPlayed} Game Checkpoint</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1 w-20 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: checklist.complete ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171',
              }}
            />
          </div>
          <span className="text-[10px] font-medium" style={{
            color: checklist.complete ? '#34d399' : '#fbbf24',
          }}>
            {foundRequired}/{required.length} required
          </span>
        </div>
      </div>

      {/* Required items */}
      <div className="px-4 pt-3 pb-2 space-y-1.5">
        <p className="text-[10px] font-medium uppercase tracking-widest mb-2" style={{ color: '#444444' }}>Required</p>
        {required.map(item => (
          <div key={item.key} className="flex items-start gap-2.5">
            <div className="mt-0.5 flex-shrink-0">
              {item.found
                ? <CheckCircle2 size={13} style={{ color: '#34d399' }} />
                : <AlertCircle size={13} style={{ color: '#f87171' }} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[13px]" style={{ color: item.found ? '#ffffff' : '#888888' }}>
                {item.label}
              </span>
              {!item.found && (
                <p className="text-[11px] mt-0.5" style={{ color: '#555555' }}>
                  {item.screenshotHint}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Optional items */}
      {optional.length > 0 && (
        <div className="px-4 pb-3 pt-1 space-y-1.5 border-t mt-2" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <p className="text-[10px] font-medium uppercase tracking-widest mb-2 mt-2" style={{ color: '#333333' }}>Optional</p>
          {optional.map(item => (
            <div key={item.key} className="flex items-center gap-2.5">
              <div className="flex-shrink-0">
                {item.found
                  ? <CheckCircle2 size={11} style={{ color: '#22c55e', opacity: 0.7 }} />
                  : <div className="w-[11px] h-[11px] rounded-full border" style={{ borderColor: '#333333' }} />
                }
              </div>
              <span className="text-[12px]" style={{ color: item.found ? '#666666' : '#444444' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Completion banner / missing prompt */}
      {checklist.complete ? (
        <div className="mx-3 mb-3 px-3 py-2 rounded-lg text-xs font-medium text-center"
          style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.15)' }}>
          ✓ Checkpoint complete — all data saved
        </div>
      ) : (
        <div className="mx-3 mb-3 px-3 py-2 rounded-lg text-xs"
          style={{ background: 'rgba(251,191,36,0.06)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.12)' }}>
          Missing: {checklist.missingRequired.join(', ')} — send those screenshots to complete this checkpoint
        </div>
      )}
    </div>
  )
}

// ── Game milestone selector ───────────────────────────────────────────────────

function MilestoneSelector({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <span className="text-xs" style={{ color: '#555555' }}>Update at</span>
      {[10, 23, 35, 46].map(g => (
        <button
          key={g}
          onClick={() => onChange(g)}
          className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
          style={value === g
            ? { background: '#ffffff', color: '#080808' }
            : { color: '#555555', background: 'transparent' }
          }
        >
          {g}
        </button>
      ))}
      <span className="text-xs ml-1" style={{ color: '#444444' }}>games</span>
    </div>
  )
}

export default function AssistantPage() {
  const [saves, setSaves]         = useState<Save[]>([])
  const [saveId, setSaveId]       = useState<string | null>(null)
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [images, setImages]       = useState<AttachedImage[]>([])
  const [gamesPlayed, setGamesPlayed] = useState<number | null>(null)
  const [loading, setLoading]     = useState(false)
  const [hasSaves, setHasSaves]   = useState<boolean | null>(null)

  const bottomRef   = useRef<HTMLDivElement>(null)
  const fileRef     = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch('/api/saves').then(r => r.json()).then(data => {
      const list: Save[] = data || []
      setSaves(list)
      setHasSaves(list.length > 0)
      if (list.length > 0) setSaveId(list[0].id)
    })
  }, [])

  useEffect(() => {
    if (hasSaves === null) return

    const greeting: Message = hasSaves
      ? {
          id: 'init',
          role: 'assistant',
          content: `Hey — what's up? Drop your screenshots in whenever you hit a milestone, or just ask me anything about your save.\n\nFor a checkpoint update, pick your game count using the selector above the send button, then dump all your screenshots in at once.`,
        }
      : {
          id: 'init',
          role: 'assistant',
          content: `Let's get your save set up.\n\nSend me a screenshot of your **squad overview** screen in FM to get started — I'll pull in all your players automatically.`,
        }

    setMessages([greeting])
  }, [hasSaves])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [input])

  // Resize image to max 1024px wide — keeps text readable, cuts payload ~80%
  const resizeImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new window.Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const MAX = 1024
        const ratio = Math.min(1, MAX / img.width)
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1])
      }
      img.src = url
    })
  }, [])

  const addFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).filter(f => f.type.startsWith('image/')).forEach(file => {
      const preview = URL.createObjectURL(file)
      const img: AttachedImage = { id: Math.random().toString(36).slice(2), file, preview }
      resizeImage(file).then(base64 => {
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, base64 } : i))
      })
      setImages(prev => [...prev, img])
    })
  }, [resizeImage])

  async function send() {
    const text = input.trim()
    const hasImages = images.length > 0
    if (!text && !hasImages) return
    if (loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text || `Sent ${images.length} screenshot${images.length !== 1 ? 's' : ''}`,
      images: images.map(i => i.preview),
    }

    const loadingMsg: Message = {
      id: 'loading',
      role: 'assistant',
      content: '',
      isLoading: true,
    }

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setInput('')
    const sentImages = [...images]
    setImages([])
    setLoading(true)

    // Wait for all resizes to complete (they run in background when files are added)
    const imagePayloads = await Promise.all(
      sentImages.map(async img => {
        const base64 = img.base64 || await resizeImage(img.file)
        return { base64, mimeType: 'image/jpeg', filename: img.file.name }
      })
    )

    const history = messages
      .filter(m => !m.isLoading && m.id !== 'init')
      .map(m => ({ role: m.role, content: m.content }))

    if (text) history.push({ role: 'user', content: text })

    try {
      // Step 1: Extract data from images (fast dedicated endpoint)
      let extractedData: any = null
      if (imagePayloads.length > 0) {
        const extractRes = await fetch('/api/ai/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: imagePayloads }),
        })
        if (extractRes.ok) {
          extractedData = await extractRes.json()
        }
      }

      // Step 2: Chat — send extracted JSON (not images) to keep payload tiny
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          saveId,
          extractedData: extractedData || undefined,
          imageCount: imagePayloads.length || undefined,
          gamesPlayed: gamesPlayed ?? undefined,
          intent: !saveId ? 'setup' : hasImages && gamesPlayed ? 'checkpoint' : 'chat',
        }),
      })

      const data = await res.json()

      if (data.newSaveId) {
        setSaveId(data.newSaveId)
        setHasSaves(true)
        const newSaves = await fetch('/api/saves').then(r => r.json())
        setSaves(newSaves || [])
      }

      const aiMsg: Message = {
        id: Date.now().toString() + '_ai',
        role: 'assistant',
        content: data.error ? `Something went wrong: ${data.error}` : data.message,
        savedItems: data.saved?.length > 0 ? data.saved : undefined,
        youthUpdated: data.youthUpdated?.length > 0 ? data.youthUpdated : undefined,
        checklist: data.checklist ?? undefined,
      }

      setMessages(prev => prev.filter(m => m.id !== 'loading').concat(aiMsg))
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== 'loading').concat({
        id: Date.now().toString() + '_err',
        role: 'assistant',
        content: `Something went wrong — ${err.message}. Try again.`,
      }))
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const currentSave = saves.find(s => s.id === saveId)

  return (
    <div className="flex flex-col h-[calc(100vh-0px)]" style={{ background: '#080808' }}>

      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 h-12 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0a0a0a' }}>
        <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center flex-shrink-0">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#080808" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
          </svg>
        </div>
        <span className="text-sm font-semibold text-white">FM Assistant</span>

        {saves.length > 1 && (
          <>
            <span className="text-sm" style={{ color: '#333333' }}>·</span>
            <select
              value={saveId || ''}
              onChange={e => setSaveId(e.target.value)}
              className="text-xs bg-transparent border-none outline-none"
              style={{ color: '#888888' }}
            >
              {saves.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#101010' }}>
                  {s.currentClub || s.name}
                </option>
              ))}
            </select>
          </>
        )}

        {currentSave && saves.length === 1 && (
          <span className="text-xs" style={{ color: '#555555' }}>
            {currentSave.currentClub || currentSave.name}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="flex items-start gap-3 max-w-[85%]">
                  {/* AI avatar */}
                  <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#080808" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    {msg.isLoading ? (
                      <div className="flex items-center gap-2 py-1">
                        <Loader2 size={14} className="animate-spin" style={{ color: '#555555' }} />
                        <span className="text-sm" style={{ color: '#555555' }}>Thinking…</span>
                      </div>
                    ) : (
                      <>
                        <div>{renderMessage(msg.content)}</div>

                        {/* Checklist card — shown after screenshot processing */}
                        {msg.checklist && <ChecklistCard checklist={msg.checklist} />}

                        {/* Saved data chips */}
                        {msg.savedItems && msg.savedItems.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {msg.savedItems.map(item => (
                              <span key={item} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md"
                                style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                                <CheckCircle2 size={9} />
                                {item.replace(/_/g, ' ')}
                              </span>
                            ))}
                            {msg.youthUpdated && msg.youthUpdated.map(name => (
                              <span key={name} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md"
                                style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                                <Zap size={9} /> {name}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {msg.role === 'user' && (
                <div className="max-w-[80%] space-y-2">
                  {/* Image previews */}
                  {msg.images && msg.images.length > 0 && (
                    <div className={`grid gap-1.5 ${msg.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {msg.images.map((src, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={src} alt="" className="rounded-xl w-full object-cover max-h-40"
                          style={{ border: '1px solid rgba(255,255,255,0.06)' }} />
                      ))}
                    </div>
                  )}
                  {/* Text bubble */}
                  {msg.content && !(msg.images?.length && !input) && (
                    <div className="rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {msg.content}
                    </div>
                  )}
                  {/* Image-only label */}
                  {msg.images?.length && !input && (
                    <div className="rounded-2xl rounded-tr-sm px-4 py-2 text-xs"
                      style={{ background: 'rgba(255,255,255,0.04)', color: '#888888' }}>
                      {msg.images.length} screenshot{msg.images.length !== 1 ? 's' : ''} sent
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 pb-5 pt-3 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#090909' }}>
        <div className="max-w-2xl mx-auto space-y-2">
          {/* Milestone selector — shown when images are attached or user has a save */}
          {(images.length > 0 || hasSaves) && (
            <MilestoneSelector value={gamesPlayed} onChange={setGamesPlayed} />
          )}

          {/* Image thumbnails */}
          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {images.map(img => (
                <div key={img.id} className="relative rounded-lg overflow-hidden w-16 h-16 group flex-shrink-0"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      URL.revokeObjectURL(img.preview)
                      setImages(prev => prev.filter(i => i.id !== img.id))
                    }}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(239,68,68,0.9)' }}
                  >
                    <X size={8} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Text input + buttons */}
          <div className="flex items-end gap-2 rounded-2xl p-3"
            style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.08)' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={images.length > 0 ? 'Add a note or just hit send…' : 'Ask anything, or drop screenshots in…'}
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 resize-none outline-none min-h-[20px]"
              style={{ maxHeight: '160px', lineHeight: '1.5' }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
            />
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ color: '#555555' }}
              >
                <Paperclip size={15} />
              </button>
              <button
                onClick={send}
                disabled={loading || (!input.trim() && images.length === 0)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: '#ffffff', color: '#080808' }}
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files && addFiles(e.target.files)}
          />
        </div>
      </div>
    </div>
  )
}
