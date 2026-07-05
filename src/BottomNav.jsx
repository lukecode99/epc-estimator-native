import { IconBolt, IconSave } from './icons'

// Persistent two-tab bar (EPC-10) rendered by App under every screen. On
// native it sits above the AdMob banner whenever one is showing, mirroring
// the .sticky-actions.above-banner pattern on Results.
export default function BottomNav({ active, aboveBanner, onNewTab, onSavedTab }) {
  return (
    <nav className={`bottom-nav${aboveBanner ? ' above-banner' : ''}`}>
      <button
        className={`nav-tab${active === 'new' ? ' active' : ''}`}
        onClick={onNewTab}
        aria-label="New estimate"
      >
        <IconBolt size={20} />
        <span>New estimate</span>
      </button>
      <button
        className={`nav-tab${active === 'saved' ? ' active' : ''}`}
        onClick={onSavedTab}
        aria-label="Saved estimates"
      >
        <IconSave size={20} />
        <span>Saved</span>
      </button>
    </nav>
  )
}
