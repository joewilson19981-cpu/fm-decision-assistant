import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// ── FM26 exact instruction names (provided by user) ─────────────────────────
const FM26_INSTRUCTIONS = `
FOOTBALL MANAGER 26 — EXACT TEAM INSTRUCTION NAMES
All instructions are sliders with specific named settings.

IN POSSESSION / ATTACKING:
- Attacking Transition: Hold Shape | Standard | Counter-Attack
- Build-Up Strategy: Play Through Press | Balanced | Bypass Press
- Creative Freedom: More Disciplined | Balanced | More Expressive
- Crossing Style: Balanced | Floated Crosses | Whipped Crosses | Low Crosses
- Dribbling: Discourage | Balanced | Encourage
- GK Distribution: Balanced | Center-Backs | Full-Backs | Flanks | Playmaker | Target Forward | Over Opposition Defense
- GK Distribution (Speed): Slow Pace Down | Balanced | Distribute Quickly
- Goal Kicks: Short | Mixed | Long
- Pass Reception: Pass to Feet | Balanced | Pass Into Space
- Passing Directness: Much Shorter | Shorter | Standard | More Direct | Much More Direct
- Patience: Hit Early Crosses | Standard | Work Ball Into Box
- Play for Set Pieces: Keep Ball in Play | Play for Set Pieces
- Progress Through: Balanced | Middle | Left | Right | Both Flanks
- Shots from Distance: Discourage | Balanced | Encourage
- Supporting Runs — Overlap: Overlap - Balanced | Overlap - Left | Overlap - Right | Overlap - Both Flanks
- Supporting Runs — Underlap: Underlap - Balanced | Underlap - Left | Underlap - Right | Underlap - Both Flanks
- Tempo: Much Lower | Lower | Standard | Higher | Much Higher
- Time Wasting: Less Often | Standard | More Often

OUT OF POSSESSION / DEFENSIVE:
- Cross Engagement: Stop Crosses | Balanced | Invite Crosses
- Defensive Line: Much Lower | Lower | Standard | Higher | Much Higher
- Defensive Line Behaviour: Step Up More | Balanced | Drop Off More
- Defensive Transition: Regroup | Standard | Counter-Press
- Line of Engagement: Low Block | Mid Block | High Press
- Pressing Trap: Trap Inside | Balanced | Trap Outside
- Short Goalkeeper Distribution: No | Yes
- Trigger Press: Much Less Often | Less Often | Standard | More Often | Much More Often
`

// ── Phase 1: Vision prompt — extract only, no suggestions ───────────────────
const EXTRACT_PROMPT = `You are reading a Football Manager 26 tactic screenshot.

Extract ONLY what you can clearly see — formation, mentality, and every instruction setting visible on screen. Use ONLY the exact setting names from the reference list below. Return null for any instruction not visible.

${FM26_INSTRUCTIONS}

Return ONLY valid JSON (no explanation, no markdown):
{
  "formation": "e.g. 4-3-3 or null",
  "mentality": "e.g. Balanced or null",
  "attackingTransition": "Hold Shape | Standard | Counter-Attack | null",
  "buildUpStrategy": "Play Through Press | Balanced | Bypass Press | null",
  "creativeFreedom": "More Disciplined | Balanced | More Expressive | null",
  "crossingStyle": "Balanced | Floated Crosses | Whipped Crosses | Low Crosses | null",
  "dribbling": "Discourage | Balanced | Encourage | null",
  "gkDistribution": "exact setting or null",
  "gkDistributionSpeed": "Slow Pace Down | Balanced | Distribute Quickly | null",
  "goalKicks": "Short | Mixed | Long | null",
  "passReception": "Pass to Feet | Balanced | Pass Into Space | null",
  "passingDirectness": "Much Shorter | Shorter | Standard | More Direct | Much More Direct | null",
  "patience": "Hit Early Crosses | Standard | Work Ball Into Box | null",
  "playForSetPieces": "Keep Ball in Play | Play for Set Pieces | null",
  "progressThrough": "Balanced | Middle | Left | Right | Both Flanks | null",
  "shotsFromDistance": "Discourage | Balanced | Encourage | null",
  "overlap": "Overlap - Balanced | Overlap - Left | Overlap - Right | Overlap - Both Flanks | null",
  "underlap": "Underlap - Balanced | Underlap - Left | Underlap - Right | Underlap - Both Flanks | null",
  "tempo": "Much Lower | Lower | Standard | Higher | Much Higher | null",
  "timeWasting": "Less Often | Standard | More Often | null",
  "crossEngagement": "Stop Crosses | Balanced | Invite Crosses | null",
  "defensiveLine": "Much Lower | Lower | Standard | Higher | Much Higher | null",
  "defensiveLineBehaviour": "Step Up More | Balanced | Drop Off More | null",
  "defensiveTransition": "Regroup | Standard | Counter-Press | null",
  "lineOfEngagement": "Low Block | Mid Block | High Press | null",
  "pressingTrap": "Trap Inside | Balanced | Trap Outside | null",
  "shortGkDistribution": "No | Yes | null",
  "triggerPress": "Much Less Often | Less Often | Standard | More Often | Much More Often | null"
}`

// ── Phase 2: Fetch research from FM community sites ─────────────────────────
const FM_RESEARCH_SITES = [
  {
    name: 'FMScout',
    url: 'https://fmscout.com/c-fm26-tactics.html',
  },
  {
    name: 'Passion4FM',
    url: 'https://passion4fm.com/football-manager-tactics/',
  },
  {
    name: 'FM-Base',
    url: 'https://fm-base.co.uk/resources/categories/tactics.9/',
  },
]

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

async function fetchTacticsResearch(formation: string, mentality: string): Promise<{ name: string; excerpt: string }[]> {
  const results: { name: string; excerpt: string }[] = []

  const fetchPromises = FM_RESEARCH_SITES.map(async (site) => {
    try {
      const res = await fetch(site.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-GB,en;q=0.5',
        },
        signal: AbortSignal.timeout(6000),
      })

      if (!res.ok) return null

      const html = await res.text()
      const text = stripHtml(html)

      // Need at least 300 chars to be useful (not a redirect shell)
      if (text.length < 300) return null

      // Try to find the most relevant section — look for formation name nearby
      const formationBase = formation?.replace(/[^0-9-]/g, '') ?? ''
      let excerpt = ''

      if (formationBase) {
        // Find a window of text around the first mention of the formation
        const idx = text.toLowerCase().indexOf(formationBase)
        if (idx !== -1) {
          const start = Math.max(0, idx - 200)
          const end = Math.min(text.length, idx + 1500)
          excerpt = text.slice(start, end)
        }
      }

      // If no formation-specific section found, take the first meaningful chunk
      if (!excerpt) {
        excerpt = text.slice(0, 2000)
      }

      return { name: site.name, url: site.url, excerpt: excerpt.trim() }
    } catch {
      return null // silently skip failed fetches
    }
  })

  const fetched = await Promise.all(fetchPromises)
  for (const r of fetched) {
    if (r && r.excerpt.length > 100) {
      results.push({ name: r.name, excerpt: r.excerpt })
    }
  }

  return results
}

// ── Phase 3: Suggestion prompt ───────────────────────────────────────────────
function buildSuggestionPrompt(
  extracted: any,
  research: { name: string; excerpt: string }[],
  formation: string,
  mentality: string
): string {
  const researchSection = research.length > 0
    ? `\nFM26 COMMUNITY RESEARCH (sourced from ${research.map(r => r.name).join(', ')}):\n${
        research.map(r => `[${r.name}]\n${r.excerpt}`).join('\n\n---\n\n')
      }\n`
    : '\n(No community research available — base suggestions on FM26 tactical knowledge)\n'

  const s = extracted
  const tacticSummary = [
    `Formation: ${formation || 'unknown'}`,
    `Mentality: ${mentality || 'unknown'}`,
    '',
    '-- ATTACKING --',
    s.attackingTransition     ? `Attacking Transition: ${s.attackingTransition}` : null,
    s.buildUpStrategy         ? `Build-Up Strategy: ${s.buildUpStrategy}` : null,
    s.creativeFreedom         ? `Creative Freedom: ${s.creativeFreedom}` : null,
    s.passingDirectness       ? `Passing Directness: ${s.passingDirectness}` : null,
    s.tempo                   ? `Tempo: ${s.tempo}` : null,
    s.passReception           ? `Pass Reception: ${s.passReception}` : null,
    s.patience                ? `Patience: ${s.patience}` : null,
    s.progressThrough         ? `Progress Through: ${s.progressThrough}` : null,
    s.dribbling               ? `Dribbling: ${s.dribbling}` : null,
    s.crossingStyle           ? `Crossing Style: ${s.crossingStyle}` : null,
    s.overlap                 ? `Supporting Runs (Overlap): ${s.overlap}` : null,
    s.underlap                ? `Supporting Runs (Underlap): ${s.underlap}` : null,
    s.shotsFromDistance       ? `Shots from Distance: ${s.shotsFromDistance}` : null,
    s.playForSetPieces        ? `Play for Set Pieces: ${s.playForSetPieces}` : null,
    s.gkDistribution          ? `GK Distribution: ${s.gkDistribution}` : null,
    s.gkDistributionSpeed     ? `GK Distribution Speed: ${s.gkDistributionSpeed}` : null,
    s.goalKicks               ? `Goal Kicks: ${s.goalKicks}` : null,
    s.timeWasting             ? `Time Wasting: ${s.timeWasting}` : null,
    '',
    '-- DEFENSIVE --',
    s.defensiveTransition     ? `Defensive Transition: ${s.defensiveTransition}` : null,
    s.lineOfEngagement        ? `Line of Engagement: ${s.lineOfEngagement}` : null,
    s.defensiveLine           ? `Defensive Line: ${s.defensiveLine}` : null,
    s.defensiveLineBehaviour  ? `Defensive Line Behaviour: ${s.defensiveLineBehaviour}` : null,
    s.triggerPress            ? `Trigger Press: ${s.triggerPress}` : null,
    s.pressingTrap            ? `Pressing Trap: ${s.pressingTrap}` : null,
    s.crossEngagement         ? `Cross Engagement: ${s.crossEngagement}` : null,
    s.shortGkDistribution     ? `Short GK Distribution: ${s.shortGkDistribution}` : null,
  ].filter(Boolean).join('\n')

  return `You are an expert Football Manager 26 tactical analyst.

A manager is using this tactic:
${tacticSummary}
${researchSection}
TASK: Write an overall analysis of this tactic, then suggest 3-5 specific improvements.

RULES:
- Only use instruction names from this exact FM26 reference list (no invented names):
${FM26_INSTRUCTIONS}
- Ground suggestions in the FM26 community research above where possible — reference site names when you do
- If you make a suggestion not supported by the research, say so clearly
- Each suggestion must explain the tactical logic specifically for THIS setup, not generic advice
- Be honest — if the tactic looks solid, say so

Return ONLY valid JSON (no explanation, no markdown):
{
  "overallAnalysis": "2-3 sentences on the style this tactic creates and where the main strengths/vulnerabilities are",
  "suggestions": [
    {
      "category": "Attacking | Defensive",
      "instruction": "Exact FM26 instruction name from the reference list (e.g. Tempo, Defensive Transition)",
      "from": "Current setting or null if not set",
      "to": "Exact target setting name from the reference list",
      "reason": "Specific tactical reason for this change",
      "source": "FMScout | Passion4FM | FM-Base | FM26 tactical theory (no external source)"
    }
  ]
}`
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { imageBase64, mimeType, checkpointId, saveId, seasonId } = await req.json()
    if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    // ── Phase 1: Extract tactic from screenshot ────────────────────────────
    let visionResponse: Response | null = null
    for (let attempt = 0; attempt < 3; attempt++) {
      visionResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mimeType || 'image/png'};base64,${imageBase64}` } },
              { type: 'text', text: EXTRACT_PROMPT },
            ],
          }],
          max_tokens: 1024,
          temperature: 0.1,
        }),
      })

      if (visionResponse.status !== 429) break
      const errJson = await visionResponse.json().catch(() => ({}))
      const message: string = errJson?.error?.message ?? ''
      const retryMatch = message.match(/try again in ([\d.]+)s/)
      const waitMs = retryMatch ? Math.ceil(parseFloat(retryMatch[1]) * 1000) + 500 : 8000
      await new Promise(res => setTimeout(res, waitMs))
    }

    if (!visionResponse || !visionResponse.ok) {
      const err = await visionResponse?.text() ?? 'No response'
      throw new Error(`Groq vision error: ${visionResponse?.status} ${err}`)
    }

    const visionResult = await visionResponse.json()
    const visionText = visionResult.choices[0]?.message?.content ?? ''
    const extracted = JSON.parse(visionText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

    const formation: string = extracted.formation ?? ''
    const mentality: string = extracted.mentality ?? ''

    // ── Phase 2: Fetch FM community research ─────────────────────────────
    // Run in parallel with some tolerance for slow/failed sites
    const research = await fetchTacticsResearch(formation, mentality)
    console.log(`Tactic lab: fetched ${research.length} research sources for ${formation} ${mentality}`)

    // ── Phase 3: Generate grounded suggestions ────────────────────────────
    const suggestionPrompt = buildSuggestionPrompt(extracted, research, formation, mentality)

    let textResponse: Response | null = null
    for (let attempt = 0; attempt < 3; attempt++) {
      textResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: suggestionPrompt }],
          max_tokens: 1500,
          temperature: 0.3,
        }),
      })

      if (textResponse.status !== 429) break
      const errJson = await textResponse.json().catch(() => ({}))
      const message: string = errJson?.error?.message ?? ''
      const retryMatch = message.match(/try again in ([\d.]+)s/)
      const waitMs = retryMatch ? Math.ceil(parseFloat(retryMatch[1]) * 1000) + 500 : 8000
      await new Promise(res => setTimeout(res, waitMs))
    }

    if (!textResponse || !textResponse.ok) {
      const err = await textResponse?.text() ?? 'No response'
      throw new Error(`Groq text error: ${textResponse?.status} ${err}`)
    }

    const textResult = await textResponse.json()
    const textRaw = textResult.choices[0]?.message?.content ?? ''
    const suggestions = JSON.parse(textRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

    // Merge extracted + suggestions into final analysis object
    const analysis = {
      ...extracted,
      overallAnalysis: suggestions.overallAnalysis ?? '',
      suggestions: suggestions.suggestions ?? [],
      researchSources: research.map(r => r.name),
    }

    // ── Save to tactic snapshot ───────────────────────────────────────────
    if (checkpointId && saveId && seasonId) {
      const cp = await prisma.checkpoint.findFirst({
        where: { id: checkpointId, seasonId, season: { saveId, save: { userId: user.id } } },
      })
      if (cp) {
        await prisma.tacticSnapshot.upsert({
          where: { checkpointId },
          create: {
            checkpointId,
            formation: analysis.formation ?? null,
            mentality: analysis.mentality ?? null,
            aiAnalysis: JSON.stringify(analysis),
          } as any,
          update: {
            formation: analysis.formation ?? undefined,
            mentality: analysis.mentality ?? undefined,
            aiAnalysis: JSON.stringify(analysis),
          } as any,
        })
      }
    }

    return NextResponse.json({ analysis })
  } catch (err: any) {
    console.error('analyze-tactic error:', err)
    return NextResponse.json({ error: err.message || 'Analysis failed' }, { status: 500 })
  }
}
