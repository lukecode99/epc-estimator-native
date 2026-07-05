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
