'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DashboardShell from '@/components/layout/DashboardShell'
import PublishedFrameCard from '@/components/frame/PublishedFrameCard'
import { useI18n } from '@/components/i18n/I18nProvider'
import { COMMUNITY_FRAME_SELECTION_KEY, COMMUNITY_FRAMES_UPDATED_EVENT, readPublishedFrames, type PublishedFrame } from '@/lib/community-frames'

export default function CommunityPage() {
  const { copy } = useI18n()
  const router = useRouter()
  const [publishedFrames, setPublishedFrames] = useState<PublishedFrame[]>([])
  const [selectedFrame, setSelectedFrame] = useState<PublishedFrame | null>(null)

  useEffect(() => {
    const syncFrames = () => setPublishedFrames(readPublishedFrames())
    syncFrames()
    window.addEventListener(COMMUNITY_FRAMES_UPDATED_EVENT, syncFrames)
    window.addEventListener('storage', syncFrames)
    return () => {
      window.removeEventListener(COMMUNITY_FRAMES_UPDATED_EVENT, syncFrames)
      window.removeEventListener('storage', syncFrames)
    }
  }, [])

  function useTemplate(frame: PublishedFrame) {
    window.localStorage.setItem(COMMUNITY_FRAME_SELECTION_KEY, JSON.stringify(frame))
    router.push('/shoot')
  }

  return (
    <DashboardShell active="community" title="Komunitas" subtitle="Jelajahi template dan kreator Fotbarin." sidebarLabel="Community hub">
      <section className="motion-rise grid gap-8 rounded-[2rem] border border-outline-variant bg-white p-6 shadow-panel lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center md:p-10">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary-container px-3 py-1.5 text-sm font-extrabold text-on-primary-container">
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: `'FILL' 1` }}>brush</span>
            {copy.community.creatorBadge}
          </div>
          <h1 className="text-4xl font-extrabold tracking-[-0.03em] text-on-background sm:text-5xl">{copy.community.title}</h1>
          <p className="mt-4 text-lg leading-8 text-on-surface-variant">{copy.community.subtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/frame-editor" className="rounded-full bg-primary px-5 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-sticker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              {copy.community.createFrame}
            </Link>
            <Link href="/shoot" className="rounded-full border border-outline-variant bg-white px-5 py-3 text-center text-sm font-bold text-on-background shadow-sm transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              {copy.community.tryBooth}
            </Link>
            <Link href="/pricing" className="rounded-full border border-outline-variant bg-white px-5 py-3 text-center text-sm font-bold text-on-background shadow-sm transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              {copy.community.creatorPlan}
            </Link>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-outline-variant bg-surface-container-low p-4">
          <div className="rounded-[1.35rem] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-on-background">{copy.community.editorPreviewTitle}</p>
                <p className="text-xs font-bold text-on-surface-variant">{copy.community.editorPreviewMeta}</p>
              </div>
              <span className="rounded-full bg-success-container px-3 py-1 text-xs font-bold text-success">{copy.common.soon}</span>
            </div>
            <div className="grid gap-3 rounded-[1.1rem] bg-primary-container/55 p-3 sm:grid-cols-[1fr_92px]">
              <div className="aspect-[2/3] rounded-2xl border border-primary/20 bg-white p-3 shadow-sm">
                <div className="flex h-full flex-col gap-2">
                  <div className="flex-1 rounded-xl border border-dashed border-primary/45 bg-surface-container-low" />
                  <div className="flex-1 rounded-xl border border-dashed border-primary/45 bg-surface-container-low" />
                  <div className="flex-1 rounded-xl border border-dashed border-primary/45 bg-surface-container-low" />
                  <div className="rounded-full bg-white py-2 text-center text-xs font-extrabold text-primary">Fotbarin</div>
                </div>
              </div>
              <div className="grid content-start gap-2">
                {copy.community.editorTools.map((item) => (
                  <div key={item} className="rounded-2xl border border-outline-variant bg-white px-3 py-2 text-xs font-extrabold text-on-surface-variant shadow-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {publishedFrames.length > 0 && (
        <section className="mt-5 app-panel p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-on-background">Frame terbaru</h2>
              <p className="mt-1 text-sm font-semibold text-on-surface-variant">Frame yang sudah kamu publish dari editor langsung tampil di sini.</p>
            </div>
            <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-extrabold text-on-primary-container">{publishedFrames.length} live</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {publishedFrames.map((frame) => (
              <PublishedFrameCard key={frame.id} frame={frame} onSelect={setSelectedFrame} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="app-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-bold text-on-background">{copy.community.plannedFilters}</p>
            <span className="rounded-full bg-success-container px-3 py-1 text-xs font-bold text-success">{copy.common.soon}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {copy.community.filters.map((item) => (
              <div key={item} className="rounded-2xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface-variant">{item}</div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-tertiary/20 bg-tertiary-container/70 p-5 text-on-tertiary-container">
          <p className="text-sm font-extrabold">{copy.community.moderationTitle}</p>
          <p className="mt-2 text-sm font-semibold leading-6">{copy.community.moderationText}</p>
        </div>
      </section>

      {selectedFrame && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-on-background/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="frame-detail-title" onClick={() => setSelectedFrame(null)}>
          <div className="grid max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[2rem] border border-outline-variant bg-white shadow-panel md:grid-cols-[minmax(260px,360px)_minmax(0,1fr)]" onClick={(event) => event.stopPropagation()}>
            <div className="min-h-0 overflow-y-auto bg-surface-container-low p-5">
              <PublishedFrameCard frame={selectedFrame} compact />
            </div>

            <div className="flex min-h-0 flex-col overflow-y-auto">
              <div className="flex items-start justify-between gap-4 border-b border-outline-variant p-5">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-primary">Community frame</p>
                  <h2 id="frame-detail-title" className="mt-1 text-2xl font-extrabold tracking-tight text-on-background">{selectedFrame.name}</h2>
                  <p className="mt-1 text-sm font-bold text-on-surface-variant">by {selectedFrame.creatorName} · @{selectedFrame.creatorUsername}</p>
                </div>
                <button type="button" onClick={() => setSelectedFrame(null)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container-low" aria-label="Close frame detail">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="grid flex-1 content-start gap-5 p-5">
                <div className="grid gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-on-surface-variant">Slot</p>
                    <p className="mt-1 text-lg font-extrabold text-on-background">{selectedFrame.elements.filter((element) => element.kind === 'slot').length}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-on-surface-variant">Canvas</p>
                    <p className="mt-1 text-lg font-extrabold text-on-background">{selectedFrame.canvas.width}×{selectedFrame.canvas.height}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-on-surface-variant">Status</p>
                    <p className="mt-1 text-lg font-extrabold text-success">Live</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-on-background">Deskripsi</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-on-surface-variant">
                    {selectedFrame.description || 'Creator belum menambahkan deskripsi untuk frame ini.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-tertiary/20 bg-tertiary-container/60 p-4 text-sm font-semibold leading-6 text-on-tertiary-container">
                  Template ini akan dipakai sebagai frame pilihan di booth. Foto tetap diproses lokal di browser.
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-outline-variant bg-surface-container-low p-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setSelectedFrame(null)} className="rounded-full border border-outline-variant bg-white px-5 py-3 text-sm font-bold text-on-background shadow-sm transition hover:bg-surface-container-low">
                  Tutup
                </button>
                <button type="button" onClick={() => useTemplate(selectedFrame)} className="rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-sticker">
                  Buat dengan template ini
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
