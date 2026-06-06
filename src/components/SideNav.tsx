import { NavLink, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import Icon from './Icon'
import Logo from './Logo'
import { useAuth, getUserInitials, getUserFullName } from '../context/AuthContext'
import ShinyText from './reactbits/ShinyText'
import Magnet from './reactbits/Magnet'

export default function SideNav() {
  const { t } = useTranslation()
  const { isAdmin, isLocalManager, user } = useAuth()
  const initials = getUserInitials(user)
  const displayName = getUserFullName(user, t('profil.guest'))

  const userLinks = [
    { to: '/app', icon: 'home', label: t('nav.home') },
    { to: '/app/peta', icon: 'map', label: t('nav.map') },
    { to: '/app/prediksi', icon: 'online_prediction', label: t('nav.predictions') },
    { to: '/app/bandingkan', icon: 'compare_arrows', label: t('nav.compare') },
    { to: '/app/watchlist', icon: 'bookmark', label: t('nav.watchlist') },
    { to: '/app/profil', icon: 'person', label: t('nav.profile') },
  ]
  const adminLinks = [
    { to: '/app/admin', icon: 'admin_panel_settings', label: 'Admin' },
    { to: '/app/otoritas', icon: 'insights', label: 'Insights' },
    { to: '/app/ai-agent', icon: 'smart_toy', label: 'AI Agent' },
    { to: '/app/user-management', icon: 'manage_accounts', label: 'User Management' },
    { to: '/app/audit-logs', icon: 'receipt_long', label: 'Audit Logs' },
    { to: '/app/profil', icon: 'person', label: t('nav.profile') },
  ]
  const baseLinks = isAdmin ? adminLinks : userLinks
  const links = [...baseLinks]
  if (isLocalManager && !isAdmin) {
    links.splice(1, 0, { to: '/dashboard', icon: 'query_stats', label: 'Dashboard Pengelola' })
  }

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 w-64 h-screen bg-gradient-to-b from-white via-white to-surface-container-low/30 border-r border-stone-100 p-6 flex-col z-30">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
      <div className="absolute bottom-32 left-0 w-32 h-32 bg-primary-container/10 rounded-full -translate-x-1/2 blur-2xl pointer-events-none" />

      {/* Brand header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex items-center gap-3 mb-8"
      >
        <Logo size={34} eager />
        <div>
          <h1 className="text-xl font-black text-cyan-800 font-headline tracking-tight leading-none">
            <ShinyText text="Wastra" color="#155e75" shineColor="#6cd3f7" speed={3.5} />
          </h1>
          <p className="text-[9px] uppercase tracking-widest text-stone-400 mt-1">
            {t('auth.subtitle')}
          </p>
        </div>
      </motion.div>

      {/* User card */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="relative bg-white border border-stone-100 rounded-2xl p-3 mb-6 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center text-xs font-extrabold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-on-surface truncate">{displayName}</p>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
            {user?.is_anonymous
              ? t('profil.guest')
              : t('home.discoveryMode')}
          </p>
        </div>
      </motion.div>

      {/* Nav links */}
      <nav className="relative flex flex-col gap-1 flex-1">
        {links.map((link, i) => (
          <motion.div
            key={link.to}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.04 }}
          >
            <NavLink
              to={link.to}
              end={link.to === '/app'}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive
                    ? 'text-on-primary bg-primary font-bold shadow-md shadow-primary/25'
                    : 'text-stone-500 hover:text-on-surface hover:bg-surface-container-low'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={link.icon} filled={isActive} />
                  <span className="text-sm">{link.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="sidenav-indicator"
                      className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white"
                    />
                  )}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* AI Analysis CTA */}
      <Magnet padding={30} magnetStrength={6} wrapperClassName="!block !w-full">
        <Link
          to="/app/ai-analysis"
          className="relative w-full py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/30 hover:shadow-primary/40 transition-shadow overflow-hidden group"
        >
          <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
          <Icon name="auto_awesome" size="18px" />
          <span className="text-sm">{t('nav.aiAnalysis')}</span>
        </Link>
      </Magnet>
    </aside>
  )
}
