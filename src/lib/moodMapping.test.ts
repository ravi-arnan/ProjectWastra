import { describe, test, expect } from 'vitest'
import { MOODS, getMoodMeta, filterByMood, type Mood } from './moodMapping'
import { destinations } from '../data/destinations'

describe('MOODS', () => {
  test('lists the five supported moods', () => {
    expect(MOODS).toEqual(['tenang', 'petualang', 'romantis', 'edukatif', 'seru'])
  })
})

describe('getMoodMeta', () => {
  test('returns presentation metadata for each mood', () => {
    for (const mood of MOODS) {
      const meta = getMoodMeta(mood)
      expect(meta.emoji).toBeTruthy()
      expect(meta.icon).toBeTruthy()
      expect(meta.label).toBeTruthy()
      expect(meta.description).toBeTruthy()
    }
  })
})

describe('filterByMood', () => {
  test('"tenang" keeps only calmer destinations (density < 0.5)', () => {
    const result = filterByMood(destinations, 'tenang')
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((d) => d.density < 0.5)).toBe(true)
  })

  test('"petualang" keeps only nature destinations', () => {
    const result = filterByMood(destinations, 'petualang')
    expect(result.every((d) => d.category === 'Alam')).toBe(true)
  })

  test('sorts "tenang" results by rating descending', () => {
    const ratings = filterByMood(destinations, 'tenang').map((d) => d.rating)
    const sorted = [...ratings].sort((a, b) => b - a)
    expect(ratings).toEqual(sorted)
  })

  test('does not mutate the input array', () => {
    const snapshot = [...destinations]
    filterByMood(destinations, 'seru')
    expect(destinations).toEqual(snapshot)
  })

  test('every mood returns a defined (possibly empty) array', () => {
    for (const mood of MOODS as Mood[]) {
      expect(Array.isArray(filterByMood(destinations, mood))).toBe(true)
    }
  })
})
