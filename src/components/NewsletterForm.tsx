import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from './Icon'

type Status = 'idle' | 'loading' | 'success' | 'error'

/**
 * Footer newsletter signup. Persists to the `newsletter_subscribers` table.
 * Supabase is imported lazily on submit so it stays off the landing page's
 * critical path.
 */
export default function NewsletterForm() {
  const { t, i18n } = useTranslation()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const en = i18n.language === 'en'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'loading' || !email.trim()) return
    setStatus('loading')
    try {
      const { supabase } = await import('../lib/supabase')
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: email.trim().toLowerCase(), source: 'landing' })
      // 23505 = unique violation → already subscribed, treat as success.
      if (error && error.code !== '23505') throw error
      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-xl px-4 py-3 text-sm text-white" role="status">
        <Icon name="check_circle" filled size="18px" className="text-primary-fixed-dim" />
        <span>{en ? 'Thanks! You are on the list.' : 'Terima kasih! Kamu sudah terdaftar.'}</span>
      </div>
    )
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 bg-surface-container-lowest/5 border border-white/10 rounded-xl p-1.5 focus-within:border-primary/60 transition-colors"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status === 'error') setStatus('idle')
          }}
          aria-label={t('landing.footer.stayLoop')}
          placeholder="you@email.com"
          className="flex-1 bg-transparent text-sm text-white placeholder-white/40 px-3 py-2 outline-none"
          required
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
        >
          {status === 'loading' ? (en ? 'Sending…' : 'Mengirim…') : t('landing.footer.subscribe')}
        </button>
      </form>
      {status === 'error' && (
        <p className="mt-2 text-xs text-red-300" role="alert">
          {en ? 'Something went wrong. Please try again.' : 'Terjadi kesalahan. Coba lagi.'}
        </p>
      )}
    </>
  )
}
