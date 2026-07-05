import { useState, useRef, Fragment } from 'react'
import { calculateSAP, getBand, getAnnualCost, getImprovements, combinePlan, HEATING_GROUP } from '../sap'
import { BANDS, QUESTIONS } from '../data'
import { loadEstimates, storeEstimates, SAVE_CAP } from '../storage'

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

export default function Results({ answers, savedEntry, onBack, onEdit }) {
  // A viewed saved estimate shows exactly what was stored — score, band,
  // cost and improvements are NOT recomputed (the model may have changed
  // since it was saved). A live/edited result computes fresh.
  const isStored = savedEntry != null && savedEntry.score != null
  const score = isStored ? savedEntry.score : calculateSAP(answers)
  const band = isStored
    ? BANDS.find(b => b.band === savedEntry.band) || getBand(score)
    : getBand(score)
  const cost = isStored ? savedEntry.cost : getAnnualCost(answers)
  const improvements = isStored ? savedEntry.improvements || [] : getImprovements(answers, score)

  const captureRef = useRef(null)

  // Ticked improvement titles → one combined outcome (band/score/cost/saving).
  const [selected, setSelected] = useState([])
  // Stored (pre-EPC-3) improvements have no group field — infer the heating
  // group from the title so the either/or rule still holds on saved views.
  const groupOf = i => i.group || (/boiler|heat pump/i.test(i.title) ? HEATING_GROUP : null)
  const plan = combinePlan(improvements, selected, score)

  function toggleImprovement(imp) {
    haptic()
    const g = groupOf(imp)
    setSelected(sel => {
      if (sel.includes(imp.title)) return sel.filter(t => t !== imp.title)
      // Alternatives (boiler replace vs heat pump): picking one unpicks the other.
      const rest = g
        ? sel.filter(t => !improvements.some(o => o.title === t && groupOf(o) === g))
        : sel
      return [...rest, imp.title]
    })
  }

  const [saveState, setSaveState] = useState('idle') // idle | naming | saved
  const [saveName, setSaveName] = useState(savedEntry?.name || '')
  const [saveError, setSaveError] = useState(null)
  const [shareState, setShareState] = useState('idle') // idle | sharing | done

  async function confirmSave() {
    haptic('MEDIUM')
    const name = saveName.trim() || 'My Home'
    const existing = await loadEstimates()
    const entry = {
      id: savedEntry?.id ?? Date.now(),
      name,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      answers, score, band: band.band, bandColor: band.color, cost, improvements,
    }
    // Re-saving a viewed/edited estimate updates it in place — no duplicate.
    const idx = existing.findIndex(e => e.id === entry.id)
    if (idx < 0 && existing.length >= SAVE_CAP) {
      setSaveError(`You've reached the ${SAVE_CAP} saved estimates limit — delete one from Saved Estimates to make room.`)
      return
    }
    const next = idx >= 0
      ? existing.map((e, i) => (i === idx ? entry : e))
      : [entry, ...existing]
    await storeEstimates(next)
    setSaveError(null)
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
        <h1>{savedEntry?.name || 'Your EPC Estimate'}</h1>
        <p>
          {isStored
            ? `Saved estimate · ${savedEntry.date}`
            : savedEntry?.name
              ? 'Updated estimate — save to keep the changes'
              : 'Based on the information you provided'}
        </p>
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
                <p className="section-title" style={{ marginBottom: 10 }}>Top improvements — tap to build a plan</p>
                {improvements.map((imp, i) => {
                  const checked = selected.includes(imp.title)
                  const prev = improvements[i - 1]
                  const isOrJoined = prev && groupOf(imp) === HEATING_GROUP && groupOf(prev) === HEATING_GROUP
                  return (
                    <Fragment key={imp.title}>
                      {isOrJoined && <div className="or-chip">or — pick one</div>}
                      <div
                        className={`improvement-card${checked ? ' selected' : ''}`}
                        onClick={() => toggleImprovement(imp)}
                      >
                        <div className="imp-title-row">
                          <h4>{imp.title}</h4>
                          <span className={`imp-check${checked ? ' on' : ''}`} aria-hidden="true">{checked ? '✓' : ''}</span>
                        </div>
                        {imp.note && <p className="imp-note">{imp.note}</p>}
                        <div className="improvement-meta">
                          <span>Cost: {imp.cost}</span>
                          <span>Saving: {imp.saving}</span>
                        </div>
                        <span className="improvement-gain">
                          Could reach band {imp.newBand} ({imp.newScore}/100) ↑ +{imp.scoreGain} pts
                        </span>
                      </div>
                    </Fragment>
                  )
                })}
                {plan && (
                  <div className="combined-card">
                    <h4>Combined plan · {plan.count} improvement{plan.count > 1 ? 's' : ''}</h4>
                    <p className="combined-line">
                      Band {band.band} → {plan.newBand} ({plan.newScore}/100)
                    </p>
                    <div className="improvement-meta combined-meta">
                      <span>Total cost: £{plan.costLow.toLocaleString()}–£{plan.costHigh.toLocaleString()}</span>
                      <span>Saving: £{plan.savingLow.toLocaleString()}–£{plan.savingHigh.toLocaleString()}/yr</span>
                    </div>
                  </div>
                )}
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
        {saveError && <p className="input-error">{saveError}</p>}

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
