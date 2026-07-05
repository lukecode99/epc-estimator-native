# SAP model calibration

The questionnaire model in `src/sap.js` is calibrated against real EPC
certificates from the GOV.UK open register
(`api.get-energy-performance-data.communities.gov.uk`). This documents the
dataset, method, and accuracy. Calibrated July 2026.

## Dataset

- **1,400 domestic certificates**, fetched July 2026.
- Sampled for stock diversity, not convenience: freetext address searches on
  10 common street names (High Street, Station Road, Church Lane, Main
  Street, Mill Lane, London Road, Park Avenue, Manor Road, Chapel Lane, The
  Green) returned 47,651 unique properties spanning **104 postcode areas** —
  rural villages and older terraces as well as London/suburban stock.
  Deduplicated by UPRN (keeping the latest certificate), then sampled
  round-robin across postcode areas so no region dominates.
- Band mix of the sample: 12 A · 118 B · 570 C · 505 D · 142 E · 43 F · 10 G.
  Recorded SAP scores above 100 (the register contains values up to 111)
  were clamped to 100 to match the app's 1–100 scale.

## Method

1. Each certificate's recorded features (dwelling type, construction age
   band, wall/roof/floor/window descriptions, heating system and controls,
   hot water, PV, lighting counts, draught-proofing %, floor area, storeys)
   were mapped onto the app's questionnaire answers with a deterministic
   rule-based mapper. Boiler age is not recorded on certificates, so it maps
   to the neutral `na` anchor and its offsets remain hand-set.
2. The additive weight tables in `calculateSAP` were tuned by coordinate
   descent (±1…±4 point moves per entry, 12+ passes to convergence) against
   the certificates' recorded energy-efficiency scores. Objective: maximise
   band-±1 accuracy, then exact-band accuracy, then minimise mean absolute
   score error.
3. **Ordering constraints** kept the model explainable: within every table,
   physically better answers can never score worse (e.g. 200mm loft ≥ 100mm
   ≥ partial ≥ none; triple ≥ double ≥ partial ≥ single). Entries with fewer
   than 15 supporting certificates were left untouched.
4. **Overfit check**: tuning repeated on a 933-certificate training split
   and evaluated on the 467 held-out certificates — held-out accuracy
   (97.0% ±1, MAE 6.41) matched training accuracy (96.6% ±1), so the shipped
   weights were tuned on the full 1,400.

## Accuracy (all 1,400 certificates)

| Metric | Before calibration | After |
|---|---|---|
| Correct band ±1 | 81.2% | **96.5%** |
| Exact band | 33.6% | **51.6%** |
| Mean absolute score error | 11.3 pts | **7.1 pts** |
| Mean bias | +4.1 pts | **+0.4 pts** |

Target was correct band ±1 for 80%+.

Per-band (±1): B 92% · C 100% · D 99% · E 99%. The extremes are thinner and
weaker (A 50% of 12, F 70% of 43, G 70% of 10) — the additive model
compresses the tails, and those bands are rare in the register.

## Cost model

`getAnnualCost` unit-rate assumptions are based on the **Jul 2026 Ofgem
price cap** (`PRICE_CAP_BASIS` in `src/sap.js`); every cost figure in the UI
is stamped with its cap period, and saved estimates keep the basis they were
computed under. Loft insulation, glazing and heating controls now adjust the
annual cost alongside walls, draughts and PV.

## Reproducing

The harvest/mapping/tuning scripts run against the register's
`/api/domestic/search` (`address` freetext, `page_size` ≤ 5000,
`current_page`) and `/api/certificate` endpoints with a bearer token. Rate
limit is 6,000 requests per 5 minutes per IP.
