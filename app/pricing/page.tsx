'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { useAuth } from '@/components/auth/AuthProvider'
import SiteHeader from '@/components/layout/SiteHeader'
import { useI18n } from '@/components/i18n/I18nProvider'
import { db } from '@/lib/firebase'

type BillingCycle = 'monthly' | 'yearly'

export default function PricingPage() {
  const { copy } = useI18n()
  const router = useRouter()
  const { user, profileComplete, profileHref, isPremium, canClaimTrial, refreshProfile } = useAuth()
  const [billing, setBilling] = useState<BillingCycle>('monthly')
  const [activatingTrial, setActivatingTrial] = useState(false)
  const [activatingPurchase, setActivatingPurchase] = useState(false)
  const [trialError, setTrialError] = useState('')
  const premiumPrice = billing === 'monthly' ? copy.pricing.premiumPlan.monthlyPrice : copy.pricing.premiumPlan.yearlyPrice
  const premiumPeriod = billing === 'monthly' ? copy.pricing.month : copy.pricing.year
  const upgradeHref = user ? (profileComplete ? profileHref : '/login') : '/login'

  const activateTrial = async () => {
    if (!user || !profileComplete) {
      router.push('/login')
      return
    }

    if (!canClaimTrial || isPremium) return

    setActivatingTrial(true)
    setTrialError('')

    try {
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000

      await setDoc(doc(db, 'users', user.uid), {
        isPremium: true,
        premiumExpiresAt: expiresAt,
        trialUsed: true,
      }, { merge: true })

      await refreshProfile()
      router.push(profileHref)
    } catch {
      setTrialError('Trial belum berhasil diaktifkan. Coba lagi sebentar ya.')
    } finally {
      setActivatingTrial(false)
    }
  }

  const activateMockPurchase = async () => {
    if (!user || !profileComplete) {
      router.push('/login')
      return
    }

    if (isPremium) return

    setActivatingPurchase(true)
    setTrialError('')

    try {
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000

      await setDoc(doc(db, 'users', user.uid), {
        isPremium: true,
        premiumExpiresAt: expiresAt,
      }, { merge: true })

      await refreshProfile()
      router.push(profileHref)
    } catch {
      setTrialError('Premium belum berhasil diaktifkan. Coba lagi sebentar ya.')
    } finally {
      setActivatingPurchase(false)
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center px-4 py-12 sm:px-6 lg:px-8">
        <section className="motion-rise flex max-w-3xl flex-col items-center text-center">
          <h1 className="text-4xl font-extrabold tracking-[-0.03em] text-on-background sm:text-5xl">{copy.pricing.title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-on-surface-variant">{copy.pricing.subtitle}</p>
        </section>

        <div className="motion-rise-fast mt-8 flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-high p-1 shadow-sm" role="tablist" aria-label="Billing cycle">
          <button
            type="button"
            onClick={() => setBilling('monthly')}
            className={`rounded-full px-5 py-2.5 text-sm font-extrabold transition-all duration-200 ${
              billing === 'monthly'
                ? 'bg-white text-primary shadow-sm ring-1 ring-outline-variant'
                : 'text-on-surface-variant hover:bg-white/70 hover:text-on-background'
            }`}
            role="tab"
            aria-selected={billing === 'monthly'}
          >
            {copy.pricing.monthly}
          </button>
          <button
            type="button"
            onClick={() => setBilling('yearly')}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold transition-all duration-200 ${
              billing === 'yearly'
                ? 'bg-white text-primary shadow-sm ring-1 ring-outline-variant'
                : 'text-on-surface-variant hover:bg-white/70 hover:text-on-background'
            }`}
            role="tab"
            aria-selected={billing === 'yearly'}
          >
            {copy.pricing.yearly}
            <span className="rounded-full bg-tertiary-container px-2 py-0.5 text-[11px] font-extrabold text-on-tertiary-container">{copy.pricing.yearlyBadge}</span>
          </button>
        </div>

        <section className="mt-10 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch">
          <article className="motion-rise-fast flex flex-col rounded-[1.75rem] border border-outline-variant bg-white p-6 shadow-panel transition duration-200 hover:-translate-y-1 hover:shadow-sticker" style={{ animationDelay: '60ms' }}>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-on-background">{copy.pricing.freePlan.name}</h2>
              <p className="mt-4 text-4xl font-extrabold tracking-tight text-on-background">
                {copy.pricing.freePlan.price}
                <span className="ml-2 align-middle text-base font-bold text-on-surface-variant">{copy.pricing.forever}</span>
              </p>
            </div>

            <div className="my-6 h-px w-full bg-outline-variant" />

            <ul className="grid flex-1 gap-4">
              {copy.pricing.freePlan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-base font-bold leading-6 text-on-background">
                  <span className="material-symbols-outlined mt-0.5 text-[21px] text-secondary" style={{ fontVariationSettings: `'FILL' 1` }}>check_circle</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button className="mt-8 w-full rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-3.5 text-sm font-extrabold text-on-surface-variant shadow-sm" disabled>
              {isPremium ? 'Paket Free' : copy.pricing.currentPlan}
            </button>
          </article>

          <article className="motion-rise-fast relative flex flex-col rounded-[1.75rem] border border-primary/20 bg-primary-container p-6 shadow-panel transition duration-200 hover:-translate-y-1 hover:shadow-sticker md:-translate-y-4" style={{ animationDelay: '120ms' }}>
            <div className="absolute -right-3 -top-4 rotate-3 rounded-full border border-outline-variant bg-tertiary-container px-4 py-2 text-xs font-extrabold text-on-tertiary-container shadow-sm">
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: `'FILL' 1` }}>star</span>
                {copy.pricing.bestValue}
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-on-primary-container">{copy.pricing.premiumPlan.name}</h2>
              <p className="mt-4 text-4xl font-extrabold tracking-tight text-on-primary-container">
                {premiumPrice}
                <span className="ml-2 align-middle text-base font-bold text-on-primary-container/75">{premiumPeriod}</span>
              </p>
              <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-xs font-extrabold text-on-primary-container shadow-sm">
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: `'FILL' 1` }}>bolt</span>
                Free trial 1 hari, setelah itu balik Free
              </p>
            </div>

            <div className="my-6 h-px w-full bg-on-primary-container/18" />

            <ul className="grid flex-1 gap-4">
              {copy.pricing.premiumPlan.features.map((feature, index) => (
                <li key={feature} className="flex items-start gap-3 text-base font-bold leading-6 text-on-primary-container">
                  <span className="material-symbols-outlined mt-0.5 text-[21px]" style={{ fontVariationSettings: `'FILL' 1` }}>
                    {['palette', 'save', 'public', 'emoji_emotions', 'workspace_premium', 'high_quality'][index] ?? 'check_circle'}
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {isPremium ? (
              <button
                type="button"
                disabled
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 px-5 py-3.5 text-sm font-extrabold text-amber-950 shadow-sm disabled:cursor-default"
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: `'FILL' 1` }}>workspace_premium</span>
                Sudah Premium
              </button>
            ) : canClaimTrial ? (
              <button
                type="button"
                onClick={activateTrial}
                disabled={activatingTrial}
                className="motion-scan mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 px-5 py-3.5 text-sm font-extrabold text-amber-950 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-sticker disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: `'FILL' 1` }}>workspace_premium</span>
                {activatingTrial ? 'Mengaktifkan trial…' : 'Coba Gratis 1 Hari'}
              </button>
            ) : user && profileComplete ? (
              <button
                type="button"
                onClick={activateMockPurchase}
                disabled={activatingPurchase}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-on-background px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-primary hover:shadow-sticker disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: `'FILL' 1` }}>workspace_premium</span>
                {activatingPurchase ? 'Mengaktifkan Premium…' : 'Beli Premium'}
              </button>
            ) : (
              <Link href={upgradeHref} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-on-background hover:shadow-sticker">
                Login buat klaim trial
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            )}
            {trialError && (
              <p className="mt-3 rounded-2xl bg-error-container px-4 py-3 text-sm font-extrabold text-on-error-container" role="alert">
                {trialError}
              </p>
            )}
          </article>
        </section>
      </main>
    </>
  )
}
