import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ saveId: string; transferId: string }> }
) {
  const { saveId, transferId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const save = await prisma.save.findFirst({ where: { id: saveId, userId: user.id } })
  if (!save) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  const updated = await (prisma as any).transferDecision.update({
    where: { id: transferId },
    data: {
      ...(body.userDecision !== undefined && { userDecision: body.userDecision }),
      ...(body.finalFee !== undefined && { finalFee: body.finalFee ? Number(body.finalFee) : null }),
      ...(body.decisionNotes !== undefined && { decisionNotes: body.decisionNotes }),
      ...(body.playerName !== undefined && { playerName: body.playerName }),
      ...(body.playerAge !== undefined && { playerAge: body.playerAge ? Number(body.playerAge) : null }),
      ...(body.playerPosition !== undefined && { playerPosition: body.playerPosition }),
      ...(body.buyingClub !== undefined && { buyingClub: body.buyingClub }),
      ...(body.offerAmount !== undefined && { offerAmount: body.offerAmount ? Number(body.offerAmount) : null }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ saveId: string; transferId: string }> }
) {
  const { saveId, transferId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const save = await prisma.save.findFirst({ where: { id: saveId, userId: user.id } })
  if (!save) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await (prisma as any).transferDecision.delete({ where: { id: transferId } })
  return NextResponse.json({ ok: true })
}
