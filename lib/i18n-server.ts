import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, normalizeLocale, type Locale } from '@/lib/i18n'
import { NextRequest } from 'next/server'

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const value = cookieStore.get(LOCALE_COOKIE_NAME)?.value
  return normalizeLocale(value) || DEFAULT_LOCALE
}

export function getLocaleFromRequest(request: NextRequest): Locale {
  const queryLocale = request.nextUrl.searchParams.get('locale')
  if (queryLocale) return normalizeLocale(queryLocale)

  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value
  if (cookieLocale) return normalizeLocale(cookieLocale)

  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) return normalizeLocale(acceptLanguage)

  return DEFAULT_LOCALE
}
