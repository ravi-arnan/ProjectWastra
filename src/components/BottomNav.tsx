import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from './Icon'
import { useAuth } from '../context/AuthContext'

export default function BottomNav() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const userTabs = [
    { to: '/app', icon: 'home', label: t('nav.home') },
    { to: '/app/peta', icon: 'map', label: t('nav.map') },
    { to: '/app/prediksi', icon: 'query_stats', label: t('nav.predictions') },
    { to: '/app/watchlist', icon: 'bookmark', label: t('nav.watchlist') },
    { to: '/app/profil', icon: 'person', label: t('nav.profile') },
  ]
  const adminTabs = [
    { to: '/app/otoritas', icon: 'insights', label: 'Insights' },
    { to: '/app/ai-agent', icon: 'smart_toy', label: 'AI Agent' },
    { to: '/app/user-management', icon: 'manage_accounts', label: 'Users' },
    { to: '/app/audit-logs', icon: 'receipt_long', label: 'Logs' },
    { to: '/app/profil', icon: 'person', label: t('nav.profile') },
  ]
  const tabs = isAdmin ? adminTabs : userTabs

  return (
    <nav className="fixed bottom-0 w-full max-w-[390px] z-50 flex justify-around items-center px-4 pt-3 pb-6 h-20 bg-[#fff8f5]/80 backdrop-blur-xl rounded-t-3xl shadow-[0_-4px_24px_rgba(31,27,23,0.06)] lg:hidden">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/app'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center ${
              isActive
                ? 'bg-cyan-50 text-cyan-700 rounded-2xl px-5 py-1'
                : 'text-stone-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={tab.icon} filled={isActive} />
              <span className="text-[10px] font-semibold uppercase tracking-wider mt-1">
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
