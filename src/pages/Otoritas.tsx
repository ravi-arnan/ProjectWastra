import { useMemo } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import Icon from '../components/Icon'
import { destinations, getDensityBgColor, type Destination } from '../data/destinations'
import { generateWeeklyPrediction } from '../lib/predictions'

type Lang = 'en' | 'id'

const BANDS = [
  { key: 'veryBusy', min: 0.8, color: 'bg-error', text: 'text-error', id: 'Sangat Ramai', en: 'Very Busy' },
  { key: 'busy', min: 0.6, color: 'bg-tertiary', text: 'text-tertiary', id: 'Ramai', en: 'Busy' },
  { key: 'moderate', min: 0.3, color: 'bg-amber-500', text: 'text-amber-600', id: 'Sedang', en: 'Moderate' },
  { key: 'calm', min: -1, color: 'bg-primary', text: 'text-primary', id: 'Sepi', en: 'Calm' },
] as const

function bandOf(density: number) {
  return BANDS.find((b) => density > b.min) ?? BANDS[BANDS.length - 1]
}

export default function Otoritas() {
  const { i18n } = useTranslation()
  const lang: Lang = i18n.language === 'en' ? 'en' : 'id'

  const stats = useMemo(() => {
    const totalVisitors = destinations.reduce((s, d) => s + d.visitors, 0)
    const totalCapacity = destinations.reduce((s, d) => s + d.maxCapacity, 0)
    const avgDensity = destinations.reduce((s, d) => s + d.density, 0) / destinations.length
    const critical = destinations.filter((d) => d.density > 0.8).length
    const calm = destinations.filter((d) => d.density <= 0.3).length

    const bandCounts = BANDS.map((b) => ({
      ...b,
      count: destinations.filter((d) => bandOf(d.density).key === b.key).length,
    }))

    const byRegency = Object.values(
      destinations.reduce<Record<string, { regency: string; count: number; visitors: number; densitySum: number }>>(
        (acc, d) => {
          const r = (acc[d.location] ??= { regency: d.location, count: 0, visitors: 0, densitySum: 0 })
          r.count += 1
          r.visitors += d.visitors
          r.densitySum += d.density
          return acc
        },
        {},
      ),
    )
      .map((r) => ({ ...r, avgDensity: r.densitySum / r.count }))
      .sort((a, b) => b.avgDensity - a.avgDensity)

    const byCategory = Object.values(
      destinations.reduce<Record<string, { category: string; count: number; densitySum: number }>>((acc, d) => {
        const c = (acc[d.category] ??= { category: d.category, count: 0, densitySum: 0 })
        c.count += 1
        c.densitySum += d.density
        return acc
      }, {}),
    )
      .map((c) => ({ ...c, avgDensity: c.densitySum / c.count }))
      .sort((a, b) => b.avgDensity - a.avgDensity)

    const pressure = [...destinations].sort((a, b) => b.density - a.density)

    // Aggregate predicted visitors per day across all destinations.
    const perDest = destinations.map((d) => generateWeeklyPrediction(d))
    const days = perDest[0] ?? []
    const weekly = days.map((_, i) => ({
      dayShort: days[i].dayShort,
      date: days[i].date,
      visitors: perDest.reduce((s, w) => s + (w[i]?.visitors ?? 0), 0),
    }))

    // Distribution opportunity: steer from the busiest icon to the calmest
    // same-category alternative — the product's core thesis.
    const busiest = pressure[0]
    const alt = destinations
      .filter((d) => d.category === busiest.category && d.id !== busiest.id)
      .sort((a, b) => a.density - b.density)[0] as Destination | undefined

    return {
      totalVisitors,
      totalCapacity,
      avgDensity,
      utilization: totalVisitors / totalCapacity,
      critical,
      calm,
      bandCounts,
      byRegency,
      byCategory,
      pressure,
      weekly,
      busiest,
      alt,
    }
  }, [])

  const maxRegencyVisitors = Math.max(...stats.byRegency.map((r) => r.visitors))
  const maxWeekly = Math.max(...stats.weekly.map((w) => w.visitors), 1)

  const kpis = [
    {
      icon: 'travel_explore',
      label: lang === 'en' ? 'Destinations' : 'Destinasi',
      value: destinations.length.toString(),
      tint: 'text-primary',
    },
    {
      icon: 'groups',
      label: lang === 'en' ? 'Live visitors' : 'Pengunjung live',
      value: stats.totalVisitors.toLocaleString(),
      tint: 'text-tertiary',
    },
    {
      icon: 'speed',
      label: lang === 'en' ? 'Avg. density' : 'Rata-rata keramaian',
      value: `${Math.round(stats.avgDensity * 100)}%`,
      tint: stats.avgDensity > 0.6 ? 'text-error' : 'text-amber-600',
    },
    {
      icon: 'warning',
      label: lang === 'en' ? 'Overcrowded (>80%)' : 'Kritis (>80%)',
      value: stats.critical.toString(),
      tint: 'text-error',
    },
  ]

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-6xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-1">
          <Icon name="insights" size="16px" />
          {lang === 'en' ? 'Authority Insights' : 'Wawasan Otoritas'}
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-on-surface font-headline">
          {lang === 'en' ? 'Visitor Distribution Dashboard' : 'Dashboard Sebaran Pengunjung'}
        </h1>
        <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
          {lang === 'en'
            ? 'Island-wide crowd distribution across regencies and categories — to support staffing, crowd control, and steering visitors toward quieter sites.'
            : 'Sebaran keramaian se-pulau menurut kabupaten dan kategori — untuk membantu penjadwalan, pengendalian kerumunan, dan mengarahkan pengunjung ke lokasi yang lebih tenang.'}
        </p>
      </motion.div>

      {/* KPI band */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-stone-200/60 bg-surface-container-lowest p-4 flex flex-col gap-1"
          >
            <Icon name={k.icon} size="20px" className={k.tint} />
            <span className="text-2xl font-extrabold text-on-surface font-headline mt-1">{k.value}</span>
            <span className="text-[11px] text-on-surface-variant leading-tight">{k.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Density distribution + utilization */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel icon="donut_small" title={lang === 'en' ? 'Crowd distribution' : 'Sebaran keramaian'}>
          <div className="flex h-3 w-full rounded-full overflow-hidden mb-4">
            {stats.bandCounts.map((b) =>
              b.count > 0 ? (
                <div
                  key={b.key}
                  className={b.color}
                  style={{ width: `${(b.count / destinations.length) * 100}%` }}
                  title={`${lang === 'en' ? b.en : b.id}: ${b.count}`}
                />
              ) : null,
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {stats.bandCounts.map((b) => (
              <div key={b.key} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${b.color}`} />
                <span className="text-xs text-on-surface-variant flex-1">{lang === 'en' ? b.en : b.id}</span>
                <span className="text-sm font-bold text-on-surface">{b.count}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel icon="data_usage" title={lang === 'en' ? 'Island capacity load' : 'Beban kapasitas pulau'}>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-extrabold text-on-surface font-headline leading-none">
              {Math.round(stats.utilization * 100)}%
            </span>
            <span className="text-xs text-on-surface-variant mb-1">
              {stats.totalVisitors.toLocaleString()} / {stats.totalCapacity.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden mt-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(stats.utilization * 100, 100)}%` }}
              transition={{ duration: 0.8 }}
              className={`h-full rounded-full ${getDensityBgColor(stats.utilization)}`}
            />
          </div>
          <p className="text-xs text-on-surface-variant mt-3">
            {lang === 'en'
              ? `${stats.calm} of ${destinations.length} sites are calm and have headroom for visitors right now.`
              : `${stats.calm} dari ${destinations.length} lokasi sedang sepi dan punya ruang untuk pengunjung saat ini.`}
          </p>
        </Panel>
      </div>

      {/* By regency */}
      <Panel icon="map" title={lang === 'en' ? 'By regency' : 'Per kabupaten'}>
        <div className="flex flex-col gap-3">
          {stats.byRegency.map((r) => (
            <div key={r.regency} className="flex items-center gap-3">
              <span className="w-24 sm:w-28 text-sm font-semibold text-on-surface truncate shrink-0">{r.regency}</span>
              <div className="flex-1 h-6 rounded-lg bg-surface-container-high overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(r.visitors / maxRegencyVisitors) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7 }}
                  className={`h-full ${getDensityBgColor(r.avgDensity)} flex items-center justify-end pr-2`}
                >
                  <span className="text-[10px] font-bold text-white whitespace-nowrap">
                    {r.visitors.toLocaleString()}
                  </span>
                </motion.div>
              </div>
              <span className="w-14 text-right text-xs font-bold text-on-surface-variant shrink-0">
                {Math.round(r.avgDensity * 100)}%
              </span>
            </div>
          ))}
        </div>
      </Panel>

      {/* By category + capacity pressure */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel icon="category" title={lang === 'en' ? 'By category' : 'Per kategori'}>
          <div className="flex flex-col gap-3">
            {stats.byCategory.map((c) => (
              <div key={c.category} className="flex items-center gap-3">
                <span className="w-24 text-sm font-semibold text-on-surface truncate shrink-0">{c.category}</span>
                <div className="flex-1 h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${c.avgDensity * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className={`h-full rounded-full ${getDensityBgColor(c.avgDensity)}`}
                  />
                </div>
                <span className="w-10 text-right text-xs font-bold text-on-surface-variant shrink-0">
                  {Math.round(c.avgDensity * 100)}%
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel icon="priority_high" title={lang === 'en' ? 'Capacity pressure' : 'Tekanan kapasitas'}>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto no-scrollbar">
            {stats.pressure.map((d) => {
              const occ = Math.min(d.visitors / d.maxCapacity, 1)
              return (
                <div key={d.id} className="flex items-center gap-2.5">
                  <span className="flex-1 text-xs font-medium text-on-surface truncate">{d.name}</span>
                  <div className="w-24 h-2 rounded-full bg-surface-container-high overflow-hidden shrink-0">
                    <div className={`h-full rounded-full ${getDensityBgColor(d.density)}`} style={{ width: `${occ * 100}%` }} />
                  </div>
                  <span className="w-9 text-right text-[11px] font-bold text-on-surface-variant shrink-0">
                    {Math.round(d.density * 100)}%
                  </span>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      {/* 7-day aggregate forecast */}
      <Panel icon="show_chart" title={lang === 'en' ? '7-day island forecast' : 'Prakiraan pulau 7 hari'}>
        <div className="flex items-end gap-2 sm:gap-3 h-36">
          {stats.weekly.map((w, i) => (
            <div key={w.date} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-bold text-on-surface-variant">{(w.visitors / 1000).toFixed(1)}k</span>
              <div className="w-full flex-1 flex items-end">
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: `${(w.visitors / maxWeekly) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary-container"
                />
              </div>
              <span className="text-[10px] text-on-surface-variant">{w.dayShort}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Distribution opportunity insight */}
      {stats.alt && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-primary/30 bg-primary/5 p-5 flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary grid place-items-center shrink-0">
            <Icon name="lightbulb" size="20px" />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">
              {lang === 'en' ? 'Distribution opportunity' : 'Peluang penyebaran'}
            </p>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              {lang === 'en' ? (
                <>
                  <span className="font-bold text-error">{stats.busiest.name}</span> is at{' '}
                  {Math.round(stats.busiest.density * 100)}%. Steer visitors toward{' '}
                  <span className="font-bold text-primary">{stats.alt.name}</span> (
                  {Math.round(stats.alt.density * 100)}%, same category) to relieve pressure.
                </>
              ) : (
                <>
                  <span className="font-bold text-error">{stats.busiest.name}</span> berada di{' '}
                  {Math.round(stats.busiest.density * 100)}%. Arahkan pengunjung ke{' '}
                  <span className="font-bold text-primary">{stats.alt.name}</span> (
                  {Math.round(stats.alt.density * 100)}%, kategori sama) untuk mengurangi tekanan.
                </>
              )}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function Panel({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-stone-200/60 bg-surface-container-lowest p-4 sm:p-5"
    >
      <h2 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
        <Icon name={icon} size="18px" className="text-primary" />
        {title}
      </h2>
      {children}
    </motion.div>
  )
}
