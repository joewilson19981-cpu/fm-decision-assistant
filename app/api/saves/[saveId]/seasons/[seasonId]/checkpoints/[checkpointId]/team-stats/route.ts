import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

async function getCheckpoint(checkpointId: string, seasonId: string, saveId: string, userId: string) {
  return prisma.checkpoint.findFirst({
    where: { id: checkpointId, seasonId, season: { saveId, save: { userId } } },
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ saveId: string; seasonId: string; checkpointId: string }> }
) {
  const { saveId, seasonId, checkpointId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cp = await getCheckpoint(checkpointId, seasonId, saveId, user.id)
  if (!cp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const num = (v: unknown) => (v !== '' && v != null ? Number(v) : null)

  const stats = await prisma.teamCheckpointStats.upsert({
    where: { checkpointId },
    create: {
      checkpointId,
      leaguePosition: num(body.leaguePosition),
      played: num(body.played),
      points: num(body.points),
      wins: num(body.wins),
      draws: num(body.draws),
      losses: num(body.losses),
      goalsFor: num(body.goalsFor),
      goalsAgainst: num(body.goalsAgainst),
      goalDiff: num(body.goalDiff),
      xg: num(body.xg),
      xga: num(body.xga),
      cleanSheets: num(body.cleanSheets),
      clearCutChancesFor: num(body.clearCutChancesFor),
      clearCutChancesAgainst: num(body.clearCutChancesAgainst),
      shotsPerGame: num(body.shotsPerGame),
      possession: num(body.possession),
      passCompletion: num(body.passCompletion),
      setPieceGoalsFor: num(body.setPieceGoalsFor),
      setPieceGoalsAgainst: num(body.setPieceGoalsAgainst),
      crossAssistsFor: num(body.crossAssistsFor),
      crossAssistsAgainst: num(body.crossAssistsAgainst),
      notes: body.notes || null,
    },
    update: {
      leaguePosition: num(body.leaguePosition),
      played: num(body.played),
      points: num(body.points),
      wins: num(body.wins),
      draws: num(body.draws),
      losses: num(body.losses),
      goalsFor: num(body.goalsFor),
      goalsAgainst: num(body.goalsAgainst),
      goalDiff: num(body.goalDiff),
      xg: num(body.xg),
      xga: num(body.xga),
      cleanSheets: num(body.cleanSheets),
      clearCutChancesFor: num(body.clearCutChancesFor),
      clearCutChancesAgainst: num(body.clearCutChancesAgainst),
      shotsPerGame: num(body.shotsPerGame),
      possession: num(body.possession),
      passCompletion: num(body.passCompletion),
      setPieceGoalsFor: num(body.setPieceGoalsFor),
      setPieceGoalsAgainst: num(body.setPieceGoalsAgainst),
      crossAssistsFor: num(body.crossAssistsFor),
      crossAssistsAgainst: num(body.crossAssistsAgainst),
      notes: body.notes || null,
    },
  })

  return NextResponse.json(stats)
}
