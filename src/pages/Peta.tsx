import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { destinations, type Destination } from '../data/destinations'
import Icon from '../components/Icon'
import { Link, useNavigate } from 'react-router-dom'
import { useWatchlist } from '../hooks/useWatchlist'
import ShinyText from '../components/reactbits/ShinyText'
import CountUp from '../components/reactbits/CountUp'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import Magnet from '../components/reactbits/Magnet'

const categoryValues = ['Semua', 'Pantai', 'Pura', 'Alam'] as const

function getDensityHex(density: number): string {
  if (density > 0.8) return '#ba1a1a'
  if (density > 0.6) return '#f97316'
  if (density > 0.3) return '#facc15'
  return '#10b981'
}

function createMarkerIcon(density: number): L.DivIcon {
  const size = Math.round(10 + density * 12)
  const color = getDensityHex(density)
  const pulse =
    density > 0.8
      ? `<div style="position:absolute;inset:-4px;border-radius:50%;background:${color};opacity:0.4;animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;"></div>`
      : ''

  return L.divIcon({
    className: '',
    iconSize: [size * 2, size * 2],
    iconAnchor: [size, size],
    popupAnchor: [0, -size],
    html: `
      <div style="position:relative;width:${size * 2}px;height:${size * 2}px;display:flex;align-items:center;justify-content:center;">
        ${pulse}
        <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);position:relative;z-index:1;"></div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.8); opacity: 0; }
        }
      </style>
    `,
  })
}

function ZoomControls() {
  const map = useMap()
  return (
    <div className="absolute bottom-8 left-8 z-20 hidden lg:flex flex-col gap-2">
      <button
        type="button"
        aria-label="Perbesar peta"
        onClick={() => map.zoomIn()}
        className="w-10 h-10 rounded-xl bg-surface-container-lowest/95 backdrop-blur shadow-lg flex items-center justify-center text-on-surface hover:bg-surface-container-lowest hover:scale-105 transition-all cursor-pointer"
      >
        <Icon name="add" />
      </button>
      <button
        type="button"
        aria-label="Perkecil peta"
        onClick={() => map.zoomOut()}
        className="w-10 h-10 rounded-xl bg-surface-container-lowest/95 backdrop-blur shadow-lg flex items-center justify-center text-on-surface hover:bg-surface-container-lowest hover:scale-105 transition-all cursor-pointer"
      >
        <Icon name="remove" />
      </button>
    </div>
  )
}

function MapEventHandler({
  onMarkerClick,
  filteredDests,
}: {
  onMarkerClick: (dest: Destination) => void
  filteredDests: Destination[]
}) {
  return (
    <>
      {filteredDests.map((dest) => (
        <Marker
          key={dest.id}
          position={[dest.lat, dest.lng]}
          icon={createMarkerIcon(dest.density)}
          eventHandlers={{
            click: () => onMarkerClick(dest),
          }}
        >
          <Popup>
            <span className="font-semibold">{dest.name}</span>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

export default function Peta() {
  const { t } = useTranslation()
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<(typeof categoryValues)[number]>('Semua')
  const { isWatchlisted, toggleWatchlist } = useWatchlist()
  const navigate = useNavigate()

  const categoryFiltered =
    activeCategory === 'Semua' ? destinations : destinations.filter((d) => d.category === activeCategory)

  const filteredDestinations = searchQuery
    ? categoryFiltered.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : null

  const calmSpots = destinations.filter((d) => d.density < 0.3).length
  const totalActiveUsers = destinations.reduce((sum, d) => sum + d.visitors, 0)

  const categoryLabels: Record<(typeof categoryValues)[number], string> = {
    Semua: t('common.categories.all'),
    Pantai: t('common.categories.beach'),
    Pura: t('common.categories.temple'),
    Alam: t('common.categories.nature'),
  }

  const legendItems = [
    { key: 'calm', label: t('peta.legend.calm'), color: '#10b981', ping: false },
    { key: 'moderate', label: t('peta.legend.moderate'), color: '#facc15', ping: false },
    { key: 'busy', label: t('peta.legend.busy'), color: '#f97316', ping: false },
    { key: 'veryBusy', label: t('peta.legend.veryBusy'), color: '#ba1a1a', ping: true },
  ]

  return (
    <div className="relative w-full h-full -mx-4 -mb-24 lg:-mx-10 lg:-my-8 w-[calc(100%+2rem)] lg:w-[calc(100%+5rem)]">
      {/* ===== MOBILE VIEW ===== */}
      <div className="lg:hidden relative w-full h-[calc(100vh-56px-80px)]">
        {/* Map */}
        <MapContainer
          center={[-8.4095, 115.1889]}
          zoom={10}
          zoomControl={false}
          className="w-full h-full z-0"
          style={{ background: '#e2d8d2' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapEventHandler onMarkerClick={setSelectedDestination} filteredDests={categoryFiltered} />
          <ZoomControls />
        </MapContainer>

        {/* Category Filter - Mobile */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {categoryValues.map((cat, i) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04 }}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md backdrop-blur-md transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-lowest/90 text-on-surface-variant'
              }`}
            >
              {categoryLabels[cat]}
            </motion.button>
          ))}
        </div>

        {/* Floating Legend */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-4 right-4 z-20 bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/60"
        >
          <div className="flex flex-col gap-1.5">
            {legendItems.map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  {item.ping && (
                    <div className="absolute inset-0 rounded-full animate-ping" style={{ background: item.color, opacity: 0.5 }} />
                  )}
                </div>
                <span className="text-[10px] text-on-surface-variant whitespace-nowrap">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom Sheet - Mobile */}
        {selectedDestination && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 z-30 bg-surface-container-lowest rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)]"
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-outline-variant" />
            </div>
            <div className="px-5 pb-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-on-surface font-headline">{selectedDestination.name}</h3>
                  <p className="text-sm text-on-surface-variant">
                    {selectedDestination.location} &middot; {categoryLabels[selectedDestination.category as (typeof categoryValues)[number]] ?? selectedDestination.category}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Tutup"
                  onClick={() => setSelectedDestination(null)}
                  className="p-1 rounded-full hover:bg-surface-container-high cursor-pointer"
                >
                  <Icon name="close" size="20px" className="text-on-surface-variant" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white"
                  style={{ background: getDensityHex(selectedDestination.density) }}
                >
                  <Icon name="groups" size="14px" />
                  {selectedDestination.densityLabel}
                </span>
                <span className="text-xs text-on-surface-variant">
                  <CountUp to={Math.round(selectedDestination.density * 100)} duration={1.2} />% {t('common.density.capacity', { percent: '' }).replace(/\s*%/, '').trim()}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Icon name="person" size="16px" className="text-on-surface-variant" />
                <span className="text-sm text-on-surface">
                  <strong>
                    <CountUp to={selectedDestination.visitors} separator="," duration={1.4} />
                  </strong>{' '}
                  / {selectedDestination.maxCapacity.toLocaleString('en-US')} {t('peta.popup.visitors', { count: '' }).replace(/\s*\{\{count\}\}/, '').trim()}
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-surface-container-high mb-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(selectedDestination.density * 100, 100)}%` }}
                  transition={{ duration: 0.7 }}
                  className="h-full rounded-full"
                  style={{ background: getDensityHex(selectedDestination.density) }}
                />
              </div>

              <div className="flex gap-2">
                <Magnet padding={30} magnetStrength={6} wrapperClassName="!flex-1">
                  <Link
                    to={`/app/destinasi/${selectedDestination.id}`}
                    className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-primary text-on-primary text-sm font-bold shadow-md shadow-primary/20"
                  >
                    <Icon name="info" size="18px" />
                    {t('peta.popup.viewDetails')}
                  </Link>
                </Magnet>
                <button
                  onClick={() => navigate(`/app/destinasi/${selectedDestination.id}`)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-outline text-on-surface text-sm font-bold cursor-pointer bg-transparent hover:bg-surface-container-low transition-colors"
                >
                  <Icon name="confirmation_number" size="18px" />
                  {t('common.details')}
                </button>
                <button
                  type="button"
                  aria-label={isWatchlisted(selectedDestination.id) ? 'Hapus dari watchlist' : 'Simpan ke watchlist'}
                  aria-pressed={isWatchlisted(selectedDestination.id)}
                  onClick={() => toggleWatchlist(selectedDestination.id)}
                  className="w-11 h-11 rounded-full border border-outline flex items-center justify-center cursor-pointer bg-transparent shrink-0 hover:bg-surface-container-low transition-colors"
                >
                  <Icon
                    name="bookmark"
                    filled={isWatchlisted(selectedDestination.id)}
                    size="20px"
                    className={isWatchlisted(selectedDestination.id) ? 'text-primary' : 'text-on-surface'}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ===== DESKTOP VIEW ===== */}
      <div className="hidden lg:block relative w-full h-[calc(100vh-64px)]">
        {/* Hero header strip — hidden when a destination is selected so the
            detail side card has the left rail to itself */}
        {!selectedDestination && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute top-10 left-8 z-30 max-w-md"
          >
            <SpotlightCard
              spotlightColor="rgba(0, 100, 124, 0.15)"
              className="bg-surface-container-lowest/95 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-white/60"
            >
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {t('peta.title')}
              </span>
              <h1 className="text-2xl font-extrabold font-headline text-on-surface mt-1.5">
                <ShinyText text={t('peta.title')} color="#1f1b17" shineColor="#00647c" speed={3} />
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">{t('peta.subtitle')}</p>

              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-outline-variant">
                <div>
                  <p className="text-xl font-extrabold text-on-surface font-headline">
                    <CountUp to={destinations.length} duration={1.4} />
                  </p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">{t('peta.stats.tracked')}</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-tertiary font-headline">
                    <CountUp to={totalActiveUsers} separator="," duration={1.8} />
                  </p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">{t('peta.stats.active')}</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-primary font-headline">
                    <CountUp to={calmSpots} duration={1.2} />
                  </p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">{t('peta.stats.calmSpots')}</p>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        )}

        {/* Floating Search - Desktop */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="absolute top-10 right-8 z-20 w-[420px]"
        >
          <div className="bg-surface-container-lowest/95 backdrop-blur-md rounded-full flex items-center gap-3 px-5 py-3 shadow-xl border border-white/60 focus-within:border-primary/40 transition-colors">
            <Icon name="search" className="text-on-surface-variant" size="22px" />
            <input
              type="text"
              placeholder={t('peta.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none flex-1 text-on-surface placeholder:text-outline"
            />
            {searchQuery && (
              <button type="button" aria-label="Hapus pencarian" onClick={() => setSearchQuery('')} className="cursor-pointer">
                <Icon name="close" className="text-on-surface-variant" size="20px" />
              </button>
            )}
          </div>
          {filteredDestinations && filteredDestinations.length > 0 && (
            <div className="mt-2 bg-surface-container-lowest rounded-2xl shadow-lg overflow-hidden max-h-72 overflow-y-auto border border-outline-variant">
              {filteredDestinations.map((dest) => (
                <button
                  key={dest.id}
                  onClick={() => {
                    setSelectedDestination(dest)
                    setSearchQuery('')
                  }}
                  className="w-full px-5 py-3 text-left hover:bg-surface-container-high flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: getDensityHex(dest.density) }} />
                  <div>
                    <p className="text-sm font-bold text-on-surface">{dest.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {dest.location} &middot; {dest.category}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Category Filter - Desktop */}
        <div className="absolute top-[100px] right-8 z-20 flex gap-2">
          {categoryValues.map((cat, i) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.04 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-md border border-white/40 transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-on-primary shadow-primary/20'
                  : 'bg-surface-container-lowest/95 text-on-surface-variant hover:bg-surface-container-lowest'
              }`}
            >
              {categoryLabels[cat]}
            </motion.button>
          ))}
        </div>

        {/* Full Map */}
        <MapContainer
          center={[-8.4095, 115.1889]}
          zoom={10}
          zoomControl={false}
          className="w-full h-full z-0"
          style={{ background: '#e2d8d2' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapEventHandler onMarkerClick={setSelectedDestination} filteredDests={categoryFiltered} />
          <ZoomControls />
        </MapContainer>

        {/* Side Card - Desktop */}
        {selectedDestination && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35 }}
            className="absolute left-8 bottom-32 z-20 w-80"
          >
            <SpotlightCard
              spotlightColor="rgba(0, 100, 124, 0.18)"
              className="bg-surface-container-lowest rounded-3xl shadow-2xl overflow-hidden border border-white/60"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={selectedDestination.image}
                  alt={selectedDestination.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <button
                  type="button"
                  aria-label="Tutup"
                  onClick={() => setSelectedDestination(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
                >
                  <Icon name="close" size="18px" className="text-white" />
                </button>
                <span
                  className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-md"
                  style={{ background: getDensityHex(selectedDestination.density) }}
                >
                  {selectedDestination.densityLabel}
                </span>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-extrabold text-on-surface mb-1 font-headline">
                  {selectedDestination.name}
                </h3>
                <p className="text-sm text-on-surface-variant mb-3">{selectedDestination.region}</p>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 text-tertiary">
                    <Icon name="star" filled size="16px" />
                    <span className="text-sm font-bold">{selectedDestination.rating}</span>
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    ({selectedDestination.reviewCount.toLocaleString('en-US')})
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2.5 py-1 rounded-full bg-surface-container text-xs font-medium text-on-surface-variant">
                    {selectedDestination.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container text-xs font-medium text-on-surface-variant">
                    {selectedDestination.distance}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container text-xs font-medium text-on-surface-variant">
                    {selectedDestination.ticketPrice}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-on-surface-variant mb-1">
                    <span>
                      <CountUp to={selectedDestination.visitors} separator="," duration={1.3} /> {t('peta.popup.visitors', { count: '' }).replace(/\s*\{\{count\}\}/, '').trim()}
                    </span>
                    <span className="font-bold">
                      <CountUp to={Math.round(selectedDestination.density * 100)} duration={1.2} />%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(selectedDestination.density * 100, 100)}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{ background: getDensityHex(selectedDestination.density) }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Magnet padding={30} magnetStrength={6} wrapperClassName="!flex-1">
                    <Link
                      to={`/app/destinasi/${selectedDestination.id}`}
                      className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-primary text-on-primary text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary-container transition-colors"
                    >
                      <Icon name="analytics" size="18px" />
                      {t('peta.popup.viewDetails')}
                    </Link>
                  </Magnet>
                  <button
                    type="button"
                    aria-label={isWatchlisted(selectedDestination.id) ? 'Hapus dari watchlist' : 'Simpan ke watchlist'}
                    aria-pressed={isWatchlisted(selectedDestination.id)}
                    onClick={() => toggleWatchlist(selectedDestination.id)}
                    className={`w-11 h-11 rounded-full border flex items-center justify-center cursor-pointer shrink-0 transition-colors ${
                      isWatchlisted(selectedDestination.id)
                        ? 'bg-primary/10 border-primary'
                        : 'border-outline bg-transparent hover:bg-surface-container-low'
                    }`}
                  >
                    <Icon
                      name="bookmark"
                      filled={isWatchlisted(selectedDestination.id)}
                      size="20px"
                      className={isWatchlisted(selectedDestination.id) ? 'text-primary' : 'text-on-surface'}
                    />
                  </button>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        )}

        {/* Legend Card - Desktop */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="absolute bottom-8 right-8 z-20 bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/60"
        >
          <div className="flex items-center gap-2 mb-3">
            <Icon name="info" size="16px" className="text-on-surface-variant" />
            <span className="text-xs font-bold text-on-surface uppercase tracking-wide">
              {t('peta.legend.title')}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {legendItems.map((item) => (
              <div key={item.key} className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center w-4 h-4">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  {item.ping && (
                    <div className="absolute inset-0 rounded-full animate-ping" style={{ background: item.color, opacity: 0.5 }} />
                  )}
                </div>
                <span className="text-xs text-on-surface-variant font-medium">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wide">Live</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
