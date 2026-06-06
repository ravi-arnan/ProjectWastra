export const STORAGE_KEYS = {
  WATCHLIST: 'mango_watchlist',
  WATCHLIST_THRESHOLDS: 'mango_watchlist_thresholds',
  BOOKINGS: 'mango_bookings', // legacy global key — kept only for cleanup, do not write
  NOTIFICATIONS: 'mango_notifications',
  NOTIFICATION_PREFS: 'mango_notification_prefs',
  FIRED_REMINDERS: 'mango_fired_reminders',
  FIRED_WATCHLIST_ALERTS: 'mango_fired_watchlist_alerts',
  LAST_MOOD: 'mango_last_mood',
  REVIEWS: 'mango_reviews',
  SETTINGS: 'mango_settings',
  AVATAR: 'mango_avatar',
} as const

// Per-user bookings key. Returns null when there's no signed-in user
// (guests cannot have bookings; see Profil.tsx canHaveBookings gate).
export function bookingsKey(userId: string | null | undefined): string | null {
  return userId ? `mango_bookings:${userId}` : null
}

export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage full or unavailable
  }
}
