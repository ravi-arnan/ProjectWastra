import { describe, test, expect, vi } from 'vitest'

// vi.mock is hoisted above the import, so platform.ts evaluates `isNative` as
// true and we exercise the native (Capacitor shell) branches.
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },
}))

import { apiUrl, appOrigin, isNative } from './platform'

describe('platform helpers (native environment)', () => {
  test('isNative is true when Capacitor reports a native platform', () => {
    expect(isNative).toBe(true)
  })

  test('apiUrl prefixes the deployed origin for /api calls', () => {
    expect(apiUrl('/api/astrapay-charge')).toBe(
      'https://project-wastra.vercel.app/api/astrapay-charge',
    )
  })

  test('apiUrl still normalizes a missing leading slash', () => {
    expect(apiUrl('api/ai-analysis')).toBe(
      'https://project-wastra.vercel.app/api/ai-analysis',
    )
  })

  test('appOrigin returns the deployed origin without a trailing slash', () => {
    expect(appOrigin()).toBe('https://project-wastra.vercel.app')
    expect(appOrigin().endsWith('/')).toBe(false)
  })
})
