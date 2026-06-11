import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
const GROQ_TEXT_MODEL = 'llama-3.3-70b-versatile'
const GROQ_API_KEY = process.env.GROQ_API_KEY!

async function callGroqVision(prompt: string, images: Array<{ base64: string; mimeType: string }>) {
  const content: any[] = [{ type: 'text', text: prompt }]
  for (const img of images) {
    content.push({
      type: 'image_url',
      image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
    })
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      messages: [{ role: 'user', content }],
      temperature: 0.2,
      max_tokens: 2000,
    }),
  })
  if (!res.ok) throw new Error(`Groq vision error: ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content as string
}

async function callGroqText(systemPrompt: string, userPrompt: string) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: GROQ_TEXT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  })
  if (!res.ok) throw new Error(`Groq text error: ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content as string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { saveId, images } = body
  // images: Array<{ base64: string; mimeType: string; label?: string }>
  // labels: e.g. "transfer_offer", "player_profile", "club_finances"

  if (!images || images.length === 0) {
    return NextResponse.json({ error: 'At least one image required' }, { status: 400 })
  }

  // Verify save belongs to user
  const save = await prisma.save.findFirst({
    where: { id: saveId, userId: user.id },
  })
  if (!save) return NextResponse.json({ error: 'Save not found' }, { status: 404 })

  // Fetch most recent checkpoint context
  const latestCheckpoint = await prisma.checkpoint.findFirst({
    where: { season: { saveId } },
    orderBy: { createdAt: 'desc' },
    include: {
      season: true,
      teamStats: true,
      financeSnapshot: true,
      playerStats: {
        include: { player: true },
        orderBy: { avgRating: 'desc' },
        take: 20,
      },
    },
  })

  // Build context string from save + latest checkpoint
  const philosophy = save.philosophy as any
  let saveContext = `SAVE: ${save.name} (${save.fmVersion}) — ${save.startingClub || 'Unknown club'}`
  if (philosophy?.longTermGoal) saveContext += `\nLong-term goal: ${philosophy.longTermGoal}`
  if (philosophy?.recruitmentStyle) saveContext += `\nRecruitment style: ${philosophy.recruitmentStyle}`
  if (philosophy?.maxNormalWagePw) saveContext += `\nMax normal wage: £${philosophy.maxNormalWagePw}/week`
  if (philosophy?.maxKeyPlayerWagePw) saveContext += `\nMax key player wage: £${philosophy.maxKeyPlayerWagePw}/week`

  let checkpointContext = 'No checkpoint data available.'
  if (latestCheckpoint) {
    const ts = latestCheckpoint.teamStats
    const fs = latestCheckpoint.financeSnapshot
    checkpointContext = `CURRENT SEASON (${latestCheckpoint.season.seasonLabel} — ${latestCheckpoint.season.clubName}):`
    if (latestCheckpoint.transferWindowStatus) checkpointContext += `\nTransfer window: ${latestCheckpoint.transferWindowStatus}`
    if (ts) {
      checkpointContext += `\nLeague position: ${ts.leaguePosition ?? '?'}, Points: ${ts.points ?? '?'}, Played: ${ts.played ?? '?'}`
      if (ts.wins != null) checkpointContext += ` (W${ts.wins} D${ts.draws} L${ts.losses})`
    }
    if (fs) {
      if (fs.transferBudget != null) checkpointContext += `\nTransfer budget remaining: £${(fs.transferBudget / 1e6).toFixed(1)}M`
      if (fs.balance != null) checkpointContext += `\nClub balance: £${(fs.balance / 1e6).toFixed(1)}M`
    }
    if (latestCheckpoint.playerStats.length > 0) {
      checkpointContext += `\nKey players (by rating): ${latestCheckpoint.playerStats
        .slice(0, 10)
        .map(ps => `${ps.player.name} (${ps.position || '?'}, age ${ps.age || '?'}, rating ${ps.avgRating?.toFixed(1) || '?'})`)
        .join(', ')}`
    }
  }

  // Phase 1: Vision — extract offer details from all screenshots
  const imageLabels = images.map((img: any) => img.label || 'transfer_offer').join(', ')
  const visionPrompt = `You are analysing Football Manager screenshots related to a transfer offer decision.

The images provided are: ${imageLabels}

Extract all relevant information from these screenshots. Return ONLY valid JSON:
{
  "playerName": "string or null",
  "playerAge": number or null,
  "playerPosition": "string or null",
  "buyingClub": "string or null",
  "offerAmount": number or null,
  "offerCurrency": "£ or € or $ or null",
  "playerCurrentValue": "string or null",
  "playerWage": "string or null",
  "contractExpiry": "string or null",
  "playerAttributes": "brief summary of visible attributes or null",
  "clubFinancialContext": "any relevant financial info visible or null",
  "otherRelevantInfo": "anything else visible that's relevant to the transfer decision or null"
}`

  let extracted: any = {}
  try {
    const rawExtraction = await callGroqVision(visionPrompt, images)
    const jsonMatch = rawExtraction.match(/\{[\s\S]*\}/)
    if (jsonMatch) extracted = JSON.parse(jsonMatch[0])
  } catch (e) {
    console.error('Vision extraction error:', e)
  }

  // Phase 2: Text — generate verdict with full context
  const systemPrompt = `You are an expert Football Manager advisor helping a manager decide whether to accept, reject, or negotiate a transfer offer for one of their players.

You have access to:
1. Details extracted from the transfer offer screenshot(s)
2. The manager's save context and philosophy
3. The latest checkpoint data (squad, league position, finances)

Be direct, practical, and specific. Reference exact numbers and context when relevant. Consider:
- Player's importance to the squad (position, rating, age)
- Financial impact (offer vs. value, budget situation)
- Long-term save goals
- Whether reinvestment is realistic given the transfer budget
- Contract situation (sell now vs. risk losing on a free)
- Squad depth at the player's position`

  const userPrompt = `TRANSFER OFFER DETAILS (extracted from screenshots):
${JSON.stringify(extracted, null, 2)}

SAVE CONTEXT:
${saveContext}

CHECKPOINT CONTEXT:
${checkpointContext}

Based on all of this, provide your transfer verdict. Return ONLY valid JSON:
{
  "verdict": "Accept" or "Reject" or "Negotiate",
  "confidence": "High" or "Medium" or "Low",
  "reasoning": "2-4 sentence explanation of your verdict",
  "keyFactors": [
    { "factor": "factor name", "sentiment": "positive" or "negative" or "neutral", "detail": "one sentence" }
  ],
  "negotiationAdvice": "if verdict is Negotiate — what to push for; otherwise null",
  "reinvestmentSuggestion": "brief suggestion on how to reinvest the fee if sold; null if recommending reject"
}`

  let verdict: any = {
    verdict: 'Negotiate',
    confidence: 'Low',
    reasoning: 'Unable to generate full analysis — please ensure screenshots are clear.',
    keyFactors: [],
    negotiationAdvice: null,
    reinvestmentSuggestion: null,
  }

  try {
    const rawVerdict = await callGroqText(systemPrompt, userPrompt)
    const jsonMatch = rawVerdict.match(/\{[\s\S]*\}/)
    if (jsonMatch) verdict = JSON.parse(jsonMatch[0])
  } catch (e) {
    console.error('Verdict generation error:', e)
  }

  return NextResponse.json({
    extracted,
    verdict: verdict.verdict,
    confidence: verdict.confidence,
    reasoning: verdict.reasoning,
    keyFactors: verdict.keyFactors || [],
    negotiationAdvice: verdict.negotiationAdvice,
    reinvestmentSuggestion: verdict.reinvestmentSuggestion,
    contextCheckpointId: latestCheckpoint?.id || null,
  })
}
