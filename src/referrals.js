import { kvGet, kvSet } from './storage'

// UK grant schemes matched to improvements by title. BUS = Boiler Upgrade
// Scheme (£7,500 towards a heat pump), ECO4 = Energy Company Obligation
// (income/benefit-qualified households), GBIS = Great British Insulation
// Scheme (insulation measures).
const SCHEMES = [
  { test: /heat pump/i, badges: [{ id: 'BUS', label: 'BUS £7,500 grant' }] },
  { test: /loft insulation/i, badges: [{ id: 'GBIS', label: 'GBIS' }, { id: 'ECO4', label: 'ECO4' }] },
  { test: /cavity wall/i, badges: [{ id: 'GBIS', label: 'GBIS' }, { id: 'ECO4', label: 'ECO4' }] },
  { test: /wall insulation/i, badges: [{ id: 'GBIS', label: 'GBIS' }, { id: 'ECO4', label: 'ECO4' }] },
  { test: /floor insulation/i, badges: [{ id: 'GBIS', label: 'GBIS' }, { id: 'ECO4', label: 'ECO4' }] },
  { test: /replace boiler/i, badges: [{ id: 'ECO4', label: 'ECO4' }] },
]

export function grantsFor(title) {
  const hit = SCHEMES.find(s => s.test.test(title))
  return hit ? hit.badges : []
}

export function improvementSlug(title) {
  return String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Placeholder affiliate/lead-gen URL until the referral programmes are
// approved — the slug keeps the destination swappable per improvement.
export function quoteUrl(title) {
  return `https://www.epcestimator.co.uk/quotes?improvement=${improvementSlug(title)}&utm_source=app&utm_medium=results`
}

// Local link-out log: which improvements users ask for quotes on.
const LINKOUT_KEY = 'epc_linkouts'
const LINKOUT_CAP = 200

function parse(json) {
  try {
    const list = JSON.parse(json || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export async function loadLinkOuts() {
  return parse(await kvGet(LINKOUT_KEY))
}

export async function logLinkOut(title) {
  const list = parse(await kvGet(LINKOUT_KEY))
  list.unshift({ id: improvementSlug(title), title, at: new Date().toISOString() })
  await kvSet(LINKOUT_KEY, JSON.stringify(list.slice(0, LINKOUT_CAP)))
}
