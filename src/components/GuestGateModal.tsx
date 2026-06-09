import { useId } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useTranslation } from 'react-i18next'
import Icon from './Icon'
import { useModalA11y } from '../hooks/useModalA11y'

interface Props {
  isOpen: boolean
  onClose: () => void
  /** Verb describing the gated action (e.g., "memesan tiket" / "book a ticket"). Optional. */
  action?: string
}

export default function GuestGateModal({ isOpen, onClose, action }: Props) {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const dialogRef = useModalA11y<HTMLDivElement>(isOpen, onClose)
  const titleId = useId()

  const verb =
    action ??
    (lang === 'en' ? 'continue with this action' : 'melanjutkan aksi ini')

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Card */}
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full sm:max-w-[420px] bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden"
          >
            {/* Decorative gradient blob */}
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-tertiary/10 blur-3xl pointer-events-none" />

            <div className="relative">
              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="absolute -top-1 -right-1 w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
                aria-label={lang === 'en' ? 'Close' : 'Tutup'}
              >
                <Icon name="close" size="20px" />
              </button>

              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary flex items-center justify-center mb-5 shadow-lg shadow-primary/25">
                <Icon name="lock_person" size="32px" filled />
              </div>

              {/* Heading */}
              <h2 id={titleId} className="text-xl sm:text-2xl font-extrabold text-on-surface font-headline mb-2 leading-tight">
                {lang === 'en' ? 'Sign in required' : 'Login dulu yuk'}
              </h2>

              {/* Description */}
              <p className="text-sm text-on-surface-variant leading-relaxed mb-5">
                {lang === 'en'
                  ? `As a guest you can browse, but you need a free account to ${verb}. Sign in or sign up — takes less than a minute.`
                  : `Sebagai tamu, kamu bisa menjelajah, tapi untuk ${verb} kamu perlu akun. Masuk atau daftar — kurang dari 1 menit.`}
              </p>

              {/* Benefits */}
              <ul className="space-y-2 mb-6 bg-surface-container-low/60 rounded-2xl p-4">
                {(lang === 'en'
                  ? [
                      { icon: 'confirmation_number', text: 'Save your bookings & ticket codes' },
                      { icon: 'bookmark', text: 'Build your watchlist of quiet spots' },
                      { icon: 'notifications', text: 'Get crowd-drop alerts' },
                    ]
                  : [
                      { icon: 'confirmation_number', text: 'Simpan booking & kode tiket' },
                      { icon: 'bookmark', text: 'Bikin watchlist destinasi tenang' },
                      { icon: 'notifications', text: 'Dapat notifikasi saat sepi' },
                    ]).map((item) => (
                  <li key={item.text} className="flex items-center gap-3 text-sm text-on-surface">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                      <Icon name={item.icon} size="16px" />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>

              {/* Actions */}
              <div className="flex flex-col gap-2.5">
                <Link
                  to="/auth"
                  onClick={onClose}
                  className="bg-primary hover:bg-primary-container text-on-primary font-bold text-sm px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-colors"
                >
                  <Icon name="login" size="18px" />
                  {lang === 'en' ? 'Sign in' : 'Masuk'}
                </Link>
                <Link
                  to="/auth"
                  onClick={onClose}
                  className="bg-surface-container-low hover:bg-surface-container text-on-surface font-bold text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 border border-outline-variant transition-colors"
                >
                  <Icon name="person_add" size="18px" />
                  {lang === 'en' ? 'Create account' : 'Daftar akun baru'}
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-on-surface-variant hover:text-on-surface text-xs font-semibold py-2 transition-colors"
                >
                  {lang === 'en' ? 'Maybe later' : 'Nanti saja'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
