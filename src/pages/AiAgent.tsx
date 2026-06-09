import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import Icon from '../components/Icon'
import TagInput from '../components/admin/TagInput'
import { supabase } from '../lib/supabase'
import { apiUrl } from '../lib/platform'
import { showToast } from '../components/Toast'
import { AI_PROVIDERS, DEFAULT_PROVIDER_ID, getProvider, getDefaultModel } from '../data/aiProviders'
import {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_GREETING_MESSAGE,
  DEFAULT_FALLBACK_MESSAGE,
  DEFAULT_REFUSAL_MESSAGE,
  DEFAULT_SUGGESTED_PROMPTS,
  DEFAULT_BLOCKED_KEYWORDS,
} from '../data/aiDefaults'
import { useAuth } from '../context/AuthContext'
import BlurText from '../components/reactbits/BlurText'
import ShinyText from '../components/reactbits/ShinyText'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import Magnet from '../components/reactbits/Magnet'

type Persona = 'informatif' | 'formal' | 'santai' | 'profesional'

interface AiSettings {
  api_key: string
  api_provider: string
  default_model: string
  system_prompt: string
  greeting_message: string
  fallback_message: string
  suggested_prompts: string[]
  persona: Persona
  max_tokens: number
  temperature: number
  content_filter_enabled: boolean
  blocked_keywords: string[]
  refusal_message: string
  allow_anonymous_chat: boolean
}

const DEFAULT_SETTINGS: AiSettings = {
  api_key: '',
  api_provider: DEFAULT_PROVIDER_ID,
  default_model: getDefaultModel(DEFAULT_PROVIDER_ID),
  system_prompt: DEFAULT_SYSTEM_PROMPT,
  greeting_message: DEFAULT_GREETING_MESSAGE,
  fallback_message: DEFAULT_FALLBACK_MESSAGE,
  suggested_prompts: DEFAULT_SUGGESTED_PROMPTS,
  persona: 'informatif',
  max_tokens: 1024,
  temperature: 0.7,
  content_filter_enabled: true,
  blocked_keywords: DEFAULT_BLOCKED_KEYWORDS,
  refusal_message: DEFAULT_REFUSAL_MESSAGE,
  allow_anonymous_chat: true,
}

const PERSONA_OPTIONS: { id: Persona; labelKey: string; hintKey: string }[] = [
  { id: 'informatif', labelKey: 'Informatif', hintKey: 'Netral, padat, data-driven' },
  { id: 'formal', labelKey: 'Formal', hintKey: 'Bahasa sopan & baku' },
  { id: 'santai', labelKey: 'Santai', hintKey: 'Akrab, boleh emoji' },
  { id: 'profesional', labelKey: 'Profesional', hintKey: 'Ringkas seperti konsultan' },
]

function maskKey(key: string) {
  if (!key) return ''
  if (key.length <= 8) return '••••••••'
  return key.slice(0, 4) + '••••••••••••••••' + key.slice(-4)
}

export default function AiAgent() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const { user } = useAuth()
  const [settings, setSettings] = useState<AiSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [testError, setTestError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [keyEdited, setKeyEdited] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('ai_agent_settings')
      .select(
        'api_key, api_provider, default_model, system_prompt, greeting_message, fallback_message, suggested_prompts, persona, max_tokens, temperature, content_filter_enabled, blocked_keywords, refusal_message, allow_anonymous_chat, updated_at'
      )
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setError(error.message)
        } else if (data) {
          const loadedProvider = data.api_provider ?? DEFAULT_PROVIDER_ID
          setSettings({
            api_key: data.api_key ?? '',
            api_provider: loadedProvider,
            default_model: data.default_model ?? getDefaultModel(loadedProvider),
            system_prompt: data.system_prompt?.trim() || DEFAULT_SYSTEM_PROMPT,
            greeting_message: data.greeting_message?.trim() || DEFAULT_GREETING_MESSAGE,
            fallback_message: data.fallback_message?.trim() || DEFAULT_FALLBACK_MESSAGE,
            suggested_prompts:
              data.suggested_prompts && data.suggested_prompts.length > 0
                ? data.suggested_prompts
                : DEFAULT_SUGGESTED_PROMPTS,
            persona: (data.persona ?? 'informatif') as Persona,
            max_tokens: data.max_tokens ?? 1024,
            temperature: data.temperature ?? 0.7,
            content_filter_enabled: data.content_filter_enabled ?? true,
            blocked_keywords:
              data.blocked_keywords && data.blocked_keywords.length > 0
                ? data.blocked_keywords
                : DEFAULT_BLOCKED_KEYWORDS,
            refusal_message: data.refusal_message?.trim() || DEFAULT_REFUSAL_MESSAGE,
            allow_anonymous_chat: data.allow_anonymous_chat ?? true,
          })
          setUpdatedAt(data.updated_at ?? null)
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const patch = <K extends keyof AiSettings>(key: K, val: AiSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: val }))

  const handleSave = async () => {
    if (!settings.refusal_message.trim()) {
      setError(lang === 'en' ? 'Refusal message cannot be empty.' : 'Refusal message tidak boleh kosong.')
      return
    }
    setSaving(true)
    setError(null)
    const { error: updateError } = await supabase
      .from('ai_agent_settings')
      .update({
        api_key: settings.api_key.trim() || null,
        api_provider: settings.api_provider,
        default_model: settings.default_model,
        system_prompt: settings.system_prompt || null,
        greeting_message: settings.greeting_message || null,
        fallback_message: settings.fallback_message || null,
        suggested_prompts: settings.suggested_prompts,
        persona: settings.persona,
        max_tokens: settings.max_tokens,
        temperature: settings.temperature,
        content_filter_enabled: settings.content_filter_enabled,
        blocked_keywords: settings.blocked_keywords,
        refusal_message: settings.refusal_message,
        allow_anonymous_chat: settings.allow_anonymous_chat,
        updated_by: user?.id ?? null,
      })
      .eq('id', 1)
    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      showToast(lang === 'en' ? 'Failed to save settings' : 'Gagal menyimpan setting', 'error')
    } else {
      showToast(lang === 'en' ? 'AI settings saved' : 'Setting AI berhasil disimpan', 'success')
      setKeyEdited(false)
      setUpdatedAt(new Date().toISOString())
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestStatus('idle')
    setTestError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const res = await fetch(apiUrl('/api/ai-test'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          apiKey: settings.api_key.trim(),
          model: settings.default_model,
          provider: settings.api_provider,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        setTestStatus('ok')
      } else {
        setTestStatus('error')
        setTestError(data.error || `HTTP ${res.status}`)
      }
    } catch (e) {
      setTestStatus('error')
      setTestError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant flex items-center gap-3 text-on-surface-variant text-sm">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          {lang === 'en' ? 'Loading settings...' : 'Memuat setting...'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-4xl">
      {/* Header */}
      <SpotlightCard
        spotlightColor="rgba(0, 100, 124, 0.15)"
        className="bg-gradient-to-br from-surface-container-low via-white to-primary-fixed/30 rounded-[2rem] p-8 border border-outline-variant/60"
      >
        <Link
          to="/app/admin"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary uppercase tracking-widest hover:underline"
        >
          <Icon name="arrow_back" size="14px" />
          {lang === 'en' ? 'Back to Admin' : 'Kembali ke Admin'}
        </Link>
        <div className="flex items-start gap-3 mt-3">
          <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <Icon name="smart_toy" size="24px" />
          </div>
          <div className="flex-1">
            <BlurText
              text={lang === 'en' ? 'AI Agent' : 'AI Agent'}
              as="h1"
              animateBy="letters"
              delay={50}
              className="text-3xl lg:text-4xl font-extrabold text-on-surface font-headline"
            />
            <p className="text-sm text-on-surface-variant mt-2 max-w-xl">
              {lang === 'en'
                ? 'Configure the AI provider, API key, model, system prompt, and safeguards. Changes take effect immediately — no redeploy needed.'
                : 'Atur provider AI, API key, model, system prompt, dan safeguard. Perubahan langsung berlaku — tanpa redeploy.'}
            </p>
          </div>
        </div>
      </SpotlightCard>

      {/* Card 1: Provider + API Key */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <SpotlightCard
          spotlightColor="rgba(0, 100, 124, 0.12)"
          className="bg-surface-container-lowest rounded-3xl p-6 lg:p-7 border border-outline-variant shadow-sm flex flex-col gap-5"
        >
          <div className="flex items-center gap-2">
            <Icon name="key" className="text-primary" size="20px" />
            <h2 className="text-lg font-headline font-bold text-on-surface">
              <ShinyText
                text={lang === 'en' ? 'Provider & API Key' : 'Provider & API Key'}
                color="#1f1b17"
                shineColor="#00647c"
                speed={3.5}
              />
            </h2>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-on-surface">
              {lang === 'en' ? 'Provider' : 'Provider'}
            </span>
            <span className="text-xs text-on-surface-variant -mt-1">
              {lang === 'en'
                ? 'AI inference service. Switching here changes the API endpoint and the model list below.'
                : 'Layanan inferensi AI. Mengubah ini mengganti endpoint API dan daftar model di bawah.'}
            </span>
            <select
              value={settings.api_provider}
              aria-label="Provider"
              onChange={(e) => {
                const next = e.target.value
                const nextProvider = getProvider(next)
                const stillValid = nextProvider.models.some((m) => m.id === settings.default_model)
                setSettings((prev) => ({
                  ...prev,
                  api_provider: next,
                  default_model: stillValid ? prev.default_model : getDefaultModel(next),
                }))
                setKeyEdited(true)
                setTestStatus('idle')
              }}
              className="bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-on-surface">
                {lang === 'en' ? 'API Key' : 'API Key'}
              </span>
              {settings.api_key.trim() && !keyEdited && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  <Icon name="check_circle" size="12px" filled />
                  {lang === 'en' ? 'Set' : 'Tersimpan'}
                </span>
              )}
              {!settings.api_key.trim() && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-error/10 text-error px-2.5 py-1 rounded-full">
                  <Icon name="error" size="12px" filled />
                  {lang === 'en' ? 'Not set' : 'Belum diatur'}
                </span>
              )}
              {testStatus === 'ok' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full">
                  <Icon name="check_circle" size="12px" filled />
                  {lang === 'en' ? 'Connected' : 'Terhubung'}
                </span>
              )}
              {testStatus === 'error' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-error/10 text-error px-2.5 py-1 rounded-full">
                  <Icon name="cancel" size="12px" filled />
                  {lang === 'en' ? 'Invalid' : 'Tidak valid'}
                </span>
              )}
            </div>
            <span className="text-xs text-on-surface-variant -mt-1">
              {lang === 'en'
                ? `Bearer token for ${getProvider(settings.api_provider).label}. Stored encrypted at rest, only readable by admins. `
                : `Bearer token untuk ${getProvider(settings.api_provider).label}. Hanya admin yang bisa baca. `}
              <a
                href={getProvider(settings.api_provider).keyHelpUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary font-semibold hover:underline"
              >
                {lang === 'en' ? 'Get a key →' : 'Dapatkan key →'}
              </a>
            </span>
            <div className="flex items-center gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={showKey || keyEdited ? settings.api_key : maskKey(settings.api_key)}
                onChange={(e) => {
                  patch('api_key', e.target.value)
                  setKeyEdited(true)
                  setTestStatus('idle')
                }}
                placeholder={getProvider(settings.api_provider).keyPlaceholder}
                className="flex-1 bg-surface-container-low rounded-xl px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="w-11 h-11 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                <Icon name={showKey ? 'visibility_off' : 'visibility'} size="20px" />
              </button>
            </div>
            {testError && testStatus === 'error' && (
              <span className="text-xs text-error mt-1">{testError}</span>
            )}
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !settings.api_key.trim()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
              >
                <Icon name={testing ? 'hourglass_top' : 'wifi'} size="14px" />
                {testing
                  ? lang === 'en'
                    ? 'Testing...'
                    : 'Menguji...'
                  : lang === 'en'
                  ? 'Test connection'
                  : 'Tes koneksi'}
              </button>
            </div>
          </label>
        </SpotlightCard>
      </motion.div>

      {/* Card 2: Model + tuning */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SpotlightCard
          spotlightColor="rgba(0, 100, 124, 0.12)"
          className="bg-surface-container-lowest rounded-3xl p-6 lg:p-7 border border-outline-variant shadow-sm flex flex-col gap-5"
        >
          <div className="flex items-center gap-2">
            <Icon name="psychology" className="text-primary" size="20px" />
            <h2 className="text-lg font-headline font-bold text-on-surface">
              {lang === 'en' ? 'Model' : 'Model'}
            </h2>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-on-surface">
              {lang === 'en' ? 'Default model' : 'Model default'}
            </span>
            <span className="text-xs text-on-surface-variant -mt-1">
              {lang === 'en'
                ? 'Model used by the AI Analysis chat.'
                : 'Model yang dipakai AI Analysis saat user bertanya.'}
            </span>
            <select
              value={settings.default_model}
              aria-label="Model"
              onChange={(e) => patch('default_model', e.target.value)}
              className="bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              {getProvider(settings.api_provider).models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} — {m.description}
                </option>
              ))}
              {!getProvider(settings.api_provider).models.some(
                (m) => m.id === settings.default_model
              ) && (
                <option value={settings.default_model}>
                  {settings.default_model} {lang === 'en' ? '(custom)' : '(custom)'}
                </option>
              )}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-on-surface">Max tokens</span>
              <span className="text-xs font-mono text-on-surface-variant">{settings.max_tokens}</span>
            </div>
            <input
              type="range"
              aria-label="Max tokens"
              min={64}
              max={8192}
              step={64}
              value={settings.max_tokens}
              onChange={(e) => patch('max_tokens', Number(e.target.value))}
              className="accent-primary"
            />
          </label>

          <label className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-on-surface">Temperature</span>
              <span className="text-xs font-mono text-on-surface-variant">{settings.temperature.toFixed(1)}</span>
            </div>
            <input
              type="range"
              aria-label="Temperature"
              min={0}
              max={2}
              step={0.1}
              value={settings.temperature}
              onChange={(e) => patch('temperature', Number(e.target.value))}
              className="accent-primary"
            />
            <span className="text-xs text-on-surface-variant -mt-1">
              {lang === 'en'
                ? 'Low = more consistent, high = more creative.'
                : 'Rendah = lebih konsisten, tinggi = lebih kreatif.'}
            </span>
          </label>
        </SpotlightCard>
      </motion.div>

      {/* Card 3: System prompt */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <SpotlightCard
          spotlightColor="rgba(0, 100, 124, 0.12)"
          className="bg-surface-container-lowest rounded-3xl p-6 lg:p-7 border border-outline-variant shadow-sm flex flex-col gap-5"
        >
          <div className="flex items-center gap-2">
            <Icon name="prompt_suggestion" className="text-primary" size="20px" />
            <h2 className="text-lg font-headline font-bold text-on-surface">
              {lang === 'en' ? 'System Prompt' : 'System Prompt'}
            </h2>
          </div>

          <label className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-on-surface">
                {lang === 'en' ? 'System prompt' : 'System prompt'}
              </span>
              {settings.system_prompt !== DEFAULT_SYSTEM_PROMPT && (
                <button
                  type="button"
                  onClick={() => patch('system_prompt', DEFAULT_SYSTEM_PROMPT)}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  {lang === 'en' ? '↺ Reset to default' : '↺ Reset ke default'}
                </button>
              )}
            </div>
            <span className="text-xs text-on-surface-variant -mt-1">
              {lang === 'en'
                ? 'The base prompt that defines Wastra AI personality and rules. Pre-filled with the recommended default — edit to customize.'
                : 'Prompt dasar yang mendefinisikan kepribadian dan aturan Wastra AI. Sudah terisi dengan default rekomendasi — edit untuk kustomisasi.'}
            </span>
            <textarea
              value={settings.system_prompt}
              onChange={(e) => patch('system_prompt', e.target.value)}
              rows={12}
              placeholder="Kamu adalah Wastra AI..."
              className="bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono resize-y"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-on-surface">Persona</span>
            <span className="text-xs text-on-surface-variant -mt-1">
              {lang === 'en' ? 'Voice & tone — appended to the system prompt at request time.' : 'Gaya bicara bot — di-append ke system prompt saat request.'}
            </span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PERSONA_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => patch('persona', opt.id)}
                  className={`flex flex-col items-start text-left rounded-xl px-3 py-2.5 transition-colors ${
                    settings.persona === opt.id ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="text-sm font-semibold">{opt.labelKey}</span>
                  <span className={`text-[11px] ${settings.persona === opt.id ? 'text-on-primary/80' : 'text-on-surface-variant/80'}`}>
                    {opt.hintKey}
                  </span>
                </button>
              ))}
            </div>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-on-surface">{lang === 'en' ? 'Greeting message' : 'Greeting message'}</span>
            <textarea
              value={settings.greeting_message}
              onChange={(e) => patch('greeting_message', e.target.value)}
              rows={3}
              placeholder="Halo! Saya Wastra AI..."
              className="bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-on-surface">{lang === 'en' ? 'Fallback message' : 'Fallback message'}</span>
            <textarea
              value={settings.fallback_message}
              onChange={(e) => patch('fallback_message', e.target.value)}
              rows={2}
              placeholder="Maaf, saya tidak bisa memberikan respons..."
              className="bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-on-surface">{lang === 'en' ? 'Suggested prompts' : 'Suggested prompts'}</span>
            <span className="text-xs text-on-surface-variant -mt-1">
              {lang === 'en' ? 'Quick-start questions on the AI Analysis page.' : 'Chip saran pertanyaan di halaman AI Analysis.'}
            </span>
            <TagInput
              value={settings.suggested_prompts}
              onChange={(next) => patch('suggested_prompts', next)}
              placeholder={lang === 'en' ? 'Type a suggested question and press Enter...' : 'Ketik pertanyaan saran lalu Enter...'}
              maxTagLength={120}
            />
          </label>
        </SpotlightCard>
      </motion.div>

      {/* Card 4: Safeguard */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <SpotlightCard
          spotlightColor="rgba(186, 26, 26, 0.1)"
          className="bg-surface-container-lowest rounded-3xl p-6 lg:p-7 border border-outline-variant shadow-sm flex flex-col gap-5"
        >
          <div className="flex items-center gap-2">
            <Icon name="shield" className="text-primary" size="20px" />
            <h2 className="text-lg font-headline font-bold text-on-surface">
              {lang === 'en' ? 'Safeguard' : 'Safeguard'}
            </h2>
          </div>

          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <div>
              <span className="text-sm font-semibold text-on-surface block">{lang === 'en' ? 'Content filter' : 'Content filter'}</span>
              <span className="text-xs text-on-surface-variant">
                {lang === 'en' ? 'Reject user messages containing blocked keywords.' : 'Tolak pesan user yang mengandung blocked keywords di bawah.'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.content_filter_enabled}
              onChange={(e) => patch('content_filter_enabled', e.target.checked)}
              className="mt-1 w-5 h-5 accent-primary"
            />
          </label>

          <label className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-on-surface">{lang === 'en' ? 'Blocked keywords' : 'Blocked keywords'}</span>
              {JSON.stringify(settings.blocked_keywords) !== JSON.stringify(DEFAULT_BLOCKED_KEYWORDS) && (
                <button
                  type="button"
                  onClick={() => patch('blocked_keywords', DEFAULT_BLOCKED_KEYWORDS)}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  {lang === 'en' ? '↺ Reset to default' : '↺ Reset ke default'}
                </button>
              )}
            </div>
            <span className="text-xs text-on-surface-variant -mt-1">
              {lang === 'en' ? 'Words that trigger refusal (case-insensitive, word-boundary match). Pre-filled with conservative starter list.' : 'Kata yang akan memicu refusal (case-insensitive, word-boundary match). Sudah terisi dengan starter list konservatif.'}
            </span>
            <TagInput
              value={settings.blocked_keywords}
              onChange={(next) => patch('blocked_keywords', next)}
              placeholder={lang === 'en' ? 'Type a keyword and press Enter...' : 'Ketik keyword lalu Enter...'}
            />
          </label>

          <label className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-on-surface">{lang === 'en' ? 'Refusal message' : 'Refusal message'}</span>
              {settings.refusal_message !== DEFAULT_REFUSAL_MESSAGE && (
                <button
                  type="button"
                  onClick={() => patch('refusal_message', DEFAULT_REFUSAL_MESSAGE)}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  {lang === 'en' ? '↺ Reset to default' : '↺ Reset ke default'}
                </button>
              )}
            </div>
            <textarea
              value={settings.refusal_message}
              onChange={(e) => patch('refusal_message', e.target.value)}
              rows={2}
              className="bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
          </label>

          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <div>
              <span className="text-sm font-semibold text-on-surface block">{lang === 'en' ? 'Allow guest chat' : 'Izinkan tamu chat'}</span>
              <span className="text-xs text-on-surface-variant">
                {lang === 'en' ? 'When off, anonymous users cannot use AI Analysis.' : 'Jika dimatikan, guest (anonymous login) tidak bisa pakai AI Analysis.'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.allow_anonymous_chat}
              onChange={(e) => patch('allow_anonymous_chat', e.target.checked)}
              className="mt-1 w-5 h-5 accent-primary"
            />
          </label>
        </SpotlightCard>
      </motion.div>

      {error && <div className="bg-error-container text-on-error-container rounded-xl p-3 text-sm">{error}</div>}

      {/* Footer save bar */}
      <div className="flex items-center justify-between gap-4 sticky bottom-4 bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant rounded-2xl p-3 pl-5 shadow-lg">
        <p className="text-xs text-on-surface-variant">
          {updatedAt ? (
            <>
              {lang === 'en' ? 'Last updated' : 'Terakhir diubah'}{' '}
              <span className="font-semibold">
                {new Date(updatedAt).toLocaleString(lang === 'en' ? 'en-US' : 'id-ID')}
              </span>
            </>
          ) : (
            <>{lang === 'en' ? 'No saves yet' : 'Belum ada perubahan'}</>
          )}
        </p>
        <Magnet padding={40} magnetStrength={5}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-on-primary font-bold px-6 py-3 rounded-full text-sm flex items-center gap-2 disabled:opacity-60 hover:bg-primary-container transition-colors shadow-md shadow-primary/25"
          >
            <Icon name={saving ? 'hourglass_top' : 'save'} size="18px" />
            {saving
              ? lang === 'en'
                ? 'Saving...'
                : 'Menyimpan...'
              : lang === 'en'
              ? 'Save all changes'
              : 'Simpan semua perubahan'}
          </button>
        </Magnet>
      </div>
    </div>
  )
}
