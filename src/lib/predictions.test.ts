import { describe, test, expect, vi } from 'vitest'
import {
  estimateWaitTime,
  generateWeeklyPrediction,
  generateHourlyPrediction,
  getBestVisitTime,
  getLocalEvents,
  generateWeatherData,
} from './predictions'
import { destinations } from '../data/destinations'

const sample = destinations[0]

describe('estimateWaitTime', () => {
  test('maps density ranges to wait-time buckets', () => {
    expect(estimateWaitTime(0.1)).toBe('< 5 menit')
    expect(estimateWaitTime(0.4)).toBe('~10 menit')
    expect(estimateWaitTime(0.6)).toBe('~20 menit')
    expect(estimateWaitTime(0.8)).toBe('~35 menit')
    expect(estimateWaitTime(0.95)).toBe('~50 menit')
  })

  test('is monotonic at the bucket boundaries', () => {
    expect(estimateWaitTime(0.29)).toBe('< 5 menit')
    expect(estimateWaitTime(0.3)).toBe('~10 menit')
  })
})

describe('generateWeeklyPrediction', () => {
  const week = generateWeeklyPrediction(sample)

  test('returns exactly 7 days', () => {
    expect(week).toHaveLength(7)
  })

  test('clamps every density into the [0.05, 1] range', () => {
    for (const day of week) {
      expect(day.density).toBeGreaterThanOrEqual(0.05)
      expect(day.density).toBeLessThanOrEqual(1)
    }
  })

  test('keeps visitors within capacity', () => {
    for (const day of week) {
      expect(day.visitors).toBeGreaterThanOrEqual(0)
      expect(day.visitors).toBeLessThanOrEqual(sample.maxCapacity)
    }
  })

  test('produces ISO date strings and short day labels', () => {
    for (const day of week) {
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(day.dayShort).toMatch(/^[A-Z]{3}$/)
    }
  })

  test('is deterministic for the same destination at the same instant', () => {
    // The seed mixes in the current timestamp, so pin the clock before comparing.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-08T08:00:00Z'))
    try {
      const a = generateWeeklyPrediction(sample)
      const b = generateWeeklyPrediction(sample)
      expect(b.map((d) => d.density)).toEqual(a.map((d) => d.density))
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('generateHourlyPrediction', () => {
  const hourly = generateHourlyPrediction(sample)

  test('returns 11 hourly slots (07:00–17:00)', () => {
    expect(hourly).toHaveLength(11)
    expect(hourly[0].hour).toBe('07:00')
    expect(hourly[10].hour).toBe('17:00')
  })

  test('clamps density into [0.05, 1]', () => {
    for (const h of hourly) {
      expect(h.density).toBeGreaterThanOrEqual(0.05)
      expect(h.density).toBeLessThanOrEqual(1)
    }
  })
})

describe('getBestVisitTime', () => {
  test('returns a "HH:MM - HH:MM" window', () => {
    expect(getBestVisitTime(sample)).toMatch(/^\d{2}:\d{2} - \d{2}:\d{2}$/)
  })

  test('points at the lowest-density hour', () => {
    const hourly = generateHourlyPrediction(sample)
    const min = hourly.reduce((a, b) => (b.density < a.density ? b : a))
    expect(getBestVisitTime(sample).startsWith(min.hour)).toBe(true)
  })
})

describe('getLocalEvents', () => {
  test('returns events with valid impact and ISO dates', () => {
    const events = getLocalEvents()
    expect(events.length).toBeGreaterThan(0)
    for (const e of events) {
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(e.impact).toBeGreaterThan(0)
      expect(e.name).toBeTruthy()
    }
  })
})

describe('generateWeatherData', () => {
  const weather = generateWeatherData(sample)

  test('returns plausible temp/humidity/wind ranges', () => {
    expect(weather.temp).toBeGreaterThanOrEqual(20)
    expect(weather.temp).toBeLessThanOrEqual(40)
    expect(weather.humidity).toBeGreaterThanOrEqual(60)
    expect(weather.humidity).toBeLessThanOrEqual(95)
    expect(weather.wind).toBeGreaterThanOrEqual(5)
    expect(weather.wind).toBeLessThanOrEqual(30)
  })

  test('maps the condition to a matching icon', () => {
    const icons: Record<string, string> = {
      cerah: 'wb_sunny', berawan: 'cloud', hujan_ringan: 'grain', hujan: 'thunderstorm',
    }
    expect(weather.icon).toBe(icons[weather.condition])
  })
})
