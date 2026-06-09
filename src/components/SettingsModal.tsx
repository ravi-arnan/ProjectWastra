import { type ReactNode, useId } from 'react'
import Icon from './Icon'
import { useModalA11y } from '../hooks/useModalA11y'

interface Props {
  title: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export default function SettingsModal({ title, isOpen, onClose, children }: Props) {
  const dialogRef = useModalA11y<HTMLDivElement>(isOpen, onClose)
  const titleId = useId()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full max-w-[390px] lg:max-w-md bg-surface-container-lowest rounded-t-3xl lg:rounded-3xl p-6 max-h-[80vh] overflow-y-auto no-scrollbar"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 id={titleId} className="text-lg font-bold text-on-surface font-headline">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="p-1.5 hover:bg-surface-container rounded-full">
            <Icon name="close" size="20px" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
