import { Capacitor, CapacitorHttp } from '@capacitor/core'

// Official EPC register (England & Wales) — GOV.UK "Get energy performance
// of buildings data" API. The bearer token is injected at build time via
// VITE_EPC_API_TOKEN (GitHub Actions secret); without it the register
// features are hidden. The API sends no CORS headers, so native platforms
// go through CapacitorHttp instead of WKWebView fetch.

const BASE = 'https://api.get-energy-performance-data.communities.gov.uk'
const TOKEN = import.meta.env.VITE_EPC_API_TOKEN

export function registerAvailable() {
  return Boolean(TOKEN)
}

async function get(path, params) {
  const headers = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' }
  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.get({ url: `${BASE}${path}`, params, headers })
    const body = typeof res.data === 'string' ? JSON.parse(res.data || '{}') : (res.data || {})
    return { status: res.status, body }
  }
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${BASE}${path}?${qs}`, { headers })
  let body
  try {
    body = await res.json()
  } catch {
    body = {}
  }
  return { status: res.status, body }
}

// 'ha49qj' → 'HA4 9QJ' (the API requires the space)
export function normalisePostcode(raw) {
  const s = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (s.length < 5 || s.length > 7) return null
  return `${s.slice(0, -3)} ${s.slice(-3)}`
}

// → { results: [...] } | { error: 'invalid' | 'unavailable' }
// Results deduped to one (latest) certificate per address.
export async function searchPostcode(rawPostcode) {
  const postcode = normalisePostcode(rawPostcode)
  if (!postcode) return { error: 'invalid' }
  let res
  try {
    // page_size max is 5000 — one page covers any single postcode
    res = await get('/api/domestic/search', { postcode, page_size: '5000' })
  } catch {
    return { error: 'unavailable' }
  }
  if (res.status === 400) return { error: 'invalid' }
  if (res.status !== 200) return { error: 'unavailable' }
  const rows = Array.isArray(res.body.data) ? res.body.data : []
  const byAddress = new Map()
  for (const r of rows) {
    const key = r.uprn || [r.addressLine1, r.addressLine2, r.postcode].join('|')
    const prev = byAddress.get(key)
    if (!prev || String(r.registrationDate) > String(prev.registrationDate)) byAddress.set(key, r)
  }
  const results = [...byAddress.values()]
    .map(r => ({
      certificateNumber: r.certificateNumber,
      address: [r.addressLine1, r.addressLine2, r.addressLine3, r.addressLine4]
        .filter(Boolean).join(', '),
      town: r.postTown,
      postcode: r.postcode,
      band: r.currentEnergyEfficiencyBand,
      registrationDate: r.registrationDate,
    }))
    .sort((a, b) => a.address.localeCompare(b.address, 'en', { numeric: true }))
  return { results }
}

// EPCs are valid for 10 years from registration; the API carries no expiry
// field, so it is derived here.
export function certExpiry(registrationDate) {
  const d = new Date(registrationDate)
  if (Number.isNaN(d.getTime())) return null
  d.setFullYear(d.getFullYear() + 10)
  return d
}

export function isExpired(registrationDate) {
  const exp = certExpiry(registrationDate)
  return exp ? exp.getTime() < Date.now() : false
}

// → { cert: {...} } | { error: 'unavailable' }
export async function getCertificate(certificateNumber) {
  let res
  try {
    res = await get('/api/certificate', { certificate_number: certificateNumber })
  } catch {
    return { error: 'unavailable' }
  }
  if (res.status !== 200 || !res.body.data) return { error: 'unavailable' }
  const d = res.body.data
  return {
    cert: {
      certificateNumber,
      band: d.current_energy_efficiency_band,
      score: d.energy_rating_current,
      potentialBand: d.potential_energy_efficiency_band,
      potentialScore: d.energy_rating_potential,
      registrationDate: d.registration_date,
      floorArea: d.total_floor_area,
      address: [d.address_line_1, d.address_line_2, d.post_town, d.postcode]
        .filter(Boolean).join(', '),
    },
  }
}
