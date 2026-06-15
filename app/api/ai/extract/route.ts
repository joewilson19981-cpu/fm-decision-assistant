import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const EXTRACT_PROMPT = `You are an expert at reading Football Manager screenshots.
You will receive one or more FM screenshots. Extract ALL visible data from ALL images combined and return ONLY a single valid JSON object:
{
  "gameDate": "YYYY-MM-DD or null",
  "transferWindow": "open | closed | null",
  "leagueName": "string or null",
  "clubName": "string or null",
  "leagueTable": [{ "position": 1, "teamName": "...", "played": 0, "wins": 0, "draws": 0, "losses": 0, "goalsFor": 0, "goalsAgainst": 0, "goalDiff": 0, "points": 0, "form": null, "isYourTeam": false }],
  "teamStats": { "leaguePosition": null, "played": null, "wins": null, "draws": null, "losses": null, "points": null, "goalsFor": null, "goalsAgainst": null, "goalDiff": null, "cleanSheets": null, "xg": null, "xga": null, "possession": null, "shotsPerGame": null, "passCompletion": null, "clearCutChancesFor": null, "clearCutChancesAgainst": null, "setPieceGoalsFor": null, "setPieceGoalsAgainst": null },
  "playerStats": [{ "name": "...", "position": "...", "age": null, "appearances": null, "goals": null, "assists": null, "cleanSheets": null, "avgRating": null, "yellowCards": null, "redCards": null, "wage": null, "contractExpiry": null, "morale": null }],
  "tactic": { "formation": null, "mentality": null },
  "finances": { "balance": null, "profitLoss": null, "transferBudget": null, "wageBudget": null, "wageSpend": null, "remainingWageBudget": null },
  "medical": { "currentInjuries": null, "totalInjuriesThisSeason": null, "overallSquadCondition": null, "notes": null }
}
Rules:
- Merge players across all squad screenshots (deduplicate by name)
- Convert financials to raw numbers (£2.5M → 2500000). Dates to YYYY-MM-DD
- For league tables, set isYourTeam: true for the highlighted/bold team row
- Return ONLY the JSON, no explanation`

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json()
    if (!images?.length) return NextResponse.json({ error: 'No images' }, { status: 400 })

    const imageBlocks: Anthropic.ImageBlockParam[] = images.slice(0, 20).map((img: any) => ({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: img.base64 },
    }))

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: [...imageBlocks, { type: 'text', text: EXTRACT_PROMPT }],
      }],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''

    // Robust JSON extraction — handle cases where Claude adds commentary
    let jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    // If there's text before the JSON object, find the first {
    const firstBrace = jsonStr.indexOf('{')
    if (firstBrace > 0) jsonStr = jsonStr.slice(firstBrace)
    // If there's text after the JSON object, find the last }
    const lastBrace = jsonStr.lastIndexOf('}')
    if (lastBrace >= 0 && lastBrace < jsonStr.length - 1) jsonStr = jsonStr.slice(0, lastBrace + 1)

    const extracted = JSON.parse(jsonStr)
    return NextResponse.json(extracted)
  } catch (err: any) {
    console.error('Extract error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
