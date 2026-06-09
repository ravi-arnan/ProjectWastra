import { lazy, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import Magnet from '../components/reactbits/Magnet'
import BlurText from '../components/reactbits/BlurText'
import GradientText from '../components/reactbits/GradientText'
import StarBorder from '../components/reactbits/StarBorder'
import CountUp from '../components/reactbits/CountUp'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import GlareHover from '../components/reactbits/GlareHover'
import ScrollVelocity from '../components/reactbits/ScrollVelocity'
import ShinyText from '../components/reactbits/ShinyText'
import LazyVisible from '../components/LazyVisible'
import NewsletterForm from '../components/NewsletterForm'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

// Heavy, dependency-laden components kept out of the synchronous Landing chunk:
// Aurora + CircularGallery pull in `ogl` (WebGL), LiveMapPreview pulls in
// `leaflet`. They mount lazily on scroll.
const Aurora = lazy(() => import('../components/reactbits/Aurora'))
const CircularGallery = lazy(() => import('../components/reactbits/CircularGallery'))
const ScrollReveal = lazy(() => import('../components/reactbits/ScrollReveal'))
const LiveMapPreview = lazy(() => import('../components/LiveMapPreview'))


// WebP where a smaller variant exists (see scripts/optimize-media.mjs); the two
// already-tiny photos (Mengening, Penglipuran) stay as JPG.
const galleryItems = [
  { image: '/highcompress_TanahLot.webp', text: 'Tanah Lot' },
  { image: '/highcompress_Uluwatu.webp', text: 'Uluwatu' },
  { image: '/highcompress_Tegalalang.jpg', text: 'Tegallalang' },
  { image: '/highcompress_PantaiMengening.jpg', text: 'Mengening' },
  { image: '/highcompress_DesaPenglipuran.jpg', text: 'Penglipuran' },
  { image: '/highcompress_Bedugul.webp', text: 'Bedugul' },
  { image: '/highcompress_Besakih.webp', text: 'Besakih' },
  { image: '/highcompress_Kintamani.webp', text: 'Kintamani' },
  { image: '/highcompress_KutaBeach.webp', text: 'Kuta Beach' },
  { image: '/highcompress_PandawaBeach.webp', text: 'Pandawa' },
  { image: '/highcompress_SanurBeach.webp', text: 'Sanur' },
  { image: '/highcompress_UbudMonkeyForest.webp', text: 'Ubud Forest' },
]

const liveStatus = [
  {
    name: 'Uluwatu Temple',
    image: '/highcompress_Uluwatu.jpg',
    status: 'Peak Crowd (88%)',
    color: 'error' as const,
  },
  {
    name: 'Tegallalang Terraces',
    image: '/highcompress_Tegalalang.jpg',
    status: 'Ideal Visit (12%)',
    color: 'primary' as const,
  },
  {
    name: 'Tanah Lot Temple',
    image: '/highcompress_TanahLot.jpg',
    status: 'Calm (15%)',
    color: 'primary' as const,
  },
  {
    name: 'Pandawa Beach',
    image: '/highcompress_PandawaBeach.jpg',
    status: 'Moderate (54%)',
    color: 'tertiary' as const,
  },
]

export default function Landing() {
  const { t } = useTranslation()
  const reducedMotion = usePrefersReducedMotion()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navLinks = [
    { label: t('landing.nav.features'), href: '#features' },
    { label: t('landing.nav.destinations'), href: '#destinations' },
    { label: t('landing.nav.map'), href: '#map' },
  ]

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body overflow-x-hidden">
      {/* ==================== TOP NAV ==================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-14 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2">
            <Logo size={30} eager />
            <span className="text-xl font-extrabold text-primary font-headline tracking-tight">Wastra</span>
          </a>

          <div className="hidden md:flex items-center gap-1 font-headline font-medium text-sm tracking-tight">
            {navLinks.map((link) => (
              <Magnet key={link.label} padding={30} magnetStrength={6}>
                <a
                  href={link.href}
                  className="relative px-4 py-2 text-on-surface-variant hover:text-primary transition-colors group"
                >
                  {link.label}
                  <span className="absolute left-4 right-4 bottom-1 h-px bg-primary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                </a>
              </Magnet>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Magnet padding={60} magnetStrength={4}>
              <Link
                to="/auth"
                className="bg-primary hover:opacity-90 transition-opacity text-on-primary px-5 py-2 rounded-lg font-headline font-bold text-sm shadow-lg shadow-primary/20"
              >
                {t('landing.nav.accessApp')}
              </Link>
            </Magnet>
            <button
              type="button"
              className="md:hidden"
              aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Icon name={mobileMenuOpen ? 'close' : 'menu'} className="text-on-surface" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-nav" className="md:hidden bg-background/95 backdrop-blur-xl border-t border-outline-variant/50 px-6 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-on-surface-variant py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </nav>

      <main className="pt-14">
        {/* ==================== HERO ==================== */}
        <section className="relative h-[560px] sm:h-[640px] lg:h-[88vh] min-h-[640px] overflow-hidden mx-3 sm:mx-4 lg:mx-6 mt-3 rounded-2xl lg:rounded-3xl">
          {/* Video background */}
          <video
            src="/DanauBratan.mp4"
            poster="/DanauBratan-poster.jpg"
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover bg-on-surface"
          />
          {/* Aurora overlay shader — decorative WebGL, deferred off the critical path */}
          {!reducedMotion && (
            <LazyVisible className="absolute inset-0 opacity-50 mix-blend-screen pointer-events-none">
              <Aurora colorStops={['#00647c', '#6cd3f7', '#a5f3fc']} amplitude={1.2} blend={0.6} speed={0.8} />
            </LazyVisible>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Hero text */}
          <div className="relative z-10 h-full flex flex-col justify-end px-6 sm:px-10 lg:px-14 pb-10 lg:pb-16 max-w-3xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-1.5 bg-surface-container-lowest/15 backdrop-blur-sm text-white/90 text-[10px] font-bold px-3 py-1 rounded-full w-fit mb-5 uppercase tracking-widest"
            >
              {t('landing.hero.eyebrow')}
            </motion.span>

            <BlurText
              text={t('landing.hero.title1')}
              as="h1"
              animateBy="words"
              direction="top"
              delay={120}
              className="text-3xl sm:text-4xl lg:text-[56px] font-headline font-extrabold text-white leading-[1.05]"
            />
            <h1 className="text-3xl sm:text-4xl lg:text-[56px] font-headline font-extrabold leading-[1.05] mb-5">
              <GradientText
                colors={['#a5f3fc', '#6cd3f7', '#ffffff', '#6cd3f7', '#a5f3fc']}
                animationSpeed={6}
                className="!bg-clip-text"
              >
                {t('landing.hero.title2')}
              </GradientText>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="text-white/75 text-sm sm:text-base leading-relaxed mb-8 max-w-lg"
            >
              {t('landing.hero.subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="flex flex-wrap gap-3"
            >
              <StarBorder
                as={Link}
                to="/auth"
                color="#a5f3fc"
                speed="4s"
                innerClassName="bg-primary text-on-primary font-bold text-sm px-7 py-3 hover:opacity-95 transition-opacity"
              >
                {t('landing.hero.ctaPrimary')}
              </StarBorder>
              <a
                href="#map"
                className="bg-surface-container-lowest/15 backdrop-blur-sm text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-surface-container-lowest/25 transition-all border border-white/20 active:scale-95 inline-flex items-center"
              >
                {t('landing.hero.ctaSecondary')}
              </a>
            </motion.div>
          </div>

          {/* Floating stats overlay (desktop) */}
          <div className="hidden lg:flex absolute bottom-6 right-6 z-20 gap-3">
            {[
              { icon: 'groups', value: 50, suffix: 'K+', label: t('landing.hero.stats.users') },
              { icon: 'place', value: 200, suffix: '+', label: t('landing.hero.stats.destinations') },
              { icon: 'update', value: 5, suffix: 's', label: t('landing.hero.stats.refresh') },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 + i * 0.15 }}
                className="bg-surface-container-lowest/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3.5 text-white text-center"
              >
                <Icon name={stat.icon} size="20px" className="mb-1 opacity-80" />
                <p className="text-2xl font-extrabold leading-none flex items-baseline justify-center">
                  <CountUp to={stat.value} duration={2} />
                  <span>{stat.suffix}</span>
                </p>
                <p className="text-[10px] opacity-70 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ==================== FEATURES BENTO ==================== */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-20 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="mb-12 lg:mb-16 text-center"
          >
            <span className="text-xs font-bold text-primary uppercase tracking-widest">{t('landing.features.eyebrow')}</span>
            <h2 className="text-3xl lg:text-5xl font-headline font-extrabold text-on-surface mt-3">
              {t('landing.features.title')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            {/* Real-time density tracking */}
            <SpotlightCard
              spotlightColor="rgba(0, 100, 124, 0.2)"
              className="col-span-12 lg:col-span-7 bg-surface-container-low rounded-[1.5rem] lg:rounded-[2rem] p-7 lg:p-10 flex flex-col justify-between min-h-[340px] border border-outline-variant/60"
            >
              <div>
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white mb-5 shadow-lg shadow-primary/20">
                  <Icon name="speed" />
                </div>
                <h3 className="text-xl lg:text-2xl font-headline font-bold text-on-surface mb-3">
                  {t('landing.features.density.title')}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed max-w-md">
                  {t('landing.features.density.desc')}
                </p>
              </div>
              <div className="flex gap-3 mt-6 overflow-x-auto no-scrollbar">
                <div className="bg-surface-container-lowest p-3.5 rounded-xl min-w-[170px] shadow-sm border border-outline-variant hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-on-surface-variant tracking-wide">ULI KITCHEN</span>
                    <span className="bg-error/10 text-error px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">BUSY</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="bg-error h-full rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-3.5 rounded-xl min-w-[170px] shadow-sm border border-outline-variant hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-on-surface-variant tracking-wide">MELASTI BEACH</span>
                    <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">CALM</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: '20%' }} />
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* 7-day crowd forecasts */}
            <SpotlightCard
              spotlightColor="rgba(255, 255, 255, 0.25)"
              className="col-span-12 lg:col-span-5 bg-tertiary-container rounded-[1.5rem] lg:rounded-[2rem] p-7 lg:p-10 text-white flex flex-col justify-between min-h-[340px]"
            >
              <div>
                <div className="w-12 h-12 bg-surface-container-lowest/20 rounded-xl flex items-center justify-center mb-5 backdrop-blur">
                  <Icon name="analytics" />
                </div>
                <h3 className="text-xl lg:text-2xl font-headline font-bold mb-3">
                  {t('landing.features.forecast.title')}
                </h3>
                <p className="text-white text-sm leading-relaxed">
                  {t('landing.features.forecast.desc')}
                </p>
              </div>
              <div className="bg-black/10 backdrop-blur-sm rounded-xl p-5 mt-6 border border-white/10">
                <div className="flex items-end gap-2 h-24">
                  {[38, 55, 42, 80, 62, 48, 30].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: i * 0.07 }}
                      className={`flex-1 rounded-t-md ${i === 3 ? 'bg-surface-container-lowest' : 'bg-surface-container-lowest/40 hover:bg-surface-container-lowest/70 transition-colors'}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-3 text-[10px] font-bold uppercase">
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>
            </SpotlightCard>

            {/* AI-powered recommendations */}
            <SpotlightCard
              spotlightColor="rgba(0, 100, 124, 0.2)"
              className="col-span-12 bg-surface-container-highest rounded-[1.5rem] lg:rounded-[2rem] p-7 lg:p-10 border border-outline-variant/60"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-6 lg:gap-10">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center text-white mb-5 shadow-lg shadow-primary-container/30">
                    <Icon name="auto_awesome" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-headline font-bold text-on-surface mb-3">
                    {t('landing.features.ai.title')}
                  </h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-5 max-w-md">
                    {t('landing.features.ai.desc')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['#HiddenGems', '#QuietMorning', '#SurfReport'].map((tag) => (
                      <span
                        key={tag}
                        className="px-4 py-1.5 bg-surface-container-low text-on-surface-variant text-xs rounded-full font-medium hover:bg-primary/10 hover:text-primary transition-colors cursor-default"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <GlareHover
                    width="160px"
                    height="200px"
                    borderRadius="1rem"
                    glareColor="#ffffff"
                    glareOpacity={0.45}
                    className="hover:shadow-xl transition-shadow duration-300"
                  >
                    <img
                      src="/highcompress_PantaiMengening.jpg"
                      alt="Pantai Mengening"
                      className="w-full h-full object-cover"
                    />
                  </GlareHover>
                  <GlareHover
                    width="160px"
                    height="200px"
                    borderRadius="1rem"
                    glareColor="#ffffff"
                    glareOpacity={0.45}
                    className="hover:shadow-xl transition-shadow duration-300"
                  >
                    <img
                      src="/highcompress_DesaPenglipuran1.jpg"
                      alt="Desa Penglipuran"
                      className="w-full h-full object-cover"
                    />
                  </GlareHover>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </section>

        {/* ==================== DESTINATIONS GALLERY ==================== */}
        <section id="destinations" className="bg-stone-900 text-white py-20 lg:py-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mb-10 lg:mb-14">
            <span className="text-xs font-bold text-primary-fixed uppercase tracking-widest">{t('landing.destinations.eyebrow')}</span>
            <h2 className="text-3xl lg:text-5xl font-headline font-extrabold mt-3 max-w-3xl">
              <ShinyText
                text={t('landing.destinations.title1')}
                color="#cfe6ec"
                shineColor="#ffffff"
                speed={3}
              />{' '}
              <span className="text-primary-fixed-dim">{t('landing.destinations.title2')}</span>
            </h2>
            <p className="text-white/60 text-sm lg:text-base mt-4 max-w-xl">
              {t('landing.destinations.subtitle')}
            </p>
          </div>
          <LazyVisible
            className="h-[480px] lg:h-[600px] w-full"
            placeholder={
              <div className="h-full w-full flex items-center justify-center">
                <span className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
              </div>
            }
          >
            <CircularGallery
              items={galleryItems}
              bend={1.6}
              textColor="#ffffff"
              borderRadius={0.06}
              font="bold 22px Plus Jakarta Sans"
            />
          </LazyVisible>
        </section>

        {/* ==================== SCROLL VELOCITY MARQUEE ==================== */}
        {/* Decorative typographic texture (repeating place names) — hidden from
            assistive tech; its faded color is intentional and not content. */}
        <section aria-hidden="true" data-decorative className="bg-surface py-10 lg:py-14 border-y border-outline-variant/60">
          <ScrollVelocity
            texts={['Tanah Lot · Uluwatu · Tegallalang · Ubud · Mengening · Penglipuran ·']}
            velocity={60}
            numCopies={4}
            className="text-primary/40 font-headline font-extrabold text-4xl lg:text-7xl tracking-tight"
          />
        </section>

        {/* ==================== LIVE NOW ==================== */}
        <section id="map" className="bg-surface-container-low py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Left text + cards */}
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">{t('landing.live.eyebrow')}</span>
                <h2 className="text-3xl lg:text-5xl font-headline font-extrabold mt-3 mb-4">
                  <ShinyText text={t('landing.live.title')} color="#1f1b17" shineColor="#00647c" speed={2.5} />
                </h2>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-8 max-w-md">
                  {t('landing.live.desc')}
                </p>
                <div className="space-y-3">
                  {liveStatus.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-50px' }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className={`flex items-center gap-4 p-4 bg-surface-container-lowest rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ${
                        item.color === 'primary' ? 'border border-primary/15' : ''
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface">{item.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`w-2 h-2 rounded-full animate-pulse ${
                              item.color === 'error'
                                ? 'bg-error'
                                : item.color === 'tertiary'
                                ? 'bg-tertiary'
                                : 'bg-primary'
                            }`}
                          />
                          <span
                            className={`text-xs font-bold ${
                              item.color === 'error'
                                ? 'text-error'
                                : item.color === 'tertiary'
                                ? 'text-tertiary'
                                : 'text-primary'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right: real Leaflet map */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.7 }}
                className="relative isolate rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden shadow-2xl border-4 lg:border-8 border-white"
                style={{ minHeight: '500px', height: '500px' }}
              >
                <LazyVisible
                  className="absolute inset-0"
                  placeholder={<div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-surface-container to-tertiary/10" />}
                >
                  <LiveMapPreview />
                </LazyVisible>

                {/* Live badge */}
                <div className="absolute top-4 lg:top-6 left-4 lg:left-6 z-[400] flex items-center gap-2 bg-surface-container-lowest/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-slate-200">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                    Live Density Updates
                  </span>
                </div>

                {/* Open in app pill */}
                <Link
                  to="/auth"
                  className="absolute top-4 lg:top-6 right-4 lg:right-6 z-[400] inline-flex items-center gap-1.5 bg-primary text-on-primary px-3 py-1.5 rounded-full shadow-lg text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
                >
                  {t('landing.live.openMap')}
                  <Icon name="arrow_forward" size="14px" />
                </Link>

                {/* Legend */}
                <div className="absolute bottom-4 lg:bottom-6 left-4 lg:left-6 z-[400] bg-surface-container-lowest/90 backdrop-blur-md px-4 py-3 rounded-2xl flex flex-col gap-2 border border-white/40 shadow-xl">
                  {[
                    { color: 'bg-primary', label: 'CALM' },
                    { color: 'bg-tertiary', label: 'MODERATE' },
                    { color: 'bg-error', label: 'BUSY' },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                      <span className="text-[10px] font-bold text-on-surface uppercase tracking-tight">{l.label}</span>
                    </div>
                  ))}
                </div>

                {/* Active users */}
                <div className="absolute bottom-4 lg:bottom-6 right-4 lg:right-6 z-[400] bg-surface-container-lowest/90 backdrop-blur-md px-4 py-3 rounded-2xl flex items-center gap-3 border border-white/40 shadow-xl">
                  <div className="flex -space-x-2.5">
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 shadow-sm">JD</div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300 flex items-center justify-center text-[9px] font-bold text-slate-700 shadow-sm">AS</div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-primary text-on-primary flex items-center justify-center text-[9px] font-bold shadow-sm">+12</div>
                  </div>
                  <span className="text-[11px] font-bold text-on-surface">
                    <CountUp to={1204} separator="," duration={2.5} /> {t('landing.live.usersExploring')}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ==================== SCROLL REVEAL + CTA COMBO ==================== */}
        <section className="px-4 sm:px-6 lg:px-12 py-20 lg:py-28">
          <div className="max-w-5xl mx-auto mb-12 lg:mb-16">
            {reducedMotion ? (
              <p className="text-on-surface font-headline font-extrabold text-center text-[clamp(1.6rem,4vw,3rem)] leading-tight">
                {t('landing.scrollText')}
              </p>
            ) : (
              <LazyVisible
                placeholder={
                  <p className="text-on-surface/70 font-headline font-extrabold text-center text-[clamp(1.6rem,4vw,3rem)] leading-tight">
                    {t('landing.scrollText')}
                  </p>
                }
              >
                <ScrollReveal
                  baseOpacity={0.05}
                  baseRotation={2}
                  blurStrength={5}
                  containerClassName="!my-0"
                  textClassName="text-on-surface font-headline !font-extrabold !text-center"
                >
                  {t('landing.scrollText')}
                </ScrollReveal>
              </LazyVisible>
            )}
          </div>

          {/* CTA card */}
          <SpotlightCard
            spotlightColor="rgba(255, 255, 255, 0.3)"
            className="max-w-5xl mx-auto bg-primary py-12 lg:py-16 px-8 lg:px-14 rounded-[2rem] lg:rounded-[2.5rem] text-on-primary shadow-2xl"
          >
            {/* Aurora background layer — decorative WebGL, deferred off the critical path */}
            {!reducedMotion && (
              <LazyVisible className="absolute inset-0 opacity-50 pointer-events-none">
                <Aurora
                  colorStops={['#007f9d', '#6cd3f7', '#a5f3fc']}
                  amplitude={1.4}
                  blend={0.7}
                  speed={0.6}
                />
              </LazyVisible>
            )}
            <div className="absolute top-0 right-0 w-64 h-64 bg-surface-container-lowest/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-container/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-14 items-center">
              {/* Left: copy + CTAs */}
              <div className="text-center lg:text-left">
                {/* Social proof avatars */}
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-5">
                  <div className="flex -space-x-2">
                    {['/highcompress_Uluwatu.jpg', '/highcompress_Tegalalang.jpg', '/highcompress_PantaiMengening.jpg', '/highcompress_TanahLot.jpg'].map((src) => (
                      <div key={src} className="w-9 h-9 rounded-full border-2 border-white overflow-hidden shadow-lg">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1 text-on-primary">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Icon key={i} name="star" filled size="14px" className="text-tertiary-fixed-dim" />
                      ))}
                      <span className="ml-1 text-xs font-bold opacity-90">4.9</span>
                    </div>
                    <p className="text-[11px] opacity-90 leading-tight">{t('landing.cta.rating')}</p>
                  </div>
                </div>

                <h2 className="text-3xl lg:text-5xl font-headline font-extrabold mb-4 leading-[1.1]">
                  <ShinyText
                    text={t('landing.cta.title')}
                    color="#ffffff"
                    shineColor="#a5f3fc"
                    speed={3}
                  />
                </h2>
                <p className="text-base lg:text-lg opacity-85 mb-8 max-w-xl mx-auto lg:mx-0">
                  {t('landing.cta.subtitle', { count: '50,000' })}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center lg:justify-start">
                  <Magnet padding={70} magnetStrength={3}>
                    <StarBorder
                      as={Link}
                      to="/auth"
                      color="#a5f3fc"
                      speed="3.5s"
                      innerClassName="bg-surface-container-lowest text-primary px-8 py-4 font-headline font-bold text-base hover:bg-surface-container-lowest transition-colors"
                    >
                    {t('landing.cta.primary')}
                  </StarBorder>
                </Magnet>
              </div>

              {/* Trust signals */}
              <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-3 gap-4 text-center lg:text-left max-w-md mx-auto lg:mx-0">
                {[
                  { icon: 'bolt', label: t('landing.cta.trust.realtime') },
                  { icon: 'lock', label: t('landing.cta.trust.noLogin') },
                  { icon: 'favorite', label: t('landing.cta.trust.free') },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col lg:flex-row items-center gap-2 text-on-primary/80">
                    <Icon name={item.icon} size="18px" className="opacity-90" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: visual stack of destination cards */}
            <div className="hidden lg:block relative h-[400px]">
              <motion.div
                initial={{ opacity: 0, y: 30, rotate: -8 }}
                whileInView={{ opacity: 1, y: 0, rotate: -8 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="absolute top-0 left-0 w-44 h-56 rounded-2xl overflow-hidden shadow-2xl border-4 border-white"
              >
                <img src="/highcompress_TanahLot.jpg" alt="Tanah Lot" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-xs font-bold">Tanah Lot</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] text-white/90 font-bold">CALM · 15%</span>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30, rotate: 6 }}
                whileInView={{ opacity: 1, y: 0, rotate: 6 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.25 }}
                className="absolute top-10 right-0 w-44 h-56 rounded-2xl overflow-hidden shadow-2xl border-4 border-white"
              >
                <img src="/highcompress_Tegalalang.jpg" alt="Tegallalang" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-xs font-bold">Tegallalang</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] text-white/90 font-bold">IDEAL · 12%</span>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-60 rounded-2xl overflow-hidden shadow-2xl border-4 border-white z-10"
              >
                <img src="/highcompress_PantaiMengening.jpg" alt="Mengening" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-xs font-bold">Mengening</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[9px] text-white/90 font-bold">MODERATE · 47%</span>
                  </div>
                </div>
              </motion.div>
            </div>
            </div>
          </SpotlightCard>
        </section>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="relative w-full bg-stone-900 text-white overflow-hidden">
        {/* Subtle gradient accents */}
        <div className="absolute top-0 left-0 w-[420px] h-[420px] bg-primary/15 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-primary-container/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-16 lg:pt-20 pb-8">
          {/* Main grid */}
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 lg:gap-12 mb-12 lg:mb-16">
            {/* Brand */}
            <div className="col-span-2 md:col-span-4">
              <span className="inline-block text-2xl font-extrabold font-headline tracking-tight">
                <span className="text-primary-fixed-dim">W</span>astra
              </span>
              <p className="text-sm text-white/60 mt-3 leading-relaxed max-w-xs">
                {t('landing.footer.tagline')}
              </p>
              <div className="mt-5 flex items-center gap-3">
                {[
                  { name: 'Instagram', icon: 'photo_camera', href: 'https://instagram.com' },
                  { name: 'Twitter', icon: 'alternate_email', href: 'https://twitter.com' },
                  { name: 'GitHub', icon: 'code', href: 'https://github.com' },
                  { name: 'Email', icon: 'mail', href: 'mailto:support@wastra.id' },
                ].map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target={s.href.startsWith('http') ? '_blank' : undefined}
                    rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    aria-label={s.name}
                    className="w-9 h-9 rounded-full bg-surface-container-lowest/5 hover:bg-primary hover:scale-105 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all"
                  >
                    <Icon name={s.icon} size="16px" />
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div className="md:col-span-2">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-primary-fixed-dim mb-4">{t('landing.footer.product')}</h4>
              <ul className="space-y-2.5 text-sm text-white/70">
                <li><a href="#features" className="hover:text-white transition-colors">{t('landing.footer.links.features')}</a></li>
                <li><a href="#destinations" className="hover:text-white transition-colors">{t('landing.footer.links.destinations')}</a></li>
                <li><a href="#map" className="hover:text-white transition-colors">{t('landing.footer.links.liveMap')}</a></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">{t('landing.footer.links.getStarted')}</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div className="md:col-span-2">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-primary-fixed-dim mb-4">{t('landing.footer.company')}</h4>
              <ul className="space-y-2.5 text-sm text-white/70">
                <li><a href="#features" className="hover:text-white transition-colors">{t('landing.footer.links.about')}</a></li>
                <li><a href="mailto:support@wastra.id?subject=Partnership" className="hover:text-white transition-colors">{t('landing.footer.links.partners')}</a></li>
                <li><a href="mailto:support@wastra.id?subject=Press" className="hover:text-white transition-colors">{t('landing.footer.links.press')}</a></li>
                <li><a href="mailto:careers@wastra.id" className="hover:text-white transition-colors">{t('landing.footer.links.careers')}</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="col-span-2 md:col-span-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-primary-fixed-dim mb-4">{t('landing.footer.stayLoop')}</h4>
              <p className="text-sm text-white/60 mb-4 leading-relaxed">
                {t('landing.footer.newsletterDesc')}
              </p>
              <NewsletterForm />
              <div className="mt-5 inline-flex items-center gap-2 text-[11px] text-white/50">
                <Icon name="public" size="14px" />
                <span>{t('landing.footer.madeIn')}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent mb-6" />

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50">
            <p>{t('landing.footer.rights')}</p>
            <div className="flex gap-6">
              <Link className="hover:text-white transition-colors" to="/privacy">{t('landing.footer.links.privacy')}</Link>
              <Link className="hover:text-white transition-colors" to="/terms">{t('landing.footer.links.terms')}</Link>
              <Link className="hover:text-white transition-colors" to="/privacy">{t('landing.footer.links.cookies')}</Link>
              <a className="hover:text-white transition-colors" href="mailto:support@wastra.id">{t('landing.footer.links.support')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
