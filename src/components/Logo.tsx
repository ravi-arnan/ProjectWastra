import logoMark from '../assets/wastra-logo-mark.png'

/** Intrinsic aspect ratio of the icon-only mark (219x96). */
const MARK_RATIO = 219 / 96

type LogoProps = {
  /** Rendered height in px. Width is derived from the mark's aspect ratio. Defaults to 44. */
  size?: number
  className?: string
  /** Eager-load for above-the-fold brand marks (header, loader, auth). */
  eager?: boolean
}

/**
 * Wastra brand mark (icon only — the "Wastra" wordmark is rendered as styled
 * text alongside it). Single source of truth for the logo so every surface
 * (loader, side nav, auth, landing, about) stays in sync.
 */
export default function Logo({ size = 44, className = '', eager = false }: LogoProps) {
  const width = Math.round(size * MARK_RATIO)
  return (
    <img
      src={logoMark}
      alt="Wastra"
      width={width}
      height={size}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      className={`object-contain shrink-0 ${className}`}
    />
  )
}
