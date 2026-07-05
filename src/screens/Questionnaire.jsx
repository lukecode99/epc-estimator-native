import { useState } from 'react'
import { QUESTIONS, FLOOR_PRESETS } from '../data'
import { FLOOR_AREA_MIN, FLOOR_AREA_MAX } from '../sap'

async function haptic(style = 'LIGHT') {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle[style] })
  } catch {}
}

export default function Questionnaire({ onComplete, onBack, initialAnswers = {} }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(initialAnswers)
  const [numberError, setNumberError] = useState(null)

  const q = QUESTIONS[step]
  const val = answers[q.key]
  const total = QUESTIONS.length
  const pct = (step / total) * 100

  function advance(nextAnswers) {
    if (step + 1 < total) setStep(step + 1)
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
    if (step === 0) onBack()
    else setStep(step - 1)
  }

  const presets = q.key === 'floorArea' ? (FLOOR_PRESETS[answers.propertyType] || []) : []

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>EPC Estimator</h1>
        <p className="step-label">Question {step + 1} of {total}</p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="screen-body">
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
            {numberError && <p className="input-error">{numberError}</p>}
            <div className="nav-row">
              <button className="btn-back" onClick={goBack}>←</button>
              <button className="btn-next" onClick={handleNumber} disabled={!val}>
                {step + 1 === total ? 'See results' : 'Next'}
              </button>
            </div>
          </>
        )}

        {q.type === 'choice' && (
          <div className="nav-row" style={{ marginTop: 16 }}>
            <button className="btn-back" onClick={goBack}>←</button>
            <button className="btn-next" onClick={() => advance(answers)} disabled={!val}>
              {step + 1 === total ? 'See results' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
