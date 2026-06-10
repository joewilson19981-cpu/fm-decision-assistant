import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import PlayersTable from './PlayersTable'

// Milestone priority — we take the most complete checkpoint per season per player
// so stats aren't double-counted (they're cumulative snapshots)
const MILESTONE_PRIORITY = ['game_46', 'game_35', 'game_23', 'game_10', 'pre_season',
  'end_of_season', 'mid_season', 'transfer_window', 'custom']

export type PlayerRow = {
  id: string
  name: string
  position: string | null
  seasons: number
  apps: number
  goals: number
  assists: number
  cleanSheets: number
  avgRating: number | null
  ratingCount: number
  yellowCards: number
  redCards: number
  seasonBreakdown: {
    saveId: string
    saveName: string
    seasonLabel: string
    seasonId: string
    league: string
    goals: number
    assists: number
    apps: number
    avgRating: number | null
  }[]
}

export default async function PlayersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch all player checkpoint stats across all saves
  const allStats = await prisma.playerCheckpointStats.findMany({
    where: {
      checkpoint: {
        season: { save: { userId: user.id } },
      },
    },
    include: {
      player: true,
      checkpoint: {
        include: {
          season: { include: { save: true } },
        },
      },
    },
  })

  // Group by player → season, then pick best checkpoint per season
  const byPlayerSeason: Record<string, typeof allStats> = {}
  for (const stat of allStats) {
    const key = `${stat.playerId}|${stat.checkpoint.seasonId}`
    if (!byPlayerSeason[key]) byPlayerSeason[key] = []
    byPlayerSeason[key].push(stat)
  }

  // For each player+season, pick the most complete checkpoint
  const bestPerSeason: typeof allStats = []
  for (const group of Object.values(byPlayerSeason)) {
    const best = group.sort((a, b) => {
      const ai = MILESTONE_PRIORITY.indexOf(a.checkpoint.checkpointType)
      const bi = MILESTONE_PRIORITY.indexOf(b.checkpoint.checkpointType)
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })[0]
    bestPerSeason.push(best)
  }

  // Aggregate per player across seasons
  const playerMap: Record<string, PlayerRow> = {}
  for (const stat of bestPerSeason) {
    const pid = stat.playerId
    if (!playerMap[pid]) {
      playerMap[pid] = {
        id: pid,
        name: stat.player.name,
        position: stat.player.position,
        seasons: 0,
        apps: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        avgRating: null,
        ratingCount: 0,
        yellowCards: 0,
        redCards: 0,
        seasonBreakdown: [],
      }
    }
    const p = playerMap[pid]
    p.seasons += 1
    p.apps += stat.appearances ?? 0
    p.goals += stat.goals ?? 0
    p.assists += stat.assists ?? 0
    p.cleanSheets += stat.cleanSheets ?? 0
    p.yellowCards += stat.yellowCards ?? 0
    p.redCards += stat.redCards ?? 0

    if (stat.avgRating != null) {
      const prev = (p.avgRating ?? 0) * p.ratingCount
      p.ratingCount += 1
      p.avgRating = (prev + Number(stat.avgRating)) / p.ratingCount
    }

    p.seasonBreakdown.push({
      saveId: stat.checkpoint.season.saveId,
      saveName: stat.checkpoint.season.save.name,
      seasonLabel: stat.checkpoint.season.seasonLabel,
      seasonId: stat.checkpoint.seasonId,
      league: stat.checkpoint.season.leagueName ?? '—',
      goals: stat.goals ?? 0,
      assists: stat.assists ?? 0,
      apps: stat.appearances ?? 0,
      avgRating: stat.avgRating ? Number(stat.avgRating) : null,
    })
  }

  const players = Object.values(playerMap)

  return <PlayersTable players={players} />
}
