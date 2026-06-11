'use client'

import { useState, useEffect, useRef } from 'react'
import { BookOpen, Filter, Cpu, ChevronDown, ChevronUp, ExternalLink, CheckCircle2, Target, Upload, X, Star, TrendingUp, ArrowUpDown } from 'lucide-react'

// ─── FM26 Tactic Data ─────────────────────────────────────────────────────────

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
  downloads: number
  ipInstructions: Record<string, string>
  oopInstructions: Record<string, string>
  description: string
  strengths: string[]
  weaknesses: string[]
  keyRoles?: string
  lowerLeagueFocused?: boolean
}

const TACTICS: Tactic[] = [
  // ─── #1 most downloaded on FMScout: 111,529 grabs ───────────────────────
  {
    id: 'gyr-black-panther-4231',
    name: "GYR's Black Panther 4-2-3-1",
    creator: 'GYRFM',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/a-gyr-black-panther-fm26-tactic.html',
    formation: '4-2-3-1',
    oopFormation: '4-4-2',
    mentality: 'Positive',
    style: ['High Press', 'Short Passing', 'Counter-Attack'],
    leagueLevels: ['Non-League', 'Lower League', 'League One', 'Championship', 'Premier League', 'Top Flights'],
    leagueExamples: 'Tested at Bromley (lower league), Liverpool & Nottingham Forest',
    downloads: 111529,
    lowerLeagueFocused: false,
    ipInstructions: {
      'Build-Up Strategy': 'Short Passing',
      'Passing Directness': 'Balanced',
      'Tempo': 'Higher',
      'Creative Freedom': 'Expressive',
      'Progress Through': 'Both Flanks',
      'Crossing Style': 'Low Cross',
      'Overlap': 'Overlap Both Flanks',
      'Shots from Distance': 'Rarely',
      'Dribbling': 'Sometimes',
      'Patience': 'Work Ball Into Box',
      'GK Distribution': 'Throw/Short',
      'GK Distribution Speed': 'Distribute Quickly',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'Standard',
      'Defensive Line Behaviour': 'Standard',
      'Line of Engagement': 'High Press',
      'Trigger Press': 'More Urgent',
      'Defensive Transition': 'Counter-Press',
      'Pressing Trap': 'Trap Outside',
      'Cross Engagement': 'Prevent Cross',
      'Short GK Distribution': 'Prevent',
    },
    description: "The most downloaded FM26 tactic with 111,000+ grabs. GYRFM's Black Panther is a flexible 4-2-3-1 that adapts from lower leagues to elite level. Won a quadruple in testing. The key is the high press and rapid counter-attack — sit deep enough to absorb pressure, then explode forward.",
    strengths: ['Works at ALL levels from non-league to elite', 'Quadruple-winning potential', 'Rapid counter-attacks', 'Flexible with squad quality'],
    weaknesses: ['Requires mobile full-backs', 'High press burns stamina — squad depth needed', 'Needs a capable #10 or AM'],
    keyRoles: 'Technical #10 / AM, pacey wide forwards, a DM who can break up play',
  },
  // ─── #2 most downloaded: 55,425 grabs ────────────────────────────────────
  {
    id: 'kompany-pendulum-2341-v4',
    name: "Kompany's PENDULUM 2-3-4-1 V4.1",
    creator: 'mat17109',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-tactics.html?id=13076',
    formation: '2-3-4-1',
    oopFormation: '4-5-1',
    mentality: 'Positive',
    style: ['High Press', 'Short Passing', 'High Line', 'Possession'],
    leagueLevels: ['Premier League', 'Champions League', 'Top Flights'],
    leagueExamples: 'Tested with Man Utd, Bayern, Man City, Barcelona, Real Madrid',
    downloads: 55425,
    ipInstructions: {
      'Build-Up Strategy': 'Short Passing',
      'Passing Directness': 'Shorter',
      'Tempo': 'Higher',
      'Creative Freedom': 'Expressive',
      'Progress Through': 'Central',
      'Crossing Style': 'Low Cross',
      'Shots from Distance': 'Rarely',
      'Dribbling': 'Sometimes',
      'Patience': 'Work Ball Into Box',
      'GK Distribution': 'Throw/Short',
      'GK Distribution Speed': 'Slower',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'High',
      'Defensive Line Behaviour': 'Aggressive',
      'Line of Engagement': 'High Press',
      'Trigger Press': 'More Urgent',
      'Defensive Transition': 'Counter-Press',
      'Pressing Trap': 'Trap Into Channels',
      'Cross Engagement': 'Prevent Cross',
      'Short GK Distribution': 'Prevent',
    },
    description: 'The updated V4.1 of the iconic Pendulum tactic. A fluid 2-3-4-1 that morphs into a defensive 4-5-1 OOP. Requires technically gifted, high-stamina players. Best for elite clubs with the squad depth to sustain the press.',
    strengths: ['Treble/quadruple potential', 'Beautiful possession football', 'Dominates top-level football'],
    weaknesses: ['NOT suitable for lower leagues — needs elite players', 'High fitness demands', 'Complex to understand'],
    keyRoles: 'Four technical AMs, dominant DM, ball-playing CBs',
  },
  // ─── #3 most downloaded: 37,118 grabs ────────────────────────────────────
  {
    id: 'joshdaly-best-4231',
    name: "JoshDaly's BEST 4231 (4.5+ Goals/Game)",
    creator: 'JoshDaly',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-tactics.html?id=13020',
    formation: '4-2-3-1',
    oopFormation: '4-5-1',
    mentality: 'Attacking',
    style: ['High Tempo', 'Direct', 'High Press', 'Goal Machine'],
    leagueLevels: ['Championship', 'Premier League', 'Top Flights'],
    leagueExamples: 'Top-half clubs; 4.5+ goals per game in testing',
    downloads: 37118,
    ipInstructions: {
      'Build-Up Strategy': 'Direct Passing',
      'Passing Directness': 'More Direct',
      'Tempo': 'Much Higher',
      'Creative Freedom': 'Expressive',
      'Progress Through': 'Both Flanks',
      'Crossing Style': 'Whipped Cross',
      'Overlap': 'Overlap Both Flanks',
      'Shots from Distance': 'Sometimes',
      'Dribbling': 'Sometimes',
      'Patience': 'Impatient',
      'GK Distribution': 'Long',
      'GK Distribution Speed': 'Distribute Quickly',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'High',
      'Defensive Line Behaviour': 'Aggressive',
      'Line of Engagement': 'High Press',
      'Trigger Press': 'Much More Urgent',
      'Defensive Transition': 'Counter-Press',
      'Pressing Trap': 'Trap Wide Areas',
      'Cross Engagement': 'Prevent Cross',
      'Short GK Distribution': 'Prevent',
    },
    description: "JoshDaly's most popular FM26 tactic with 37k+ downloads. 4.5+ goals per game in testing. An all-out attacking system with direct passing and relentless pressing. Best for strong squads who want to blow teams away.",
    strengths: ['Extreme goal output', 'Lethal direct attacks', 'Destroys weaker opposition'],
    weaknesses: ['Leaks goals — not defensive', 'Requires top-quality squad', 'Tires players quickly'],
    keyRoles: 'Clinical striker, rapid wide forwards, energetic midfield three',
  },
  // ─── GYR SWANSALONA: 26,121 downloads ─────────────────────────────────────
  {
    id: 'gyr-swansalona-4231',
    name: "GYR's SWANSALONA 4-2-3-1",
    creator: 'GYRFM',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/a-gyr-swansalona-fm26-tactic.html',
    formation: '4-2-3-1',
    oopFormation: '4-5-1',
    mentality: 'Positive',
    style: ['Possession', 'Short Passing', 'Wide Play', 'High Press'],
    leagueLevels: ['Championship', 'Premier League', 'Top Flights'],
    leagueExamples: 'Tested with Swansea, AC Milan & Barcelona',
    downloads: 26121,
    ipInstructions: {
      'Build-Up Strategy': 'Short Passing',
      'Passing Directness': 'Shorter',
      'Tempo': 'Higher',
      'Creative Freedom': 'Expressive',
      'Progress Through': 'Wide',
      'Crossing Style': 'Low Cross',
      'Overlap': 'Overlap Wide',
      'Shots from Distance': 'Rarely',
      'Dribbling': 'Sometimes',
      'Patience': 'Work Ball Into Box',
      'GK Distribution': 'Throw/Short',
      'GK Distribution Speed': 'Slower',
      'Attacking Transition': 'Balanced',
    },
    oopInstructions: {
      'Defensive Line': 'High',
      'Defensive Line Behaviour': 'Aggressive',
      'Line of Engagement': 'High Press',
      'Trigger Press': 'More Urgent',
      'Defensive Transition': 'Counter-Press',
      'Pressing Trap': 'Trap Into Channels',
      'Cross Engagement': 'Prevent Cross',
      'Short GK Distribution': 'Prevent',
    },
    description: "GYRFM's Swansea/Barcelona hybrid — short passing, high pressing, wide overloads. Particularly effective in mid-to-top flight football where there are technical players to execute the style.",
    strengths: ['High possession', 'Clinical wide attacks', 'Defensively structured'],
    weaknesses: ['Needs technical squad', 'Vulnerable to quick counters', 'Inconsistent with lesser players'],
    keyRoles: 'Technical wide forwards, creative AM, ball-playing DM pair',
  },
  // ─── GYR Master of Puppets: 24,665 downloads (tested Forest Green!) ───────
  {
    id: 'gyr-master-of-puppets-433',
    name: "GYR's Master of Puppets 4-3-3",
    creator: 'GYRFM',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/a-gyr-master-of-puppets-fm26-tactic.html',
    formation: '4-3-3',
    oopFormation: '4-5-1',
    mentality: 'Positive',
    style: ['High Press', 'Short Passing', 'Counter-Attack'],
    leagueLevels: ['Non-League', 'Lower League', 'League One', 'Championship', 'Premier League', 'Top Flights'],
    leagueExamples: 'Tested with Arsenal, Rangers & Forest Green (non-league)',
    downloads: 24665,
    lowerLeagueFocused: false,
    ipInstructions: {
      'Build-Up Strategy': 'Short Passing',
      'Passing Directness': 'Balanced',
      'Tempo': 'Higher',
      'Creative Freedom': 'Expressive',
      'Progress Through': 'Both Flanks',
      'Crossing Style': 'Low Cross',
      'Overlap': 'Overlap Both Flanks',
      'Shots from Distance': 'Sometimes',
      'Dribbling': 'Sometimes',
      'Patience': 'Work Ball Into Box',
      'GK Distribution': 'Balanced',
      'GK Distribution Speed': 'Standard',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'Standard',
      'Defensive Line Behaviour': 'Standard',
      'Line of Engagement': 'High Press',
      'Trigger Press': 'More Urgent',
      'Defensive Transition': 'Counter-Press',
      'Pressing Trap': 'Trap Outside',
      'Cross Engagement': 'Prevent Cross',
      'Short GK Distribution': 'Prevent',
    },
    description: "A quadruple-winning 4-3-3 tested from non-league Forest Green all the way to Arsenal. The mid-block OOP line means it doesn't expose your defence as much as typical high-press tactics — great for lower-quality squads.",
    strengths: ['Works from non-league upwards', 'Balanced defence/attack', 'Counter-press but with mid-block protection'],
    weaknesses: ['Three CMs need to be versatile', 'Wide forwards need work rate', 'Struggles vs deep-sitting low blocks'],
    keyRoles: 'Box-to-box midfield trio, high-stamina wide forwards, pressing forward CF',
  },
  // ─── GYR ELITE RESULTS 433 — explicitly tested at Farnborough (non-league) ─
  {
    id: 'gyr-elite-results-433',
    name: "GYR's ELITE RESULTS 433 (All Levels)",
    creator: 'GYRFM',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-tactics.html?id=13311',
    formation: '4-3-3',
    oopFormation: '4-5-1',
    mentality: 'Positive',
    style: ['High Press', 'Counter-Attack', 'Flexible'],
    leagueLevels: ['Non-League', 'Lower League', 'League Two', 'League One', 'Championship', 'Premier League', 'Top Flights'],
    leagueExamples: 'Tested at Farnborough (non-league), Peterborough, Real Madrid & Liverpool',
    downloads: 4378,
    lowerLeagueFocused: true,
    ipInstructions: {
      'Build-Up Strategy': 'Balanced',
      'Passing Directness': 'Balanced',
      'Tempo': 'Higher',
      'Creative Freedom': 'Expressive',
      'Progress Through': 'Both Flanks',
      'Crossing Style': 'Mixed',
      'Overlap': 'Overlap Both Flanks',
      'Shots from Distance': 'Sometimes',
      'Dribbling': 'Sometimes',
      'Patience': 'Balanced',
      'GK Distribution': 'Balanced',
      'GK Distribution Speed': 'Standard',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'Standard',
      'Defensive Line Behaviour': 'Standard',
      'Line of Engagement': 'Mid Block',
      'Trigger Press': 'Standard',
      'Defensive Transition': 'Regroup',
      'Pressing Trap': 'Balanced',
      'Cross Engagement': 'Engage',
      'Short GK Distribution': 'Allow',
    },
    description: "GYRFM designed this specifically to work at ALL team levels — explicitly tested at Farnborough (non-league). A balanced 4-3-3 that doesn't overexpose your defence. The mid-block OOP shape means even semi-pro players can execute it defensively.",
    strengths: ['Proven at non-league level', 'Mid-block protects weaker defenders', 'Works up the football pyramid', 'Lower physical demands than pure high-press tactics'],
    weaknesses: ['Not as explosive as pure attacking tactics', 'Wide forwards need to be hard workers', 'Less dominant vs top-tier teams'],
    keyRoles: 'Two box-to-box midfielders, a pressing forward, hard-working wingers',
  },
  // ─── GYR DEADPOOL 4231: explicitly for Elite AND Lower Teams ──────────────
  {
    id: 'gyr-deadpool-4231',
    name: "GYR's DEADPOOL 4-2-3-1 (Elite & Lower)",
    creator: 'GYRFM',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-tactics.html?id=13235',
    formation: '4-2-3-1',
    oopFormation: '4-4-2',
    mentality: 'Positive',
    style: ['Counter-Attack', 'Direct', 'Flexible'],
    leagueLevels: ['Non-League', 'Lower League', 'League Two', 'League One', 'Championship', 'Premier League'],
    leagueExamples: 'Tested with Liverpool, Ajax & Merthyr (lower league)',
    downloads: 7668,
    lowerLeagueFocused: true,
    ipInstructions: {
      'Build-Up Strategy': 'Direct Passing',
      'Passing Directness': 'More Direct',
      'Tempo': 'Higher',
      'Creative Freedom': 'Balanced',
      'Progress Through': 'Both Flanks',
      'Crossing Style': 'Whipped Cross',
      'Overlap': 'Overlap Wide',
      'Shots from Distance': 'Sometimes',
      'Dribbling': 'Sometimes',
      'Patience': 'Impatient',
      'GK Distribution': 'Long',
      'GK Distribution Speed': 'Distribute Quickly',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'Standard',
      'Defensive Line Behaviour': 'Standard',
      'Line of Engagement': 'Mid Block',
      'Trigger Press': 'Standard',
      'Defensive Transition': 'Regroup',
      'Pressing Trap': 'Balanced',
      'Cross Engagement': 'Engage',
      'Short GK Distribution': 'Allow',
    },
    description: "A 4-2-3-1 built to function at both elite and lower levels — tested at Merthyr in the lower leagues. Direct and countering in nature, exploiting space behind defences with quick transitions. The mid-block OOP means your backline isn't exposed.",
    strengths: ['Explicitly designed for lower leagues too', 'Mid-block is robust with weaker players', 'Direct play suits semi-pro athletes', 'Double pivot provides solid defensive cover'],
    weaknesses: ['Less creative than short-passing systems', 'Needs a reliable striker to hold the ball', 'Wide players need pace for counter-attacks'],
    keyRoles: 'Pacey wide forwards, a hold-up striker, two defensive-minded CMs',
  },
  // ─── JoshDaly Lower League 4231 — explicitly titled "Lower League" ────────
  {
    id: 'joshdaly-lower-league-4231',
    name: "JoshDaly's Lower League 4231 (92% Win Rate)",
    creator: 'JoshDaly',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-tactics.html?id=13350',
    formation: '4-2-3-1',
    oopFormation: '4-4-2',
    mentality: 'Balanced',
    style: ['Lower League', 'Direct', 'Counter-Attack', 'Physical'],
    leagueLevels: ['Non-League', 'Lower League', 'League Two', 'League One'],
    leagueExamples: 'Specifically built for lower leagues — 92% win rate, 4+ goals/game',
    downloads: 0, // cut off in data, listed as last entry
    lowerLeagueFocused: true,
    ipInstructions: {
      'Build-Up Strategy': 'Direct Passing',
      'Passing Directness': 'More Direct',
      'Tempo': 'Higher',
      'Creative Freedom': 'Structured',
      'Progress Through': 'Wide',
      'Crossing Style': 'Early Cross',
      'Overlap': 'Overlap Wide',
      'Shots from Distance': 'Sometimes',
      'Dribbling': 'Sometimes',
      'Patience': 'Impatient',
      'GK Distribution': 'Long',
      'GK Distribution Speed': 'Distribute Quickly',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'Standard',
      'Defensive Line Behaviour': 'Standard',
      'Line of Engagement': 'Mid Block',
      'Trigger Press': 'Standard',
      'Defensive Transition': 'Regroup',
      'Pressing Trap': 'Balanced',
      'Cross Engagement': 'Engage',
      'Short GK Distribution': 'Allow',
    },
    description: "JoshDaly's only explicitly lower-league tactic — achieving 92% win rate and 4+ goals per game. A pragmatic 4-2-3-1 that doesn't demand technical ability. Direct, physical and exploitative of the spaces left by lower-league defences.",
    strengths: ['92% win rate reported', '4+ goals per game', 'Works with limited/semi-pro players', 'Simple system — easy to set up'],
    weaknesses: ['Less effective as you reach Championship+', 'Direct style can be predictable', 'Relies on a physically strong striker'],
    keyRoles: 'Physical CF who can hold up and run, energetic wide players, ball-winning DM pair',
  },
  // ─── Andysafc Underdog Upwards — tested Scarborough & AFC Telford ─────────
  {
    id: 'andysafc-underdog-upwards',
    name: "Andysafc's Underdog Upwards 4-2-1-2-1",
    creator: 'Andysafc',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/a-underdog-upwards-fm26-tactic.html',
    formation: '4-2-1-2-1',
    oopFormation: '4-4-2',
    mentality: 'Balanced',
    style: ['Lower League', 'Structured', 'Counter-Attack', 'Underdog'],
    leagueLevels: ['Non-League', 'Lower League', 'League Two', 'League One'],
    leagueExamples: 'Tested with Scarborough & AFC Telford (lower league)',
    downloads: 3291,
    lowerLeagueFocused: true,
    ipInstructions: {
      'Build-Up Strategy': 'Structured Build-Up',
      'Passing Directness': 'Balanced',
      'Tempo': 'Standard',
      'Creative Freedom': 'Structured',
      'Progress Through': 'Central',
      'Crossing Style': 'Mixed',
      'Overlap': 'No',
      'Shots from Distance': 'Sometimes',
      'Dribbling': 'Sometimes',
      'Patience': 'Balanced',
      'GK Distribution': 'Balanced',
      'GK Distribution Speed': 'Standard',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'Lower',
      'Defensive Line Behaviour': 'Drop Off More',
      'Line of Engagement': 'Low Block',
      'Trigger Press': 'Standard',
      'Defensive Transition': 'Regroup',
      'Pressing Trap': 'Balanced',
      'Cross Engagement': 'Engage',
      'Short GK Distribution': 'Allow',
    },
    description: "Built for relegation battlers and non-league clubs. Tested at Scarborough and AFC Telford — two proper lower-league clubs. The low block OOP means your defence is compact and hard to break down, while counter-attacks provide the threat. Perfect for National League and below.",
    strengths: ['Built for National League and below', 'Low block is very hard to break down', 'Counter-attacks are lethal on the break', 'Works with physical, hard-running players'],
    weaknesses: ['Limited possession — need to stay organised', 'Not designed to dominate the ball', 'Struggles if your strikers lack pace'],
    keyRoles: 'Pacey striker for counter-attacks, disciplined DM pair, a creative AM to link play',
  },
  // ─── GYR ULTIMATE 343 — tested at Dover (lower league) ───────────────────
  {
    id: 'gyr-ultimate-343',
    name: "GYR's ULTIMATE 3-4-3 (All Levels)",
    creator: 'GYRFM',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-tactics.html?id=13290',
    formation: '3-4-3',
    oopFormation: '5-4-1',
    mentality: 'Positive',
    style: ['High Press', 'Wide Overloads', 'Counter-Attack'],
    leagueLevels: ['Non-League', 'Lower League', 'League One', 'Championship', 'Premier League', 'Top Flights'],
    leagueExamples: 'Tested with Napoli, Porto, Leeds & Dover (lower league)',
    downloads: 5446,
    lowerLeagueFocused: false,
    ipInstructions: {
      'Build-Up Strategy': 'Direct Passing',
      'Passing Directness': 'Balanced',
      'Tempo': 'Higher',
      'Creative Freedom': 'Expressive',
      'Progress Through': 'Wide',
      'Crossing Style': 'Mixed',
      'Overlap': 'Overlap Wide',
      'Shots from Distance': 'Sometimes',
      'Dribbling': 'Sometimes',
      'Patience': 'Balanced',
      'GK Distribution': 'Balanced',
      'GK Distribution Speed': 'Standard',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'Standard',
      'Defensive Line Behaviour': 'Standard',
      'Line of Engagement': 'Mid Block',
      'Trigger Press': 'Standard',
      'Defensive Transition': 'Regroup',
      'Pressing Trap': 'Balanced',
      'Cross Engagement': 'Engage',
      'Short GK Distribution': 'Allow',
    },
    description: "A 3-4-3 that morphs into a solid 5-4-1 OOP. GYRFM tested this from Dover in the lower leagues up to Napoli and Porto. The three defenders protect the backline while the wingbacks provide width. Great if you have athletic, versatile players who can fill the WB roles.",
    strengths: ['Tested at Dover — proven lower-league credentials', '5-4-1 OOP is very solid', 'Wide overloads from WBs and wingers', 'Counter-attacks on the break'],
    weaknesses: ['3-4-3 shape needs specific players (WBs, 3 CBs)', 'Vulnerable to pace in wide areas', 'Formation knowledge required to set up correctly'],
    keyRoles: 'Athletic WBs who can attack and defend, three solid CBs, two goal-scoring wide forwards',
  },
  // ─── GYR Black Panther V2: 6,988 downloads ───────────────────────────────
  {
    id: 'gyr-black-panther-v2',
    name: "GYR's Black Panther V2 4-2-3-1 (All Levels)",
    creator: 'GYRFM',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-tactics.html?id=13337',
    formation: '4-2-3-1',
    oopFormation: '4-4-2',
    mentality: 'Positive',
    style: ['Counter-Attack', 'High Press', 'Flexible'],
    leagueLevels: ['Non-League', 'Lower League', 'League One', 'Championship', 'Premier League', 'Top Flights'],
    leagueExamples: 'Tested with Man Utd, Tottenham, Deportivo & PSG — for all levels',
    downloads: 6988,
    lowerLeagueFocused: false,
    ipInstructions: {
      'Build-Up Strategy': 'Balanced',
      'Passing Directness': 'Balanced',
      'Tempo': 'Higher',
      'Creative Freedom': 'Expressive',
      'Progress Through': 'Both Flanks',
      'Crossing Style': 'Mixed',
      'Overlap': 'Overlap Both Flanks',
      'Shots from Distance': 'Sometimes',
      'Dribbling': 'Sometimes',
      'Patience': 'Balanced',
      'GK Distribution': 'Balanced',
      'GK Distribution Speed': 'Standard',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'Standard',
      'Defensive Line Behaviour': 'Standard',
      'Line of Engagement': 'Mid Block',
      'Trigger Press': 'Standard',
      'Defensive Transition': 'Regroup',
      'Pressing Trap': 'Balanced',
      'Cross Engagement': 'Engage',
      'Short GK Distribution': 'Allow',
    },
    description: "The updated V2 of the original Black Panther. More balanced and reliable than V1 — explicitly marketed as working at ALL levels. The mid-block OOP approach makes this safer for lower leagues where defensive mistakes are more costly.",
    strengths: ['For all team levels including lower league', 'More conservative than V1 — fewer goals conceded', 'Balanced approach easy to manage', 'Reliable counter-attacks'],
    weaknesses: ['Less explosive than V1', 'Needs a quality #10', 'Mid-block means less aggressive pressing'],
    keyRoles: 'A reliable #10/AM, pacey wide forwards, a strong double pivot',
  },
  // ─── MurphFM 4231: 7,893 downloads (tested with Morecombe) ───────────────
  {
    id: 'murphfm-4231',
    name: "MurphFM's 4-2-3-1 Tactical System",
    creator: 'MurphFM',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-tactics.html?id=13038',
    formation: '4-2-3-1',
    oopFormation: '4-5-1',
    mentality: 'Positive',
    style: ['Structured', 'Counter-Attack', 'Mid-Press'],
    leagueLevels: ['Lower League', 'League Two', 'League One', 'Championship'],
    leagueExamples: 'Tested with Morecambe, Chelsea & Fiorentina — 90+ goals',
    downloads: 7893,
    lowerLeagueFocused: true,
    ipInstructions: {
      'Build-Up Strategy': 'Structured Build-Up',
      'Passing Directness': 'Balanced',
      'Tempo': 'Standard',
      'Creative Freedom': 'Balanced',
      'Progress Through': 'Both Flanks',
      'Crossing Style': 'Mixed',
      'Overlap': 'Overlap Wide',
      'Shots from Distance': 'Sometimes',
      'Dribbling': 'Sometimes',
      'Patience': 'Balanced',
      'GK Distribution': 'Balanced',
      'GK Distribution Speed': 'Standard',
      'Attacking Transition': 'Balanced',
    },
    oopInstructions: {
      'Defensive Line': 'Standard',
      'Defensive Line Behaviour': 'Standard',
      'Line of Engagement': 'Mid Block',
      'Trigger Press': 'Standard',
      'Defensive Transition': 'Regroup',
      'Pressing Trap': 'Balanced',
      'Cross Engagement': 'Engage',
      'Short GK Distribution': 'Allow',
    },
    description: "MurphFM tested this with Morecambe in the lower leagues all the way to Chelsea and Fiorentina. A structured, sensible 4-2-3-1 that doesn't demand technical excellence. The standard press and mid-block OOP make it reliable for teams who can't run all game.",
    strengths: ['Tested from lower leagues to top flight', 'Structured and easy to understand', 'Doesn\'t demand elite players', '90+ goals in testing'],
    weaknesses: ['Not a dominant tactic — workmanlike', 'Less clinical than high-tempo variants', 'Needs good full-backs to use the overlap'],
    keyRoles: 'Mobile DM pair, a creative AM, hard-working wide players, a goal-scoring forward',
  },
  // ─── Iraola / Any Team Overachiever ───────────────────────────────────────
  {
    id: 'joshdaly-any-team-4231',
    name: "JoshDaly's 4231 — Makes ANY Team Overachieve",
    creator: 'JoshDaly',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-tactics.html?id=13234',
    formation: '4-2-3-1',
    oopFormation: '4-4-2',
    mentality: 'Positive',
    style: ['Balanced', 'Overachiever', 'Mid-Press'],
    leagueLevels: ['Lower League', 'League Two', 'League One', 'Championship', 'Mid-Table', 'Premier League'],
    leagueExamples: 'Marketed as working for any team at any level',
    downloads: 4547,
    lowerLeagueFocused: true,
    ipInstructions: {
      'Build-Up Strategy': 'Structured Build-Up',
      'Passing Directness': 'Balanced',
      'Tempo': 'Standard',
      'Creative Freedom': 'Balanced',
      'Progress Through': 'Both Flanks',
      'Crossing Style': 'Mixed',
      'Overlap': 'Overlap Wide',
      'Shots from Distance': 'Sometimes',
      'Dribbling': 'Sometimes',
      'Patience': 'Balanced',
      'GK Distribution': 'Balanced',
      'GK Distribution Speed': 'Standard',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'Standard',
      'Defensive Line Behaviour': 'Standard',
      'Line of Engagement': 'Mid Block',
      'Trigger Press': 'Standard',
      'Defensive Transition': 'Regroup',
      'Pressing Trap': 'Balanced',
      'Cross Engagement': 'Engage',
      'Short GK Distribution': 'Allow',
    },
    description: "JoshDaly's 'overachiever' tactic — designed to help any team punch above their weight. A sensible, structured 4-2-3-1 with a mid-block that protects lower-quality defenders while the wide play provides the attacking edge.",
    strengths: ['Works at all levels including lower leagues', 'Balanced — not reckless', 'Good for squad-building saves', 'Consistent results across divisions'],
    weaknesses: ['Not the highest-scoring tactic', 'Less explosive than attacking variants', 'Needs decent wide players'],
    keyRoles: 'A consistent striker, reliable DM pair, mobile wide players',
  },
  // ─── GYR INVINCIBLE THANOS 433 ─────────────────────────────────────────────
  {
    id: 'gyr-thanos-433',
    name: "GYR's INVINCIBLE THANOS 4-3-3",
    creator: 'GYRFM',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-tactics.html?id=13267',
    formation: '4-3-3',
    oopFormation: '4-5-1',
    mentality: 'Positive',
    style: ['High Press', 'Counter-Attack', 'Wide Play'],
    leagueLevels: ['Non-League', 'Lower League', 'League One', 'Championship', 'Premier League', 'Top Flights'],
    leagueExamples: 'Tested with Arsenal, Leeds & Notts County (lower league)',
    downloads: 6868,
    lowerLeagueFocused: false,
    ipInstructions: {
      'Build-Up Strategy': 'Balanced',
      'Passing Directness': 'Balanced',
      'Tempo': 'Higher',
      'Creative Freedom': 'Expressive',
      'Progress Through': 'Wide',
      'Crossing Style': 'Mixed',
      'Overlap': 'Overlap Wide',
      'Shots from Distance': 'Sometimes',
      'Dribbling': 'Sometimes',
      'Patience': 'Balanced',
      'GK Distribution': 'Balanced',
      'GK Distribution Speed': 'Standard',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'Standard',
      'Defensive Line Behaviour': 'Standard',
      'Line of Engagement': 'High Press',
      'Trigger Press': 'More Urgent',
      'Defensive Transition': 'Counter-Press',
      'Pressing Trap': 'Trap Wide Areas',
      'Cross Engagement': 'Prevent Cross',
      'Short GK Distribution': 'Prevent',
    },
    description: "Tested at Notts County in the lower leagues through to Arsenal. A balanced 4-3-3 that presses high but doesn't leave the backline exposed. The midfield three does the heavy lifting with the wide forwards providing the end product.",
    strengths: ['Proven at Notts County level', 'High press brings energy and turnovers', 'Wide forwards are lethal', 'Invincible run reported'],
    weaknesses: ['Midfield trio need high stamina', 'Pressing can be costly against quick counters', 'High LOE may suit better squads more'],
    keyRoles: 'Three energetic midfielders, two goal-scoring wingers, a mobile striker',
  },
  // ─── Flick PERFECT 4231 — for teams at any level ─────────────────────────
  {
    id: 'joshdaly-flick-4231-any-level',
    name: "JoshDaly's Flick 4231 (Any Level)",
    creator: 'JoshDaly',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-tactics.html?id=13309',
    formation: '4-2-3-1',
    oopFormation: '4-5-1',
    mentality: 'Positive',
    style: ['Possession', 'Short Passing', 'High Press'],
    leagueLevels: ['Lower League', 'League One', 'Championship', 'Premier League', 'Top Flights'],
    leagueExamples: 'Explicitly "FOR TEAMS AT ANY LEVEL" — tested with Barcelona',
    downloads: 6285,
    lowerLeagueFocused: false,
    ipInstructions: {
      'Build-Up Strategy': 'Short Passing',
      'Passing Directness': 'Shorter',
      'Tempo': 'Higher',
      'Creative Freedom': 'Expressive',
      'Progress Through': 'Both Flanks',
      'Crossing Style': 'Low Cross',
      'Overlap': 'Overlap Wide',
      'Shots from Distance': 'Rarely',
      'Dribbling': 'Sometimes',
      'Patience': 'Work Ball Into Box',
      'GK Distribution': 'Throw/Short',
      'GK Distribution Speed': 'Slower',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'High',
      'Defensive Line Behaviour': 'Aggressive',
      'Line of Engagement': 'High Press',
      'Trigger Press': 'More Urgent',
      'Defensive Transition': 'Counter-Press',
      'Pressing Trap': 'Trap Into Channels',
      'Cross Engagement': 'Prevent Cross',
      'Short GK Distribution': 'Prevent',
    },
    description: "Flick-inspired 4-2-3-1 marketed for any team level. Short passing, high press, works your way up the pyramid. The high OOP line may be challenging for pure lower-league sides but experienced lower-league managers can make it work.",
    strengths: ['Clean possession-based football', 'Works at multiple levels', 'High goals output', '6,000+ downloads validation'],
    weaknesses: ['Short passing harder to execute with lower-quality players', 'High line risky if CBs are slow', 'Needs technical AM'],
    keyRoles: 'Ball-playing CBs, a technical AM, hard-working wide players, a pressing forward',
  },
  // ─── 3-4-2-1 Works For All Teams ──────────────────────────────────────────
  {
    id: 'joshdaly-3421-all-teams',
    name: "JoshDaly's 3-4-2-1 (Works For ALL Teams)",
    creator: 'JoshDaly',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-tactics.html?id=13316',
    formation: '3-4-2-1',
    oopFormation: '5-4-1',
    mentality: 'Positive',
    style: ['Flexible', 'Counter-Attack', 'High Press'],
    leagueLevels: ['Non-League', 'Lower League', 'League Two', 'League One', 'Championship', 'Premier League'],
    leagueExamples: 'Explicitly "Works For ALL TEAMS" — tested with Crystal Palace',
    downloads: 5589,
    lowerLeagueFocused: true,
    ipInstructions: {
      'Build-Up Strategy': 'Balanced',
      'Passing Directness': 'Balanced',
      'Tempo': 'Higher',
      'Creative Freedom': 'Expressive',
      'Progress Through': 'Both Flanks',
      'Crossing Style': 'Mixed',
      'Overlap': 'No',
      'Shots from Distance': 'Sometimes',
      'Dribbling': 'Sometimes',
      'Patience': 'Balanced',
      'GK Distribution': 'Balanced',
      'GK Distribution Speed': 'Standard',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'Standard',
      'Defensive Line Behaviour': 'Standard',
      'Line of Engagement': 'Mid Block',
      'Trigger Press': 'Standard',
      'Defensive Transition': 'Regroup',
      'Pressing Trap': 'Balanced',
      'Cross Engagement': 'Engage',
      'Short GK Distribution': 'Allow',
    },
    description: "A 3-4-2-1 that morphs into a defensively solid 5-4-1 OOP. JoshDaly markets this for ALL teams including lower league. The three-at-the-back gives defensive coverage while the two AMs support a lone striker. Good for managers who want to try a back three.",
    strengths: ['5-4-1 OOP is very hard to break down', 'Works at lower league level', 'Two AMs provide creativity', 'Flexible for different squad types'],
    weaknesses: ['Three CBs is specific requirement', 'Lone striker can be isolated', 'WB roles need athletic players'],
    keyRoles: 'Three solid CBs, athletic WBs, two creative AMs, a capable striker',
  },
  // ─── GYR WOLVERINE 4-2-4 — for all team levels ───────────────────────────
  {
    id: 'gyr-wolverine-424',
    name: "GYR's WOLVERINE 4-2-4 (All Levels)",
    creator: 'GYRFM',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-tactics.html?id=13303',
    formation: '4-2-4',
    oopFormation: '4-4-2',
    mentality: 'Attacking',
    style: ['Wide Overloads', 'Counter-Attack', 'High Tempo', 'Flexible'],
    leagueLevels: ['Non-League', 'Lower League', 'League One', 'Championship', 'Premier League', 'Top Flights'],
    leagueExamples: 'Tested with Newcastle, Coventry & Leverkusen — explicitly "For all team levels"',
    downloads: 4671,
    lowerLeagueFocused: false,
    ipInstructions: {
      'Build-Up Strategy': 'Direct Passing',
      'Passing Directness': 'More Direct',
      'Tempo': 'Higher',
      'Creative Freedom': 'Expressive',
      'Progress Through': 'Wide',
      'Crossing Style': 'Early Cross',
      'Overlap': 'Overlap Both Flanks',
      'Shots from Distance': 'Sometimes',
      'Dribbling': 'Sometimes',
      'Patience': 'Impatient',
      'GK Distribution': 'Long',
      'GK Distribution Speed': 'Distribute Quickly',
      'Attacking Transition': 'Counter',
    },
    oopInstructions: {
      'Defensive Line': 'Standard',
      'Defensive Line Behaviour': 'Standard',
      'Line of Engagement': 'Mid Block',
      'Trigger Press': 'Standard',
      'Defensive Transition': 'Regroup',
      'Pressing Trap': 'Balanced',
      'Cross Engagement': 'Engage',
      'Short GK Distribution': 'Allow',
    },
    description: "A 4-2-4 that floods wide areas with two wingers AND two strikers while the DM pair holds firm. GYRFM says this works for all team levels. The wide overloads are hard for any defence to deal with, and a 4-4-2 OOP keeps things defensively sound.",
    strengths: ['Wide overloads are very hard to stop', 'Two-striker partnership', 'Tested from lower league to Leverkusen', 'DM pair provides solid base'],
    weaknesses: ['4-2-4 shape is very open — defensive risk', 'Needs two pacey wide forwards', 'DMs are overworked covering four attacking players'],
    keyRoles: 'Two pacey wingers, two complementary strikers, two tireless defensive midfielders',
  },
  // ─── Tiki-Taka 4-3-3 ──────────────────────────────────────────────────────
  {
    id: 'tiki-taka-433',
    name: 'Tiki-Taka 4-3-3 (60% Possession)',
    creator: 'JoshDaly',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-tactics.html?id=13227',
    formation: '4-3-3',
    oopFormation: '4-3-3',
    mentality: 'Positive',
    style: ['Possession', 'Short Passing', 'High Press'],
    leagueLevels: ['Premier League', 'Champions League', 'Top Flights'],
    leagueExamples: 'Top clubs with technically gifted squads; 60% possession, 92% pass completion',
    downloads: 5860,
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
      'Patience': 'Very Patient',
      'GK Distribution': 'Throw/Short',
      'GK Distribution Speed': 'Slower',
      'Attacking Transition': 'Balanced',
    },
    oopInstructions: {
      'Defensive Line': 'High',
      'Defensive Line Behaviour': 'Aggressive',
      'Line of Engagement': 'High Press',
      'Trigger Press': 'More Urgent',
      'Defensive Transition': 'Counter-Press',
      'Pressing Trap': 'Trap Into Channels',
      'Cross Engagement': 'Prevent Cross',
      'Short GK Distribution': 'Prevent',
    },
    description: "Classic Pep-style tiki-taka with 60%+ possession and 92%+ pass completion. Requires technically excellent players throughout the squad. Slow, suffocating build-up play that breaks opponents down with patient passing. Not suitable for lower leagues.",
    strengths: ['60%+ possession', '92%+ pass completion', 'Exhausts opponents', 'Beautiful football'],
    weaknesses: ['Requires elite technical players everywhere', 'Slow-build can frustrate vs low blocks', 'NOT suitable for lower leagues'],
    keyRoles: 'Technical CM trio, ball-playing GK and CBs, a false 9 or pressing forward',
  },
]

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface SaveOption { id: string; name: string; currentClub: string | null }

interface MatchResult {
  tacticId: string
  matchScore: number
  reasoning: string
  recommendation: 'Strong Match' | 'Good Match' | 'Possible Match' | 'Poor Match'
}

interface MyTacticAnalysis {
  extraction: Record<string, unknown>
  analysis: {
    overallRating: number
    styleTags: string[]
    suitableFor: string[]
    pressIntensity: string
    defensiveShape: string
    attackingPattern: string
    strengths: string[]
    weaknesses: string[]
    keyPositions: string[]
    improvements: { instruction: string; currentSetting: string; suggestedSetting: string; reason: string }[]
    similarCommunityTactics: string[]
    verdict: string
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDownloads(n: number) {
  if (n === 0) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return n.toString()
}

function matchScoreColor(rec: string) {
  if (rec === 'Strong Match') return 'bg-green-900/40 text-green-300 border border-green-700'
  if (rec === 'Good Match') return 'bg-blue-900/40 text-blue-300 border border-blue-700'
  if (rec === 'Possible Match') return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
  return 'bg-gray-800 text-gray-400 border border-gray-600'
}

function ratingColor(n: number) {
  if (n >= 80) return 'text-green-600 bg-green-50'
  if (n >= 65) return 'text-blue-600 bg-blue-50'
  if (n >= 50) return 'text-yellow-600 bg-yellow-50'
  return 'text-gray-500 bg-gray-100'
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TacticLibraryPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [leagueFilter, setLeagueFilter] = useState('All')
  const [styleFilter, setStyleFilter] = useState('All')
  const [sortBy, setSortBy] = useState<'downloads' | 'name'>('downloads')
  const [saves, setSaves] = useState<SaveOption[]>([])
  const [selectedSave, setSelectedSave] = useState('')
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [isMatching, setIsMatching] = useState(false)
  const [matchError, setMatchError] = useState('')
  const [showMatchPanel, setShowMatchPanel] = useState(false)
  const [showLowerLeagueOnly, setShowLowerLeagueOnly] = useState(false)

  // Upload My Tactic state
  const [uploadImages, setUploadImages] = useState<{ file: File; preview: string; label: string }[]>([])
  const [myTacticResult, setMyTacticResult] = useState<MyTacticAnalysis | null>(null)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [analyseError, setAnalyseError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/saves').then(r => r.json()).then(d => { if (Array.isArray(d)) setSaves(d) }).catch(() => {})
  }, [])

  const leagueLevels = ['All', 'Non-League', 'Lower League', 'League Two', 'League One', 'Championship', 'Mid-Table', 'Premier League', 'Top Flights', 'Champions League']
  const styles = ['All', 'High Press', 'Possession', 'Short Passing', 'Direct', 'Counter-Attack', 'Lower League', 'Wide Play', 'Wide Overloads', 'Balanced', 'Flexible', 'Physical', 'Underdog', 'Goal Machine']

  let filtered = TACTICS.filter(t => {
    const leagueMatch = leagueFilter === 'All' || t.leagueLevels.includes(leagueFilter)
    const styleMatch = styleFilter === 'All' || t.style.includes(styleFilter)
    const lowerMatch = !showLowerLeagueOnly || t.lowerLeagueFocused
    return leagueMatch && styleMatch && lowerMatch
  })

  if (sortBy === 'downloads') {
    filtered = [...filtered].sort((a, b) => b.downloads - a.downloads)
  } else {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  }

  // ── AI Match to Save ─────────────────────────────────────────────────────
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

  // ── Upload My Tactic ─────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const newImages = files.map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
      label: 'tactic_screen',
    }))
    setUploadImages(prev => [...prev, ...newImages].slice(0, 4))
  }

  function removeImage(idx: number) {
    setUploadImages(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleAnalyseMyTactic() {
    if (!uploadImages.length) return
    setIsAnalysing(true)
    setAnalyseError('')
    setMyTacticResult(null)

    try {
      const images = await Promise.all(uploadImages.map(async img => {
        const buf = await img.file.arrayBuffer()
        const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
        return { base64: b64, mimeType: img.file.type || 'image/png', label: img.label }
      }))

      const res = await fetch('/api/ai/analyze-my-tactic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMyTacticResult(data)
    } catch (e: unknown) {
      setAnalyseError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setIsAnalysing(false)
    }
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
            {TACTICS.length} proven community tactics with exact FM26 IP &amp; OOP instructions — sorted by downloads
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

      {/* ── Upload My Tactic Panel ── */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-5 mb-6 border border-gray-700">
        <h2 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
          <Upload size={15} className="text-green-400" />
          Analyse My Own Tactic
        </h2>
        <p className="text-gray-400 text-xs mb-4">
          Upload screenshots of your in-game IP and OOP tactic screens. The AI will read your instructions, rate your setup, and suggest improvements.
        </p>

        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-500 transition-colors mb-3"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={20} className="text-gray-500 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Click to upload tactic screenshots (up to 4)</p>
          <p className="text-xs text-gray-600 mt-0.5">Upload IP screen + OOP screen for best results</p>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
        </div>

        {/* Previews */}
        {uploadImages.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {uploadImages.map((img, i) => (
              <div key={i} className="relative">
                <img src={img.preview} alt="tactic" className="h-16 w-24 object-cover rounded border border-gray-600" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 bg-red-600 rounded-full p-0.5 hover:bg-red-700"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleAnalyseMyTactic}
          disabled={!uploadImages.length || isAnalysing}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalysing ? 'Analysing tactic…' : 'Analyse My Tactic'}
        </button>

        {analyseError && <p className="text-red-400 text-xs mt-2">{analyseError}</p>}

        {/* My Tactic Result */}
        {myTacticResult && (
          <div className="mt-5 space-y-4">
            <div className="border-t border-gray-700 pt-4">
              {/* Rating + verdcit */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`text-3xl font-black rounded-xl px-4 py-2 ${ratingColor(myTacticResult.analysis.overallRating)}`}>
                  {myTacticResult.analysis.overallRating}
                  <div className="text-xs font-normal">/100</div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {myTacticResult.analysis.styleTags?.map(t => (
                      <span key={t} className="text-xs bg-indigo-900/40 text-indigo-300 border border-indigo-700 rounded-full px-2 py-0.5">{t}</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-300">{myTacticResult.analysis.verdict}</p>
                </div>
              </div>

              {/* Extracted instructions */}
              {myTacticResult.extraction && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Detected Formation</h4>
                    <p className="text-white font-mono text-sm">
                      IP: {String(myTacticResult.extraction.formation || '—')} / OOP: {String(myTacticResult.extraction.oopFormation || 'same')}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">Mentality: {String(myTacticResult.extraction.mentality || '—')}</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Suitable For</h4>
                    <div className="flex flex-wrap gap-1">
                      {myTacticResult.analysis.suitableFor?.map(l => (
                        <span key={l} className="text-xs bg-orange-900/40 text-orange-300 border border-orange-700 rounded-full px-2 py-0.5">{l}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Strengths / Weaknesses */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-800 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Strengths</h4>
                  <ul className="space-y-1">
                    {myTacticResult.analysis.strengths?.map(s => (
                      <li key={s} className="text-xs text-gray-300 flex items-start gap-1.5"><span className="text-green-400">✓</span>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Weaknesses</h4>
                  <ul className="space-y-1">
                    {myTacticResult.analysis.weaknesses?.map(w => (
                      <li key={w} className="text-xs text-gray-300 flex items-start gap-1.5"><span className="text-red-400">✗</span>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Improvements */}
              {myTacticResult.analysis.improvements?.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-3 mb-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-indigo-400" /> Suggested Improvements
                  </h4>
                  <div className="space-y-3">
                    {myTacticResult.analysis.improvements.map((imp, i) => (
                      <div key={i} className="border-l-2 border-indigo-600 pl-3">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-white">{imp.instruction}</span>
                          {imp.currentSetting && (
                            <span className="text-xs text-gray-500">
                              {imp.currentSetting} → <span className="text-indigo-300 font-medium">{imp.suggestedSetting}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{imp.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar tactics */}
              {myTacticResult.analysis.similarCommunityTactics?.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Similar Community Tactics</h4>
                  <p className="text-xs text-gray-300">{myTacticResult.analysis.similarCommunityTactics.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── AI Match Panel ── */}
      {showMatchPanel && (
        <div className="bg-gray-900 rounded-xl p-5 mb-6 border border-indigo-700">
          <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Cpu size={15} className="text-indigo-400" />
            AI Tactic Match — Score against your save
          </h2>
          <div className="flex gap-3">
            <select
              value={selectedSave}
              onChange={e => setSelectedSave(e.target.value)}
              className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select a save…</option>
              {saves.map(s => (
                <option key={s.id} value={s.id}>{s.name}{s.currentClub ? ` — ${s.currentClub}` : ''}</option>
              ))}
            </select>
            <button
              onClick={handleMatchToSave}
              disabled={!selectedSave || isMatching}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isMatching ? 'Analysing…' : 'Analyse'}
            </button>
          </div>
          {matchError && <p className="text-red-400 text-xs mt-2">{matchError}</p>}
          {matchResults.length > 0 && (
            <p className="text-green-400 text-xs mt-3 flex items-center gap-1">
              <CheckCircle2 size={13} />
              Match complete — scores shown on each tactic below
            </p>
          )}
        </div>
      )}

      {/* ── Filters + Sort ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
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
        <div className="flex items-center gap-2">
          <ArrowUpDown size={13} className="text-gray-500" />
          <span className="text-xs text-gray-500 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'downloads' | 'name')}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-indigo-400"
          >
            <option value="downloads">Most Downloaded</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
        <button
          onClick={() => setShowLowerLeagueOnly(!showLowerLeagueOnly)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${showLowerLeagueOnly ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400'}`}
        >
          <Star size={11} />
          Lower League Focus
        </button>
        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length} tactic{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Tactic Cards ── */}
      <div className="space-y-3">
        {filtered.map(tactic => {
          const isExpanded = expandedId === tactic.id
          const matchResult = getMatchResult(tactic.id)

          return (
            <div key={tactic.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div
                className="px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : tactic.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-sm">{tactic.name}</h3>
                      <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 font-mono">{tactic.formation}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">OOP: {tactic.oopFormation}</span>
                      <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">{tactic.mentality}</span>
                      {tactic.lowerLeagueFocused && (
                        <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 border border-orange-200 flex items-center gap-1">
                          <Star size={9} /> Lower League
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500">by <span className="font-medium text-gray-700">{tactic.creator}</span></span>
                      <a
                        href={tactic.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5"
                        onClick={e => e.stopPropagation()}
                      >
                        {tactic.source} <ExternalLink size={10} />
                      </a>
                      {tactic.downloads > 0 && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <TrendingUp size={10} className="text-green-500" />
                          <span className="font-medium text-green-600">{formatDownloads(tactic.downloads)}</span> downloads
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{tactic.leagueExamples}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tactic.style.map(s => (
                        <span key={s} className="text-xs bg-green-50 text-green-700 rounded-full px-2 py-0.5 border border-green-200">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    {matchResult && (
                      <div className={`text-xs px-3 py-1.5 rounded-lg font-medium text-center min-w-[72px] ${matchScoreColor(matchResult.recommendation)}`}>
                        <div className="text-[10px]">{matchResult.recommendation}</div>
                        <div className="font-black text-xl leading-tight">{matchResult.matchScore}%</div>
                      </div>
                    )}
                    {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </div>
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-5 bg-gray-50">
                  {matchResult && (
                    <div className={`rounded-lg p-4 mb-5 ${matchScoreColor(matchResult.recommendation)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Cpu size={13} />
                        <span className="text-xs font-semibold uppercase tracking-wide">AI Analysis for your save</span>
                      </div>
                      <p className="text-sm">{matchResult.reasoning}</p>
                    </div>
                  )}

                  <p className="text-sm text-gray-700 mb-5">{tactic.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {tactic.strengths.map(s => (
                          <li key={s} className="text-xs text-gray-700 flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✓</span>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Weaknesses</h4>
                      <ul className="space-y-1">
                        {tactic.weaknesses.map(w => (
                          <li key={w} className="text-xs text-gray-700 flex items-start gap-1.5"><span className="text-red-400 mt-0.5">✗</span>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {tactic.keyRoles && (
                    <div className="bg-indigo-50 rounded-lg px-4 py-3 mb-5 border border-indigo-100">
                      <h4 className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                        <Target size={12} /> Key Roles
                      </h4>
                      <p className="text-xs text-indigo-800">{tactic.keyRoles}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b border-gray-200">In Possession (IP)</h4>
                      <div className="space-y-1.5">
                        {Object.entries(tactic.ipInstructions).map(([k, v]) => (
                          <div key={k} className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">{k}</span>
                            <span className="font-medium text-gray-800 bg-white rounded px-2 py-0.5 border border-gray-200">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b border-gray-200">Out of Possession (OOP)</h4>
                      <div className="space-y-1.5">
                        {Object.entries(tactic.oopInstructions).map(([k, v]) => (
                          <div key={k} className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">{k}</span>
                            <span className="font-medium text-gray-800 bg-white rounded px-2 py-0.5 border border-gray-200">{v}</span>
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

        {filtered.length === 0 && (
          <div className="text-center text-gray-400 py-16">No tactics match these filters. Try broadening your search.</div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-8">
        Download counts sourced from FMScout. IP/OOP instructions curated from community descriptions using exact FM26 instruction names.
      </p>
    </div>
  )
}
