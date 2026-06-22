import { useState } from 'react'

export default function Home({ onStart, onSaved, onPrivacy }) {
  const [count] = useState(() => {
    return JSON.parse(localStorage.getItem('epc_estimates') || '[]').length
  })

  return (
    <div className="screen">
      <div className="home-hero">
        <div className="home-hero-row">
          <span className="logo">🏠</span>
          <h1>EPC Estimator</h1>
        </div>
      </div>
      <div className="home-body">
        <div className="home-features">
          <div className="feature-card">
            <span className="icon">⚡</span>
            <div>
              <h3>Instant estimate</h3>
              <p>16 quick questions — takes about 3 minutes</p>
            </div>
          </div>
          <div className="feature-card">
            <span className="icon">📊</span>
            <div>
              <h3>A–G band rating</h3>
              <p>SAP-inspired scoring used by UK assessors</p>
            </div>
          </div>
          <div className="feature-card feature-card-combined">
            <div className="feature-combined-row">
              <span className="icon">💡</span>
              <div>
                <h3>Personalised improvements & cost estimates</h3>
                <p>See what upgrades boost your rating most, with typical costs and savings</p>
              </div>
            </div>
          </div>
        </div>
        <button className="btn-primary" onClick={onStart}>
          Start free estimate →
        </button>
        {count > 0 && (
          <button className="btn-outline" onClick={onSaved}>
            💾 View saved estimates ({count})
          </button>
        )}
        <p style={{ fontSize: '0.75rem', color: '#9aa5b4', textAlign: 'center', marginTop: 12 }}>
          No personal data collected. Results are estimates only.{' '}
          <button onClick={onPrivacy} className="privacy-link-btn">Privacy Policy</button>
        </p>
        <div className="ad-slot">
          <span className="ad-label">Ad</span>
          <p className="ad-text">Your advert here — reach energy-conscious homeowners</p>
        </div>
      </div>
    </div>
  )
}
