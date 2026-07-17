import { useState } from 'react'
import { BANDS } from '../data'
import { searchPostcode, getCertificate } from '../epcRegister'
import { IconEpcLadder } from '../icons'

const bandColor = band => (BANDS.find(b => b.band === band) || {}).color || '#9aa5b4'

const fmtDate = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

// First step of data capture: look up the property's existing EPC on the
// official register so the estimate can prefill and compare (EPC-14). The
// step is entirely optional — 'not listed' / skip continues into the quiz.
// App only routes here when registerAvailable() is true.
export default function PostcodeStart({ onContinue, onBack }) {
  const [postcode, setPostcode] = useState('')
  const [phase, setPhase] = useState('idle') // idle | searching | list | loadingCert
  const [error, setError] = useState(null)
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)

  async function search() {
    if (!postcode.trim()) return
    setError(null)
    setPhase('searching')
    const res = await searchPostcode(postcode)
    if (res.error === 'invalid') {
      setError("That doesn't look like a valid England or Wales postcode.")
      setPhase('idle')
      return
    }
    if (res.error) {
      setError('The EPC register is unavailable right now — you can skip this step and carry on.')
      setPhase('idle')
      return
    }
    setResults(res.results)
    setSearched(true)
    setPhase('list')
  }

  async function pick(entry) {
    setError(null)
    setPhase('loadingCert')
    const res = await getCertificate(entry.certificateNumber)
    if (res.error) {
      setError('Could not load that certificate — try again, or continue without it.')
      setPhase('list')
      return
    }
    onContinue(res.cert)
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="screen-header-row">
          <span className="logo"><IconEpcLadder size={32} /></span>
          <h1>EPC Estimator</h1>
        </div>
        <p className="step-label">Before we start · Your existing EPC</p>
      </div>
      <div className="screen-body">
        <div className="question-pane slide-fwd">
          <p className="question-text">Does your home already have an EPC?</p>
          <p className="official-intro">
            Enter your postcode to find your property's official certificate
            (England &amp; Wales) — we'll compare it with your new estimate.
            No EPC, or renting elsewhere? Just skip this step.
          </p>

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

          {error && <p className="input-error">{error}</p>}

          {phase === 'list' && results.length === 0 && (
            <p className="official-empty">
              No EPC found for this postcode. Many homes have never had an
              official assessment — carry on and we'll estimate from scratch.
            </p>
          )}

          {(phase === 'list' || phase === 'loadingCert') && results.length > 0 && (
            <div className="address-list">
              {results.map(r => (
                <button
                  key={r.certificateNumber}
                  className="address-row"
                  onClick={() => pick(r)}
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

          <div className="nav-row" style={{ marginTop: 16 }}>
            <button className="btn-back" onClick={onBack}>←</button>
            <button
              className="btn-next"
              onClick={() => onContinue(null)}
              disabled={phase === 'loadingCert'}
            >
              {searched ? "My previous EPC isn't listed →" : 'Skip this step →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
