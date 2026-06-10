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

  const created = await prisma.screenshot.createMany({
    data: body.screenshots.map((s: any, idx: number) => ({
      checkpointId,
      fileUrl: s.fileUrl,
      storagePath: s.storagePath,
      originalFilename: s.originalFilename,
      screenshotType: s.screenshotType || null,
      uploadOrder: idx,
      mimeType: s.mimeType || null,
      fileSize: s.fileSize || null,
    })),
  })

  return NextResponse.json(created, { status: 201 })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ saveId: string; seasonId: string; checkpointId: string }> }
) {
  const { checkpointId } = await params
  const screenshots = await prisma.screenshot.findMany({
    where: { checkpointId },
    orderBy: { uploadOrder: 'asc' },
  })
  return NextResponse.json(screenshots)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ saveId: string; seasonId: string; checkpointId: string }> }
) {
  const { saveId, seasonId, checkpointId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  await supabase.storage.from('screenshots').remove([body.storagePath])
  await prisma.screenshot.delete({ where: { id: body.id } })

  return NextResponse.json({ ok: true })
}
