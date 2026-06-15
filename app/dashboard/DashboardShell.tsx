'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, X } from 'lucide-react'
import dynamic from 'next/dynamic'

// Lazy-load the panel so it doesn't add weight to every page load
const AssistantPanel = dynamic(() => import('./AssistantPanel'), { ssr: false })

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [panelOpen, setPanelOpen] = useState(false)

  // Persist panel state across navigation
  useEffect(() => {
    const saved = localStorage.getItem('fm-assistant-panel')
    if (saved === 'open') setPanelOpen(true)
  }, [])

  function togglePanel() {
    setPanelOpen(prev => {
      const next = !prev
      localStorage.setItem('fm-assistant-panel', next ? 'open' : 'closed')
      return next
    })
  }

  return (
    <>
      {/* Main content — shrinks when panel is open */}
      <main
        className="flex-1 min-h-screen transition-all duration-200"
        style={{
          marginRight: panelOpen ? '380px' : '0px',
          padding: '24px',
        }}
      >
        {children}
      </main>

      {/* Toggle button — always visible, top-right of viewport */}
      <button
        onClick={togglePanel}
        className="fixed z-40 flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium transition-all shadow-lg"
        style={{
          top: '10px',
          right: panelOpen ? '392px' : '16px',
          background: panelOpen ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: panelOpen ? '#888' : '#ffffff',
          transition: 'right 200ms ease, background 150ms ease',
        }}
      >
        {panelOpen ? <X size={13} /> : <MessageSquare size={13} />}
        <span>{panelOpen ? 'Close' : 'Assistant'}</span>
      </button>

      {/* Assistant panel — fixed right column */}
      {panelOpen && (
        <div
          className="fixed top-0 right-0 bottom-0 z-30 flex flex-col"
          style={{
            width: '380px',
            borderLeft: '1px solid rgba(255,255,255,0.07)',
            background: '#080808',
          }}
        >
          <AssistantPanel onClose={() => {
            setPanelOpen(false)
            localStorage.setItem('fm-assistant-panel', 'closed')
          }} />
        </div>
      )}
    </>
  )
}
