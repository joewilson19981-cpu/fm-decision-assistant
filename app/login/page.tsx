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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#070c1b' }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-sm mx-4">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">FM Assistant</h1>
          <p className="text-sm mt-1" style={{ color: '#4a5e80' }}>Career Analytics</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7" style={{ background: '#0d1628', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-lg font-bold text-white mb-1">Sign in</h2>
          <p className="text-sm mb-6" style={{ color: '#4a5e80' }}>Access your saves and career stats</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4a5e80' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
                style={{ background: '#080f1e', border: '1px solid rgba(255,255,255,0.08)' }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4a5e80' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
                style={{ background: '#080f1e', border: '1px solid rgba(255,255,255,0.08)' }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: '#4a5e80' }}>
            No account?{' '}
            <Link href="/register" style={{ color: '#818cf8' }} className="hover:text-indigo-300 transition-colors">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
