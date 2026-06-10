import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'
import type { SeasonJourney, MilestoneCard, AllTimeRecord } from './DashboardClient'

const MILESTONE_PRIORITY = [
  'game_46', 'game_35', 'game_23', 'game_10', 'pre_season',
  'end_of_season', 'mid_season', 'transfer_window', 'custom',
]
const MILESTONE_LABELS: Record<string, string> = {
  pre_season: 'Pre-season', game_10: 'Game 10',
  game_23: 'Game 23', game_35: 'Game 35', game_46: 'Game 46',
}
const MILESTONE_TARGETS: Record<string, number> = {
  pre_season: 0, game_10: 10, game_23: 23, game_35: 35, game_46: 46,
}

function pickBestCp<T extends { checkpointType: string }>(cps: T[]): T | null {
  if (!cps.length) return null
  return [...cps].sort((a, b) => {
    const ai = MILESTONE_PRIORITY.indexOf(a.checkpointType)
    const bi = MILESTONE_PRIORITY.indexOf(b.checkpointType)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })[0]
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // ── Saves (lightweight for "other saves" cards) ──
  const saves = await prisma.save.findMany({
    where: { userId: user.id },
    include: {
      seasons: {
        orderBy: { createdAt: 'desc' },
        take: 2,
        include: {
          checkpoints: {
            orderBy: { updatedAt: 'desc' },
            take: 1,
            include: { teamStats: true },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  if (!saves.length) {
    return (
      <DashboardClient
        empty
        saveId="" saveName="" clubName="" seasonId="" seasonLabel=""
        leagueName="" checkpointId="" checkpointType=""
        inGameDate={null} transferWindow={null} teamStats={null}
        formStr={null} tactic={null} finance={null} medical={null}
        leagueTable={[]} journeySeasons={[]} milestoneComparison={null}
        milestones={[]} currentSquad={[]} allTimeRecords={[]} otherSaves={[]}
      />
    )
  }

  const primarySave = saves[0]

  // ── Full season data for primary save ──
  const seasons = await prisma.season.findMany({
    where: { saveId: primarySave.id },
    include: {
      checkpoints: {
        include: {
          teamStats: true,
          leagueTableSnapshots: { orderBy: { position: 'asc' } },
          tacticSnapshot: true,
          financeSnapshot: true,
          medicalSnapshot: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Most recently updated checkpoint across all seasons
  const allCpEntries = seasons
    .flatMap(s => s.checkpoints.map(cp => ({ cp, season: s })))
    .sort((a, b) => new Date(b.cp.updatedAt).getTime() - new Date(a.cp.updatedAt).getTime())

  const primaryEntry = allCpEntries[0]

  if (!primaryEntry) {
    return (
      <DashboardClient
        noCheckpoint
        saveId={primarySave.id} saveName={primarySave.name}
        clubName={primarySave.currentClub ?? primarySave.startingClub ?? ''}
        seasonId="" seasonLabel="" leagueName="" checkpointId="" checkpointType=""
        inGameDate={null} transferWindow={null} teamStats={null}
        formStr={null} tactic={null} finance={null} medical={null}
        leagueTable={[]} journeySeasons={[]} milestoneComparison={null}
        milestones={[]} currentSquad={[]} allTimeRecords={[]} otherSaves={[]}
      />
    )
  }

  const primary = primaryEntry.cp
  const primarySeason = primaryEntry.season
  const ts = primary.teamStats
  const lt = primary.leagueTableSnapshots
  const tac = primary.tacticSnapshot
  const fin = primary.financeSnapshot
  const med = primary.medicalSnapshot

  // ── Current squad from primary checkpoint ──
  const currentSquadRaw = await prisma.playerCheckpointStats.findMany({
    where: { checkpointId: primary.id },
    include: { player: true },
    orderBy: [{ avgRating: 'desc' }, { goals: 'desc' }],
  })

  // ── All player stats for this save (for journey top scorer + all-time records) ──
  const allPlayerStats = await prisma.playerCheckpointStats.findMany({
    where: { checkpoint: { season: { saveId: primarySave.id } } },
    include: {
      player: true,
      checkpoint: { select: { seasonId: true, checkpointType: true } },
    },
  })

  // ── Journey: one summary row per season ──
  const journeySeasons: SeasonJourney[] = seasons.map(season => {
    const best = pickBestCp(season.checkpoints)
    const bestTs = best?.teamStats

    // Top scorer for this season
    const seasonStats = allPlayerStats.filter(s => s.checkpoint.seasonId === season.id)
    const byPlayer: Record<string, typeof seasonStats> = {}
    for (const s of seasonStats) {
      if (!byPlayer[s.playerId]) byPlayer[s.playerId] = []
      byPlayer[s.playerId].push(s)
    }
    const bestPerPlayer = Object.values(byPlayer).map(group =>
      [...group].sort((a, b) => {
        const ai = MILESTONE_PRIORITY.indexOf(a.checkpoint.checkpointType)
        const bi = MILESTONE_PRIORITY.indexOf(b.checkpoint.checkpointType)
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
      })[0]
    )
    const topScorer = bestPerPlayer
      .filter(s => (s.goals ?? 0) > 0)
      .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))[0]

    return {
      seasonId: season.id,
      label: season.seasonLabel,
      league: season.leagueName ?? '—',
      isCurrent: season.id === primarySeason.id,
      bestMilestone: MILESTONE_LABELS[best?.checkpointType ?? ''] ?? best?.checkpointType ?? '—',
      gamesPlayed: best?.gamesPlayed ?? bestTs?.played ?? null,
      position: bestTs?.leaguePosition ?? null,
      points: bestTs?.points ?? null,
      goalsFor: bestTs?.goalsFor ?? null,
      goalsAgainst: bestTs?.goalsAgainst ?? null,
      wins: bestTs?.wins ?? null,
      draws: bestTs?.draws ?? null,
      losses: bestTs?.losses ?? null,
      topScorer: topScorer ? { name: topScorer.player.name, goals: topScorer.goals ?? 0 } : null,
      isComplete: season.checkpoints.some(cp => cp.checkpointType === 'game_46' && cp.teamStats),
    }
  })

  // ── Milestone comparison: vs the most recent season in the SAME league ──
  // If promoted then relegated back, this correctly compares to the last time you were in that league
  const currentSeasonIdx = seasons.findIndex(s => s.id === primarySeason.id)
  const prevSameLeagueSeason = seasons
    .slice(0, currentSeasonIdx)  // only seasons before current
    .filter(s => s.leagueName === primarySeason.leagueName)
    .at(-1)  // most recent match
  const prevMatchingCp = prevSameLeagueSeason?.checkpoints.find(cp => cp.checkpointType === primary.checkpointType) ?? null
  const milestoneComparison =
    ts && prevMatchingCp?.teamStats
      ? {
          milestone: MILESTONE_LABELS[primary.checkpointType] ?? primary.checkpointType,
          currentPts: ts.points ?? 0,
          prevPts: prevMatchingCp.teamStats.points ?? 0,
          ptsDiff: (ts.points ?? 0) - (prevMatchingCp.teamStats.points ?? 0),
          currentPos: ts.leaguePosition ?? 0,
          prevPos: prevMatchingCp.teamStats.leaguePosition ?? 0,
          posDiff: (ts.leaguePosition ?? 0) - (prevMatchingCp.teamStats.leaguePosition ?? 0),
        }
      : null

  // ── Milestone roadmap for current season ──
  const CORE_MILESTONES = ['pre_season', 'game_10', 'game_23', 'game_35', 'game_46']
  const milestones: MilestoneCard[] = CORE_MILESTONES.map(type => {
    const cp = primarySeason.checkpoints.find(c => c.checkpointType === type)
    return {
      type,
      label: MILESTONE_LABELS[type] ?? type,
      gamesTarget: MILESTONE_TARGETS[type] ?? 0,
      hasData: !!(cp?.teamStats),
      isCurrent: cp?.id === primary.id,
      position: cp?.teamStats?.leaguePosition ?? null,
      points: cp?.teamStats?.points ?? null,
      goalsFor: cp?.teamStats?.goalsFor ?? null,
      wins: cp?.teamStats?.wins ?? null,
    }
  })

  // ── All-time records for this save ──
  const byPlayerSeason: Record<string, typeof allPlayerStats> = {}
  for (const stat of allPlayerStats) {
    const key = `${stat.playerId}|${stat.checkpoint.seasonId}`
    if (!byPlayerSeason[key]) byPlayerSeason[key] = []
    byPlayerSeason[key].push(stat)
  }
  const bestPerSeason = Object.values(byPlayerSeason).map(group =>
    [...group].sort((a, b) => {
      const ai = MILESTONE_PRIORITY.indexOf(a.checkpoint.checkpointType)
      const bi = MILESTONE_PRIORITY.indexOf(b.checkpoint.checkpointType)
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })[0]
  )
  const playerMap: Record<string, AllTimeRecord & { ratingCount: number }> = {}
  for (const stat of bestPerSeason) {
    const pid = stat.playerId
    if (!playerMap[pid]) {
      playerMap[pid] = {
        id: pid, name: stat.player.name, position: stat.player.position,
        seasons: 0, apps: 0, goals: 0, assists: 0, cleanSheets: 0,
        avgRating: null, ratingCount: 0,
      }
    }
    const p = playerMap[pid]
    p.seasons++
    p.apps += stat.appearances ?? 0
    p.goals += stat.goals ?? 0
    p.assists += stat.assists ?? 0
    p.cleanSheets += stat.cleanSheets ?? 0
    if (stat.avgRating != null) {
      const prev = (p.avgRating ?? 0) * p.ratingCount
      p.ratingCount++
      p.avgRating = (prev + Number(stat.avgRating)) / p.ratingCount
    }
  }
  const allTimeRecords: AllTimeRecord[] = Object.values(playerMap)
    .sort((a, b) => b.goals - a.goals || b.apps - a.apps)
    .slice(0, 25)
    .map(({ ratingCount: _rc, ...r }) => r)

  // ── Other saves summary ──
  const myRow = lt.find(r => r.isYourTeam)
  const otherSaves = saves
    .filter(s => s.id !== primarySave.id)
    .map(save => {
      const latestSeason = save.seasons[0]
      const latestCp = latestSeason?.checkpoints[0]
      return {
        id: save.id,
        name: save.name,
        club: save.currentClub ?? save.startingClub ?? '',
        fmVersion: save.fmVersion,
        league: latestSeason?.leagueName ?? null,
        season: latestSeason?.seasonLabel ?? null,
        position: latestCp?.teamStats?.leaguePosition ?? null,
        points: latestCp?.teamStats?.points ?? null,
      }
    })

  return (
    <DashboardClient
      saveId={primarySave.id}
      saveName={primarySave.name}
      clubName={primarySave.currentClub ?? primarySave.startingClub ?? ''}
      seasonId={primarySeason.id}
      seasonLabel={primarySeason.seasonLabel}
      leagueName={primarySeason.leagueName ?? ''}
      checkpointId={primary.id}
      checkpointType={primary.checkpointType}
      inGameDate={primary.inGameDate ? primary.inGameDate.toISOString() : null}
      transferWindow={primary.transferWindowStatus ?? null}
      teamStats={ts ? {
        leaguePosition: ts.leaguePosition,
        played: ts.played,
        points: ts.points,
        wins: ts.wins,
        draws: ts.draws,
        losses: ts.losses,
        goalsFor: ts.goalsFor,
        goalsAgainst: ts.goalsAgainst,
        xg: ts.xg != null ? Number(ts.xg) : null,
        cleanSheets: ts.cleanSheets,
        possession: ts.possession != null ? Number(ts.possession) : null,
        passCompletion: ts.passCompletion != null ? Number(ts.passCompletion) : null,
        shotsPerGame: ts.shotsPerGame != null ? Number(ts.shotsPerGame) : null,
      } : null}
      formStr={myRow?.form ?? null}
      tactic={tac ? { formation: tac.formation, mentality: tac.mentality } : null}
      finance={fin ? {
        balance: fin.balance != null ? Number(fin.balance) : null,
        transferBudget: fin.transferBudget != null ? Number(fin.transferBudget) : null,
        wageBudget: fin.wageBudget != null ? Number(fin.wageBudget) : null,
        wageSpend: fin.wageSpend != null ? Number(fin.wageSpend) : null,
      } : null}
      medical={med ? {
        currentInjuries: med.currentInjuries,
        totalInjuries: med.totalInjuriesThisSeason,
        condition: med.overallSquadCondition,
        notes: med.notes,
      } : null}
      leagueTable={lt.map(row => ({
        position: row.position,
        teamName: row.teamName,
        played: row.played,
        wins: row.wins,
        draws: row.draws,
        losses: row.losses,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        goalDiff: row.goalDiff,
        points: row.points,
        form: row.form,
        isYourTeam: row.isYourTeam,
      }))}
      journeySeasons={journeySeasons}
      milestoneComparison={milestoneComparison}
      milestones={milestones}
      currentSquad={currentSquadRaw.map(s => ({
        id: s.playerId,
        name: s.player.name,
        position: s.position ?? s.player.position,
        age: s.age,
        apps: s.appearances,
        goals: s.goals,
        assists: s.assists,
        cleanSheets: s.cleanSheets,
        avgRating: s.avgRating != null ? Number(s.avgRating) : null,
      }))}
      allTimeRecords={allTimeRecords}
      otherSaves={otherSaves}
    />
  )
}
