'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useEffect, useMemo, useState } from 'react'
import { signOut } from 'firebase/auth'
import LanguageToggle from '@/components/i18n/LanguageToggle'
import { useAuth } from '@/components/auth/AuthProvider'
import { auth } from '@/lib/firebase'
import { starterThemes } from '@/lib/frame-renderer'

const sidebarItems = [
  { label: 'Beranda', icon: 'home', href: '/beranda', active: true },
  { label: 'Template', icon: 'dashboard_customize', href: '/templates' },
  { label: 'Foto', icon: 'camera_alt', href: '/shoot' },
  { label: 'Komunitas', icon: 'groups', href: '/community' },
  { label: 'Profil', icon: 'person', href: '/profil' },
]

const recommendedTemplates = [
  { themeId: 'rose-studio', category: 'Bestie', note: 'Soft pink untuk foto bareng teman dekat' },
  { themeId: 'sky-receipt', category: 'Sendiri', note: 'Clean blue untuk selfie cepat' },
  { themeId: 'lavender-note', category: 'Couple', note: 'Lavender cute untuk pose manis' },
]

function getGreeting(hour: number) {
  if (hour >= 4 && hour < 11) return 'Selamat pagi'
  if (hour >= 11 && hour < 15) return 'Selamat siang'
  if (hour >= 15 && hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

function TemplatePreview({ themeId }: { themeId: string }) {
  const theme = starterThemes.find((item) => item.id === themeId) ?? starterThemes[0]

  return (
    <div className="flex h-56 flex-col gap-2 rounded-[1.35rem] p-3" style={{ backgroundColor: theme.background }}>
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="flex-1 rounded-xl border border-black/10 bg-white/72" />
      ))}
    </div>
  )
}

export default function BerandaPage() {
  const { displayName, user, profileComplete, profileHref, isPremium } = useAuth()
  const router = useRouter()
  const [hour, setHour] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const ignoreNextMobileMenuClickRef = useRef(false)

  useEffect(() => {
    setHour(new Date().getHours())
  }, [])

  const greeting = useMemo(() => getGreeting(hour ?? 9), [hour])

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_18%_-8%,oklch(93%_0.045_350_/_0.7),transparent_32rem),radial-gradient(circle_at_88%_8%,oklch(92%_0.04_205_/_0.55),transparent_28rem),linear-gradient(180deg,oklch(98.5%_0.006_330),oklch(96.5%_0.008_330))] text-on-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-[2rem] border border-outline-variant bg-white/86 p-4 shadow-panel backdrop-blur-xl lg:flex">
          <Link href="/" className="mb-6 flex items-center gap-3 rounded-2xl px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-lg font-extrabold text-white">F</span>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-primary" translate="no">Fotbarin</p>
              <p className="text-xs font-bold text-on-surface-variant">Home dashboard</p>
            </div>
          </Link>

          <nav className="grid gap-2">
            {sidebarItems.map((item) => {
              const itemHref = item.label === 'Profil' ? (profileComplete ? profileHref : '/login') : item.href

              return (
                <Link
                  key={item.href}
                  href={itemHref}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    item.active
                      ? 'bg-on-background text-white shadow-sm'
                      : 'text-on-surface-variant hover:-translate-y-0.5 hover:bg-primary-container hover:text-on-primary-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[21px]" style={{ fontVariationSettings: `'FILL' ${item.active ? 1 : 0}` }}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto rounded-[1.5rem] bg-primary-container p-4 text-on-primary-container">
            <p className="text-sm font-extrabold">Privasi tetap aman</p>
            <p className="mt-2 text-sm font-semibold leading-6">Foto diproses lokal di browser. Mulai kamera hanya saat kamu siap foto.</p>
            <Link href="/shoot" className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-on-background px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5">
              Buka booth
            </Link>
          </div>
        </aside>

        <section className="min-w-0 flex-1 pb-8">
          <header className="relative sticky top-3 z-40 mb-5 rounded-full border border-outline-variant bg-white/88 px-3 py-2 shadow-panel backdrop-blur-xl supports-[backdrop-filter]:bg-white/76 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="rounded-full px-2 py-1 text-lg font-extrabold leading-none tracking-tight text-primary transition hover:text-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" translate="no">Fotbarin</Link>
              <div className="flex items-center gap-2">
                <LanguageToggle />
                <button
                  type="button"
                  onClick={() => {
                    if (ignoreNextMobileMenuClickRef.current) {
                      ignoreNextMobileMenuClickRef.current = false
                      return
                    }

                    setMobileMenuOpen((current) => !current)
                  }}
                  onPointerUp={(event) => {
                    if (event.pointerType !== 'mouse') {
                      ignoreNextMobileMenuClickRef.current = true
                      event.preventDefault()
                      setMobileMenuOpen((current) => !current)
                    }
                  }}
                  className="inline-flex h-10 w-10 touch-manipulation select-none items-center justify-center rounded-full border border-outline-variant bg-white text-on-background shadow-sm transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
                  aria-expanded={mobileMenuOpen}
                >
                  <span className="material-symbols-outlined text-[22px] transition-transform duration-200" style={{ transform: mobileMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    {mobileMenuOpen ? 'close' : 'menu'}
                  </span>
                </button>
              </div>
            </div>

            {mobileMenuOpen && (
              <nav className="motion-menu absolute left-0 right-0 top-[calc(100%+0.6rem)] grid gap-1 rounded-[1.75rem] border border-outline-variant bg-white p-3 shadow-panel ring-1 ring-white/70 supports-[backdrop-filter]:bg-white/96 supports-[backdrop-filter]:backdrop-blur-2xl">
                {sidebarItems.map((item) => {
                  const itemHref = item.label === 'Profil' ? (profileComplete ? profileHref : '/login') : item.href

                  return (
                    <Link
                      key={item.href}
                      href={itemHref}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                        item.active ? 'bg-on-background text-white' : 'text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: `'FILL' ${item.active ? 1 : 0}` }}>{item.icon}</span>
                        {item.label}
                      </span>
                      <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </Link>
                  )
                })}
              </nav>
            )}
          </header>

          <div className="mb-5 hidden items-center justify-between gap-4 lg:flex">
            <div>
              <p className="text-sm font-extrabold text-primary">Beranda</p>
              <p className="text-sm font-semibold text-on-surface-variant">Pilih vibe dulu, lalu masuk ke booth.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-white/80 p-1.5 shadow-sm">
              <LanguageToggle />
              {user ? (
                <div className="account-group group relative">
                  <button
                    type="button"
                    className="account-trigger flex items-center gap-2 rounded-full bg-secondary-container py-1 pl-1 pr-4 text-sm font-extrabold text-on-secondary-container hover:-translate-y-0.5 hover:shadow-sticker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-haspopup="menu"
                  >
                    {user.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.photoURL} alt="" className="account-avatar h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="account-avatar material-symbols-outlined flex h-8 w-8 items-center justify-center rounded-full bg-white text-[19px] text-primary" style={{ fontVariationSettings: `'FILL' 1` }}>person</span>
                    )}
                    Akun
                  </button>

                  <div className="account-popover absolute right-0 top-full w-72 pt-3">
                    <div className="account-panel rounded-[1.6rem] border border-outline-variant bg-white p-3 text-left shadow-panel">
                      <div className="flex items-center gap-3 rounded-[1.25rem] bg-primary-container/70 p-3">
                        {user.photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.photoURL} alt="" className="h-11 w-11 rounded-full object-cover shadow-sm" />
                        ) : (
                          <span className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary" style={{ fontVariationSettings: `'FILL' 1` }}>person</span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-on-background">{displayName}</p>
                          {isPremium ? (
                            <p className="motion-scan mt-1 inline-flex items-center gap-1 overflow-hidden rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-2 py-1 text-xs font-extrabold text-amber-950 shadow-sm">
                              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: `'FILL' 1` }}>workspace_premium</span>
                              Premium
                            </p>
                          ) : (
                            <p className="mt-1 inline-flex rounded-full bg-white/80 px-2 py-1 text-xs font-extrabold text-primary">Free Plan</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 grid gap-1">
                        <Link href={profileComplete ? profileHref : '/login'} className="account-menu-item flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container focus-visible:bg-primary-container focus-visible:text-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" role="menuitem">
                          <span className="material-symbols-outlined text-[20px]">person</span>
                          My Profil
                        </Link>
                        <Link href="/settings" className="account-menu-item flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container focus-visible:bg-primary-container focus-visible:text-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" role="menuitem">
                          <span className="material-symbols-outlined text-[20px]">settings</span>
                          Setting
                        </Link>
                        <button type="button" onClick={handleLogout} className="account-menu-item flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-error hover:bg-error-container hover:text-on-error-container focus-visible:bg-error-container focus-visible:text-on-error-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" role="menuitem">
                          <span className="material-symbols-outlined text-[20px]">logout</span>
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold text-on-surface-variant transition hover:bg-primary-container hover:text-on-primary-container">
                  Login
                </Link>
              )}
            </div>
          </div>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="overflow-hidden rounded-[2rem] border border-outline-variant bg-white shadow-panel">
              <div className="p-6 md:p-8">
                <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-success-container px-3 py-1.5 text-sm font-extrabold text-success">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Siap bikin photo strip
                </p>
                <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-[-0.03em] text-on-background sm:text-5xl">
                  {greeting}, {displayName}.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">
                  Pilih template rekomendasi atau langsung buka booth kalau sudah siap. Semua proses foto tetap berjalan lokal di browser.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/shoot" className="rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-sticker">
                    Mulai foto
                  </Link>
                  <Link href="/templates" className="rounded-full border border-outline-variant bg-white px-5 py-3 text-sm font-extrabold text-on-background shadow-sm transition hover:bg-surface-container-low">
                    Lihat template
                  </Link>
                </div>
              </div>
            </div>

            <aside className="hidden rounded-[2rem] border border-outline-variant bg-white p-5 shadow-panel xl:block">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-primary">Status hari ini</p>
                  <h2 className="text-2xl font-extrabold tracking-tight text-on-background">Belum ada sesi foto</h2>
                </div>
                <span className="material-symbols-outlined flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container text-primary">photo_camera</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">Mulai dari rekomendasi template, atau langsung buka kamera kalau sudah siap.</p>
              <div className="mt-5 grid gap-2">
                {['Tanpa login untuk foto', 'Retake per slot', 'Download PNG lokal'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-extrabold text-on-surface-variant">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    {item}
                  </div>
                ))}
              </div>
              <Link href="/shoot" className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-sticker">
                Mulai foto
              </Link>
            </aside>
          </section>

          <section className="mt-6 rounded-[2rem] border border-outline-variant bg-white p-5 shadow-panel md:p-6">
            <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-on-background">Rekomendasi template</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
                  Ini slot rekomendasi sementara. Nanti data template dari kamu bisa dipasang di sini tanpa mengubah struktur halaman.
                </p>
              </div>
              <Link href="/templates" className="inline-flex w-fit rounded-full border border-outline-variant bg-white px-5 py-3 text-sm font-extrabold text-on-background shadow-sm transition hover:bg-surface-container-low">
                Lihat semua template
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {recommendedTemplates.map((item) => {
                const theme = starterThemes.find((themeItem) => themeItem.id === item.themeId) ?? starterThemes[0]

                return (
                  <Link key={item.themeId} href="/shoot" className="group rounded-[1.75rem] border border-outline-variant bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                    <TemplatePreview themeId={item.themeId} />
                    <div className="flex items-start justify-between gap-3 px-1 pb-1 pt-4">
                      <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-primary-container px-2.5 py-1 text-xs font-extrabold text-on-primary-container">{item.category}</span>
                          <span className="text-xs font-bold text-on-surface-variant">4-cut</span>
                        </div>
                        <h3 className="truncate text-lg font-extrabold text-on-background">{theme.name}</h3>
                        <p className="mt-1 text-sm font-semibold leading-6 text-on-surface-variant">{item.note}</p>
                      </div>
                      <span className="material-symbols-outlined mt-1 rounded-full bg-surface-container-low p-2 text-primary transition group-hover:bg-primary group-hover:text-white">arrow_forward</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
