const AD_UNIT_ID = 'ca-app-pub-9879821077971587/7659309807'

let initialised = false
let personalised = false

// EPC-11 (App Review 5.1.2): UMP consent + the ATT prompt must both complete
// before any ad request. `initialised` only flips once the flow below has
// finished, and showBanner() is a no-op until then, so no ad — and no IDFA
// access — can happen pre-consent.
export async function initAdMob() {
  try {
    const { AdMob, AdmobConsentStatus } = await import('@capacitor-community/admob')
    const { Capacitor } = await import('@capacitor/core')

    // Consent is gathered BEFORE AdMob.initialize() — per Google's UMP
    // guidance, initialize can start preloading (and touch the IDFA), so it
    // must wait until the user has answered.
    let consent = await AdMob.requestConsentInfo()

    // ATT is an iOS-only concept; Android personalisation is governed by
    // UMP consent alone.
    let attAuthorised = true
    if (Capacitor.getPlatform() === 'ios') {
      const before = await AdMob.trackingAuthorizationStatus()
      if (before.status === 'notDetermined') {
        await AdMob.requestTrackingAuthorization()
      }
      const after = await AdMob.trackingAuthorizationStatus()
      attAuthorised = after.status === 'authorized'
    }

    if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
      consent = await AdMob.showConsentForm()
    }

    // Personalised ads only with ATT authorisation AND UMP consent settled;
    // anything else serves with npa=1 (non-personalised).
    personalised =
      attAuthorised &&
      (consent.status === AdmobConsentStatus.OBTAINED ||
        consent.status === AdmobConsentStatus.NOT_REQUIRED)

    // UMP can veto ad requests outright (consent required, no form obtained).
    // The status check also covers plugins that predate canRequestAds, where
    // `undefined !== false` would otherwise fail open.
    if (consent.canRequestAds === false || consent.status === AdmobConsentStatus.REQUIRED) {
      return
    }

    await AdMob.initialize({ initializeForTesting: false })
    initialised = true
  } catch {
    // Running on web — AdMob not available
  }
}

export async function showBanner() {
  if (!initialised) return
  try {
    const { AdMob, BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob')
    await AdMob.showBanner({
      adId: AD_UNIT_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      npa: !personalised,
    })
  } catch {}
}

export async function hideBanner() {
  if (!initialised) return
  try {
    const { AdMob } = await import('@capacitor-community/admob')
    await AdMob.hideBanner()
  } catch {}
}
