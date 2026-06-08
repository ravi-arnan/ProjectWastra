import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import Icon from '../components/Icon'
import { destinations, getDensityBgColor } from '../data/destinations'
import CountUp from '../components/reactbits/CountUp'
import SpotlightCard from '../components/reactbits/SpotlightCard'

const categoryValues = ['Semua', 'Pantai', 'Pura', 'Budaya', 'Alam', 'Desa Wisata'] as const

export default function Destinasi() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<(typeof categoryValues)[number]>('Semua')
  const [sortBy, setSortBy] = useState<'name' | 'density' | 'rating'>('name')

  const categoryLabels: Record<(typeof categoryValues)[number], string> = {
    Semua: t('common.categories.all'),
    Pantai: t('common.categories.beach'),
    Pura: t('common.categories.temple'),
    Budaya: t('common.categories.culture'),
    Alam: t('common.categories.nature'),
    'Desa Wisata': t('common.categories.village'),
  }

  const filtered = destinations
    .filter((d) => {
      const matchCategory = activeCategory === 'Semua' || d.category === activeCategory
      const matchSearch =
        !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.region.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchSearch
    })
    .sort((a, b) => {
      if (sortBy === 'density') return a.density - b.density
      if (sortBy === 'rating') return b.rating - a.rating
      return a.name.localeCompare(b.name)
    })

  return (
    <div className="flex flex-col gap-5 pb-8 lg:pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-on-surface font-headline">
            {t('destinasi.title', { defaultValue: 'Semua Destinasi' })}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t('destinasi.subtitle', {
              defaultValue: 'Jelajahi {{count}} destinasi wisata di Indonesia',
              count: destinations.length,
            })}
          </p>
        </div>
        <Link
          to="/app/bandingkan"
          className="shrink-0 flex items-center gap-1.5 bg-primary text-on-primary text-sm font-bold rounded-full px-4 py-2.5 shadow-md shadow-primary/20 hover:shadow-primary/30 transition-shadow"
        >
          <Icon name="compare_arrows" size="18px" />
          <span className="hidden sm:inline">{t('nav.compare', { defaultValue: 'Bandingkan' })}</span>
        </Link>
      </motion.div>

      {/* Search & Sort Bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="flex-1 bg-surface-container-low rounded-xl flex items-center gap-2 px-4 py-3 focus-within:ring-2 focus-within:ring-primary/30 transition-shadow">
          <Icon name="search" className="text-on-surface-variant" size="20px" />
          <input
            type="text"
            aria-label={t('a11y.search')}
            placeholder={t('destinasi.searchPlaceholder', { defaultValue: 'Cari destinasi...' })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant outline-none"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} aria-label="Hapus pencarian" className="cursor-pointer">
              <Icon name="close" className="text-on-surface-variant" size="18px" />
            </button>
          )}
        </div>
        <select
          value={sortBy}
          aria-label={t('a11y.sortBy')}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-surface-container-low text-on-surface text-sm font-medium rounded-xl px-4 py-3 outline-none cursor-pointer border-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="name">{t('destinasi.sortName', { defaultValue: 'Nama A-Z' })}</option>
          <option value="density">{t('destinasi.sortDensity', { defaultValue: 'Kepadatan Terendah' })}</option>
          <option value="rating">{t('destinasi.sortRating', { defaultValue: 'Rating Tertinggi' })}</option>
        </select>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 overflow-x-auto no-scrollbar"
      >
        {categoryValues.map((cat, i) => (
          <motion.button
            key={cat}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.04, duration: 0.3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 rounded-full text-sm font-bold px-4 py-2 transition-colors ${
              activeCategory === cat
                ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {categoryLabels[cat]}
          </motion.button>
        ))}
      </motion.div>

      {/* Results count */}
      <p className="text-xs text-on-surface-variant">
        {t('destinasi.showing', {
          defaultValue: 'Menampilkan {{count}} destinasi',
          count: filtered.length,
        })}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center"
        >
          <Icon name="search_off" size="48px" className="text-on-surface-variant mx-auto mb-3" />
          <p className="text-sm text-on-surface-variant">
            {t('destinasi.noResults', { defaultValue: 'Tidak ada destinasi yang ditemukan' })}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((dest, i) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
            >
              <SpotlightCard
                spotlightColor="rgba(0, 100, 124, 0.12)"
                className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-stone-200/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col"
              >
                <Link to={`/app/destinasi/${dest.id}`} className="flex flex-col h-full">
                  {/* Image */}
                  <div className="relative h-[180px] overflow-hidden">
                    <img
                      src={dest.image}
                      alt={dest.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <span
                      className={`absolute top-3 right-3 ${getDensityBgColor(dest.density)} text-white text-[10px] font-bold px-2.5 py-1 rounded-full`}
                    >
                      {dest.densityLabel}
                    </span>
                    <span className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {dest.category}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-base font-bold text-on-surface">{dest.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Icon name="location_on" className="text-on-surface-variant" size="14px" />
                      <span className="text-xs text-on-surface-variant">{dest.region}</span>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        <Icon name="star" className="text-amber-500" size="16px" />
                        <span className="text-sm font-semibold text-on-surface">{dest.rating}</span>
                        <span className="text-xs text-on-surface-variant">({dest.reviewCount.toLocaleString()})</span>
                      </div>
                      <span className="text-xs text-on-surface-variant">{dest.ticketPrice}</span>
                    </div>

                    {/* Density bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-on-surface-variant mb-1">
                        <span>
                          <CountUp to={dest.visitors} separator="," duration={1.2} /> pengunjung
                        </span>
                        <span className="font-bold">
                          <CountUp to={Math.round(dest.density * 100)} duration={1} />%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${Math.min(dest.density * 100, 100)}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className="h-full rounded-full"
                          style={{ background: dest.density > 0.8 ? '#ba1a1a' : dest.density > 0.6 ? '#f97316' : dest.density > 0.3 ? '#facc15' : '#10b981' }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-stone-200/60 text-[10px] text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <Icon name="schedule" size="12px" />
                        {dest.openHours}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="directions_walk" size="12px" />
                        {dest.distance}
                      </span>
                    </div>
                  </div>
                </Link>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
