import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { saveId, additionalContext } = await req.json()
  if (!saveId) return NextResponse.json({ error: 'saveId required' }, { status: 400 })

  // Load save with latest season + finance + squad data
  const save = await prisma.save.findFirst({
    where: { id: saveId, userId: user.id },
    include: {
      seasons: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          checkpoints: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              financeSnapshot: true,
              playerStats: {
                include: { player: true },
                take: 30,
              },
              teamStats: true,
              tacticSnapshot: true,
            },
          },
        },
      },
    },
  })

  if (!save) return NextResponse.json({ error: 'Save not found' }, { status: 404 })

  const latestSeason = save.seasons[0]
  const latestCheckpoint = latestSeason?.checkpoints[0]
  const finance = latestCheckpoint?.financeSnapshot
  const teamStats = latestCheckpoint?.teamStats
  const tactic = latestCheckpoint?.tacticSnapshot
  const playerStats = latestCheckpoint?.playerStats || []

  // Build squad summary
  const squadSummary = playerStats.map(ps => ({
    name: ps.player.name,
    position: ps.position || ps.player.position || 'Unknown',
    appearances: ps.appearances,
    goals: ps.goals,
    assists: ps.assists,
    avgRating: ps.avgRating,
    value: ps.valueMin && ps.valueMax ? `£${(ps.valueMin / 1000000).toFixed(1)}m–£${(ps.valueMax / 1000000).toFixed(1)}m` : null,
    contractExpiry: ps.contractExpiry,
    morale: ps.morale,
  }))

  const prompt = `You are an expert Football Manager analyst helping plan the transfer window.

## Save Context
- Club: ${save.currentClub || 'Unknown'}
- League: ${latestSeason?.leagueName || 'Unknown'}
- Season: ${latestSeason?.seasonLabel || 'Unknown'}
- Formation: ${tactic?.formation || 'Unknown'}
- Mentality: ${tactic?.mentality || 'Unknown'}

## Finance
- Transfer Budget: ${finance?.transferBudget ? `£${(finance.transferBudget / 1000000).toFixed(1)}m` : 'Unknown'}
- Wage Budget Remaining: ${finance?.remainingWageBudget ? `£${(finance.remainingWageBudget / 1000).toFixed(0)}k/wk` : 'Unknown'}
- Club Balance: ${finance?.balance ? `£${(finance.balance / 1000000).toFixed(1)}m` : 'Unknown'}

## Team Performance
- League Position: ${teamStats?.leaguePosition ?? 'Unknown'}
- Record: ${teamStats?.wins ?? '?'}W ${teamStats?.draws ?? '?'}D ${teamStats?.losses ?? '?'}L
- Goals For/Against: ${teamStats?.goalsFor ?? '?'}/${teamStats?.goalsAgainst ?? '?'}
- xG: ${teamStats?.xg ?? 'Unknown'} | xGA: ${teamStats?.xga ?? 'Unknown'}

## Current Squad (from latest checkpoint)
${squadSummary.length > 0 ? JSON.stringify(squadSummary, null, 2) : 'No squad data available'}

${additionalContext ? `## Additional Context from Manager\n${additionalContext}` : ''}

## Your Task
Analyse the squad and provide a structured transfer window plan. Return a JSON object with this exact structure:

{
  "summary": "2-3 sentence overview of the squad situation",
  "priorities": [
    {
      "priority": "High" | "Medium" | "Low",
      "action": "Buy" | "Sell" | "Loan In" | "Loan Out" | "Contract",
      "position": "e.g. ST, CB, GK",
      "reasoning": "Why this is needed",
      "budget": "Suggested fee range",
      "profile": "What attributes/type of player to look for"
    }
  ],
  "sellCandidates": [
    {
      "playerName": "Name",
      "reason": "Why to sell",
      "estimatedValue": "Value range"
    }
  ],
  "keyRisks": ["Risk 1", "Risk 2"],
  "budgetAdvice": "How to approach the budget",
  "overallVerdict": "One sentence summary recommendation"
}

Return ONLY the JSON, no other text.`

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.4,
    })

    const text = response.choices[0]?.message?.content || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const plan = JSON.parse(jsonMatch[0])
    return NextResponse.json({ plan, saveContext: { club: save.currentClub, season: latestSeason?.seasonLabel } })
  } catch (err) {
    console.error('Transfer planner error:', err)
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
  }
}
