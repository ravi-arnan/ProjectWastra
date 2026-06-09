import { describe, test, expect } from 'vitest'
import {
  destinations,
  getDensityColor,
  getDensityBgColor,
  getDensityTextColor,
  DENSITY_THRESHOLD_PRESETS,
} from './destinations'

describe('density color helpers', () => {
  test('getDensityColor maps thresholds to semantic tokens', () => {
    expect(getDensityColor(0.9)).toBe('error')
    expect(getDensityColor(0.7)).toBe('tertiary')
    expect(getDensityColor(0.5)).toBe('amber-500')
    expect(getDensityColor(0.1)).toBe('primary')
  })

  test('getDensityBgColor prefixes the token with "bg-"', () => {
    expect(getDensityBgColor(0.9)).toBe('bg-error')
    expect(getDensityBgColor(0.1)).toBe('bg-primary')
  })

  test('getDensityTextColor prefixes the token with "text-"', () => {
    expect(getDensityTextColor(0.9)).toBe('text-error')
    expect(getDensityTextColor(0.7)).toBe('text-tertiary')
    expect(getDensityTextColor(0.5)).toBe('text-amber-700 dark:text-amber-400')
    expect(getDensityTextColor(0.1)).toBe('text-primary')
  })

  test('boundary values fall into the lower bucket (strict >)', () => {
    expect(getDensityColor(0.8)).toBe('tertiary')
    expect(getDensityColor(0.6)).toBe('amber-500')
    expect(getDensityColor(0.3)).toBe('primary')
  })
})

describe('destinations dataset', () => {
  test('every destination has a unique id', () => {
    const ids = destinations.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('density is a fraction between 0 and 1', () => {
    for (const d of destinations) {
      expect(d.density).toBeGreaterThanOrEqual(0)
      expect(d.density).toBeLessThanOrEqual(1)
    }
  })

  test('visitors never exceed the destination capacity', () => {
    for (const d of destinations) {
      expect(d.visitors).toBeLessThanOrEqual(d.maxCapacity)
    }
  })
})

describe('DENSITY_THRESHOLD_PRESETS', () => {
  test('exposes calm/moderate/off presets with bilingual labels', () => {
    expect(DENSITY_THRESHOLD_PRESETS).toHaveLength(3)
    for (const preset of DENSITY_THRESHOLD_PRESETS) {
      expect(preset).toHaveProperty('labelId')
      expect(preset).toHaveProperty('labelEn')
      expect(typeof preset.value).toBe('number')
    }
  })
})
