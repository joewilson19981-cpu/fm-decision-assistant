'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteSaveButton({ saveId, saveName }: { saveId: string; saveName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${saveName}"? This cannot be undone.`)) return
    setLoading(true)
    await fetch(`/api/saves/${saveId}`, { method: 'DELETE' })
    router.push('/dashboard/saves')
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? 'Deleting...' : 'Delete Save'}
    </button>
  )
}
