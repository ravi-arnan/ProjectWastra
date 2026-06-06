import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { bookingsKey, getStorageItem, setStorageItem, STORAGE_KEYS } from '../lib/storage'
import { generateId } from '../lib/utils'
import { destinations, DEFAULT_DENSITY_THRESHOLD } from '../data/destinations'
import i18n from '../i18n'
import type { AppNotification, NotificationPrefs } from '../types/notification'
import type { Booking } from '../types/booking'
import { useAuth } from '../context/AuthContext'

type ReminderKind = 'day_before' | 'day_of'

function daysBetween(from: Date, to: Date): number {
  const startOfDay = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.round((startOfDay(to) - startOfDay(from)) / 86400000)
}

function reminderCopy(booking: Booking, kind: ReminderKind) {
  if (kind === 'day_before') {
    return {
      title: `Besok kunjungan ke ${booking.destinationName}`,
      message: `Siapkan tiket & cek prakiraan kepadatan. Kode tiket: ${booking.ticketCode}`,
    }
  }
  return {
    title: `Hari ini kunjungan ke ${booking.destinationName}`,
    message: 'Selamat berkunjung! Cek kepadatan terkini sebelum berangkat.',
  }
}

const DEFAULT_PREFS: NotificationPrefs = {
  crowdAlerts: true,
  bookingReminders: true,
  recommendations: true,
  watchlistAlerts: true,
}

/** Bilingual copy for a watchlist destination that has gone calm. */
function densityAlertCopy(name: string, density: number) {
  const pct = Math.round(density * 100)
  if (i18n.language === 'en') {
    return {
      title: `${name} is calm now`,
      message: `Crowd dropped to ${pct}% capacity — a great window to visit.`,
    }
  }
  return {
    title: `${name} sedang sepi`,
    message: `Kepadatan turun ke ${pct}% kapasitas — waktu yang tepat untuk berkunjung.`,
  }
}

function generateInitialNotifications(): AppNotification[] {
  const quiet = destinations.filter((d) => d.density < 0.3)
  const busy = destinations.filter((d) => d.density > 0.8)
  const now = new Date()

  const notifs: AppNotification[] = []

  if (quiet.length > 0) {
    const dest = quiet[0]
    notifs.push({
      id: generateId(),
      type: 'crowd_alert',
      title: `${dest.name} sedang sepi!`,
      message: `Hanya ${Math.round(dest.density * 100)}% kapasitas terisi. Waktu ideal untuk berkunjung.`,
      destinationId: dest.id,
      read: false,
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    })
  }

  if (busy.length > 0) {
    const dest = busy[0]
    notifs.push({
      id: generateId(),
      type: 'crowd_alert',
      title: `${dest.name} sangat ramai`,
      message: `${Math.round(dest.density * 100)}% kapasitas terisi. Pertimbangkan waktu kunjungan lain.`,
      destinationId: dest.id,
      read: false,
      createdAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    })
  }

  notifs.push({
    id: generateId(),
    type: 'recommendation',
    title: 'Rekomendasi hari ini',
    message: 'Pantai Pandawa dan Bedugul sedang sepi. Sempurna untuk kunjungan yang tenang!',
    read: false,
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
  })

  return notifs
}

function loadNotifications(): AppNotification[] {
  const stored = getStorageItem<AppNotification[] | null>(STORAGE_KEYS.NOTIFICATIONS, null)
  if (stored === null) {
    const initial = generateInitialNotifications()
    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, initial)
    return initial
  }
  return stored
}

interface NotificationContextValue {
  notifications: AppNotification[]
  prefs: NotificationPrefs
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  deleteNotification: (id: string) => void
  addNotification: (notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void
  updatePrefs: (update: Partial<NotificationPrefs>) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user && !user.is_anonymous ? user.id : null
  const [notifications, setNotifications] = useState<AppNotification[]>(loadNotifications)
  const [prefs, setPrefs] = useState<NotificationPrefs>(() =>
    getStorageItem<NotificationPrefs>(STORAGE_KEYS.NOTIFICATION_PREFS, DEFAULT_PREFS)
  )
  const notifsRef = useRef(notifications)
  notifsRef.current = notifications

  const persistNotifications = useCallback((updated: AppNotification[]) => {
    setNotifications(updated)
    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, updated)
  }, [])

  const markAsRead = useCallback((id: string) => {
    const updated = notifsRef.current.map((n) => n.id === id ? { ...n, read: true } : n)
    persistNotifications(updated)
  }, [persistNotifications])

  const markAllAsRead = useCallback(() => {
    const updated = notifsRef.current.map((n) => ({ ...n, read: true }))
    persistNotifications(updated)
  }, [persistNotifications])

  const clearAll = useCallback(() => {
    persistNotifications([])
  }, [persistNotifications])

  const deleteNotification = useCallback((id: string) => {
    const updated = notifsRef.current.filter((n) => n.id !== id)
    persistNotifications(updated)
  }, [persistNotifications])

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: generateId(),
      read: false,
      createdAt: new Date().toISOString(),
    }
    const updated = [newNotif, ...notifsRef.current]
    persistNotifications(updated)
  }, [persistNotifications])

  const updatePrefs = useCallback((update: Partial<NotificationPrefs>) => {
    setPrefs((prev) => {
      const updated = { ...prev, ...update }
      setStorageItem(STORAGE_KEYS.NOTIFICATION_PREFS, updated)
      return updated
    })
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  // Crowd alert scheduler
  useEffect(() => {
    const interval = setInterval(() => {
      if (!prefs.crowdAlerts) return
      const dest = destinations[Math.floor(Math.random() * destinations.length)]
      if (dest.density < 0.3 && Math.random() > 0.7) {
        addNotification({
          type: 'crowd_alert',
          title: `${dest.name} mulai sepi`,
          message: `Kepadatan turun ke ${Math.round(dest.density * 100)}%. Waktu yang baik untuk berkunjung!`,
          destinationId: dest.id,
        })
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [prefs.crowdAlerts, addNotification])

  // Booking reminder scheduler
  useEffect(() => {
    if (!prefs.bookingReminders) return
    const userBookingsKey = bookingsKey(userId)
    if (!userBookingsKey) return // no signed-in user → nothing to schedule

    const runBookingReminderScheduler = () => {
      const bookings = getStorageItem<Booking[]>(userBookingsKey, [])
      const fired = getStorageItem<string[]>(STORAGE_KEYS.FIRED_REMINDERS, [])
      const firedSet = new Set(fired)
      const now = new Date()
      let changed = false

      for (const booking of bookings) {
        if (booking.status !== 'confirmed') continue
        const bookingDate = new Date(`${booking.date}T00:00:00`)
        const diff = daysBetween(now, bookingDate)

        const kinds: ReminderKind[] = []
        if (diff === 1) kinds.push('day_before')
        if (diff === 0) kinds.push('day_of')

        for (const kind of kinds) {
          const key = `${booking.id}:${kind}`
          if (firedSet.has(key)) continue
          const copy = reminderCopy(booking, kind)
          addNotification({
            type: 'booking_reminder',
            title: copy.title,
            message: copy.message,
            destinationId: booking.destinationId,
            bookingId: booking.id,
          })
          firedSet.add(key)
          changed = true
        }
      }

      if (changed) {
        setStorageItem(STORAGE_KEYS.FIRED_REMINDERS, Array.from(firedSet))
      }
    }

    runBookingReminderScheduler()
    const interval = setInterval(runBookingReminderScheduler, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [prefs.bookingReminders, addNotification, userId])

  // Watchlist density alert scheduler: notify once per day per watchlisted
  // destination whose crowd density has dropped at/below the user's calm
  // threshold. Reads the watchlist directly from storage (useWatchlist is not
  // a context) and reuses the shared FIRED_REMINDERS dedup set.
  useEffect(() => {
    if (!prefs.watchlistAlerts) return

    const runWatchlistAlertScheduler = () => {
      const watchlist = getStorageItem<string[]>(STORAGE_KEYS.WATCHLIST, [])
      if (watchlist.length === 0) return

      const thresholds = getStorageItem<Record<string, number>>(STORAGE_KEYS.WATCHLIST_THRESHOLDS, {})
      // Dedicated dedup set (not the shared booking FIRED_REMINDERS) so the two
      // schedulers can't clobber each other's keys on a concurrent mount tick.
      const firedSet = new Set(getStorageItem<string[]>(STORAGE_KEYS.FIRED_WATCHLIST_ALERTS, []))
      const today = new Date().toISOString().split('T')[0]
      let changed = false

      for (const id of watchlist) {
        if (typeof id !== 'string') continue
        const dest = destinations.find((d) => d.id === id)
        if (!dest) continue
        const rawThreshold = thresholds[id]
        const threshold = typeof rawThreshold === 'number' && Number.isFinite(rawThreshold)
          ? rawThreshold
          : DEFAULT_DENSITY_THRESHOLD
        if (threshold <= 0) continue // alerts muted for this destination
        if (dest.density > threshold) continue

        const key = `${id}:calm_alert:${today}` // at most once per day per dest
        if (firedSet.has(key)) continue

        const copy = densityAlertCopy(dest.name, dest.density)
        addNotification({
          type: 'crowd_alert',
          title: copy.title,
          message: copy.message,
          destinationId: id,
        })
        firedSet.add(key)
        changed = true
      }

      if (changed) {
        setStorageItem(STORAGE_KEYS.FIRED_WATCHLIST_ALERTS, Array.from(firedSet))
      }
    }

    runWatchlistAlertScheduler()
    const interval = setInterval(runWatchlistAlertScheduler, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [prefs.watchlistAlerts, addNotification])

  const value: NotificationContextValue = {
    notifications,
    prefs,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
    addNotification,
    updatePrefs,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return ctx
}
