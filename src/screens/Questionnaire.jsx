import { useState, useEffect } from 'react'
import { QUESTIONS, SECTIONS, FLOOR_PRESETS } from '../data'
import { IconEpcLadder } from '../icons'
import { FLOOR_AREA_MIN, FLOOR_AREA_MAX } from '../sap'

// Section boundaries as question indices: [{ label, start, len }]
const SECTION_SPANS = SECTIONS.reduce((acc, s) => {
  const start = acc.length ? acc[acc.length - 1].start + acc[acc.length - 1].len : 0
  return [...acc, { label: s.label, start, len: s.keys.length }]
}, [])
const sectionAt = step => SECTION_SPANS.findIndex(s => step >= s.start && step < s.start + s.len)

async function haptic(style = 'LIGHT') {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle[style] })
  } catch {}
}

// `singleKey` puts the questionnaire in edit-one-answer mode: it opens on
// that question only, and answering (or backing out) returns to Results.
// `initialStep` + `onProgress` let App keep live progress, so switching to
// the Saved tab mid-quiz and back resumes at the same question (EPC-10).
export default function Questionnaire({ onComplete, onBack, initialAnswers = {}, singleKey = null, initialStep = 0, onProgress = null }) {
  const single = singleKey ? Math.max(0, QUESTIONS.findIndex(q => q.key === singleKey)) : null
  const [step, setStep] = useState(single ?? Math.min(initialStep, QUESTIONS.length - 1))
  const [answers, setAnswers] = useState(initialAnswers)

  useEffect(() => {
    if (onProgress && single == null) onProgress(answers, step)
  }, [answers, step]) // eslint-disable-line react-hooks/exhaustive-deps
  const [numberError, setNumberError] = useState(null)
  // Slide direction for the transition between questions.
  const [dir, setDir] = useState('fwd')

  const q = QUESTIONS[step]
  const val = answers[q.key]
  const total = QUESTIONS.length
  const section = SECTION_SPANS[sectionAt(step)]

  // EPC-17: when the floor area came from the register cert, say so. Keyed
  // off the same 15–500 m² condition App.jsx uses to prefill — a cert with
  // an out-of-range floor area deliberately doesn't prefill, so no note.
  const cert = answers.officialCert
  const certArea = cert ? Number(cert.floorArea) : NaN
  const certDate = cert && cert.registrationDate ? new Date(cert.registrationDate) : null
  const floorPrefillNote =
    q.key === 'floorArea' &&
    certArea >= FLOOR_AREA_MIN && certArea <= FLOOR_AREA_MAX &&
    certDate && !isNaN(certDate)
      ? `Floor space retrieved from your previous EPC on ${certDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} — adjust this if it has changed`
      : null

  function advance(nextAnswers) {
    if (single != null) onComplete(nextAnswers)
    else if (step + 1 < total) { setDir('fwd'); setStep(step + 1) }
    else onComplete(nextAnswers)
  }

  function handleChoice(v) {
    haptic()
    const next = { ...answers, [q.key]: v }
    setAnswers(next)
    advance(next)
  }

  // Floor area outside 15–500 m² (including '0', which used to slip through
  // and silently become the 85 m² default) is rejected with a message.
  function handleNumber() {
    if (!val) return
    const n = parseFloat(val)
    if (!Number.isFinite(n) || n < FLOOR_AREA_MIN || n > FLOOR_AREA_MAX) {
      setNumberError(
        `That doesn't look right — please enter a floor area between ${FLOOR_AREA_MIN} and ${FLOOR_AREA_MAX} m². Most homes are 50–200 m².`
      )
      return
    }
    setNumberError(null)
    haptic()
    advance(answers)
  }

  function goBack() {
    haptic()
    setNumberError(null)
    if (single != null || step === 0) onBack()
    else { setDir('back'); setStep(step - 1) }
  }

  const presets = q.key === 'floorArea' ? (FLOOR_PRESETS[answers.propertyType] || []) : []

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="screen-header-row">
          <span className="logo"><IconEpcLadder size={32} /></span>
          <h1>EPC Estimator</h1>
        </div>
        <p className="step-label">
          {single != null ? 'Edit your answer' : `${section.label} · Question ${step + 1} of ${total}`}
        </p>
        {single == null && (
          <div className="section-progress">
            {SECTION_SPANS.map(s => {
              const fill = Math.min(1, Math.max(0, (step - s.start) / s.len))
              return (
                <div key={s.label} className={`section-seg${s === section ? ' active' : ''}`}>
                  <div className="section-bar">
                    <div className="progress-fill" style={{ width: `${fill * 100}%` }} />
                  </div>
                  <span className="section-name">{s.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="screen-body">
        {/* key={step} remounts the pane so the slide animation replays. */}
        <div key={step} className={`question-pane slide-${dir}`}>
        <p className="question-text">{q.text}</p>

        {q.type === 'choice' && (
          <div className="choice-list">
            {q.options.map(opt => (
              <button
                key={opt.value}
                className={`choice-btn${val === opt.value ? ' selected' : ''}`}
                onClick={() => handleChoice(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {q.type === 'number' && (
          <>
            {presets.length > 0 && (
              <div className="preset-section">
                <p className="preset-label">Typical sizes — tap to use:</p>
                <div className="preset-chips">
                  {presets.map(p => (
                    <button
                      key={p.m2}
                      className={`preset-chip${String(val) === String(p.m2) ? ' selected' : ''}`}
                      onClick={() => { setNumberError(null); setAnswers({ ...answers, [q.key]: String(p.m2) }) }}
                    >
                      <span className="preset-name">{p.label}</span>
                      <span className="preset-m2">~{p.m2}m²</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="number-input-wrap">
              <input
                className="number-input"
                type="number"
                inputMode="numeric"
                placeholder={q.placeholder}
                value={val || ''}
                onChange={e => { setNumberError(null); setAnswers({ ...answers, [q.key]: e.target.value }) }}
                onKeyDown={e => e.key === 'Enter' && handleNumber()}
              />
              <span className="number-unit">{q.unit}</span>
            </div>
            {floorPrefillNote && <p className="prefill-note">{floorPrefillNote}</p>}
            {numberError && <p className="input-error">{numberError}</p>}
            <div className="nav-row">
              <button className="btn-back" onClick={goBack}>←</button>
              <button className="btn-next" onClick={handleNumber} disabled={!val}>
                {step + 1 === total ? 'See results' : 'Next'}
              </button>
            </div>
          </>
        )}

        {/* Choice questions auto-advance on tap — no Next button, just back. */}
        {q.type === 'choice' && (
          <div className="nav-row" style={{ marginTop: 16 }}>
            <button className="btn-back" onClick={goBack}>←</button>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
