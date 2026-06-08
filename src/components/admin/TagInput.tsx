import { useState, type KeyboardEvent } from 'react'
import Icon from '../Icon'

interface Props {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  /** Accessible label for the entry field (falls back to placeholder). */
  label?: string
  maxTagLength?: number
}

export default function TagInput({ value, onChange, placeholder, label, maxTagLength = 64 }: Props) {
  const [draft, setDraft] = useState('')

  const addTag = () => {
    const trimmed = draft.trim().slice(0, maxTagLength)
    if (!trimmed) return
    if (value.includes(trimmed)) {
      setDraft('')
      return
    }
    onChange([...value, trimmed])
    setDraft('')
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className="bg-surface-container-low rounded-xl px-3 py-2 flex flex-wrap items-center gap-2 focus-within:ring-2 focus-within:ring-primary/30">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium rounded-full pl-3 pr-1.5 py-1"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
            aria-label={`Hapus ${tag}`}
          >
            <Icon name="close" size="14px" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        aria-label={label ?? placeholder ?? 'Tambah tag'}
        placeholder={placeholder}
        className="flex-1 min-w-[140px] bg-transparent text-sm outline-none py-1 placeholder:text-on-surface-variant/50"
      />
    </div>
  )
}
