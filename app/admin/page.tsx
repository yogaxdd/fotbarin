'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { useAuth, type UserProfile } from '@/components/auth/AuthProvider'
import AdminShell from '@/components/layout/AdminShell'
import { db } from '@/lib/firebase'
import { starterThemes } from '@/lib/frame-renderer'
import {
  defaultSiteContent,
  parseSiteContent,
  SITE_CONTENT_STORAGE_KEY,
  type ManagedTemplateItem,
  type ManagedTemplateRow,
  type SiteContent,
  type TemplateCardShape,
} from '@/lib/site-content'

type AdminPanel = 'overview' | 'content' | 'users' | 'settings'
type UserFilter = 'all' | 'active' | 'banned' | 'admin' | 'premium'

type AdminUser = UserProfile & {
  bio?: string | null
  updatedAt?: unknown
  createdAt?: unknown
}

type AdminSettings = {
  maintenanceMode: boolean
  signupPaused: boolean
  strictModeration: boolean
  supportEmail: string
  announcement: string
}

const shapeOptions: TemplateCardShape[] = ['strip', 'portrait', 'square']
const ADMIN_SETTINGS_STORAGE_KEY = 'fotbarin:admin-settings'
const defaultAdminSettings: AdminSettings = {
  maintenanceMode: false,
  signupPaused: false,
  strictModeration: true,
  supportEmail: 'support@fotbarin.app',
  announcement: '',
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`
}

function getPanel(value: string | null): AdminPanel {
  if (value === 'overview' || value === 'content' || value === 'users' || value === 'settings') return value
  return 'overview'
}

function parseAdminSettings(value: string | null): AdminSettings {
  if (!value) return defaultAdminSettings

  try {
    const parsed = JSON.parse(value) as Partial<AdminSettings>
    return {
      maintenanceMode: Boolean(parsed.maintenanceMode),
      signupPaused: Boolean(parsed.signupPaused),
      strictModeration: parsed.strictModeration ?? defaultAdminSettings.strictModeration,
      supportEmail: parsed.supportEmail || defaultAdminSettings.supportEmail,
      announcement: parsed.announcement || '',
    }
  } catch {
    return defaultAdminSettings
  }
}

function AdminField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-extrabold text-on-background">{label}</span>
      {children}
      {hint && <span className="text-xs font-bold leading-5 text-on-surface-variant">{hint}</span>}
    </label>
  )
}

function inputClassName(extra = '') {
  return `w-full rounded-2xl border border-outline-variant bg-white px-4 py-3 text-sm font-bold text-on-background shadow-sm transition focus:border-[oklch(54%_0.12_70)] focus:outline-none focus:ring-2 focus:ring-[oklch(54%_0.12_70_/_0.22)] ${extra}`
}

function formatDate(value: unknown) {
  if (!value) return '—'
  if (typeof value === 'number') return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(value)
  if (typeof value === 'object' && value && 'toDate' in value && typeof value.toDate === 'function') {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(value.toDate())
  }
  return '—'
}

function getDisplayName(user: AdminUser) {
  return user.name || user.username || user.email || 'Pengguna Fotbarin'
}

function MetricCard({ icon, label, value, detail }: { icon: string; label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-[1.75rem] border border-outline-variant bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold text-on-surface-variant">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-on-background">{value}</p>
        </div>
        <span className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-2xl bg-[oklch(96.5%_0.035_78)] text-[oklch(35%_0.09_70)]" style={{ fontVariationSettings: `'FILL' 1` }}>{icon}</span>
      </div>
      <p className="mt-4 text-sm font-semibold leading-6 text-on-surface-variant">{detail}</p>
    </div>
  )
}

function StatusPill({ tone, children }: { tone: 'neutral' | 'success' | 'warning' | 'danger'; children: React.ReactNode }) {
  const toneClass = {
    neutral: 'bg-surface-container-low text-on-surface-variant',
    success: 'bg-success-container text-success',
    warning: 'bg-[oklch(96.5%_0.035_78)] text-[oklch(35%_0.09_70)]',
    danger: 'bg-error-container text-on-error-container',
  }[tone]

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ${toneClass}`}>{children}</span>
}

function OverviewPanel({ content, users, usersLoading, onOpenUsers }: { content: SiteContent; users: AdminUser[]; usersLoading: boolean; onOpenUsers: () => void }) {
  const rowCount = content.templates.rows.length
  const itemCount = content.templates.rows.reduce((total, row) => total + row.items.length, 0)
  const bannedUsers = users.filter((user) => user.isBanned)
  const adminUsers = users.filter((user) => user.isAdmin)
  const premiumUsers = users.filter((user) => user.isPremium && user.premiumExpiresAt && user.premiumExpiresAt > Date.now())
  const completeProfiles = users.filter((user) => user.name && user.username)
  const recentUsers = users.slice(0, 5)

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-[oklch(82%_0.03_78)] bg-white p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[oklch(96.5%_0.035_78)] px-3 py-1.5 text-sm font-extrabold text-[oklch(35%_0.09_70)]">
              <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: `'FILL' 1` }}>space_dashboard</span>
              Admin overview
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.03em] text-on-background">Kontrol operasional Fotbarin.</h1>
            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-on-surface-variant">
              Lihat ringkasan konten, pengguna, status premium, dan moderation signal sebelum masuk ke panel detail.
            </p>
          </div>
          <button type="button" onClick={onOpenUsers} className="w-fit rounded-full bg-[oklch(23%_0.045_70)] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[oklch(54%_0.12_70)]">
            Kelola pengguna
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon="group" label="Pengguna" value={usersLoading ? '…' : users.length} detail={`${completeProfiles.length} profil sudah lengkap.`} />
        <MetricCard icon="block" label="Akun diban" value={usersLoading ? '…' : bannedUsers.length} detail="Akun ini bisa dikembalikan lewat panel pengguna." />
        <MetricCard icon="workspace_premium" label="Premium aktif" value={usersLoading ? '…' : premiumUsers.length} detail={`${adminUsers.length} akun memiliki akses admin.`} />
        <MetricCard icon="dashboard_customize" label="Template cards" value={itemCount} detail={`${rowCount} baris koleksi tampil di halaman template.`} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[2rem] border border-outline-variant bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-on-background">Aktivitas pengguna</h2>
              <p className="mt-1 text-sm font-semibold text-on-surface-variant">Snapshot terbaru dari koleksi users.</p>
            </div>
            <StatusPill tone={bannedUsers.length ? 'danger' : 'success'}>{bannedUsers.length ? `${bannedUsers.length} banned` : 'Aman'}</StatusPill>
          </div>
          <div className="grid gap-3">
            {usersLoading ? (
              <div className="rounded-2xl bg-surface-container-low p-4 text-sm font-bold text-on-surface-variant">Memuat pengguna…</div>
            ) : recentUsers.length ? (
              recentUsers.map((item) => (
                <div key={item.uid} className="flex flex-col gap-3 rounded-2xl bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    {item.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.photoURL} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary" style={{ fontVariationSettings: `'FILL' 1` }}>person</span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-on-background">{getDisplayName(item)}</p>
                      <p className="truncate text-xs font-bold text-on-surface-variant">{item.email || `@${item.username || 'belum-setup'}`}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.isAdmin && <StatusPill tone="warning">Admin</StatusPill>}
                    {item.isBanned ? <StatusPill tone="danger">Banned</StatusPill> : <StatusPill tone="success">Aktif</StatusPill>}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-surface-container-low p-4 text-sm font-bold text-on-surface-variant">Belum ada user di Firestore.</div>
            )}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-[oklch(82%_0.03_78)] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-on-background">Checklist admin</h2>
          <div className="mt-5 grid gap-3">
            {[
              { label: 'Konten template bisa diedit', done: itemCount > 0 },
              { label: 'Role admin sudah terdeteksi', done: adminUsers.length > 0 },
              { label: 'Moderasi pengguna siap', done: !usersLoading },
              { label: 'User site tetap terpisah', done: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-extrabold text-on-surface-variant">
                <span className={`h-2.5 w-2.5 rounded-full ${item.done ? 'bg-success' : 'bg-[oklch(54%_0.12_70)]'}`} />
                {item.label}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  )
}

function ContentPanel({
  content,
  savedState,
  saveContent,
  resetContent,
  updateTemplates,
  updateRow,
  updateItem,
  addRow,
  addItem,
  removeRow,
  removeItem,
}: {
  content: SiteContent
  savedState: 'idle' | 'saved'
  saveContent: () => void
  resetContent: () => void
  updateTemplates: (templates: SiteContent['templates']) => void
  updateRow: (rowId: string, patch: Partial<ManagedTemplateRow>) => void
  updateItem: (rowId: string, itemId: string, patch: Partial<ManagedTemplateItem>) => void
  addRow: () => void
  addItem: (rowId: string) => void
  removeRow: (rowId: string) => void
  removeItem: (rowId: string, itemId: string) => void
}) {
  return (
    <div className="grid gap-5">
      <section className="rounded-[2rem] border border-[oklch(82%_0.03_78)] bg-white p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[oklch(96.5%_0.035_78)] px-3 py-1.5 text-sm font-extrabold text-[oklch(35%_0.09_70)]">
              <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: `'FILL' 1` }}>edit_note</span>
              Content management
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.03em] text-on-background">Kelola isi Fotbarin dari satu panel.</h1>
            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-on-surface-variant">
              Dashboard ini khusus admin: ubah headline template, baris koleksi, judul card, badge, bentuk preview, dan tema tanpa mencampur navigasi yang dilihat user biasa.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={resetContent} className="rounded-full border border-outline-variant bg-white px-5 py-3 text-sm font-extrabold text-on-background shadow-sm transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(54%_0.12_70)] focus-visible:ring-offset-2">
              Reset default
            </button>
            <button type="button" onClick={saveContent} className="rounded-full bg-[oklch(23%_0.045_70)] px-5 py-3 text-sm font-extrabold text-white shadow-sticker transition hover:-translate-y-0.5 hover:bg-[oklch(54%_0.12_70)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(54%_0.12_70)] focus-visible:ring-offset-2">
              {savedState === 'saved' ? 'Tersimpan' : 'Simpan perubahan'}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-5">
        <div className="rounded-[2rem] border border-outline-variant bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-on-background">Konten hero template</h2>
              <p className="mt-1 text-sm font-semibold text-on-surface-variant">Copy ini muncul di bagian atas halaman /templates.</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <AdminField label="Judul">
              <input value={content.templates.heroTitle} onChange={(event) => updateTemplates({ ...content.templates, heroTitle: event.target.value })} className={inputClassName()} />
            </AdminField>
            <AdminField label="Subtitle">
              <textarea value={content.templates.heroSubtitle} onChange={(event) => updateTemplates({ ...content.templates, heroSubtitle: event.target.value })} className={inputClassName('min-h-28 resize-y leading-6')} />
            </AdminField>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-1">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-on-background">Baris template</h2>
            <p className="mt-1 text-sm font-semibold text-on-surface-variant">Setiap baris akan jadi rail horizontal yang bisa di-scroll.</p>
          </div>
          <button type="button" onClick={addRow} className="rounded-full bg-[oklch(23%_0.045_70)] px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[oklch(54%_0.12_70)]">
            Tambah baris
          </button>
        </div>

        {content.templates.rows.map((row, rowIndex) => (
          <div key={row.id} className="rounded-[2rem] border border-outline-variant bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-extrabold text-[oklch(35%_0.09_70)]">Baris {rowIndex + 1}</p>
                <h3 className="mt-1 text-xl font-extrabold text-on-background">{row.title}</h3>
              </div>
              <button type="button" onClick={() => removeRow(row.id)} className="w-fit rounded-full bg-error-container px-4 py-2 text-sm font-extrabold text-on-error-container transition hover:-translate-y-0.5">
                Hapus baris
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <AdminField label="Judul baris">
                <input value={row.title} onChange={(event) => updateRow(row.id, { title: event.target.value })} className={inputClassName()} />
              </AdminField>
              <AdminField label="CTA">
                <input value={row.ctaLabel} onChange={(event) => updateRow(row.id, { ctaLabel: event.target.value })} className={inputClassName()} />
              </AdminField>
              <AdminField label="Deskripsi baris">
                <textarea value={row.subtitle} onChange={(event) => updateRow(row.id, { subtitle: event.target.value })} className={inputClassName('min-h-24 resize-y leading-6')} />
              </AdminField>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-extrabold text-on-background">Card di baris ini</p>
                <button type="button" onClick={() => addItem(row.id)} className="rounded-full border border-outline-variant bg-white px-3 py-2 text-sm font-extrabold text-on-background shadow-sm transition hover:bg-surface-container-low">
                  Tambah card
                </button>
              </div>

              {row.items.map((item, itemIndex) => (
                <div key={item.id} className="grid gap-3 rounded-[1.35rem] bg-surface-container-low p-4 lg:grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr_auto] lg:items-end">
                  <AdminField label={`Judul card ${itemIndex + 1}`}>
                    <input value={item.title} onChange={(event) => updateItem(row.id, item.id, { title: event.target.value })} className={inputClassName()} />
                  </AdminField>
                  <AdminField label="Badge">
                    <input value={item.badge ?? ''} onChange={(event) => updateItem(row.id, item.id, { badge: event.target.value })} className={inputClassName()} />
                  </AdminField>
                  <AdminField label="Tema">
                    <select value={item.themeId} onChange={(event) => updateItem(row.id, item.id, { themeId: event.target.value })} className={inputClassName()}>
                      {starterThemes.map((theme) => (
                        <option key={theme.id} value={theme.id}>{theme.name}</option>
                      ))}
                    </select>
                  </AdminField>
                  <AdminField label="Bentuk">
                    <select value={item.shape ?? 'strip'} onChange={(event) => updateItem(row.id, item.id, { shape: event.target.value as TemplateCardShape })} className={inputClassName()}>
                      {shapeOptions.map((shape) => (
                        <option key={shape} value={shape}>{shape}</option>
                      ))}
                    </select>
                  </AdminField>
                  <button type="button" onClick={() => removeItem(row.id, item.id)} className="rounded-full bg-white px-4 py-3 text-sm font-extrabold text-error shadow-sm transition hover:bg-error-container hover:text-on-error-container">
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

function UsersPanel({
  users,
  usersLoading,
  usersError,
  moderationMessage,
  currentUserUid,
  queryText,
  setQueryText,
  userFilter,
  setUserFilter,
  refreshUsers,
  toggleBan,
  toggleAdmin,
}: {
  users: AdminUser[]
  usersLoading: boolean
  usersError: string
  moderationMessage: string
  currentUserUid?: string
  queryText: string
  setQueryText: (value: string) => void
  userFilter: UserFilter
  setUserFilter: (value: UserFilter) => void
  refreshUsers: () => Promise<void>
  toggleBan: (target: AdminUser) => Promise<void>
  toggleAdmin: (target: AdminUser) => Promise<void>
}) {
  const filteredUsers = useMemo(() => {
    const keyword = queryText.trim().toLowerCase()
    return users.filter((item) => {
      const matchesKeyword = !keyword || [item.name, item.username, item.email, item.uid].some((value) => String(value ?? '').toLowerCase().includes(keyword))
      const matchesFilter =
        userFilter === 'all' ||
        (userFilter === 'active' && !item.isBanned) ||
        (userFilter === 'banned' && item.isBanned) ||
        (userFilter === 'admin' && item.isAdmin) ||
        (userFilter === 'premium' && Boolean(item.isPremium && item.premiumExpiresAt && item.premiumExpiresAt > Date.now()))

      return matchesKeyword && matchesFilter
    })
  }, [queryText, userFilter, users])

  const filterOptions: { value: UserFilter; label: string }[] = [
    { value: 'all', label: 'Semua' },
    { value: 'active', label: 'Aktif' },
    { value: 'banned', label: 'Banned' },
    { value: 'admin', label: 'Admin' },
    { value: 'premium', label: 'Premium' },
  ]

  return (
    <div className="grid gap-5">
      <section className="rounded-[2rem] border border-[oklch(82%_0.03_78)] bg-white p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[oklch(96.5%_0.035_78)] px-3 py-1.5 text-sm font-extrabold text-[oklch(35%_0.09_70)]">
              <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: `'FILL' 1` }}>group</span>
              User moderation
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.03em] text-on-background">Kelola pengguna dan akses.</h1>
            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-on-surface-variant">
              Cari user, lihat status profil, ban/unban akun bermasalah, dan atur admin role. Ban disimpan di dokumen user sebagai <code className="font-extrabold text-on-background">isBanned</code>.
            </p>
          </div>
          <button type="button" onClick={refreshUsers} disabled={usersLoading} className="w-fit rounded-full border border-outline-variant bg-white px-5 py-3 text-sm font-extrabold text-on-background shadow-sm transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60">
            {usersLoading ? 'Memuat…' : 'Refresh users'}
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-outline-variant bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-outline-variant bg-white px-4 py-3 shadow-sm focus-within:border-[oklch(54%_0.12_70)] focus-within:ring-2 focus-within:ring-[oklch(54%_0.12_70_/_0.22)]">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">search</span>
            <input value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder="Cari nama, username, email, atau UID" className="min-w-0 flex-1 bg-transparent text-sm font-bold text-on-background outline-none placeholder:text-on-surface-variant" />
          </div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button key={option.value} type="button" onClick={() => setUserFilter(option.value)} className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${userFilter === option.value ? 'bg-[oklch(23%_0.045_70)] text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-[oklch(96.5%_0.035_78)] hover:text-[oklch(35%_0.09_70)]'}`}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {moderationMessage && <p className="mt-3 rounded-2xl bg-success-container px-4 py-3 text-sm font-extrabold text-success">{moderationMessage}</p>}
        {usersError && <p className="mt-3 rounded-2xl bg-error-container px-4 py-3 text-sm font-extrabold text-on-error-container">{usersError}</p>}
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-outline-variant bg-white shadow-sm">
        <div className="hidden grid-cols-[minmax(220px,1.1fr)_minmax(160px,0.8fr)_minmax(150px,0.7fr)_minmax(260px,1fr)] gap-4 border-b border-outline-variant bg-surface-container-low px-5 py-3 text-xs font-extrabold uppercase tracking-[0.06em] text-on-surface-variant lg:grid">
          <span>User</span>
          <span>Status</span>
          <span>Updated</span>
          <span>Aksi</span>
        </div>
        <div className="grid divide-y divide-outline-variant">
          {usersLoading ? (
            <div className="p-5 text-sm font-bold text-on-surface-variant">Memuat data user dari Firestore…</div>
          ) : filteredUsers.length ? (
            filteredUsers.map((item) => {
              const isSelf = item.uid === currentUserUid
              return (
                <div key={item.uid} className="grid gap-4 p-5 lg:grid-cols-[minmax(220px,1.1fr)_minmax(160px,0.8fr)_minmax(150px,0.7fr)_minmax(260px,1fr)] lg:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    {item.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.photoURL} alt="" className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-full bg-primary-container text-primary" style={{ fontVariationSettings: `'FILL' 1` }}>person</span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-on-background">{getDisplayName(item)} {isSelf && <span className="text-[oklch(35%_0.09_70)]">(kamu)</span>}</p>
                      <p className="truncate text-xs font-bold text-on-surface-variant">{item.email || item.uid}</p>
                      <p className="truncate text-xs font-bold text-on-surface-variant">@{item.username || 'belum-setup'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.isBanned ? <StatusPill tone="danger">Banned</StatusPill> : <StatusPill tone="success">Aktif</StatusPill>}
                    {item.isAdmin && <StatusPill tone="warning">Admin</StatusPill>}
                    {item.isPremium && <StatusPill tone="neutral">Premium</StatusPill>}
                  </div>
                  <p className="text-sm font-bold text-on-surface-variant">{formatDate(item.updatedAt)}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => toggleBan(item)} disabled={isSelf} className={`rounded-full px-4 py-2 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${item.isBanned ? 'bg-success-container text-success hover:bg-success hover:text-white' : 'bg-error-container text-on-error-container hover:bg-error hover:text-white'}`}>
                      {item.isBanned ? 'Unban' : 'Ban'}
                    </button>
                    <button type="button" onClick={() => toggleAdmin(item)} disabled={isSelf || item.isBanned} className="rounded-full border border-outline-variant bg-white px-4 py-2 text-sm font-extrabold text-on-background shadow-sm transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50">
                      {item.isAdmin ? 'Cabut admin' : 'Jadikan admin'}
                    </button>
                    {item.username && (
                      <Link href={`/${item.username}`} className="rounded-full border border-outline-variant bg-white px-4 py-2 text-sm font-extrabold text-on-background shadow-sm transition hover:bg-surface-container-low">
                        Profil
                      </Link>
                    )}
                  </div>
                  {item.isBanned && item.banReason && <p className="rounded-2xl bg-error-container px-4 py-3 text-sm font-bold text-on-error-container lg:col-span-4">Alasan ban: {item.banReason}</p>}
                </div>
              )
            })
          ) : (
            <div className="p-5 text-sm font-bold text-on-surface-variant">Tidak ada user yang cocok dengan filter.</div>
          )}
        </div>
      </section>
    </div>
  )
}

function SettingsPanel({ settings, setSettings, settingsMessage, settingsError, saveSettings }: { settings: AdminSettings; setSettings: (settings: AdminSettings) => void; settingsMessage: string; settingsError: string; saveSettings: () => Promise<void> }) {
  return (
    <div className="grid gap-5">
      <section className="rounded-[2rem] border border-[oklch(82%_0.03_78)] bg-white p-5 shadow-panel sm:p-7">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-[oklch(96.5%_0.035_78)] px-3 py-1.5 text-sm font-extrabold text-[oklch(35%_0.09_70)]">
            <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: `'FILL' 1` }}>manufacturing</span>
            Admin settings
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.03em] text-on-background">Atur mode operasional.</h1>
          <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-on-surface-variant">
            Simpan preferensi admin untuk maintenance, signup, moderation, dan announcement. Setting disimpan lokal dan dicoba sinkron ke Firestore `admin/settings`.
          </p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[2rem] border border-outline-variant bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-on-background">Operational toggles</h2>
          <div className="mt-5 grid gap-3">
            {[
              { key: 'maintenanceMode' as const, title: 'Maintenance mode', detail: 'Tandai app sedang dalam pemeliharaan. Implementasi blocking publik bisa disambungkan nanti.' },
              { key: 'signupPaused' as const, title: 'Pause signup', detail: 'Catatan admin untuk menghentikan pendaftaran baru sementara.' },
              { key: 'strictModeration' as const, title: 'Strict moderation', detail: 'Mode kerja untuk review user yang lebih ketat.' },
            ].map((item) => (
              <button key={item.key} type="button" onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key] })} className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low p-4 text-left transition hover:bg-[oklch(96.5%_0.035_78)]">
                <span>
                  <span className="block text-sm font-extrabold text-on-background">{item.title}</span>
                  <span className="mt-1 block text-xs font-bold leading-5 text-on-surface-variant">{item.detail}</span>
                </span>
                <span className={`flex h-7 w-12 items-center rounded-full p-1 transition ${settings[item.key] ? 'justify-end bg-[oklch(23%_0.045_70)]' : 'justify-start bg-white ring-1 ring-outline-variant'}`}>
                  <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
                </span>
              </button>
            ))}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-outline-variant bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-on-background">Status</h2>
          <div className="mt-5 grid gap-3">
            <StatusPill tone={settings.maintenanceMode ? 'danger' : 'success'}>{settings.maintenanceMode ? 'Maintenance on' : 'App live'}</StatusPill>
            <StatusPill tone={settings.signupPaused ? 'warning' : 'success'}>{settings.signupPaused ? 'Signup paused' : 'Signup open'}</StatusPill>
            <StatusPill tone={settings.strictModeration ? 'warning' : 'neutral'}>{settings.strictModeration ? 'Strict moderation' : 'Standard moderation'}</StatusPill>
          </div>
        </aside>
      </section>

      <section className="rounded-[2rem] border border-outline-variant bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <AdminField label="Support email" hint="Dipakai sebagai catatan admin dan calon kontak bantuan publik.">
            <input value={settings.supportEmail} onChange={(event) => setSettings({ ...settings, supportEmail: event.target.value })} className={inputClassName()} />
          </AdminField>
          <AdminField label="Announcement" hint="Pesan pendek untuk operasional; bisa dipakai sebagai banner publik nanti.">
            <textarea value={settings.announcement} onChange={(event) => setSettings({ ...settings, announcement: event.target.value })} className={inputClassName('min-h-28 resize-y leading-6')} placeholder="Contoh: Maintenance ringan malam ini pukul 22.00 WIB." />
          </AdminField>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={saveSettings} className="rounded-full bg-[oklch(23%_0.045_70)] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[oklch(54%_0.12_70)]">
            Simpan settings
          </button>
          {settingsMessage && <p className="text-sm font-extrabold text-success">{settingsMessage}</p>}
          {settingsError && <p className="text-sm font-extrabold text-error">{settingsError}</p>}
        </div>
      </section>
    </div>
  )
}

function AdminPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const panel = getPanel(searchParams.get('panel'))
  const { user, loading, profileLoading, isAdmin } = useAuth()
  const [content, setContent] = useState<SiteContent>(defaultSiteContent)
  const [savedState, setSavedState] = useState<'idle' | 'saved'>('idle')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [moderationMessage, setModerationMessage] = useState('')
  const [queryText, setQueryText] = useState('')
  const [userFilter, setUserFilter] = useState<UserFilter>('all')
  const [settings, setSettings] = useState<AdminSettings>(defaultAdminSettings)
  const [settingsMessage, setSettingsMessage] = useState('')
  const [settingsError, setSettingsError] = useState('')

  useEffect(() => {
    if (!loading && !profileLoading && !isAdmin) {
      router.replace('/beranda')
    }
  }, [isAdmin, loading, profileLoading, router])

  useEffect(() => {
    setContent(parseSiteContent(window.localStorage.getItem(SITE_CONTENT_STORAGE_KEY)))
    setSettings(parseAdminSettings(window.localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY)))
  }, [])

  const refreshUsers = async () => {
    setUsersLoading(true)
    setUsersError('')
    try {
      const snapshot = await getDocs(collection(db, 'users'))
      const nextUsers = snapshot.docs.map((item) => ({ uid: item.id, ...item.data() }) as AdminUser)
      nextUsers.sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)))
      setUsers(nextUsers)
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
      setUsersError(code ? `Users belum bisa dimuat (${code}).` : 'Users belum bisa dimuat. Cek Firestore rules.')
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      refreshUsers()
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) return

    const loadSettings = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'admin', 'settings'))
        if (snapshot.exists()) {
          const remote = snapshot.data() as Partial<AdminSettings>
          setSettings((current) => ({ ...current, ...remote }))
        }
      } catch {
        // Local settings still work when rules do not allow the admin/settings doc yet.
      }
    }

    loadSettings()
  }, [isAdmin])

  const saveContent = () => {
    window.localStorage.setItem(SITE_CONTENT_STORAGE_KEY, JSON.stringify(content))
    window.dispatchEvent(new StorageEvent('storage', { key: SITE_CONTENT_STORAGE_KEY, newValue: JSON.stringify(content) }))
    setSavedState('saved')
    window.setTimeout(() => setSavedState('idle'), 1800)
  }

  const resetContent = () => {
    setContent(defaultSiteContent)
    window.localStorage.setItem(SITE_CONTENT_STORAGE_KEY, JSON.stringify(defaultSiteContent))
    window.dispatchEvent(new StorageEvent('storage', { key: SITE_CONTENT_STORAGE_KEY, newValue: JSON.stringify(defaultSiteContent) }))
    setSavedState('saved')
    window.setTimeout(() => setSavedState('idle'), 1800)
  }

  const updateTemplates = (templates: SiteContent['templates']) => {
    setContent((current) => ({ ...current, templates }))
  }

  const updateRow = (rowId: string, patch: Partial<ManagedTemplateRow>) => {
    updateTemplates({
      ...content.templates,
      rows: content.templates.rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    })
  }

  const updateItem = (rowId: string, itemId: string, patch: Partial<ManagedTemplateItem>) => {
    updateTemplates({
      ...content.templates,
      rows: content.templates.rows.map((row) =>
        row.id === rowId
          ? { ...row, items: row.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)) }
          : row,
      ),
    })
  }

  const addRow = () => {
    updateTemplates({
      ...content.templates,
      rows: [
        ...content.templates.rows,
        {
          id: makeId('row'),
          title: 'Koleksi baru',
          subtitle: 'Tulis deskripsi singkat koleksi ini.',
          ctaLabel: 'Lihat semua',
          items: [
            {
              id: makeId('item'),
              title: 'Template baru',
              themeId: starterThemes[0].id,
              badge: 'Baru',
              shape: 'strip',
            },
          ],
        },
      ],
    })
  }

  const addItem = (rowId: string) => {
    updateTemplates({
      ...content.templates,
      rows: content.templates.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              items: [
                ...row.items,
                {
                  id: makeId('item'),
                  title: 'Template baru',
                  themeId: starterThemes[0].id,
                  badge: 'Baru',
                  shape: 'strip',
                },
              ],
            }
          : row,
      ),
    })
  }

  const removeRow = (rowId: string) => {
    updateTemplates({ ...content.templates, rows: content.templates.rows.filter((row) => row.id !== rowId) })
  }

  const removeItem = (rowId: string, itemId: string) => {
    updateTemplates({
      ...content.templates,
      rows: content.templates.rows.map((row) => (row.id === rowId ? { ...row, items: row.items.filter((item) => item.id !== itemId) } : row)),
    })
  }

  const toggleBan = async (target: AdminUser) => {
    if (!user || target.uid === user.uid) return

    setModerationMessage('')
    setUsersError('')
    const nextIsBanned = !target.isBanned
    const reason = nextIsBanned ? window.prompt('Alasan ban user ini?', target.banReason || 'Melanggar aturan komunitas Fotbarin.') : null

    if (nextIsBanned && reason === null) return

    try {
      await updateDoc(doc(db, 'users', target.uid), {
        isBanned: nextIsBanned,
        banReason: nextIsBanned ? reason?.trim() || 'Melanggar aturan komunitas Fotbarin.' : '',
        bannedAt: nextIsBanned ? serverTimestamp() : null,
        bannedBy: nextIsBanned ? user.uid : '',
        updatedAt: serverTimestamp(),
      })

      setUsers((current) => current.map((item) => (item.uid === target.uid ? { ...item, isBanned: nextIsBanned, banReason: nextIsBanned ? reason?.trim() || 'Melanggar aturan komunitas Fotbarin.' : '' } : item)))
      setModerationMessage(nextIsBanned ? `${getDisplayName(target)} sudah diban.` : `${getDisplayName(target)} sudah di-unban.`)
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
      setUsersError(code ? `Aksi ban gagal (${code}).` : 'Aksi ban gagal. Cek Firestore rules.')
    }
  }

  const toggleAdmin = async (target: AdminUser) => {
    if (!user || target.uid === user.uid || target.isBanned) return

    setModerationMessage('')
    setUsersError('')
    const nextIsAdmin = !target.isAdmin
    try {
      await updateDoc(doc(db, 'users', target.uid), {
        isAdmin: nextIsAdmin,
        updatedAt: serverTimestamp(),
      })
      setUsers((current) => current.map((item) => (item.uid === target.uid ? { ...item, isAdmin: nextIsAdmin } : item)))
      setModerationMessage(nextIsAdmin ? `${getDisplayName(target)} sekarang admin.` : `Admin access ${getDisplayName(target)} dicabut.`)
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
      setUsersError(code ? `Update admin gagal (${code}).` : 'Update admin gagal. Cek Firestore rules.')
    }
  }

  const saveSettings = async () => {
    setSettingsMessage('')
    setSettingsError('')
    window.localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(settings))

    try {
      await setDoc(
        doc(db, 'admin', 'settings'),
        {
          ...settings,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid ?? '',
        },
        { merge: true },
      )
      setSettingsMessage('Settings tersimpan dan tersinkron ke Firestore.')
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
      setSettingsMessage('Settings tersimpan lokal.')
      setSettingsError(code ? `Sync Firestore gagal (${code}).` : 'Sync Firestore gagal. Cek rules admin/settings.')
    }
  }

  if (loading || profileLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,oklch(98%_0.006_80),oklch(95.8%_0.009_80))] px-4 text-on-background">
        <div className="w-full max-w-sm rounded-[2rem] border border-[oklch(82%_0.03_78)] bg-white p-6 text-center shadow-panel">
          <span className="material-symbols-outlined mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[oklch(96.5%_0.035_78)] text-[oklch(35%_0.09_70)]" style={{ fontVariationSettings: `'FILL' 1` }}>admin_panel_settings</span>
          <p className="mt-4 text-lg font-extrabold text-on-background">Memeriksa akses admin</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-on-surface-variant">Tunggu sebentar, kami validasi profil kamu dulu.</p>
        </div>
      </main>
    )
  }

  if (!isAdmin) {
    return null
  }

  const panelCopy = {
    overview: { title: 'Admin Overview', subtitle: 'Ringkasan pengguna, konten, premium, dan moderation signal.' },
    content: { title: 'Content Admin', subtitle: 'Kelola copy dan koleksi template tanpa mencampur menu user.' },
    users: { title: 'Pengguna', subtitle: 'Moderasi akun, ban/unban, dan kelola role admin.' },
    settings: { title: 'Admin Settings', subtitle: 'Atur mode operasional dan preferensi admin.' },
  }[panel]

  return (
    <AdminShell
      active={panel}
      title={panelCopy.title}
      subtitle={panelCopy.subtitle}
      rightAccessory={
        <Link href="/templates" className="rounded-full bg-[oklch(96.5%_0.035_78)] px-3 py-2 text-sm font-extrabold text-[oklch(35%_0.09_70)] transition hover:bg-[oklch(54%_0.12_70)] hover:text-white">
          Preview site
        </Link>
      }
    >
      {panel === 'overview' && <OverviewPanel content={content} users={users} usersLoading={usersLoading} onOpenUsers={() => router.push('/admin?panel=users')} />}
      {panel === 'content' && (
        <ContentPanel
          content={content}
          savedState={savedState}
          saveContent={saveContent}
          resetContent={resetContent}
          updateTemplates={updateTemplates}
          updateRow={updateRow}
          updateItem={updateItem}
          addRow={addRow}
          addItem={addItem}
          removeRow={removeRow}
          removeItem={removeItem}
        />
      )}
      {panel === 'users' && (
        <UsersPanel
          users={users}
          usersLoading={usersLoading}
          usersError={usersError}
          moderationMessage={moderationMessage}
          currentUserUid={user?.uid}
          queryText={queryText}
          setQueryText={setQueryText}
          userFilter={userFilter}
          setUserFilter={setUserFilter}
          refreshUsers={refreshUsers}
          toggleBan={toggleBan}
          toggleAdmin={toggleAdmin}
        />
      )}
      {panel === 'settings' && <SettingsPanel settings={settings} setSettings={setSettings} settingsMessage={settingsMessage} settingsError={settingsError} saveSettings={saveSettings} />}
    </AdminShell>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,oklch(98%_0.006_80),oklch(95.8%_0.009_80))] px-4 text-on-background">
        <div className="w-full max-w-sm rounded-[2rem] border border-[oklch(82%_0.03_78)] bg-white p-6 text-center shadow-panel">
          <span className="material-symbols-outlined mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[oklch(96.5%_0.035_78)] text-[oklch(35%_0.09_70)]" style={{ fontVariationSettings: `'FILL' 1` }}>admin_panel_settings</span>
          <p className="mt-4 text-lg font-extrabold text-on-background">Memuat admin panel</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-on-surface-variant">Menyiapkan section dashboard.</p>
        </div>
      </main>
    }>
      <AdminPageContent />
    </Suspense>
  )
}
