import { describe, test, expect } from 'vitest'
import { apiUrl, appOrigin, isNative, NATIVE_AUTH_REDIRECT } from './platform'

// In the test (web) environment Capacitor reports a non-native platform, so
// these cover the web code paths. The native branch is a simple origin prefix.
describe('platform helpers (web environment)', () => {
  test('isNative is false under the test DOM environment', () => {
    expect(isNative).toBe(false)
  })

  test('apiUrl returns a same-origin relative path on web', () => {
    expect(apiUrl('/api/astrapay-charge')).toBe('/api/astrapay-charge')
  })

  test('apiUrl normalizes a path missing its leading slash', () => {
    expect(apiUrl('api/ai-analysis')).toBe('/api/ai-analysis')
  })

  test('appOrigin returns the live window origin without a trailing slash', () => {
    expect(appOrigin()).toBe(window.location.origin)
    expect(appOrigin().endsWith('/')).toBe(false)
  })

  test('NATIVE_AUTH_REDIRECT is the registered deep-link scheme', () => {
    expect(NATIVE_AUTH_REDIRECT).toBe('com.wastra.app://auth-callback')
  })
})
