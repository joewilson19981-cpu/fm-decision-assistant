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

  // Delete existing player stats for this checkpoint then re-insert
  await prisma.playerCheckpointStats.deleteMany({ where: { checkpointId } })

  const results = []
  for (const p of body.players) {
    if (!p.name?.trim()) continue

    // Find or create the player record for this save
    let player = await prisma.player.findFirst({ where: { saveId, name: p.name.trim() } })
    if (!player) {
      player = await prisma.player.create({
        data: { saveId, name: p.name.trim(), position: p.position || null },
      })
    }

    const stat = await prisma.playerCheckpointStats.create({
      data: {
        checkpointId,
        playerId: player.id,
        age: num(p.age),
        position: p.position || null,
        appearances: num(p.appearances),
        goals: num(p.goals),
        assists: num(p.assists),
        cleanSheets: num(p.cleanSheets),
        avgRating: num(p.avgRating),
        yellowCards: num(p.yellowCards),
        redCards: num(p.redCards),
        wage: num(p.wage),
        contractExpiry: p.contractExpiry ? new Date(p.contractExpiry) : null,
        morale: p.morale || null,
      },
    })
    results.push(stat)
  }

  return NextResponse.json(results)
}
