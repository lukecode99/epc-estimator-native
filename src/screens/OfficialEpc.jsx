import { useState } from 'react'
import { BANDS } from '../data'
import {
  registerAvailable, searchPostcode, getCertificate, certExpiry, isExpired,
} from '../epcRegister'

const bandColor = band => (BANDS.find(b => b.band === band) || {}).color || '#9aa5b4'

const fmtDate = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

// "Compare with the official register" section on the Results screen:
// postcode → address list → official cert vs our estimate. When the cert
// was already picked on the pre-quiz register step (EPC-14) it arrives as
// `initialCert` and the comparison renders directly — no second lookup UI.
export default function OfficialEpc({ estimateScore, estimateBand, initialCert = null }) {
  const [postcode, setPostcode] = useState('')
  const [phase, setPhase] = useState(initialCert ? 'cert' : 'idle') // idle | searching | list | loadingCert | cert
  const [error, setError] = useState(null)
  const [results, setResults] = useState([])
  const [cert, setCert] = useState(initialCert)

  if (!registerAvailable()) return null

  async function search() {
    if (!postcode.trim()) return
    setError(null)
    setCert(null)
    setPhase('searching')
    const res = await searchPostcode(postcode)
    if (res.error === 'invalid') {
      setError("That doesn't look like a valid England or Wales postcode.")
      setPhase('idle')
      return
    }
    if (res.error) {
      setError('The EPC register is unavailable right now — try again in a minute.')
      setPhase('idle')
      return
    }
    setResults(res.results)
    setPhase('list')
  }

  async function openCert(entry) {
    setError(null)
    setPhase('loadingCert')
    const res = await getCertificate(entry.certificateNumber)
    if (res.error) {
      setError('Could not load that certificate — try again in a minute.')
      setPhase('list')
      return
    }
    setCert(res.cert)
    setPhase('cert')
  }

  const expired = cert && isExpired(cert.registrationDate)
  const expiry = cert && certExpiry(cert.registrationDate)

  return (
    <div className="official-section">
      <p className="section-title">Official EPC register</p>
      {phase !== 'cert' && (
        <p className="official-intro">
          Homes in England &amp; Wales with a past assessment have an official EPC.
          Look yours up and compare it with this estimate.
        </p>
      )}

      {phase !== 'cert' && (
      <div className="postcode-row">
        <input
          className="postcode-input"
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          placeholder="Postcode e.g. SW1A 1AA"
          value={postcode}
          onChange={e => { setError(null); setPostcode(e.target.value) }}
          onKeyDown={e => e.key === 'Enter' && search()}
        />
        <button
          className="btn-postcode"
          onClick={search}
          disabled={!postcode.trim() || phase === 'searching' || phase === 'loadingCert'}
        >
          {phase === 'searching' ? '…' : 'Search'}
        </button>
      </div>
      )}

      {error && <p className="input-error">{error}</p>}

      {phase === 'list' && results.length === 0 && (
        <p className="official-empty">
          No EPC found for this postcode. Many homes have never had an official
          assessment — your estimate is still a good guide.
        </p>
      )}

      {(phase === 'list' || phase === 'loadingCert') && results.length > 0 && (
        <div className="address-list">
          {results.map(r => (
            <button
              key={r.certificateNumber}
              className="address-row"
              onClick={() => openCert(r)}
              disabled={phase === 'loadingCert'}
            >
              <span className="address-band" style={{ background: bandColor(r.band) }}>{r.band}</span>
              <span className="address-text">
                {r.address}
                <span className="address-sub">{r.town} · registered {fmtDate(r.registrationDate)}</span>
              </span>
              <span className="address-go">›</span>
            </button>
          ))}
        </div>
      )}

      {phase === 'cert' && cert && (
        <div className="official-cert">
          <p className="official-address">{cert.address}</p>
          {expired && (
            <p className="expired-flag">
              ⚠ This EPC expired on {fmtDate(expiry)} — a new assessment is needed for
              sale or rental.
            </p>
          )}
          <div className="compare-grid">
            <div className="compare-col">
              <span className="compare-lbl">Your estimate</span>
              <span className="compare-band" style={{ background: bandColor(estimateBand) }}>{estimateBand}</span>
              <span className="compare-score">{estimateScore}/100</span>
            </div>
            <div className="compare-col">
              <span className="compare-lbl">Official EPC{expired ? ' (expired)' : ''}</span>
              <span className="compare-band" style={{ background: bandColor(cert.band) }}>{cert.band}</span>
              <span className="compare-score">{cert.score}/100</span>
            </div>
          </div>
          <div className="official-facts">
            <div className="input-row">
              <span className="input-label">Registered</span>
              <span className="input-val">{fmtDate(cert.registrationDate)}</span>
            </div>
            <div className="input-row">
              <span className="input-label">{expired ? 'Expired' : 'Valid until'}</span>
              <span className="input-val">{expiry ? fmtDate(expiry) : '—'}</span>
            </div>
            {cert.floorArea != null && (
              <div className="input-row">
                <span className="input-label">Floor area (official)</span>
                <span className="input-val">{cert.floorArea} m²</span>
              </div>
            )}
            {cert.potentialBand && (
              <div className="input-row">
                <span className="input-label">Official potential</span>
                <span className="input-val">Band {cert.potentialBand} ({cert.potentialScore}/100)</span>
              </div>
            )}
          </div>
          <button
            className="btn-outline btn-change-address"
            onClick={() => { setCert(null); setPhase(results.length ? 'list' : 'idle') }}
          >
            {results.length ? '← Choose a different address' : 'Look up a different address'}
          </button>
        </div>
      )}
    </div>
  )
}
