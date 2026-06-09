import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

interface ReviewRow {
  id: string
  destination_id: string
  author_name: string | null
  rating: number
  comment: string | null
  created_at: string
}

// Mutable fixture the mocked select chain resolves with.
let mockRows: ReviewRow[] = []
const insertMock = vi.fn(async () => ({ error: null }))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: async () => ({ data: mockRows, error: null }),
        }),
      }),
      insert: insertMock,
    }),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { user_metadata: { full_name: 'Tester' } } }),
}))

import { useReviews } from './useReviews'

function row(over: Partial<ReviewRow>): ReviewRow {
  return {
    id: 'r1',
    destination_id: 'uluwatu',
    author_name: 'Tester',
    rating: 5,
    comment: 'Bagus',
    created_at: '2026-01-01T00:00:00.000Z',
    ...over,
  }
}

describe('useReviews', () => {
  beforeEach(() => {
    mockRows = []
    insertMock.mockClear()
  })

  test('loads and maps reviews for the destination', async () => {
    mockRows = [row({ id: 'a', rating: 4, comment: 'Oke' })]
    const { result } = renderHook(() => useReviews('uluwatu'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.count).toBe(1)
    expect(result.current.reviews[0]).toMatchObject({ id: 'a', rating: 4, comment: 'Oke', destinationId: 'uluwatu' })
  })

  test('computes the average rating', async () => {
    mockRows = [row({ id: 'a', rating: 5 }), row({ id: 'b', rating: 3 })]
    const { result } = renderHook(() => useReviews('uluwatu'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.average).toBe(4)
  })

  test('empty destination id resolves to no reviews without querying', async () => {
    const { result } = renderHook(() => useReviews(''))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.count).toBe(0)
  })

  test('addReview inserts with destination, author and comment', async () => {
    const { result } = renderHook(() => useReviews('kuta'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.addReview(4, 'Mantap')
    })
    expect(insertMock).toHaveBeenCalledWith({
      destination_id: 'kuta',
      author_name: 'Tester',
      rating: 4,
      comment: 'Mantap',
    })
  })

  test('addReview sends null comment when empty', async () => {
    const { result } = renderHook(() => useReviews('kuta'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.addReview(5, '')
    })
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ comment: null }))
  })
})
