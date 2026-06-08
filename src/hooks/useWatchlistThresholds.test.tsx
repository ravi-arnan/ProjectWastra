import { describe, test, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWatchlistThresholds } from './useWatchlistThresholds'
import { getStorageItem, STORAGE_KEYS } from '../lib/storage'
import { DEFAULT_DENSITY_THRESHOLD } from '../data/destinations'

describe('useWatchlistThresholds', () => {
  test('falls back to the default threshold for unknown destinations', () => {
    const { result } = renderHook(() => useWatchlistThresholds())
    expect(result.current.getThreshold('unknown')).toBe(DEFAULT_DENSITY_THRESHOLD)
  })

  test('stores and reads a per-destination threshold', () => {
    const { result } = renderHook(() => useWatchlistThresholds())
    act(() => result.current.setThreshold('uluwatu', 0.6))
    expect(result.current.getThreshold('uluwatu')).toBe(0.6)
  })

  test('persists thresholds to localStorage', () => {
    const { result } = renderHook(() => useWatchlistThresholds())
    act(() => result.current.setThreshold('kuta', 0.3))
    const stored = getStorageItem<Record<string, number>>(STORAGE_KEYS.WATCHLIST_THRESHOLDS, {})
    expect(stored.kuta).toBe(0.3)
  })

  test('hydrates initial thresholds from localStorage', () => {
    localStorage.setItem(STORAGE_KEYS.WATCHLIST_THRESHOLDS, JSON.stringify({ sanur: 0.6 }))
    const { result } = renderHook(() => useWatchlistThresholds())
    expect(result.current.getThreshold('sanur')).toBe(0.6)
  })

  test('updating one threshold does not drop the others', () => {
    const { result } = renderHook(() => useWatchlistThresholds())
    act(() => result.current.setThreshold('a', 0.3))
    act(() => result.current.setThreshold('b', 0.6))
    expect(result.current.getThreshold('a')).toBe(0.3)
    expect(result.current.getThreshold('b')).toBe(0.6)
  })
})
