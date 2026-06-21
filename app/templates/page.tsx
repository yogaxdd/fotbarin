'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import DashboardShell from '@/components/layout/DashboardShell'
import { useI18n } from '@/components/i18n/I18nProvider'
import { starterThemes, type PhotoStripTheme } from '@/lib/frame-renderer'
import {
  defaultSiteContent,
  parseSiteContent,
  SITE_CONTENT_STORAGE_KEY,
  type ManagedTemplateItem,
  type ManagedTemplateRow,
  type SiteContent,
} from '@/lib/site-content'

function getTheme(themeId: string) {
  return starterThemes.find((theme) => theme.id === themeId) ?? starterThemes[0]
}

function MiniPhotoScene({ theme, index }: { theme: PhotoStripTheme; index: number }) {
  const gradients = [
    'radial-gradient(circle at 38% 30%, rgba(255,255,255,.94) 0 10%, transparent 11%), radial-gradient(ellipse at 42% 76%, rgba(151,91,116,.28) 0 24%, transparent 25%)',
    'radial-gradient(circle at 58% 30%, rgba(255,255,255,.92) 0 9%, transparent 10%), radial-gradient(ellipse at 55% 74%, rgba(75,100,155,.24) 0 28%, transparent 29%)',
    'radial-gradient(circle at 36% 32%, rgba(255,255,255,.92) 0 8%, transparent 9%), radial-gradient(circle at 63% 33%, rgba(255,255,255,.82) 0 8%, transparent 9%), radial-gradient(ellipse at 50% 76%, rgba(97,81,60,.22) 0 30%, transparent 31%)',
    'radial-gradient(circle at 50% 31%, rgba(255,255,255,.9) 0 10%, transparent 11%), radial-gradient(ellipse at 50% 74%, rgba(92,55,120,.22) 0 25%, transparent 26%)',
  ]

  return (
    <div
      className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border"
      style={{
        borderColor: theme.border,
        background: `${gradients[index % gradients.length]}, linear-gradient(135deg, ${theme.slotFill}, ${theme.background})`,
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,rgba(255,255,255,0.56),transparent_32%)]" />
      <div className="absolute inset-x-4 bottom-3 h-7 rounded-full bg-white/42" />
      <span className="absolute right-3 top-3 text-sm font-extrabold" style={{ color: theme.accent }}>
        {theme.marks[index % theme.marks.length]}
      </span>
    </div>
  )
}

function TemplatePreview({ item }: { item: ManagedTemplateItem }) {
  const theme = getTheme(item.themeId)
  const shape = item.shape ?? 'strip'

  if (shape === 'portrait') {
    return (
      <div className="relative h-64 overflow-hidden rounded-[1.35rem] border border-outline-variant p-3 shadow-sm" style={{ backgroundColor: theme.background }}>
        <div className="absolute right-3 top-3 z-10 rounded-full bg-white/84 px-2.5 py-1 text-[11px] font-extrabold" style={{ color: theme.accent }}>
          {item.badge ?? theme.tag}
        </div>
        <div className="h-full overflow-hidden rounded-[1.05rem] border" style={{ borderColor: theme.border }}>
          <div className="h-full" style={{ background: `radial-gradient(circle at 50% 28%, rgba(255,255,255,.96) 0 11%, transparent 12%), radial-gradient(ellipse at 50% 76%, ${theme.accent}44 0 30%, transparent 31%), linear-gradient(140deg, ${theme.slotFill}, ${theme.background})` }} />
        </div>
        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-full bg-white/82 px-3 py-2 text-xs font-extrabold text-on-background shadow-sm">
          <span className="material-symbols-outlined text-[16px]">play_arrow</span>
          <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
        </div>
      </div>
    )
  }

  if (shape === 'square') {
    return (
      <div className="grid h-52 grid-cols-2 gap-2 rounded-[1.35rem] border border-outline-variant p-3 shadow-sm" style={{ backgroundColor: theme.background }}>
        {[0, 1, 2, 3].map((slot) => (
          <MiniPhotoScene key={slot} theme={theme} index={slot} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-[21rem] flex-col gap-2 rounded-[1.35rem] border border-outline-variant p-3 shadow-sm" style={{ backgroundColor: theme.background }}>
      {[0, 1, 2, 3].map((slot) => (
        <MiniPhotoScene key={slot} theme={theme} index={slot} />
      ))}
      <p className="text-center text-[11px] font-extrabold" style={{ color: theme.accent }}>
        Fotbarin
      </p>
    </div>
  )
}

function TemplateRail({ row, rowIndex }: { row: ManagedTemplateRow; rowIndex: number }) {
  return (
    <section className="motion-rise-fast" style={{ animationDelay: `${rowIndex * 90}ms` }}>
      <div className="mb-4 flex items-end justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold tracking-[-0.025em] text-on-background sm:text-3xl">{row.title}</h2>
            {rowIndex === 0 && <span className="rounded-full bg-secondary-container px-2.5 py-1 text-xs font-extrabold text-on-secondary-container">Baru</span>}
          </div>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-on-surface-variant">{row.subtitle}</p>
        </div>
        <Link href="/shoot" className="hidden shrink-0 rounded-full px-3 py-2 text-sm font-extrabold text-primary transition hover:bg-primary-container hover:text-on-primary-container sm:inline-flex">
          {row.ctaLabel}
        </Link>
      </div>

      <div className="template-rail -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {row.items.map((item) => (
          <Link
            key={item.id}
            href="/shoot"
            className="group w-[9.5rem] shrink-0 snap-start sm:w-[10.5rem] md:w-[11rem]"
          >
            <TemplatePreview item={item} />
            <div className="mt-3 flex items-start justify-between gap-2 px-1">
              <div className="min-w-0">
                <h3 className="truncate text-base font-extrabold tracking-tight text-on-background">{item.title}</h3>
                <p className="mt-0.5 text-xs font-bold text-on-surface-variant">{item.badge ?? getTheme(item.themeId).tag}</p>
              </div>
              <span className="material-symbols-outlined mt-0.5 rounded-full bg-white p-1.5 text-[17px] text-primary opacity-0 shadow-sm transition group-hover:opacity-100">
                arrow_forward
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default function TemplatesPage() {
  const { copy } = useI18n()
  const { isAdmin } = useAuth()
  const [content, setContent] = useState<SiteContent>(defaultSiteContent)

  useEffect(() => {
    setContent(parseSiteContent(window.localStorage.getItem(SITE_CONTENT_STORAGE_KEY)))

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SITE_CONTENT_STORAGE_KEY) {
        setContent(parseSiteContent(event.newValue))
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const rows = useMemo(() => content.templates.rows.filter((row) => row.items.length > 0), [content.templates.rows])

  return (
    <DashboardShell active="templates" title="Template" subtitle="Pilih vibe dulu, lalu masuk ke booth." sidebarLabel="Template library">
      <section className="mb-8 grid gap-5 rounded-[2rem] border border-outline-variant bg-white/78 p-5 shadow-panel sm:p-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div className="max-w-3xl">
          <h1 className="motion-rise text-4xl font-extrabold tracking-[-0.03em] text-on-background sm:text-5xl">{content.templates.heroTitle}</h1>
          <p className="motion-rise mt-4 text-lg leading-8 text-on-surface-variant" style={{ animationDelay: '80ms' }}>{content.templates.heroSubtitle}</p>
        </div>
        <div className="motion-rise rounded-[1.5rem] bg-primary-container p-5 text-on-primary-container" style={{ animationDelay: '140ms' }}>
          <p className="font-extrabold">{copy.templates.launchTarget}</p>
          <p className="mt-2 text-sm font-semibold leading-6">{copy.templates.launchText}</p>
          {isAdmin && (
            <Link href="/admin" className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-extrabold text-primary shadow-sm transition hover:-translate-y-0.5">
              Kelola konten
            </Link>
          )}
        </div>
      </section>

      <div className="grid gap-10">
        {rows.map((row, index) => (
          <TemplateRail key={row.id} row={row} rowIndex={index} />
        ))}
      </div>
    </DashboardShell>
  )
}
