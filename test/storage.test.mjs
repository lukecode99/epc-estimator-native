// Regression test for EPC-11: storage must never hang on native.
//
// Capacitor's registerPlugin() returns a Proxy whose `get` trap answers every
// property lookup — including `.then` — with a plugin-method wrapper. That
// makes the plugin object an accidental *thenable*: resolving a Promise with
// it makes the engine call proxy.then(resolve, reject), and the wrapper never
// invokes those callbacks, so the promise never settles. The old storage.js
// did exactly that (`import('@capacitor/preferences').then(m => m.Preferences)`),
// which silently hung every save/load on iOS.
//
// This test runs against the REAL @capacitor/core + @capacitor/preferences
// packages. Setting `CapacitorCustomPlatform = { name: 'ios' }` before they
// load makes isNativePlatform() return true while plugin calls fall back to
// the web implementation — same proxy, same thenable trap, working methods.
//
//   node test/storage.test.mjs                      # simulated-native (ios)
//   EPC_TEST_PLATFORM=web node test/storage.test.mjs  # web/localStorage path
const WEB = process.env.EPC_TEST_PLATFORM === 'web'

// Must be in place before anything from @capacitor/* is imported.
if (!WEB) globalThis.CapacitorCustomPlatform = { name: 'ios' }
const backing = new Map()
globalThis.localStorage = {
  getItem: (k) => (backing.has(k) ? backing.get(k) : null),
  setItem: (k, v) => backing.set(k, String(v)),
  removeItem: (k) => backing.delete(k),
}
globalThis.window = globalThis

// The hanging thenable's method wrapper rejects internally with an
// Unimplemented error nobody can catch (that's the bug). Tolerate exactly
// that; anything else is a real failure.
process.on('unhandledRejection', (err) => {
  if (/then\(\)" is not implemented/.test(String(err))) return
  console.error('FAIL  unexpected unhandled rejection:', err)
  process.exit(1)
})

let failures = 0
function check(name, cond, detail = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  [${WEB ? 'web' : 'ios'}] ${name}${detail ? ' — ' + detail : ''}`)
  if (!cond) failures++
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise.then((v) => ({ settled: true, value: v })),
    new Promise((r) => setTimeout(() => r({ settled: false, label }), ms)),
  ])
}

const { Capacitor } = await import('@capacitor/core')
check('platform simulation', Capacitor.isNativePlatform() === !WEB, Capacitor.getPlatform())

if (!WEB) {
  // Prove the trap is real on this Capacitor version: a promise resolved with
  // the plugin proxy must NOT settle. If Capacitor ever special-cases `then`,
  // this check flags that the simulation no longer exercises the bug.
  const { Preferences } = await import('@capacitor/preferences')
  const trap = await withTimeout(Promise.resolve(Preferences), 250)
  check('plugin proxy is a hanging thenable (bug preconditions hold)', trap.settled === false)
}

const storage = await import('../src/storage.js')

// Every storage call must settle promptly — this is the EPC-11 regression.
const est = [{ key: 'test-1', label: 'Test estimate', rating: 'C' }]
const roundTrip = await withTimeout(
  (async () => {
    await storage.storeEstimates(est)
    return storage.loadEstimates()
  })(),
  2000,
)
check('storeEstimates + loadEstimates settle', roundTrip.settled === true)
check(
  'saved estimate round-trips',
  roundTrip.settled && JSON.stringify(roundTrip.value) === JSON.stringify(est),
  JSON.stringify(roundTrip.value),
)

const kv = await withTimeout(
  (async () => {
    await storage.kvSet('epc_linkouts', '{"n":3}')
    return storage.kvGet('epc_linkouts')
  })(),
  2000,
)
check('kvSet + kvGet settle', kv.settled === true)
check('kv value round-trips', kv.settled && kv.value === '{"n":3}', String(kv.value))

if (!WEB) {
  // Native writes must land in Preferences (prefixed key), not raw localStorage.
  check('native path uses Preferences, not raw localStorage', backing.has('CapacitorStorage.epc_estimates') && !backing.has('epc_estimates'))

  // One-time migration: a legacy raw-localStorage save is copied into
  // Preferences on first read, then removed.
  backing.clear()
  const legacy = [{ key: 'legacy-1', label: 'Old save' }]
  backing.set('epc_estimates', JSON.stringify(legacy))
  const migrated = await withTimeout(storage.loadEstimates(), 2000)
  check('legacy localStorage save migrates', migrated.settled && migrated.value.length === 1 && migrated.value[0].key === 'legacy-1')
  check('migration moves key into Preferences', backing.has('CapacitorStorage.epc_estimates') && !backing.has('epc_estimates'))
} else {
  check('web path uses raw localStorage', backing.has('epc_estimates') && !backing.has('CapacitorStorage.epc_estimates'))
}

console.log(failures === 0 ? `\nALL CHECKS PASSED (${WEB ? 'web' : 'ios'})` : `\n${failures} CHECKS FAILED`)
process.exit(failures === 0 ? 0 : 1)
