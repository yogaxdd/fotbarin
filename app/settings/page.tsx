'use client'

import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import { useAuth } from '@/components/auth/AuthProvider'
import { useI18n } from '@/components/i18n/I18nProvider'

export default function SettingsPage() {
  const { profileComplete, profileHref } = useAuth()
  const { locale, setLocale } = useI18n()

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="motion-rise w-full rounded-[2rem] border border-outline-variant bg-white p-6 shadow-panel sm:p-8">
          <div>
            <p className="text-sm font-extrabold text-primary">Setting</p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-on-background">Pengaturan akun</h1>
            <p className="mt-3 max-w-2xl leading-7 text-on-surface-variant">Atur preferensi dasar Fotbarin. Pengaturan tambahan bisa ditambahkan di sini nanti.</p>
          </div>

          <div className="mt-8 grid gap-4">
            <div className="rounded-[1.5rem] border border-outline-variant bg-surface-container-low p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-on-background">Bahasa</h2>
                  <p className="mt-1 text-sm font-semibold text-on-surface-variant">Pilih bahasa tampilan aplikasi.</p>
                </div>
                <div className="flex rounded-full border border-outline-variant bg-white p-1 shadow-sm">
                  {(['id', 'en'] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setLocale(item)}
                      className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${
                        locale === item ? 'bg-on-background text-white' : 'text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container'
                      }`}
                    >
                      {item.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-outline-variant bg-surface-container-low p-5">
              <h2 className="text-xl font-extrabold text-on-background">Privasi</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-on-surface-variant">Foto tetap diproses lokal di browser. Tidak ada upload foto otomatis dari booth.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={profileComplete ? profileHref : '/login'} className="rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5">
              My Profil
            </Link>
            <Link href="/beranda" className="rounded-full border border-outline-variant bg-white px-5 py-3 text-sm font-extrabold text-on-background shadow-sm transition hover:bg-surface-container-low">
              Kembali ke beranda
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
