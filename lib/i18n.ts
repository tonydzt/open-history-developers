export type Locale = 'en' | 'zh'

export const LOCALE_COOKIE_NAME = 'locale'
export const DEFAULT_LOCALE: Locale = 'en'

export const SUPPORTED_LOCALES: Locale[] = ['en', 'zh']

export function normalizeLocale(input?: string | null): Locale {
  if (!input) return DEFAULT_LOCALE
  const lowered = input.toLowerCase()
  if (lowered.startsWith('zh')) return 'zh'
  if (lowered.startsWith('en')) return 'en'
  return DEFAULT_LOCALE
}

export const messages = {
  en: {
    common: {
      siteTitle: 'VOT Open',
      language: 'Language',
      languageEnglish: 'English',
      languageChinese: 'Chinese',
      languageEnglishShort: 'EN',
      languageChineseShort: '中',
      close: 'Close',
      open: 'Open',
    },
    navbar: {
      signIn: 'Sign in',
      openNavMenu: 'Open navigation menu',
      closeNavMenu: 'Close navigation menu',
    },
    home: {
      badge: 'Documentation Hub',
      title: 'Vine of Time Open Platform',
      subtitle: 'Browse and explore technical documents quickly.',
      readDocument: 'Read Document',
      uncategorized: 'Uncategorized',
      emptyTitle: 'No documents yet',
      emptyHint: 'Please check back later.',
    },
  },
  zh: {
    common: {
      siteTitle: 'VOT 开放',
      language: '语言',
      languageEnglish: 'English',
      languageChinese: '中文',
      languageEnglishShort: 'EN',
      languageChineseShort: '中',
      close: '关闭',
      open: '打开',
    },
    navbar: {
      signIn: '登录',
      openNavMenu: '打开导航菜单',
      closeNavMenu: '关闭导航菜单',
    },
    home: {
      badge: '技术文档平台',
      title: 'Vine of Time 开放平台',
      subtitle: '浏览和探索我们的技术文档，快速找到您需要的信息',
      readDocument: '阅读文档',
      uncategorized: '未分类',
      emptyTitle: '暂无文档',
      emptyHint: '请稍后再来查看',
    },
  },
} as const

export type Messages = typeof messages

export function getMessages(locale: Locale) {
  return messages[locale]
}
