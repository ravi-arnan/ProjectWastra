import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import ErrorBoundary from './ErrorBoundary'

interface LazyVisibleProps {
  /** Heavy content — typically a React.lazy component — mounted only once near the viewport. */
  children: ReactNode
  /** Shown before the content is visible and as the Suspense fallback while its chunk loads. */
  placeholder?: ReactNode
  /** How early to start loading before the element scrolls into view. */
  rootMargin?: string
  className?: string
}

/**
 * Defers mounting (and therefore the dynamic-import / network cost) of heavy
 * children until the wrapper is near the viewport. Keeps expensive libraries
 * such as WebGL (ogl) and Leaflet out of the synchronous route chunk.
 */
export default function LazyVisible({
  children,
  placeholder = null,
  rootMargin = '200px',
  className,
}: LazyVisibleProps) {
  const ref = useRef<HTMLDivElement>(null)
  // Without IntersectionObserver (very old browsers / SSR), mount immediately.
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (visible) return
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [visible, rootMargin])

  return (
    <div ref={ref} className={className}>
      {visible ? (
        // A failed chunk fetch falls back to the placeholder rather than crashing the page.
        <ErrorBoundary fallback={placeholder}>
          <Suspense fallback={placeholder}>{children}</Suspense>
        </ErrorBoundary>
      ) : (
        placeholder
      )}
    </div>
  )
}
