'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Filter, Cpu, ChevronDown, ChevronUp, ExternalLink, CheckCircle2, Target } from 'lucide-react'

// ─── FM26 Tactic Data ────────────────────────────────────────────────────────

interface Tactic {
  id: string
  name: string
  creator: string
  source: string
  sourceUrl: string
  formation: string
  oopFormation: string
  mentality: string
  style: string[]
  leagueLevels: string[]
  leagueExamples: string
  ipInstructions: Record<string, string>
  oopInstructions: Record<string, string>
  description: string
  strengths: string[]
  weaknesses: string[]
  keyRoles?: string
}

const TACTICS: Tactic[] = [
  {
    id: 'kompany-pendulum-2341',
    name: "Kompany's PENDULUM 2-3-4-1",
    creator: 'KompanyFM',
    source: 'FMScout',
    sourceUrl: 'https://fmscout.com/a-219697-fm26-kompanys-2-3-4-1-pendulum.html',
    formation: '2-3-4-1',
    oopFormation: '4-5-1',
    mentality: 'Positive',
    style: ['High Press', 'Short Passing', 'High Line'],
    leagueLevels: ['Premier League', 'Champions League', 'Top Flights'],
    leagueExamples: 'Elite clubs, top European competitions',
    ipInstructions: {
      'Build-Up Strategy': 'Short Passing',
      'Passing Directness': 'Shorter',
      'Tempo': 'Higher',
      'Creative Freedom': 'Expressive',
      'Progress Through': 'Central',
      'Crossing Style': 'Low Cross',
      'Shots from Distance': 'Rarely',
      'Dribbling': 'Sometimes',
      'Overlap': 'No',
      'Underlap': 'No',
      'Patience': 'Patient',
      'GK Distribution': 'Throw/Short',
      'GK Distribution Speed': 'Slower',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'High',
      'Defensive Line Behaviour': 'Aggressive',
      'Line of Engagement': 'High',
      'Trigger Press': 'More Urgent',
      'Defensive Transition': 'Counter-Press',
      'Pressing Trap': 'Press Into Channels',
      'Cross Engagement': 'Prevent Cross',
      'Short GK Distribution': 'Prevent',
    },
    description:
      'The tactic that won the treble. A fluid 2-3-4-1 that morphs into a defensive 4-5-1 out of possession. Relies on a high press, short passing triangles and a dominant AM line of four. Requires technically gifted players and high press intensity.',
    strengths: ['Dominating possession', 'Breaking down deep blocks', 'Pressing high up the pitch'],
    weaknesses: ['Needs quality technical players', 'Vulnerable on transitions if press is beaten', 'Not suitable for lower leagues'],
    keyRoles: 'Four attacking midfielders are key; two must be inside forwards with pace',
  },
  {
    id: 'enrique-psg-433',
    name: "Luis Enrique's PSG 4-3-3",
    creator: 'Various / Luis Enrique inspired',
    source: 'FMScout',
    sourceUrl: 'https://fmscout.com',
    formation: '4-3-3',
    oopFormation: '4-5-1',
    mentality: 'Positive',
    style: ['High Press', 'Possession', 'Wide Play'],
    leagueLevels: ['Premier League', 'Champions League', 'Top Flights'],
    leagueExamples: 'Top-flight clubs with quality wide forwards',
    ipInstructions: {
      'Build-Up Strategy': 'Short Passing',
      'Passing Directness': 'Shorter',
      'Tempo': 'Higher',
      'Creative Freedom': 'Expressive',
      'Progress Through': 'Wide',
      'Crossing Style': 'Low Cross',
      'Overlap': 'Overlap Wide',
      'Dribbling': 'Sometimes',
      'Shots from Distance': 'Rarely',
      'Patience': 'Patient',
      'GK Distribution': 'Throw/Short',
      'GK Distribution Speed': 'Slower',
      'Attacking Transition': 'Counter',
      'Play for Set Pieces': 'Sometimes',
    },
    oopInstructions: {
      'Defensive Line': 'High',
      'Defensive Line Behaviour': 'Aggressive',
      'Line of Engagement': 'High',
      'Trigger Press': 'More Urgent',
      'Defensive Transition': 'Counter-Press',
      'Pressing Trap': 'Press Into Channels',
      'Cross Engagement': 'Prevent Cross',
      'Short GK Distribution': 'Prevent',
    },
    description:
      'Inspired by Luis Enrique\'s high-octane PSG side. A 4-3-3 that dominates possession with lightning transitions and a furious press. Wide forwards and an aggressive midfield trio are the heart of this system.',
    strengths: ['High goal output', 'Dominant possession', 'Lethal wide play'],
    weaknesses: ['Requires exceptional wingers', 'Susceptible to long ball counters', 'Fitness demands are high'],
    keyRoles: 'Inside forwards / inverted wingers with finishing. Press-forward CF.',
  },
  {
    id: 'meta-4321',
    name: 'FM26 META 4-3-2-1',
    creator: 'Community Meta',
    source: 'FMScout',
    sourceUrl: 'https://fmscout.com',
    formation: '4-3-2-1',
    oopFormation: '4-5-1',
    mentality: 'Attacking',
    style: ['High Tempo', 'Direct', 'High Press'],
    leagueLevels: ['Premier League', 'Championship', 'Top Flights', 'Mid-Table'],
    leagueExamples: 'Mid-to-top clubs in any division',
    ipInstructions: {
      'Build-Up Strategy': 'Direct Passing',
      'Passing Directness': 'More Direct',
      'Tempo': 'Higher',
      'Creative Freedom': 'Expressive',
      'Progress Through': 'Central',
      'Crossing Style': 'Whipped Cross',
      'Shots from Distance': 'Sometimes',
      'Dribbling': 'Sometimes',
      'Overlap': 'No',
      'Underlap': 'Underlap Inside',
      'Patience': 'Impatient',
      'GK Distribution': 'Long',
      'GK Distribution Speed': 'Quicker',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'High',
      'Defensive Line Behaviour': 'Aggressive',
      'Line of Engagement': 'High',
      'Trigger Press': 'More Urgent',
      'Defensive Transition': 'Counter-Press',
      'Pressing Trap': 'Press Wide Areas',
      'Cross Engagement': 'Prevent Cross',
      'Short GK Distribution': 'Prevent',
    },
    description:
      'The FM26 community meta tactic. A compact 4-3-2-1 "Christmas tree" that generates an absurd number of goals. Two attacking midfielders support a lone striker while three central mids control the game. High tempo and relentless pressing.',
    strengths: ['4+ goals per game potential', 'Effective in any division', 'Simple player requirements'],
    weaknesses: ['Central focus means narrow play', 'Can leak goals on the counter', 'Less effective without a strong striker'],
    keyRoles: 'Two attacking midfielders who can shoot. A physical press-forward striker.',
  },
  {
    id: 'iraola-4231',
    name: 'Iraola 4-2-3-1 Overachiever',
    creator: 'Various (Iraola-inspired)',
    source: 'FMScout',
    sourceUrl: 'https://fmscout.com',
    formation: '4-2-3-1',
    oopFormation: '4-4-2',
    mentality: 'Positive',
    style: ['Balanced', 'Mid-Press', 'Structured'],
    leagueLevels: ['Premier League', 'Championship', 'Mid-Table', 'Lower Mid'],
    leagueExamples: 'Works with any squad — designed for overachievement',
    ipInstructions: {
      'Build-Up Strategy': 'Structured Build-Up',
      'Passing Directness': 'Balanced',
      'Tempo': 'Standard',
      'Creative Freedom': 'Balanced',
      'Progress Through': 'Both',
      'Crossing Style': 'Mixed',
      'Shots from Distance': 'Sometimes',
      'Dribbling': 'Sometimes',
      'Overlap': 'Overlap Wide',
      'Underlap': 'No',
      'Patience': 'Patient',
      'GK Distribution': 'Balanced',
      'GK Distribution Speed': 'Standard',
      'Attacking Transition': 'Balanced',
    },
    oopInstructions: {
      'Defensive Line': 'Standard',
      'Defensive Line Behaviour': 'Standard',
      'Line of Engagement': 'Standard',
      'Trigger Press': 'Standard',
      'Defensive Transition': 'Regroup',
      'Pressing Trap': 'No Trap',
      'Cross Engagement': 'Engage',
      'Short GK Distribution': 'Allow',
    },
    description:
      'Inspired by Iraola\'s Bournemouth and Athletic Club sides. A disciplined 4-2-3-1 with a double pivot that makes any team punch above their weight. Solid defensive structure with purposeful attacks down both flanks.',
    strengths: ['Works with weaker squads', 'Solid defensively', 'Good transition play'],
    weaknesses: ['May struggle for goals vs elite defences', 'Requires hard-working DMs', 'Not a goal machine tactic'],
    keyRoles: 'Box-to-box DMs, technical AM, hard-working wide players',
  },
  {
    id: 'tiki-taka-433',
    name: 'Tiki-Taka 4-3-3',
    creator: 'FMScout Community',
    source: 'FMScout',
    sourceUrl: 'https://fmscout.com',
    formation: '4-3-3',
    oopFormation: '4-3-3',
    mentality: 'Positive',
    style: ['Possession', 'Short Passing', 'High Press'],
    leagueLevels: ['Premier League', 'Champions League', 'Top Flights'],
    leagueExamples: 'Top clubs with highly technical squads',
    ipInstructions: {
      'Build-Up Strategy': 'Short Passing',
      'Passing Directness': 'Much Shorter',
      'Tempo': 'Lower',
      'Creative Freedom': 'Balanced',
      'Progress Through': 'Central',
      'Crossing Style': 'Low Cross',
      'Shots from Distance': 'Rarely',
      'Dribbling': 'Rarely',
      'Overlap': 'No',
      'Underlap': 'No',
      'Patience': 'Very Patient',
      'GK Distribution': 'Throw/Short',
      'GK Distribution Speed': 'Slower',
      'Attacking Transition': 'Balanced',
    },
    oopInstructions: {
      'Defensive Line': 'High',
      'Defensive Line Behaviour': 'Aggressive',
      'Line of Engagement': 'High',
      'Trigger Press': 'More Urgent',
      'Defensive Transition': 'Counter-Press',
      'Pressing Trap': 'Press Into Channels',
      'Cross Engagement': 'Prevent Cross',
      'Short GK Distribution': 'Prevent',
    },
    description:
      'Classic Pep-inspired tiki-taka. 60%+ possession, 92%+ pass completion, suffocating the opponent with patient positional play. Relies on technically exceptional players in all positions. Slow to build up, lethal in the final third.',
    strengths: ['Exceptional pass completion', 'Tires out opponents', 'Very low injury risk'],
    weaknesses: ['Requires elite technical players throughout', 'Can be slow to score', 'Ineffective with direct opponents'],
    keyRoles: 'Technically elite CM trio, ball-playing CB, false 9 or pressing forward',
  },
  {
    id: 'joshdaly-4231-lower',
    name: 'JoshDaly Lower League 4-2-3-1',
    creator: 'JoshDaly',
    source: 'FMScout / Community',
    sourceUrl: 'https://fmscout.com',
    formation: '4-2-3-1',
    oopFormation: '4-4-2',
    mentality: 'Balanced',
    style: ['Lower League', 'Direct', 'Counter'],
    leagueLevels: ['Non-League', 'League Two', 'League One', 'Lower League'],
    leagueExamples: 'Vanarama National, League Two, lower tiers',
    ipInstructions: {
      'Build-Up Strategy': 'Direct Passing',
      'Passing Directness': 'More Direct',
      'Tempo': 'Higher',
      'Creative Freedom': 'Structured',
      'Progress Through': 'Wide',
      'Crossing Style': 'Mixed',
      'Shots from Distance': 'Sometimes',
      'Dribbling': 'Sometimes',
      'Overlap': 'Overlap Wide',
      'Underlap': 'No',
      'Patience': 'Impatient',
      'GK Distribution': 'Long',
      'GK Distribution Speed': 'Quicker',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'Standard',
      'Defensive Line Behaviour': 'Standard',
      'Line of Engagement': 'Standard',
      'Trigger Press': 'Standard',
      'Defensive Transition': 'Regroup',
      'Pressing Trap': 'No Trap',
      'Cross Engagement': 'Engage',
      'Short GK Distribution': 'Allow',
    },
    description:
      '92% win rate in the lower leagues. A pragmatic 4-2-3-1 that exploits the space behind defences with direct passing and overlapping full-backs. Designed for limited squads — doesn\'t demand technical ability, just work rate and physicality.',
    strengths: ['Works with semi-pro and amateur players', '92% win rate reported', 'Simple to set up'],
    weaknesses: ['Less effective as you rise up the divisions', 'Can be predictable at higher levels', 'Relies on physical strikers'],
    keyRoles: 'Strong CF who can hold up play, energetic wide players, ball-winning DMs',
  },
  {
    id: 'ben-424-lower',
    name: 'BenDoesFM 4-2-4 Lower League',
    creator: 'BenDoesFM',
    source: 'Passion4FM',
    sourceUrl: 'https://passion4fm.com',
    formation: '4-2-4',
    oopFormation: '4-4-2',
    mentality: 'Attacking',
    style: ['Lower League', 'Wide Overloads', 'Counter-Attack'],
    leagueLevels: ['Non-League', 'League Two', 'League One', 'Lower League'],
    leagueExamples: 'Any lower-league club; works especially well in Vanarama / BSN/S',
    ipInstructions: {
      'Build-Up Strategy': 'Direct Passing',
      'Passing Directness': 'More Direct',
      'Tempo': 'Higher',
      'Creative Freedom': 'Structured',
      'Progress Through': 'Wide',
      'Crossing Style': 'Early Cross',
      'Shots from Distance': 'Sometimes',
      'Dribbling': 'Sometimes',
      'Overlap': 'Overlap Wide',
      'Underlap': 'No',
      'Patience': 'Impatient',
      'GK Distribution': 'Long',
      'GK Distribution Speed': 'Quicker',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'Standard',
      'Defensive Line Behaviour': 'Standard',
      'Line of Engagement': 'Standard',
      'Trigger Press': 'Trigger',
      'Defensive Transition': 'Regroup',
      'Pressing Trap': 'Press Wide Areas',
      'Cross Engagement': 'Engage',
      'Short GK Distribution': 'Allow',
    },
    description:
      'An explosive 4-2-4 that floods the wide areas with two wingers AND two strikers. A double pivot behind provides cover as the rest attack. Designed for LLM dominance with limited technical players — use pace and width to punish defences.',
    strengths: ['Lots of goals from wide areas', 'Exploits lower-league defending', 'Two striker partnership is lethal'],
    weaknesses: ['Very open — leaks goals', 'Requires two pacey wide players', 'DMs are overworked'],
    keyRoles: 'Two pacey wingers, two complementary strikers (hold-up + runner), tireless DMs',
  },
  {
    id: 'unbeatable-433',
    name: "TheHare's UNBEATABLE 4-3-3",
    creator: 'TheHare',
    source: 'FMScout',
    sourceUrl: 'https://fmscout.com',
    formation: '4-3-3',
    oopFormation: '4-5-1',
    mentality: 'Positive',
    style: ['High Press', 'High Tempo', 'Attack Wide'],
    leagueLevels: ['Premier League', 'Championship', 'Top Flights', 'Mid-Table'],
    leagueExamples: 'Championship and above; top-half Premier League clubs',
    ipInstructions: {
      'Build-Up Strategy': 'Direct Passing',
      'Passing Directness': 'Balanced',
      'Tempo': 'Higher',
      'Creative Freedom': 'Expressive',
      'Progress Through': 'Wide',
      'Crossing Style': 'Mixed',
      'Shots from Distance': 'Sometimes',
      'Dribbling': 'Sometimes',
      'Overlap': 'Overlap Wide',
      'Underlap': 'No',
      'Patience': 'Balanced',
      'GK Distribution': 'Balanced',
      'GK Distribution Speed': 'Standard',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'High',
      'Defensive Line Behaviour': 'Aggressive',
      'Line of Engagement': 'High',
      'Trigger Press': 'More Urgent',
      'Defensive Transition': 'Counter-Press',
      'Pressing Trap': 'Press Wide Areas',
      'Cross Engagement': 'Prevent Cross',
      'Short GK Distribution': 'Prevent',
    },
    description:
      'The tactic that went unbeaten across a full season with 106 goals. A 4-3-3 with disciplined wide play and relentless pressing. The shape drops into a solid 4-5-1 to protect the lead. A reliable choice for mid-to-top clubs.',
    strengths: ['Unbeaten potential', '106 goals in a season reported', 'Great balance of attack and defence'],
    weaknesses: ['Requires mobile wingers', 'Needs confident full-backs', 'Not ideal for relegation scraps'],
    keyRoles: 'Pacey wingers who can track back, a mobile CM trio, pressing forward',
  },
]

// ─── Save / AI match types ────────────────────────────────────────────────────

interface SaveOption {
  id: string
  name: string
  currentClub: string | null
}

interface MatchResult {
  tacticId: string
  matchScore: number
  reasoning: string
  recommendation: 'Strong Match' | 'Good Match' | 'Possible Match' | 'Poor Match'
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TacticLibraryPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [leagueFilter, setLeagueFilter] = useState('All')
  const [styleFilter, setStyleFilter] = useState('All')
  const [saves, setSaves] = useState<SaveOption[]>([])
  const [selectedSave, setSelectedSave] = useState<string>('')
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [isMatching, setIsMatching] = useState(false)
  const [matchError, setMatchError] = useState('')
  const [showMatchPanel, setShowMatchPanel] = useState(false)

  useEffect(() => {
    fetch('/api/saves')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setSaves(data)
      })
      .catch(() => {})
  }, [])

  const leagueLevels = ['All', 'Non-League', 'Lower League', 'League Two', 'League One', 'Championship', 'Mid-Table', 'Lower Mid', 'Premier League', 'Top Flights', 'Champions League']
  const styles = ['All', 'High Press', 'Possession', 'Short Passing', 'Direct', 'Counter', 'Lower League', 'Wide Play', 'Wide Overloads', 'Balanced', 'High Tempo']

  const filteredTactics = TACTICS.filter(t => {
    const leagueMatch = leagueFilter === 'All' || t.leagueLevels.includes(leagueFilter)
    const styleMatch = styleFilter === 'All' || t.style.includes(styleFilter)
    return leagueMatch && styleMatch
  })

  async function handleMatchToSave() {
    if (!selectedSave) return
    setIsMatching(true)
    setMatchError('')
    setMatchResults([])
    try {
      const res = await fetch('/api/ai/match-tactic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saveId: selectedSave, tactics: TACTICS }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMatchResults(data.results)
      setShowMatchPanel(true)
    } catch (e: unknown) {
      setMatchError(e instanceof Error ? e.message : 'AI match failed')
    } finally {
      setIsMatching(false)
    }
  }

  function getMatchResult(tacticId: string) {
    return matchResults.find(r => r.tacticId === tacticId)
  }

  function matchScoreColor(rec: string) {
    if (rec === 'Strong Match') return 'bg-green-900/40 text-green-300 border border-green-700'
    if (rec === 'Good Match') return 'bg-blue-900/40 text-blue-300 border border-blue-700'
    if (rec === 'Possible Match') return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    return 'bg-gray-800 text-gray-400 border border-gray-600'
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={24} className="text-indigo-600" />
            FM26 Tactic Library
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Proven community tactics with exact FM26 IP &amp; OOP instructions
          </p>
        </div>
        <button
          onClick={() => setShowMatchPanel(!showMatchPanel)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors"
        >
          <Cpu size={15} />
          Match to My Save
        </button>
      </div>

      {/* AI Match Panel */}
      {showMatchPanel && (
        <div className="bg-gray-900 rounded-xl p-5 mb-6 border border-indigo-700">
          <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Cpu size={15} className="text-indigo-400" />
            AI Tactic Match
          </h2>
          <p className="text-gray-400 text-xs mb-4">
            Select a save and the AI will score each tactic against your squad, division, and playing style.
          </p>
          <div className="flex gap-3">
            <select
              value={selectedSave}
              onChange={e => setSelectedSave(e.target.value)}
              className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select a save…</option>
              {saves.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.currentClub ? ` — ${s.currentClub}` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={handleMatchToSave}
              disabled={!selectedSave || isMatching}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isMatching ? 'Analysing…' : 'Analyse'}
            </button>
          </div>
          {matchError && <p className="text-red-400 text-xs mt-2">{matchError}</p>}
          {matchResults.length > 0 && (
            <p className="text-green-400 text-xs mt-3 flex items-center gap-1">
              <CheckCircle2 size={13} />
              Match complete — scores are shown on each tactic below
            </p>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-500" />
          <span className="text-xs text-gray-500 font-medium">Level:</span>
          <select
            value={leagueFilter}
            onChange={e => setLeagueFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-indigo-400"
          >
            {leagueLevels.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Style:</span>
          <select
            value={styleFilter}
            onChange={e => setStyleFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-indigo-400"
          >
            {styles.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <span className="text-xs text-gray-400 self-center ml-1">
          {filteredTactics.length} tactic{filteredTactics.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tactic Cards */}
      <div className="space-y-4">
        {filteredTactics.map(tactic => {
          const isExpanded = expandedId === tactic.id
          const matchResult = getMatchResult(tactic.id)

          return (
            <div
              key={tactic.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Card header — always visible */}
              <div
                className="px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : tactic.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-base">{tactic.name}</h3>
                      <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 font-mono">
                        {tactic.formation}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                        OOP: {tactic.oopFormation}
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">
                        {tactic.mentality}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-gray-500">
                        by <span className="font-medium text-gray-700">{tactic.creator}</span>
                      </span>
                      <a
                        href={tactic.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5"
                        onClick={e => e.stopPropagation()}
                      >
                        {tactic.source} <ExternalLink size={10} />
                      </a>
                      <span className="text-xs text-gray-400">{tactic.leagueExamples}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tactic.style.map(s => (
                        <span key={s} className="text-xs bg-green-50 text-green-700 rounded-full px-2 py-0.5 border border-green-200">
                          {s}
                        </span>
                      ))}
                      {tactic.leagueLevels.slice(0, 3).map(l => (
                        <span key={l} className="text-xs bg-orange-50 text-orange-700 rounded-full px-2 py-0.5 border border-orange-200">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    {matchResult && (
                      <div className={`text-xs px-3 py-1.5 rounded-lg font-medium ${matchScoreColor(matchResult.recommendation)}`}>
                        <div>{matchResult.recommendation}</div>
                        <div className="text-center font-bold text-lg leading-tight">{matchResult.matchScore}%</div>
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-5 bg-gray-50">
                  {/* AI match reasoning */}
                  {matchResult && (
                    <div className={`rounded-lg p-4 mb-5 ${matchScoreColor(matchResult.recommendation)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Cpu size={13} />
                        <span className="text-xs font-semibold uppercase tracking-wide">AI Analysis</span>
                      </div>
                      <p className="text-sm">{matchResult.reasoning}</p>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-sm text-gray-700 mb-5">{tactic.description}</p>

                  {/* Strengths / Weaknesses */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {tactic.strengths.map(s => (
                          <li key={s} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="text-green-500 mt-0.5">✓</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Weaknesses</h4>
                      <ul className="space-y-1">
                        {tactic.weaknesses.map(w => (
                          <li key={w} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="text-red-400 mt-0.5">✗</span> {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Key Roles */}
                  {tactic.keyRoles && (
                    <div className="bg-indigo-50 rounded-lg px-4 py-3 mb-5 border border-indigo-100">
                      <h4 className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                        <Target size={12} /> Key Roles
                      </h4>
                      <p className="text-xs text-indigo-800">{tactic.keyRoles}</p>
                    </div>
                  )}

                  {/* IP / OOP Instructions */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b border-gray-200">
                        In Possession (IP) Instructions
                      </h4>
                      <div className="space-y-1.5">
                        {Object.entries(tactic.ipInstructions).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">{key}</span>
                            <span className="font-medium text-gray-800 bg-white rounded px-2 py-0.5 border border-gray-200">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b border-gray-200">
                        Out of Possession (OOP) Instructions
                      </h4>
                      <div className="space-y-1.5">
                        {Object.entries(tactic.oopInstructions).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">{key}</span>
                            <span className="font-medium text-gray-800 bg-white rounded px-2 py-0.5 border border-gray-200">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredTactics.length === 0 && (
          <div className="text-center text-gray-400 py-16">
            No tactics match these filters. Try broadening your search.
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-8">
        Tactic instructions are curated from FMScout &amp; Passion4FM community content. IP/OOP values based on FM26 instruction names.
      </p>
    </div>
  )
}
