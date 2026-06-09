import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import Icon from '../../components/Icon'
import { destinations, getDensityBgColor, getDensityTextColor } from '../../data/destinations'
import CountUp from '../../components/reactbits/CountUp'
import SpotlightCard from '../../components/reactbits/SpotlightCard'
import { useAuth } from '../../context/AuthContext'

type SortKey = 'density-desc' | 'density-asc' | 'name' | 'visitors'

export default function DashboardOverview() {
  const { isLocalManager, localManagerDestId } = useAuth()
  const [sortKey, setSortKey] = useState<SortKey>('density-desc')
  const [filterCategory, setFilterCategory] = useState('Semua')

  // Filter destinations based on role BEFORE doing any calculations
  const filteredDestinations = useMemo(() => {
    return isLocalManager && localManagerDestId 
      ? destinations.filter(d => d.id === localManagerDestId)
      : destinations;
  }, [isLocalManager, localManagerDestId])

  // ── KPI calculations ──
  const totalVisitors = filteredDestinations.reduce((s, d) => s + d.visitors, 0)
  const avgDensity = filteredDestinations.reduce((s, d) => s + d.density, 0) / (filteredDestinations.length || 1)
  const criticalCount = filteredDestinations.filter((d) => d.density > 0.8).length
  const calmCount = filteredDestinations.filter((d) => d.density < 0.3).length

  // ── Filtered & sorted list ──
  const filteredSorted = useMemo(() => {
    const list = filterCategory === 'Semua'
      ? [...filteredDestinations]
      : filteredDestinations.filter((d) => d.category === filterCategory)

    switch (sortKey) {
      case 'density-desc': list.sort((a, b) => b.density - a.density); break
      case 'density-asc': list.sort((a, b) => a.density - b.density); break
      case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'visitors': list.sort((a, b) => b.visitors - a.visitors); break
    }
    return list
  }, [sortKey, filterCategory, filteredDestinations])

  const categories = ['Semua', ...Array.from(new Set(filteredDestinations.map((d) => d.category)))]

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      {/* ── Header ── */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl lg:text-3xl font-extrabold text-on-surface font-headline"
        >
          Real-Time Overview
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-sm text-on-surface-variant mt-1"
        >
          {isLocalManager 
              ? `Selamat datang, Pengelola ${destinations.find(d => d.id === localManagerDestId)?.name || 'Destinasi'}. Berikut adalah ringkasan performa wisata hari ini.`
              : 'Ringkasan performa dan pergerakan wisatawan di seluruh destinasi Indonesia hari ini.'}
        </motion.p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon="groups"
          label="Total Pengunjung"
          value={totalVisitors}
          suffix=" orang"
          color="primary"
          delay={0}
        />
        <KpiCard
          icon="speed"
          label="Rata-rata Kepadatan"
          value={Math.round(avgDensity * 100)}
          suffix="%"
          color={avgDensity > 0.6 ? 'tertiary' : avgDensity > 0.3 ? 'amber-600' : 'primary'}
          delay={0.05}
        />
        <KpiCard
          icon="warning"
          label="Sangat Ramai"
          value={criticalCount}
          suffix=" destinasi"
          color="error"
          delay={0.1}
        />
        <KpiCard
          icon="self_improvement"
          label="Sepi / Tenang"
          value={calmCount}
          suffix=" destinasi"
          color="primary"
          delay={0.15}
        />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category filter chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`shrink-0 rounded-full text-xs font-bold px-3.5 py-1.5 transition-colors ${
                filterCategory === cat
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <select
          value={sortKey}
          aria-label="Urutkan destinasi"
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="bg-surface-container-low border-none rounded-lg text-xs font-semibold text-on-surface-variant px-3 py-2 outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
        >
          <option value="density-desc">Paling Ramai</option>
          <option value="density-asc">Paling Sepi</option>
          <option value="visitors">Pengunjung Terbanyak</option>
          <option value="name">Nama A-Z</option>
        </select>
      </div>

      {/* ── Density Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSorted.map((dest, i) => {
          const pct = Math.round(dest.density * 100)
          return (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.35 }}
            >
              <Link to={`/app/destinasi/${dest.id}`}>
                <SpotlightCard
                  spotlightColor={dest.density > 0.8 ? 'rgba(186,26,26,0.10)' : 'rgba(0,100,124,0.10)'}
                  className="bg-surface-container-lowest rounded-2xl p-4 border border-stone-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full"
                >
                  {/* Top row: image + info */}
                  <div className="flex gap-3 mb-3">
                    <img
                      src={dest.image}
                      alt={dest.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-sm font-bold text-on-surface truncate">{dest.name}</h3>
                        <span
                          className={`shrink-0 ${getDensityBgColor(dest.density)} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}
                        >
                          {dest.densityLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{dest.region}</p>
                      <p className="text-[11px] text-on-surface-variant">{dest.category} · {dest.openHours}</p>
                    </div>
                  </div>

                  {/* Density bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-on-surface-variant">Kepadatan</span>
                      <span className={`text-sm font-extrabold ${getDensityTextColor(dest.density)}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${getDensityBgColor(dest.density)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.03 + 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 text-[11px] text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <Icon name="person" size="13px" />
                      {dest.visitors.toLocaleString('id-ID')}/{dest.maxCapacity.toLocaleString('id-ID')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="star" size="13px" className="text-amber-500" />
                      {dest.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="confirmation_number" size="13px" />
                      {dest.ticketPrice}
                    </span>
                  </div>
                </SpotlightCard>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {filteredSorted.length === 0 && (
        <div className="text-center py-12">
          <Icon name="search_off" size="40px" className="text-on-surface-variant mx-auto mb-2" />
          <p className="text-sm text-on-surface-variant">Tidak ada destinasi untuk filter ini</p>
        </div>
      )}

    </div>
  )
}

/* ── Sub-components ── */

function KpiCard({
  icon,
  label,
  value,
  suffix,
  color,
  delay,
}: {
  icon: string
  label: string
  value: number
  suffix: string
  color: 'primary' | 'tertiary' | 'amber-600' | 'error'
  delay: number
}) {
  const colorMap = {
    primary: { bg: 'bg-primary/12', text: 'text-primary' },
    tertiary: { bg: 'bg-tertiary/12', text: 'text-tertiary' },
    'amber-600': { bg: 'bg-amber-600/12', text: 'text-amber-600' },
    error: { bg: 'bg-error/12', text: 'text-error' },
  }
  const { bg, text } = colorMap[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <SpotlightCard
        spotlightColor="rgba(0,100,124,0.08)"
        className="bg-surface-container-lowest rounded-2xl p-4 border border-stone-100"
      >
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
          <Icon name={icon} size="20px" className={text} />
        </div>
        <p className="text-[11px] text-on-surface-variant font-medium mb-1">{label}</p>
        <p className={`text-xl font-extrabold font-headline ${text}`}>
          <CountUp to={value} duration={1.5} />
          <span className="text-xs font-semibold text-on-surface-variant ml-0.5">{suffix}</span>
        </p>
      </SpotlightCard>
    </motion.div>
  )
}

