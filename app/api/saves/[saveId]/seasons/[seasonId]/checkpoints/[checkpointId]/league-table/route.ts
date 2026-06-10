import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ saveId: string; seasonId: string; checkpointId: string }> }
) {
  const { saveId, seasonId, checkpointId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cp = await prisma.checkpoint.findFirst({
    where: { id: checkpointId, seasonId, season: { saveId, save: { userId: user.id } } },
  })
  if (!cp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  // body.rows = array of table rows
  // Delete existing rows then re-insert (simplest for bulk replace)
  await prisma.leagueTableSnapshot.deleteMany({ where: { checkpointId } })

  const rows = await prisma.leagueTableSnapshot.createMany({
    data: body.rows.map((row: any) => ({
      checkpointId,
      teamName: row.teamName,
      position: Number(row.position),
      played: Number(row.played),
      wins: Number(row.wins),
      draws: Number(row.draws),
      losses: Number(row.losses),
      goalsFor: Number(row.goalsFor),
      goalsAgainst: Number(row.goalsAgainst),
      goalDiff: Number(row.goalDiff),
      points: Number(row.points),
      form: row.form || null,
      isYourTeam: !!row.isYourTeam,
    })),
  })

  return NextResponse.json(rows)
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ saveId: string; seasonId: string; checkpointId: string }> }
) {
  const { checkpointId } = await params
  const rows = await prisma.leagueTableSnapshot.findMany({
    where: { checkpointId },
    orderBy: { position: 'asc' },
  })
  return NextResponse.json(rows)
}
