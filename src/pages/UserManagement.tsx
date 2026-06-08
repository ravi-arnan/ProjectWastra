import { useEffect, useId, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { useModalA11y } from '../hooks/useModalA11y'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import BlurText from '../components/reactbits/BlurText'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'

interface AdminUser {
  id: string
  email: string | null
  full_name: string | null
  created_at: string
  last_sign_in_at: string | null
  is_admin: boolean
  is_anonymous: boolean
}

type RoleFilter = 'all' | 'users' | 'guests' | 'admins'

function initialsOf(u: AdminUser): string {
  if (u.is_anonymous) return 'G'
  if (u.full_name) {
    const parts = u.full_name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : u.full_name.slice(0, 2).toUpperCase()
  }
  return (u.email?.slice(0, 2) || 'U').toUpperCase()
}

function formatDate(s: string | null): string {
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function UserManagement() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [cleaningGuests, setCleaningGuests] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [editName, setEditName] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const editDialogRef = useModalA11y<HTMLDivElement>(editing !== null, () => {
    if (!editSaving) setEditing(null)
  })
  const editTitleId = useId()

  async function load() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.rpc('admin_list_users')
    if (error) {
      setError(error.message)
      setUsers([])
    } else {
      setUsers((data as AdminUser[]) ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    // Initial fetch via async IIFE so the first await runs before any setState,
    // satisfying react-hooks/set-state-in-effect. Refetches go through load().
    let cancelled = false
    void (async () => {
      const { data, error } = await supabase.rpc('admin_list_users')
      if (cancelled) return
      if (error) {
        setError(error.message)
        setUsers([])
      } else {
        setUsers((data as AdminUser[]) ?? [])
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleGrant(target: AdminUser) {
    const label = target.full_name || target.email || 'this user'
    const confirmText = lang === 'en'
      ? `Grant admin access to ${label}? They will be able to manage AI settings, edit and delete users, and view audit logs.`
      : `Beri akses admin ke ${label}? Mereka akan bisa kelola setting AI, edit dan hapus user, serta lihat audit log.`
    if (!window.confirm(confirmText)) return

    setBusyId(target.id)
    const { error } = await supabase.rpc('admin_grant_admin', { target: target.id })
    setBusyId(null)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast(
      lang === 'en'
        ? `${target.email ?? 'User'} is now an admin`
        : `${target.email ?? 'User'} sekarang admin`,
      'success'
    )
    load()
  }

  async function handleRevoke(target: AdminUser) {
    if (target.id === currentUser?.id) return
    setBusyId(target.id)
    const { error } = await supabase.rpc('admin_revoke_admin', { target: target.id })
    setBusyId(null)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast(
      lang === 'en'
        ? `Admin role revoked from ${target.email ?? 'user'}`
        : `Role admin dicabut dari ${target.email ?? 'user'}`,
      'success'
    )
    load()
  }

  async function handleDelete(target: AdminUser) {
    if (target.id === currentUser?.id) return
    const label = target.full_name || target.email || (target.is_anonymous ? 'this guest' : 'this user')
    const confirmText = lang === 'en'
      ? `Permanently delete ${label}? This cannot be undone.`
      : `Hapus permanen ${label}? Tidak bisa dibatalkan.`
    if (!window.confirm(confirmText)) return

    setBusyId(target.id)
    const { error } = await supabase.rpc('admin_delete_user', { target: target.id })
    setBusyId(null)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast(
      lang === 'en' ? `Deleted ${label}` : `${label} dihapus`,
      'success'
    )
    load()
  }

  function openEdit(target: AdminUser) {
    setEditing(target)
    setEditName(target.full_name ?? '')
  }

  async function handleEditSave() {
    if (!editing) return
    setEditSaving(true)
    const { error } = await supabase.rpc('admin_update_user', {
      target: editing.id,
      new_full_name: editName.trim(),
    })
    setEditSaving(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast(lang === 'en' ? 'User updated' : 'User diperbarui', 'success')
    setEditing(null)
    load()
  }

  async function handleCleanupGuests() {
    const confirmText = lang === 'en'
      ? 'Delete ALL guest accounts right now (regardless of age)? Active guest sessions will be invalidated.'
      : 'Hapus SEMUA akun tamu sekarang (tanpa memandang usia)? Sesi tamu aktif akan dibatalkan.'
    if (!window.confirm(confirmText)) return

    setCleaningGuests(true)
    const { data, error } = await supabase.rpc('admin_cleanup_anonymous_now')
    setCleaningGuests(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    const count = typeof data === 'number' ? data : 0
    showToast(
      lang === 'en' ? `Removed ${count} guest account${count === 1 ? '' : 's'}` : `${count} akun tamu dihapus`,
      'success'
    )
    load()
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter === 'users' && (u.is_anonymous || u.is_admin)) return false
      if (roleFilter === 'guests' && !u.is_anonymous) return false
      if (roleFilter === 'admins' && !u.is_admin) return false
      if (q && !((u.email ?? '').toLowerCase().includes(q) || (u.full_name ?? '').toLowerCase().includes(q))) return false
      return true
    })
  }, [users, search, roleFilter])

  const adminCount = users.filter((u) => u.is_admin).length
  const guestCount = users.filter((u) => u.is_anonymous).length
  const userCount = users.filter((u) => !u.is_anonymous && !u.is_admin).length

  const filterTabs: { id: RoleFilter; labelEn: string; labelId: string; count: number }[] = [
    { id: 'all',    labelEn: 'All',    labelId: 'Semua', count: users.length },
    { id: 'users',  labelEn: 'Users',  labelId: 'User',  count: userCount },
    { id: 'guests', labelEn: 'Guests', labelId: 'Tamu',  count: guestCount },
    { id: 'admins', labelEn: 'Admins', labelId: 'Admin', count: adminCount },
  ]

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-5xl">
      {/* Header */}
      <SpotlightCard
        spotlightColor="rgba(0, 100, 124, 0.15)"
        className="bg-linear-to-br from-surface-container-low via-white to-primary-fixed/30 rounded-4xl p-8 border border-stone-200/60"
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
            <Icon name="manage_accounts" size="24px" />
          </div>
          <div className="flex-1">
            <BlurText
              text={lang === 'en' ? 'User Management' : 'Manajemen User'}
              as="h1"
              animateBy="letters"
              delay={50}
              className="text-3xl lg:text-4xl font-extrabold text-on-surface font-headline"
            />
            <p className="text-sm text-on-surface-variant mt-2 max-w-xl">
              {lang === 'en'
                ? 'Browse, edit, and remove accounts. Grant or revoke the admin role.'
                : 'Lihat, edit, dan hapus akun. Beri atau cabut role admin.'}
            </p>
          </div>
        </div>
      </SpotlightCard>

      {/* Filter pills + search + cleanup */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {filterTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setRoleFilter(t.id)}
              className={`text-xs font-bold px-4 py-2 rounded-full transition-colors inline-flex items-center gap-2 ${
                roleFilter === t.id
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {lang === 'en' ? t.labelEn : t.labelId}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${roleFilter === t.id ? 'bg-on-primary/20' : 'bg-on-surface/10'}`}>
                {t.count}
              </span>
            </button>
          ))}
          <button
            onClick={handleCleanupGuests}
            disabled={cleaningGuests || guestCount === 0}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full bg-error/10 text-error hover:bg-error/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title={lang === 'en' ? 'Delete all guest accounts now' : 'Hapus semua akun tamu sekarang'}
          >
            <Icon name={cleaningGuests ? 'hourglass_top' : 'cleaning_services'} size="14px" />
            {cleaningGuests
              ? (lang === 'en' ? 'Cleaning…' : 'Membersihkan…')
              : (lang === 'en' ? 'Clean up guests' : 'Bersihkan tamu')}
          </button>
        </div>
        <div className="relative md:w-80">
          <Icon
            name="search"
            size="18px"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'en' ? 'Search by email or name…' : 'Cari email atau nama…'}
            className="w-full bg-surface-container-low rounded-full pl-10 pr-4 py-2.5 text-sm font-medium text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <SpotlightCard
          spotlightColor="rgba(0, 100, 124, 0.08)"
          className="bg-surface-container-lowest rounded-3xl p-10 border border-stone-100 flex items-center justify-center gap-3"
        >
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-on-surface-variant">
            {lang === 'en' ? 'Loading users…' : 'Memuat user…'}
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
                {lang === 'en' ? 'Failed to load users' : 'Gagal memuat user'}
              </p>
              <p className="text-xs text-on-surface-variant mt-1 break-all">{error}</p>
              <button
                onClick={load}
                className="mt-3 bg-error text-on-primary text-xs font-bold px-4 py-2 rounded-full"
              >
                {lang === 'en' ? 'Retry' : 'Coba lagi'}
              </button>
            </div>
          </div>
        </SpotlightCard>
      ) : filtered.length === 0 ? (
        <SpotlightCard
          spotlightColor="rgba(0, 100, 124, 0.08)"
          className="bg-surface-container-lowest rounded-3xl p-10 border border-stone-100 text-center"
        >
          <Icon name="group_off" size="32px" className="text-on-surface-variant/50 mb-2" />
          <p className="text-sm font-semibold text-on-surface-variant">
            {lang === 'en' ? 'No users match the current filters.' : 'Tidak ada user yang cocok dengan filter.'}
          </p>
        </SpotlightCard>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((u, i) => {
            const isSelf = u.id === currentUser?.id
            const isBusy = busyId === u.id
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="bg-surface-container-lowest rounded-2xl p-4 border border-stone-100 flex items-center gap-3 hover:shadow-sm transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm">
                  {initialsOf(u)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-on-surface truncate">
                      {u.full_name || u.email || (u.is_anonymous ? (lang === 'en' ? 'Guest' : 'Tamu') : 'Unnamed')}
                    </p>
                    {u.is_admin && (
                      <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                        ADMIN
                      </span>
                    )}
                    {u.is_anonymous && (
                      <span className="bg-stone-100 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        GUEST
                      </span>
                    )}
                    {isSelf && (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {lang === 'en' ? 'YOU' : 'KAMU'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant truncate">{u.email || '—'}</p>
                  <p className="text-[10px] text-on-surface-variant/70 mt-0.5">
                    {lang === 'en' ? 'Joined' : 'Bergabung'} {formatDate(u.created_at)}
                    {' · '}
                    {lang === 'en' ? 'Last seen' : 'Terakhir aktif'} {formatDate(u.last_sign_in_at)}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  {/* Grant/Revoke admin */}
                  {u.is_admin ? (
                    <button
                      onClick={() => handleRevoke(u)}
                      disabled={isSelf || isBusy || u.is_anonymous}
                      className="text-xs font-bold px-3 py-2 rounded-full bg-error/10 text-error hover:bg-error/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title={isSelf ? (lang === 'en' ? "Can't revoke yourself" : 'Tidak bisa cabut diri sendiri') : ''}
                    >
                      {isBusy ? '…' : lang === 'en' ? 'Revoke admin' : 'Cabut admin'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleGrant(u)}
                      disabled={isBusy || u.is_anonymous}
                      className="text-xs font-bold px-3 py-2 rounded-full bg-primary text-on-primary hover:bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title={u.is_anonymous ? (lang === 'en' ? 'Cannot promote a guest' : 'Tidak bisa promote tamu') : ''}
                    >
                      {isBusy ? '…' : lang === 'en' ? 'Grant admin' : 'Beri admin'}
                    </button>
                  )}

                  {/* Edit */}
                  <button
                    type="button"
                    aria-label={lang === 'en' ? 'Edit user' : 'Edit user'}
                    onClick={() => openEdit(u)}
                    disabled={isBusy || u.is_anonymous}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title={u.is_anonymous ? (lang === 'en' ? 'Guests have no profile to edit' : 'Tamu tidak punya profil untuk diedit') : (lang === 'en' ? 'Edit user' : 'Edit user')}
                  >
                    <Icon name="edit" size="16px" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    aria-label={lang === 'en' ? 'Delete user' : 'Hapus user'}
                    onClick={() => handleDelete(u)}
                    disabled={isSelf || isBusy}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-error/10 hover:bg-error/20 text-error disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title={isSelf ? (lang === 'en' ? "Can't delete yourself" : 'Tidak bisa hapus diri sendiri') : (lang === 'en' ? 'Delete user' : 'Hapus user')}
                  >
                    <Icon name="delete" size="16px" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Edit modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            key="edit-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => !editSaving && setEditing(null)}
          >
            <motion.div
              key="edit-card"
              ref={editDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={editTitleId}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 id={editTitleId} className="text-lg font-extrabold text-on-surface font-headline">
                  {lang === 'en' ? 'Edit user' : 'Edit user'}
                </h2>
                <button
                  type="button"
                  onClick={() => !editSaving && setEditing(null)}
                  aria-label={lang === 'en' ? 'Close' : 'Tutup'}
                  className="w-8 h-8 rounded-full hover:bg-surface-container-low flex items-center justify-center"
                >
                  <Icon name="close" size="20px" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 bg-surface-container-low rounded-2xl p-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {initialsOf(editing)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{editing.email ?? '—'}</p>
                    <p className="text-[10px] text-on-surface-variant/70 mt-0.5 font-mono truncate">{editing.id}</p>
                  </div>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    {lang === 'en' ? 'Full name' : 'Nama lengkap'}
                  </span>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={lang === 'en' ? 'Display name' : 'Nama tampilan'}
                    className="bg-surface-container-low rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </label>

                <p className="text-[11px] text-on-surface-variant">
                  {lang === 'en'
                    ? 'Updates raw_user_meta_data.full_name. Email and password aren’t editable here.'
                    : 'Memperbarui raw_user_meta_data.full_name. Email dan password tidak bisa diubah di sini.'}
                </p>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setEditing(null)}
                    disabled={editSaving}
                    className="flex-1 py-2.5 rounded-full bg-surface-container-low hover:bg-surface-container-high text-on-surface text-sm font-bold transition-colors"
                  >
                    {lang === 'en' ? 'Cancel' : 'Batal'}
                  </button>
                  <button
                    onClick={handleEditSave}
                    disabled={editSaving}
                    className="flex-1 py-2.5 rounded-full bg-primary text-on-primary text-sm font-bold hover:bg-primary-container disabled:opacity-60 transition-colors"
                  >
                    {editSaving
                      ? (lang === 'en' ? 'Saving…' : 'Menyimpan…')
                      : (lang === 'en' ? 'Save' : 'Simpan')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
