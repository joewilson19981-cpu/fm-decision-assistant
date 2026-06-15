import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { buildFM26KnowledgeBlock, getChecklistForGames, evaluateChecklist, isCheckpointComplete } from '@/lib/fm26-knowledge'
import Anthropic from '@anthropic-ai/sdk'

// Allow up to 120s on Vercel Pro
export const maxDuration = 120

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Vision extraction — single Claude call for ALL images ────────────────────

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

async function analyzeAllImages(images: { base64: string; mimeType: string }[]): Promise<any> {
  const imageBlocks: Anthropic.ImageBlockParam[] = images.map(img => ({
    type: 'image',
    source: {
      type: 'base64',
      media_type: (img.mimeType || 'image/png') as any,
      data: img.base64,
    },
  }))

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    messages: [{
      role: 'user',
      content: [
        ...imageBlocks,
        { type: 'text', text: EXTRACT_PROMPT },
      ],
    }],
  })

  const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
  return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
}

function mergeExtractions(extractions: any[]): any {
  const merged: any = { gameDate: null, transferWindow: null, leagueName: null, clubName: null, leagueTable: [], teamStats: {}, playerStats: [], tactic: {}, finances: {}, medical: {} }
  for (const ex of extractions) {
    if (!ex) continue
    if (ex.gameDate && !merged.gameDate) merged.gameDate = ex.gameDate
    if (ex.transferWindow && !merged.transferWindow) merged.transferWindow = ex.transferWindow
    if (ex.leagueName && !merged.leagueName) merged.leagueName = ex.leagueName
    if (ex.clubName && !merged.clubName) merged.clubName = ex.clubName
    if ((ex.leagueTable?.length || 0) > merged.leagueTable.length) merged.leagueTable = ex.leagueTable
    if (ex.teamStats) for (const [k, v] of Object.entries(ex.teamStats)) { if (v != null && merged.teamStats[k] == null) merged.teamStats[k] = v }
    if (ex.playerStats?.length > 0) {
      for (const p of ex.playerStats) {
        if (!p.name?.trim()) continue
        const existing = merged.playerStats.find((x: any) => x.name.toLowerCase().trim() === p.name.toLowerCase().trim())
        if (existing) { for (const [k, v] of Object.entries(p)) { if (v != null && existing[k] == null) existing[k] = v } }
        else merged.playerStats.push({ ...p })
      }
    }
    if (ex.tactic?.formation && !merged.tactic.formation) merged.tactic.formation = ex.tactic.formation
    if (ex.tactic?.mentality && !merged.tactic.mentality) merged.tactic.mentality = ex.tactic.mentality
    if (ex.finances) for (const [k, v] of Object.entries(ex.finances)) { if (v != null && merged.finances[k] == null) merged.finances[k] = v }
    if (ex.medical) {
      if (ex.medical.currentInjuries != null && merged.medical.currentInjuries == null) merged.medical.currentInjuries = ex.medical.currentInjuries
      if (ex.medical.totalInjuriesThisSeason != null && merged.medical.totalInjuriesThisSeason == null) merged.medical.totalInjuriesThisSeason = ex.medical.totalInjuriesThisSeason
      if (ex.medical.overallSquadCondition && !merged.medical.overallSquadCondition) merged.medical.overallSquadCondition = ex.medical.overallSquadCondition
      if (ex.medical.notes && !merged.medical.notes) merged.medical.notes = ex.medical.notes
    }
  }
  return merged
}

// ── Load full save context for system prompt ──────────────────────────────────

async function loadSaveContext(saveId: string, userId: string) {
  const save = await prisma.save.findFirst({
    where: { id: saveId, userId },
    include: {
      seasons: {
        where: { status: 'active' },
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          checkpoints: {
            orderBy: { gamesPlayed: 'asc' },
            include: {
              teamStats: true,
              financeSnapshot: true,
              playerStats: { include: { player: true }, take: 25, orderBy: { goals: 'desc' } },
              leagueTableSnapshots: { where: { isYourTeam: true }, take: 1 },
            },
          },
        },
      },
      youthPlayers: { take: 15 },
    },
  })
  return save
}

function buildSystemPrompt(save: any, userName: string): string {
  const season = save?.seasons?.[0]

  // Sort checkpoints oldest→newest for trend analysis
  const checkpoints = [...(season?.checkpoints ?? [])].sort((a: any, b: any) => a.gamesPlayed - b.gamesPlayed)
  const latestCp = checkpoints.at(-1)
  const ts = latestCp?.teamStats
  const fin = latestCp?.financeSnapshot

  const topScorers = latestCp?.playerStats
    ?.filter((p: any) => p.goals != null && p.goals > 0)
    ?.slice(0, 5)
    ?.map((p: any) => `${p.player.name} (${p.goals}G${p.assists ? ` ${p.assists}A` : ''}${p.avgRating ? ` avg${Number(p.avgRating).toFixed(2)}` : ''})`)
    ?.join(', ')

  const topRated = latestCp?.playerStats
    ?.filter((p: any) => p.avgRating != null && p.appearances && p.appearances >= 3)
    ?.sort((a: any, b: any) => Number(b.avgRating) - Number(a.avgRating))
    ?.slice(0, 3)
    ?.map((p: any) => `${p.player.name} (${Number(p.avgRating).toFixed(2)})`)
    ?.join(', ')

  const youthNames = save?.youthPlayers?.map((yp: any) => `${yp.name} (${yp.playerType}${yp.position ? `, ${yp.position}` : ''})`).join(', ')

  // Full trend across all checkpoints
  const cpTrend = checkpoints
    .filter((cp: any) => cp.teamStats)
    .map((cp: any) => {
      const t = cp.teamStats
      const xgDiff = (t.xg != null && t.xga != null) ? (Number(t.xg) - Number(t.xga)).toFixed(1) : null
      const setPctStr = (t.setPieceGoalsFor != null && t.goalsFor && t.goalsFor > 0)
        ? ` set piece ${t.setPieceGoalsFor}G (${Math.round(t.setPieceGoalsFor / t.goalsFor * 100)}%)`
        : ''
      return `  [${cp.gamesPlayed}G] ${t.leaguePosition ?? '?'}th · ${t.points ?? '?'}pts · ${t.wins ?? '?'}W${t.draws ?? '?'}D${t.losses ?? '?'}L · GF${t.goalsFor ?? '?'} GA${t.goalsAgainst ?? '?'}${xgDiff ? ` · xGdiff${xgDiff}` : ''}${t.possession ? ` · ${Number(t.possession).toFixed(0)}% poss` : ''}${t.cleanSheets != null ? ` · ${t.cleanSheets}CS` : ''}${setPctStr}`
    }).join('\n')

  // Trend analysis
  const firstCp = checkpoints.find((cp: any) => cp.teamStats)
  const positionTrend = (firstCp?.teamStats && latestCp?.teamStats)
    ? (latestCp.teamStats.leaguePosition ?? 99) < (firstCp.teamStats.leaguePosition ?? 99) ? '↑ improving' : '↓ dropping'
    : null

  // Contract alerts from player data
  const now = new Date()
  const alertDate = new Date(now); alertDate.setMonth(alertDate.getMonth() + 8)
  const contractAlerts = latestCp?.playerStats
    ?.filter((p: any) => {
      if (!p.contractExpiry) return false
      const exp = new Date(p.contractExpiry)
      return exp <= alertDate && exp >= now
    })
    ?.map((p: any) => {
      const exp = new Date(p.contractExpiry)
      const months = Math.round((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30))
      return `${p.player.name} (${months}mo)`
    })
    ?.join(', ')

  const fm26Knowledge = buildFM26KnowledgeBlock()

  return `You are FM Assistant — a personal Football Manager analyst for ${userName || 'the manager'}. You are an expert in FM26 specifically — not generic FM advice.

${save ? `SAVE CONTEXT:
Club: ${save.currentClub || save.name} | League: ${season?.leagueName || 'Unknown'} | Season: ${season?.seasonLabel || ''}
Board expectation: ${season?.boardExpectation ?? 'Unknown'} | Season objective: ${season?.seasonObjective ?? 'Unknown'}

CURRENT FORM (latest checkpoint — ${latestCp?.gamesPlayed ?? 0} games):
- Position: ${ts?.leaguePosition ?? '?'}th | Points: ${ts?.points ?? '?'} | ${ts?.wins ?? '?'}W ${ts?.draws ?? '?'}D ${ts?.losses ?? '?'}L
- Goals: ${ts?.goalsFor ?? '?'} scored / ${ts?.goalsAgainst ?? '?'} conceded | GD: ${ts?.goalDiff ?? '?'}
${ts?.xg != null ? `- xG: ${Number(ts.xg).toFixed(1)} | xGA: ${Number(ts.xga ?? 0).toFixed(1)} | xG diff: ${(Number(ts.xg) - Number(ts.xga ?? 0)).toFixed(1)} ${Number(ts.xg) > Number(ts.xga ?? 0) ? '(creating more than conceding — good)' : '(conceding more than creating — concern)'}` : ''}
${ts?.possession != null ? `- Possession: ${Number(ts.possession).toFixed(0)}% | Pass completion: ${ts.passCompletion ? Number(ts.passCompletion).toFixed(0) + '%' : '?'}` : ''}
${ts?.cleanSheets != null ? `- Clean sheets: ${ts.cleanSheets}` : ''}
${ts?.setPieceGoalsFor != null ? `- Set piece goals: ${ts.setPieceGoalsFor} (${ts.goalsFor && ts.goalsFor > 0 ? Math.round(ts.setPieceGoalsFor / ts.goalsFor * 100) : '?'}% of all goals) — ${ts.setPieceGoalsFor < 5 ? 'LOW — should be 15-25% with good routines' : ts.setPieceGoalsFor < 10 ? 'decent, room to improve' : 'excellent set piece output'}` : ''}
${fin?.transferBudget != null ? `- Transfer budget: £${(Number(fin.transferBudget) / 1000000).toFixed(1)}m` : ''}
${fin?.remainingWageBudget != null ? `- Remaining wage budget: £${(Number(fin.remainingWageBudget) / 1000).toFixed(0)}k/wk` : ''}
${topScorers ? `- Top scorers: ${topScorers}` : ''}
${topRated ? `- Highest rated: ${topRated}` : ''}
${contractAlerts ? `- ⚠️ Contracts expiring soon: ${contractAlerts}` : ''}
${youthNames ? `- Youth/loan tracked: ${youthNames}` : ''}
${positionTrend ? `- Position trend: ${positionTrend}` : ''}

SEASON TREND (all checkpoints):
${cpTrend || 'No checkpoint data yet'}` : `No save loaded yet — help the user set up their first save.`}

${fm26Knowledge}

YOUR PERSONALITY:
- Direct, knowledgeable, like a trusted analyst who knows this specific save inside out
- Reference their actual stats, players, and league position — never generic advice
- When giving tactic/set piece advice, name specific tactics from the library above — cite download counts
- If their set piece goals are below 15-20% of total goals, flag it and suggest Knap or Parisian routines specifically
- If xG is positive but results aren't reflecting it, explain why using FM26 mechanics
- Concise but insightful — no padding
- When uncertain, say so

WHAT YOU CAN DO:
1. SETUP: If no save exists or user says "new save", guide them: ask for squad screenshot first, then finances, then a couple of text questions (season goal, board expectation)
2. CHECKPOINT UPDATES: When user sends screenshots (at 10/23/35/46 games), process them all, then respond with a checklist:
   ✅ [what was found] — [one-line insight specific to their numbers]
   ❌ [what's missing] — ask specifically for that screen
   At 23 and 46 games only, also check for youth/loan player screens
3. QUESTIONS: Answer anything about their save — tactics, form, who to sign, transfer decisions — using FM26-specific knowledge above
4. ANALYSIS: Spot patterns in their data, flag concerns proactively, connect stats to specific FM26 mechanics

CHECKLIST FORMAT (when screenshots were processed):
Show ✅/❌ for each data type, then 2-3 lines of FM26-specific analysis based on their actual numbers.

SETUP FORMAT:
Step 1: "Send me your squad overview screenshot"
Step 2: "Now send finances"
Step 3: Ask season objective and board expectation as text questions
Step 4: Confirm: "Setting up [Club] in [League]... done. [X] players imported."

Keep responses tight. Mix natural sentences with bullet points only when genuinely useful.`
}

// ── Save extracted data to checkpoint ────────────────────────────────────────

async function saveToCheckpoint(saveId: string, merged: any, gamesPlayed: number, userId: string) {
  const num = (v: any) => (v != null && !isNaN(Number(v)) ? Number(v) : null)
  const saved: string[] = []

  // Find or create season + checkpoint
  let season = await prisma.season.findFirst({
    where: { saveId, status: 'active' },
    include: { checkpoints: { orderBy: { gamesPlayed: 'asc' } } },
  })

  if (!season) {
    season = await prisma.season.create({
      data: {
        saveId,
        seasonLabel: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        leagueName: merged.leagueName || 'Unknown League',
        clubName: merged.clubName || 'Unknown',
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
  }

  const MILESTONES = [0, 10, 23, 35, 46]
  const closest = MILESTONES.reduce((p, c) => Math.abs(c - gamesPlayed) < Math.abs(p - gamesPlayed) ? c : p)
  let checkpoint = (season as any).checkpoints.find((cp: any) => cp.gamesPlayed === closest)

  if (!checkpoint) {
    checkpoint = await prisma.checkpoint.create({
      data: { seasonId: season.id, checkpointType: `game_${closest}`, gamesPlayed: closest, status: 'draft' },
    })
  }

  const checkpointId = checkpoint.id

  await prisma.$transaction(async (tx) => {
    // Checkpoint meta
    const cpUpdate: any = { gamesPlayed, status: 'confirmed' }
    if (merged.gameDate) {
      cpUpdate.inGameDate = new Date(merged.gameDate)
      const month = new Date(merged.gameDate).getMonth()
      const PHASES = ['January','February','March','April','May','End of season','Pre-season','August','September','October','November','December']
      cpUpdate.calendarPhase = PHASES[month] ?? null
    }
    if (merged.transferWindow) cpUpdate.transferWindowStatus = merged.transferWindow === 'open' ? 'Open' : 'Closed'
    await tx.checkpoint.update({ where: { id: checkpointId }, data: cpUpdate })

    // Team stats
    const ts = merged.teamStats
    if (Object.values(ts).some(v => v != null)) {
      await tx.teamCheckpointStats.upsert({
        where: { checkpointId },
        create: { checkpointId, leaguePosition: num(ts.leaguePosition), played: num(ts.played), points: num(ts.points), wins: num(ts.wins), draws: num(ts.draws), losses: num(ts.losses), goalsFor: num(ts.goalsFor), goalsAgainst: num(ts.goalsAgainst), goalDiff: num(ts.goalDiff), xg: num(ts.xg), xga: num(ts.xga), cleanSheets: num(ts.cleanSheets), shotsPerGame: num(ts.shotsPerGame), possession: num(ts.possession), passCompletion: num(ts.passCompletion), clearCutChancesFor: num(ts.clearCutChancesFor), clearCutChancesAgainst: num(ts.clearCutChancesAgainst), setPieceGoalsFor: num(ts.setPieceGoalsFor), setPieceGoalsAgainst: num(ts.setPieceGoalsAgainst) },
        update: { leaguePosition: num(ts.leaguePosition), played: num(ts.played), points: num(ts.points), wins: num(ts.wins), draws: num(ts.draws), losses: num(ts.losses), goalsFor: num(ts.goalsFor), goalsAgainst: num(ts.goalsAgainst), goalDiff: num(ts.goalDiff), xg: num(ts.xg), xga: num(ts.xga), cleanSheets: num(ts.cleanSheets), shotsPerGame: num(ts.shotsPerGame), possession: num(ts.possession), passCompletion: num(ts.passCompletion), clearCutChancesFor: num(ts.clearCutChancesFor), clearCutChancesAgainst: num(ts.clearCutChancesAgainst), setPieceGoalsFor: num(ts.setPieceGoalsFor), setPieceGoalsAgainst: num(ts.setPieceGoalsAgainst) },
      })
      saved.push('team_stats')
    }

    // League table
    if (merged.leagueTable?.length > 0) {
      await tx.leagueTableSnapshot.deleteMany({ where: { checkpointId } })
      await tx.leagueTableSnapshot.createMany({
        data: merged.leagueTable.map((row: any) => ({ checkpointId, teamName: row.teamName, position: Number(row.position) || 0, played: Number(row.played) || 0, wins: Number(row.wins) || 0, draws: Number(row.draws) || 0, losses: Number(row.losses) || 0, goalsFor: Number(row.goalsFor) || 0, goalsAgainst: Number(row.goalsAgainst) || 0, goalDiff: Number(row.goalDiff) || 0, points: Number(row.points) || 0, form: row.form || null, isYourTeam: !!row.isYourTeam, confirmed: true })),
      })
      saved.push('league_table')
    }

    // Tactic
    if (merged.tactic?.formation || merged.tactic?.mentality) {
      await tx.tacticSnapshot.upsert({ where: { checkpointId }, create: { checkpointId, formation: merged.tactic.formation || null, mentality: merged.tactic.mentality || null }, update: { formation: merged.tactic.formation || null, mentality: merged.tactic.mentality || null } })
      saved.push('tactic')
    }

    // Finances
    const f = merged.finances
    if (Object.values(f).some(v => v != null)) {
      await tx.financeSnapshot.upsert({ where: { checkpointId }, create: { checkpointId, balance: num(f.balance), profitLoss: num(f.profitLoss), transferBudget: num(f.transferBudget), wageBudget: num(f.wageBudget), wageSpend: num(f.wageSpend), remainingWageBudget: num(f.remainingWageBudget) }, update: { balance: num(f.balance), profitLoss: num(f.profitLoss), transferBudget: num(f.transferBudget), wageBudget: num(f.wageBudget), wageSpend: num(f.wageSpend), remainingWageBudget: num(f.remainingWageBudget) } })
      saved.push('finances')
    }

    // Medical
    const m = merged.medical
    if (m.currentInjuries != null || m.overallSquadCondition) {
      await tx.medicalSnapshot.upsert({ where: { checkpointId }, create: { checkpointId, currentInjuries: num(m.currentInjuries), totalInjuriesThisSeason: num(m.totalInjuriesThisSeason), overallSquadCondition: m.overallSquadCondition || null, notes: m.notes || null }, update: { currentInjuries: num(m.currentInjuries), totalInjuriesThisSeason: num(m.totalInjuriesThisSeason), overallSquadCondition: m.overallSquadCondition || null, notes: m.notes || null } })
      saved.push('medical')
    }

    // Players
    if (merged.playerStats?.length > 0) {
      await tx.playerCheckpointStats.deleteMany({ where: { checkpointId } })
      for (const p of merged.playerStats) {
        if (!p.name?.trim()) continue
        let player = await tx.player.findFirst({ where: { saveId, name: p.name.trim() } })
        if (!player) player = await tx.player.create({ data: { saveId, name: p.name.trim(), position: p.position || null } })
        await tx.playerCheckpointStats.create({ data: { checkpointId, playerId: player.id, age: num(p.age), position: p.position || null, appearances: num(p.appearances), goals: num(p.goals), assists: num(p.assists), cleanSheets: num(p.cleanSheets), avgRating: num(p.avgRating), yellowCards: num(p.yellowCards), redCards: num(p.redCards), wage: num(p.wage), contractExpiry: p.contractExpiry ? new Date(p.contractExpiry) : null, morale: p.morale || null, confirmed: true } })
      }
      saved.push('player_stats')
    }
  })

  // Youth cross-reference
  const youthUpdated: string[] = []
  if (merged.playerStats?.length > 0) {
    const youthPlayers = await prisma.youthPlayer.findMany({ where: { saveId } })
    for (const yp of youthPlayers) {
      const match = merged.playerStats.find((p: any) => p.name?.toLowerCase().trim() === yp.name.toLowerCase().trim())
      if (match) {
        await prisma.youthUpdate.create({
          data: { youthPlayerId: yp.id, inGameDate: merged.gameDate ? new Date(merged.gameDate) : null, apps: num(match.appearances), goals: num(match.goals), assists: num(match.assists), avgRating: num(match.avgRating), morale: match.morale || null, summary: `Auto-imported at ${gamesPlayed} games`, aiImported: true },
        })
        youthUpdated.push(yp.name)
      }
    }
  }

  return { checkpointId, seasonId: season.id, saved, youthUpdated }
}

// ── Setup save from screenshots ───────────────────────────────────────────────

async function createSaveFromExtracted(merged: any, userId: string, extraContext: Record<string, string> = {}) {
  const num = (v: any) => (v != null && !isNaN(Number(v)) ? Number(v) : null)
  const clubName = merged.clubName || extraContext.clubName || 'Unknown Club'
  const leagueName = merged.leagueName || extraContext.leagueName || 'Unknown League'

  const save = await prisma.save.create({
    data: {
      userId,
      name: `${clubName} Save`,
      fmVersion: 'FM26',
      currentClub: clubName,
      startingClub: clubName,
      notes: extraContext.seasonObjective || null,
      seasons: {
        create: {
          seasonLabel: extraContext.seasonLabel || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
          leagueName,
          clubName,
          boardExpectation: extraContext.boardExpectation || null,
          seasonObjective: extraContext.seasonObjective || null,
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
      },
    },
  })

  // Store initial squad
  let playerCount = 0
  if (merged.playerStats?.length > 0) {
    for (const p of merged.playerStats) {
      if (!p.name?.trim()) continue
      await prisma.player.create({ data: { saveId: save.id, name: p.name.trim(), position: p.position || null } })
      playerCount++
    }
  }

  return { save, playerCount }
}

// ── Main chat route ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      messages,           // [{ role, content }] — full history
      saveId,             // current save (null if setup)
      images,             // [{ base64, mimeType, filename }]
      gamesPlayed,        // number, if this is a checkpoint update
      intent,             // 'setup' | 'checkpoint' | 'chat' | 'setup_complete'
      setupContext,       // { clubName, seasonObjective, boardExpectation } for final setup step
    } = body

    let saveContextData: any = null
    if (saveId) saveContextData = await loadSaveContext(saveId, user.id)

    // ── Process images if any ─────────────────────────────────────────────────
    let extractionResult: any = null
    let dbSaveResult: any = null
    let newSave: any = null
    let imageTypes: string[] = []

    if (images?.length > 0) {
      // Single Claude call for all images — fast, no rate limits
      const imagesToProcess = images.slice(0, 20)

      let extractionValue: any = null
      try {
        extractionValue = await analyzeAllImages(
          imagesToProcess.map((img: any) => ({ base64: img.base64, mimeType: img.mimeType || 'image/png' }))
        )
      } catch (e) {
        console.error('Vision extraction failed:', e)
      }

      const successful = extractionValue ? [extractionValue] : []
      imageTypes = extractionValue ? ['squad'] : ['error']

      if (successful.length > 0) {
        extractionResult = mergeExtractions(successful)

        if (intent === 'setup' || !saveId) {
          // Creating a new save
          if (setupContext?.clubName || extractionResult.clubName) {
            const { save, playerCount } = await createSaveFromExtracted(extractionResult, user.id, setupContext || {})
            newSave = { id: save.id, name: save.name, playerCount }
          }
        } else if (saveId && gamesPlayed != null) {
          // Checkpoint update
          dbSaveResult = await saveToCheckpoint(saveId, extractionResult, gamesPlayed, user.id)
        }
      }
    }

    // ── Build context for chat model ──────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(saveContextData, user.email?.split('@')[0] || 'Manager')

    // Build context message about what just happened with images
    let imageContextMessage = ''
    if (extractionResult) {
      const ts = extractionResult.teamStats
      const found: string[] = []
      const missing: string[] = []

      if (extractionResult.leagueTable?.length > 0) {
        const myTeam = extractionResult.leagueTable.find((r: any) => r.isYourTeam)
        found.push(`league_table:${myTeam ? `${myTeam.position}th, ${myTeam.points}pts` : `${extractionResult.leagueTable.length} teams`}`)
      } else missing.push('league_table')

      if (Object.values(ts || {}).some(v => v != null)) {
        found.push(`team_stats:pos${ts.leaguePosition ?? '?'} ${ts.wins ?? '?'}W${ts.draws ?? '?'}D${ts.losses ?? '?'}L xG${ts.xg ?? '?'}`)
      } else missing.push('team_stats')

      if (extractionResult.playerStats?.length > 0) {
        const topScorer = [...extractionResult.playerStats].sort((a: any, b: any) => (b.goals || 0) - (a.goals || 0))[0]
        found.push(`player_stats:${extractionResult.playerStats.length} players, top scorer ${topScorer?.name} ${topScorer?.goals ?? 0}G`)
      } else missing.push('player_stats')

      const f = extractionResult.finances
      if (f && Object.values(f).some(v => v != null)) {
        found.push(`finances:budget £${f.transferBudget ? (f.transferBudget / 1000000).toFixed(1) + 'm' : '?'}`)
      } else missing.push('finances')

      const m = extractionResult.medical
      if (m?.currentInjuries != null || m?.overallSquadCondition) {
        found.push(`medical:${m.currentInjuries ?? '?'} injuries`)
      } else missing.push('medical')

      if (extractionResult.tactic?.formation) found.push(`tactic:${extractionResult.tactic.formation}`)

      const isYouthCheckpoint = gamesPlayed === 23 || gamesPlayed === 46
      if (isYouthCheckpoint && !extractionResult.playerStats?.length) missing.push('youth_squad')

      imageContextMessage = `[EXTRACTED FROM ${images.length} SCREENSHOT(S)${images.length > 20 ? ` — only first 20 processed` : ''}]\nFound: ${found.join(' | ')}\nMissing: ${missing.join(', ') || 'nothing'}\nSaved to DB: ${dbSaveResult?.saved?.join(', ') || (newSave ? `new save created (${newSave.playerCount} players)` : 'not saved')}\nYouth updated: ${dbSaveResult?.youthUpdated?.join(', ') || 'none'}\nNewSaveId: ${newSave?.id || ''}\nGamesPlayed: ${gamesPlayed || 'unknown'}\nIsYouthCheckpoint: ${isYouthCheckpoint}`
    }

    // ── Build checklist ───────────────────────────────────────────────────────
    let checklistData: any = null
    if (gamesPlayed != null && extractionResult) {
      const extracted = extractionResult
      const hasLeagueTable = (extracted.leagueTable?.length ?? 0) > 0
      const hasTeamStats = Object.values(extracted.teamStats || {}).some(v => v != null)
      const hasPlayerStats = (extracted.playerStats?.length ?? 0) > 0
      const hasFinances = Object.values(extracted.finances || {}).some(v => v != null)
      const hasMedical = extracted.medical?.currentInjuries != null || !!extracted.medical?.overallSquadCondition
      const hasTactic = !!extracted.tactic?.formation
      const hasYouth = (gamesPlayed === 23 || gamesPlayed === 46) ? hasPlayerStats : false

      const checklist = getChecklistForGames(gamesPlayed)
      const results = evaluateChecklist(checklist, { hasLeagueTable, hasTeamStats, hasPlayerStats, hasFinances, hasMedical, hasTactic, hasYouth })
      const complete = isCheckpointComplete(checklist, results)

      checklistData = {
        gamesPlayed,
        items: results.map(r => ({
          key: r.item.key,
          label: r.item.label,
          required: r.item.required,
          screenshotHint: r.item.screenshotHint,
          found: r.found,
        })),
        complete,
        missingRequired: results.filter(r => r.item.required && !r.found).map(r => r.item.label),
      }
    }

    // Build messages for chat model
    const chatMessages = [
      ...messages.slice(-10), // keep last 10 for context
      ...(imageContextMessage ? [{
        role: 'user' as const,
        content: imageContextMessage,
      }] : []),
    ]

    // ── Call chat model ───────────────────────────────────────────────────────
    const chatResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...chatMessages,
        ],
        max_tokens: 1000,
        temperature: 0.6,
      }),
    })

    if (!chatResponse.ok) {
      const err = await chatResponse.text()
      throw new Error(`Chat API error: ${chatResponse.status} ${err}`)
    }

    const chatResult = await chatResponse.json()
    const aiMessage = chatResult.choices[0]?.message?.content || 'Something went wrong, try again.'

    return NextResponse.json({
      message: aiMessage,
      newSaveId: newSave?.id || null,
      checkpointId: dbSaveResult?.checkpointId || null,
      saved: dbSaveResult?.saved || [],
      youthUpdated: dbSaveResult?.youthUpdated || [],
      imageTypes,
      checklist: checklistData,
    })

  } catch (err: any) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: err.message || 'Chat failed' }, { status: 500 })
  }
}
