import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import SettingsModal from '../components/SettingsModal'
import { useAuth, getUserInitials, getUserFullName } from '../context/AuthContext'
import { useBookings } from '../hooks/useBookings'
import { useWatchlist } from '../hooks/useWatchlist'
import { useNotifications } from '../hooks/useNotifications'
import { destinations } from '../data/destinations'
import { formatDate, formatCurrency } from '../lib/utils'
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../lib/storage'
import { showToast } from '../components/Toast'
import { supabase } from '../lib/supabase'
import { setAppLanguage, type AppLang } from '../i18n'
import BlurText from '../components/reactbits/BlurText'
import ShinyText from '../components/reactbits/ShinyText'
import GradientText from '../components/reactbits/GradientText'
import CountUp from '../components/reactbits/CountUp'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import Magnet from '../components/reactbits/Magnet'

type ModalType = 'language' | 'privacy' | 'about' | 'edit' | 'help' | 'appearance' | 'notifications' | null

export default function Profil() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { user, signOut, isAdmin } = useAuth()
  const { bookings, cancelBooking, getUpcomingBookings } = useBookings()
  const { watchlist } = useWatchlist()
  const { prefs, updatePrefs } = useNotifications()
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [editName, setEditName] = useState(user?.user_metadata?.full_name || '')
  const [selectedLang, setSelectedLang] = useState<string>(() => i18n.language || 'id')
  const [selectedAvatar, setSelectedAvatar] = useState(() => getStorageItem<number>(STORAGE_KEYS.AVATAR, 0))

  const displayName = getUserFullName(user, t('profil.guest'))
  const initials = getUserInitials(user)
  const isGuest = user?.is_anonymous
  const canHaveBookings = !isAdmin && !isGuest
  const canHaveWatchlist = !isAdmin
  const canShowStats = canHaveBookings || canHaveWatchlist
  const upcomingBookings = getUpcomingBookings()
  const watchlistedDests = destinations.filter((d) => watchlist.includes(d.id))

  const avatarColors = ['bg-primary', 'bg-tertiary', 'bg-error', 'bg-amber-500', 'bg-emerald-500', 'bg-violet-500']

  async function handleLogout() {
    await signOut()
    navigate('/auth')
  }

  async function handleEditProfile() {
    if (editName.trim() && !isGuest) {
      await supabase.auth.updateUser({ data: { full_name: editName.trim() } })
      showToast(lang === 'en' ? 'Profile updated' : 'Profil berhasil diperbarui')
    }
    setActiveModal(null)
  }

  function handleLanguageChange(langCode: string) {
    setSelectedLang(langCode)
    setAppLanguage(langCode as AppLang)
    showToast(langCode === 'en' ? 'Language updated' : 'Bahasa berhasil diubah')
  }

  function handleAvatarChange(idx: number) {
    setSelectedAvatar(idx)
    setStorageItem(STORAGE_KEYS.AVATAR, idx)
    showToast(lang === 'en' ? 'Avatar updated' : 'Avatar berhasil diubah')
  }

  const settingsItems = [
    { icon: 'notifications', label: lang === 'en' ? 'Notifications' : 'Notifikasi', type: 'toggle' as const },
    {
      icon: 'language',
      label: t('profil.items.language'),
      type: 'detail' as const,
      detail: selectedLang === 'id' ? 'Indonesia' : 'English',
      action: () => setActiveModal('language'),
    },
    { icon: 'shield', label: t('profil.items.privacy'), type: 'chevron' as const, action: () => setActiveModal('privacy') },
    { icon: 'help', label: t('profil.items.help'), type: 'chevron' as const, action: () => setActiveModal('help') },
    { icon: 'info', label: t('profil.items.about'), type: 'detail' as const, detail: 'v1.0.0', action: () => setActiveModal('about') },
  ]

  const desktopSettings = [
    { icon: 'notifications', label: lang === 'en' ? 'Notifications' : 'Notifikasi', subtitle: lang === 'en' ? 'Manage alerts and push notifications' : 'Kelola pemberitahuan dan push', action: () => setActiveModal('notifications') },
    { icon: 'shield', label: t('profil.items.privacy'), subtitle: lang === 'en' ? 'Control your data and visibility' : 'Kontrol data dan visibilitas Anda', action: () => setActiveModal('privacy') },
    { icon: 'language', label: t('profil.items.language'), subtitle: lang === 'en' ? 'App language and region preferences' : 'Bahasa aplikasi dan preferensi region', action: () => setActiveModal('language') },
    { icon: 'dark_mode', label: t('profil.items.appearance'), subtitle: lang === 'en' ? 'Theme, display, and accessibility' : 'Tema, tampilan, dan aksesibilitas', action: () => setActiveModal('appearance') },
    { icon: 'help', label: t('profil.items.help'), subtitle: lang === 'en' ? 'FAQ, contact us, report a problem' : 'FAQ, hubungi kami, laporkan masalah', action: () => setActiveModal('help') },
    { icon: 'info', label: t('profil.items.about'), subtitle: lang === 'en' ? 'App version, credits, and licenses' : 'Versi aplikasi, kredit, dan lisensi', action: () => setActiveModal('about') },
    { icon: 'logout', label: t('profil.items.logout'), subtitle: lang === 'en' ? 'Sign out of your account' : 'Keluar dari akun Anda', action: handleLogout },
  ]

  return (
    <div>
      {/* MOBILE VIEW */}
      <div className="lg:hidden flex flex-col gap-5 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 pt-2"
        >
          <div className="relative">
            <div
              className={`w-[88px] h-[88px] rounded-full ${avatarColors[selectedAvatar]} flex items-center justify-center shadow-lg`}
            >
              <span className="text-white text-2xl font-extrabold">{initials}</span>
            </div>
            <button
              onClick={() => {
                const next = (selectedAvatar + 1) % avatarColors.length
                handleAvatarChange(next)
              }}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-surface flex items-center justify-center shadow-md"
            >
              <Icon name="edit" size="14px" className="text-on-surface" />
            </button>
          </div>
          <div className="text-center">
            <BlurText
              text={displayName}
              as="h1"
              animateBy="words"
              delay={80}
              className="text-2xl font-extrabold text-on-surface !justify-center font-headline"
            />
            <p className="text-sm text-on-surface-variant mt-0.5">
              {isGuest ? t('profil.guest') : (lang === 'en' ? 'Active traveler' : 'Traveler aktif')} &middot; Indonesia
            </p>
          </div>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2">
          {canHaveWatchlist && (
            <span className="bg-surface-container-high rounded-full px-4 py-2 text-xs font-semibold text-on-surface">
              <CountUp to={watchlist.length} duration={1.2} /> {t('profil.stats.saved')}
            </span>
          )}
          {canHaveBookings && (
            <span className="bg-surface-container-high rounded-full px-4 py-2 text-xs font-semibold text-on-surface">
              <CountUp to={bookings.length} duration={1.2} /> {lang === 'en' ? 'Bookings' : 'Booking'}
            </span>
          )}
          <span className="bg-surface-container-high rounded-full px-4 py-2 text-xs font-semibold text-on-surface">
            {t('profil.memberSince', { date: '2025' })}
          </span>
        </div>

        {/* Upcoming Bookings */}
        {canHaveBookings && upcomingBookings.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-on-surface mb-3">
              {lang === 'en' ? 'Upcoming Bookings' : 'Booking Mendatang'}
            </h3>
            <div className="flex flex-col gap-2">
              {upcomingBookings.slice(0, 3).map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-surface-container-low rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-on-surface">{b.destinationName}</p>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Confirmed
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {formatDate(b.date)} &middot; {b.visitors} {lang === 'en' ? 'people' : 'orang'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-mono text-on-surface-variant">{b.ticketCode}</span>
                    <button onClick={() => cancelBooking(b.id)} className="text-xs text-error font-semibold">
                      {lang === 'en' ? 'Cancel' : 'Batalkan'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Watchlist */}
        {canHaveWatchlist && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-on-surface">{lang === 'en' ? 'Watchlist' : 'Watchlist'}</h3>
              {watchlistedDests.length > 0 && (
                <button
                  onClick={() => navigate('/app/watchlist')}
                  className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                >
                  {lang === 'en' ? 'See all' : 'Lihat semua'}
                  <Icon name="chevron_right" size="14px" />
                </button>
              )}
            </div>
            {watchlistedDests.length === 0 ? (
              <button
                onClick={() => navigate('/app/destinasi')}
                className="w-full bg-surface-container-low rounded-2xl p-5 flex items-center gap-3 text-left hover:bg-surface-container-high transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon name="bookmark_border" size="20px" className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface">
                    {lang === 'en' ? 'No saved destinations yet' : 'Belum ada destinasi tersimpan'}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {lang === 'en' ? 'Tap to browse and add your own' : 'Tap untuk jelajahi dan tambahkan sendiri'}
                  </p>
                </div>
                <Icon name="chevron_right" size="18px" className="text-on-surface-variant" />
              </button>
            ) : (
              <div className="flex gap-3 overflow-x-auto no-scrollbar">
                {watchlistedDests.map((dest, i) => (
                  <motion.div
                    key={dest.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="shrink-0 w-32 bg-surface-container-low rounded-xl overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/app/destinasi/${dest.id}`)}
                  >
                    <img src={dest.image} alt={dest.name} className="w-full h-20 object-cover" />
                    <div className="p-2">
                      <p className="text-xs font-bold text-on-surface truncate">{dest.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{dest.densityLabel}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col gap-1">
          {settingsItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 py-3 cursor-pointer hover:bg-stone-50/50 rounded-lg px-2 -mx-2 transition-colors"
              onClick={item.action}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon name={item.icon} size="20px" className="text-primary" />
              </div>
              <span className="flex-1 text-sm font-semibold text-on-surface">{item.label}</span>
              {item.type === 'toggle' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    updatePrefs({ crowdAlerts: !prefs.crowdAlerts })
                  }}
                  className={`w-11 h-6 rounded-full relative transition-colors ${
                    prefs.crowdAlerts ? 'bg-primary' : 'bg-on-surface/20'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      prefs.crowdAlerts ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              )}
              {item.type === 'detail' && <span className="text-xs text-on-surface-variant">{item.detail}</span>}
              {item.type === 'chevron' && (
                <Icon name="chevron_right" size="20px" className="text-on-surface-variant" />
              )}
            </div>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3 bg-error/10 text-error rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-error/20 transition-colors"
        >
          <Icon name="logout" size="18px" />
          {t('profil.items.logout')}
        </button>

        <div className="flex flex-col items-center gap-3 py-4 px-6">
          <p className="text-[10px] text-on-surface-variant/60 text-center leading-relaxed">
            {lang === 'en'
              ? 'Wastra is developed as part of the Microsoft AI Impact Challenge to support sustainable tourism across Indonesia.'
              : 'Wastra dikembangkan sebagai bagian dari Microsoft AI Impact Challenge untuk membantu pariwisata berkelanjutan di seluruh Indonesia.'}
          </p>
        </div>
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden lg:flex flex-col gap-8 pb-8">
        {/* Hero header */}
        <SpotlightCard
          spotlightColor="rgba(0, 100, 124, 0.15)"
          className="bg-gradient-to-br from-surface-container-low via-white to-primary-fixed/30 rounded-[2.5rem] p-8 border border-stone-200/60"
        >
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {t('profil.title')}
          </span>
          <BlurText
            text={t('profil.title')}
            as="h1"
            animateBy="words"
            delay={80}
            className="text-4xl font-extrabold text-on-surface font-headline mt-2"
          />
          <p className="text-on-surface-variant mt-2">{t('profil.subtitle')}</p>
        </SpotlightCard>

        {/* Profile + Stats */}
        <div className="grid grid-cols-12 gap-4">
          <SpotlightCard
            spotlightColor="rgba(0, 100, 124, 0.15)"
            className={`${canShowStats ? 'col-span-7' : 'col-span-12'} bg-surface-container-low rounded-[2.5rem] p-8 flex items-center gap-8`}
          >
            <div
              className={`w-[160px] h-[160px] rounded-full ${avatarColors[selectedAvatar]} flex items-center justify-center shrink-0 cursor-pointer shadow-2xl hover:scale-105 transition-transform`}
              onClick={() => handleAvatarChange((selectedAvatar + 1) % avatarColors.length)}
            >
              <span className="text-white text-5xl font-extrabold">{initials}</span>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-on-surface font-headline">
                    <ShinyText text={displayName} color="#1f1b17" shineColor="#00647c" speed={3.5} />
                  </h2>
                  {!isGuest && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Icon name="verified" size="16px" className="text-on-primary" filled />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Icon name="location_on" size="16px" className="text-on-surface-variant" />
                  <span className="text-sm text-on-surface-variant">Indonesia</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Magnet padding={40} magnetStrength={5}>
                  <button
                    onClick={() => {
                      setEditName(user?.user_metadata?.full_name || '')
                      setActiveModal('edit')
                    }}
                    className="bg-primary text-on-primary text-sm font-bold px-6 py-2.5 rounded-full flex items-center gap-2 shadow-md shadow-primary/20 hover:bg-primary-container transition-colors"
                  >
                    <Icon name="edit" size="16px" />
                    {t('profil.items.editProfile')}
                  </button>
                </Magnet>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: 'Profil Wastra', url: window.location.href })
                    } else {
                      navigator.clipboard.writeText(window.location.href)
                      showToast(lang === 'en' ? 'Profile link copied!' : 'Link profil disalin!')
                    }
                  }}
                  className="bg-surface-container-high text-on-surface text-sm font-bold px-6 py-2.5 rounded-full flex items-center gap-2 hover:bg-surface-container-highest transition-colors"
                >
                  <Icon name="share" size="16px" />
                  {t('common.share')}
                </button>
              </div>
            </div>
          </SpotlightCard>

          {canShowStats && (
          <div className={`col-span-5 grid gap-4 ${canHaveWatchlist && canHaveBookings ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {canHaveWatchlist && (
              <button
                onClick={() => navigate('/app/watchlist')}
                className="group text-left"
                title={lang === 'en' ? 'Open watchlist' : 'Buka watchlist'}
              >
                <SpotlightCard
                  spotlightColor="rgba(0, 100, 124, 0.18)"
                  className="bg-surface-container-low rounded-[2rem] p-6 flex flex-col justify-between cursor-pointer h-full group-hover:bg-surface-container transition-colors"
                >
                  <div>
                    <p className="text-sm text-on-surface-variant font-medium">{t('profil.stats.saved')}</p>
                    <p className="text-4xl font-extrabold text-on-surface mt-1 font-headline">
                      <CountUp to={watchlist.length} duration={1.4} />
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-on-surface-variant">
                      {lang === 'en' ? 'in watchlist' : 'di watchlist'}
                    </p>
                    <Icon name="chevron_right" size="16px" className="text-on-surface-variant group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </SpotlightCard>
              </button>
            )}
            {canHaveBookings && (
              <SpotlightCard
                spotlightColor="rgba(163, 103, 0, 0.18)"
                className="bg-surface-container-low rounded-[2rem] p-6 flex flex-col justify-between"
              >
                <div>
                  <p className="text-sm text-on-surface-variant font-medium">{lang === 'en' ? 'Bookings' : 'Booking'}</p>
                  <p className="text-4xl font-extrabold text-on-surface mt-1 font-headline">
                    <CountUp to={bookings.length} duration={1.4} />
                  </p>
                </div>
                <p className="text-xs text-on-surface-variant mt-4">
                  <CountUp to={upcomingBookings.length} duration={1.2} /> {lang === 'en' ? 'upcoming' : 'mendatang'}
                </p>
              </SpotlightCard>
            )}
          </div>
          )}
        </div>

        {/* Booking History */}
        {canHaveBookings && bookings.length > 0 && (
          <SpotlightCard
            spotlightColor="rgba(0, 100, 124, 0.15)"
            className="bg-surface-container-low/50 rounded-[2.5rem] p-8"
          >
            <h2 className="text-xl font-bold text-on-surface mb-4 font-headline">
              {lang === 'en' ? 'Booking History' : 'Riwayat Booking'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {bookings.slice(0, 4).map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl p-5 flex items-start justify-between border border-stone-100 hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="font-bold text-on-surface">{b.destinationName}</p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {formatDate(b.date)} &middot; {b.visitors} {lang === 'en' ? 'people' : 'orang'}
                    </p>
                    <p className="text-xs font-mono text-on-surface-variant mt-1">{b.ticketCode}</p>
                    <p className="text-sm font-semibold text-primary mt-2">
                      {b.totalPrice === 0 ? (lang === 'en' ? 'Free' : 'Gratis') : formatCurrency(b.totalPrice)}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : b.status === 'cancelled'
                        ? 'bg-error/10 text-error'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {b.status === 'confirmed'
                      ? 'Confirmed'
                      : b.status === 'cancelled'
                      ? 'Cancelled'
                      : 'Completed'}
                  </span>
                </motion.div>
              ))}
            </div>
          </SpotlightCard>
        )}

        {/* Settings */}
        <SpotlightCard
          spotlightColor="rgba(0, 100, 124, 0.12)"
          className="bg-surface-container-low/50 rounded-[2.5rem] p-10"
        >
          <h2 className="text-xl font-bold text-on-surface mb-6 font-headline">
            {t('profil.sections.accountSettings')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {desktopSettings.map((item, i) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                onClick={item.action}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white transition-all hover:translate-x-1 hover:shadow-sm text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon
                    name={item.icon}
                    size="22px"
                    className={item.icon === 'logout' ? 'text-error' : 'text-primary'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${item.icon === 'logout' ? 'text-error' : 'text-on-surface'}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{item.subtitle}</p>
                </div>
                <Icon name="chevron_right" size="20px" className="text-on-surface-variant shrink-0" />
              </motion.button>
            ))}
          </div>
        </SpotlightCard>

        {/* Brand banner */}
        <div className="relative bg-on-surface rounded-[2.5rem] h-48 overflow-hidden flex items-center">
          <div className="absolute top-0 left-0 w-72 h-72 bg-primary/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary-container/15 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none" />
          <div className="relative z-10 px-10 flex items-center justify-between w-full">
            <div>
              <h3 className="text-2xl font-extrabold text-white font-headline">
                <GradientText
                  colors={['#a5f3fc', '#6cd3f7', '#ffffff', '#6cd3f7', '#a5f3fc']}
                  animationSpeed={5}
                >
                  {lang === 'en' ? 'Love Wastra?' : 'Sukai Wastra?'}
                </GradientText>
              </h3>
              <p className="text-white/70 text-sm mt-1">
                {lang === 'en'
                  ? 'Help us build sustainable tourism in Indonesia'
                  : 'Bantu kami mewujudkan pariwisata berkelanjutan di Indonesia'}
              </p>
            </div>
            <Magnet padding={40} magnetStrength={5}>
              <a
                href="mailto:support@wastra.id"
                className="bg-white text-on-surface font-bold text-sm px-6 py-3 rounded-full shrink-0 hover:bg-surface-container-lowest transition-colors shadow-xl"
              >
                {lang === 'en' ? 'Contact Us' : 'Hubungi Kami'}
              </a>
            </Magnet>
          </div>
        </div>
      </div>

      {/* Settings Modals */}
      <SettingsModal
        title={t('profil.modals.language')}
        isOpen={activeModal === 'language'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-2">
          {[
            { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
            { code: 'en', label: 'English', flag: '🇬🇧' },
          ].map((langOpt) => (
            <button
              key={langOpt.code}
              onClick={() => {
                handleLanguageChange(langOpt.code)
                setActiveModal(null)
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                selectedLang === langOpt.code ? 'bg-primary/10 border border-primary/20' : 'hover:bg-stone-50'
              }`}
            >
              <span className="text-xl">{langOpt.flag}</span>
              <span className="text-sm font-semibold text-on-surface">{langOpt.label}</span>
              {selectedLang === langOpt.code && (
                <Icon name="check_circle" size="20px" className="text-primary ml-auto" filled />
              )}
            </button>
          ))}
        </div>
      </SettingsModal>

      {/* Notifications modal */}
      <SettingsModal
        title={lang === 'en' ? 'Notifications' : 'Notifikasi'}
        isOpen={activeModal === 'notifications'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          {[
            { label: t('profil.prefs.crowdAlerts'), desc: t('profil.prefs.crowdAlertsDesc'), key: 'crowdAlerts' as const, value: prefs.crowdAlerts },
            { label: t('profil.prefs.watchlistAlerts'), desc: t('profil.prefs.watchlistAlertsDesc'), key: 'watchlistAlerts' as const, value: prefs.watchlistAlerts },
            { label: t('profil.prefs.bookingReminders'), desc: t('profil.prefs.bookingRemindersDesc'), key: 'bookingReminders' as const, value: prefs.bookingReminders },
            { label: t('profil.prefs.recommendations'), desc: t('profil.prefs.recommendationsDesc'), key: 'recommendations' as const, value: prefs.recommendations },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-on-surface">{item.label}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => updatePrefs({ [item.key]: !item.value })}
                className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${
                  item.value ? 'bg-primary' : 'bg-on-surface/20'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    item.value ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </SettingsModal>

      {/* Privacy & Security modal */}
      <SettingsModal
        title={t('profil.modals.privacy')}
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-3">
          <div className="bg-surface-container-low rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon name="lock" size="20px" className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-on-surface">
                {lang === 'en' ? 'Account Security' : 'Keamanan Akun'}
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {lang === 'en'
                  ? 'Your data is encrypted in transit and at rest. We never share your personal info.'
                  : 'Data Anda dienkripsi saat dikirim dan disimpan. Kami tidak pernah membagikan info pribadi.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => showToast(lang === 'en' ? 'Data export coming soon' : 'Export data segera hadir', 'info')}
            className="w-full bg-surface-container-low rounded-xl p-4 flex items-center gap-3 hover:bg-surface-container transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon name="download" size="20px" className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-on-surface">
                {lang === 'en' ? 'Download My Data' : 'Unduh Data Saya'}
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {lang === 'en' ? 'Get a copy of your activity and preferences' : 'Dapatkan salinan aktivitas dan preferensi'}
              </p>
            </div>
            <Icon name="chevron_right" size="20px" className="text-on-surface-variant" />
          </button>

          <button
            onClick={() => showToast(lang === 'en' ? 'Contact support to delete your account' : 'Hubungi support untuk menghapus akun', 'info')}
            className="w-full bg-error/5 rounded-xl p-4 flex items-center gap-3 hover:bg-error/10 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-error/15 flex items-center justify-center shrink-0">
              <Icon name="delete" size="20px" className="text-error" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-error">
                {lang === 'en' ? 'Delete Account' : 'Hapus Akun'}
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {lang === 'en' ? 'Permanently remove your account and data' : 'Hapus permanen akun dan data Anda'}
              </p>
            </div>
            <Icon name="chevron_right" size="20px" className="text-on-surface-variant" />
          </button>
        </div>
      </SettingsModal>

      <SettingsModal
        title={t('profil.modals.about')}
        isOpen={activeModal === 'about'}
        onClose={() => setActiveModal(null)}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <Logo size={64} />

          <div>
            <h3 className="text-lg font-bold text-on-surface">Wastra</h3>
            <p className="text-sm text-on-surface-variant">{t('auth.subtitle')}</p>
            <p className="text-xs text-on-surface-variant mt-1">v1.0.0</p>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {lang === 'en'
              ? 'Wastra is an AI-powered smart tourism platform that helps travelers plan visits with real-time and predictive crowd density data.'
              : 'Wastra adalah platform pariwisata cerdas berbasis AI yang membantu wisatawan merencanakan kunjungan dengan menyajikan data keramaian destinasi secara real-time dan prediktif.'}
          </p>
          <p className="text-[10px] text-on-surface-variant/60">
            {lang === 'en'
              ? 'Built for the Microsoft AI Impact Challenge 2026'
              : 'Dikembangkan untuk Microsoft AI Impact Challenge 2026'}
          </p>
        </div>
      </SettingsModal>

      <SettingsModal
        title={t('profil.modals.edit')}
        isOpen={activeModal === 'edit'}
        onClose={() => setActiveModal(null)}
      >
        {isGuest ? (
          <p className="text-sm text-on-surface-variant text-center py-4">
            {lang === 'en' ? 'Create an account to edit your profile.' : 'Buat akun untuk mengedit profil Anda.'}
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-on-surface mb-1.5 block">
                {t('auth.fields.fullName')}
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-on-surface mb-1.5 block">
                {t('auth.fields.email')}
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface-variant outline-none opacity-60"
              />
            </div>
            <button
              onClick={handleEditProfile}
              className="w-full bg-primary text-on-primary rounded-xl py-3 font-bold text-sm hover:bg-primary-container transition-colors"
            >
              {t('common.save')}
            </button>
          </div>
        )}
      </SettingsModal>

      <SettingsModal
        title={t('profil.modals.help')}
        isOpen={activeModal === 'help'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <div className="space-y-3">
            {(lang === 'en'
              ? [
                  {
                    q: 'How is crowd data collected?',
                    a: 'We use a combination of sensor data, satellite imagery analysis, and AI to estimate crowd levels.',
                  },
                  {
                    q: 'Are forecasts accurate?',
                    a: 'Our forecasts have high accuracy based on historical patterns, weather, and local events.',
                  },
                  {
                    q: 'How do I cancel a booking?',
                    a: 'Open Profile > Upcoming Bookings > tap Cancel.',
                  },
                ]
              : [
                  {
                    q: 'Bagaimana data keramaian dikumpulkan?',
                    a: 'Kami menggunakan kombinasi data sensor, analisis citra satelit, dan AI untuk memperkirakan tingkat keramaian.',
                  },
                  {
                    q: 'Apakah prediksi akurat?',
                    a: 'Prediksi kami memiliki tingkat akurasi tinggi berdasarkan pola historis, cuaca, dan event lokal.',
                  },
                  {
                    q: 'Bagaimana cara membatalkan booking?',
                    a: 'Buka halaman Profil > Booking Mendatang > klik Batalkan.',
                  },
                ]).map((faq) => (
              <details key={faq.q} className="group">
                <summary className="flex items-center justify-between cursor-pointer py-2 text-sm font-semibold text-on-surface">
                  {faq.q}
                  <Icon
                    name="expand_more"
                    size="20px"
                    className="text-on-surface-variant group-open:rotate-180 transition-transform"
                  />
                </summary>
                <p className="text-xs text-on-surface-variant pb-2 pl-1">{faq.a}</p>
              </details>
            ))}
          </div>
          <a
            href="mailto:support@wastra.id"
            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary rounded-xl py-3 font-bold text-sm hover:bg-primary-container transition-colors"
          >
            <Icon name="mail" size="18px" />
            {lang === 'en' ? 'Contact Support' : 'Hubungi Support'}
          </a>
        </div>
      </SettingsModal>

      <SettingsModal
        title={t('profil.modals.appearance')}
        isOpen={activeModal === 'appearance'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-on-surface">
                {lang === 'en' ? 'Dark Mode' : 'Mode Gelap'}
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {lang === 'en' ? 'Coming soon' : 'Akan segera hadir'}
              </p>
            </div>
            <div className="w-11 h-6 rounded-full bg-on-surface/10 relative opacity-50">
              <span className="absolute top-0.5 translate-x-0.5 w-5 h-5 rounded-full bg-white shadow" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface mb-3">
              {lang === 'en' ? 'Avatar Color' : 'Warna Avatar'}
            </p>
            <div className="flex gap-3">
              {avatarColors.map((color, i) => (
                <button
                  key={i}
                  onClick={() => {
                    handleAvatarChange(i)
                    setActiveModal(null)
                  }}
                  className={`w-10 h-10 rounded-full ${color} flex items-center justify-center ${
                    selectedAvatar === i ? 'ring-2 ring-offset-2 ring-primary' : ''
                  }`}
                >
                  {selectedAvatar === i && <Icon name="check" size="18px" className="text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SettingsModal>
    </div>
  )
}
