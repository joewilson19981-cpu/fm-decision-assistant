import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { saveId, seasonId, checkpointId, extracted } = await req.json()

  const cp = await prisma.checkpoint.findFirst({
    where: { id: checkpointId, seasonId, season: { saveId, save: { userId: user.id } } },
  })
  if (!cp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const num = (v: unknown) => (v !== '' && v != null && !isNaN(Number(v)) ? Number(v) : null)
  const results: string[] = []

  // Update checkpoint metadata (in-game date, transfer window, games played, calendar phase)
  const cpUpdate: any = {}
  if (extracted.gameDate) {
    cpUpdate.inGameDate = new Date(extracted.gameDate)
    // Derive calendar phase from month of in-game date
    const month = new Date(extracted.gameDate).getMonth() // 0-based
    const MONTH_PHASES = ['January','February','March','April','May','End of season','Pre-season','August','September','October','November','December']
    cpUpdate.calendarPhase = MONTH_PHASES[month] ?? null
  }
  if (extracted.transferWindow) {
    cpUpdate.transferWindowStatus = extracted.transferWindow === 'open' ? 'Summer window' : 'Closed'
  }
  if (extracted.teamStats?.played != null) {
    cpUpdate.gamesPlayed = Number(extracted.teamStats.played)
  }
  if (Object.keys(cpUpdate).length > 0) {
    await prisma.checkpoint.update({ where: { id: checkpointId }, data: cpUpdate })
    results.push('checkpoint metadata')
  }

  // Team stats
  if (extracted.teamStats) {
    const s = extracted.teamStats
    const hasData = Object.values(s).some(v => v != null)
    if (hasData) {
      await prisma.teamCheckpointStats.upsert({
        where: { checkpointId },
        create: {
          checkpointId,
          leaguePosition: num(s.leaguePosition), played: num(s.played),
          points: num(s.points), wins: num(s.wins), draws: num(s.draws), losses: num(s.losses),
          goalsFor: num(s.goalsFor), goalsAgainst: num(s.goalsAgainst), goalDiff: num(s.goalDiff),
          xg: num(s.xg), xga: num(s.xga), cleanSheets: num(s.cleanSheets),
          clearCutChancesFor: num(s.clearCutChancesFor), clearCutChancesAgainst: num(s.clearCutChancesAgainst),
          shotsPerGame: num(s.shotsPerGame), possession: num(s.possession),
          passCompletion: num(s.passCompletion), setPieceGoalsFor: num(s.setPieceGoalsFor),
          setPieceGoalsAgainst: num(s.setPieceGoalsAgainst), crossAssistsFor: num(s.crossAssistsFor),
          crossAssistsAgainst: num(s.crossAssistsAgainst),
        },
        update: {
          leaguePosition: num(s.leaguePosition), played: num(s.played),
          points: num(s.points), wins: num(s.wins), draws: num(s.draws), losses: num(s.losses),
          goalsFor: num(s.goalsFor), goalsAgainst: num(s.goalsAgainst), goalDiff: num(s.goalDiff),
          xg: num(s.xg), xga: num(s.xga), cleanSheets: num(s.cleanSheets),
          clearCutChancesFor: num(s.clearCutChancesFor), clearCutChancesAgainst: num(s.clearCutChancesAgainst),
          shotsPerGame: num(s.shotsPerGame), possession: num(s.possession),
          passCompletion: num(s.passCompletion), setPieceGoalsFor: num(s.setPieceGoalsFor),
          setPieceGoalsAgainst: num(s.setPieceGoalsAgainst), crossAssistsFor: num(s.crossAssistsFor),
          crossAssistsAgainst: num(s.crossAssistsAgainst),
        },
      })
      results.push('team stats')
    }
  }

  // League table
  if (extracted.leagueTable?.length > 0) {
    await prisma.leagueTableSnapshot.deleteMany({ where: { checkpointId } })
    await prisma.leagueTableSnapshot.createMany({
      data: extracted.leagueTable.map((row: any) => ({
        checkpointId,
        teamName: row.teamName,
        position: Number(row.position) || 0,
        played: Number(row.played) || 0,
        wins: Number(row.wins) || 0,
        draws: Number(row.draws) || 0,
        losses: Number(row.losses) || 0,
        goalsFor: Number(row.goalsFor) || 0,
        goalsAgainst: Number(row.goalsAgainst) || 0,
        goalDiff: Number(row.goalDiff) || 0,
        points: Number(row.points) || 0,
        form: row.form || null,
        isYourTeam: !!row.isYourTeam,
      })),
    })
    results.push('league table')
  }

  // Tactic
  if (extracted.tactic?.formation || extracted.tactic?.mentality) {
    await prisma.tacticSnapshot.upsert({
      where: { checkpointId },
      create: { checkpointId, formation: extracted.tactic.formation || null, mentality: extracted.tactic.mentality || null },
      update: { formation: extracted.tactic.formation || null, mentality: extracted.tactic.mentality || null },
    })
    results.push('tactic')
  }

  // Finances
  if (extracted.finances) {
    const f = extracted.finances
    const hasData = Object.values(f).some(v => v != null)
    if (hasData) {
      await prisma.financeSnapshot.upsert({
        where: { checkpointId },
        create: {
          checkpointId, balance: num(f.balance), profitLoss: num(f.profitLoss),
          transferBudget: num(f.transferBudget), wageBudget: num(f.wageBudget),
          wageSpend: num(f.wageSpend), remainingWageBudget: num(f.remainingWageBudget), debt: num(f.debt),
        },
        update: {
          balance: num(f.balance), profitLoss: num(f.profitLoss),
          transferBudget: num(f.transferBudget), wageBudget: num(f.wageBudget),
          wageSpend: num(f.wageSpend), remainingWageBudget: num(f.remainingWageBudget), debt: num(f.debt),
        },
      })
      results.push('finances')
    }
  }

  // Medical
  if (extracted.medical) {
    const m = extracted.medical
    if (m.currentInjuries != null || m.totalInjuriesThisSeason != null || m.overallSquadCondition) {
      await prisma.medicalSnapshot.upsert({
        where: { checkpointId },
        create: {
          checkpointId, currentInjuries: num(m.currentInjuries),
          totalInjuriesThisSeason: num(m.totalInjuriesThisSeason),
          overallSquadCondition: m.overallSquadCondition || null,
          notes: Array.isArray(m.notes) ? m.notes.join('\n') : (m.notes || null),
        },
        update: {
          currentInjuries: num(m.currentInjuries),
          totalInjuriesThisSeason: num(m.totalInjuriesThisSeason),
          overallSquadCondition: m.overallSquadCondition || null,
          notes: Array.isArray(m.notes) ? m.notes.join('\n') : (m.notes || null),
        },
      })
      results.push('medical')
    }
  }

  // Player stats
  if (extracted.playerStats?.length > 0) {
    await prisma.playerCheckpointStats.deleteMany({ where: { checkpointId } })
    for (const p of extracted.playerStats) {
      if (!p.name?.trim()) continue
      let player = await prisma.player.findFirst({ where: { saveId, name: p.name.trim() } })
      if (!player) {
        player = await prisma.player.create({ data: { saveId, name: p.name.trim(), position: p.position || null } })
      }
      await prisma.playerCheckpointStats.create({
        data: {
          checkpointId, playerId: player.id,
          age: num(p.age), position: p.position || null,
          appearances: num(p.appearances), goals: num(p.goals), assists: num(p.assists),
          cleanSheets: num(p.cleanSheets), avgRating: num(p.avgRating),
          yellowCards: num(p.yellowCards), redCards: num(p.redCards),
          wage: num(p.wage), contractExpiry: p.contractExpiry ? new Date(p.contractExpiry) : null,
          morale: p.morale || null,
        },
      })
    }
    if (extracted.playerStats.filter((p: any) => p.name?.trim()).length > 0) {
      results.push('player stats')
    }
  }

  return NextResponse.json({ saved: results })
  } catch (err: any) {
    console.error('apply-checkpoint error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
