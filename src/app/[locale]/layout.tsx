import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';
import { defineI18nUI } from 'fumadocs-ui/i18n';
import { i18n } from '@/lib/i18n';

const inter = Inter({
  subsets: ['latin'],
});

const { provider } = defineI18nUI(i18n, {
  translations: {
    en: {
      displayName: 'English',
    },
    zh: {
      displayName: 'Chinese',
      search: '搜索文档',
    },
  },
});

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: '[locale]/';
}) {
  const locale = (await params).locale;

  return (
    <html lang={locale} className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider i18n={provider(locale)}>{children}</RootProvider>
      </body>
    </html>
  );
}
