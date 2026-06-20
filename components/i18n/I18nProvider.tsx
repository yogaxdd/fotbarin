'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { detectLocale, dictionaries, type Locale } from '@/lib/i18n'

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  copy: typeof dictionaries.en
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const stored = window.localStorage.getItem('fotbarin-locale')
    const nextLocale = stored === 'en' || stored === 'id' ? stored : detectLocale(window.navigator.language)
    setLocaleState(nextLocale)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale)
    window.localStorage.setItem('fotbarin-locale', nextLocale)
  }

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      copy: dictionaries[locale],
    }),
    [locale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) {
    throw new Error('useI18n must be used inside I18nProvider')
  }
  return value
}
