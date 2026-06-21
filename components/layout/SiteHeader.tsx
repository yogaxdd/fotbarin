'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { signOut } from 'firebase/auth'
import LanguageToggle from '@/components/i18n/LanguageToggle'
import { useAuth } from '@/components/auth/AuthProvider'
import { useI18n } from '@/components/i18n/I18nProvider'
import { auth } from '@/lib/firebase'

const navItems = [
  { href: '/templates', key: 'templates' },
  { href: '/community', key: 'community' },
  { href: '/pricing', key: 'pricing' },
] as const

const accountMenuItems = [
  { href: '/settings', label: 'Setting', icon: 'settings' },
] as const

type SiteHeaderProps = {
  rightAccessory?: React.ReactNode
}

export default function SiteHeader({ rightAccessory }: SiteHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, displayName, profileComplete, profileHref, isPremium, isAdmin } = useAuth()
  const { copy } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [roundedClass, setRoundedClass] = useState('rounded-full')
  const shapeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ignoreNextMenuClickRef = useRef(false)
  const ignoreNextAccountClickRef = useRef(false)

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const toggleMobileMenu = () => {
    setMenuOpen((current) => !current)
    setAccountMenuOpen(false)
  }

  const toggleAccountMenu = () => setAccountMenuOpen((current) => !current)

  const handleLogout = async () => {
    setAccountMenuOpen(false)
    setMenuOpen(false)
    await signOut(auth)
    router.push('/login')
  }

  useEffect(() => {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current)
    }

    if (menuOpen) {
      setRoundedClass('rounded-[1.75rem]')
    } else {
      shapeTimeoutRef.current = setTimeout(() => setRoundedClass('rounded-full'), 180)
    }

    return () => {
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current)
      }
    }
  }, [menuOpen])

  return (
    <header className="sticky top-3 z-50 flex justify-center px-3">
      <div
        className={`relative w-full max-w-5xl border border-outline-variant bg-white px-3 py-2 shadow-panel transition-[border-radius,box-shadow,background-color] duration-300 ease-out md:bg-white/88 md:backdrop-blur-xl md:supports-[backdrop-filter]:bg-white/76 sm:w-auto md:min-w-[720px] ${roundedClass}`}
      >
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="rounded-full px-2 py-1 text-lg font-extrabold leading-none tracking-tight text-primary transition hover:text-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            translate="no"
          >
            {copy.common.appName}
          </Link>

          <nav className="hidden items-center gap-1 rounded-full bg-surface-container-low/80 p-1 md:flex" translate="no">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex h-8 items-center whitespace-nowrap rounded-full px-3.5 text-sm font-bold leading-none transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    active
                      ? 'bg-on-background text-white shadow-sm'
                      : 'text-on-surface-variant hover:-translate-y-0.5 hover:bg-primary-container hover:text-on-primary-container hover:shadow-sm'
                  }`}
                >
                  {copy.nav[item.key]}
                </Link>
              )
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {rightAccessory}
            <LanguageToggle />
            {user ? (
              <div className="account-group group relative">
                <button
                  type="button"
                  className="account-trigger inline-flex items-center gap-2 rounded-full bg-secondary-container py-1 pl-1 pr-3 text-sm font-extrabold leading-none text-on-secondary-container shadow-sm hover:-translate-y-0.5 hover:shadow-sticker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-haspopup="menu"
                >
                  {user.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.photoURL} alt="" className="account-avatar h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="account-avatar material-symbols-outlined flex h-8 w-8 items-center justify-center rounded-full bg-white text-[19px]" style={{ fontVariationSettings: `'FILL' 1` }}>person</span>
                  )}
                  Akun
                </button>

                <div className="account-popover absolute right-0 top-full w-72 pt-3">
                  <div className="account-panel rounded-[1.6rem] border border-outline-variant bg-white p-3 text-left shadow-panel">
                    <div className="flex items-center gap-3 rounded-[1.25rem] bg-primary-container/70 p-3 text-on-primary-container">
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
                      <Link
                        href={profileComplete ? profileHref : '/login'}
                        className="account-menu-item flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container focus-visible:bg-primary-container focus-visible:text-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        role="menuitem"
                      >
                        <span className="material-symbols-outlined text-[20px]">person</span>
                        My Profil
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="account-menu-item flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-[oklch(35%_0.09_70)] hover:bg-[oklch(96.5%_0.035_78)] focus-visible:bg-[oklch(96.5%_0.035_78)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          role="menuitem"
                        >
                          <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                          Admin panel
                        </Link>
                      )}
                      {accountMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="account-menu-item flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container focus-visible:bg-primary-container focus-visible:text-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          role="menuitem"
                        >
                          <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="account-menu-item flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-error hover:bg-error-container hover:text-on-error-container focus-visible:bg-error-container focus-visible:text-on-error-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        role="menuitem"
                      >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className={`rounded-full px-3.5 py-2 text-sm font-bold leading-none transition-all duration-200 ease-out ${
                  isActive('/login')
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'text-on-surface-variant hover:-translate-y-0.5 hover:bg-primary-container hover:text-on-primary-container'
                }`}
              >
                {loading ? '...' : copy.nav.login}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LanguageToggle />
            <button
              type="button"
              onClick={() => {
                if (ignoreNextMenuClickRef.current) {
                  ignoreNextMenuClickRef.current = false
                  return
                }

                toggleMobileMenu()
              }}
              onPointerUp={(event) => {
                if (event.pointerType !== 'mouse') {
                  ignoreNextMenuClickRef.current = true
                  event.preventDefault()
                  toggleMobileMenu()
                }
              }}
              className="inline-flex h-10 w-10 touch-manipulation select-none items-center justify-center rounded-full border border-outline-variant bg-white text-on-background shadow-sm transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
            >
              <span className="material-symbols-outlined text-[22px] transition-transform duration-200" style={{ transform: menuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                {menuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="motion-menu absolute left-0 right-0 top-[calc(100%+0.6rem)] rounded-[1.75rem] border border-outline-variant bg-white/92 p-3 shadow-panel backdrop-blur-xl supports-[backdrop-filter]:bg-white/78 md:hidden">
            <nav className="grid gap-1" translate="no">
              <Link
                href="/beranda"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-base font-bold transition ${
                  isActive('/beranda') ? 'bg-on-background text-white' : 'text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container'
                }`}
              >
                Beranda
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </Link>

              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 text-base font-bold transition ${
                    isActive(item.href) ? 'bg-on-background text-white' : 'text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container'
                  }`}
                >
                  {copy.nav[item.key]}
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </Link>
              ))}

              {user ? (
                <div className="mt-2 rounded-[1.5rem] border border-outline-variant bg-white p-2 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      if (ignoreNextAccountClickRef.current) {
                        ignoreNextAccountClickRef.current = false
                        return
                      }

                      toggleAccountMenu()
                    }}
                    onPointerUp={(event) => {
                      if (event.pointerType !== 'mouse') {
                        ignoreNextAccountClickRef.current = true
                        event.preventDefault()
                        toggleAccountMenu()
                      }
                    }}
                    className="flex w-full touch-manipulation select-none items-center justify-between gap-3 rounded-[1.25rem] bg-secondary-container p-3 text-left text-on-secondary-container"
                    aria-expanded={accountMenuOpen}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      {user.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.photoURL} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary" style={{ fontVariationSettings: `'FILL' 1` }}>person</span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-extrabold text-on-background">{displayName}</span>
                        {isPremium ? (
                          <span className="motion-scan mt-1 inline-flex items-center gap-1 overflow-hidden rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-2 py-1 text-xs font-extrabold text-amber-950 shadow-sm">
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: `'FILL' 1` }}>workspace_premium</span>
                            Premium
                          </span>
                        ) : (
                          <span className="mt-1 block text-xs font-extrabold text-primary">Free Plan</span>
                        )}
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-[20px] transition-transform" style={{ transform: accountMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                  </button>

                  {accountMenuOpen && (
                    <div className="motion-menu mt-2 grid gap-1">
                      <Link
                        href={profileComplete ? profileHref : '/login'}
                        onClick={() => {
                          setAccountMenuOpen(false)
                          setMenuOpen(false)
                        }}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-on-surface-variant transition hover:bg-primary-container hover:text-on-primary-container"
                      >
                        <span className="material-symbols-outlined text-[20px]">person</span>
                        My Profil
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => {
                            setAccountMenuOpen(false)
                            setMenuOpen(false)
                          }}
                          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-[oklch(35%_0.09_70)] transition hover:bg-[oklch(96.5%_0.035_78)]"
                        >
                          <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                          Admin panel
                        </Link>
                      )}
                      {accountMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            setAccountMenuOpen(false)
                            setMenuOpen(false)
                          }}
                          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-on-surface-variant transition hover:bg-primary-container hover:text-on-primary-container"
                        >
                          <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-error transition hover:bg-error-container hover:text-on-error-container"
                      >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-white px-4 py-3 text-center font-bold text-on-background shadow-sm transition hover:bg-surface-container-low"
                  >
                    {loading ? '...' : copy.nav.login}
                  </Link>
                  <Link
                    href="/templates"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-2xl bg-on-background px-4 py-3 text-center font-extrabold text-white shadow-sm transition hover:bg-primary"
                  >
                    {copy.nav.explore}
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
