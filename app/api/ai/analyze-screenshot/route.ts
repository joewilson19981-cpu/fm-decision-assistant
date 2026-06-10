import { NextRequest, NextResponse } from 'next/server'

const PROMPT = `You are an expert at reading Football Manager screenshots.
Analyze the screenshot and extract ALL visible data. Return ONLY valid JSON — no explanation, no markdown, just the raw JSON object.

The JSON must follow this exact structure (omit any key where data is not visible):
{
  "screenshotType": "league_table | team_stats | player_stats | tactic | finances | medical | match_result | squad | inbox | other",
  "gameDate": "YYYY-MM-DD or null",
  "transferWindow": "open | closed | null (open if any transfer window is active, closed otherwise)",
  "leagueName": "string or null",
  "clubName": "string or null",
  "leagueTable": [
    { "position": 1, "teamName": "...", "played": 0, "wins": 0, "draws": 0, "losses": 0, "goalsFor": 0, "goalsAgainst": 0, "goalDiff": 0, "points": 0, "form": "WWDLL or null", "isYourTeam": false }
  ],
  "teamStats": {
    "leaguePosition": null, "played": null, "wins": null, "draws": null, "losses": null,
    "points": null, "goalsFor": null, "goalsAgainst": null, "goalDiff": null,
    "cleanSheets": null, "xg": null, "xga": null,
    "possession": null, "shotsPerGame": null, "passCompletion": null,
    "clearCutChancesFor": null, "clearCutChancesAgainst": null,
    "setPieceGoalsFor": null, "setPieceGoalsAgainst": null,
    "crossAssistsFor": null, "crossAssistsAgainst": null
  },
  "playerStats": [
    {
      "name": "...", "position": "...", "age": null,
      "appearances": null, "goals": null, "assists": null,
      "cleanSheets": null, "avgRating": null,
      "yellowCards": null, "redCards": null,
      "wage": null, "contractExpiry": "YYYY-MM-DD or null", "morale": "..."
    }
  ],
  "tactic": { "formation": "...", "mentality": "..." },
  "finances": {
    "balance": null, "profitLoss": null,
    "transferBudget": null, "wageBudget": null,
    "wageSpend": null, "remainingWageBudget": null, "debt": null
  },
  "medical": {
    "currentInjuries": null, "totalInjuriesThisSeason": null,
    "overallSquadCondition": "Excellent | Good | Average | Poor | Critical or null",
    "notes": "list any injured players and return dates if visible"
  }
}

Be thorough — extract every number, name, and piece of text you can see.
For financial figures, convert to raw numbers (e.g. "£2.5M" → 2500000, "£1,500/wk" → 1500).
For dates, convert to YYYY-MM-DD format.
If the screenshot shows a league table, populate both leagueTable array AND teamStats for the highlighted/bold team (that is the user's team — set isYourTeam: true for that row).`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64, mimeType } = body

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 })
    }

    const groqBody = JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType || 'image/png'};base64,${imageBase64}` },
            },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    })

    // Retry up to 3 times on rate limit (429)
    let response: Response | null = null
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: groqBody,
      })

      if (response.status !== 429) break

      // Parse retry-after from error body, default 8s
      const errJson = await response.json().catch(() => ({}))
      const message: string = errJson?.error?.message ?? ''
      const retryMatch = message.match(/try again in ([\d.]+)s/)
      const waitMs = retryMatch ? Math.ceil(parseFloat(retryMatch[1]) * 1000) + 500 : 8000
      await new Promise(res => setTimeout(res, waitMs))
    }

    if (!response || !response.ok) {
      const err = await response?.text() ?? 'No response'
      throw new Error(`Groq API error: ${response?.status} ${err}`)
    }

    const result = await response.json()
    const text = result.choices[0]?.message?.content ?? ''

    // Strip any accidental markdown fences
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const data = JSON.parse(cleaned)

    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('AI analyze error:', err)
    return NextResponse.json({ error: err.message || 'Analysis failed' }, { status: 500 })
  }
}
