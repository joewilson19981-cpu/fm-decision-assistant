import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const saves = await prisma.save.findMany({
    where: { userId: user.id },
    include: {
      seasons: {
        where: { status: 'active' },
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(saves)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const save = await prisma.save.create({
    data: {
      userId: user.id,
      name: body.name,
      fmVersion: body.fmVersion,
      managerName: body.managerName || null,
      startingClub: body.startingClub,
      currentClub: body.currentClub || body.startingClub,
      country: body.country || null,
      notes: body.notes || null,
      philosophy: body.philosophy || null,
    },
  })

  return NextResponse.json(save, { status: 201 })
}
