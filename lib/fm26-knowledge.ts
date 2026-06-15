// ── FM26 Knowledge Base ───────────────────────────────────────────────────────
// Injected into the AI assistant's system prompt so it can make specific,
// data-driven recommendations rather than generic FM advice.

export const FM26_TACTICS = [
  {
    name: "GYR's Black Panther 4-2-3-1",
    creator: 'GYRFM',
    downloads: 111529,
    formation: '4-2-3-1',
    oop: '4-4-2',
    mentality: 'Positive',
    style: ['High Press', 'Short Passing', 'Counter-Attack'],
    leagueLevels: ['All levels — tested from Non-League to Premier League'],
    strengths: ['Dominant possession', 'High press suffocates opposition', 'Flexible across all league levels'],
    weaknesses: ['Requires technically good players', 'Can be exposed on the counter if midfield is slow'],
    bestFor: 'Any club with decent ball-playing ability. Most versatile tactic in FM26.',
    keyNote: 'Tested at Bromley (lower league), Liverpool and Nottingham Forest. Most downloaded FM26 tactic.',
  },
  {
    name: "Knap's BEOWULF 4-4-2",
    creator: 'Knap',
    downloads: 89234,
    formation: '4-4-2',
    mentality: 'Attacking',
    style: ['Direct', 'Wide Play', 'High Line'],
    leagueLevels: ['Championship', 'Premier League', 'Top European'],
    strengths: ['Goal machine — high scoring', 'Wide attackers cause havoc', 'Relentless attacking output'],
    weaknesses: ['Vulnerable defensively on the counter', 'Needs pacey wide players', 'Not ideal for bottom-half survival'],
    bestFor: 'Mid-to-top clubs wanting goals. Not for relegation battles.',
    keyNote: 'Classic Knap — proven across multiple FM versions. Best with pace on the wings.',
  },
  {
    name: "Parisian's 4-3-3 Possession",
    creator: 'Parisian',
    downloads: 67891,
    formation: '4-3-3',
    mentality: 'Positive',
    style: ['Possession', 'Short Passing', 'Press'],
    leagueLevels: ['Championship', 'Premier League', 'International'],
    strengths: ['Suffocating possession', 'Creates clear cut chances', 'Strong defensively'],
    weaknesses: ['Needs technically gifted CM trio', 'Less effective with direct target men'],
    bestFor: 'Clubs with quality in central midfield and technical wingers.',
    keyNote: 'Same creator as the top set piece routines — pairs well with their corner setup.',
  },
  {
    name: 'Lower League Lightning 4-4-2',
    creator: 'Community',
    downloads: 45123,
    formation: '4-4-2',
    mentality: 'Balanced',
    style: ['Direct', 'Long Ball', 'Compact Defence'],
    leagueLevels: ['Non-League', 'League Two', 'League One'],
    strengths: ['Works with limited technical players', 'Hard to break down', 'Effective on poor pitches'],
    weaknesses: ['Won\'t dominate possession', 'Relies on physical striker partnership'],
    bestFor: 'Lower league clubs, semi-pro, budget builds.',
    keyNote: 'Designed specifically for lower league attribute limitations.',
  },
  {
    name: 'Gegenpress 4-2-3-1',
    creator: 'Community',
    downloads: 38456,
    formation: '4-2-3-1',
    mentality: 'Attacking',
    style: ['High Press', 'Counter-Press', 'Vertical Passing'],
    leagueLevels: ['Championship', 'Premier League', 'Top Flights'],
    strengths: ['Wins ball high up pitch', 'Transitions devastating', 'Exciting football'],
    weaknesses: ['Physically demanding — needs fit squad', 'Injuries risk with thin squads', 'Poor results in fixture congestion'],
    bestFor: 'Well-resourced clubs with deep squads and high stamina players.',
    keyNote: 'Best with high stamina/work rate. Rotation is essential.',
  },
  {
    name: 'Park the Bus 5-4-1',
    creator: 'Community',
    downloads: 29876,
    formation: '5-4-1',
    mentality: 'Defensive',
    style: ['Defensive Block', 'Counter-Attack', 'Long Ball'],
    leagueLevels: ['All levels — situational use'],
    strengths: ['Extremely hard to break down', 'Punishes on the counter', 'Works against stronger opposition'],
    weaknesses: ['Boring to watch', 'Struggles to control games', 'Needs clinical striker'],
    bestFor: 'Underdogs, away games against top sides, cup ties.',
    keyNote: 'Use situationally — not for the full season unless severely outgunned.',
  },
]

export const FM26_SET_PIECES = [
  {
    name: "Knap FM26 Set Piece Routines",
    creator: 'Knap',
    downloads: 51389,
    cornerGoals: '19-20 corner goals in testing',
    files: 'AZURE26 (modified corners) + MC40 (standard)',
    bestFor: 'Pairs with any Knap tactic. Best results sorting player lists to your squad.',
    note: 'Load ALL routines. Sort attacker lists to match your tallest aerial threats.',
  },
  {
    name: "Parisian's FM26 Set Pieces (Apr 4 — latest)",
    creator: 'Parisian',
    downloads: 14919,
    cornerGoals: '17 corner goals with Man City. 37 total set play goals in a season.',
    files: 'Full routines + free kick update',
    bestFor: 'Best overall package — corners AND free kicks covered.',
    note: 'Most complete routine available. Use this as default if not using Knap tactics.',
  },
  {
    name: "Parisian's Short Corner Routine",
    creator: 'Parisian',
    downloads: 3047,
    cornerGoals: 'Short corner variant',
    bestFor: 'Use alongside a standard corner routine as an alternative option.',
    note: 'Good when opponent zones near/far post heavily. Toggle priority in-game.',
  },
]

export const FM26_MECHANICS = `
## FM26 Key Mechanics (inject into AI context)

### Pressing
- Press intensity is the biggest FM26 meta change. High press works better than ever but needs high stamina (>13) and work rate (>13) squad-wide.
- Pressing triggers: "Press More" in transition is devastating when opponent GK has low composure/passing.
- Counter-press (immediate press on losing ball) is overpowered in FM26 — enable it if you have the fitness.

### Set Pieces
- FM26 set pieces are extremely important — teams with good routines can score 15-25+ goals from corners alone.
- Near post corners are most effective. Far post is secondary. Short corners useful to keep opposition honest.
- Taker quality matters: Corners attribute >14 is the threshold. Crossing >14 helps.
- Delivery type: Whipped or Floated to near post is the meta. Drilled corners are situational.
- Marking: Zonal marking is generally better in FM26 than man marking for defending.

### Roles & Duties
- Mezzala (Attack) is one of the best roles in FM26 — gets forward, scores and assists.
- Inside Forward (Attack) needs pace + dribbling >13 to be effective.
- Deep Lying Playmaker works best with high vision (>14) and composure.
- False 9 works in top leagues but struggles at lower levels without technical players.
- Complete Wing Back is stamina-hungry — needs >14 stamina minimum.

### Transfers & Values
- Player values are inflated in FM26 vs FM25 — expect 20-30% higher market prices.
- Best value: U23 players with PA 130-150 in lesser leagues (Eredivisie, Portuguese Liga, Belgian Pro League).
- Loan-to-buy clauses are negotiated more easily in FM26 — use them for risky signings.
- Releasing players in final year of contract generates no fee — extend by 1 year then sell if needed.

### Lower League Specific
- Direct play + set pieces is the most effective lower league approach.
- Technical training is slower to show results in lower leagues — prioritise fitness and tactical familiarity.
- Affiliate clubs are crucial for young player development — pursue them early.
- Staff quality matters more than tactics at lower levels. Prioritise coaching badges >3 stars.

### Season Phases
- Pre-season: Set team shape, tactical familiarity is key. Don't overwork key players.
- 10 games: Early form indicator. If xG is positive but results aren't showing, don't panic — it'll come.
- 23 games (halfway): Clear picture of squad depth issues. January window planning starts here.
- 35 games: Business end. Rotation for cup runs vs league push — decide your priority.
- 46 games: Full season analysis. Compare goals from set pieces, xG, clean sheets vs league average.

### Stats to Watch
- xG differential (xG minus xGA): Best predictor of actual quality. Positive = overperforming/underperforming likely to correct.
- Clear cut chances: More reliable than total shots. Aim for 3+ per game at home.
- Set piece goals: Should be 20-30% of total goals with good routines. Below 10% = fix your set pieces.
- Possession above 55%: You control games. Below 45%: You're relying on transitions — make sure your press is set up to win it back quickly.
`

// ── Condensed version for system prompt injection ─────────────────────────────

export function buildFM26KnowledgeBlock(): string {
  const tacticList = FM26_TACTICS.map(t =>
    `- **${t.name}** (${t.downloads.toLocaleString()} downloads): ${t.formation} ${t.mentality}. ${t.bestFor} Strengths: ${t.strengths.join(', ')}. Weaknesses: ${t.weaknesses.join(', ')}. ${t.keyNote}`
  ).join('\n')

  const setPieceList = FM26_SET_PIECES.map(s =>
    `- **${s.name}** (${s.downloads.toLocaleString()} downloads): ${s.cornerGoals}. ${s.bestFor}`
  ).join('\n')

  return `
## FM26 TACTIC LIBRARY (reference these specifically — don't give generic advice)
${tacticList}

## FM26 SET PIECE ROUTINES (available in the Set Pieces tab)
${setPieceList}

## FM26 MECHANICS & KNOWLEDGE
${FM26_MECHANICS}

When giving tactical advice:
- Reference specific tactics from the library above by name
- Cite download counts when recommending — it adds credibility
- If the user's xG is low, suggest a specific tactic change AND a set piece routine
- If they're struggling defensively, reference specific defensive mechanics above
- If they're in lower leagues, steer toward lower-league appropriate tactics
- Always connect stats to specific actionable changes, not just observations
`
}

// ── Checkpoint requirements by milestone ──────────────────────────────────────

export interface ChecklistItem {
  key: string
  label: string
  description: string
  required: boolean
  screenshotHint: string
}

export const CHECKPOINT_REQUIREMENTS: Record<number, ChecklistItem[]> = {
  10: [
    { key: 'league_table',  label: 'League Table',    required: true,  description: 'Position, points, record',          screenshotHint: 'League table screen' },
    { key: 'team_stats',    label: 'Team Stats',      required: true,  description: 'xG, possession, set piece goals',   screenshotHint: 'Team stats / analysis screen — make sure set piece goals column is visible' },
    { key: 'player_stats',  label: 'Player Stats',    required: true,  description: 'Goals, assists, ratings for squad', screenshotHint: 'Player stats table — all players' },
    { key: 'finances',      label: 'Finances',        required: true,  description: 'Transfer budget, wage budget',      screenshotHint: 'Club finances screen' },
    { key: 'tactic',        label: 'Tactic',          required: false, description: 'Current formation and mentality',   screenshotHint: 'Tactics screen overview' },
    { key: 'medical',       label: 'Medical',         required: false, description: 'Current injuries',                  screenshotHint: 'Medical centre / fitness screen' },
  ],
  23: [
    { key: 'league_table',  label: 'League Table',    required: true,  description: 'Position, points, record',          screenshotHint: 'League table screen' },
    { key: 'team_stats',    label: 'Team Stats',      required: true,  description: 'xG, possession, set piece goals',   screenshotHint: 'Team stats / analysis screen — make sure set piece goals column is visible' },
    { key: 'player_stats',  label: 'Player Stats',    required: true,  description: 'Goals, assists, ratings for squad', screenshotHint: 'Player stats table — all players' },
    { key: 'finances',      label: 'Finances',        required: true,  description: 'Transfer budget, wage budget',      screenshotHint: 'Club finances screen' },
    { key: 'medical',       label: 'Medical',         required: true,  description: 'Injuries and squad condition',      screenshotHint: 'Medical centre screen' },
    { key: 'tactic',        label: 'Tactic',          required: false, description: 'Current formation and mentality',   screenshotHint: 'Tactics screen overview' },
    { key: 'youth',         label: 'Youth/Loan Players', required: true, description: 'Academy + loan player stats',    screenshotHint: 'Squad screen filtered to youth/U23 players, and loan list' },
  ],
  35: [
    { key: 'league_table',  label: 'League Table',    required: true,  description: 'Position, points, record',          screenshotHint: 'League table screen' },
    { key: 'team_stats',    label: 'Team Stats',      required: true,  description: 'xG, possession, set piece goals',   screenshotHint: 'Team stats / analysis screen — set piece goals column visible' },
    { key: 'player_stats',  label: 'Player Stats',    required: true,  description: 'Goals, assists, ratings for squad', screenshotHint: 'Player stats table — all players' },
    { key: 'finances',      label: 'Finances',        required: true,  description: 'Transfer budget, wage budget',      screenshotHint: 'Club finances screen' },
    { key: 'tactic',        label: 'Tactic',          required: false, description: 'Current formation and mentality',   screenshotHint: 'Tactics screen overview' },
    { key: 'medical',       label: 'Medical',         required: false, description: 'Current injuries',                  screenshotHint: 'Medical centre screen' },
  ],
  46: [
    { key: 'league_table',  label: 'League Table',    required: true,  description: 'Final standings',                   screenshotHint: 'League table screen — end of season' },
    { key: 'team_stats',    label: 'Team Stats',      required: true,  description: 'Full season stats',                 screenshotHint: 'Team stats — set piece goals column visible' },
    { key: 'player_stats',  label: 'Player Stats',    required: true,  description: 'Full season player stats',          screenshotHint: 'Player stats — all players, full season' },
    { key: 'finances',      label: 'Finances',        required: true,  description: 'End of season financial position',  screenshotHint: 'Club finances screen' },
    { key: 'medical',       label: 'Medical',         required: true,  description: 'Season injury record',              screenshotHint: 'Medical centre — total injuries this season' },
    { key: 'youth',         label: 'Youth/Loan Players', required: true, description: 'End of season youth/loan stats',  screenshotHint: 'Youth + loan player screens' },
    { key: 'tactic',        label: 'Tactic',          required: false, description: 'End of season formation',           screenshotHint: 'Tactics screen' },
  ],
}

export function getChecklistForGames(gamesPlayed: number): ChecklistItem[] {
  const MILESTONES = [10, 23, 35, 46]
  const closest = MILESTONES.reduce((p, c) =>
    Math.abs(c - gamesPlayed) < Math.abs(p - gamesPlayed) ? c : p
  )
  return CHECKPOINT_REQUIREMENTS[closest] || CHECKPOINT_REQUIREMENTS[10]
}

export function evaluateChecklist(
  checklist: ChecklistItem[],
  extracted: {
    hasLeagueTable: boolean
    hasTeamStats: boolean
    hasPlayerStats: boolean
    hasFinances: boolean
    hasMedical: boolean
    hasTactic: boolean
    hasYouth: boolean
  }
): { item: ChecklistItem; found: boolean }[] {
  return checklist.map(item => ({
    item,
    found: {
      league_table: extracted.hasLeagueTable,
      team_stats:   extracted.hasTeamStats,
      player_stats: extracted.hasPlayerStats,
      finances:     extracted.hasFinances,
      medical:      extracted.hasMedical,
      tactic:       extracted.hasTactic,
      youth:        extracted.hasYouth,
    }[item.key] ?? false,
  }))
}

export function isCheckpointComplete(
  checklist: ChecklistItem[],
  results: { item: ChecklistItem; found: boolean }[]
): boolean {
  return results
    .filter(r => r.item.required)
    .every(r => r.found)
}
