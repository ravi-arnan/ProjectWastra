import { describe, test, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWatchlist } from './useWatchlist'
import { getStorageItem, STORAGE_KEYS } from '../lib/storage'

describe('useWatchlist', () => {
  test('starts empty when nothing is stored', () => {
    const { result } = renderHook(() => useWatchlist())
    expect(result.current.watchlist).toEqual([])
  })

  test('adds an id and reflects it in isWatchlisted', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => result.current.addToWatchlist('uluwatu'))
    expect(result.current.watchlist).toContain('uluwatu')
    expect(result.current.isWatchlisted('uluwatu')).toBe(true)
  })

  test('does not add duplicates', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => result.current.addToWatchlist('kuta'))
    act(() => result.current.addToWatchlist('kuta'))
    expect(result.current.watchlist.filter((id) => id === 'kuta')).toHaveLength(1)
  })

  test('removes an id', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => result.current.addToWatchlist('sanur'))
    act(() => result.current.removeFromWatchlist('sanur'))
    expect(result.current.isWatchlisted('sanur')).toBe(false)
  })

  test('toggle flips membership', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => result.current.toggleWatchlist('ubud'))
    expect(result.current.isWatchlisted('ubud')).toBe(true)
    act(() => result.current.toggleWatchlist('ubud'))
    expect(result.current.isWatchlisted('ubud')).toBe(false)
  })

  test('persists the watchlist to localStorage', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => result.current.addToWatchlist('tanahlot'))
    expect(getStorageItem<string[]>(STORAGE_KEYS.WATCHLIST, [])).toContain('tanahlot')
  })

  test('hydrates initial state from localStorage', () => {
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(['pre-existing']))
    const { result } = renderHook(() => useWatchlist())
    expect(result.current.watchlist).toEqual(['pre-existing'])
  })
})
