import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import Icon from '../components/Icon'
import { destinations, getDensityBgColor } from '../data/destinations'
import { useAuth, getUserDisplayName } from '../context/AuthContext'
import { filterByMood, getMoodMeta, MOODS, type Mood } from '../lib/moodMapping'
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../lib/storage'
import BlurText from '../components/reactbits/BlurText'
import ShinyText from '../components/reactbits/ShinyText'
import Magnet from '../components/reactbits/Magnet'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import GlareHover from '../components/reactbits/GlareHover'
import CountUp from '../components/reactbits/CountUp'

const categoryValues = ['Semua', 'Pantai', 'Pura', 'Alam', 'Desa Wisata'] as const

const HERO_IMAGE = '/highcompress_Tegalalang.jpg'

export default function Home() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [selectedMood, setSelectedMood] = useState<Mood | null>(() =>
    getStorageItem<Mood | null>(STORAGE_KEYS.LAST_MOOD, null)
  )
  const { user } = useAuth()
  const displayName = getUserDisplayName(user, t('profil.guest'))

  const categoryFiltered =
    activeCategory === 'Semua'
      ? destinations
      : destinations.filter((d) => d.category === activeCategory)

  const popularDestinations = categoryFiltered.slice(0, 3)

  const getRecommendations = () => {
    return [...destinations]
      .filter((d) => d.density < 0.5)
      .sort((a, b) => {
        const scoreA = (1 - a.density) * 0.5 + (a.rating / 5) * 0.3 + (1 - a.visitors / a.maxCapacity) * 0.2
        const scoreB = (1 - b.density) * 0.5 + (b.rating / 5) * 0.3 + (1 - b.visitors / b.maxCapacity) * 0.2
        return scoreB - scoreA
      })
  }

  const recommended = selectedMood
    ? filterByMood(destinations, selectedMood)
    : getRecommendations()
  const recommendedMobile = recommended.slice(0, 4)
  const desktopRecommended = recommended.slice(0, 3)

  const handleMoodSelect = (mood: Mood) => {
    const next = selectedMood === mood ? null : mood
    setSelectedMood(next)
    setStorageItem(STORAGE_KEYS.LAST_MOOD, next)
  }

  const recommendationSubtitle = selectedMood
    ? getMoodMeta(selectedMood).description
    : t('home.recommendations.subtitleDefault')

  const categoryLabels: Record<(typeof categoryValues)[number], string> = {
    Semua: t('common.categories.all'),
    Pantai: t('common.categories.beach'),
    Pura: t('common.categories.temple'),
    Alam: t('common.categories.nature'),
    'Desa Wisata': t('common.categories.culture'),
  }

  return (
    <div>
      {/* ===================== MOBILE VIEW ===================== */}
      <div className="lg:hidden flex flex-col gap-4 pb-6">
        {/* AI Analysis Banner */}
        <Link
          to="/app/ai-analysis"
          className="bg-gradient-to-r from-primary to-primary-container rounded-2xl p-4 flex items-center gap-3 text-white no-underline active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Icon name="auto_awesome" size="22px" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">
              <ShinyText text={t('home.ai.title')} color="#ffffff" shineColor="#a5f3fc" speed={3} />
            </p>
            <p className="text-[11px] text-white/80">{t('home.ai.desc')}</p>
          </div>
          <Icon name="arrow_forward" size="20px" />
        </Link>

        {/* Greeting Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-[#e0f2fe] to-[#f0fdf4] rounded-2xl p-5"
        >
          <BlurText
            text={t('home.greeting', { name: displayName })}
            as="h2"
            animateBy="words"
            delay={80}
            className="text-lg font-bold text-on-surface"
          />
          <p className="text-sm text-on-surface-variant mt-1">{t('home.greetingDesc')}</p>
          <div className="flex gap-2 mt-4">
            <span className="inline-flex items-center gap-1.5 bg-error/15 text-error text-xs font-bold px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-error" />
              <CountUp to={3} duration={1.2} /> {t('common.density.veryBusy')}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-tertiary/15 text-tertiary text-xs font-bold px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-tertiary" />
              <CountUp to={4} duration={1.4} /> {t('common.density.busy')}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <CountUp to={5} duration={1.6} /> {t('common.density.calm')}
            </span>
          </div>
        </motion.div>

        {/* Search Bar */}
        <div className="bg-surface-container-low rounded-xl flex items-center gap-2 px-4 py-3 focus-within:ring-2 focus-within:ring-primary/30 transition-shadow">
          <Icon name="search" className="text-on-surface-variant" size="20px" />
          <input
            type="text"
            placeholder={t('home.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant outline-none"
          />
          <Icon name="tune" className="text-on-surface-variant" size="20px" />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categoryValues.map((cat, i) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-full text-xs font-bold px-4 py-2 transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                  : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              {categoryLabels[cat]}
            </motion.button>
          ))}
        </div>

        {/* Destinasi Populer */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-on-surface">{t('home.popular')}</h3>
            <Link to="/app/destinasi" className="text-xs font-semibold text-primary">
              {t('common.viewAll')}
            </Link>
          </div>
          {popularDestinations.length === 0 ? (
            <div className="py-8 text-center">
              <Icon name="search_off" size="36px" className="text-on-surface-variant mx-auto mb-2" />
              <p className="text-xs text-on-surface-variant">{t('home.noResults', { defaultValue: 'Tidak ada destinasi untuk kategori ini' })}</p>
            </div>
          ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {popularDestinations.map((dest, i) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="shrink-0"
              >
                <Link
                  to={`/app/destinasi/${dest.id}`}
                  className="block w-[160px] h-[220px] rounded-2xl overflow-hidden relative shadow-sm active:scale-[0.98] transition-transform"
                >
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <span
                    className={`absolute top-2 right-2 ${getDensityBgColor(dest.density)} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}
                  >
                    {dest.densityLabel}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-bold leading-tight">{dest.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Icon name="location_on" className="text-white/80" size="12px" />
                      <span className="text-white/80 text-[10px]">{dest.location}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Icon name="directions_walk" className="text-white/80" size="12px" />
                      <span className="text-white/80 text-[10px]">{dest.distance}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          )}
        </div>

        {/* Rekomendasi untuk Kamu */}
        <div>
          <h3 className="text-base font-bold text-on-surface">{t('home.recommendations.title')}</h3>
          <p className="text-xs text-on-surface-variant mt-0.5 mb-3">
            {selectedMood ? t('home.recommendations.subtitleMood') : t('home.recommendations.subtitleDefault')}
          </p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
            {MOODS.map((mood, i) => {
              const meta = getMoodMeta(mood)
              const active = selectedMood === mood
              return (
                <motion.button
                  key={mood}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleMoodSelect(mood)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-full text-xs font-bold px-3.5 py-2 transition-colors ${
                    active
                      ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  <Icon name={meta.icon} size="16px" />
                  {meta.label}
                </motion.button>
              )
            })}
          </div>
          {selectedMood && (
            <p className="text-[11px] text-on-surface-variant mb-3">
              {recommendationSubtitle}
            </p>
          )}
          <div className="flex flex-col gap-3">
            {recommendedMobile.length === 0 && (
              <p className="text-sm text-on-surface-variant text-center py-6">
                {t('home.recommendations.empty')}
              </p>
            )}
            {recommendedMobile.map((dest, i) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
              >
                <Link
                  to={`/app/destinasi/${dest.id}`}
                  className="flex gap-3 bg-surface-container-low rounded-xl p-3 active:scale-[0.99] transition-transform"
                >
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="w-[72px] h-[72px] rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-on-surface truncate">{dest.name}</p>
                      <span className={`shrink-0 ${getDensityBgColor(dest.density)} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                        <CountUp to={Math.round(dest.density * 100)} duration={1.4} />%
                      </span>
                    </div>
                    {dest.density < 0.25 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1">
                        <Icon name="diamond" size="10px" />Hidden Gem
                      </span>
                    )}
                    <p className="text-[11px] text-emerald-600 font-medium mt-1">
                      {t('home.recommendations.calmNow', { percent: Math.round(dest.density * 100) })}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5">
                        <Icon name="star" className="text-amber-500" size="14px" />
                        <span className="text-xs text-on-surface-variant">{dest.rating}</span>
                      </div>
                      <span className="text-xs text-on-surface-variant">&middot; {dest.region}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ===================== DESKTOP VIEW ===================== */}
      <div className="hidden lg:flex flex-col gap-6 pb-8">
        {/* Welcome Banner */}
        <SpotlightCard
          spotlightColor="rgba(255,255,255,0.18)"
          className="relative w-full rounded-3xl h-[340px] bg-stone-900 overflow-hidden"
        >
          <img
            src={HERO_IMAGE}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-primary/20 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-center h-full px-10">
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full w-fit mb-4"
            >
              <Icon name="explore" size="16px" />
              {t('home.discoveryMode')}
            </motion.span>

            <BlurText
              text={t('home.greeting', { name: displayName })}
              as="h1"
              animateBy="words"
              delay={100}
              className="text-5xl font-extrabold text-white mb-2 font-headline"
            />

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-white/85 text-lg max-w-xl mb-6"
            >
              {t('home.greetingDesc')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="flex gap-3"
            >
              <Magnet padding={50} magnetStrength={5}>
                <Link to="/app/peta" className="bg-primary text-on-primary font-bold px-6 py-3 rounded-full text-sm flex items-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-container transition-colors">
                  <Icon name="map" size="18px" />
                  {t('home.ctaMap')}
                </Link>
              </Magnet>
              <Link to="/app/profil" className="bg-white/20 backdrop-blur-sm text-white font-bold px-6 py-3 rounded-full text-sm flex items-center gap-2 hover:bg-white/30 transition-colors">
                <Icon name="tune" size="18px" />
                {t('home.ctaPrefs')}
              </Link>
            </motion.div>
          </div>
        </SpotlightCard>

        {/* Filter Chips */}
        <div className="flex gap-2">
          {categoryValues.map((cat, i) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full text-sm font-bold px-5 py-2.5 transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {categoryLabels[cat]}
            </motion.button>
          ))}
        </div>

        {/* Destinasi Populer - Bento Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-on-surface">{t('home.popular')}</h2>
            <Magnet padding={30} magnetStrength={6}>
              <Link to="/app/destinasi" className="text-sm font-semibold text-primary hover:underline">
                {t('common.viewAll')} →
              </Link>
            </Magnet>
          </div>
          {popularDestinations.length === 0 ? (
            <div className="col-span-12 py-16 text-center">
              <Icon name="search_off" size="48px" className="text-on-surface-variant mx-auto mb-3" />
              <p className="text-sm text-on-surface-variant">{t('home.noResults', { defaultValue: 'Tidak ada destinasi untuk kategori ini' })}</p>
            </div>
          ) : (
          <div className="grid grid-cols-12 gap-4">
            {/* Large card */}
            {popularDestinations[0] && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className={popularDestinations.length === 1 ? 'col-span-12 h-[400px]' : 'col-span-8 h-[400px]'}
            >
              <Link
                to={`/app/destinasi/${popularDestinations[0].id}`}
                className="block w-full h-full rounded-3xl overflow-hidden relative group"
              >
                <GlareHover
                  width="100%"
                  height="100%"
                  borderRadius="1.5rem"
                  glareColor="#ffffff"
                  glareOpacity={0.4}
                  className="!grid-cols-1"
                >
                  <img
                    src={popularDestinations[0].image}
                    alt={popularDestinations[0].name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span
                    className={`absolute top-4 right-4 z-10 ${getDensityBgColor(popularDestinations[0].density)} text-white text-xs font-bold px-3 py-1 rounded-full`}
                  >
                    {popularDestinations[0].densityLabel}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <p className="text-white text-2xl font-bold font-headline">{popularDestinations[0].name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Icon name="location_on" className="text-white/80" size="16px" />
                      <span className="text-white/80 text-sm">{popularDestinations[0].region}</span>
                    </div>
                  </div>
                </GlareHover>
              </Link>
            </motion.div>
            )}

            {/* Small card */}
            {popularDestinations[1] && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="col-span-4 h-[400px]"
            >
              <Link
                to={`/app/destinasi/${popularDestinations[1].id}`}
                className="block w-full h-full rounded-3xl overflow-hidden relative group"
              >
                <GlareHover
                  width="100%"
                  height="100%"
                  borderRadius="1.5rem"
                  glareColor="#ffffff"
                  glareOpacity={0.4}
                  className="!grid-cols-1"
                >
                  <img
                    src={popularDestinations[1].image}
                    alt={popularDestinations[1].name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span
                    className={`absolute top-4 right-4 z-10 ${getDensityBgColor(popularDestinations[1].density)} text-white text-xs font-bold px-3 py-1 rounded-full`}
                  >
                    {popularDestinations[1].densityLabel}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <p className="text-white text-xl font-bold font-headline">{popularDestinations[1].name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Icon name="location_on" className="text-white/80" size="16px" />
                      <span className="text-white/80 text-sm">{popularDestinations[1].region}</span>
                    </div>
                  </div>
                </GlareHover>
              </Link>
            </motion.div>
            )}
          </div>
          )}
        </div>

        {/* Rekomendasi */}
        <div>
          <h2 className="text-xl font-bold text-on-surface mb-1">{t('home.recommendations.title')}</h2>
          <p className="text-sm text-on-surface-variant mb-4">
            {recommendationSubtitle}
          </p>
          <div className="flex gap-2 mb-6 flex-wrap">
            {MOODS.map((mood, i) => {
              const meta = getMoodMeta(mood)
              const active = selectedMood === mood
              return (
                <motion.button
                  key={mood}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleMoodSelect(mood)}
                  className={`flex items-center gap-2 rounded-full text-sm font-bold px-5 py-2.5 transition-colors ${
                    active
                      ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <Icon name={meta.icon} size="18px" />
                  {meta.label}
                </motion.button>
              )
            })}
          </div>
          {desktopRecommended.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-10 bg-surface-container-low rounded-2xl">
              {t('home.recommendations.emptyDesktop')}
            </p>
          ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {desktopRecommended.map((dest, i) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <SpotlightCard
                  spotlightColor="rgba(0, 100, 124, 0.18)"
                  className="bg-surface-container-low rounded-2xl flex flex-col h-full border border-stone-200/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="relative h-[180px] rounded-t-2xl overflow-hidden">
                    <GlareHover
                      width="100%"
                      height="100%"
                      borderRadius="0"
                      glareColor="#ffffff"
                      glareOpacity={0.35}
                      className="!grid-cols-1"
                    >
                      <img
                        src={dest.image}
                        alt={dest.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <span className={`absolute top-3 left-3 z-10 ${dest.density <= 0.25 ? 'bg-primary' : 'bg-tertiary'} text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide`}>
                        {dest.density <= 0.25 ? 'Hidden Gem' : 'Sepi'}
                      </span>
                    </GlareHover>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-base font-bold text-on-surface">{dest.name}</h3>
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                      {t('home.recommendations.calmNow', { percent: Math.round(dest.density * 100) })}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Icon name="star" className="text-amber-500" size="16px" />
                      <span className="text-sm font-semibold text-on-surface">{dest.rating}</span>
                      <span className="text-xs text-on-surface-variant ml-1">
                        ({dest.reviewCount})
                      </span>
                    </div>
                    <div className="mt-auto pt-4">
                      <Link
                        to={`/app/destinasi/${dest.id}`}
                        className="inline-flex items-center justify-center w-full gap-2 bg-primary text-on-primary text-sm font-bold px-4 py-2.5 rounded-full hover:bg-primary-container transition-colors"
                      >
                        <Icon name="directions" size="18px" />
                        {t('home.recommendations.detailRoute')}
                      </Link>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
