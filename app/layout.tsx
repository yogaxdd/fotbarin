import type { Metadata } from 'next'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { I18nProvider } from '@/components/i18n/I18nProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fotbarin - Privacy-first web photobooth',
  description: 'Create cute photobooth strips in your browser. No app, no photo upload.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          <I18nProvider>{children}</I18nProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
