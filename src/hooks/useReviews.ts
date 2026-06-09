import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export interface Review {
  id: string
  destinationId: string
  authorName: string | null
  rating: number
  comment: string
  createdAt: string
}

interface UseReviews {
  reviews: Review[]
  count: number
  average: number
  loading: boolean
  addReview: (rating: number, comment: string) => Promise<void>
}

interface ReviewRow {
  id: string
  destination_id: string
  author_name: string | null
  rating: number
  comment: string | null
  created_at: string
}

const toReview = (r: ReviewRow): Review => ({
  id: r.id,
  destinationId: r.destination_id,
  authorName: r.author_name,
  rating: r.rating,
  comment: r.comment ?? '',
  createdAt: r.created_at,
})

/**
 * Community reviews for a destination, backed by the public `reviews` table.
 * Anyone can read; only signed-in (non-anonymous) users can add one — gate the
 * entry point with the guest modal before calling addReview.
 */
export function useReviews(destinationId: string): UseReviews {
  const { user } = useAuth()
  // Tagging the loaded rows with their destination lets `loading` be derived,
  // so the effect never calls setState synchronously (React 19 purity rule).
  const [state, setState] = useState<{ id: string; rows: Review[] } | null>(null)

  const fetchReviews = useCallback(async (): Promise<Review[]> => {
    if (!destinationId) return []
    const { data, error } = await supabase
      .from('reviews')
      .select('id, destination_id, author_name, rating, comment, created_at')
      .eq('destination_id', destinationId)
      .order('created_at', { ascending: false })
    return error || !data ? [] : (data as ReviewRow[]).map(toReview)
  }, [destinationId])

  useEffect(() => {
    let active = true
    void fetchReviews().then((rows) => {
      if (active) setState({ id: destinationId, rows })
    })
    return () => {
      active = false
    }
  }, [destinationId, fetchReviews])

  const addReview = useCallback(
    async (rating: number, comment: string) => {
      const authorName = (user?.user_metadata?.full_name as string | undefined) ?? null
      // user_id defaults to auth.uid() in the DB; RLS enforces ownership.
      const { error } = await supabase
        .from('reviews')
        .insert({ destination_id: destinationId, author_name: authorName, rating, comment: comment || null })
      if (!error) setState({ id: destinationId, rows: await fetchReviews() })
    },
    [destinationId, user, fetchReviews],
  )

  const ready = state?.id === destinationId
  const reviews = ready ? state.rows : []
  const loading = !ready
  const count = reviews.length
  const average = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0

  return { reviews, count, average, loading, addReview }
}
