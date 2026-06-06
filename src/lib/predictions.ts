import type { Destination } from '../data/destinations'

export interface DayPrediction {
  day: string
  dayShort: string
  date: string
  density: number
  visitors: number
  hasEvent: boolean
  eventName?: string
}

export interface HourPrediction {
  hour: string
  density: number
  visitors: number
}

export interface LocalEvent {
  name: string
  date: string
  impact: number
  description: string
}

export interface WeatherData {
  temp: number
  humidity: number
  wind: number
  condition: 'cerah' | 'berawan' | 'hujan_ringan' | 'hujan'
  icon: string
}

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const DAY_SHORT = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB']

const DAY_MULTIPLIERS: Record<number, number> = {
  0: 1.5, // Sunday
  1: 0.7,
  2: 0.75,
  3: 0.8,
  4: 0.85,
  5: 1.2, // Friday
  6: 1.6, // Saturday
}

const CATEGORY_HOUR_PROFILES: Record<string, number[]> = {
  Pura:   [0.2, 0.4, 0.7, 0.9, 1.0, 0.9, 0.8, 0.6, 0.5, 0.3, 0.2],
  Pantai: [0.1, 0.2, 0.4, 0.6, 0.8, 0.9, 1.0, 0.9, 0.7, 0.5, 0.3],
  Alam:   [0.3, 0.5, 0.7, 0.9, 1.0, 0.8, 0.7, 0.5, 0.4, 0.3, 0.2],
  Budaya: [0.2, 0.3, 0.5, 0.7, 0.9, 1.0, 0.9, 0.7, 0.5, 0.3, 0.2],
}

const HOUR_LABELS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function getLocalEvents(): LocalEvent[] {
  return [
    { name: 'Galungan', date: '2025-07-16', impact: 1.4, description: 'Hari raya Hindu Bali — keramaian meningkat di pura-pura besar' },
    { name: 'Kuningan', date: '2025-07-26', impact: 1.3, description: 'Penutupan siklus Galungan — peningkatan kunjungan pura' },
    { name: 'Bali Spirit Festival', date: '2025-05-08', impact: 1.5, description: 'Festival yoga & musik internasional di Ubud' },
    { name: 'Nyepi', date: '2026-03-19', impact: 0.1, description: 'Hari Raya Nyepi — seluruh aktivitas dihentikan' },
    { name: 'Ogoh-Ogoh Parade', date: '2026-03-18', impact: 1.6, description: 'Pawai ogoh-ogoh sehari sebelum Nyepi' },
    { name: 'Kuta Karnival', date: '2025-10-15', impact: 1.3, description: 'Festival budaya dan olahraga air di Pantai Kuta' },
  ]
}

export function generateWeeklyPrediction(destination: Destination): DayPrediction[] {
  const events = getLocalEvents()
  const today = new Date()
  const predictions: DayPrediction[] = []

  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dayOfWeek = date.getDay()
    const dateStr = date.toISOString().split('T')[0]

    const dayMult = DAY_MULTIPLIERS[dayOfWeek] || 1.0
    const jitter = 1 + (seededRandom(date.getTime() + destination.id.charCodeAt(0)) * 0.2 - 0.1)
    let density = destination.density * dayMult * jitter

    const event = events.find((e) => e.date === dateStr)
    if (event) {
      density *= event.impact
    }

    density = Math.min(1, Math.max(0.05, density))

    predictions.push({
      day: DAY_NAMES[dayOfWeek],
      dayShort: DAY_SHORT[dayOfWeek],
      date: dateStr,
      density,
      visitors: Math.round(density * destination.maxCapacity),
      hasEvent: !!event,
      eventName: event?.name,
    })
  }

  return predictions
}

export function generateHourlyPrediction(destination: Destination, dayOffset: number = 0): HourPrediction[] {
  const profile = CATEGORY_HOUR_PROFILES[destination.category] || CATEGORY_HOUR_PROFILES.Alam
  const today = new Date()
  today.setDate(today.getDate() + dayOffset)
  const dayMult = DAY_MULTIPLIERS[today.getDay()] || 1.0

  return profile.map((mult, i) => {
    const jitter = 1 + (seededRandom(today.getTime() + i + destination.id.charCodeAt(0)) * 0.15 - 0.075)
    const density = Math.min(1, Math.max(0.05, destination.density * mult * dayMult * jitter))
    return {
      hour: HOUR_LABELS[i],
      density,
      visitors: Math.round(density * destination.maxCapacity),
    }
  })
}

export function generateWeatherData(destination: Destination): WeatherData {
  const seed = destination.id.charCodeAt(0) + destination.id.charCodeAt(1)
  const r = seededRandom(seed + Date.now() / 86400000)

  const isHighland = destination.region.startsWith('Tabanan') || destination.region.startsWith('Bangli')
  const baseTemp = isHighland ? 24 : 30

  const conditions: WeatherData['condition'][] = ['cerah', 'berawan', 'hujan_ringan', 'hujan']
  const conditionIcons = { cerah: 'wb_sunny', berawan: 'cloud', hujan_ringan: 'grain', hujan: 'thunderstorm' }
  const condition = conditions[Math.floor(r * conditions.length)]

  return {
    temp: Math.round(baseTemp + (r * 6 - 3)),
    humidity: Math.round(65 + r * 25),
    wind: Math.round(8 + r * 15),
    condition,
    icon: conditionIcons[condition],
  }
}

export function getBestVisitTime(destination: Destination): string {
  const hourly = generateHourlyPrediction(destination)
  let minIdx = 0
  for (let i = 1; i < hourly.length; i++) {
    if (hourly[i].density < hourly[minIdx].density) minIdx = i
  }
  const endIdx = Math.min(minIdx + 1, hourly.length - 1)
  return `${hourly[minIdx].hour} - ${hourly[endIdx].hour}`
}

export function estimateWaitTime(density: number): string {
  if (density < 0.3) return '< 5 menit'
  if (density < 0.5) return '~10 menit'
  if (density < 0.7) return '~20 menit'
  if (density < 0.85) return '~35 menit'
  return '~50 menit'
}
