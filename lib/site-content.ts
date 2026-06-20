export type TemplateCardShape = 'strip' | 'portrait' | 'square'

export type ManagedTemplateItem = {
  id: string
  title: string
  themeId: string
  badge?: string
  shape?: TemplateCardShape
}

export type ManagedTemplateRow = {
  id: string
  title: string
  subtitle: string
  ctaLabel: string
  items: ManagedTemplateItem[]
}

export type SiteContent = {
  templates: {
    heroTitle: string
    heroSubtitle: string
    rows: ManagedTemplateRow[]
  }
}

export const SITE_CONTENT_STORAGE_KEY = 'fotbarin-site-content-v1'

export const defaultSiteContent: SiteContent = {
  templates: {
    heroTitle: 'Pilih template buat photo strip kamu.',
    heroSubtitle:
      'Scroll tiap koleksi, cari vibe yang cocok, lalu masuk booth. Setiap baris punya mood dan bentuk preview yang beda supaya pilihan terasa hidup.',
    rows: [
      {
        id: 'popular-strips',
        title: 'Photo strip populer',
        subtitle: 'Frame vertikal 4-cut yang paling cepat dipakai buat selfie, bestie, dan couple shot.',
        ctaLabel: 'Lihat semua',
        items: [
          { id: 'rose-soft', title: 'Rose Studio', themeId: 'rose-studio', badge: 'Soft', shape: 'strip' },
          { id: 'sky-clean', title: 'Sky Receipt', themeId: 'sky-receipt', badge: 'Clean', shape: 'strip' },
          { id: 'matcha-minimal', title: 'Matcha Frame', themeId: 'matcha-frame', badge: 'Minimal', shape: 'strip' },
          { id: 'classic-studio', title: 'Classic White', themeId: 'classic-white', badge: 'Studio', shape: 'strip' },
          { id: 'ink-film', title: 'Ink Film', themeId: 'ink-film', badge: 'Film', shape: 'strip' },
          { id: 'lavender-cute', title: 'Lavender Note', themeId: 'lavender-note', badge: 'Cute', shape: 'strip' },
        ],
      },
      {
        id: 'cute-effects',
        title: 'Efek cute & playful',
        subtitle: 'Preview yang lebih ekspresif untuk hasil yang terasa manis tanpa kelihatan kekanak-kanakan.',
        ctaLabel: 'Lihat semua',
        items: [
          { id: 'felt-doll', title: 'Boneka Felt', themeId: 'lavender-note', badge: 'Baru', shape: 'portrait' },
          { id: 'snow-soft', title: 'Singkap Salju', themeId: 'sky-receipt', shape: 'portrait' },
          { id: 'soft-focus', title: 'Fokus Alami', themeId: 'matcha-frame', shape: 'portrait' },
          { id: 'pink-room', title: 'Pink Room', themeId: 'rose-studio', badge: 'Cute', shape: 'portrait' },
          { id: 'midnight-flash', title: 'Midnight Flash', themeId: 'ink-film', shape: 'portrait' },
          { id: 'clean-idol', title: 'Clean Idol', themeId: 'classic-white', shape: 'portrait' },
        ],
      },
      {
        id: 'mini-sets',
        title: 'Mini set sekali klik',
        subtitle: 'Format compact buat moodboard, avatar, atau upload cepat ke story.',
        ctaLabel: 'Lihat semua',
        items: [
          { id: 'bestie-grid', title: 'Bestie Grid', themeId: 'rose-studio', shape: 'square' },
          { id: 'daily-clean', title: 'Daily Clean', themeId: 'classic-white', shape: 'square' },
          { id: 'matcha-day', title: 'Matcha Day', themeId: 'matcha-frame', shape: 'square' },
          { id: 'blue-hour', title: 'Blue Hour', themeId: 'sky-receipt', shape: 'square' },
          { id: 'violet-note', title: 'Violet Note', themeId: 'lavender-note', shape: 'square' },
          { id: 'film-box', title: 'Film Box', themeId: 'ink-film', shape: 'square' },
        ],
      },
    ],
  },
}

export function parseSiteContent(value: string | null): SiteContent {
  if (!value) return defaultSiteContent

  try {
    const parsed = JSON.parse(value) as SiteContent
    return {
      templates: {
        heroTitle: parsed.templates?.heroTitle || defaultSiteContent.templates.heroTitle,
        heroSubtitle: parsed.templates?.heroSubtitle || defaultSiteContent.templates.heroSubtitle,
        rows: Array.isArray(parsed.templates?.rows) && parsed.templates.rows.length > 0 ? parsed.templates.rows : defaultSiteContent.templates.rows,
      },
    }
  } catch {
    return defaultSiteContent
  }
}
