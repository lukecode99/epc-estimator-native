import { BANDS } from './data';

export function calculateSAP(a) {
  let score = 63;

  const era = { pre1930: -12, '1930_1966': -7, '1967_1982': -4, '1983_1995': -1, '1996_2010': 3, post2010: 10 };
  score += era[a.constructionEra] || 0;

  const wall = { solid_none: -10, solid_ins: 2, cavity_none: -5, cavity_ins: 4, unknown: -3 };
  score += wall[a.wallType] || 0;

  const floor = { insulated: 5, mixed: 2, uninsulated: 0, concrete: 3, unknown: 0 };
  score += floor[a.floorInsulation] || 0;

  const loft = { none: -8, partial: -3, '100mm': 2, '200mm': 5, flat: 0 };
  score += loft[a.loftInsulation] || 0;

  const glaz = { single: -6, partial: -2, double: 3, triple: 6 };
  score += glaz[a.glazing] || 0;

  const draught = { well: 5, partial: 2, draughty: 0, unknown: 1 };
  score += draught[a.draughtProofing] || 0;

  const conservatory = { none: 0, unheated: 2, heated: -4, extension: 0 };
  score += conservatory[a.conservatory] || 0;

  const heat = { gas: 0, oil: -3, heatpump: 12, storage: -5, electric: -8 };
  score += heat[a.heatingType] || 0;

  const boiler = { under5: 5, '5_10': 2, '10_15': -1, over15: -5, na: 0 };
  score += boiler[a.boilerAge] || 0;

  const controls = { full: 7, partial: 3, thermostat_only: 1, none: 0 };
  score += controls[a.heatingControls] || 0;

  const hw = { combi: 0, gas: -1, immersion: -4, solar: 4 };
  score += hw[a.hotWater] || 0;

  const pv = { none: 0, small: 8, medium: 14, large: 20 };
  score += pv[a.solarPV] || 0;

  const lighting = { all_led: 5, mostly_led: 3, mixed: 1, mostly_old: 0 };
  score += lighting[a.lighting] || 0;

  const storeys = { '1': -3, '2': 0, '3plus': 2 };
  score += storeys[a.storeys] || 0;

  const area = parseFloat(a.floorArea) || 85;
  if (area < 50) score += 4;
  else if (area > 150) score -= 4;
  else if (area > 100) score -= 2;

  return Math.max(1, Math.min(100, Math.round(score)));
}

export function getBand(score) {
  return BANDS.find(b => score >= b.min && score <= b.max) || BANDS[BANDS.length - 1];
}

export function getAnnualCost(a) {
  const area = parseFloat(a.floorArea) || 85;
  const baseCost = { gas: 900, oil: 1200, heatpump: 700, storage: 1400, electric: 1800 };
  let cost = baseCost[a.heatingType] || 900;
  cost *= area / 85;
  const insAdj = { solid_none: 1.4, cavity_none: 1.2, solid_ins: 0.95, cavity_ins: 0.85, unknown: 1.15 };
  cost *= insAdj[a.wallType] || 1;
  if (a.draughtProofing === 'draughty') cost *= 1.1;
  if (a.solarPV === 'medium') cost *= 0.85;
  if (a.solarPV === 'large') cost *= 0.75;
  return Math.round(cost / 50) * 50;
}

export function getImprovements(a, score) {
  const list = [];

  if (a.loftInsulation === 'none' || a.loftInsulation === 'partial')
    list.push({ title: 'Loft insulation (200mm+)', cost: '£300–£600', saving: '£200–£350/yr', scoreGain: a.loftInsulation === 'none' ? 13 : 8 });

  if (a.wallType === 'solid_none')
    list.push({ title: 'External / internal wall insulation', cost: '£4,000–£14,000', saving: '£400–£600/yr', scoreGain: 12 });

  if (a.wallType === 'cavity_none')
    list.push({ title: 'Cavity wall insulation', cost: '£500–£1,500', saving: '£200–£300/yr', scoreGain: 9 });

  if (a.glazing === 'single' || a.glazing === 'partial')
    list.push({ title: 'Double glazing throughout', cost: '£3,000–£8,000', saving: '£150–£200/yr', scoreGain: a.glazing === 'single' ? 9 : 5 });

  if (a.floorInsulation === 'uninsulated' || a.floorInsulation === 'mixed')
    list.push({ title: 'Floor insulation', cost: '£500–£2,500', saving: '£60–£100/yr', scoreGain: a.floorInsulation === 'mixed' ? 3 : 5 });

  if (a.draughtProofing === 'draughty')
    list.push({ title: 'Draught-proofing', cost: '£100–£300', saving: '£60–£120/yr', scoreGain: 5 });

  if (a.heatingControls === 'none' || a.heatingControls === 'thermostat_only')
    list.push({ title: 'Full heating controls (thermostat + programmer + TRVs)', cost: '£300–£600', saving: '£75–£150/yr', scoreGain: a.heatingControls === 'none' ? 7 : 4 });

  if (a.lighting === 'mostly_old' || a.lighting === 'mixed')
    list.push({ title: 'LED lighting throughout', cost: '£50–£200', saving: '£40–£80/yr', scoreGain: a.lighting === 'mostly_old' ? 5 : 2 });

  if (a.heatingType === 'gas' && (a.boilerAge === 'over15' || a.boilerAge === '10_15'))
    list.push({ title: 'Replace boiler (A-rated condensing)', cost: '£2,500–£4,000', saving: '£200–£350/yr', scoreGain: 6 });

  if (a.heatingType !== 'heatpump')
    list.push({ title: 'Air source heat pump', cost: '£7,000–£13,000', saving: '£500–£900/yr', scoreGain: 12 });

  if (a.solarPV === 'none')
    list.push({ title: 'Solar PV panels (4kW system)', cost: '£5,000–£8,000', saving: '£300–£600/yr', scoreGain: 14 });

  if (a.hotWater !== 'solar' && a.solarPV === 'none')
    list.push({ title: 'Solar thermal hot water', cost: '£3,000–£5,000', saving: '£100–£200/yr', scoreGain: 4 });

  list.sort((a, b) => b.scoreGain - a.scoreGain);
  return list.slice(0, 5).map(i => ({ ...i, newScore: Math.min(100, score + i.scoreGain), newBand: getBand(Math.min(100, score + i.scoreGain)).band }));
}
