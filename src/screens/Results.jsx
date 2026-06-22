import { useState, useRef } from 'react'
import { calculateSAP, getBand, getAnnualCost, getImprovements } from '../sap'
import { BANDS, QUESTIONS } from '../data'

const WIDTHS = { A: 55, B: 62, C: 70, D: 78, E: 84, F: 90, G: 96 }

const LABELS = Object.fromEntries(
  QUESTIONS.flatMap(q =>
    q.options ? q.options.map(o => [o.value, o.label]) : []
  )
)

async function haptic(style = 'LIGHT') {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle[style] })
  } catch {}
}

async function shareAsImage(element, fallbackText) {
  try {
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    const file = new File([blob], 'epc-estimate.png', { type: 'image/png' })
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'My EPC Estimate' })
      return
    }
  } catch {}
  try {
    const { Share } = await import('@capacitor/share')
    await Share.share({ text: fallbackText, dialogTitle: 'Share your EPC estimate' })
    return
  } catch {}
  try {
    if (navigator.share) { await navigator.share({ text: fallbackText }); return }
  } catch {}
  try { await navigator.clipboard.writeText(fallbackText) } catch {}
}

export default function Results({ answers, onBack, onEdit }) {
  const score = calculateSAP(answers)
  const band = getBand(score)
  const cost = getAnnualCost(answers)
  const improvements = getImprovements(answers, score)

  const captureRef = useRef(null)

  const [saveState, setSaveState] = useState('idle') // idle | naming | saved
  const [saveName, setSaveName] = useState('')
  const [shareState, setShareState] = useState('idle') // idle | sharing | done

  function confirmSave() {
    haptic('MEDIUM')
    const name = saveName.trim() || 'My Home'
    const existing = JSON.parse(localStorage.getItem('epc_estimates') || '[]')
    const entry = {
      id: Date.now(),
      name,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      answers, score, band: band.band, bandColor: band.color, cost, improvements,
    }
    localStorage.setItem('epc_estimates', JSON.stringify([entry, ...existing].slice(0, 20)))
    setSaveState('saved')
  }

  async function handleShare() {
    haptic('LIGHT')
    setShareState('sharing')
    const fallback = `My home's EPC estimate: Band ${band.band} (${score}/100 — ${band.label}). Estimated annual energy cost: £${cost.toLocaleString()}. Calculated with the EPC Estimator app.`
    await shareAsImage(captureRef.current, fallback)
    setShareState('done')
    setTimeout(() => setShareState('idle'), 2000)
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Your EPC Estimate</h1>
        <p>Based on the information you provided</p>
      </div>
      <div className="results-body">
        <div ref={captureRef} className="capture-zone">
          <div className="band-display" style={{ background: `linear-gradient(135deg, ${band.color}cc, ${band.color})` }}>
            <div className="band-letter">{band.band}</div>
            <div className="band-score">{score} / 100</div>
            <div className="band-label">{band.label}</div>
          </div>

          <div className="summary-card">
            <div className="summary-cost-row">
              <span className="summary-cost-val">£{cost.toLocaleString()}</span>
              <span className="summary-cost-lbl">est. annual energy cost</span>
            </div>
            {improvements.length > 0 && (
              <>
                <div className="summary-divider" />
                <p className="section-title" style={{ marginBottom: 10 }}>Top improvements</p>
                {improvements.map((imp, i) => (
                  <div className="improvement-card" key={i}>
                    <h4>{imp.title}</h4>
                    <div className="improvement-meta">
                      <span>Cost: {imp.cost}</span>
                      <span>Saving: {imp.saving}</span>
                    </div>
                    <span className="improvement-gain">
                      Could reach band {imp.newBand} ({imp.newScore}/100) ↑ +{imp.scoreGain} pts
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <p className="section-title">EPC Scale</p>
        <div className="epc-ladder">
          {BANDS.map(b => (
            <div key={b.band} className={`epc-rung${b.band === band.band ? ' current' : ''}`}>
              <span className="rung-band">{b.band}</span>
              <div className="rung-bar" style={{ background: b.color, width: `${WIDTHS[b.band]}%` }}>
                {b.band === band.band ? `◀ ${score}` : `${b.min}–${b.max}`}
              </div>
            </div>
          ))}
        </div>

        {/* 2×2 action grid */}
        <div className="action-grid">
          <button
            className={`btn-action${saveState === 'saved' ? ' done' : ''}`}
            onClick={() => { if (saveState === 'idle') { haptic(); setSaveState('naming') } }}
            disabled={saveState === 'saved'}
          >
            {saveState === 'saved' ? `✓ ${saveName.trim() || 'Saved'}` : '💾 Save'}
          </button>
          <button className="btn-action" onClick={handleShare} disabled={shareState === 'sharing'}>
            {shareState === 'done' ? '✓ Shared!' : shareState === 'sharing' ? '…' : '↗ Share'}
          </button>
          <button className="btn-action" onClick={() => { haptic(); onEdit() }}>✏️ Edit</button>
          <button className="btn-action btn-action-exit" onClick={() => { haptic(); onBack() }}>Exit</button>
        </div>

        {saveState === 'naming' && (
          <div className="save-name-row">
            <input
              className="save-name-input"
              type="text"
              placeholder="Name this estimate (e.g. My Home)"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmSave()}
              autoFocus
            />
            <button className="btn-save-confirm" onClick={confirmSave}>Save</button>
          </div>
        )}

        <div className="inputs-header-row">
          <p className="section-title" style={{ marginTop: 24, marginBottom: 0 }}>Your inputs</p>
        </div>
        <div className="inputs-summary">
          {QUESTIONS.map(q => {
            const v = answers[q.key]
            if (!v) return null
            return (
              <div className="input-row" key={q.key}>
                <span className="input-label">{q.text.replace('?','')}</span>
                <span className="input-val">{LABELS[v] || `${v} m²`}</span>
              </div>
            )
          })}
        </div>

        <p className="results-disclaimer">
          This is an estimate only — not an official EPC. A qualified Domestic Energy Assessor (DEA) must carry out an official assessment.
        </p>

        <div style={{ height: 72 }} />
      </div>
    </div>
  )
}
