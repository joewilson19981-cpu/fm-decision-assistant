import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

const MILESTONE_ORDER = ['pre_season', 'game_10', 'game_23', 'game_35', 'game_46']
const MILESTONE_LABELS: Record<string, string> = {
  pre_season: 'Pre', game_10: '10G', game_23: '23G', game_35: '35G', game_46: '46G',
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const saveId = searchParams.get('saveId')
    const seasonId = searchParams.get('seasonId')

    if (!saveId) return NextResponse.json({ error: 'saveId required' }, { status: 400 })

    // Verify ownership
    const save = await prisma.save.findFirst({
      where: { id: saveId, userId: user.id },
      include: {
        seasons: {
          orderBy: { createdAt: 'asc' },
          include: {
            checkpoints: {
              include: {
                teamStats: true,
                financeSnapshot: true,
                playerStats: {
                  include: { player: true },
                  orderBy: { goals: 'desc' },
                },
                leagueTableSnapshots: { where: { isYourTeam: true }, take: 1 },
              },
              orderBy: { gamesPlayed: 'asc' },
            },
          },
        },
      },
    })

    if (!save) return NextResponse.json({ error: 'Save not found' }, { status: 404 })

    // Filter to requested season or use all
    const seasons = seasonId
      ? save.seasons.filter(s => s.id === seasonId)
      : save.seasons

    // ── Build chart data per season ───────────────────────────────────────────
    const seasonCharts = seasons.map(season => {
      // Sort checkpoints by milestone order
      const sorted = [...season.checkpoints].sort((a, b) => {
        const ai = MILESTONE_ORDER.indexOf(a.checkpointType)
        const bi = MILESTONE_ORDER.indexOf(b.checkpointType)
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
      })

      // Performance trend points
      const trend = sorted
        .filter(cp => cp.teamStats)
        .map(cp => {
          const ts = cp.teamStats!
          const fin = cp.financeSnapshot
          return {
            label: MILESTONE_LABELS[cp.checkpointType] ?? cp.checkpointType,
            gamesPlayed: cp.gamesPlayed,
            position: ts.leaguePosition,
            points: ts.points,
            wins: ts.wins,
            draws: ts.draws,
            losses: ts.losses,
            goalsFor: ts.goalsFor,
            goalsAgainst: ts.goalsAgainst,
            goalDiff: ts.goalDiff,
            xg: ts.xg != null ? Number(ts.xg) : null,
            xga: ts.xga != null ? Number(ts.xga) : null,
            xgDiff: (ts.xg != null && ts.xga != null) ? Number(ts.xg) - Number(ts.xga) : null,
            cleanSheets: ts.cleanSheets,
            possession: ts.possession != null ? Number(ts.possession) : null,
            passCompletion: ts.passCompletion != null ? Number(ts.passCompletion) : null,
            shotsPerGame: ts.shotsPerGame != null ? Number(ts.shotsPerGame) : null,
            setPieceGoalsFor: ts.setPieceGoalsFor,
            setPieceGoalsAgainst: ts.setPieceGoalsAgainst,
            setPiecePct: (ts.setPieceGoalsFor != null && ts.goalsFor != null && ts.goalsFor > 0)
              ? Math.round((ts.setPieceGoalsFor / ts.goalsFor) * 100)
              : null,
            transferBudget: fin?.transferBudget != null ? Number(fin.transferBudget) / 1_000_000 : null,
          }
        })

      // Best player stats (from most complete checkpoint)
      const bestCp = sorted.filter(cp => cp.playerStats.length > 0).at(-1)
      const playerStats = bestCp?.playerStats ?? []

      // Aggregate player stats across checkpoints (take best milestone per player)
      const playerMap: Record<string, any> = {}
      for (const cp of sorted) {
        for (const ps of cp.playerStats) {
          if (!ps.player?.name) continue
          const existing = playerMap[ps.playerId]
          const cpPriority = MILESTONE_ORDER.indexOf(cp.checkpointType)
          if (!existing || cpPriority > MILESTONE_ORDER.indexOf(existing._cpType)) {
            playerMap[ps.playerId] = {
              id: ps.playerId,
              name: ps.player.name,
              position: ps.position ?? ps.player.position,
              goals: ps.goals ?? 0,
              assists: ps.assists ?? 0,
              apps: ps.appearances ?? 0,
              cleanSheets: ps.cleanSheets ?? 0,
              avgRating: ps.avgRating != null ? Number(ps.avgRating) : null,
              yellowCards: ps.yellowCards ?? 0,
              redCards: ps.redCards ?? 0,
              contractExpiry: ps.contractExpiry?.toISOString() ?? null,
              wage: ps.wage != null ? Number(ps.wage) : null,
              _cpType: cp.checkpointType,
            }
          }
        }
      }

      const players = Object.values(playerMap).filter((p: any) => p.apps > 0)

      // Contract expiry alerts (within 8 months of today)
      const now = new Date()
      const alertDate = new Date(now)
      alertDate.setMonth(alertDate.getMonth() + 8)
      const contractAlerts = players.filter((p: any) => {
        if (!p.contractExpiry) return false
        const exp = new Date(p.contractExpiry)
        return exp <= alertDate && exp >= now
      }).sort((a: any, b: any) => new Date(a.contractExpiry).getTime() - new Date(b.contractExpiry).getTime())

      return {
        seasonId: season.id,
        seasonLabel: season.seasonLabel,
        leagueName: season.leagueName,
        clubName: season.clubName,
        boardExpectation: season.boardExpectation,
        seasonObjective: season.seasonObjective,
        isCurrent: season.status === 'active',
        trend,
        players: players.sort((a: any, b: any) => (b.goals - a.goals) || (b.apps - a.apps)),
        contractAlerts,
        checkpointCount: sorted.filter(cp => cp.teamStats).length,
      }
    })

    return NextResponse.json({
      saveId,
      saveName: save.name,
      clubName: save.currentClub ?? save.startingClub ?? '',
      seasons: seasonCharts,
    })

  } catch (err: any) {
    console.error('Analytics API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
