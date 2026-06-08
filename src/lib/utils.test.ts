import { describe, test, expect, vi, afterEach } from 'vitest'
import {
  parseTicketPrice,
  formatCurrency,
  formatDate,
  generateId,
  generateTicketCode,
  timeAgo,
} from './utils'

describe('parseTicketPrice', () => {
  test('returns 0 for "Gratis" regardless of case', () => {
    expect(parseTicketPrice('Gratis')).toBe(0)
    expect(parseTicketPrice('GRATIS')).toBe(0)
  })

  test('strips non-digit characters from a price string', () => {
    expect(parseTicketPrice('Rp 50.000')).toBe(50000)
    expect(parseTicketPrice('IDR 125,500')).toBe(125500)
  })

  test('returns 0 when no digits are present', () => {
    expect(parseTicketPrice('tidak diketahui')).toBe(0)
  })
})

describe('formatCurrency', () => {
  // Intl inserts a non-breaking space (U+00A0) after the currency symbol;
  // normalize it to a plain space before comparing.
  const normalize = (s: string) => s.replace(/\u00a0/g, ' ')

  test('formats a number as Indonesian Rupiah without decimals', () => {
    expect(normalize(formatCurrency(50000))).toBe('Rp 50.000')
  })

  test('formats zero', () => {
    expect(normalize(formatCurrency(0))).toBe('Rp 0')
  })
})

describe('formatDate', () => {
  test('formats an ISO date in long Indonesian form', () => {
    // 2025-07-16 is a Wednesday (Rabu)
    const result = formatDate('2025-07-16')
    expect(result).toContain('Rabu')
    expect(result).toContain('Juli')
    expect(result).toContain('2025')
  })
})

describe('generateId', () => {
  test('produces a non-empty string', () => {
    expect(generateId().length).toBeGreaterThan(0)
  })

  test('produces unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

describe('generateTicketCode', () => {
  test('matches the MNG-XXXX-XXXX format', () => {
    expect(generateTicketCode()).toMatch(/^MNG-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
  })
})

describe('timeAgo', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('returns "Baru saja" for a moment ago', () => {
    vi.setSystemTime(new Date('2026-06-08T12:00:00Z'))
    expect(timeAgo('2026-06-08T11:59:30Z')).toBe('Baru saja')
  })

  test('returns minutes for sub-hour gaps', () => {
    vi.setSystemTime(new Date('2026-06-08T12:00:00Z'))
    expect(timeAgo('2026-06-08T11:30:00Z')).toBe('30 menit lalu')
  })

  test('returns hours for sub-day gaps', () => {
    vi.setSystemTime(new Date('2026-06-08T12:00:00Z'))
    expect(timeAgo('2026-06-08T09:00:00Z')).toBe('3 jam lalu')
  })

  test('returns days for multi-day gaps', () => {
    vi.setSystemTime(new Date('2026-06-08T12:00:00Z'))
    expect(timeAgo('2026-06-05T12:00:00Z')).toBe('3 hari lalu')
  })
})
