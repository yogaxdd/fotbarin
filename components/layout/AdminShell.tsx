'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { signOut } from 'firebase/auth'
import LanguageToggle from '@/components/i18n/LanguageToggle'
import { useAuth } from '@/components/auth/AuthProvider'
import { auth } from '@/lib/firebase'

type AdminSection = 'overview' | 'content' | 'users' | 'settings'

type AdminShellProps = {
  active: AdminSection
  title: string
  subtitle: string
  children: React.ReactNode
  rightAccessory?: React.ReactNode
}

const adminSidebarItems = [
  { section: 'overview', label: 'Overview', icon: 'space_dashboard', href: '/admin?panel=overview' },
  { section: 'content', label: 'Konten website', icon: 'edit_note', href: '/admin?panel=content' },
  { section: 'users', label: 'Pengguna', icon: 'group', href: '/admin?panel=users' },
  { section: 'settings', label: 'Admin settings', icon: 'manufacturing', href: '/admin?panel=settings' },
] as const

export default function AdminShell({ active, title, subtitle, children, rightAccessory }: AdminShellProps) {
  const router = useRouter()
  const { user, displayName, profileComplete, profileHref, isPremium } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const ignoreNextMobileMenuClickRef = useRef(false)

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_14%_-10%,oklch(92%_0.085_72_/_0.55),transparent_30rem),radial-gradient(circle_at_96%_6%,oklch(92%_0.04_205_/_0.36),transparent_28rem),linear-gradient(180deg,oklch(98%_0.006_80),oklch(95.8%_0.009_80))] text-on-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-80 shrink-0 flex-col rounded-[2rem] border border-[oklch(78%_0.035_78)] bg-[oklch(99%_0.004_80_/_0.92)] p-4 shadow-panel backdrop-blur-xl lg:flex">
          <Link href="/admin" className="mb-5 flex items-center gap-3 rounded-2xl px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(54%_0.12_70)] focus-visible:ring-offset-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[oklch(54%_0.12_70)] text-white shadow-sm">
              <span className="material-symbols-outlined text-[23px]" style={{ fontVariationSettings: `'FILL' 1` }}>admin_panel_settings</span>
            </span>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-[oklch(35%_0.09_70)]" translate="no">Fotbarin Admin</p>
              <p className="text-xs font-bold text-on-surface-variant">Panel khusus pengelola</p>
            </div>
          </Link>

          <div className="mb-4 rounded-[1.5rem] border border-[oklch(86%_0.035_78)] bg-[oklch(96.5%_0.035_78)] p-4 text-[oklch(30%_0.075_70)]">
            <p className="text-xs font-extrabold uppercase tracking-[0.08em]">Workspace</p>
            <p className="mt-1 text-sm font-extrabold">Content operations</p>
            <p className="mt-2 text-xs font-bold leading-5 text-[oklch(39%_0.055_70)]">Ubah konten publik tanpa mengganggu pengalaman user.</p>
          </div>

          <nav className="grid gap-1.5" aria-label="Admin navigation">
            {adminSidebarItems.map((item) => {
              const isActive = item.section === active
              const content = (
                <>
                  <span className="material-symbols-outlined text-[21px]" style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}>{item.icon}</span>
                  <span className="min-w-0 flex-1">{item.label}</span>
                </>
              )

              return (
                <Link
                  key={item.section}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(54%_0.12_70)] focus-visible:ring-offset-2 ${
                    isActive
                      ? 'bg-[oklch(23%_0.045_70)] text-white shadow-sm'
                      : 'text-on-surface-variant hover:-translate-y-0.5 hover:bg-[oklch(94.5%_0.04_78)] hover:text-[oklch(32%_0.08_70)]'
                  }`}
                >
                  {content}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto grid gap-2 border-t border-[oklch(86%_0.025_78)] pt-4">
            <Link href="/beranda" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold text-on-surface-variant transition hover:bg-white hover:text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(54%_0.12_70)] focus-visible:ring-offset-2">
              <span className="material-symbols-outlined text-[21px]">arrow_back</span>
              Kembali ke user site
            </Link>
            <Link href="/templates" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold text-on-surface-variant transition hover:bg-white hover:text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(54%_0.12_70)] focus-visible:ring-offset-2">
              <span className="material-symbols-outlined text-[21px]">visibility</span>
              Preview template
            </Link>
          </div>
        </aside>

        <section className="min-w-0 flex-1 pb-8">
          <header className="relative sticky top-3 z-40 mb-5 rounded-full border border-[oklch(82%_0.03_78)] bg-white/90 px-3 py-2 shadow-panel backdrop-blur-xl supports-[backdrop-filter]:bg-white/76 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <Link href="/admin" className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-extrabold leading-none tracking-tight text-[oklch(35%_0.09_70)] transition hover:text-[oklch(25%_0.08_70)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(54%_0.12_70)] focus-visible:ring-offset-2" translate="no">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: `'FILL' 1` }}>admin_panel_settings</span>
                Admin
              </Link>
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
                  className="inline-flex h-10 w-10 touch-manipulation select-none items-center justify-center rounded-full border border-outline-variant bg-white text-on-background shadow-sm transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(54%_0.12_70)] focus-visible:ring-offset-2"
                  aria-label={mobileMenuOpen ? 'Tutup menu admin' : 'Buka menu admin'}
                  aria-expanded={mobileMenuOpen}
                >
                  <span className="material-symbols-outlined text-[22px] transition-transform duration-200" style={{ transform: mobileMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    {mobileMenuOpen ? 'close' : 'menu'}
                  </span>
                </button>
              </div>
            </div>

            {mobileMenuOpen && (
              <nav className="motion-menu absolute left-0 right-0 top-[calc(100%+0.6rem)] grid gap-1 rounded-[1.75rem] border border-[oklch(82%_0.03_78)] bg-white p-3 shadow-panel ring-1 ring-white/70 supports-[backdrop-filter]:bg-white/96 supports-[backdrop-filter]:backdrop-blur-2xl" aria-label="Admin mobile navigation">
                {adminSidebarItems.map((item) => {
                  const isActive = item.section === active

                  return (
                    <Link
                      key={item.section}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                        isActive ? 'bg-[oklch(23%_0.045_70)] text-white' : 'text-on-surface-variant hover:bg-[oklch(94.5%_0.04_78)] hover:text-[oklch(32%_0.08_70)]'
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
                <Link href="/beranda" onClick={() => setMobileMenuOpen(false)} className="mt-2 flex items-center justify-between rounded-2xl border border-outline-variant px-4 py-3 text-sm font-extrabold text-on-background transition hover:bg-surface-container-low">
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    Kembali ke user site
                  </span>
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </Link>
              </nav>
            )}
          </header>

          <div className="sticky top-3 z-50 mb-5 hidden items-center justify-between gap-4 rounded-[1.5rem] border border-[oklch(82%_0.03_78)] bg-white/84 px-4 py-3 shadow-panel backdrop-blur-xl supports-[backdrop-filter]:bg-white/74 lg:flex">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[oklch(58%_0.13_70)]" />
                <p className="text-sm font-extrabold text-[oklch(35%_0.09_70)]">{title}</p>
              </div>
              <p className="mt-1 truncate text-sm font-semibold text-on-surface-variant">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-white/80 p-1.5 shadow-sm">
              {rightAccessory}
              <LanguageToggle />
              {user ? (
                <div className="account-group group relative">
                  <button
                    type="button"
                    className="account-trigger flex items-center gap-2 rounded-full bg-[oklch(96.5%_0.035_78)] py-1 pl-1 pr-4 text-sm font-extrabold text-[oklch(30%_0.075_70)] hover:-translate-y-0.5 hover:shadow-sticker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(54%_0.12_70)] focus-visible:ring-offset-2"
                    aria-haspopup="menu"
                  >
                    {user.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.photoURL} alt="" className="account-avatar h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="account-avatar material-symbols-outlined flex h-8 w-8 items-center justify-center rounded-full bg-white text-[19px] text-[oklch(35%_0.09_70)]" style={{ fontVariationSettings: `'FILL' 1` }}>person</span>
                    )}
                    Admin
                  </button>

                  <div className="account-popover absolute right-0 top-full w-72 pt-3">
                    <div className="account-panel rounded-[1.6rem] border border-outline-variant bg-white p-3 text-left shadow-panel">
                      <div className="flex items-center gap-3 rounded-[1.25rem] bg-[oklch(96.5%_0.035_78)] p-3">
                        {user.photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.photoURL} alt="" className="h-11 w-11 rounded-full object-cover shadow-sm" />
                        ) : (
                          <span className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-full bg-white text-[oklch(35%_0.09_70)]" style={{ fontVariationSettings: `'FILL' 1` }}>person</span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-on-background">{displayName}</p>
                          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/82 px-2 py-1 text-xs font-extrabold text-[oklch(35%_0.09_70)]">
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: `'FILL' 1` }}>verified_user</span>
                            Admin{isPremium ? ' · Premium' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 grid gap-1">
                        <Link href={profileComplete ? profileHref : '/login'} className="account-menu-item flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container focus-visible:bg-primary-container focus-visible:text-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" role="menuitem">
                          <span className="material-symbols-outlined text-[20px]">person</span>
                          My Profil
                        </Link>
                        <Link href="/settings" className="account-menu-item flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container focus-visible:bg-primary-container focus-visible:text-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" role="menuitem">
                          <span className="material-symbols-outlined text-[20px]">settings</span>
                          Setting akun
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

          {children}
        </section>
      </div>
    </main>
  )
}
