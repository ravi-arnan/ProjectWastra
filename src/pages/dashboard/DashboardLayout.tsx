import { NavLink, Outlet, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import Icon from '../../components/Icon'
import ShinyText from '../../components/reactbits/ShinyText'
import { useAuth, getUserInitials } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard', icon: 'home', label: 'Overview', end: true },
  { to: '/dashboard/peta', icon: 'map', label: 'Peta Kepadatan', end: false },
  { to: '/dashboard/prediksi', icon: 'calendar_month', label: 'Prediksi 7 Hari', end: false },
  { to: '/dashboard/laporan', icon: 'download', label: 'Export & Laporan', end: false },
  { to: '/dashboard/destinasi', icon: 'location_on', label: 'Kelola Destinasi', end: false },
]

export default function DashboardLayout() {
  const { user } = useAuth()
  const initials = getUserInitials(user)
  const now = new Date()
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-surface flex">
      {/* ===== Sidebar ===== */}
      <aside className="hidden lg:flex fixed left-0 top-0 w-[260px] h-screen bg-gradient-to-b from-white via-white to-surface-container-low/30 border-r border-stone-100 p-5 flex-col z-30">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-primary/8 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
        <div className="absolute bottom-24 left-0 w-24 h-24 bg-primary-container/8 rounded-full -translate-x-1/2 blur-2xl pointer-events-none" />

        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative flex items-center gap-3 mb-2"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary/25">
            <Icon name="sensors" className="text-white" size="20px" />
          </div>
          <div>
            <h1 className="text-lg font-black text-cyan-800 font-headline tracking-tight leading-none">
              <ShinyText text="Wastra" color="#155e75" shineColor="#6cd3f7" speed={3.5} />
            </h1>
            <p className="text-[8px] uppercase tracking-[0.2em] text-stone-400 mt-0.5">
              Dashboard Pengelola
            </p>
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative flex items-center gap-2 bg-primary/8 rounded-xl px-3 py-2 mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Pengelola Wisata</span>
        </motion.div>

        {/* Nav */}
        <nav className="relative flex flex-col gap-1 flex-1">
          {navItems.map((item, i) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + i * 0.04 }}
            >
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm ${
                    isActive
                      ? 'text-on-primary bg-primary font-bold shadow-md shadow-primary/25'
                      : 'text-stone-500 hover:text-on-surface hover:bg-surface-container-low'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon name={item.icon} filled={isActive} size="20px" />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="dashboard-nav-indicator"
                        className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white"
                      />
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* Back to app */}
        <Link
          to="/app"
          className="relative flex items-center gap-2 px-4 py-3 rounded-xl text-stone-400 hover:text-on-surface hover:bg-surface-container-low transition-all text-sm"
        >
          <Icon name="arrow_back" size="18px" />
          <span>Kembali ke Beranda</span>
        </Link>
      </aside>

      {/* ===== Mobile top bar ===== */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#fff8f5]/85 backdrop-blur-xl border-b border-stone-100/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-md shadow-primary/20">
            <Icon name="sensors" className="text-white" size="16px" />
          </div>
          <span className="text-sm font-black text-cyan-800 font-headline">Dashboard</span>
        </div>
        <Link to="/app" aria-label="Tutup dashboard" className="p-2 text-stone-400 hover:text-on-surface">
          <Icon name="close" size="20px" />
        </Link>
      </div>

      {/* ===== Mobile bottom nav ===== */}
      <nav className="lg:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-2 pt-2 pb-5 h-[72px] bg-[#fff8f5]/80 backdrop-blur-xl rounded-t-2xl shadow-[0_-4px_24px_rgba(31,27,23,0.06)]">
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-colors ${
                isActive
                  ? 'bg-cyan-50 text-cyan-700'
                  : 'text-stone-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} filled={isActive} size="20px" />
                <span className="text-[9px] font-semibold tracking-wider leading-none">
                  {item.label.split(' ')[0]}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ===== Main content ===== */}
      <main className="flex-1 lg:ml-[260px]">
        {/* Desktop header strip */}
        <header className="hidden lg:flex sticky top-0 z-20 bg-[#fff8f5]/80 backdrop-blur-xl items-center justify-between px-8 py-4 border-b border-stone-100/50">
          <div>
            <p className="text-xs text-on-surface-variant">{dateStr}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-on-surface-variant">{timeStr} WITA</span>
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="pt-14 pb-24 lg:pt-0 lg:pb-0 px-4 lg:px-8 lg:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
