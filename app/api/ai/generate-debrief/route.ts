import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

const MILESTONE_CONTEXT: Record<string, string> = {
  pre_season: 'pre-season (0 games played)',
  game_10: 'after 10 games (roughly a quarter of the season)',
  game_23: 'after 23 games (roughly halfway through the season)',
  game_35: 'after 35 games (roughly three-quarters through the season)',
  game_46: 'at the end of the season (all 46 games played)',
}

function fmt(n: number | null | undefined, prefix = '') {
  return n != null ? `${prefix}${n}` : 'unknown'
}

function fmtMoney(n: number | null | undefined) {
  if (n == null) return 'unknown'
  if (Math.abs(n) >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `£${(n / 1_000).toFixed(0)}K`
  return `£${n}`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { checkpointId, saveId, seasonId } = await req.json()

    // Fetch checkpoint with all related data
    const checkpoint = await prisma.checkpoint.findFirst({
      where: { id: checkpointId, seasonId, season: { saveId, save: { userId: user.id } } },
      include: {
        season: true,
        teamStats: true,
        leagueTableSnapshots: { orderBy: { position: 'asc' } },
        tacticSnapshot: true,
        financeSnapshot: true,
        medicalSnapshot: true,
        playerStats: {
          include: { player: true },
          orderBy: { goals: 'desc' },
          take: 10,
        },
      },
    })

    if (!checkpoint) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Fetch previous checkpoints in the same season for intra-season comparison
    const prevCheckpoints = await prisma.checkpoint.findMany({
      where: {
        seasonId,
        id: { not: checkpointId },
        teamStats: { isNot: null },
      },
      include: { teamStats: true },
      orderBy: { createdAt: 'asc' },
    })

    const ts = checkpoint.teamStats
    const lt = checkpoint.leagueTableSnapshots
    const tac = checkpoint.tacticSnapshot
    const fin = checkpoint.financeSnapshot
    const med = checkpoint.medicalSnapshot
    const players = checkpoint.playerStats

    const milestoneCtx = MILESTONE_CONTEXT[checkpoint.checkpointType] ?? checkpoint.checkpointType
    const myRow = lt.find(r => r.isYourTeam)

    // Build context string for the prompt
    const lines: string[] = []

    lines.push(`CLUB: ${checkpoint.season.clubName}`)
    lines.push(`LEAGUE: ${checkpoint.season.leagueName}`)
    lines.push(`SEASON: ${checkpoint.season.seasonLabel}`)
    lines.push(`CHECKPOINT: ${milestoneCtx}`)
    lines.push(`IN-GAME DATE: ${checkpoint.inGameDate ? new Date(checkpoint.inGameDate).toLocaleDateString('en-GB') : 'unknown'}`)
    lines.push('')

    if (ts) {
      lines.push('LEAGUE STANDING:')
      lines.push(`  Position: ${fmt(ts.leaguePosition)} of ${lt.length || '?'} teams`)
      lines.push(`  Points: ${fmt(ts.points)} (${fmt(ts.wins)}W ${fmt(ts.draws)}D ${fmt(ts.losses)}L)`)
      lines.push(`  Goals: ${fmt(ts.goalsFor)} scored, ${fmt(ts.goalsAgainst)} conceded (diff: ${(ts.goalsFor ?? 0) - (ts.goalsAgainst ?? 0) > 0 ? '+' : ''}${fmt((ts.goalsFor ?? 0) - (ts.goalsAgainst ?? 0))})`)
      if (ts.xg != null) lines.push(`  xG: ${ts.xg} for, ${ts.xga ?? '?'} against`)
      if (ts.cleanSheets != null) lines.push(`  Clean sheets: ${ts.cleanSheets}`)
      if (ts.possession != null) lines.push(`  Possession: ${ts.possession}%`)
      if (ts.passCompletion != null) lines.push(`  Pass completion: ${ts.passCompletion}%`)
      if (ts.shotsPerGame != null) lines.push(`  Shots per game: ${ts.shotsPerGame}`)
      lines.push('')
    }

    // League table context (top 5 + your position)
    if (lt.length > 0) {
      lines.push('LEAGUE TABLE CONTEXT (top 5):')
      lt.slice(0, 5).forEach(row => {
        lines.push(`  ${row.position}. ${row.teamName}${row.isYourTeam ? ' ← YOUR TEAM' : ''}: ${row.points} pts (${row.wins}W ${row.draws}D ${row.losses}L, GD ${row.goalDiff > 0 ? '+' : ''}${row.goalDiff})`)
      })
      if (myRow && myRow.position > 5) {
        lines.push(`  ...`)
        lines.push(`  ${myRow.position}. ${myRow.teamName} ← YOUR TEAM: ${myRow.points} pts (${myRow.wins}W ${myRow.draws}D ${myRow.losses}L, GD ${myRow.goalDiff > 0 ? '+' : ''}${myRow.goalDiff})`)
      }
      // Bottom of table context
      const bottom = lt.slice(-3)
      if (bottom[0] && bottom[0].position > 5) {
        lines.push(`  ... (${lt.length} teams total — bottom 3:)`)
        bottom.forEach(row => {
          lines.push(`  ${row.position}. ${row.teamName}${row.isYourTeam ? ' ← YOUR TEAM' : ''}: ${row.points} pts`)
        })
      }
      lines.push('')
    }

    if (myRow?.form) {
      lines.push(`RECENT FORM (last ${myRow.form.length} games): ${myRow.form.split('').join(' ')}`)
      lines.push('')
    }

    if (tac) {
      lines.push(`TACTIC: ${tac.formation ?? 'unknown formation'}, ${tac.mentality ?? 'unknown mentality'} mentality`)
      lines.push('')
    }

    if (fin) {
      lines.push('FINANCES:')
      lines.push(`  Bank balance: ${fmtMoney(fin.balance)}`)
      lines.push(`  Transfer budget: ${fmtMoney(fin.transferBudget)}`)
      lines.push(`  Wage budget: ${fmtMoney(fin.wageBudget)}/week, currently spending ${fmtMoney(fin.wageSpend)}/week`)
      lines.push('')
    }

    if (med) {
      lines.push('SQUAD HEALTH:')
      lines.push(`  Current injuries: ${fmt(med.currentInjuries)}`)
      if (med.totalInjuriesThisSeason != null) lines.push(`  Total injuries this season: ${med.totalInjuriesThisSeason}`)
      if (med.overallSquadCondition) lines.push(`  Overall condition: ${med.overallSquadCondition}`)
      if (med.notes) lines.push(`  Notes: ${med.notes}`)
      lines.push('')
    }

    if (players.length > 0) {
      lines.push('TOP PERFORMERS (by goals):')
      players.slice(0, 8).forEach(p => {
        const parts = [p.player.name]
        if (p.position) parts.push(`(${p.position})`)
        const stats = []
        if (p.goals) stats.push(`${p.goals} goals`)
        if (p.assists) stats.push(`${p.assists} assists`)
        if (p.appearances) stats.push(`${p.appearances} apps`)
        if (p.avgRating) stats.push(`${Number(p.avgRating).toFixed(2)} avg rating`)
        parts.push(':')
        parts.push(stats.join(', ') || 'no stats')
        lines.push(`  ${parts.join(' ')}`)
      })
      lines.push('')
    }

    // Previous checkpoint comparison (same season)
    if (prevCheckpoints.length > 0) {
      const lastCp = prevCheckpoints[prevCheckpoints.length - 1]
      const lastTs = lastCp.teamStats
      if (lastTs) {
        lines.push(`PROGRESS SINCE LAST CHECKPOINT (${lastCp.checkpointType}):`)
        if (lastTs.leaguePosition != null && ts?.leaguePosition != null) {
          const posDiff = lastTs.leaguePosition - ts.leaguePosition
          lines.push(`  Position: ${lastTs.leaguePosition} → ${ts.leaguePosition} (${posDiff > 0 ? '+' + posDiff + ' places up' : posDiff < 0 ? Math.abs(posDiff) + ' places down' : 'same'})`)
        }
        if (lastTs.points != null && ts?.points != null) {
          lines.push(`  Points: ${lastTs.points} → ${ts.points} (+${(ts.points - lastTs.points)} gained)`)
        }
        lines.push('')
      }
    }

    const contextText = lines.join('\n')

    const PROMPT = `You are an expert Football Manager analyst. You are giving a post-checkpoint debrief to the manager of ${checkpoint.season.clubName}. Be direct, honest, and specific — reference the actual numbers. Keep it punchy and useful. Do NOT be generic or vague.

Here is the current state of the save:

${contextText}

Return ONLY valid JSON (no explanation, no markdown) in this exact format:
{
  "headline": "One punchy, specific sentence that captures the current situation",
  "verdict": "flying | solid | mixed | concerning | crisis",
  "rating": <number 1-10>,
  "positives": [
    "Specific positive point with actual numbers where possible",
    "...",
    "..."
  ],
  "concerns": [
    "Specific concern with actual numbers where possible",
    "...",
    "..."
  ],
  "squadNote": "One sentence about squad health/injuries or null if fine",
  "financialNote": "One sentence about the financial picture or null",
  "lookingAhead": "2-3 sentences on what to prioritise before the next checkpoint"
}

Rules:
- positives: 2-4 items
- concerns: 1-4 items (be honest — if things look good, say so)
- All points must reference actual data, not generic FM advice
- lookingAhead must be specific to this club's situation, not generic
- squadNote / financialNote can be null if there is nothing notable to say`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: PROMPT }],
        max_tokens: 1024,
        temperature: 0.4,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Groq error: ${response.status} ${err}`)
    }

    const result = await response.json()
    const text = result.choices[0]?.message?.content ?? ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const debrief = JSON.parse(cleaned)

    // Save debrief to checkpoint (field added via schema migration)
    await prisma.checkpoint.update({
      where: { id: checkpointId },
      data: { aiDebrief: JSON.stringify(debrief) } as any,
    })

    return NextResponse.json({ debrief })
  } catch (err: any) {
    console.error('generate-debrief error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate debrief' }, { status: 500 })
  }
}
