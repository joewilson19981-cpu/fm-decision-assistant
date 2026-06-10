import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ saveId: string }> }
) {
  const { saveId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const save = await prisma.save.findFirst({ where: { id: saveId, userId: user.id } })
  if (!save) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.save.delete({ where: { id: saveId } })
  return NextResponse.json({ ok: true })
}
