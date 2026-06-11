import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// GET /api/youth?saveId=xxx
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const saveId = req.nextUrl.searchParams.get('saveId')
  if (!saveId) return NextResponse.json({ error: 'saveId required' }, { status: 400 })

  // Verify save belongs to user
  const save = await prisma.save.findFirst({ where: { id: saveId, userId: user.id } })
  if (!save) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const players = await prisma.youthPlayer.findMany({
    where: { saveId },
    include: {
      updates: { orderBy: { loggedAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(players)
}

// POST /api/youth — create player
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { saveId, name, age, position, nationality, club, playerType, loanReturnDate, potential, notes } = body

  if (!saveId || !name) return NextResponse.json({ error: 'saveId and name required' }, { status: 400 })

  const save = await prisma.save.findFirst({ where: { id: saveId, userId: user.id } })
  if (!save) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const player = await prisma.youthPlayer.create({
    data: {
      saveId,
      name,
      age: age ? Number(age) : null,
      position: position || null,
      nationality: nationality || null,
      club: club || null,
      playerType: playerType || 'academy',
      loanReturnDate: loanReturnDate ? new Date(loanReturnDate) : null,
      potential: potential || null,
      notes: notes || null,
    },
    include: { updates: true },
  })

  return NextResponse.json(player, { status: 201 })
}
