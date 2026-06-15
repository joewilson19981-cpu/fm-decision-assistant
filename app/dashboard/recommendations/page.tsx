import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const TYPE_COLORS: Record<string, React.CSSProperties> = {
  tactical:    { background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' },
  recruitment: { background: 'rgba(96,165,250,0.1)',  color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' },
  financial:   { background: 'rgba(52,211,153,0.1)',  color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' },
  development: { background: 'rgba(251,191,36,0.1)',  color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' },
  general:     { background: 'rgba(255,255,255,0.05)', color: '#666666', border: '1px solid rgba(255,255,255,0.08)' },
}

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  actioned:  { background: 'rgba(52,211,153,0.1)',  color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' },
  dismissed: { background: 'rgba(255,255,255,0.04)', color: '#444444', border: '1px solid rgba(255,255,255,0.06)' },
  pending:   { background: 'rgba(255,255,255,0.06)', color: '#aaaaaa', border: '1px solid rgba(255,255,255,0.08)' },
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
    <div className="px-6 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Recommendations</h1>
        <p className="text-[13px] mt-0.5" style={{ color: '#555' }}>
          AI-generated insights from your checkpoint data
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div className="rounded-xl p-12 text-center"
          style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-4xl mb-3">⭐</p>
          <h2 className="text-base font-semibold text-white mb-1">No recommendations yet</h2>
          <p className="text-sm max-w-sm mx-auto mb-4" style={{ color: '#555' }}>
            Ask the Assistant to analyse your save — it will generate recommendations based on your stats, xG, set piece goals, and squad data.
          </p>
          <Link href="/dashboard/assistant"
            className="inline-block text-sm font-medium px-4 py-2 rounded-lg text-black bg-white hover:bg-zinc-200 transition-colors">
            Open Assistant
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {recommendations.map(rec => (
            <div key={rec.id} className="rounded-xl px-5 py-4"
              style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                      style={TYPE_COLORS[rec.type] ?? TYPE_COLORS.general}>
                      {rec.type}
                    </span>
                    <span className="text-[11px]" style={{ color: '#444' }}>
                      {rec.save.name}{rec.season ? ` · ${rec.season.seasonLabel}` : ''}
                    </span>
                  </div>
                  <h3 className="text-[14px] font-semibold text-white">{rec.title}</h3>
                  {rec.summary && (
                    <p className="text-[13px] mt-1" style={{ color: '#888' }}>{rec.summary}</p>
                  )}
                </div>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg flex-shrink-0"
                  style={STATUS_STYLES[rec.status] ?? STATUS_STYLES.pending}>
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
