import { useState, useCallback } from 'react'
import { bookingsKey, getStorageItem, setStorageItem } from '../lib/storage'
import { generateId, generateTicketCode } from '../lib/utils'
import type { Booking } from '../types/booking'
import { useAuth } from '../context/AuthContext'

function loadBookings(key: string | null): Booking[] {
  return key ? getStorageItem<Booking[]>(key, []) : []
}

export function useBookings() {
  const { user } = useAuth()
  const userId = user && !user.is_anonymous ? user.id : null
  const storageKey = bookingsKey(userId)

  const [bookings, setBookings] = useState<Booking[]>(() => loadBookings(storageKey))

  // Reload the list when the active user changes (login, logout, switch).
  // Adjusting state during render — React's supported pattern for resetting
  // state from a changed input — avoids a cascading effect re-render.
  const [loadedKey, setLoadedKey] = useState(storageKey)
  if (storageKey !== loadedKey) {
    setLoadedKey(storageKey)
    setBookings(loadBookings(storageKey))
  }

  const persist = useCallback(
    (updated: Booking[]) => {
      setBookings(updated)
      if (storageKey) setStorageItem(storageKey, updated)
    },
    [storageKey]
  )

  const createBooking = useCallback(
    (data: {
      destinationId: string
      destinationName: string
      date: string
      visitors: number
      totalPrice: number
    }): Booking => {
      const booking: Booking = {
        id: generateId(),
        ...data,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        ticketCode: generateTicketCode(),
      }
      persist([booking, ...bookings])
      return booking
    },
    [bookings, persist]
  )

  const cancelBooking = useCallback(
    (id: string) => {
      persist(bookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' as const } : b)))
    },
    [bookings, persist]
  )

  const getUpcomingBookings = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    return bookings.filter((b) => b.status === 'confirmed' && b.date >= today)
  }, [bookings])

  const getPastBookings = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    return bookings.filter((b) => b.date < today || b.status === 'cancelled')
  }, [bookings])

  return { bookings, createBooking, cancelBooking, getUpcomingBookings, getPastBookings }
}
