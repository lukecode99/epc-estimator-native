import { useState, useEffect, useRef, Fragment } from 'react'
import { calculateSAP, getBand, getAnnualCost, getImprovements, combinePlan, parseRange, HEATING_GROUP, PRICE_CAP_BASIS } from '../sap'
import { BANDS, QUESTIONS } from '../data'
import { loadEstimates, storeEstimates, SAVE_CAP } from '../storage'
import OfficialEpc from './OfficialEpc'
import LandlordMees from './LandlordMees'
import { grantsFor } from '../referrals'
import { IconSave, IconShare, IconEdit, IconChevronRight, IconHouse, ImprovementIcon, IconEpcLadder } from '../icons'
import { Capacitor } from '@capacitor/core'

const WIDTHS = { A: 55, B: 62, C: 70, D: 78, E: 84, F: 90, G: 96 }

const bandColor = letter => (BANDS.find(b => b.band === letter) || {}).color || '#6b7c93'

// £ / ££ / £££ from the midpoint of an improvement's cost range.
function costTier(cost) {
  const [lo, hi] = parseRange(cost)
  const mid = (lo + hi) / 2
  return mid < 1500 ? '£' : mid <= 5000 ? '££' : '£££'
}

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
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      // The branding footer only appears on the shared image, not in-app.
      onclone: doc => {
        const b = doc.querySelector('.share-branding')
        if (b) b.style.display = 'flex'
      },
    })
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

export default function Results({ answers, savedEntry, onBack, onEdit, onEditQuestion, onOpenSaved }) {
  // A viewed saved estimate shows exactly what was stored — score, band,
  // cost and improvements are NOT recomputed (the model may have changed
  // since it was saved). A live/edited result computes fresh.
  const isStored = savedEntry != null && savedEntry.score != null
  const score = isStored ? savedEntry.score : calculateSAP(answers)
  const band = isStored
    ? BANDS.find(b => b.band === savedEntry.band) || getBand(score)
    : getBand(score)
  const cost = isStored ? savedEntry.cost : getAnnualCost(answers)
  // A stored estimate keeps the cap period its cost was computed under;
  // older saves without one fall back to the current basis.
  const capBasis = (isStored && savedEntry.capBasis) || PRICE_CAP_BASIS
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

  // Reveal animation: the marker arrow slides down the ladder to the result
  // band while the score counts up from 0. Replays whenever the score changes.
  const bandIdx = BANDS.findIndex(b => b.band === band.band)
  const [displayScore, setDisplayScore] = useState(0)
  const [markerPlaced, setMarkerPlaced] = useState(false)
  useEffect(() => {
    // One frame at the top of the ladder so the CSS top-transition can run.
    // (Results remounts on every visit, so state starts at 0/unplaced.)
    const raf1 = requestAnimationFrame(() => setMarkerPlaced(true))
    const DURATION = 1200
    let raf, start
    const tick = now => {
      if (start == null) start = now
      const p = Math.min(1, (now - start) / DURATION)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplayScore(Math.round(eased * score))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf) }
  }, [score])

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
      answers, score, band: band.band, bandColor: band.color, cost, capBasis, improvements,
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
        <div className="screen-header-row">
          <span className="logo"><IconEpcLadder size={32} /></span>
          <h1>{savedEntry?.name || 'Your EPC Estimate'}</h1>
        </div>
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
          {/* Certificate-style ladder hero: the marker arrow slides to the
              result band while the score counts up. */}
          <div className="cert-ladder" aria-label={`EPC band ${band.band}, score ${score} out of 100`}>
            {BANDS.map(b => (
              <div key={b.band} className="cert-rung">
                <div className="cert-bar" style={{ background: b.color, width: `${Math.round(WIDTHS[b.band] * 0.66)}%` }}>
                  <span className="cert-range">{b.min}–{b.max}</span>
                  <span className="cert-letter">{b.band}</span>
                </div>
              </div>
            ))}
            <div
              className="cert-marker"
              style={{ top: (markerPlaced ? bandIdx : 0) * 35, background: band.color }}
            >
              <span className="cert-marker-score">{displayScore}</span>
              <span className="cert-marker-band">{band.band}</span>
            </div>
          </div>
          <p className="cert-caption">Band {band.band} — {band.label}</p>

          <div className="summary-card">
            <div className="summary-cost-row">
              <span className="summary-cost-val">£{cost.toLocaleString()}</span>
              <span className="summary-cost-lbl">est. annual energy cost</span>
            </div>
            <p className="summary-cap-note">Based on the {capBasis} energy price cap</p>
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
                          <span className="imp-icon"><ImprovementIcon title={imp.title} size={18} /></span>
                          <h4>{imp.title}</h4>
                          <span className="cost-tier">{costTier(imp.cost)}</span>
                          <span className={`imp-check${checked ? ' on' : ''}`} aria-hidden="true">{checked ? '✓' : ''}</span>
                        </div>
                        {grantsFor(imp.title).length > 0 && (
                          <div className="grant-badges">
                            {grantsFor(imp.title).map(g => (
                              <span key={g.id} className={`grant-badge grant-${g.id.toLowerCase()}`}>{g.label}</span>
                            ))}
                          </div>
                        )}
                        {imp.note && <p className="imp-note">{imp.note}</p>}
                        <div className="improvement-meta">
                          <span>Cost: {imp.cost}</span>
                          <span>Saving: {imp.saving}</span>
                        </div>
                        <div className="imp-actions-row">
                          <span className="improvement-gain">
                            <span className="band-chip" style={{ background: bandColor(band.band) }}>{band.band}</span>
                            <span className="band-chip-arrow">→</span>
                            <span className="band-chip" style={{ background: bandColor(imp.newBand) }}>{imp.newBand}</span>
                            <span className="band-chip-pts">+{imp.scoreGain} pts · {imp.newScore}/100</span>
                          </span>
                        </div>
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

          {/* Hidden in-app; unhidden by shareAsImage's onclone so the shared
              image carries the app branding. */}
          <div className="share-branding" aria-hidden="true">
            <IconHouse size={16} />
            <span><strong>EPC Estimator</strong> — free EPC band check, on the App Store</span>
          </div>
        </div>

        <div className="action-grid">
          <button className="btn-action" onClick={() => { haptic(); onEdit() }}>
            <IconEdit size={16} /> Edit answers
          </button>
          <button className="btn-action btn-action-exit" onClick={() => { haptic(); onBack() }}>Exit</button>
        </div>

        <LandlordMees improvements={improvements} score={score} />

        <OfficialEpc estimateScore={score} estimateBand={band.band} initialCert={answers.officialCert || null} />

        <div className="inputs-header-row">
          <p className="section-title" style={{ marginTop: 24, marginBottom: 0 }}>Your inputs</p>
        </div>
        <div className="inputs-summary">
          {QUESTIONS.map(q => {
            const v = answers[q.key]
            if (!v) return null
            return (
              <button
                className="input-row input-row-btn"
                key={q.key}
                onClick={() => { haptic(); onEditQuestion && onEditQuestion(q.key) }}
              >
                <span className="input-label">{q.text.replace('?','')}</span>
                <span className="input-val">{LABELS[v] || `${v} m²`}</span>
                <span className="input-chevron"><IconChevronRight size={16} /></span>
              </button>
            )
          })}
        </div>

        <p className="results-disclaimer">
          This is an estimate only — not an official EPC. A qualified Domestic Energy Assessor (DEA) must carry out an official assessment.
        </p>

        {/* Clearance for the sticky bar (plus the AdMob banner on native). */}
        <div style={{ height: Capacitor.isNativePlatform() ? 170 : 96 }} />
      </div>

      {/* Sticky Save/Share bar — Share is the growth loop, so it stays on
          screen at all times. Sits above the AdMob banner on native. */}
      <div className={`sticky-actions${Capacitor.isNativePlatform() ? ' above-banner' : ''}`}>
        {saveError && <p className="input-error sticky-error">{saveError}</p>}
        {saveState === 'saved' && (
          <p className="save-confirm-strip">
            ✓ “{saveName.trim() || 'My Home'}” saved
            <button className="btn-open-saved" onClick={onOpenSaved}>Open Saved →</button>
          </p>
        )}
        <div className="sticky-actions-row">
        {saveState === 'naming' ? (
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
        ) : (
          <>
            <button
              className={`btn-sticky${saveState === 'saved' ? ' done' : ''}`}
              onClick={() => { if (saveState === 'idle') { haptic(); setSaveState('naming') } }}
              disabled={saveState === 'saved'}
            >
              {saveState === 'saved' ? '✓ Saved' : <><IconSave size={16} /> Save</>}
            </button>
            <button className="btn-sticky btn-sticky-share" onClick={handleShare} disabled={shareState === 'sharing'}>
              {shareState === 'done' ? '✓ Shared!' : shareState === 'sharing' ? '…' : <><IconShare size={16} /> Share</>}
            </button>
          </>
        )}
        </div>
      </div>
    </div>
  )
}
