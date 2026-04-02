import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import GlobalNavbar from '@/components/GlobalNavbar'
import { getServerLocale } from '@/lib/i18n-server'

export const metadata: Metadata = {
  title: 'Vine of Time Open Platform',
  description: 'Open documentation platform',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getServerLocale()

  return (
    <html lang={locale}>
      <body className="font-sans">
        <Providers>
          <GlobalNavbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
