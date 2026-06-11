import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ saveId: string }> }
) {
  const { saveId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const save = await prisma.save.findFirst({ where: { id: saveId, userId: user.id } })
  if (!save) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const transfers = await (prisma as any).transferDecision.findMany({
    where: { saveId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(transfers)
}

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

  const transfer = await (prisma as any).transferDecision.create({
    data: {
      saveId,
      playerName: body.playerName,
      playerAge: body.playerAge ? Number(body.playerAge) : null,
      playerPosition: body.playerPosition || null,
      buyingClub: body.buyingClub || null,
      offerAmount: body.offerAmount ? Number(body.offerAmount) : null,
      offerCurrency: body.offerCurrency || '£',
      offerNotes: body.offerNotes || null,
      screenshotUrls: body.screenshotUrls || null,
      screenshotPaths: body.screenshotPaths || null,
      aiVerdict: body.aiVerdict || null,
      aiConfidence: body.aiConfidence || null,
      aiReasoning: body.aiReasoning || null,
      aiKeyFactors: body.aiKeyFactors || null,
      userDecision: body.userDecision || 'Pending',
      contextCheckpointId: body.contextCheckpointId || null,
    },
  })

  return NextResponse.json(transfer)
}
