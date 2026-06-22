import { useState } from 'react'
import { QUESTIONS, FLOOR_PRESETS } from '../data'

async function haptic(style = 'LIGHT') {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle[style] })
  } catch {}
}

export default function Questionnaire({ onComplete, onBack, initialAnswers = {} }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(initialAnswers)

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

  function handleNumber() {
    if (!val) return
    haptic()
    advance(answers)
  }

  function goBack() {
    haptic()
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
                      onClick={() => setAnswers({ ...answers, [q.key]: String(p.m2) })}
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
                onChange={e => setAnswers({ ...answers, [q.key]: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleNumber()}
              />
              <span className="number-unit">{q.unit}</span>
            </div>
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
