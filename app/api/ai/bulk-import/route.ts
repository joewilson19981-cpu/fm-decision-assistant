import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// ── Inline screenshot analysis (reuses same prompt as analyze-screenshot) ──────

const EXTRACT_PROMPT = `You are an expert at reading Football Manager screenshots.
Analyze the screenshot and extract ALL visible data. Return ONLY valid JSON — no explanation, no markdown, just the raw JSON object.

{
  "screenshotType": "league_table | team_stats | player_stats | tactic | finances | medical | match_result | squad | youth | inbox | other",
  "gameDate": "YYYY-MM-DD or null",
  "transferWindow": "open | closed | null",
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
For financial figures, convert to raw numbers (£2.5M → 2500000, £1,500/wk → 1500).
For dates, convert to YYYY-MM-DD format.
If the screenshot shows a league table, populate leagueTable AND teamStats for the highlighted team (set isYourTeam: true).
If the screenshot shows a squad/youth view, populate playerStats with all visible players.`

async function analyzeImage(base64: string, mimeType: string): Promise<any> {
  let response: Response | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: 'text', text: EXTRACT_PROMPT },
          ],
        }],
        max_tokens: 4096,
        temperature: 0.1,
      }),
    })
    if (response.status !== 429) break
    const errJson = await response.json().catch(() => ({}))
    const msg = errJson?.error?.message ?? ''
    const match = msg.match(/try again in ([\d.]+)s/)
    await new Promise(r => setTimeout(r, match ? Math.ceil(parseFloat(match[1]) * 1000) + 500 : 8000))
  }
  if (!response?.ok) throw new Error(`Groq error ${response?.status}`)
  const result = await response.json()
  const text = result.choices[0]?.message?.content ?? ''
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}

// ── Merge multiple extractions into one unified object ────────────────────────

function mergeExtractions(extractions: any[]): any {
  const merged: any = {
    gameDate: null, transferWindow: null, leagueName: null, clubName: null,
    leagueTable: [], teamStats: {}, playerStats: [], tactic: {}, finances: {}, medical: {},
  }
  const num = (v: any) => (v != null && !isNaN(Number(v)) ? Number(v) : null)

  for (const ex of extractions) {
    if (!ex) continue
    if (ex.gameDate && !merged.gameDate) merged.gameDate = ex.gameDate
    if (ex.transferWindow && !merged.transferWindow) merged.transferWindow = ex.transferWindow
    if (ex.leagueName && !merged.leagueName) merged.leagueName = ex.leagueName
    if (ex.clubName && !merged.clubName) merged.clubName = ex.clubName

    // League table: take longest one
    if ((ex.leagueTable?.length || 0) > merged.leagueTable.length) {
      merged.leagueTable = ex.leagueTable
    }

    // Team stats: merge non-null fields
    if (ex.teamStats) {
      for (const [k, v] of Object.entries(ex.teamStats)) {
        if (v != null && merged.teamStats[k] == null) merged.teamStats[k] = v
      }
    }

    // Player stats: merge by name (accumulate unique players)
    if (ex.playerStats?.length > 0) {
      for (const p of ex.playerStats) {
        if (!p.name?.trim()) continue
        const existing = merged.playerStats.find((x: any) =>
          x.name.toLowerCase().trim() === p.name.toLowerCase().trim()
        )
        if (existing) {
          // Merge non-null fields
          for (const [k, v] of Object.entries(p)) {
            if (v != null && existing[k] == null) existing[k] = v
          }
        } else {
          merged.playerStats.push({ ...p })
        }
      }
    }

    // Tactic
    if (ex.tactic?.formation && !merged.tactic.formation) merged.tactic.formation = ex.tactic.formation
    if (ex.tactic?.mentality && !merged.tactic.mentality) merged.tactic.mentality = ex.tactic.mentality

    // Finances: merge non-null
    if (ex.finances) {
      for (const [k, v] of Object.entries(ex.finances)) {
        if (v != null && merged.finances[k] == null) merged.finances[k] = v
      }
    }

    // Medical
    if (ex.medical) {
      if (ex.medical.currentInjuries != null && merged.medical.currentInjuries == null)
        merged.medical.currentInjuries = ex.medical.currentInjuries
      if (ex.medical.totalInjuriesThisSeason != null && merged.medical.totalInjuriesThisSeason == null)
        merged.medical.totalInjuriesThisSeason = ex.medical.totalInjuriesThisSeason
      if (ex.medical.overallSquadCondition && !merged.medical.overallSquadCondition)
        merged.medical.overallSquadCondition = ex.medical.overallSquadCondition
      if (ex.medical.notes && !merged.medical.notes)
        merged.medical.notes = ex.medical.notes
    }
  }

  return merged
}

// ── Main route ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      saveId,
      gamesPlayed,          // number: 10 | 23 | 35 | 46
      images,               // [{ base64: string, mimeType: string, filename: string }]
      seasonId,             // optional: if user picks a specific season
    } = body

    if (!saveId || !images?.length) {
      return NextResponse.json({ error: 'saveId and images required' }, { status: 400 })
    }

    // Verify save belongs to user
    const save = await prisma.save.findFirst({
      where: { id: saveId, userId: user.id },
      include: {
        seasons: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            checkpoints: { orderBy: { gamesPlayed: 'asc' } },
          },
        },
      },
    })
    if (!save) return NextResponse.json({ error: 'Save not found' }, { status: 404 })

    // ── Step 1: Analyse all images in parallel ────────────────────────────────
    const perImageResults = await Promise.allSettled(
      images.map((img: any) => analyzeImage(img.base64, img.mimeType || 'image/png'))
    )

    const extractions = perImageResults.map((r, i) => ({
      filename: images[i].filename || `image_${i + 1}`,
      success: r.status === 'fulfilled',
      data: r.status === 'fulfilled' ? r.value : null,
      error: r.status === 'rejected' ? String(r.reason) : null,
      type: r.status === 'fulfilled' ? r.value?.screenshotType : 'unknown',
    }))

    const successfulData = extractions
      .filter(e => e.success && e.data)
      .map(e => e.data)

    if (successfulData.length === 0) {
      return NextResponse.json({
        error: 'No screenshots could be analysed',
        details: extractions,
      }, { status: 422 })
    }

    // ── Step 2: Merge all extracted data ──────────────────────────────────────
    const merged = mergeExtractions(successfulData)

    // ── Step 3: Find or use the right season + checkpoint ─────────────────────
    let activeSeason = save.seasons[0]

    // If no active season exists, auto-create one from extracted data
    if (!activeSeason) {
      const newSeason = await prisma.season.create({
        data: {
          saveId,
          seasonLabel: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
          leagueName: merged.leagueName || 'Unknown League',
          clubName: merged.clubName || save.currentClub || 'Unknown',
          status: 'active',
          checkpoints: {
            create: [
              { checkpointType: 'pre_season', gamesPlayed: 0, status: 'draft' },
              { checkpointType: 'game_10', gamesPlayed: 10, status: 'draft' },
              { checkpointType: 'game_23', gamesPlayed: 23, status: 'draft' },
              { checkpointType: 'game_35', gamesPlayed: 35, status: 'draft' },
              { checkpointType: 'game_46', gamesPlayed: 46, status: 'draft' },
            ],
          },
        },
        include: { checkpoints: { orderBy: { gamesPlayed: 'asc' } } },
      })
      activeSeason = newSeason as any
    }

    // Find the matching checkpoint by games played
    const targetGames = Number(gamesPlayed) || 0
    // Pick closest checkpoint that matches the games played milestone
    const MILESTONES = [0, 10, 23, 35, 46]
    const closestMilestone = MILESTONES.reduce((prev, curr) =>
      Math.abs(curr - targetGames) < Math.abs(prev - targetGames) ? curr : prev
    )

    let checkpoint = activeSeason.checkpoints.find(
      (cp: any) => cp.gamesPlayed === closestMilestone
    )

    // Create checkpoint if missing
    if (!checkpoint) {
      checkpoint = await prisma.checkpoint.create({
        data: {
          seasonId: activeSeason.id,
          checkpointType: `game_${closestMilestone}`,
          gamesPlayed: closestMilestone,
          status: 'draft',
        },
      })
    }

    const checkpointId = checkpoint.id
    const num = (v: any) => (v != null && !isNaN(Number(v)) ? Number(v) : null)
    const saved: string[] = []

    // ── Step 4: Save all data in a transaction ────────────────────────────────
    await prisma.$transaction(async (tx) => {

      // Update checkpoint metadata
      const cpUpdate: any = { status: 'confirmed', gamesPlayed: targetGames }
      if (merged.gameDate) {
        cpUpdate.inGameDate = new Date(merged.gameDate)
        const month = new Date(merged.gameDate).getMonth()
        const PHASES = ['January','February','March','April','May','End of season','Pre-season','August','September','October','November','December']
        cpUpdate.calendarPhase = PHASES[month] ?? null
      }
      if (merged.transferWindow) {
        cpUpdate.transferWindowStatus = merged.transferWindow === 'open' ? 'Open' : 'Closed'
      }
      await tx.checkpoint.update({ where: { id: checkpointId }, data: cpUpdate })

      // Team stats
      const ts = merged.teamStats
      if (Object.values(ts).some(v => v != null)) {
        await tx.teamCheckpointStats.upsert({
          where: { checkpointId },
          create: {
            checkpointId,
            leaguePosition: num(ts.leaguePosition), played: num(ts.played),
            points: num(ts.points), wins: num(ts.wins), draws: num(ts.draws), losses: num(ts.losses),
            goalsFor: num(ts.goalsFor), goalsAgainst: num(ts.goalsAgainst), goalDiff: num(ts.goalDiff),
            xg: num(ts.xg), xga: num(ts.xga), cleanSheets: num(ts.cleanSheets),
            shotsPerGame: num(ts.shotsPerGame), possession: num(ts.possession),
            passCompletion: num(ts.passCompletion), clearCutChancesFor: num(ts.clearCutChancesFor),
            clearCutChancesAgainst: num(ts.clearCutChancesAgainst),
            setPieceGoalsFor: num(ts.setPieceGoalsFor), setPieceGoalsAgainst: num(ts.setPieceGoalsAgainst),
            crossAssistsFor: num(ts.crossAssistsFor), crossAssistsAgainst: num(ts.crossAssistsAgainst),
          },
          update: {
            leaguePosition: num(ts.leaguePosition), played: num(ts.played),
            points: num(ts.points), wins: num(ts.wins), draws: num(ts.draws), losses: num(ts.losses),
            goalsFor: num(ts.goalsFor), goalsAgainst: num(ts.goalsAgainst), goalDiff: num(ts.goalDiff),
            xg: num(ts.xg), xga: num(ts.xga), cleanSheets: num(ts.cleanSheets),
            shotsPerGame: num(ts.shotsPerGame), possession: num(ts.possession),
            passCompletion: num(ts.passCompletion), clearCutChancesFor: num(ts.clearCutChancesFor),
            clearCutChancesAgainst: num(ts.clearCutChancesAgainst),
            setPieceGoalsFor: num(ts.setPieceGoalsFor), setPieceGoalsAgainst: num(ts.setPieceGoalsAgainst),
            crossAssistsFor: num(ts.crossAssistsFor), crossAssistsAgainst: num(ts.crossAssistsAgainst),
          },
        })
        saved.push('team stats')
      }

      // League table
      if (merged.leagueTable?.length > 0) {
        await tx.leagueTableSnapshot.deleteMany({ where: { checkpointId } })
        await tx.leagueTableSnapshot.createMany({
          data: merged.leagueTable.map((row: any) => ({
            checkpointId,
            teamName: row.teamName,
            position: Number(row.position) || 0,
            played: Number(row.played) || 0,
            wins: Number(row.wins) || 0,
            draws: Number(row.draws) || 0,
            losses: Number(row.losses) || 0,
            goalsFor: Number(row.goalsFor) || 0,
            goalsAgainst: Number(row.goalsAgainst) || 0,
            goalDiff: Number(row.goalDiff) || 0,
            points: Number(row.points) || 0,
            form: row.form || null,
            isYourTeam: !!row.isYourTeam,
            confirmed: true,
          })),
        })
        saved.push('league table')
      }

      // Tactic
      if (merged.tactic?.formation || merged.tactic?.mentality) {
        await tx.tacticSnapshot.upsert({
          where: { checkpointId },
          create: { checkpointId, formation: merged.tactic.formation || null, mentality: merged.tactic.mentality || null },
          update: { formation: merged.tactic.formation || null, mentality: merged.tactic.mentality || null },
        })
        saved.push('tactic')
      }

      // Finances
      const f = merged.finances
      if (Object.values(f).some(v => v != null)) {
        await tx.financeSnapshot.upsert({
          where: { checkpointId },
          create: {
            checkpointId, balance: num(f.balance), profitLoss: num(f.profitLoss),
            transferBudget: num(f.transferBudget), wageBudget: num(f.wageBudget),
            wageSpend: num(f.wageSpend), remainingWageBudget: num(f.remainingWageBudget), debt: num(f.debt),
          },
          update: {
            balance: num(f.balance), profitLoss: num(f.profitLoss),
            transferBudget: num(f.transferBudget), wageBudget: num(f.wageBudget),
            wageSpend: num(f.wageSpend), remainingWageBudget: num(f.remainingWageBudget), debt: num(f.debt),
          },
        })
        saved.push('finances')
      }

      // Medical
      const m = merged.medical
      if (m.currentInjuries != null || m.totalInjuriesThisSeason != null || m.overallSquadCondition) {
        await tx.medicalSnapshot.upsert({
          where: { checkpointId },
          create: {
            checkpointId, currentInjuries: num(m.currentInjuries),
            totalInjuriesThisSeason: num(m.totalInjuriesThisSeason),
            overallSquadCondition: m.overallSquadCondition || null,
            notes: Array.isArray(m.notes) ? m.notes.join('\n') : (m.notes || null),
          },
          update: {
            currentInjuries: num(m.currentInjuries),
            totalInjuriesThisSeason: num(m.totalInjuriesThisSeason),
            overallSquadCondition: m.overallSquadCondition || null,
            notes: Array.isArray(m.notes) ? m.notes.join('\n') : (m.notes || null),
          },
        })
        saved.push('medical')
      }

      // Player stats
      if (merged.playerStats?.length > 0) {
        await tx.playerCheckpointStats.deleteMany({ where: { checkpointId } })
        for (const p of merged.playerStats) {
          if (!p.name?.trim()) continue
          let player = await tx.player.findFirst({ where: { saveId, name: p.name.trim() } })
          if (!player) {
            player = await tx.player.create({ data: { saveId, name: p.name.trim(), position: p.position || null } })
          }
          await tx.playerCheckpointStats.create({
            data: {
              checkpointId, playerId: player.id,
              age: num(p.age), position: p.position || null,
              appearances: num(p.appearances), goals: num(p.goals), assists: num(p.assists),
              cleanSheets: num(p.cleanSheets), avgRating: num(p.avgRating),
              yellowCards: num(p.yellowCards), redCards: num(p.redCards),
              wage: num(p.wage), contractExpiry: p.contractExpiry ? new Date(p.contractExpiry) : null,
              morale: p.morale || null, confirmed: true,
            },
          })
        }
        saved.push(`player stats (${merged.playerStats.filter((p: any) => p.name?.trim()).length} players)`)
      }
    })

    // ── Step 5: Youth Tracker cross-reference (outside main transaction) ──────
    const youthUpdated: string[] = []
    if (merged.playerStats?.length > 0) {
      const youthPlayers = await prisma.youthPlayer.findMany({ where: { saveId } })
      for (const yp of youthPlayers) {
        const match = merged.playerStats.find((p: any) =>
          p.name?.toLowerCase().trim() === yp.name.toLowerCase().trim()
        )
        if (match) {
          await prisma.youthUpdate.create({
            data: {
              youthPlayerId: yp.id,
              inGameDate: merged.gameDate ? new Date(merged.gameDate) : null,
              apps: num(match.appearances),
              goals: num(match.goals),
              assists: num(match.assists),
              avgRating: num(match.avgRating),
              morale: match.morale || null,
              fitness: null,
              injuryStatus: null,
              summary: `Auto-imported from ${targetGames}-game screenshot update`,
              aiImported: true,
            },
          })
          youthUpdated.push(yp.name)
        }
      }
    }

    return NextResponse.json({
      ok: true,
      checkpointId,
      seasonId: activeSeason.id,
      saved,
      youthUpdated,
      imageResults: extractions.map(e => ({
        filename: e.filename,
        success: e.success,
        type: e.type,
        error: e.error,
      })),
      summary: {
        imagesProcessed: images.length,
        imagesSuccessful: successfulData.length,
        tablesUpdated: saved.length,
        youthPlayersUpdated: youthUpdated.length,
      },
    })

  } catch (err: any) {
    console.error('bulk-import error:', err)
    return NextResponse.json({ error: err.message || 'Import failed' }, { status: 500 })
  }
}
