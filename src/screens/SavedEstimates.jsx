import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { loadEstimates, storeEstimates } from '../storage'
import { IconEpcLadder, IconSave, IconChevronRight } from '../icons'

export default function SavedEstimates({ onStartNew, onView }) {
  const [estimates, setEstimates] = useState([])
  // Estimate id awaiting delete confirmation — the ✕ never deletes directly.
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    loadEstimates().then(setEstimates)
  }, [])

  function remove(id) {
    const next = estimates.filter(e => e.id !== id)
    setEstimates(next)
    setConfirmId(null)
    storeEstimates(next)
  }

  return (
    <div className="screen">
      <div className="home-hero">
        <div className="home-hero-row">
          <span className="logo"><IconEpcLadder size={26} /></span>
          <h1>Saved Estimates</h1>
        </div>
        <p className="saved-hero-count">
          {estimates.length === 0
            ? 'Your saved results will appear here'
            : `${estimates.length} estimate${estimates.length !== 1 ? 's' : ''} saved`}
        </p>
      </div>
      <div className="home-body">
        {estimates.length === 0 && (
          <div className="saved-empty">
            <span className="saved-empty-icon"><IconSave size={40} /></span>
            <h3>No saved estimates yet</h3>
            <p>
              Answer 16 quick questions to get your home's EPC band, then tap
              Save on the results — it'll appear here so you can come back to
              it any time.
            </p>
            <button className="btn-primary" onClick={onStartNew}>
              Start your first estimate →
            </button>
          </div>
        )}
        {estimates.map(e => (
          <div
            key={e.id}
            className="saved-card"
            onClick={() => { if (confirmId !== e.id) onView(e) }}
          >
            <div className="saved-band" style={{ background: e.bandColor }}>{e.band}</div>
            {confirmId === e.id ? (
              <div className="saved-confirm-row" onClick={ev => ev.stopPropagation()}>
                <span>Delete “{e.name || 'My Home'}”?</span>
                <button className="btn-del-cancel" onClick={() => setConfirmId(null)}>Cancel</button>
                <button className="btn-del-confirm" onClick={() => remove(e.id)}>Delete</button>
              </div>
            ) : (
              <>
                <div className="saved-info">
                  <div className="saved-score">{e.name || 'My Home'}</div>
                  <div className="saved-date">Band {e.band} · {e.score}/100 · £{e.cost.toLocaleString()}/yr</div>
                  <div className="saved-type">Saved {e.date}</div>
                </div>
                <span className="saved-chevron" aria-hidden="true"><IconChevronRight size={16} /></span>
                <button
                  className="saved-delete"
                  onClick={ev => { ev.stopPropagation(); setConfirmId(e.id) }}
                  aria-label="Delete"
                >✕</button>
              </>
            )}
          </div>
        ))}
        {/* Clearance for the AdMob banner overlaying the bottom on native. */}
        {Capacitor.isNativePlatform() && <div style={{ height: 76 }} />}
      </div>
    </div>
  )
}
