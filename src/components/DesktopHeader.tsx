import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from './Icon'
import { useAuth, getUserInitials } from '../context/AuthContext'
import { useNotifications } from '../hooks/useNotifications'
import NotificationPanel from './NotificationPanel'

export default function DesktopHeader() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const { unreadCount } = useNotifications()

  return (
    <header className="hidden lg:flex sticky top-0 z-40 bg-[#fff8f5]/80 backdrop-blur-xl items-center justify-between px-10 py-4 border-b border-stone-100/50">
      <div className="flex-1 max-w-xl">
        {!isAdmin && (
          <div className="relative group">
            <span className="absolute inset-y-0 left-4 flex items-center text-stone-400 group-focus-within:text-primary">
              <Icon name="search" />
            </span>
            <input
              type="text"
              aria-label={t('a11y.search')}
              placeholder={t('home.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate('/app') }}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 pl-12 pr-4 focus:ring-1 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-sm font-medium text-on-surface placeholder:text-on-surface-variant/60"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 ml-8">
        <div className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)} aria-label={t('a11y.notifications')} aria-expanded={notifOpen} className="p-2.5 hover:bg-stone-100 rounded-full transition-colors text-stone-500 relative">
            <Icon name="notifications" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>
        <button onClick={() => navigate('/app/profil')} aria-label={t('a11y.settings')} className="p-2.5 hover:bg-stone-100 rounded-full transition-colors text-stone-500">
          <Icon name="settings" />
        </button>
        <div className="w-10 h-10 rounded-full bg-primary-container overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
          <span className="text-xs font-bold text-on-primary">{getUserInitials(user)}</span>
        </div>
      </div>
    </header>
  )
}
