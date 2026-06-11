import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const EXTRACT_PROMPT = `You are an expert Football Manager 26 tactics analyst reading a tactic screenshot.

Extract ALL visible information. FM26 IP instructions: Attacking Transition, Build-Up Strategy, Creative Freedom, Crossing Style, Dribbling, GK Distribution, GK Distribution Speed, Goal Kicks, Pass Reception, Passing Directness, Patience, Play for Set Pieces, Progress Through, Shots from Distance, Overlap, Underlap, Tempo, Time Wasting. FM26 OOP instructions: Cross Engagement, Defensive Line, Defensive Line Behaviour, Defensive Transition, Line of Engagement, Pressing Trap, Short GK Distribution, Trigger Press.

Return ONLY valid JSON:
{
  "formation": "4-2-3-1 or null",
  "oopFormation": "4-5-1 or null",
  "mentality": "Positive or null",
  "ipInstructions": { "instruction name": "setting value" },
  "oopInstructions": { "instruction name": "setting value" },
  "roles": ["GK - Sweeper Keeper (Defend)", "..."],
  "confidence": "high/medium/low"
}`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { images } = body as { images: { base64: string; mimeType: string; label: string }[] }

  if (!images?.length) {
    return NextResponse.json({ error: 'At least one tactic screenshot is required' }, { status: 400 })
  }

  // Phase 1: Vision extraction from all uploaded screenshots
  let extraction: Record<string, unknown> = {}
  try {
    const imageContent = images.map(img => ({
      type: 'image_url' as const,
      image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
    }))

    const visionCompletion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [{ type: 'text', text: EXTRACT_PROMPT }, ...imageContent],
      }],
      temperature: 0.1,
    })

    const rawText = visionCompletion.choices[0]?.message?.content || ''
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (jsonMatch) extraction = JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error('Vision extraction error:', err)
    return NextResponse.json({ error: 'Could not read tactic from screenshots' }, { status: 500 })
  }

  // Phase 2: Deep tactical analysis + comparison to community meta
  const analysisPrompt = `You are an elite Football Manager 26 tactical analyst. Analyse this tactic thoroughly.

TACTIC:
Formation (IP): ${extraction.formation || 'Unknown'}
Formation (OOP): ${extraction.oopFormation || 'Same as IP'}
Mentality: ${extraction.mentality || 'Unknown'}
IP Instructions: ${JSON.stringify(extraction.ipInstructions || {})}
OOP Instructions: ${JSON.stringify(extraction.oopInstructions || {})}
Player Roles: ${JSON.stringify(extraction.roles || [])}

Provide a detailed analysis. Be specific about the instruction settings you see.

Respond ONLY with valid JSON:
{
  "overallRating": 75,
  "styleTags": ["High Press", "Short Passing", "Wide Play"],
  "suitableFor": ["Non-League", "Lower League", "Championship"],
  "pressIntensity": "High",
  "defensiveShape": "Brief description of defensive structure and how solid it is",
  "attackingPattern": "How this tactic creates chances based on the IP instructions",
  "strengths": ["3-4 specific strengths referencing the actual instruction settings"],
  "weaknesses": ["3-4 specific vulnerabilities or tactical gaps"],
  "keyPositions": ["2-3 most important positions for this system to work"],
  "improvements": [
    {
      "instruction": "Exact FM26 instruction name",
      "currentSetting": "What it is now or null if not set",
      "suggestedSetting": "What to change it to",
      "reason": "Specific reason why this improves the tactic"
    }
  ],
  "similarCommunityTactics": ["Names of similar well-known FM26 community tactics"],
  "verdict": "2-3 sentence overall verdict — what kind of save/squad suits this tactic"
}`

  try {
    const analysisCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: analysisPrompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const analysisText = analysisCompletion.choices[0]?.message?.content || '{}'
    const analysis = JSON.parse(analysisText)

    return NextResponse.json({ extraction, analysis })
  } catch (err) {
    console.error('Analysis error:', err)
    return NextResponse.json({ error: 'Tactical analysis failed' }, { status: 500 })
  }
}
