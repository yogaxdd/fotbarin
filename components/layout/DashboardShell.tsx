'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { signOut } from 'firebase/auth'
import LanguageToggle from '@/components/i18n/LanguageToggle'
import { useAuth } from '@/components/auth/AuthProvider'
import { auth } from '@/lib/firebase'

type DashboardSection = 'beranda' | 'templates' | 'shoot' | 'community' | 'profile'

type DashboardShellProps = {
  active: DashboardSection
  title: string
  subtitle: string
  sidebarLabel?: string
  children: React.ReactNode
  rightAccessory?: React.ReactNode
}

const accountMenuItems = [
  { href: '/settings', label: 'Setting', icon: 'settings' },
] as const

const baseSidebarItems = [
  { section: 'beranda', label: 'Beranda', icon: 'home', href: '/beranda' },
  { section: 'templates', label: 'Template', icon: 'dashboard_customize', href: '/templates' },
  { section: 'shoot', label: 'Foto', icon: 'camera_alt', href: '/shoot' },
  { section: 'community', label: 'Komunitas', icon: 'groups', href: '/community' },
] as const

export default function DashboardShell({ active, title, subtitle, sidebarLabel = 'Home dashboard', children, rightAccessory }: DashboardShellProps) {
  const router = useRouter()
  const { user, displayName, profileComplete, profileHref, isPremium, isAdmin } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const ignoreNextMobileMenuClickRef = useRef(false)

  const sidebarItems = [
    ...baseSidebarItems,
    { section: 'profile', label: 'Profil', icon: 'person', href: profileComplete ? profileHref : '/login' },
  ]

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
              <p className="text-xs font-bold text-on-surface-variant">{sidebarLabel}</p>
            </div>
          </Link>

          <nav className="grid gap-2">
            {sidebarItems.map((item) => {
              const isActive = item.section === active
              return (
                <Link
                  key={item.section}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    isActive
                      ? 'bg-on-background text-white shadow-sm'
                      : 'text-on-surface-variant hover:-translate-y-0.5 hover:bg-primary-container hover:text-on-primary-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[21px]" style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}>{item.icon}</span>
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
                  const isActive = item.section === active
                  return (
                    <Link
                      key={item.section}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                        isActive ? 'bg-on-background text-white' : 'text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}>{item.icon}</span>
                        {item.label}
                      </span>
                      <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </Link>
                  )
                })}
              </nav>
            )}
          </header>

          <div className="sticky top-3 z-50 mb-5 hidden items-center justify-between gap-4 rounded-full border border-outline-variant bg-white/82 px-3 py-2 shadow-panel backdrop-blur-xl supports-[backdrop-filter]:bg-white/72 lg:flex">
            <div>
              <p className="text-sm font-extrabold text-primary">{title}</p>
              <p className="text-sm font-semibold text-on-surface-variant">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-white/80 p-1.5 shadow-sm">
              {rightAccessory}
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
                        {isAdmin && (
                          <Link href="/admin" className="account-menu-item flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-[oklch(35%_0.09_70)] hover:bg-[oklch(96.5%_0.035_78)] focus-visible:bg-[oklch(96.5%_0.035_78)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" role="menuitem">
                            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                            Admin panel
                          </Link>
                        )}
                        {accountMenuItems.map((item) => (
                          <Link key={item.href} href={item.href} className="account-menu-item flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container focus-visible:bg-primary-container focus-visible:text-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" role="menuitem">
                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                            {item.label}
                          </Link>
                        ))}
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

          {children}
        </section>
      </div>
    </main>
  )
}
