import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ saveId: string }> }
) {
  const { saveId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const save = await prisma.save.findFirst({ where: { id: saveId, userId: user.id } })
  if (!save) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  const MILESTONES = [
    { type: 'pre_season', gamesTarget: 0 },
    { type: 'game_10', gamesTarget: 10 },
    { type: 'game_23', gamesTarget: 23 },
    { type: 'game_35', gamesTarget: 35 },
    { type: 'game_46', gamesTarget: 46 },
  ]

  const season = await prisma.season.create({
    data: {
      saveId,
      seasonLabel: body.seasonLabel,
      leagueName: body.leagueName,
      clubName: body.clubName,
      divisionLevel: body.divisionLevel ? Number(body.divisionLevel) : null,
      boardExpectation: body.boardExpectation || null,
      transferBudget: body.transferBudget ? Number(body.transferBudget) : null,
      wageBudget: body.wageBudget ? Number(body.wageBudget) : null,
      seasonObjective: body.seasonObjective || null,
      tacticNotes: body.tacticNotes || null,
      recruitmentPriorities: body.recruitmentPriorities || null,
      notes: body.notes || null,
      status: 'active',
      checkpoints: {
        create: MILESTONES.map(m => ({
          checkpointType: m.type,
          gamesPlayed: m.gamesTarget,
          status: 'draft',
        })),
      },
    },
  })

  return NextResponse.json(season, { status: 201 })
}
