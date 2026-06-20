'use client'

import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import { useI18n } from '@/components/i18n/I18nProvider'
import { starterThemes, type PhotoStripTheme } from '@/lib/frame-renderer'

const featuredTemplates = starterThemes.slice(0, 6)

const heroPhotoScenes = [
  'radial-gradient(circle at 34% 32%, oklch(100% 0 0 / 0.98) 0 10%, transparent 11%), radial-gradient(ellipse at 36% 72%, oklch(68% 0.075 18 / 0.36) 0 24%, transparent 25%), linear-gradient(135deg, oklch(98% 0.012 338), oklch(92% 0.038 350))',
  'radial-gradient(circle at 58% 30%, oklch(100% 0 0 / 0.96) 0 9%, transparent 10%), radial-gradient(ellipse at 56% 73%, oklch(60% 0.07 300 / 0.28) 0 26%, transparent 27%), linear-gradient(135deg, oklch(97% 0.014 210), oklch(91% 0.036 225))',
  'radial-gradient(circle at 38% 31%, oklch(100% 0 0 / 0.96) 0 9%, transparent 10%), radial-gradient(circle at 62% 33%, oklch(100% 0 0 / 0.9) 0 8%, transparent 9%), radial-gradient(ellipse at 50% 76%, oklch(62% 0.08 25 / 0.32) 0 30%, transparent 31%), linear-gradient(135deg, oklch(98% 0.016 82), oklch(92% 0.04 78))',
  'radial-gradient(circle at 50% 31%, oklch(100% 0 0 / 0.96) 0 10%, transparent 11%), radial-gradient(ellipse at 50% 74%, oklch(54% 0.08 330 / 0.28) 0 25%, transparent 26%), linear-gradient(135deg, oklch(97% 0.012 155), oklch(91% 0.035 165))',
]

function HeroStrip({ theme, className = '', footer = 'processed locally · no photo upload' }: { theme: PhotoStripTheme; className?: string; footer?: string }) {
  return (
    <div
      className={`relative flex flex-col gap-2 rounded-[1.65rem] border p-3 shadow-[0_18px_50px_rgba(24,18,22,0.12)] ${className}`}
      style={{ backgroundColor: theme.background, borderColor: theme.border }}
    >
      <div className="flex items-center justify-between px-1 pb-1">
        <span className="text-xs font-extrabold" style={{ color: theme.text }} translate="no">
          Fotbarin
        </span>
        <span className="rounded-full bg-white/76 px-2.5 py-1 text-[11px] font-extrabold" style={{ color: theme.accent }}>
          {theme.tag}
        </span>
      </div>
      {[0, 1, 2, 3].map((slot) => (
        <div
          key={slot}
          className="photo-strip-slot relative min-h-0 flex-1 overflow-hidden rounded-[1.15rem] border bg-white/78"
          style={{ borderColor: theme.border, background: heroPhotoScenes[slot] }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.58),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0))]" />
          <div className="absolute inset-x-4 bottom-4 h-9 rounded-full bg-white/48" />
          <div className="absolute right-4 top-4 text-lg font-extrabold" style={{ color: theme.accent }}>
            {theme.marks[slot]}
          </div>
        </div>
      ))}
      <p className="pt-1 text-center text-[11px] font-extrabold" style={{ color: theme.accent }}>
        {footer}
      </p>
    </div>
  )
}

function TemplateCard({ theme }: { theme: PhotoStripTheme }) {
  return (
    <Link
      href="/shoot"
      className="group rounded-[1.45rem] border border-outline-variant bg-white p-2.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-sticker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="flex h-52 flex-col gap-1.5 rounded-[1.15rem] p-2.5" style={{ backgroundColor: theme.background }}>
        {[0, 1, 2, 3].map((slot) => (
          <div key={slot} className="flex-1 rounded-xl border border-black/10 bg-white/72" />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 px-1 pt-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-extrabold text-on-background">{theme.name}</h3>
          <p className="text-xs font-bold text-on-surface-variant">{theme.tag} · 4-cut</p>
        </div>
        <span className="material-symbols-outlined rounded-full bg-primary-container p-2 text-[18px] text-primary transition group-hover:bg-primary group-hover:text-white">
          arrow_forward
        </span>
      </div>
    </Link>
  )
}

function TrustRow({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-[1.35rem] border border-outline-variant bg-white p-4 shadow-sm">
      <span className="material-symbols-outlined mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-[21px] text-primary">
        {icon}
      </span>
      <div>
        <h3 className="font-extrabold tracking-tight text-on-background">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-on-surface-variant">{text}</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { copy, locale } = useI18n()
  const isId = locale === 'id'
  const heroTheme = starterThemes[0]

  const landing = isId
    ? {
        badge: 'Cute photobooth · siap dalam semenit',
        title: 'Bikin photo strip lucu langsung dari browser.',
        subtitle:
          'Buka kamera, ambil empat pose, pilih frame yang kamu suka, lalu download hasilnya sebagai PNG. Tanpa install app, tanpa upload foto, tanpa login untuk mulai.',
        primary: 'Mulai foto',
        secondary: 'Lihat template',
        privacy: 'Fotomu diproses di browser dan tidak kami upload atau simpan.',
        quickStats: ['4 pose', 'Bisa retake', 'Download PNG'],
        boothTitle: 'Fotbarin dibuat untuk foto cepat yang tetap terlihat niat.',
        boothText:
          'Mulai dari selfie sendiri, foto bareng bestie, sampai couple shot—semuanya dibuat ringan, rapi, dan siap dibagikan tanpa proses ribet.',
        templatesTitle: 'Pilih vibe sebelum masuk booth.',
        templatesText: 'Setiap template memberi rasa yang berbeda: clean, soft, playful, atau fandom-adjacent—tinggal pilih yang paling cocok buat fotomu.',
        workflowTitle: 'Cara bikin strip kamu.',
        workflow: [
          ['Nyalakan kamera', 'Izinkan kamera saat kamu sudah siap berpose.'],
          ['Ambil empat foto', 'Pakai countdown pendek dan retake kalau ada pose yang belum pas.'],
          ['Simpan hasilnya', 'Download photo strip sebagai PNG dan langsung share ke mana pun.'],
        ],
        finalTitle: 'Foto kamu tetap punya kamu.',
        finalText:
          'Fotbarin menjaga prosesnya tetap lokal di browser, jadi kamu bisa bikin strip lucu tanpa merasa fotomu pindah ke tempat lain.',
        stripLabel: 'Contoh hasil',
        stripNote: '4 pose rapi, siap di-share.',
        stripFooter: 'diproses lokal · tanpa upload foto',
      }
    : {
        badge: 'Cute photobooth · ready in a minute',
        title: 'Make cute photo strips straight from your browser.',
        subtitle:
          'Open your camera, take four poses, choose a frame you love, and download a polished PNG. No app install, no photo upload, no login to start.',
        primary: 'Start shooting',
        secondary: 'View templates',
        privacy: 'Your photos are processed in your browser. We do not upload or store your shots.',
        quickStats: ['4 poses', 'Easy retakes', 'PNG download'],
        boothTitle: 'Fotbarin is for quick photos that still feel intentional.',
        boothText:
          'Solo selfies, bestie shots, couple poses, fandom moments—make a clean, cute strip that feels ready to share without a complicated setup.',
        templatesTitle: 'Pick a vibe before entering the booth.',
        templatesText: 'Each template gives your strip a different mood: clean, soft, playful, or fandom-adjacent—choose the one that fits your photos.',
        workflowTitle: 'How your strip comes together.',
        workflow: [
          ['Turn on the camera', 'Camera permission only appears when you are ready to pose.'],
          ['Take four photos', 'Use the short countdown and retake any slot until it feels right.'],
          ['Save the strip', 'Download your photo strip as a PNG and share it anywhere.'],
        ],
        finalTitle: 'Your photos stay yours.',
        finalText:
          'Fotbarin keeps the process local in your browser, so you can make a cute strip without wondering where your photos went.',
        stripLabel: 'Example strip',
        stripNote: 'Four polished poses, ready to share.',
        stripFooter: 'processed locally · no photo upload',
      }

  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(480px,1.08fr)] lg:px-8 lg:py-14">
          <div className="max-w-2xl">
            <div className="motion-rise mb-5 inline-flex items-center gap-2 rounded-full border border-outline-variant bg-white px-3 py-1.5 text-sm font-extrabold text-on-surface-variant shadow-sm">
              <span className="h-2 w-2 rounded-full bg-success" />
              {landing.badge}
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] text-on-background sm:text-5xl lg:text-6xl" aria-label={landing.title}>
              {landing.title.split(' ').map((word, index) => (
                <span key={`${word}-${index}`} className="hero-title-word" style={{ animationDelay: `${80 + index * 45}ms` }} aria-hidden="true">
                  {word}{index === landing.title.split(' ').length - 1 ? '' : ' '}
                </span>
              ))}
            </h1>

            <p className="motion-rise mt-5 max-w-xl text-base leading-8 text-on-surface-variant sm:text-lg" style={{ animationDelay: '120ms' }}>
              {landing.subtitle}
            </p>

            <div className="motion-rise mt-7 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '180ms' }}>
              <Link href="/shoot" className="inline-flex items-center justify-center gap-2 rounded-full bg-on-background px-6 py-3.5 text-base font-extrabold text-white shadow-sticker transition duration-200 hover:-translate-y-0.5 hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                {landing.primary}
              </Link>
              <Link href="/templates" className="inline-flex items-center justify-center gap-2 rounded-full border border-outline-variant bg-white px-6 py-3.5 text-base font-extrabold text-on-background shadow-sm transition duration-200 hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                <span className="material-symbols-outlined text-[20px]">dashboard_customize</span>
                {landing.secondary}
              </Link>
            </div>

            <div className="motion-rise mt-6 rounded-[1.35rem] border border-outline-variant bg-white/86 p-4 shadow-sm" style={{ animationDelay: '240ms' }}>
              <div className="flex gap-3">
                <span className="material-symbols-outlined mt-0.5 text-[22px] text-success">verified_user</span>
                <p className="text-sm font-bold leading-6 text-on-surface-variant">{landing.privacy}</p>
              </div>
            </div>

            <div className="motion-rise mt-5 flex flex-wrap gap-2" style={{ animationDelay: '300ms' }}>
              {landing.quickStats.map((item) => (
                <span key={item} className="rounded-full border border-outline-variant bg-white px-3 py-1.5 text-sm font-extrabold text-on-surface-variant shadow-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="motion-rise relative mx-auto w-full max-w-[28rem] lg:max-w-none" style={{ animationDelay: '160ms' }}>
            <div className="absolute left-6 top-8 h-24 w-24 rounded-full bg-primary-container blur-2xl" />
            <div className="absolute bottom-10 right-8 h-28 w-28 rounded-full bg-tertiary-container blur-2xl" />

            <div className="relative flex min-h-[34rem] items-center justify-center rounded-[2.35rem] border border-outline-variant bg-white/72 p-5 shadow-panel sm:p-7">
              <HeroStrip theme={heroTheme} footer={landing.stripFooter} className="hero-strip-showcase h-[31rem] w-[15rem] sm:h-[34rem] sm:w-[16.5rem]" />

              <div className="hero-float-note absolute right-2 top-8 hidden max-w-[12rem] rounded-[1.25rem] border border-outline-variant bg-white px-4 py-3 shadow-sm sm:block lg:right-0">
                <p className="text-sm font-extrabold text-on-background">{landing.stripLabel}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-on-surface-variant">{landing.stripNote}</p>
              </div>

              <div className="hero-float-chip absolute bottom-8 left-2 hidden rounded-full border border-outline-variant bg-white px-4 py-2 text-sm font-extrabold text-on-surface-variant shadow-sm sm:block lg:left-0">
                {landing.quickStats[2]}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <h2 className="text-3xl font-extrabold tracking-[-0.025em] text-on-background sm:text-4xl">{landing.boothTitle}</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">{landing.boothText}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TrustRow icon="lock" title={copy.home.notes[0].title} text={copy.home.notes[0].text} />
              <TrustRow icon="flip_camera_android" title={copy.home.notes[1].title} text={copy.home.notes[1].text} />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-outline-variant bg-white p-5 shadow-panel sm:p-6 lg:p-7">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-extrabold tracking-[-0.025em] text-on-background sm:text-4xl">{landing.templatesTitle}</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-on-surface-variant">{landing.templatesText}</p>
              </div>
              <Link href="/templates" className="inline-flex w-fit items-center justify-center rounded-full border border-outline-variant bg-white px-5 py-3 text-sm font-extrabold text-on-background shadow-sm transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                {copy.home.browseAll}
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {featuredTemplates.map((theme) => (
                <TemplateCard key={theme.id} theme={theme} />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 pb-20 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="rounded-[2rem] border border-outline-variant bg-white p-6 shadow-panel sm:p-8">
              <h2 className="text-3xl font-extrabold tracking-[-0.025em] text-on-background sm:text-4xl">{landing.workflowTitle}</h2>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {landing.workflow.map(([title, text], index) => (
                  <div key={title} className="rounded-[1.5rem] bg-surface-container-low p-5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-on-background text-sm font-extrabold text-white">{index + 1}</span>
                    <h3 className="mt-4 font-extrabold tracking-tight text-on-background">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-[2rem] border border-outline-variant bg-on-background p-6 text-white shadow-panel sm:p-7">
              <span className="material-symbols-outlined flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-primary-container">shield_locked</span>
              <h2 className="mt-5 text-2xl font-extrabold tracking-tight">{landing.finalTitle}</h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-white/74">{landing.finalText}</p>
              <Link href="/shoot" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-extrabold text-on-background shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-on-background">
                {landing.primary}
              </Link>
            </aside>
          </div>
        </section>
      </main>
    </>
  )
}
