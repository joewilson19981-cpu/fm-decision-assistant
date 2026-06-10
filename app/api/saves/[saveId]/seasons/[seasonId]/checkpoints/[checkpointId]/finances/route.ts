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
  const num = (v: unknown) => (v !== '' && v != null ? Number(v) : null)

  const finance = await prisma.financeSnapshot.upsert({
    where: { checkpointId },
    create: {
      checkpointId,
      balance: num(body.balance),
      profitLoss: num(body.profitLoss),
      transferBudget: num(body.transferBudget),
      wageBudget: num(body.wageBudget),
      wageSpend: num(body.wageSpend),
      remainingWageBudget: num(body.remainingWageBudget),
      debt: num(body.debt),
      notes: body.notes || null,
    },
    update: {
      balance: num(body.balance),
      profitLoss: num(body.profitLoss),
      transferBudget: num(body.transferBudget),
      wageBudget: num(body.wageBudget),
      wageSpend: num(body.wageSpend),
      remainingWageBudget: num(body.remainingWageBudget),
      debt: num(body.debt),
      notes: body.notes || null,
    },
  })

  return NextResponse.json(finance)
}
