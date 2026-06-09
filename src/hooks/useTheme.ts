import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'mango_theme'

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false
}

function readStored(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

let current: Theme = readStored() ?? (systemPrefersDark() ? 'dark' : 'light')
const listeners = new Set<() => void>()

function applyToDocument(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }
}

// Apply on module load so the class is set before the first React paint.
applyToDocument(current)

export function setTheme(theme: Theme): void {
  if (theme === current) return
  current = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* private mode / storage disabled — class still applies for the session */
  }
  applyToDocument(theme)
  listeners.forEach((l) => l())
}

export function toggleTheme(): void {
  setTheme(current === 'dark' ? 'light' : 'dark')
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

/** Reactive access to the active theme plus setters. */
export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void; toggleTheme: () => void } {
  const theme = useSyncExternalStore(
    subscribe,
    () => current,
    () => 'light' as Theme,
  )
  return { theme, setTheme, toggleTheme }
}
