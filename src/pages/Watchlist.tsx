import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import Icon from '../components/Icon'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import BlurText from '../components/reactbits/BlurText'
import { useWatchlist } from '../hooks/useWatchlist'
import { useWatchlistThresholds } from '../hooks/useWatchlistThresholds'
import { destinations, DENSITY_THRESHOLD_PRESETS } from '../data/destinations'

type View = 'grid' | 'list'

function densityColor(d: number): string {
  if (d > 0.7) return 'bg-error'
  if (d > 0.4) return 'bg-tertiary'
  return 'bg-primary'
}

/** Preset chips to pick the calm threshold that triggers an alert for a dest. */
function ThresholdControl({
  value,
  density,
  onChange,
  lang,
}: {
  value: number
  density: number
  onChange: (value: number) => void
  lang: string
}) {
  // A destination is "armed" when its density already sits at/below the chosen
  // threshold (alerts off when threshold is 0).
  const armed = value > 0 && density <= value
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] font-semibold text-on-surface-variant inline-flex items-center gap-1">
        <Icon name={armed ? 'notifications_active' : 'notifications'} size="13px" className={armed ? 'text-primary' : ''} />
        {lang === 'en' ? 'Alert when' : 'Alarm saat'}
      </span>
      {DENSITY_THRESHOLD_PRESETS.map((p) => {
        const active = value === p.value
        return (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            aria-pressed={active}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
              active
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
            title={p.hint}
          >
            {lang === 'en' ? p.labelEn : p.labelId}
          </button>
        )
      })}
    </div>
  )
}

export default function Watchlist() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const navigate = useNavigate()
  const { watchlist, removeFromWatchlist } = useWatchlist()
  const { getThreshold, setThreshold } = useWatchlistThresholds()
  const [view, setView] = useState<View>('grid')

  const saved = useMemo(
    () => destinations.filter((d) => watchlist.includes(d.id)),
    [watchlist]
  )

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-5xl">
      {/* Header */}
      <SpotlightCard
        spotlightColor="rgba(0, 100, 124, 0.15)"
        className="bg-linear-to-br from-surface-container-low via-white to-primary-fixed/30 rounded-4xl p-8 border border-stone-200/60"
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <Icon name="bookmark" filled size="24px" />
          </div>
          <div className="flex-1">
            <BlurText
              text={lang === 'en' ? 'Watchlist' : 'Watchlist'}
              as="h1"
              animateBy="letters"
              delay={50}
              className="text-3xl lg:text-4xl font-extrabold text-on-surface font-headline"
            />
            <p className="text-sm text-on-surface-variant mt-2 max-w-xl">
              {lang === 'en'
                ? 'Destinations you’ve saved. Tap a card to see details, or remove ones you’re no longer planning.'
                : 'Destinasi yang kamu simpan. Klik kartu untuk lihat detail, atau hapus yang sudah tidak direncanakan.'}
            </p>
          </div>
        </div>
      </SpotlightCard>

      {/* Toolbar: count + view toggle */}
      <div className="flex items-center justify-between">
        <span className="bg-surface-container-low rounded-full px-4 py-2 text-xs font-semibold text-on-surface">
          {saved.length} {lang === 'en' ? (saved.length === 1 ? 'destination' : 'destinations') : 'destinasi'}
        </span>
        {saved.length > 0 && (
          <div className="flex items-center gap-1 bg-surface-container-low rounded-full p-1">
            <button
              type="button"
              aria-label={lang === 'en' ? 'Grid view' : 'Tampilan grid'}
              onClick={() => setView('grid')}
              aria-pressed={view === 'grid'}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                view === 'grid' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
              title={lang === 'en' ? 'Grid view' : 'Tampilan grid'}
            >
              <Icon name="grid_view" size="18px" />
            </button>
            <button
              type="button"
              aria-label={lang === 'en' ? 'List view' : 'Tampilan list'}
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                view === 'list' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
              title={lang === 'en' ? 'List view' : 'Tampilan list'}
            >
              <Icon name="view_list" size="18px" />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      {saved.length === 0 ? (
        <SpotlightCard
          spotlightColor="rgba(0, 100, 124, 0.08)"
          className="bg-surface-container-lowest rounded-3xl p-12 border border-stone-100 flex flex-col items-center text-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon name="bookmark_border" size="32px" className="text-primary" />
          </div>
          <div className="max-w-sm">
            <h2 className="text-lg font-extrabold text-on-surface font-headline">
              {lang === 'en' ? 'No saved destinations yet' : 'Belum ada destinasi tersimpan'}
            </h2>
            <p className="text-sm text-on-surface-variant mt-2">
              {lang === 'en'
                ? 'Tap the bookmark on any destination card to add it here. Your watchlist follows you across Forecasts, Map, and Profile.'
                : 'Tap ikon bookmark di kartu destinasi untuk menambahkannya. Watchlist akan tampil di Forecast, Peta, dan Profil.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/app/destinasi')}
            className="bg-primary text-on-primary text-sm font-bold px-5 py-2.5 rounded-full inline-flex items-center gap-2 hover:bg-primary-container transition-colors"
          >
            <Icon name="explore" size="16px" />
            {lang === 'en' ? 'Browse destinations' : 'Jelajahi destinasi'}
          </button>
        </SpotlightCard>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map((d, i) => {
            const pct = Math.round(d.density * 100)
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-stone-100 hover:shadow-md transition-shadow group"
              >
                <button
                  onClick={() => navigate(`/app/destinasi/${d.id}`)}
                  className="w-full block text-left"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img src={d.image} alt={d.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                    <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 bg-white/95 text-on-surface text-[10px] font-bold px-2 py-1 rounded-full">
                      <span className={`w-1.5 h-1.5 rounded-full ${densityColor(d.density)}`} />
                      {d.densityLabel} · {pct}%
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-bold text-on-surface truncate">{d.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{d.location} · {d.category}</p>
                  </div>
                </button>
                <div className="px-4 pb-4 -mt-1 flex flex-col gap-2.5">
                  <ThresholdControl
                    value={getThreshold(d.id)}
                    density={d.density}
                    onChange={(v) => setThreshold(d.id, v)}
                    lang={lang}
                  />
                  <button
                    onClick={() => removeFromWatchlist(d.id)}
                    className="self-end text-xs font-bold text-error hover:underline inline-flex items-center gap-1"
                    title={lang === 'en' ? 'Remove from watchlist' : 'Hapus dari watchlist'}
                  >
                    <Icon name="bookmark_remove" size="14px" />
                    {lang === 'en' ? 'Remove' : 'Hapus'}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {saved.map((d, i) => {
            const pct = Math.round(d.density * 100)
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.25) }}
                className="bg-surface-container-lowest rounded-2xl border border-stone-100 flex flex-col gap-2.5 p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/app/destinasi/${d.id}`)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <img src={d.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{d.name}</p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {d.location} · {d.category}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${densityColor(d.density)}`} />
                        <span className="text-[10px] font-semibold text-on-surface-variant">
                          {d.densityLabel} · {pct}%
                        </span>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label={lang === 'en' ? 'Remove from watchlist' : 'Hapus dari watchlist'}
                    onClick={() => removeFromWatchlist(d.id)}
                    className="w-9 h-9 rounded-full bg-error/10 hover:bg-error/20 text-error flex items-center justify-center transition-colors shrink-0"
                    title={lang === 'en' ? 'Remove from watchlist' : 'Hapus dari watchlist'}
                  >
                    <Icon name="bookmark_remove" size="18px" />
                  </button>
                </div>
                <div className="pl-[68px]">
                  <ThresholdControl
                    value={getThreshold(d.id)}
                    density={d.density}
                    onChange={(v) => setThreshold(d.id, v)}
                    lang={lang}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
