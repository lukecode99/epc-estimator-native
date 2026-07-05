import { Capacitor } from '@capacitor/core'

// Saved-estimates storage. On iOS/Android WKWebView can evict localStorage,
// so native platforms persist via @capacitor/preferences (UserDefaults /
// SharedPreferences); the web build keeps plain localStorage. Existing
// localStorage saves are migrated into Preferences once, on first read.

const KEY = 'epc_estimates'
export const SAVE_CAP = 20

// The promise must resolve with the *module namespace*, never with the
// Preferences plugin itself: registerPlugin() returns a Proxy that answers
// every property lookup — including `.then` — with a plugin-method wrapper,
// so resolving a promise with it makes the engine treat it as a thenable and
// call proxy.then(), which never settles on native. Read `.Preferences` off
// the namespace synchronously after awaiting, and never return the plugin
// from an async function (that re-triggers the same trap).
let prefsModulePromise = null
async function getPrefs() {
  if (!Capacitor.isNativePlatform()) return null
  if (!prefsModulePromise) {
    prefsModulePromise = import('@capacitor/preferences').catch(() => null)
  }
  const mod = await prefsModulePromise
  return mod ? { prefs: mod.Preferences } : null
}

function parse(json) {
  try {
    const list = JSON.parse(json || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export async function loadEstimates() {
  const native = await getPrefs()
  if (!native) return parse(localStorage.getItem(KEY))
  const { prefs } = native

  const { value } = await prefs.get({ key: KEY })
  if (value != null) return parse(value)

  // One-time migration: saves made before the Preferences switch live in
  // WKWebView localStorage. Copy them across, then clear the old key so
  // Preferences is the single source of truth.
  let legacy
  try {
    legacy = localStorage.getItem(KEY)
  } catch {
    legacy = null
  }
  if (legacy != null) {
    await prefs.set({ key: KEY, value: legacy })
    try {
      localStorage.removeItem(KEY)
    } catch {
      // best effort — the Preferences copy is authoritative either way
    }
    return parse(legacy)
  }
  return []
}

export async function storeEstimates(list) {
  const json = JSON.stringify(list)
  const native = await getPrefs()
  if (native) await native.prefs.set({ key: KEY, value: json })
  else localStorage.setItem(KEY, json)
}

// Generic key/value on the same backing store (Preferences on native,
// localStorage on web) for other features — no migration logic.
export async function kvGet(key) {
  const native = await getPrefs()
  if (native) return (await native.prefs.get({ key })).value
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export async function kvSet(key, value) {
  const native = await getPrefs()
  if (native) await native.prefs.set({ key, value })
  else localStorage.setItem(key, value)
}
