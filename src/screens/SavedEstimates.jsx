import { useState, useEffect } from 'react'
import { loadEstimates, storeEstimates } from '../storage'
import { IconSave } from '../icons'

export default function SavedEstimates({ onBack, onView }) {
  const [estimates, setEstimates] = useState([])

  useEffect(() => {
    loadEstimates().then(setEstimates)
  }, [])

  function remove(id) {
    const next = estimates.filter(e => e.id !== id)
    setEstimates(next)
    storeEstimates(next)
  }

  return (
    <div className="screen">
      <div className="home-hero">
        <div className="logo"><IconSave size={26} /></div>
        <h1>Saved Estimates</h1>
        <p>{estimates.length} estimate{estimates.length !== 1 ? 's' : ''} saved</p>
      </div>
      <div className="home-body">
        {estimates.length === 0 && (
          <p style={{ color: '#9aa5b4', textAlign: 'center', marginTop: 40 }}>
            No saved estimates yet. Complete an assessment and tap "Save estimate".
          </p>
        )}
        {estimates.map(e => (
          <div key={e.id} className="saved-card" onClick={() => onView(e)}>
            <div className="saved-band" style={{ background: e.bandColor }}>{e.band}</div>
            <div className="saved-info">
              <div className="saved-score">{e.name || 'My Home'}</div>
              <div className="saved-date">Band {e.band} · {e.score}/100 · £{e.cost.toLocaleString()}/yr</div>
              <div className="saved-type">{e.date}</div>
            </div>
            <button
              className="saved-delete"
              onClick={ev => { ev.stopPropagation(); remove(e.id) }}
              aria-label="Delete"
            >✕</button>
          </div>
        ))}
        <div style={{ marginTop: 20 }}>
          <button className="btn-outline" onClick={onBack}>← Back</button>
        </div>
      </div>
    </div>
  )
}
