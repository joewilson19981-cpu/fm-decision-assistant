import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Verify DB connection and all critical tables exist
    const [saveCount, seasonCount, checkpointCount, playerCount, youthCount] = await Promise.all([
      prisma.save.count(),
      prisma.season.count(),
      prisma.checkpoint.count(),
      prisma.player.count(),
      prisma.youthPlayer.count(),
    ])

    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      tables: {
        saves: saveCount,
        seasons: seasonCount,
        checkpoints: checkpointCount,
        players: playerCount,
        youthPlayers: youthCount,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      db: 'disconnected',
      error: err.message,
      hint: 'Run: npx prisma db push',
    }, { status: 503 })
  }
}
