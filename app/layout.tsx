import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import GlobalNavbar from '@/components/GlobalNavbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '文档开放平台',
  description: '技术文档开放平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Providers>
          <GlobalNavbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
