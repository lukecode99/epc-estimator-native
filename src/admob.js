const AD_UNIT_ID = 'ca-app-pub-9879821077971587/7659309807'

let initialised = false

export async function initAdMob() {
  try {
    const { AdMob } = await import('@capacitor-community/admob')
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
