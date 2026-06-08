interface IconProps {
  name: string
  filled?: boolean
  className?: string
  size?: string
  /**
   * Accessible label. When omitted (the default), the icon is treated as
   * decorative and hidden from assistive tech — its container should carry the
   * label. Provide this only when the icon itself is the sole carrier of meaning.
   */
  label?: string
}

export default function Icon({ name, filled, className = '', size, label }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? 'filled' : ''} ${className}`}
      style={size ? { fontSize: size } : undefined}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {name}
    </span>
  )
}
