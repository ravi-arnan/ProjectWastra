import { useState, useCallback } from 'react'
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../lib/storage'
import { generateId } from '../lib/utils'

export interface Review {
  id: string
  destinationId: string
  rating: number
  comment: string
  createdAt: string
}

interface UseReviews {
  reviews: Review[]
  count: number
  average: number
  addReview: (rating: number, comment: string) => void
}

/**
 * Reviews for a single destination, persisted in localStorage. Owns both the
 * read and the write so a freshly submitted review shows up immediately without
 * a remount. (User reviews are device-local for now — see docs roadmap.)
 */
export function useReviews(destinationId: string): UseReviews {
  const [all, setAll] = useState<Review[]>(() =>
    getStorageItem<Review[]>(STORAGE_KEYS.REVIEWS, []),
  )

  const reviews = all
    .filter((r) => r.destinationId === destinationId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const count = reviews.length
  const average = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0

  const addReview = useCallback(
    (rating: number, comment: string) => {
      const review: Review = {
        id: generateId(),
        destinationId,
        rating,
        comment,
        createdAt: new Date().toISOString(),
      }
      // Re-read so concurrent writes for other destinations aren't clobbered.
      const current = getStorageItem<Review[]>(STORAGE_KEYS.REVIEWS, [])
      const next = [review, ...current]
      setStorageItem(STORAGE_KEYS.REVIEWS, next)
      setAll(next)
    },
    [destinationId],
  )

  return { reviews, count, average, addReview }
}
