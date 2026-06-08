import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import BlurText from '../components/reactbits/BlurText'
import { supabase } from '../lib/supabase'

interface AuditLogRow {
  id: number
  actor_id: string | null
  actor_email: string | null
  action: string
  target_type: string | null
  target_id: string | null
  diff: Record<string, unknown> | null
  created_at: string
}

type ActionFilter = 'all' | 'ai_settings.update' | 'admin.grant' | 'admin.revoke'

const ACTION_META: Record<string, { icon: string; labelEn: string; labelId: string; color: string }> = {
  'ai_settings.update': {
    icon: 'settings_suggest',
    labelEn: 'AI settings updated',
    labelId: 'Setting AI diperbarui',
    color: 'bg-primary/10 text-primary',
  },
  'admin.grant': {
    icon: 'shield_person',
    labelEn: 'Admin granted',
    labelId: 'Admin diberikan',
    color: 'bg-emerald-100 text-emerald-700',
  },
  'admin.revoke': {
    icon: 'remove_moderator',
    labelEn: 'Admin revoked',
    labelId: 'Admin dicabut',
    color: 'bg-error/10 text-error',
  },
}

const PAGE_SIZE = 50

function formatAbsolute(s: string): string {
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelative(s: string, lang: string): string {
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return ''
  const diffMs = Date.now() - d.getTime()
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return lang === 'en' ? 'just now' : 'baru saja'
  const min = Math.floor(sec / 60)
  if (min < 60) return lang === 'en' ? `${min}m ago` : `${min}m lalu`
  const hr = Math.floor(min / 60)
  if (hr < 24) return lang === 'en' ? `${hr}h ago` : `${hr}j lalu`
  const day = Math.floor(hr / 24)
  if (day < 7) return lang === 'en' ? `${day}d ago` : `${day}h lalu`
  return formatAbsolute(s)
}

export default function AuditLogs() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const [logs, setLogs] = useState<AuditLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ActionFilter>('all')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  async function load(filterValue: ActionFilter, limitValue: number) {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.rpc('admin_list_audit_logs', {
      limit_count: limitValue,
      offset_count: 0,
      action_filter: filterValue === 'all' ? null : filterValue,
    })
    if (error) {
      setError(error.message)
      setLogs([])
    } else {
      setLogs((data as AuditLogRow[]) ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    // Data fetch on filter/limit change. `load` flips a loading flag before
    // awaiting Supabase — a deliberate, non-cascading state update, so the
    // set-state-in-effect heuristic is a false positive here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(filter, limit)
  }, [filter, limit])

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filterTabs = useMemo(
    () => [
      { id: 'all' as const, labelEn: 'All', labelId: 'Semua' },
      { id: 'ai_settings.update' as const, labelEn: 'Settings', labelId: 'Setting' },
      { id: 'admin.grant' as const, labelEn: 'Grants', labelId: 'Grant' },
      { id: 'admin.revoke' as const, labelEn: 'Revokes', labelId: 'Revoke' },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-5xl">
      {/* Header */}
      <SpotlightCard
        spotlightColor="rgba(0, 100, 124, 0.15)"
        className="bg-gradient-to-br from-surface-container-low via-white to-primary-fixed/30 rounded-[2rem] p-8 border border-stone-200/60"
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
            <Icon name="receipt_long" size="24px" />
          </div>
          <div className="flex-1">
            <BlurText
              text={lang === 'en' ? 'Audit Logs' : 'Audit Logs'}
              as="h1"
              animateBy="letters"
              delay={50}
              className="text-3xl lg:text-4xl font-extrabold text-on-surface font-headline"
            />
            <p className="text-sm text-on-surface-variant mt-2 max-w-xl">
              {lang === 'en'
                ? 'Trail of every admin action — settings changes, role grants and revokes. API keys are redacted.'
                : 'Jejak semua aksi admin — perubahan setting, pemberian dan pencabutan role. API key disensor.'}
            </p>
          </div>
        </div>
      </SpotlightCard>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setFilter(t.id)
              setLimit(PAGE_SIZE)
              setExpanded(new Set())
            }}
            className={`text-xs font-bold px-4 py-2 rounded-full transition-colors ${
              filter === t.id
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {lang === 'en' ? t.labelEn : t.labelId}
          </button>
        ))}
        <button
          onClick={() => load(filter, limit)}
          className="ml-auto text-xs font-bold px-3 py-2 rounded-full bg-surface-container-low text-on-surface hover:bg-surface-container-high inline-flex items-center gap-1"
          title={lang === 'en' ? 'Refresh' : 'Muat ulang'}
        >
          <Icon name="refresh" size="14px" />
          {lang === 'en' ? 'Refresh' : 'Muat ulang'}
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <SpotlightCard
          spotlightColor="rgba(0, 100, 124, 0.08)"
          className="bg-surface-container-lowest rounded-3xl p-10 border border-stone-100 flex items-center justify-center gap-3"
        >
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-on-surface-variant">
            {lang === 'en' ? 'Loading logs…' : 'Memuat log…'}
          </span>
        </SpotlightCard>
      ) : error ? (
        <SpotlightCard
          spotlightColor="rgba(220, 38, 38, 0.1)"
          className="bg-error/5 rounded-3xl p-6 border border-error/20"
        >
          <div className="flex items-start gap-3">
            <Icon name="error" size="22px" className="text-error shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-error">
                {lang === 'en' ? 'Failed to load logs' : 'Gagal memuat log'}
              </p>
              <p className="text-xs text-on-surface-variant mt-1 break-all">{error}</p>
              <button
                onClick={() => load(filter, limit)}
                className="mt-3 bg-error text-on-primary text-xs font-bold px-4 py-2 rounded-full"
              >
                {lang === 'en' ? 'Retry' : 'Coba lagi'}
              </button>
            </div>
          </div>
        </SpotlightCard>
      ) : logs.length === 0 ? (
        <SpotlightCard
          spotlightColor="rgba(0, 100, 124, 0.08)"
          className="bg-surface-container-lowest rounded-3xl p-10 border border-stone-100 text-center"
        >
          <Icon name="history_toggle_off" size="32px" className="text-on-surface-variant/50 mb-2" />
          <p className="text-sm font-semibold text-on-surface-variant">
            {lang === 'en' ? 'No audit logs yet.' : 'Belum ada audit log.'}
          </p>
          <p className="text-xs text-on-surface-variant/70 mt-1">
            {lang === 'en'
              ? 'Make a change in AI Agent or User Management to see it here.'
              : 'Ubah sesuatu di AI Agent atau User Management untuk melihatnya di sini.'}
          </p>
        </SpotlightCard>
      ) : (
        <div className="flex flex-col gap-2">
          {logs.map((row, i) => {
            const meta = ACTION_META[row.action] ?? {
              icon: 'history',
              labelEn: row.action,
              labelId: row.action,
              color: 'bg-stone-100 text-stone-700',
            }
            const isOpen = expanded.has(row.id)
            return (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.015, 0.25) }}
                className="bg-surface-container-lowest rounded-2xl border border-stone-100 overflow-hidden"
              >
                <button
                  onClick={() => toggleExpand(row.id)}
                  className="w-full flex items-start gap-3 p-4 text-left hover:bg-stone-50/60 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                    <Icon name={meta.icon} size="20px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-on-surface">
                        {lang === 'en' ? meta.labelEn : meta.labelId}
                      </p>
                      <span className="text-[10px] font-mono text-on-surface-variant">{row.action}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                      {lang === 'en' ? 'by' : 'oleh'} {row.actor_email ?? (lang === 'en' ? 'unknown' : 'tidak diketahui')}
                      {row.target_id ? ` · ${row.target_type}#${row.target_id}` : ''}
                    </p>
                    <p className="text-[10px] text-on-surface-variant/70 mt-0.5">
                      {formatRelative(row.created_at, lang)} · {formatAbsolute(row.created_at)}
                    </p>
                  </div>
                  <Icon
                    name={isOpen ? 'expand_less' : 'expand_more'}
                    size="20px"
                    className="text-on-surface-variant shrink-0 mt-2"
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="border-t border-stone-100 bg-stone-50/40"
                    >
                      <pre className="text-[11px] font-mono text-on-surface p-4 overflow-x-auto whitespace-pre-wrap break-words">
                        {JSON.stringify(row.diff ?? {}, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}

          {logs.length >= limit && (
            <button
              onClick={() => setLimit((n) => n + PAGE_SIZE)}
              className="self-center mt-2 text-xs font-bold px-5 py-2.5 rounded-full bg-surface-container-low hover:bg-surface-container-high text-on-surface transition-colors"
            >
              {lang === 'en' ? 'Load more' : 'Muat lagi'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
