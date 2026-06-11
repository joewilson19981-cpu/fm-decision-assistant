import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const STATUS_STYLES: Record<string, string> = {
  todo: ' text-zinc-400',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  dismissed: ' text-zinc-600',
}

export default async function ActionPlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const items = await prisma.actionItem.findMany({
    where: { save: { userId: user.id } },
    include: { save: true, season: true },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })

  const grouped = {
    todo: items.filter(i => i.status === 'todo'),
    in_progress: items.filter(i => i.status === 'in_progress'),
    done: items.filter(i => i.status === 'done'),
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Action Plan</h1>
        <p className="text-zinc-500 text-sm mt-1">Things to do across your saves</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl card-panel border border-white/[0.06] p-10 text-center">
          <div className="text-4xl mb-3">📝</div>
          <h2 className="text-lg font-semibold text-white mb-2">No action items yet</h2>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Action items will appear here as you progress through your seasons and checkpoints.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([status, groupItems]) =>
            groupItems.length === 0 ? null : (
              <div key={status}>
                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                  {status.replace('_', ' ')} ({groupItems.length})
                </h2>
                <div className="space-y-2">
                  {groupItems.map(item => (
                    <div key={item.id} className="rounded-xl card-panel border border-white/[0.06] p-4 flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-white">{item.title}</h3>
                        {item.description && <p className="text-sm text-zinc-500 mt-0.5">{item.description}</p>}
                        <p className="text-xs text-zinc-600 mt-1">{item.save.name}{item.season && ` · ${item.season.seasonLabel}`}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ml-4 shrink-0 ${STATUS_STYLES[item.status] ?? STATUS_STYLES.todo}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
