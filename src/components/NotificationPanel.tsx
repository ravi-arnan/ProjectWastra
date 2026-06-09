import { useEffect } from 'react'
import Icon from './Icon'
import { useNotifications } from '../hooks/useNotifications'
import { timeAgo } from '../lib/utils'

const typeIcons: Record<string, string> = {
  crowd_alert: 'groups',
  booking_reminder: 'confirmation_number',
  recommendation: 'explore',
  system: 'info',
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationPanel({ isOpen, onClose }: Props) {
  const { notifications, markAsRead, markAllAsRead, clearAll, deleteNotification, unreadCount } = useNotifications()

  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[90]" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-0 top-full mt-2 w-[360px] bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant z-[91] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-on-surface">Notifikasi</h3>
            {unreadCount > 0 && (
              <span className="bg-error text-on-error text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-[11px] font-semibold text-primary">
                Tandai semua dibaca
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={clearAll} aria-label="Hapus semua notifikasi" className="p-1 hover:bg-surface-container rounded-full">
                <Icon name="delete_sweep" size="18px" className="text-on-surface-variant" />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto no-scrollbar">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <Icon name="notifications_none" size="40px" className="text-on-surface-variant/30 mb-3" />
              <p className="text-sm text-on-surface-variant">Belum ada notifikasi</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-container-low group ${
                  !notif.read ? 'bg-primary/3' : ''
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  !notif.read ? 'bg-primary/10' : 'bg-surface-container'
                }`}>
                  <Icon name={typeIcons[notif.type] || 'info'} size="18px" className={!notif.read ? 'text-primary' : 'text-on-surface-variant'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs font-semibold truncate ${!notif.read ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                      {notif.title}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {!notif.read && <span className="w-2 h-2 rounded-full bg-primary mt-1" />}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notif.id)
                        }}
                        className="p-0.5 hover:bg-surface-container-high rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        title="Hapus"
                        aria-label="Hapus notifikasi"
                      >
                        <Icon name="close" size="14px" className="text-on-surface-variant" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5 line-clamp-2">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-on-surface-variant/60 mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}
