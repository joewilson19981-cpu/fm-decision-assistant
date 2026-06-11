import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// PUT /api/youth/[playerId] — update player
export async function PUT(req: NextRequest, { params }: { params: Promise<{ playerId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { playerId } = await params
  const body = await req.json()

  const player = await prisma.youthPlayer.findFirst({
    where: { id: playerId },
    include: { save: true },
  })
  if (!player || player.save.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.youthPlayer.update({
    where: { id: playerId },
    data: {
      name: body.name ?? player.name,
      age: body.age !== undefined ? Number(body.age) : player.age,
      position: body.position ?? player.position,
      nationality: body.nationality ?? player.nationality,
      club: body.club ?? player.club,
      playerType: body.playerType ?? player.playerType,
      loanReturnDate: body.loanReturnDate ? new Date(body.loanReturnDate) : player.loanReturnDate,
      potential: body.potential ?? player.potential,
      notes: body.notes ?? player.notes,
    },
    include: { updates: { orderBy: { loggedAt: 'desc' } } },
  })

  return NextResponse.json(updated)
}

// DELETE /api/youth/[playerId]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ playerId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { playerId } = await params

  const player = await prisma.youthPlayer.findFirst({
    where: { id: playerId },
    include: { save: true },
  })
  if (!player || player.save.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.youthPlayer.delete({ where: { id: playerId } })
  return NextResponse.json({ ok: true })
}
