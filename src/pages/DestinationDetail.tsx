import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { destinations, getDensityTextColor, getDensityBgColor } from '../data/destinations'
import Icon from '../components/Icon'
import BookingModal from '../components/BookingModal'
import ReviewModal from '../components/ReviewModal'
import GuestGateModal from '../components/GuestGateModal'
import { useWatchlist } from '../hooks/useWatchlist'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { generateHourlyPrediction, generateWeeklyPrediction, generateWeatherData, getBestVisitTime, estimateWaitTime } from '../lib/predictions'
import { showToast } from '../components/Toast'

function getDensityBadgeLabel(density: number): string {
  if (density > 0.8) return 'Sangat Padat'
  if (density > 0.6) return 'Ramai'
  if (density > 0.3) return 'Sedang'
  return 'Sepi'
}

export default function DestinationDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { i18n } = useTranslation()
  const lang = i18n.language
  const isGuest = !user || user.is_anonymous
  const [bookingOpen, setBookingOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [guestGateOpen, setGuestGateOpen] = useState(false)
  const { isWatchlisted, toggleWatchlist } = useWatchlist()

  const handleBookClick = () => {
    if (isGuest) {
      setGuestGateOpen(true)
    } else {
      setBookingOpen(true)
    }
  }

  const destination = destinations.find((d) => d.id === id)
  if (!destination) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
        <Icon name="explore_off" size="48px" className="text-outline" />
        <h2 className="text-xl font-headline font-bold text-on-surface">Destinasi tidak ditemukan</h2>
        <p className="text-on-surface-variant text-center">
          Destinasi yang Anda cari tidak tersedia atau telah dihapus.
        </p>
        <Link to="/app" className="mt-4 px-6 py-3 bg-primary text-on-primary rounded-full font-label font-semibold">
          Kembali ke Beranda
        </Link>
      </div>
    )
  }

  const densityPercent = Math.round(destination.density * 100)
  const densityColor = getDensityTextColor(destination.density)
  const densityBg = getDensityBgColor(destination.density)
  const badgeLabel = getDensityBadgeLabel(destination.density)
  const alternatives = destinations.filter((d) => d.density < 0.4 && d.id !== destination.id)
  const circumference = 2 * Math.PI * 40
  const dashOffset = circumference - (destination.density * circumference)

  const strokeColorClass =
    destination.density > 0.8 ? 'stroke-error'
    : destination.density > 0.6 ? 'stroke-tertiary'
    : destination.density > 0.3 ? 'stroke-amber-500'
    : 'stroke-primary'

  const fullStars = Math.floor(destination.rating)
  const hasHalf = destination.rating % 1 >= 0.25
  const watched = isWatchlisted(destination.id)

  const weather = generateWeatherData(destination)
  const bestTime = getBestVisitTime(destination)
  const waitTime = estimateWaitTime(destination.density)
  const hourlyData = generateHourlyPrediction(destination)
  const weeklyData = generateWeeklyPrediction(destination)

  const weatherConditionLabel: Record<string, string> = {
    cerah: 'Cerah', berawan: 'Berawan', hujan_ringan: 'Gerimis', hujan: 'Hujan',
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: destination!.name, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      showToast('Link disalin!')
    }
  }

  // These are single-use render helpers (not components) so they stay as plain
  // function calls — defining them as components inside render would give each
  // a fresh identity every render and remount the whole subtree.
  const heroImage = (height: string, rounded?: string) => (
    <div className={`relative w-full ${height} overflow-hidden ${rounded || ''}`}>
      <img src={destination.image} alt={destination.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <Link to="/app" className="w-10 h-10 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white">
          <Icon name="arrow_back_ios_new" size="20px" />
        </Link>
        <button onClick={handleShare} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white">
          <Icon name="share" size="20px" />
        </button>
      </div>
      <div className="absolute bottom-6 left-5 right-5">
        <h1 className="text-2xl lg:text-3xl font-headline font-bold text-white drop-shadow-lg">{destination.name}</h1>
        <div className="flex items-center gap-1.5 mt-1 text-white/90 text-sm">
          <Icon name="location_on" size="16px" />
          <span>{destination.region}</span>
        </div>
        <p className="text-white/80 text-sm mt-1">{destination.description}</p>
      </div>
    </div>
  )

  const densityGauge = () => (
    <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0">
      <circle cx="48" cy="48" r="40" fill="none" className="stroke-surface-container-high" strokeWidth="8" />
      <circle cx="48" cy="48" r="40" fill="none" className={strokeColorClass} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={dashOffset} transform="rotate(-90 48 48)" />
      <text x="48" y="44" textAnchor="middle" dominantBaseline="central" className={`${densityColor} font-headline font-bold`} fontSize="22">{densityPercent}%</text>
      <text x="48" y="62" textAnchor="middle" className="fill-on-surface-variant" fontSize="9">kapasitas</text>
    </svg>
  )

  const statusCard = () => (
    <div className="mx-4 -mt-5 relative z-10 bg-surface-container-lowest rounded-2xl shadow-lg p-4">
      <div className="flex items-center gap-4">
        {densityGauge()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`${densityColor} text-2xl font-headline font-bold`}>{densityPercent}%</span>
            <span className={`${densityBg} text-white text-xs font-semibold px-2.5 py-0.5 rounded-full`}>{badgeLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant text-sm">
            <Icon name="group" size="16px" />
            <span>{destination.visitors.toLocaleString('id-ID')} / {destination.maxCapacity.toLocaleString('id-ID')} pengunjung</span>
          </div>
          {destination.density > 0.7 && <p className="text-xs text-error mt-1.5 font-medium">Hampir mencapai kapasitas maksimum</p>}
        </div>
      </div>
    </div>
  )

  const weatherStrip = () => (
    <div className="mx-4 mt-3 bg-surface-container-low rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name={weather.icon} size="20px" className="text-amber-500" />
          <div>
            <span className="text-sm font-semibold text-on-surface">{weather.temp}°C</span>
            <span className="text-xs text-on-surface-variant ml-1">{weatherConditionLabel[weather.condition]}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="water_drop" size="20px" className="text-primary" />
          <div>
            <span className="text-sm font-semibold text-on-surface">{weather.humidity}%</span>
            <span className="text-xs text-on-surface-variant ml-1">Lembap</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="air" size="20px" className="text-on-surface-variant" />
          <div>
            <span className="text-sm font-semibold text-on-surface">{weather.wind} km/j</span>
            <span className="text-xs text-on-surface-variant ml-1">Angin</span>
          </div>
        </div>
      </div>
    </div>
  )

  const crowdVisualization = () => (
    <div className="mx-4 mt-3 bg-surface-container-high rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline font-bold text-on-surface">Visualisasi Keramaian Real-Time</h3>
        <span className="flex items-center gap-1.5 bg-error text-white text-xs font-bold px-2.5 py-1 rounded-full pulse-red">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />LIVE
        </span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Icon name="schedule" size="18px" /><span>Estimasi waktu tunggu</span>
          </div>
          <span className="font-semibold text-on-surface">{waitTime}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Icon name="wb_twilight" size="18px" /><span>Waktu terbaik</span>
          </div>
          <span className="font-semibold text-primary">{bestTime}</span>
        </div>
      </div>
    </div>
  )

  const infoGrid = () => (
    <div className="grid grid-cols-2 gap-3">
      {[
        { icon: 'schedule', label: 'Jam Buka', value: destination.openHours },
        { icon: 'confirmation_number', label: 'Tiket Masuk', value: destination.ticketPrice },
        { icon: 'local_parking', label: 'Parkir', value: destination.parking },
        { icon: 'pin_drop', label: 'Lokasi', value: destination.region },
      ].map((item) => (
        <div key={item.label} className="bg-surface-container-low rounded-2xl p-3.5 flex flex-col gap-1.5">
          <Icon name={item.icon} size="20px" className="text-primary" />
          <span className="text-xs text-on-surface-variant">{item.label}</span>
          <span className="text-sm font-semibold text-on-surface leading-tight">{item.value}</span>
        </div>
      ))}
    </div>
  )

  const ratingCard = () => (
    <div className="bg-surface-container-lowest rounded-2xl p-5 flex flex-col items-center text-center">
      <div className="flex items-center gap-1 mb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Icon key={i} name="star" filled={i < fullStars || (i === fullStars && hasHalf)} size="24px"
            className={i < fullStars || (i === fullStars && hasHalf) ? 'text-amber-500' : 'text-outline-variant'} />
        ))}
      </div>
      <span className="text-3xl font-headline font-bold text-on-surface mt-1">{destination.rating}</span>
      <span className="text-sm text-on-surface-variant">{destination.reviewCount.toLocaleString('id-ID')} ulasan</span>
      <button onClick={() => setReviewOpen(true)} className="mt-3 px-5 py-2 border border-outline rounded-full text-sm font-semibold text-primary">
        Tulis Ulasan
      </button>
    </div>
  )

  const alternativeDestinations = () => (
    <div>
      <h3 className="font-headline font-bold text-on-surface mb-3">Alternatif Lebih Sepi</h3>
      <div className="flex gap-3 overflow-x-auto no-scrollbar lg:flex-col lg:overflow-x-visible">
        {alternatives.map((alt) => (
          <Link key={alt.id} to={`/app/destinasi/${alt.id}`} className="shrink-0 w-44 lg:w-full rounded-2xl overflow-hidden bg-surface-container-lowest shadow-sm">
            <div className="relative h-28">
              <img src={alt.image} alt={alt.name} className="w-full h-full object-cover" />
              <span className={`absolute top-2 right-2 ${getDensityBgColor(alt.density)} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                {getDensityBadgeLabel(alt.density)}
              </span>
            </div>
            <div className="p-2.5">
              <p className="text-sm font-semibold text-on-surface truncate">{alt.name}</p>
              <p className="text-xs text-on-surface-variant">{alt.distance}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )

  const bottomActionBar = () => (
    <div className="fixed bottom-20 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-outline-variant px-4 py-3 flex items-center justify-between lg:hidden">
      <div className="flex gap-2">
        <Link to="/app/peta" className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-outline text-sm font-semibold text-on-surface">
          <Icon name="sensors" size="18px" className="text-error" />Live
        </Link>
        <button onClick={() => toggleWatchlist(destination.id)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-outline text-sm font-semibold text-on-surface">
          <Icon name="bookmark" filled={watched} size="18px" />
          {watched ? 'Tersimpan' : 'Watchlist'}
        </button>
      </div>
      <button onClick={handleBookClick} className="px-5 py-2.5 bg-primary text-on-primary rounded-full font-semibold text-sm shadow-md">
        Pesan Tiket
      </button>
    </div>
  )

  const hourlyChart = () => (
    <div>
      <h4 className="font-headline font-semibold text-on-surface mb-3">Distribusi Keramaian Per Jam</h4>
      <div className="flex items-end gap-1.5 h-32">
        {hourlyData.map((h) => {
          const pct = Math.round(h.density * 100)
          return (
            <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full relative flex-1 flex items-end">
                <div className={`w-full rounded-t ${pct > 80 ? 'bg-error' : pct > 60 ? 'bg-tertiary' : pct > 30 ? 'bg-amber-500' : 'bg-primary'}`}
                  style={{ height: `${pct}%` }} />
              </div>
              <span className="text-[10px] text-on-surface-variant">{h.hour.split(':')[0]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  const weeklyOutlook = () => (
    <div>
      <h4 className="font-headline font-semibold text-on-surface mb-3">Perkiraan 7 Hari</h4>
      <div className="space-y-2">
        {weeklyData.map((d) => {
          const pct = Math.round(d.density * 100)
          return (
            <div key={d.date} className="flex items-center gap-3">
              <span className="text-xs text-on-surface-variant w-8">{d.dayShort}</span>
              <div className="flex-1 h-3 bg-surface-container-high rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${pct > 80 ? 'bg-error' : pct > 60 ? 'bg-tertiary' : pct > 30 ? 'bg-amber-500' : 'bg-primary'}`}
                  style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-semibold text-on-surface w-8 text-right">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  const visitPlanningCard = () => (
    <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
      <h3 className="font-headline font-bold text-on-surface mb-4">Visit Planning</h3>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant">Tiket Masuk</span>
          <span className="font-semibold text-on-surface">{destination.ticketPrice}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant">Waktu Terbaik</span>
          <span className="font-semibold text-primary">{bestTime}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant">Estimasi Tunggu</span>
          <span className="font-semibold text-on-surface">{waitTime}</span>
        </div>
      </div>
      <div className="flex gap-2 mt-5">
        <button onClick={handleBookClick}
          className="flex-1 py-3 bg-primary text-on-primary rounded-full font-semibold text-sm shadow-md">
          Pesan Tiket
        </button>
        <button onClick={() => toggleWatchlist(destination.id)}
          className={`w-12 h-12 rounded-full border flex items-center justify-center ${watched ? 'bg-primary/10 border-primary text-primary' : 'border-outline text-on-surface'}`}>
          <Icon name="bookmark" filled={watched} size="20px" />
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* MOBILE VIEW */}
      <div className="lg:hidden pb-32">
        {heroImage('h-[280px]')}
        {statusCard()}
        {weatherStrip()}
        {crowdVisualization()}
        <div className="px-4 mt-3">{infoGrid()}</div>
        <div className="px-4 mt-3">{ratingCard()}</div>
        <div className="px-4 mt-5">{alternativeDestinations()}</div>
        {bottomActionBar()}
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden lg:flex gap-6 max-w-7xl mx-auto p-6">
        <div className="flex-1 min-w-0 space-y-5">
          {heroImage('h-[480px]', 'rounded-[32px]')}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-5">
              {densityGauge()}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`${densityColor} text-3xl font-headline font-bold`}>{densityPercent}%</span>
                  <span className={`${densityBg} text-white text-xs font-semibold px-3 py-1 rounded-full`}>{badgeLabel}</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                  <Icon name="group" size="18px" />
                  <span>{destination.visitors.toLocaleString('id-ID')} / {destination.maxCapacity.toLocaleString('id-ID')} pengunjung</span>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <Icon name={weather.icon} size="22px" className="text-amber-500" />
                  <p className="text-sm font-semibold mt-1">{weather.temp}°C</p>
                  <p className="text-xs text-on-surface-variant">{weatherConditionLabel[weather.condition]}</p>
                </div>
                <div className="text-center">
                  <Icon name="water_drop" size="22px" className="text-primary" />
                  <p className="text-sm font-semibold mt-1">{weather.humidity}%</p>
                  <p className="text-xs text-on-surface-variant">Lembap</p>
                </div>
                <div className="text-center">
                  <Icon name="air" size="22px" className="text-on-surface-variant" />
                  <p className="text-sm font-semibold mt-1">{weather.wind} km/j</p>
                  <p className="text-xs text-on-surface-variant">Angin</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-5 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-on-surface text-lg">Analitik Keramaian</h3>
              <span className="flex items-center gap-1.5 bg-error text-white text-xs font-bold px-2.5 py-1 rounded-full pulse-red">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />LIVE
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-surface-container-low rounded-xl p-3">
                <Icon name="schedule" size="22px" className="text-on-surface-variant" />
                <p className="text-lg font-bold text-on-surface mt-1">{waitTime}</p>
                <p className="text-xs text-on-surface-variant">Waktu Tunggu</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3">
                <Icon name="wb_twilight" size="22px" className="text-primary" />
                <p className="text-lg font-bold text-primary mt-1">{bestTime}</p>
                <p className="text-xs text-on-surface-variant">Waktu Terbaik</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3">
                <Icon name="trending_up" size="22px" className="text-tertiary" />
                <p className="text-lg font-bold text-on-surface mt-1">+12%</p>
                <p className="text-xs text-on-surface-variant">vs Kemarin</p>
              </div>
            </div>
            {hourlyChart()}
            {weeklyOutlook()}
          </div>
          {ratingCard()}
        </div>
        <div className="w-[400px] shrink-0 space-y-5">
          {visitPlanningCard()}
          {infoGrid()}
          {alternativeDestinations()}
        </div>
      </div>

      <BookingModal destination={destination} isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
      <GuestGateModal
        isOpen={guestGateOpen}
        onClose={() => setGuestGateOpen(false)}
        action={lang === 'en' ? 'book a ticket' : 'memesan tiket'}
      />
      <ReviewModal destinationId={destination.id} destinationName={destination.name} isOpen={reviewOpen} onClose={() => setReviewOpen(false)} />
    </>
  )
}
