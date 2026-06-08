import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// useBookings reads the signed-in user from AuthContext; stub a fixed user.
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1', is_anonymous: false } }),
}))

import { useBookings } from './useBookings'

const bookingInput = {
  destinationId: 'uluwatu',
  destinationName: 'Pura Uluwatu',
  date: '2026-06-20',
  visitors: 2,
  totalPrice: 100000,
}

describe('useBookings', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-10T00:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  test('starts with no bookings', () => {
    const { result } = renderHook(() => useBookings())
    expect(result.current.bookings).toEqual([])
  })

  test('createBooking adds a confirmed booking with a ticket code', () => {
    const { result } = renderHook(() => useBookings())
    let created!: ReturnType<typeof result.current.createBooking>
    act(() => {
      created = result.current.createBooking(bookingInput)
    })
    expect(result.current.bookings).toHaveLength(1)
    expect(created.status).toBe('confirmed')
    expect(created.ticketCode).toMatch(/^MNG-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    expect(created.destinationId).toBe('uluwatu')
  })

  test('new bookings are prepended (most recent first)', () => {
    const { result } = renderHook(() => useBookings())
    act(() => {
      result.current.createBooking({ ...bookingInput, destinationId: 'first' })
    })
    act(() => {
      result.current.createBooking({ ...bookingInput, destinationId: 'second' })
    })
    expect(result.current.bookings[0].destinationId).toBe('second')
  })

  test('cancelBooking flips the status to cancelled', () => {
    const { result } = renderHook(() => useBookings())
    let id = ''
    act(() => {
      id = result.current.createBooking(bookingInput).id
    })
    act(() => result.current.cancelBooking(id))
    expect(result.current.bookings.find((b) => b.id === id)?.status).toBe('cancelled')
  })

  test('getUpcomingBookings returns future confirmed bookings only', () => {
    const { result } = renderHook(() => useBookings())
    // Separate acts so state re-renders between creates (createBooking reads
    // the current bookings list).
    act(() => {
      result.current.createBooking({ ...bookingInput, date: '2026-06-20' }) // future
    })
    act(() => {
      result.current.createBooking({ ...bookingInput, date: '2026-06-01' }) // past
    })
    const upcoming = result.current.getUpcomingBookings()
    expect(upcoming).toHaveLength(1)
    expect(upcoming[0].date).toBe('2026-06-20')
  })

  test('getPastBookings includes past dates and cancelled bookings', () => {
    const { result } = renderHook(() => useBookings())
    let futureId = ''
    act(() => {
      result.current.createBooking({ ...bookingInput, date: '2026-06-01' }) // past
    })
    act(() => {
      futureId = result.current.createBooking({ ...bookingInput, date: '2026-06-20' }).id // future
    })
    act(() => result.current.cancelBooking(futureId)) // cancelled future -> past bucket
    expect(result.current.getPastBookings()).toHaveLength(2)
  })

  test('persists bookings under a per-user storage key', () => {
    const { result } = renderHook(() => useBookings())
    act(() => {
      result.current.createBooking(bookingInput)
    })
    const raw = localStorage.getItem('mango_bookings:user-1')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!)).toHaveLength(1)
  })
})
