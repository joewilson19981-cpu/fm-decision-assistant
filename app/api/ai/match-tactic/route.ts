import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

interface Tactic {
  id: string
  name: string
  formation: string
  oopFormation: string
  mentality: string
  style: string[]
  leagueLevels: string[]
  ipInstructions: Record<string, string>
  oopInstructions: Record<string, string>
  description: string
}

interface MatchResult {
  tacticId: string
  matchScore: number
  reasoning: string
  recommendation: 'Strong Match' | 'Good Match' | 'Possible Match' | 'Poor Match'
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { saveId, tactics } = body as { saveId: string; tactics: Tactic[] }

  if (!saveId || !tactics?.length) {
    return NextResponse.json({ error: 'saveId and tactics are required' }, { status: 400 })
  }

  // Fetch save
  const save = await prisma.save.findFirst({ where: { id: saveId, userId: user.id } })
  if (!save) return NextResponse.json({ error: 'Save not found' }, { status: 404 })

  // Fetch latest checkpoint with full context
  const latestSeason = await (prisma as any).season.findFirst({
    where: { saveId },
    orderBy: { createdAt: 'desc' },
    include: {
      checkpoints: {
        where: { status: 'locked' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          teamStats: true,
          financeSnapshot: true,
          tacticSnapshot: true,
        },
      },
    },
  })

  const latestCheckpoint = latestSeason?.checkpoints?.[0]
  const teamStats = latestCheckpoint?.teamStats
  const finances = latestCheckpoint?.financeSnapshot
  const tacticSnap = latestCheckpoint?.tacticSnapshot

  // Build save context string
  const saveContext = `
Save Name: ${save.name}
FM Version: ${(save as any).fmVersion || 'FM26'}
Manager: ${(save as any).managerName || 'Unknown'}
Club: ${(save as any).currentClub || (save as any).startingClub || 'Unknown'}
Country: ${(save as any).country || 'Unknown'}
Philosophy: ${JSON.stringify((save as any).philosophy || {})}

${latestSeason ? `Current Season: ${latestSeason.seasonLabel} | Division: ${latestSeason.leagueName} | Level: ${latestSeason.divisionLevel || 'Unknown'}
Board Expectation: ${latestSeason.boardExpectation || 'Not set'}
Transfer Budget: ${finances?.transferBudget ? `£${finances.transferBudget.toLocaleString()}` : 'Unknown'}
Wage Budget: ${latestSeason.wageBudget ? `£${latestSeason.wageBudget.toLocaleString()}` : 'Unknown'}` : 'No season data'}

${teamStats ? `Team Stats (latest checkpoint):
- League Position: ${teamStats.leaguePosition}
- Record: W${teamStats.wins} D${teamStats.draws} L${teamStats.losses} (${teamStats.played} played)
- Goals For: ${teamStats.goalsFor} | Goals Against: ${teamStats.goalsAgainst}
- xG: ${teamStats.xg ?? 'N/A'} | xGA: ${teamStats.xga ?? 'N/A'}
- Possession: ${teamStats.possession ?? 'N/A'}% | Pass Completion: ${teamStats.passCompletion ?? 'N/A'}%
- Shots/Game: ${teamStats.shotsPerGame ?? 'N/A'} | Clean Sheets: ${teamStats.cleanSheets ?? 'N/A'}` : 'No team stats available'}

${tacticSnap ? `Current Tactic:
- Formation: ${tacticSnap.formation || 'Unknown'}
- Mentality: ${tacticSnap.mentality || 'Unknown'}
- IP Instructions: ${JSON.stringify(tacticSnap.inPossessionInstructions || {})}
- OOP Instructions: ${JSON.stringify(tacticSnap.outOfPossessionInstructions || {})}` : 'No tactic data'}
`.trim()

  const tacticSummaries = tactics.map(t => ({
    id: t.id,
    name: t.name,
    formation: t.formation,
    oopFormation: t.oopFormation,
    mentality: t.mentality,
    style: t.style.join(', '),
    leagueLevels: t.leagueLevels.join(', '),
    description: t.description,
  }))

  const prompt = `You are an expert Football Manager 26 scout and tactics analyst.

I need you to score each of the following community tactics against a manager's save context. For each tactic, provide:
1. A match score from 0-100 (how well it suits this save)
2. A recommendation category: "Strong Match" (80-100), "Good Match" (60-79), "Possible Match" (40-59), or "Poor Match" (0-39)
3. A 1-2 sentence reasoning (specific to THIS save's division, club level, stats, and philosophy)

SAVE CONTEXT:
${saveContext}

TACTICS TO EVALUATE:
${JSON.stringify(tacticSummaries, null, 2)}

Respond ONLY with valid JSON in this exact format:
{
  "results": [
    {
      "tacticId": "tactic-id",
      "matchScore": 85,
      "recommendation": "Strong Match",
      "reasoning": "Specific reasoning about why this tactic suits or doesn't suit this particular save."
    }
  ]
}

Consider: division level, squad quality implied by stats, playing style, budget constraints, current formation/mentality if available. Be specific and insightful.`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(responseText) as { results: MatchResult[] }

    if (!parsed.results || !Array.isArray(parsed.results)) {
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 })
    }

    return NextResponse.json({ results: parsed.results })
  } catch (err) {
    console.error('match-tactic error:', err)
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
  }
}
