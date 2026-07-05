import { BANDS } from './data';

// Valid floor-area range (m²). Outside this the questionnaire rejects the
// input; the model clamps defensively so a bad stored value can't skew maths.
export const FLOOR_AREA_MIN = 15;
export const FLOOR_AREA_MAX = 500;

export function normalisedArea(v) {
  const n = parseFloat(v);
  if (!Number.isFinite(n) || n <= 0) return 85;
  return Math.min(FLOOR_AREA_MAX, Math.max(FLOOR_AREA_MIN, n));
}

export function calculateSAP(a) {
  let score = 63;

  // Shared-wall heat loss: a flat has the least exposed envelope, a
  // detached house the most. Weights: flat +8 · terraced +4 · semi 0 ·
  // bungalow -3 · detached -5.
  const ptype = { flat: 8, terraced: 4, semi: 0, bungalow: -3, detached: -5 };
  score += ptype[a.propertyType] || 0;

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

  const area = normalisedArea(a.floorArea);
  if (area < 50) score += 4;
  else if (area > 150) score -= 4;
  else if (area > 100) score -= 2;

  return Math.max(1, Math.min(100, Math.round(score)));
}

export function getBand(score) {
  return BANDS.find(b => score >= b.min && score <= b.max) || BANDS[BANDS.length - 1];
}

export function getAnnualCost(a) {
  const area = normalisedArea(a.floorArea);
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

// Pull the low/high numbers out of a display range like '£4,000–£14,000'
// or '£200–£350/yr'. Works on stored (pre-EPC-3) improvements too, which
// only carry the display strings.
export function parseRange(str) {
  const nums = (String(str).match(/[\d,]+/g) || [])
    .map(s => parseInt(s.replace(/,/g, ''), 10))
    .filter(Number.isFinite);
  if (!nums.length) return [0, 0];
  return [nums[0], nums[nums.length - 1]];
}

// Combine a set of ticked improvements into one outcome: a single new
// score/band plus summed cost and saving ranges.
export function combinePlan(improvements, selectedTitles, score) {
  const sel = improvements.filter(i => selectedTitles.includes(i.title));
  if (!sel.length) return null;
  let costLow = 0, costHigh = 0, savingLow = 0, savingHigh = 0, gain = 0;
  for (const i of sel) {
    const [cl, ch] = parseRange(i.cost);
    const [sl, sh] = parseRange(i.saving);
    costLow += cl; costHigh += ch; savingLow += sl; savingHigh += sh;
    gain += i.scoreGain;
  }
  const newScore = Math.min(100, score + gain);
  return {
    count: sel.length,
    newScore,
    newBand: getBand(newScore).band,
    costLow, costHigh, savingLow, savingHigh,
  };
}

// Boiler replacement and a heat pump are alternative heating upgrades —
// doing both makes no sense, so they share a group and the UI treats
// them as either/or.
export const HEATING_GROUP = 'heating';

// MEES (Minimum Energy Efficiency Standard) thresholds for rented homes:
// band E is the current legal minimum to let; band C is the proposed
// standard for around 2030.
export const MEES_E_MIN = BANDS.find(b => b.band === 'E').min;
export const MEES_C_MIN = BANDS.find(b => b.band === 'C').min;

// Greedy cheapest route from `score` to `target`: spend the fewest pounds
// per point first (midpoint of the cost range / score gain), taking at most
// one of the heating alternatives. Steps carry the cumulative score/band so
// the UI can show where each threshold is crossed.
export function cheapestRoute(improvements, score, target) {
  const heatingOf = i => i.group || (/boiler|heat pump/i.test(i.title) ? HEATING_GROUP : null);
  const perPoint = i => {
    const [lo, hi] = parseRange(i.cost);
    return ((lo + hi) / 2) / Math.max(1, i.scoreGain);
  };
  const pool = [...improvements].sort((a, b) => perPoint(a) - perPoint(b));
  const steps = [];
  let cum = score, usedHeating = false, costLow = 0, costHigh = 0;
  for (const i of pool) {
    if (cum >= target) break;
    if (heatingOf(i) === HEATING_GROUP) {
      if (usedHeating) continue;
      usedHeating = true;
    }
    const [cl, ch] = parseRange(i.cost);
    costLow += cl; costHigh += ch;
    cum = Math.min(100, cum + i.scoreGain);
    steps.push({ ...i, cumScore: cum, cumBand: getBand(cum).band });
  }
  return { steps, reached: cum >= target, finalScore: cum, costLow, costHigh };
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
    list.push({ title: 'Replace boiler (A-rated condensing)', cost: '£2,500–£4,000', saving: '£200–£350/yr', scoreGain: 6, group: HEATING_GROUP });

  if (a.heatingType !== 'heatpump')
    list.push({
      title: 'Air source heat pump', cost: '£7,000–£13,000', saving: '£500–£900/yr', scoreGain: 12, group: HEATING_GROUP,
      ...(a.boilerAge === 'under5'
        ? { note: 'Your boiler is nearly new — a heat pump is a long-term option to plan for, not an urgent swap.' }
        : {}),
    });

  if (a.solarPV === 'none')
    list.push({ title: 'Solar PV panels (4kW system)', cost: '£5,000–£8,000', saving: '£300–£600/yr', scoreGain: 14 });

  if (a.hotWater !== 'solar' && a.solarPV === 'none')
    list.push({ title: 'Solar thermal hot water', cost: '£3,000–£5,000', saving: '£100–£200/yr', scoreGain: 4 });

  list.sort((a, b) => b.scoreGain - a.scoreGain);
  const top = list.slice(0, 5);

  // Keep the two heating alternatives adjacent so the UI can join them
  // with an explicit "or" instead of listing them as independent peers.
  const heating = top.filter(i => i.group === HEATING_GROUP);
  if (heating.length === 2) {
    const rest = top.filter(i => i.group !== HEATING_GROUP);
    const at = top.indexOf(heating[0]);
    rest.splice(at, 0, ...heating);
    top.length = 0;
    top.push(...rest);
  }

  return top.map(i => ({ ...i, newScore: Math.min(100, score + i.scoreGain), newBand: getBand(Math.min(100, score + i.scoreGain)).band }));
}
