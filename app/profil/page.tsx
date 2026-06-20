'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SiteHeader from '@/components/layout/SiteHeader'
import { useAuth } from '@/components/auth/AuthProvider'

export default function ProfilPage() {
  const { loading, profileLoading, profileComplete, profileHref } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading || profileLoading) return
    router.replace(profileComplete ? profileHref : '/login')
  }, [loading, profileComplete, profileHref, profileLoading, router])

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="motion-rise w-full rounded-[2rem] border border-outline-variant bg-white p-6 text-center shadow-panel sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary-container text-primary">
            <span className="material-symbols-outlined text-3xl">person</span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-on-background">Membuka profil…</h1>
          <p className="mx-auto mt-3 max-w-md leading-7 text-on-surface-variant">
            Kalau belum berpindah otomatis, buka halaman login untuk melengkapi username.
          </p>
          <Link href="/login" className="mt-8 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5">
            Lengkapi profil
          </Link>
        </section>
      </main>
    </>
  )
}
