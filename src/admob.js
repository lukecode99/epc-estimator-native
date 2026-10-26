const AD_UNIT_ID = 'ca-app-pub-9879821077971587/7659309807'

let initialised = false
let personalised = false

// iOS only shows the ATT permission dialog while the app is in the
// foreground-active state. At cold launch this module runs before the web view
// is presented, so requesting ATT immediately makes iOS silently drop the
// prompt — which is exactly why App Review reported "ATT prompt not found"
// (Guideline 2.1). Wait for the page to become visible, then give the native
// layer a beat to finish presenting before we ask.
function whenActive() {
  return new Promise((resolve) => {
    const settle = () => setTimeout(resolve, 1000)
    if (document.visibilityState === 'visible') {
      settle()
      return
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        document.removeEventListener('visibilitychange', onVisible)
        settle()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
  })
}

// EPC-11 (App Review 5.1.2 / 2.1): the ATT prompt + UMP consent must both
// complete before any ad request. `initialised` only flips once the flow below
// has finished, and showBanner() is a no-op until then, so no ad — and no IDFA
// access — can happen pre-consent.
export async function initAdMob() {
  try {
    const { AdMob, AdmobConsentStatus } = await import('@capacitor-community/admob')
    const { Capacitor } = await import('@capacitor/core')

    // ATT FIRST, in its own guard. It must not sit behind requestConsentInfo():
    // if that call ever throws or stalls, the shared catch below would skip the
    // prompt entirely (the previous build's failure mode). On iOS we also wait
    // for the app to be active so the system actually presents the dialog.
    let attAuthorised = true
    if (Capacitor.getPlatform() === 'ios') {
      try {
        const before = await AdMob.trackingAuthorizationStatus()
        if (before.status === 'notDetermined') {
          await whenActive()
          await AdMob.requestTrackingAuthorization()
        }
        const after = await AdMob.trackingAuthorizationStatus()
        attAuthorised = after.status === 'authorized'
      } catch {
        attAuthorised = false
      }
    }

    // Consent is gathered BEFORE AdMob.initialize() — per Google's UMP
    // guidance, initialize can start preloading (and touch the IDFA), so it
    // must wait until the user has answered.
    let consent = await AdMob.requestConsentInfo()

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
