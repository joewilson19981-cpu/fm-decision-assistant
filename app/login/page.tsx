'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#080808' }}
    >
      <div className="w-full max-w-sm px-6">
        {/* Brand */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white mb-5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#080808" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white">FM Assistant</h1>
          <p className="text-sm mt-1" style={{ color: '#555555' }}>Career analytics for Football Manager</p>
        </div>

        {/* Form */}
        <div
          className="rounded-2xl p-6"
          style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#888888' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
                style={{ background: '#080808', border: '1px solid rgba(255,255,255,0.08)' }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#888888' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
                style={{ background: '#080808', border: '1px solid rgba(255,255,255,0.08)' }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-[13px] rounded-xl px-3.5 py-2.5" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-40 hover:opacity-90 mt-1"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[13px] mt-5" style={{ color: '#555555' }}>
            No account?{' '}
            <Link href="/register" className="text-white hover:opacity-70 transition-opacity">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
