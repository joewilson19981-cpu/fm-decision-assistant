import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ saveId: string; seasonId: string }> }
) {
  const { saveId, seasonId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const season = await prisma.season.findFirst({
    where: { id: seasonId, saveId },
    include: { save: true },
  })
  if (!season || season.save.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json()

  const checkpoint = await prisma.checkpoint.create({
    data: {
      seasonId,
      checkpointType: body.checkpointType,
      gamesPlayed: body.gamesPlayed ? Number(body.gamesPlayed) : null,
      inGameDate: body.inGameDate ? new Date(body.inGameDate) : null,
      calendarPhase: body.calendarPhase || null,
      transferWindowStatus: body.transferWindowStatus || null,
      notes: body.notes || null,
      status: 'draft',
    },
  })

  return NextResponse.json(checkpoint, { status: 201 })
}
