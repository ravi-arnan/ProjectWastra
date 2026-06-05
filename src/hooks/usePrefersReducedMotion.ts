import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

// Cache the MediaQueryList once — useSyncExternalStore may read the snapshot
// frequently, and re-parsing the media string each call is wasteful.
const mql = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY) : null

function subscribe(callback: () => void): () => void {
  if (!mql) return () => {}
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getSnapshot(): boolean {
  return mql?.matches ?? false
}

// Server snapshot: assume motion is allowed so first paint matches the common case.
function getServerSnapshot(): boolean {
  return false
}

/**
 * Returns true when the user has requested reduced motion. Heavy decorative
 * animations (WebGL shaders, marquees) should be skipped when this is true.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
