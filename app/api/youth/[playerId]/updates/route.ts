import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

// POST /api/youth/[playerId]/updates — log a new update (manual or AI)
export async function POST(req: NextRequest, { params }: { params: Promise<{ playerId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { playerId } = await params

  const player = await prisma.youthPlayer.findFirst({
    where: { id: playerId },
    include: { save: true },
  })
  if (!player || player.save.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json()
  const {
    inGameDate, rating, apps, goals, assists, keyPasses,
    avgRating, morale, fitness, injuryStatus, summary, aiImported,
    imageBase64, // if AI import from screenshot
  } = body

  let finalSummary = summary || null
  let aiImportFlag = aiImported || false

  // AI-powered import from screenshot
  if (imageBase64 && process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
      const response = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
              {
                type: 'text',
                text: `This is a Football Manager screenshot showing a player's stats or profile.
Extract any visible stats for player "${player.name}" and return a JSON object with these fields (use null if not visible):
{
  "apps": number,
  "goals": number,
  "assists": number,
  "avgRating": number,
  "morale": string,
  "fitness": number (0-100),
  "injuryStatus": string,
  "rating": number (current ability, 1-200),
  "summary": string (brief 1-2 sentence summary of what you see)
}
Return ONLY the JSON, no other text.`,
              },
            ],
          },
        ],
        max_tokens: 500,
      })

      const text = response.choices[0]?.message?.content || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0])
        finalSummary = extracted.summary || finalSummary
        aiImportFlag = true

        // Merge extracted data
        Object.assign(body, {
          apps: extracted.apps ?? apps,
          goals: extracted.goals ?? goals,
          assists: extracted.assists ?? assists,
          avgRating: extracted.avgRating ?? avgRating,
          morale: extracted.morale ?? morale,
          fitness: extracted.fitness ?? fitness,
          injuryStatus: extracted.injuryStatus ?? injuryStatus,
          rating: extracted.rating ?? rating,
        })
      }
    } catch (e) {
      console.error('AI import failed:', e)
    }
  }

  const update = await prisma.youthUpdate.create({
    data: {
      youthPlayerId: playerId,
      inGameDate: inGameDate ? new Date(inGameDate) : null,
      rating: body.rating !== undefined ? Number(body.rating) : null,
      apps: body.apps !== undefined ? Number(body.apps) : null,
      goals: body.goals !== undefined ? Number(body.goals) : null,
      assists: body.assists !== undefined ? Number(body.assists) : null,
      keyPasses: body.keyPasses !== undefined ? Number(body.keyPasses) : null,
      avgRating: body.avgRating !== undefined ? Number(body.avgRating) : null,
      morale: body.morale || null,
      fitness: body.fitness !== undefined ? Number(body.fitness) : null,
      injuryStatus: body.injuryStatus || null,
      summary: finalSummary,
      aiImported: aiImportFlag,
    },
  })

  return NextResponse.json(update, { status: 201 })
}
