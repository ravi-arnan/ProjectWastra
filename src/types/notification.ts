export interface AppNotification {
  id: string
  type: 'crowd_alert' | 'booking_reminder' | 'recommendation' | 'system'
  title: string
  message: string
  destinationId?: string
  bookingId?: string
  read: boolean
  createdAt: string
}

export interface NotificationPrefs {
  crowdAlerts: boolean
  bookingReminders: boolean
  recommendations: boolean
  watchlistAlerts: boolean
}
