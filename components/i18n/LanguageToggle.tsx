'use client'

import { useRef } from 'react'
import { useI18n } from '@/components/i18n/I18nProvider'

export default function LanguageToggle() {
  const { locale, setLocale, copy } = useI18n()
  const ignoreNextClickRef = useRef(false)
  const nextLocale = locale === 'en' ? 'id' : 'en'

  const handleToggle = () => setLocale(nextLocale)

  return (
    <button
      type="button"
      onClick={() => {
        if (ignoreNextClickRef.current) {
          ignoreNextClickRef.current = false
          return
        }

        handleToggle()
      }}
      onPointerUp={(event) => {
        if (event.pointerType !== 'mouse') {
          ignoreNextClickRef.current = true
          event.preventDefault()
          handleToggle()
        }
      }}
      className="inline-flex touch-manipulation select-none items-center gap-2 rounded-full border border-outline-variant bg-white px-3 py-2 text-sm font-bold text-on-background shadow-sm transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`${copy.common.language}: ${locale === 'en' ? copy.common.english : copy.common.indonesian}`}
      title={`${copy.common.language}: ${locale === 'en' ? copy.common.english : copy.common.indonesian}`}
    >
      <span className="material-symbols-outlined text-[18px]">language</span>
      <span>{locale.toUpperCase()}</span>
    </button>
  )
}
