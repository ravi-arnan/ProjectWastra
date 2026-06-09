import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import Icon from '../components/Icon'
import {
  destinations,
  getDensityBgColor, getDensityOnColor,
  type Destination,
} from '../data/destinations'
import {
  generateWeeklyPrediction,
  generateWeatherData,
  getBestVisitTime,
  estimateWaitTime,
} from '../lib/predictions'
import { parseTicketPrice } from '../lib/utils'

type Slot = 'a' | 'b'
type Winner = Slot | null

const WEATHER_LABEL: Record<string, { id: string; en: string }> = {
  cerah: { id: 'Cerah', en: 'Sunny' },
  berawan: { id: 'Berawan', en: 'Cloudy' },
  hujan_ringan: { id: 'Hujan Ringan', en: 'Light Rain' },
  hujan: { id: 'Hujan', en: 'Rainy' },
}

function densityLabelKey(d: number): string {
  if (d > 0.8) return 'veryBusy'
  if (d > 0.6) return 'busy'
  if (d > 0.3) return 'moderate'
  return 'calm'
}

/** Returns which slot wins, or null when tied. `lowerWins` flips the comparison. */
function pickWinner(a: number, b: number, lowerWins: boolean): Winner {
  if (a === b) return null
  const aWins = lowerWins ? a < b : a > b
  return aWins ? 'a' : 'b'
}

function parseKm(distance: string): number {
  const n = parseFloat(distance.replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : Infinity
}

export default function Bandingkan() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'id'
  const [params, setParams] = useSearchParams()

  const destA =
    destinations.find((d) => d.id === params.get('a')) ?? destinations[0]
  const destB =
    destinations.find((d) => d.id === params.get('b')) ?? destinations[1]

  function setDest(slot: Slot, id: string) {
    const next = new URLSearchParams(params)
    next.set(slot, id)
    setParams(next, { replace: true })
  }
  function swap() {
    const next = new URLSearchParams(params)
    next.set('a', destB.id)
    next.set('b', destA.id)
    setParams(next, { replace: true })
  }

  const weeklyA = useMemo(() => generateWeeklyPrediction(destA), [destA])
  const weeklyB = useMemo(() => generateWeeklyPrediction(destB), [destB])
  const weatherA = useMemo(() => generateWeatherData(destA), [destA])
  const weatherB = useMemo(() => generateWeatherData(destB), [destB])
  const avgA = weeklyA.reduce((s, d) => s + d.density, 0) / weeklyA.length
  const avgB = weeklyB.reduce((s, d) => s + d.density, 0) / weeklyB.length

  const rows: {
    icon: string
    label: string
    a: React.ReactNode
    b: React.ReactNode
    winner: Winner
  }[] = [
    {
      icon: 'groups',
      label: t('compare.metrics.density', { defaultValue: 'Kepadatan saat ini' }),
      a: `${Math.round(destA.density * 100)}% · ${t(`common.density.${densityLabelKey(destA.density)}`)}`,
      b: `${Math.round(destB.density * 100)}% · ${t(`common.density.${densityLabelKey(destB.density)}`)}`,
      winner: pickWinner(destA.density, destB.density, true),
    },
    {
      icon: 'star',
      label: t('compare.metrics.rating', { defaultValue: 'Rating' }),
      a: `${destA.rating} (${destA.reviewCount.toLocaleString()})`,
      b: `${destB.rating} (${destB.reviewCount.toLocaleString()})`,
      winner: pickWinner(destA.rating, destB.rating, false),
    },
    {
      icon: 'confirmation_number',
      label: t('compare.metrics.price', { defaultValue: 'Harga tiket' }),
      a: destA.ticketPrice,
      b: destB.ticketPrice,
      winner: pickWinner(
        parseTicketPrice(destA.ticketPrice),
        parseTicketPrice(destB.ticketPrice),
        true,
      ),
    },
    {
      icon: 'directions_walk',
      label: t('compare.metrics.distance', { defaultValue: 'Jarak' }),
      a: destA.distance,
      b: destB.distance,
      winner: pickWinner(parseKm(destA.distance), parseKm(destB.distance), true),
    },
    {
      icon: 'schedule',
      label: t('compare.metrics.bestTime', { defaultValue: 'Waktu terbaik' }),
      a: getBestVisitTime(destA),
      b: getBestVisitTime(destB),
      winner: null,
    },
    {
      icon: 'hourglass_top',
      label: t('compare.metrics.wait', { defaultValue: 'Estimasi antre' }),
      a: estimateWaitTime(destA.density),
      b: estimateWaitTime(destB.density),
      winner: pickWinner(destA.density, destB.density, true),
    },
    {
      icon: weatherA.icon,
      label: t('compare.metrics.weather', { defaultValue: 'Cuaca' }),
      a: `${weatherA.temp}° · ${WEATHER_LABEL[weatherA.condition][lang]}`,
      b: `${weatherB.temp}° · ${WEATHER_LABEL[weatherB.condition][lang]}`,
      winner: null,
    },
    {
      icon: 'calendar_month',
      label: t('compare.metrics.weeklyAvg', { defaultValue: 'Rata-rata 7 hari' }),
      a: `${Math.round(avgA * 100)}%`,
      b: `${Math.round(avgB * 100)}%`,
      winner: pickWinner(avgA, avgB, true),
    },
    {
      icon: 'open_in_full',
      label: t('compare.metrics.hours', { defaultValue: 'Jam buka' }),
      a: destA.openHours,
      b: destB.openHours,
      winner: null,
    },
    {
      icon: 'local_parking',
      label: t('compare.metrics.parking', { defaultValue: 'Parkir' }),
      a: destA.parking,
      b: destB.parking,
      winner: null,
    },
  ]

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-on-surface font-headline">
            {t('compare.title', { defaultValue: 'Bandingkan Destinasi' })}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t('compare.subtitle', {
              defaultValue: 'Pilih dua destinasi dan temukan yang paling tenang untuk rencana Anda.',
            })}
          </p>
        </div>
        <Link
          to="/app/destinasi"
          className="hidden sm:flex shrink-0 items-center gap-1.5 text-sm font-bold text-primary hover:underline"
        >
          <Icon name="grid_view" size="18px" />
          {t('compare.allDestinations', { defaultValue: 'Semua destinasi' })}
        </Link>
      </motion.div>

      {/* Destination pickers */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 items-stretch">
        <PickerCard dest={destA} slot="a" exclude={destB.id} onChange={setDest} t={t} />

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={swap}
            aria-label={t('compare.swap', { defaultValue: 'Tukar posisi' })}
            className="w-10 h-10 rounded-full bg-primary text-on-primary grid place-items-center shadow-md shadow-primary/25 hover:rotate-180 transition-transform duration-300"
          >
            <Icon name="swap_horiz" size="20px" />
          </button>
        </div>

        <PickerCard dest={destB} slot="b" exclude={destA.id} onChange={setDest} t={t} />
      </div>

      {/* Comparison table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden divide-y divide-outline-variant/50"
      >
        {/* Fixed-length, fixed-order list — index key is stable here and avoids
            remounting rows when t() labels change on language switch. */}
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 sm:px-4 py-3"
          >
            <ValueCell value={row.a} isWinner={row.winner === 'a'} align="right" />
            <div className="flex flex-col items-center gap-0.5 px-1 min-w-[84px] sm:min-w-[120px]">
              <Icon name={row.icon} size="16px" className="text-on-surface-variant" />
              <span className="text-[10px] sm:text-xs font-medium text-on-surface-variant text-center leading-tight">
                {row.label}
              </span>
            </div>
            <ValueCell value={row.b} isWinner={row.winner === 'b'} align="left" />
          </div>
        ))}
      </motion.div>

      {/* 7-day forecast comparison */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5"
      >
        <h2 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
          <Icon name="bar_chart" size="18px" className="text-primary" />
          {t('compare.forecastTitle', { defaultValue: 'Prakiraan keramaian 7 hari' })}
        </h2>
        <div className="flex flex-col gap-4">
          <ForecastRow name={destA.name} weekly={weeklyA} />
          <ForecastRow name={destB.name} weekly={weeklyB} />
        </div>
      </motion.div>
    </div>
  )
}

function PickerCard({
  dest,
  slot,
  exclude,
  onChange,
  t,
}: {
  dest: Destination
  slot: Slot
  exclude: string
  onChange: (slot: Slot, id: string) => void
  t: TFunction
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden flex flex-col">
      <div className="relative h-24 sm:h-32">
        <img src={dest.image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <span
          className={`absolute top-2 right-2 ${getDensityBgColor(dest.density)} ${getDensityOnColor(dest.density)} text-[9px] font-bold px-2 py-0.5 rounded-full`}
        >
          {dest.densityLabel}
        </span>
        <div className="absolute bottom-2 left-2.5 right-2.5">
          <p className="text-white font-bold text-sm leading-tight truncate">{dest.name}</p>
          <p className="text-white/80 text-[10px] truncate">{dest.region}</p>
        </div>
      </div>
      <label className="sr-only" htmlFor={`picker-${slot}`}>
        {t('compare.choose', { defaultValue: 'Pilih destinasi' })}
      </label>
      <select
        id={`picker-${slot}`}
        value={dest.id}
        onChange={(e) => onChange(slot, e.target.value)}
        className="bg-surface-container-low text-on-surface text-xs sm:text-sm font-semibold px-3 py-2.5 outline-none cursor-pointer border-none focus:ring-2 focus:ring-primary/30"
      >
        {destinations.map((d) => (
          <option key={d.id} value={d.id} disabled={d.id === exclude}>
            {d.name}
          </option>
        ))}
      </select>
    </div>
  )
}

function ValueCell({
  value,
  isWinner,
  align,
}: {
  value: React.ReactNode
  isWinner: boolean
  align: 'left' | 'right'
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors ${
        align === 'right' ? 'justify-end text-right' : 'justify-start text-left'
      } ${isWinner ? 'bg-primary/8 ring-1 ring-primary/30' : ''}`}
    >
      {isWinner && align === 'left' && (
        <Icon name="check_circle" size="14px" className="text-primary shrink-0" />
      )}
      <span
        className={`text-xs sm:text-sm leading-tight ${
          isWinner ? 'font-bold text-primary' : 'font-medium text-on-surface'
        }`}
      >
        {value}
      </span>
      {isWinner && align === 'right' && (
        <Icon name="check_circle" size="14px" className="text-primary shrink-0" />
      )}
    </div>
  )
}

function ForecastRow({
  name,
  weekly,
}: {
  name: string
  weekly: ReturnType<typeof generateWeeklyPrediction>
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-on-surface mb-1.5 truncate">{name}</p>
      <div className="flex items-end gap-1 sm:gap-2 h-20">
        {weekly.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="w-full flex-1 flex items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(d.density * 100, 4)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`w-full rounded-t-md ${getDensityBgColor(d.density)} ${
                  d.hasEvent ? 'ring-2 ring-amber-400/70' : ''
                }`}
                title={`${d.day}: ${Math.round(d.density * 100)}%${d.hasEvent ? ` · ${d.eventName}` : ''}`}
              />
            </div>
            <span className="text-[9px] text-on-surface-variant">{d.dayShort}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
