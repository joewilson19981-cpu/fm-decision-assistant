import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  todo:        { background: 'rgba(255,255,255,0.06)', color: '#888888', border: '1px solid rgba(255,255,255,0.08)' },
  in_progress: { background: 'rgba(96,165,250,0.1)',  color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' },
  done:        { background: 'rgba(52,211,153,0.1)',  color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' },
  dismissed:   { background: 'rgba(255,255,255,0.04)', color: '#444444', border: '1px solid rgba(255,255,255,0.06)' },
}

const STATUS_ORDER = ['in_progress', 'todo', 'done', 'dismissed']

export default async function ActionPlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const items = await prisma.actionItem.findMany({
    where: { save: { userId: user.id } },
    include: { save: true, season: true },
    orderBy: [{ createdAt: 'desc' }],
  })

  const grouped = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = items.filter(i => i.status === s)
    return acc
  }, {} as Record<string, typeof items>)

  return (
    <div className="px-6 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Action Plan</h1>
        <p className="text-[13px] mt-0.5" style={{ color: '#555' }}>
          Things to action across your saves
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl p-12 text-center"
          style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-4xl mb-3">📝</p>
          <h2 className="text-base font-semibold text-white mb-1">No action items yet</h2>
          <p className="text-sm max-w-sm mx-auto mb-4" style={{ color: '#555' }}>
            The Assistant will generate action items as you send checkpoint data — things to fix, players to sign, tactics to adjust.
          </p>
          <Link href="/dashboard/assistant"
            className="inline-block text-sm font-medium px-4 py-2 rounded-lg text-black bg-white hover:bg-zinc-200 transition-colors">
            Open Assistant
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {STATUS_ORDER.map(status => {
            const groupItems = grouped[status] ?? []
            if (groupItems.length === 0) return null
            return (
              <div key={status}>
                <p className="text-[10px] font-medium uppercase tracking-widest mb-2.5" style={{ color: '#333' }}>
                  {status.replace('_', ' ')} ({groupItems.length})
                </p>
                <div className="space-y-2">
                  {groupItems.map(item => (
                    <div key={item.id} className="rounded-xl px-5 py-4 flex items-start justify-between gap-4"
                      style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[14px] font-semibold text-white">{item.title}</h3>
                        {item.description && (
                          <p className="text-[13px] mt-0.5" style={{ color: '#666' }}>{item.description}</p>
                        )}
                        <p className="text-[11px] mt-1" style={{ color: '#444' }}>
                          {item.save.name}{item.season ? ` · ${item.season.seasonLabel}` : ''}
                        </p>
                      </div>
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg flex-shrink-0"
                        style={STATUS_STYLES[item.status] ?? STATUS_STYLES.todo}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
