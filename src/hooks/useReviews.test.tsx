import { describe, test, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReviews } from './useReviews'
import { getStorageItem, STORAGE_KEYS } from '../lib/storage'

interface StoredReview {
  id: string
  destinationId: string
  rating: number
  comment: string
  createdAt: string
}

describe('useReviews', () => {
  beforeEach(() => localStorage.clear())

  test('starts empty for a destination with no reviews', () => {
    const { result } = renderHook(() => useReviews('uluwatu'))
    expect(result.current.count).toBe(0)
    expect(result.current.average).toBe(0)
    expect(result.current.reviews).toEqual([])
  })

  test('adds a review and exposes it immediately', () => {
    const { result } = renderHook(() => useReviews('uluwatu'))
    act(() => result.current.addReview(4, 'Bagus'))
    expect(result.current.count).toBe(1)
    expect(result.current.reviews[0]).toMatchObject({ rating: 4, comment: 'Bagus', destinationId: 'uluwatu' })
  })

  test('averages ratings across reviews', () => {
    const { result } = renderHook(() => useReviews('uluwatu'))
    act(() => result.current.addReview(5, ''))
    act(() => result.current.addReview(3, ''))
    expect(result.current.average).toBe(4)
    expect(result.current.count).toBe(2)
  })

  test('only returns reviews for the requested destination', () => {
    const { result: a } = renderHook(() => useReviews('uluwatu'))
    act(() => a.current.addReview(5, 'A'))
    const { result: b } = renderHook(() => useReviews('kuta'))
    act(() => b.current.addReview(2, 'B'))
    expect(b.current.count).toBe(1)
    expect(b.current.reviews[0].comment).toBe('B')
    // The uluwatu review must survive the kuta write.
    const stored = getStorageItem<StoredReview[]>(STORAGE_KEYS.REVIEWS, [])
    expect(stored).toHaveLength(2)
  })

  test('persists reviews to localStorage', () => {
    const { result } = renderHook(() => useReviews('sanur'))
    act(() => result.current.addReview(5, 'Tenang'))
    const stored = getStorageItem<StoredReview[]>(STORAGE_KEYS.REVIEWS, [])
    expect(stored.some((r) => r.destinationId === 'sanur' && r.comment === 'Tenang')).toBe(true)
  })

  test('newest review is listed first', () => {
    const { result } = renderHook(() => useReviews('ubud'))
    act(() => result.current.addReview(3, 'first'))
    act(() => result.current.addReview(5, 'second'))
    expect(result.current.reviews[0].comment).toBe('second')
  })
})
