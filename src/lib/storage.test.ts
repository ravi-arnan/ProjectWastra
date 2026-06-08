import { describe, test, expect, vi, afterEach } from 'vitest'
import { bookingsKey, getStorageItem, setStorageItem, STORAGE_KEYS } from './storage'

describe('bookingsKey', () => {
  test('namespaces the key by user id', () => {
    expect(bookingsKey('user-123')).toBe('mango_bookings:user-123')
  })

  test('returns null for guests (no user id)', () => {
    expect(bookingsKey(null)).toBeNull()
    expect(bookingsKey(undefined)).toBeNull()
    expect(bookingsKey('')).toBeNull()
  })
})

describe('getStorageItem / setStorageItem', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('round-trips a value through localStorage', () => {
    setStorageItem(STORAGE_KEYS.WATCHLIST, ['a', 'b'])
    expect(getStorageItem<string[]>(STORAGE_KEYS.WATCHLIST, [])).toEqual(['a', 'b'])
  })

  test('returns the default when the key is absent', () => {
    expect(getStorageItem('missing-key', { fallback: true })).toEqual({ fallback: true })
  })

  test('returns the default when stored JSON is corrupt', () => {
    localStorage.setItem('broken', '{not valid json')
    expect(getStorageItem('broken', 'default')).toBe('default')
  })

  test('swallows write errors instead of throwing', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => setStorageItem('x', 'y')).not.toThrow()
  })
})
