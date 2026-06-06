import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useTranslation } from 'react-i18next'
import Icon from '../components/Icon'
import { destinations } from '../data/destinations'
import { supabase } from '../lib/supabase'
import MarkdownMessage from '../components/MarkdownMessage'
import BlurText from '../components/reactbits/BlurText'
import ShinyText from '../components/reactbits/ShinyText'
import GradientText from '../components/reactbits/GradientText'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import Magnet from '../components/reactbits/Magnet'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AiAnalysis() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([])
  const [greeting, setGreeting] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const defaultPrompts: string[] = [
    t('ai.examples.q1'),
    t('ai.examples.q2'),
    t('ai.examples.q3'),
    t('ai.examples.q4'),
    lang === 'en' ? 'Compare Uluwatu and Bedugul' : 'Bandingkan Uluwatu dan Bedugul',
    lang === 'en' ? 'Highest-rated destinations?' : 'Destinasi dengan rating tertinggi?',
  ]

  const defaultGreeting =
    lang === 'en'
      ? 'Ask me anything about destinations across Indonesia — crowd levels, recommendations, best visit times, and more.'
      : 'Tanyakan apa saja tentang destinasi wisata di Indonesia — kepadatan, rekomendasi, waktu terbaik berkunjung, dan lainnya.'

  useEffect(() => {
    setSuggestedPrompts(defaultPrompts)
    setGreeting(defaultGreeting)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    let cancelled = false
    // Use the security-definer RPC so anonymous + authenticated users can read
    // public-safe settings without being able to read api_key.
    supabase.rpc('get_public_ai_settings').then(({ data }) => {
      if (cancelled || !data) return
      const row = Array.isArray(data) ? data[0] : data
      if (!row) return
      if (row.greeting_message) setGreeting(row.greeting_message)
      if (row.suggested_prompts && row.suggested_prompts.length > 0) {
        setSuggestedPrompts(row.suggested_prompts)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: text.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ messages: updatedMessages }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessages([
          ...updatedMessages,
          {
            role: 'assistant',
            content: data.error || (lang === 'en' ? 'Sorry, something went wrong. Try again later.' : 'Maaf, terjadi kesalahan. Coba lagi nanti.'),
          },
        ])
      } else {
        setMessages([...updatedMessages, { role: 'assistant', content: data.reply }])
      }
    } catch {
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content:
            lang === 'en'
              ? 'Sorry, something went wrong. Make sure your connection is stable and try again.'
              : 'Maaf, terjadi kesalahan. Pastikan koneksi internet Anda stabil dan coba lagi.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  const emptyState = messages.length === 0 && !isLoading

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-120px)] lg:min-h-[calc(100vh-100px)]">
      {/* ===== CHAT AREA ===== */}
      <SpotlightCard
        spotlightColor="rgba(0, 100, 124, 0.1)"
        className="flex-1 flex flex-col bg-surface-container-lowest rounded-2xl lg:rounded-3xl border border-stone-100/50 shadow-sm"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100/50">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18 }}
            className="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/20"
          >
            <Icon name="auto_awesome" size="20px" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-extrabold text-on-surface font-headline">
              <ShinyText text="Wastra AI" color="#1f1b17" shineColor="#00647c" speed={3} />
            </h2>
            <p className="text-[11px] text-on-surface-variant">{t('ai.subtitle')}</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="text-xs font-semibold text-on-surface-variant hover:text-error transition-colors flex items-center gap-1"
            >
              <Icon name="refresh" size="16px" />
              {t('ai.newChat')}
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
          {emptyState && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center h-full text-center px-4 py-8"
            >
              <motion.div
                initial={{ scale: 0.8, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 16 }}
                className="w-20 h-20 bg-gradient-to-br from-primary/15 to-primary-container/10 rounded-3xl flex items-center justify-center mb-5 shadow-inner"
              >
                <Icon name="travel_explore" size="36px" className="text-primary" />
              </motion.div>
              <h3 className="text-2xl font-extrabold text-on-surface mb-2 font-headline">
                <GradientText
                  colors={['#00647c', '#007f9d', '#6cd3f7', '#007f9d', '#00647c']}
                  animationSpeed={5}
                >
                  {lang === 'en' ? 'Hi! I am Wastra AI' : 'Halo! Saya Wastra AI'}
                </GradientText>
              </h3>
              <BlurText
                text={greeting}
                animateBy="words"
                delay={40}
                className="text-sm text-on-surface-variant mb-6 max-w-md !justify-center !text-center"
              />
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-3">
                {t('ai.examples.title')}
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {suggestedPrompts.map((prompt, i) => (
                  <motion.button
                    key={prompt}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    whileHover={{ y: -2 }}
                    onClick={() => sendMessage(prompt)}
                    className="text-xs font-semibold text-primary bg-primary/8 hover:bg-primary/15 px-3.5 py-2 rounded-full transition-colors border border-primary/15 hover:shadow-md"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] lg:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-on-primary rounded-br-md'
                      : 'bg-surface-container-low text-on-surface rounded-bl-md border border-stone-100/60'
                  }`}
                >
                  {msg.role === 'assistant' ? <MarkdownMessage content={msg.content} /> : msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-surface-container-low rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5 border border-stone-100/60">
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-[11px] text-on-surface-variant ml-2">{t('ai.thinking')}</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="px-4 py-3 border-t border-stone-100/50 bg-surface-container-lowest"
        >
          <div className="flex items-center gap-2 bg-surface-container-low rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/30 focus-within:bg-white transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('ai.placeholder')}
              className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none"
              disabled={isLoading}
            />
            <Magnet padding={20} magnetStrength={6} disabled={!input.trim() || isLoading}>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-primary-container transition-colors shadow-md shadow-primary/20"
              >
                <Icon name="send" size="18px" />
              </button>
            </Magnet>
          </div>
          <p className="text-[10px] text-on-surface-variant/60 text-center mt-2">{t('ai.disclaimer')}</p>
        </form>
      </SpotlightCard>

      {/* ===== SIDEBAR (Desktop only) ===== */}
      <div className="hidden lg:flex flex-col w-[320px] shrink-0 gap-4">
        {/* Destination Quick Reference */}
        <SpotlightCard
          spotlightColor="rgba(0, 100, 124, 0.15)"
          className="bg-surface-container-lowest rounded-3xl p-6 border border-stone-100/50 shadow-sm"
        >
          <h3 className="text-sm font-extrabold text-on-surface mb-1 font-headline">
            {lang === 'en' ? 'Destination Status' : 'Status Destinasi'}
          </h3>
          <p className="text-[11px] text-on-surface-variant mb-4">
            {lang === 'en' ? 'Real-time density data' : 'Data kepadatan real-time'}
          </p>
          <div className="space-y-2.5">
            {destinations.map((dest, i) => {
              const color =
                dest.density > 0.8
                  ? 'bg-error'
                  : dest.density > 0.6
                  ? 'bg-tertiary'
                  : dest.density > 0.3
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              const textColor =
                dest.density > 0.8
                  ? 'text-error'
                  : dest.density > 0.6
                  ? 'text-tertiary'
                  : dest.density > 0.3
                  ? 'text-amber-600'
                  : 'text-emerald-600'

              return (
                <motion.div
                  key={dest.id}
                  initial={{ opacity: 0, x: 8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3"
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`}>
                    {dest.density > 0.8 && (
                      <div className={`w-2.5 h-2.5 rounded-full ${color} animate-ping opacity-50`} />
                    )}
                  </div>
                  <span className="text-xs font-medium text-on-surface flex-1 truncate">{dest.name}</span>
                  <span className={`text-[11px] font-bold ${textColor}`}>{Math.round(dest.density * 100)}%</span>
                </motion.div>
              )
            })}
          </div>
        </SpotlightCard>

        {/* Tips Card */}
        <SpotlightCard
          spotlightColor="rgba(0, 100, 124, 0.15)"
          className="bg-primary/5 rounded-3xl p-6 border border-primary/10"
        >
          <div className="flex items-center gap-2 mb-3">
            <Icon name="lightbulb" size="18px" className="text-primary" />
            <h3 className="text-sm font-bold text-primary">{lang === 'en' ? 'Asking Tips' : 'Tips Bertanya'}</h3>
          </div>
          <ul className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
            {(lang === 'en'
              ? [
                  'Ask comparisons between destinations',
                  'Request recommendations by preference',
                  'Ask for the best time to visit',
                  'Request a travel itinerary plan',
                ]
              : [
                  'Tanyakan perbandingan antar destinasi',
                  'Minta rekomendasi berdasarkan preferensi',
                  'Tanyakan waktu terbaik berkunjung',
                  'Minta rencana itinerary perjalanan',
                ]).map((tip) => (
              <li key={tip} className="flex gap-2">
                <span className="text-primary shrink-0">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </SpotlightCard>

        {/* Suggested Prompts (when chat active) */}
        {messages.length > 0 && (
          <SpotlightCard
            spotlightColor="rgba(0, 100, 124, 0.15)"
            className="bg-surface-container-lowest rounded-3xl p-6 border border-stone-100/50"
          >
            <h3 className="text-sm font-bold text-on-surface mb-3 font-headline">
              {lang === 'en' ? 'More Questions' : 'Pertanyaan Lainnya'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.slice(0, 4).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  disabled={isLoading}
                  className="text-[11px] font-semibold text-primary bg-primary/8 hover:bg-primary/15 px-3 py-1.5 rounded-full transition-colors border border-primary/15 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </SpotlightCard>
        )}
      </div>
    </div>
  )
}
