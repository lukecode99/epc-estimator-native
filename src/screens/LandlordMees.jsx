import { useState } from 'react'
import { cheapestRoute, MEES_E_MIN, MEES_C_MIN } from '../sap'

// Landlord MEES section on the Results screen: compliance vs band E (the
// current legal minimum to let) and band C (the proposed ~2030 standard),
// plus the cheapest ordered route to C when the estimate falls short.
export default function LandlordMees({ improvements, score }) {
  const [open, setOpen] = useState(false)

  const meetsE = score >= MEES_E_MIN
  const meetsC = score >= MEES_C_MIN
  const route = meetsC ? null : cheapestRoute(improvements, score, MEES_C_MIN)

  return (
    <div className="mees-section">
      <button className="mees-toggle" onClick={() => setOpen(o => !o)}>
        <span className="mees-toggle-text">
          Renting this property out?
          <span className="mees-toggle-sub">Check it against the MEES letting rules</span>
        </span>
        <span className="mees-toggle-chevron">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="mees-body">
          <div className={`mees-status${meetsE ? ' ok' : ' fail'}`}>
            {meetsE
              ? `✓ Meets band E — the current legal minimum for letting (score ${score}, needs ${MEES_E_MIN}+)`
              : `✗ Below band E — homes under the minimum standard can't legally be let (score ${score}, needs ${MEES_E_MIN}+)`}
          </div>
          <div className={`mees-status${meetsC ? ' ok' : ' warn'}`}>
            {meetsC
              ? `✓ Already meets band C — the standard proposed for rentals around 2030 (score ${score}, needs ${MEES_C_MIN}+)`
              : `! Below band C — the standard proposed for rentals around 2030 (score ${score}, needs ${MEES_C_MIN}+)`}
          </div>

          {route && route.steps.length > 0 && (
            <>
              <p className="section-title" style={{ marginTop: 14, marginBottom: 8 }}>
                Cheapest route to band C
              </p>
              <div className="mees-route">
                {route.steps.map((s, i) => (
                  <div className="mees-step" key={s.title}>
                    <span className="mees-step-num">{i + 1}</span>
                    <span className="mees-step-text">
                      {s.title}
                      <span className="mees-step-sub">Cost: {s.cost}</span>
                    </span>
                    <span className="mees-step-cum">
                      {s.cumScore}/100
                      <span className={`mees-step-band${s.cumScore >= MEES_C_MIN ? ' hit' : ''}`}>
                        Band {s.cumBand}
                      </span>
                      {!meetsE && s.cumScore >= MEES_E_MIN &&
                        (i === 0 || route.steps[i - 1].cumScore < MEES_E_MIN) && (
                        <span className="mees-step-e">meets band E here</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              {route.reached ? (
                <p className="mees-total">
                  Total: £{route.costLow.toLocaleString()}–£{route.costHigh.toLocaleString()} to
                  reach band C ({route.finalScore}/100)
                </p>
              ) : (
                <p className="mees-total mees-short">
                  These improvements get to {route.finalScore}/100 — still short of band C.
                  A DEA assessment may identify further measures.
                </p>
              )}
            </>
          )}
          {route && route.steps.length === 0 && (
            <p className="mees-total mees-short">
              No suitable improvements identified from your answers — a DEA assessment
              may identify measures to reach band C.
            </p>
          )}

          <p className="mees-disclaimer">
            MEES compliance is judged on the official EPC, not this estimate. Exemptions
            (e.g. the £3,500 cost cap) can apply — check the official guidance before
            making letting decisions.
          </p>
        </div>
      )}
    </div>
  )
}
