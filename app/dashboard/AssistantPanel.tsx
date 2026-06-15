'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Paperclip, Send, X, Loader2, CheckCircle2, Zap, Camera, AlertCircle } from 'lucide-react'

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

// ── Minimal markdown renderer ─────────────────────────────────────────────────

function renderMessage(text: string) {
  return text.split('\n').map((line, i) => {
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
      <p key={i} className="leading-relaxed mb-0.5" style={{
        color: isCheck ? '#34d399' : isMiss ? '#f87171' : '#cccccc',
        fontSize: '13px',
      }}>
        {rendered}
      </p>
    )
  })
}

// ── Mini checklist ────────────────────────────────────────────────────────────

function MiniChecklist({ checklist }: { checklist: ChecklistData }) {
  const required = checklist.items.filter(i => i.required)
  const found = required.filter(i => i.found).length
  const pct = required.length > 0 ? Math.round((found / required.length) * 100) : 100

  return (
    <div className="mt-2 rounded-lg overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#111' }}>
      <div className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#0f0f0f' }}>
        <div className="flex items-center gap-1.5">
          <Camera size={11} style={{ color: '#888' }} />
          <span className="text-[11px] font-semibold text-white">{checklist.gamesPlayed}G checkpoint</span>
        </div>
        <span className="text-[10px]" style={{ color: checklist.complete ? '#34d399' : '#fbbf24' }}>
          {found}/{required.length} required
        </span>
      </div>
      <div className="px-3 py-2 space-y-1">
        {checklist.items.map(item => (
          <div key={item.key} className="flex items-center gap-2">
            {item.found
              ? <CheckCircle2 size={10} style={{ color: '#34d399', flexShrink: 0 }} />
              : <AlertCircle size={10} style={{ color: item.required ? '#f87171' : '#444', flexShrink: 0 }} />
            }
            <span className="text-[11px]" style={{ color: item.found ? '#888' : item.required ? '#ccc' : '#555' }}>
              {item.label}{!item.required && <span style={{ color: '#444' }}> (opt)</span>}
            </span>
          </div>
        ))}
      </div>
      {!checklist.complete && checklist.missingRequired.length > 0 && (
        <div className="px-3 py-1.5 border-t text-[10px]"
          style={{ borderColor: 'rgba(255,255,255,0.04)', color: '#fbbf24', background: 'rgba(251,191,36,0.04)' }}>
          Still needed: {checklist.missingRequired.join(', ')}
        </div>
      )}
    </div>
  )
}

// ── Milestone selector ────────────────────────────────────────────────────────

function MilestoneSelector({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <span className="text-[10px] mr-0.5" style={{ color: '#444' }}>at</span>
      {[10, 23, 35, 46].map(g => (
        <button
          key={g}
          onClick={() => onChange(g)}
          className="px-2 py-0.5 rounded text-[11px] font-medium transition-all"
          style={value === g
            ? { background: '#ffffff', color: '#080808' }
            : { color: '#555' }
          }
        >
          {g}
        </button>
      ))}
      <span className="text-[10px] ml-0.5" style={{ color: '#444' }}>G</span>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function AssistantPanel({ onClose }: { onClose: () => void }) {
  const [saves, setSaves]       = useState<Save[]>([])
  const [saveId, setSaveId]     = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [images, setImages]     = useState<AttachedImage[]>([])
  const [gamesPlayed, setGamesPlayed] = useState<number | null>(null)
  const [loading, setLoading]   = useState(false)
  const [hasSaves, setHasSaves] = useState<boolean | null>(null)

  const bottomRef   = useRef<HTMLDivElement>(null)
  const fileRef     = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load saves
  useEffect(() => {
    fetch('/api/saves').then(r => r.json()).then((list: Save[]) => {
      setSaves(list || [])
      setHasSaves((list || []).length > 0)
      if (list?.length) setSaveId(list[0].id)
    })
  }, [])

  // Greeting
  useEffect(() => {
    if (hasSaves === null) return
    const greeting: Message = hasSaves
      ? { id: 'init', role: 'assistant', content: `Hey — what's up? Ask me anything or drop screenshots in for a checkpoint update.` }
      : { id: 'init', role: 'assistant', content: `No save set up yet. Head to the **Assistant** page to get started with your first save.` }
    setMessages([greeting])
  }, [hasSaves])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }, [input])

  const addFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).filter(f => f.type.startsWith('image/')).forEach(file => {
      const preview = URL.createObjectURL(file)
      const img: AttachedImage = { id: Math.random().toString(36).slice(2), file, preview }
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, base64 } : i))
      }
      reader.readAsDataURL(file)
      setImages(prev => [...prev, img])
    })
  }, [])

  async function send() {
    const text = input.trim()
    const hasImages = images.length > 0
    if (!text && !hasImages) return
    if (loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text || `${images.length} screenshot${images.length !== 1 ? 's' : ''} sent`,
      images: images.map(i => i.preview),
    }

    setMessages(prev => [...prev, userMsg, { id: 'loading', role: 'assistant', content: '', isLoading: true }])
    setInput('')
    const sentImages = [...images]
    setImages([])
    setLoading(true)

    const imagePayloads = await Promise.all(
      sentImages.map(async img => {
        const base64 = img.base64 || await new Promise<string>(resolve => {
          const reader = new FileReader()
          reader.onload = () => resolve((reader.result as string).split(',')[1])
          reader.readAsDataURL(img.file)
        })
        return { base64, mimeType: img.file.type || 'image/png', filename: img.file.name }
      })
    )

    const history = messages
      .filter(m => !m.isLoading && m.id !== 'init')
      .map(m => ({ role: m.role, content: m.content }))
    if (text) history.push({ role: 'user', content: text })

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          saveId,
          images: imagePayloads.length > 0 ? imagePayloads : undefined,
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
      setMessages(prev => prev.filter(m => m.id !== 'loading').concat({
        id: Date.now().toString() + '_ai',
        role: 'assistant',
        content: data.error ? `Error: ${data.error}` : data.message,
        savedItems: data.saved?.length > 0 ? data.saved : undefined,
        youthUpdated: data.youthUpdated?.length > 0 ? data.youthUpdated : undefined,
        checklist: data.checklist ?? undefined,
      }))
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== 'loading').concat({
        id: Date.now().toString() + '_err',
        role: 'assistant',
        content: `Something went wrong — ${err.message}`,
      }))
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const currentSave = saves.find(s => s.id === saveId)

  return (
    <div className="flex flex-col h-full" style={{ background: '#080808' }}>

      {/* Panel header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 h-11 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0a0a0a' }}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: '#ffffff' }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#080808" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-white truncate">
            {currentSave ? (currentSave.currentClub || currentSave.name) : 'Assistant'}
          </span>
          {saves.length > 1 && (
            <select
              value={saveId || ''}
              onChange={e => setSaveId(e.target.value)}
              className="text-[11px] bg-transparent border-none outline-none truncate"
              style={{ color: '#555', maxWidth: 80 }}
            >
              {saves.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#101010' }}>
                  {s.currentClub || s.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <button onClick={onClose}
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 flex-shrink-0"
          style={{ color: '#555' }}>
          <X size={13} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="flex items-start gap-2 max-w-[90%]">
                <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#080808" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  {msg.isLoading ? (
                    <div className="flex items-center gap-1.5 py-1">
                      <Loader2 size={12} className="animate-spin" style={{ color: '#555' }} />
                      <span className="text-[12px]" style={{ color: '#555' }}>Thinking…</span>
                    </div>
                  ) : (
                    <>
                      <div>{renderMessage(msg.content)}</div>
                      {msg.checklist && <MiniChecklist checklist={msg.checklist} />}
                      {(msg.savedItems?.length || msg.youthUpdated?.length) ? (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {msg.savedItems?.map(item => (
                            <span key={item} className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.15)' }}>
                              <CheckCircle2 size={8} />{item.replace(/_/g, ' ')}
                            </span>
                          ))}
                          {msg.youthUpdated?.map(name => (
                            <span key={name} className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.15)' }}>
                              <Zap size={8} />{name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            )}

            {msg.role === 'user' && (
              <div className="max-w-[85%] space-y-1.5">
                {msg.images && msg.images.length > 0 && (
                  <div className={`grid gap-1 ${msg.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {msg.images.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={src} alt="" className="rounded-lg w-full object-cover max-h-28"
                        style={{ border: '1px solid rgba(255,255,255,0.06)' }} />
                    ))}
                  </div>
                )}
                {msg.content && (
                  <div className="rounded-xl rounded-tr-sm px-3 py-2 text-[13px] text-white"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {msg.content}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-3 pb-4 pt-2 border-t space-y-2"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#090909' }}>

        {/* Milestone selector — when images or save exists */}
        {(images.length > 0 || hasSaves) && (
          <MilestoneSelector value={gamesPlayed} onChange={setGamesPlayed} />
        )}

        {/* Image thumbs */}
        {images.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {images.map(img => (
              <div key={img.id} className="relative rounded overflow-hidden w-12 h-12 group flex-shrink-0"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => { URL.revokeObjectURL(img.preview); setImages(prev => prev.filter(i => i.id !== img.id)) }}
                  className="absolute top-0 right-0 w-4 h-4 rounded-bl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(239,68,68,0.9)' }}>
                  <X size={7} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="flex items-end gap-1.5 rounded-xl p-2.5"
          style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.08)' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={images.length > 0 ? 'Add note or send…' : 'Ask anything…'}
            rows={1}
            className="flex-1 bg-transparent text-[13px] text-white placeholder-zinc-700 resize-none outline-none"
            style={{ maxHeight: '120px', lineHeight: '1.5' }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: '#555' }}>
              <Paperclip size={13} />
            </button>
            <button
              onClick={send}
              disabled={loading || (!input.trim() && images.length === 0)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: '#ffffff', color: '#080808' }}>
              {loading ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
            </button>
          </div>
        </div>

        <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)} />
      </div>
    </div>
  )
}
