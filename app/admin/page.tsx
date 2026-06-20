'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import DashboardShell from '@/components/layout/DashboardShell'
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

const shapeOptions: TemplateCardShape[] = ['strip', 'portrait', 'square']

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`
}

function AdminField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-extrabold text-on-background">{label}</span>
      {children}
    </label>
  )
}

function inputClassName(extra = '') {
  return `w-full rounded-2xl border border-outline-variant bg-white px-4 py-3 text-sm font-bold text-on-background shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 ${extra}`
}

export default function AdminPage() {
  const [content, setContent] = useState<SiteContent>(defaultSiteContent)
  const [savedState, setSavedState] = useState<'idle' | 'saved'>('idle')

  useEffect(() => {
    setContent(parseSiteContent(window.localStorage.getItem(SITE_CONTENT_STORAGE_KEY)))
  }, [])

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

  return (
    <DashboardShell
      active="admin"
      title="Admin"
      subtitle="Kelola copy dan koleksi template tanpa ubah kode halaman."
      sidebarLabel="Content admin"
      rightAccessory={
        <Link href="/templates" className="rounded-full bg-primary-container px-3 py-2 text-sm font-extrabold text-primary transition hover:bg-primary hover:text-white">
          Preview
        </Link>
      }
    >
      <section className="mb-6 rounded-[2rem] border border-outline-variant bg-white p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-extrabold text-primary">Admin dashboard</p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.03em] text-on-background">Kelola isi Fotbarin.</h1>
            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-on-surface-variant">
              Ubah headline template, baris koleksi, judul card, badge, bentuk preview, dan tema. Untuk prototype ini data disimpan di browser kamu; struktur ini sudah siap dipindah ke Firestore nanti.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={resetContent} className="rounded-full border border-outline-variant bg-white px-5 py-3 text-sm font-extrabold text-on-background shadow-sm transition hover:bg-surface-container-low">
              Reset default
            </button>
            <button type="button" onClick={saveContent} className="rounded-full bg-on-background px-5 py-3 text-sm font-extrabold text-white shadow-sticker transition hover:-translate-y-0.5 hover:bg-primary">
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
              <input
                value={content.templates.heroTitle}
                onChange={(event) => updateTemplates({ ...content.templates, heroTitle: event.target.value })}
                className={inputClassName()}
              />
            </AdminField>
            <AdminField label="Subtitle">
              <textarea
                value={content.templates.heroSubtitle}
                onChange={(event) => updateTemplates({ ...content.templates, heroSubtitle: event.target.value })}
                className={inputClassName('min-h-28 resize-y leading-6')}
              />
            </AdminField>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-1">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-on-background">Baris template</h2>
            <p className="mt-1 text-sm font-semibold text-on-surface-variant">Setiap baris akan jadi rail horizontal yang bisa di-scroll.</p>
          </div>
          <button type="button" onClick={addRow} className="rounded-full bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5">
            Tambah baris
          </button>
        </div>

        {content.templates.rows.map((row, rowIndex) => (
          <div key={row.id} className="rounded-[2rem] border border-outline-variant bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-extrabold text-primary">Baris {rowIndex + 1}</p>
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
    </DashboardShell>
  )
}
