'use client'

import { useState } from 'react'
import { ExternalLink, ArrowUpDown, ChevronDown, ChevronUp, Target, Download, Star } from 'lucide-react'

// ─── FM26 Set Piece Data ──────────────────────────────────────────────────────

interface SetPieceRoutine {
  id: string
  name: string
  creator: string
  source: string
  sourceUrl: string
  types: string[]
  downloads: number
  addedDate: string
  description: string
  highlights: string[]
  cornerGoals?: string
  notes?: string
  cornerFocus: boolean
}

const ROUTINES: SetPieceRoutine[] = [
  {
    id: 'knap-fm26-set-pieces',
    name: 'Knap FM26 Set Piece Routines',
    creator: 'Knap',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/a-knap-fm26-set-piece-routines.html',
    types: ['Corners', 'Free Kicks', 'Throw-ins'],
    downloads: 51389,
    addedDate: 'Oct 28, 2025',
    description: 'Two complete set piece files from the legendary Knap. AZURE26 has heavily modified corners used for testing, MC40 is the more standard version. Lists need sorting per your squad.',
    highlights: [
      'Two files: AZURE26 (corner-testing variant) + MC40 (standard)',
      '19–20 corner goals scored in testing',
      'Compatible with all Knap tactics',
      'Lists may need sorting per squad setup',
    ],
    cornerGoals: '19–20 corner goals in testing',
    notes: 'Load with "Load ALL routines". Sort player lists to match your squad.',
    cornerFocus: true,
  },
  {
    id: 'hare-masterclass',
    name: 'The Hare FM26 Set Piece Masterclass',
    creator: 'TheHare',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/a-the-hare-fm26-set-piece-masterclass.html',
    types: ['Corners', 'Free Kicks', 'Long Throws'],
    downloads: 16917,
    addedDate: 'Oct 26, 2025',
    description: 'Goals a plenty with still room for improvement. Strong near post corner routines alongside free kick coverage for all zones. Includes tips on sweet spot targeting and priority adjustments.',
    highlights: [
      'Near post corner routines with sweet-spot targeting',
      'Free kick coverage: deep, shooting range, wide',
      'Long throw-in instructions for attacking third only',
      'Tips on adjusting priorities if AI scores from far post',
    ],
    notes: 'Load with "Load ALL routines". Set up long throw takers. Use attacking third long throws only.',
    cornerFocus: true,
  },
  {
    id: 'parisian-jan31',
    name: "Parisian's FM26 Set Pieces (Jan 31 update)",
    creator: 'Parisian',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-set-pieces.html',
    types: ['Corners', 'Free Kicks', 'Short Corners'],
    downloads: 14927,
    addedDate: 'Jan 31, 2026',
    description: 'Full set piece routines including short corners. Tested extensively with top clubs. Combined near-post + corner routine produces excellent results.',
    highlights: [
      '13 direct corner goals in league',
      '18 combined corner + near-post goals',
      'Short corner variants included',
      'Full attacking and defending routines',
    ],
    cornerGoals: '13 direct + 18 combined (near-post) corner goals',
    notes: 'Includes short corner option — toggle based on opponent.',
    cornerFocus: true,
  },
  {
    id: 'parisian-apr4',
    name: "Parisian's FM26 Set Pieces (Apr 4 update)",
    creator: 'Parisian',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-set-pieces.html',
    types: ['Corners', 'Free Kicks'],
    downloads: 14919,
    addedDate: 'Apr 4, 2026',
    description: 'Latest update adding new free kick routines on top of the proven corner setup. Tested with Man City. 37 total set play goals across the season.',
    highlights: [
      '37 total set play goals in a season',
      '17 corner goals with Man City',
      'New free kick routines added',
      'All standard routines included',
    ],
    cornerGoals: '17 corner goals with Man City',
    notes: 'Latest Parisian version — use this over Jan 31 if you want free kick coverage too.',
    cornerFocus: true,
  },
  {
    id: 'set-pieces-dec27',
    name: 'SET PIECES (Dec 27)',
    creator: 'Community',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-set-pieces.html',
    types: ['Corners', 'Free Kicks', 'Throw-ins'],
    downloads: 6359,
    addedDate: 'Dec 27, 2025',
    description: 'Complete set piece package. Load all routines for full coverage.',
    highlights: [
      'Complete corner + free kick + throw-in coverage',
      'Load ALL routines for full effect',
    ],
    notes: 'Load with "Load ALL routines".',
    cornerFocus: true,
  },
  {
    id: 'parisian-dec26',
    name: "Parisian's Set Pieces — Free Kick Update (Dec 26)",
    creator: 'Parisian',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-set-pieces.html',
    types: ['Corners', 'Free Kicks'],
    downloads: 5740,
    addedDate: 'Dec 26, 2025',
    description: 'Complete routines tested with various clubs. Combines Parisian\'s corner base with updated free kick coverage.',
    highlights: [
      'Tested across multiple clubs',
      'Combines corners + free kicks',
      'Early iteration of the Jan/Apr updates',
    ],
    cornerFocus: true,
  },
  {
    id: 'parisian-corner-jan27',
    name: "Parisian's Corner Attacking Routine (Jan 27)",
    creator: 'Parisian',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-set-pieces.html',
    types: ['Corners'],
    downloads: 5243,
    addedDate: 'Jan 27, 2026',
    description: 'Corner-only routine with 1 recovery defender. Ideal if you only want to replace corners without touching other set pieces.',
    highlights: [
      'Corners only — easy to drop into any existing setup',
      '1 recovery defender included',
      'Minimal disruption to existing routines',
    ],
    notes: 'Corner-only file. Use "Load routine" (not "Load ALL") to avoid overwriting your other set pieces.',
    cornerFocus: true,
  },
  {
    id: 'parisian-short-corner-mar10',
    name: "Parisian's Short Corner Routine (Mar 10)",
    creator: 'Parisian',
    source: 'FMScout',
    sourceUrl: 'https://www.fmscout.com/c-fm26-set-pieces.html',
    types: ['Short Corners'],
    downloads: 3047,
    addedDate: 'Mar 10, 2026',
    description: 'Dedicated short corner routine. Use alongside standard corner routines as an alternative option to keep the opposition guessing.',
    highlights: [
      'Dedicated short corner set up',
      'Pairs with any standard corner routine',
      'Useful when opponent zones the near/far post heavily',
    ],
    notes: 'Add as a second corner option. Toggle priority depending on opponent defensive shape.',
    cornerFocus: true,
  },
]

type SortField = 'downloads' | 'date' | 'name'

function formatDownloads(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

function typeTag(t: string) {
  if (t === 'Corners') return 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
  if (t === 'Short Corners') return 'bg-teal-900/40 text-teal-300 border border-teal-700/50'
  if (t === 'Free Kicks') return 'bg-blue-900/40 text-blue-300 border border-blue-700/50'
  if (t === 'Long Throws') return 'bg-amber-900/40 text-amber-300 border border-amber-700/50'
  return 'bg-zinc-800 text-zinc-400 border border-zinc-700'
}

export default function SetPiecesPage() {
  const [sort, setSort] = useState<SortField>('downloads')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('All')

  const typeOptions = ['All', 'Corners', 'Short Corners', 'Free Kicks', 'Long Throws']

  function toggleSort(field: SortField) {
    if (sort === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSort(field); setSortDir('desc') }
  }

  const filtered = ROUTINES.filter(r =>
    filterType === 'All' ? true : r.types.includes(filterType)
  )

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    if (sort === 'downloads') cmp = a.downloads - b.downloads
    else if (sort === 'name') cmp = a.name.localeCompare(b.name)
    else if (sort === 'date') {
      cmp = new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime()
    }
    return sortDir === 'desc' ? -cmp : cmp
  })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Set Pieces Library</h1>
          <p className="text-sm mt-1" style={{ color: '#888888' }}>
            FM26 corner &amp; set piece routines sourced from FMScout — sorted by downloads
          </p>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
          <Target size={12} />
          <span>{ROUTINES.length} routines</span>
        </div>
      </div>

      {/* Controls */}
      <div
        className="rounded-xl p-4 flex flex-wrap items-center gap-3"
        style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Type filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {typeOptions.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={filterType === t
                ? { background: '#ffffff', color: '#080808' }
                : { background: 'rgba(255,255,255,0.05)', color: '#888888', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Sort buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#555555' }}>Sort:</span>
          {(['downloads', 'date', 'name'] as SortField[]).map(f => (
            <button
              key={f}
              onClick={() => toggleSort(f)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={sort === f
                ? { background: '#ffffff', color: '#080808' }
                : { background: 'rgba(255,255,255,0.05)', color: '#888888', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {f === 'downloads' ? <Download size={11} /> : sort === f ? <ArrowUpDown size={11} /> : null}
              <span className="capitalize">{f}</span>
              {sort === f && (
                sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Routines list */}
      <div className="space-y-3">
        {sorted.map((routine, idx) => {
          const isOpen = expanded === routine.id
          const isTop = idx === 0 && sort === 'downloads' && sortDir === 'desc'
          return (
            <div
              key={routine.id}
              className="rounded-xl overflow-hidden transition-all"
              style={{ border: isTop ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)' }}
            >
              {/* Card header */}
              <button
                className="w-full text-left"
                onClick={() => setExpanded(isOpen ? null : routine.id)}
              >
                <div
                  className="px-5 py-4 flex items-start gap-4"
                  style={{ background: isTop ? '#141414' : '#101010' }}
                >
                  {/* Rank badge */}
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5"
                    style={isTop
                      ? { background: 'rgba(255,255,255,0.12)', color: '#ffffff' }
                      : { background: 'rgba(255,255,255,0.05)', color: '#555555' }
                    }
                  >
                    {idx + 1}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-semibold text-white text-sm">{routine.name}</span>
                      {isTop && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                          style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
                          <Star size={9} fill="currentColor" /> Most Downloaded
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs" style={{ color: '#666666' }}>by {routine.creator}</span>
                      <span className="text-xs" style={{ color: '#444444' }}>·</span>
                      <span className="text-xs" style={{ color: '#666666' }}>{routine.addedDate}</span>
                      {routine.types.map(t => (
                        <span key={t} className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${typeTag(t)}`}>{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* Downloads + toggle */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Download size={11} style={{ color: '#555555' }} />
                        <span className="text-sm font-semibold text-white">{formatDownloads(routine.downloads)}</span>
                      </div>
                      <span className="text-[10px]" style={{ color: '#444444' }}>downloads</span>
                    </div>
                    <div style={{ color: '#444444' }}>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{ background: '#0c0c0c', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="px-5 py-4 space-y-4">
                    {/* Description */}
                    <p className="text-sm leading-relaxed" style={{ color: '#aaaaaa' }}>
                      {routine.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Highlights */}
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#555555' }}>
                          Highlights
                        </p>
                        <ul className="space-y-1.5">
                          {routine.highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#cccccc' }}>
                              <span className="mt-1 w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#444444' }} />
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Stats + Notes */}
                      <div className="space-y-3">
                        {routine.cornerGoals && (
                          <div
                            className="rounded-xl p-3"
                            style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#34d39980' }}>
                              Corner Goals
                            </p>
                            <p className="text-sm font-semibold" style={{ color: '#34d399' }}>
                              {routine.cornerGoals}
                            </p>
                          </div>
                        )}

                        {routine.notes && (
                          <div
                            className="rounded-xl p-3"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#555555' }}>
                              Usage Notes
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: '#888888' }}>
                              {routine.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer: FMScout link */}
                    <div className="flex items-center justify-between pt-2"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-[11px]" style={{ color: '#444444' }}>
                        Source: {routine.source}
                      </span>
                      <a
                        href={routine.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
                        style={{ color: '#888888' }}
                      >
                        View on FMScout
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer tip */}
      <div
        className="rounded-xl px-4 py-3 text-xs"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: '#555555' }}
      >
        <strong className="text-zinc-400">Tip:</strong> In FM26, go to Set Pieces → Load Routine (or Load ALL Routines for full packages). Always re-assign your set piece takers after loading.
      </div>
    </div>
  )
}
