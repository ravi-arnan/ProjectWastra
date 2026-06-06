import { useState, useCallback } from 'react'
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../lib/storage'
import { DEFAULT_DENSITY_THRESHOLD } from '../data/destinations'

type ThresholdMap = Record<string, number>

/**
 * Per-destination "calm" threshold for watchlist density alerts. The notifier
 * (useNotifications) reads the same storage key directly; this hook is the UI
 * side for reading/editing it. Missing entries fall back to the default.
 */
export function useWatchlistThresholds() {
  const [thresholds, setThresholds] = useState<ThresholdMap>(() =>
    getStorageItem<ThresholdMap>(STORAGE_KEYS.WATCHLIST_THRESHOLDS, {}),
  )

  const getThreshold = useCallback(
    (id: string): number => thresholds[id] ?? DEFAULT_DENSITY_THRESHOLD,
    [thresholds],
  )

  const setThreshold = useCallback((id: string, value: number) => {
    setThresholds((prev) => {
      const next = { ...prev, [id]: value }
      setStorageItem(STORAGE_KEYS.WATCHLIST_THRESHOLDS, next)
      return next
    })
  }, [])

  return { getThreshold, setThreshold }
}
