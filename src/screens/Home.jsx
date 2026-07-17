import { IconEpcLadder, IconBolt, IconChart, IconBulb } from '../icons'

export default function Home({ onStart, onPrivacy }) {
  return (
    <div className="screen">
      <div className="home-hero">
        <div className="home-hero-row">
          <span className="logo"><IconEpcLadder size={32} /></span>
          <h1>EPC Estimator</h1>
        </div>
      </div>
      <div className="home-body">
        <div className="home-features">
          <div className="feature-card">
            <span className="icon"><IconBolt size={24} /></span>
            <div>
              <h3>Instant estimate</h3>
              <p>16 quick questions — takes about 3 minutes</p>
            </div>
          </div>
          <div className="feature-card">
            <span className="icon"><IconChart size={24} /></span>
            <div>
              <h3>A–G band rating</h3>
              <p>SAP-inspired scoring used by UK assessors</p>
            </div>
          </div>
          <div className="feature-card feature-card-combined">
            <div className="feature-combined-row">
              <span className="icon"><IconBulb size={24} /></span>
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
        <p style={{ fontSize: '0.75rem', color: '#9aa5b4', textAlign: 'center', marginTop: 12 }}>
          No personal data collected. Results are estimates only.{' '}
          <button onClick={onPrivacy} className="privacy-link-btn">Privacy Policy</button>
        </p>
      </div>
    </div>
  )
}
