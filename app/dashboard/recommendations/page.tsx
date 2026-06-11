import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const TYPE_COLORS: Record<string, string> = {
  tactical: 'bg-purple-100 text-purple-700',
  recruitment: 'bg-blue-100 text-blue-700',
  financial: 'bg-green-100 text-green-700',
  development: 'bg-amber-100 text-amber-700',
  general: ' text-zinc-400',
}

export default async function RecommendationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const recommendations = await prisma.recommendation.findMany({
    where: { save: { userId: user.id } },
    include: { save: true, season: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Recommendations</h1>
        <p className="text-zinc-500 text-sm mt-1">Decision support across your saves</p>
      </div>

      {recommendations.length === 0 ? (
        <div className="rounded-xl card-panel border border-white/[0.06] p-10 text-center">
          <div className="text-4xl mb-3">⭐</div>
          <h2 className="text-lg font-semibold text-white mb-2">No recommendations yet</h2>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Recommendations will appear here as you enter data into your checkpoints. In a future phase, these will be generated automatically based on your stats.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map(rec => (
            <div key={rec.id} className="rounded-xl card-panel border border-white/[0.06] p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[rec.type] ?? TYPE_COLORS.general}`}>
                      {rec.type}
                    </span>
                    <span className="text-xs text-zinc-600">{rec.save.name}{rec.season && ` · ${rec.season.seasonLabel}`}</span>
                  </div>
                  <h3 className="font-semibold text-white">{rec.title}</h3>
                  {rec.summary && <p className="text-sm text-zinc-400 mt-1">{rec.summary}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ml-4 ${
                  rec.status === 'actioned' ? 'bg-green-100 text-green-700' :
                  rec.status === 'dismissed' ? ' text-zinc-600' :
                  'bg-blue-50 text-white'
                }`}>
                  {rec.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
