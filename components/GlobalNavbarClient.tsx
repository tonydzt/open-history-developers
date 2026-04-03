'use client'

import Link from 'next/link'
import { ChevronDown, Languages, Menu, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import UserMenu from '@/components/UserMenu'
import {
  LOCALE_COOKIE_NAME,
  type Locale,
  type Messages,
} from '@/lib/i18n'

export interface NavbarCategoryGroup {
  categoryId: string
  categoryName: string
  entries: Array<{ id: string; title: string; slug: string }>
}

interface GlobalNavbarClientProps {
  categoryGroups: NavbarCategoryGroup[]
  locale: Locale
  labels: Messages[Locale]
}

export default function GlobalNavbarClient({ categoryGroups, locale, labels }: GlobalNavbarClientProps) {
  const desktopMenuWidth = 224
  const localeMenuWidth = 112
  const [desktopOpenCategory, setDesktopOpenCategory] = useState<string | null>(null)
  const [desktopMenuStyle, setDesktopMenuStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileOpenCategory, setMobileOpenCategory] = useState<string | null>(null)
  const [localeMenuOpen, setLocaleMenuOpen] = useState(false)
  const [localeMenuStyle, setLocaleMenuStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const localeCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const localeTriggerRef = useRef<HTMLDivElement>(null)
  const localeMenuRef = useRef<HTMLDivElement>(null)
  const canUseDOM = typeof document !== 'undefined'
  const hasCategoryGroups = categoryGroups.length > 0

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const clearLocaleCloseTimer = () => {
    if (localeCloseTimerRef.current) {
      clearTimeout(localeCloseTimerRef.current)
      localeCloseTimerRef.current = null
    }
  }

  const handleDesktopEnter = (categoryId: string) => {
    clearCloseTimer()
    if (canUseDOM) {
      const trigger = triggerRefs.current[categoryId]
      if (trigger) {
        const rect = trigger.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const left = Math.min(Math.max(8, rect.left), viewportWidth - desktopMenuWidth - 8)
        const top = rect.bottom + 8
        setDesktopMenuStyle({ top, left })
      }
    }
    setDesktopOpenCategory(categoryId)
  }

  const handleDesktopLeave = () => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      setDesktopOpenCategory(null)
    }, 120)
  }

  const handleLocaleEnter = () => {
    clearLocaleCloseTimer()
    if (canUseDOM) {
      const trigger = localeTriggerRef.current
      if (trigger) {
        const rect = trigger.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const left = Math.min(Math.max(8, rect.right - localeMenuWidth), viewportWidth - localeMenuWidth - 8)
        const top = rect.bottom + 8
        setLocaleMenuStyle({ top, left })
      }
    }
    setLocaleMenuOpen(true)
  }

  const handleLocaleLeave = () => {
    clearLocaleCloseTimer()
    localeCloseTimerRef.current = setTimeout(() => {
      setLocaleMenuOpen(false)
    }, 120)
  }

  useEffect(() => {
    if (!desktopOpenCategory || !canUseDOM) return

    const update = () => {
      const trigger = triggerRefs.current[desktopOpenCategory]
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const left = Math.min(Math.max(8, rect.left), viewportWidth - desktopMenuWidth - 8)
      const top = rect.bottom + 8
      setDesktopMenuStyle({ top, left })
    }
    update()

    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [desktopOpenCategory, canUseDOM])

  useEffect(() => {
    if (!localeMenuOpen || !canUseDOM) return

    const updatePosition = () => {
      const trigger = localeTriggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const left = Math.min(Math.max(8, rect.right - localeMenuWidth), viewportWidth - localeMenuWidth - 8)
      const top = rect.bottom + 8
      setLocaleMenuStyle({ top, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [localeMenuOpen, canUseDOM])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedTrigger = localeTriggerRef.current?.contains(target)
      const clickedMenu = localeMenuRef.current?.contains(target)
      if (!clickedTrigger && !clickedMenu) {
        setLocaleMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLocaleChange = (nextLocale: Locale) => {
    if (nextLocale === locale) {
      setLocaleMenuOpen(false)
      return
    }

    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`
    window.location.reload()
  }

  const desktopOpenGroup = desktopOpenCategory
    ? categoryGroups.find((group) => group.categoryId === desktopOpenCategory) || null
    : null
  const mobileSelectedCategoryId = categoryGroups.some((group) => group.categoryId === mobileOpenCategory)
    ? mobileOpenCategory
    : categoryGroups[0]?.categoryId ?? null
  const mobileOpenGroup = mobileSelectedCategoryId
    ? categoryGroups.find((group) => group.categoryId === mobileSelectedCategoryId) || null
    : null

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-14 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          <Link href="/" className="flex items-center shrink-0">
            <img
              src="https://test.vineoftime.com/img/logo/vineoftime.png"
              alt="Vine of Time Logo"
              className="w-8 h-8 object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-2 flex-1 min-w-0">
            {hasCategoryGroups &&
              categoryGroups.map((group) => (
                <div
                  key={group.categoryId}
                  className="relative"
                  ref={(el) => {
                    triggerRefs.current[group.categoryId] = el
                  }}
                  onMouseEnter={() => handleDesktopEnter(group.categoryId)}
                  onMouseLeave={handleDesktopLeave}
                >
                  <button
                    type="button"
                    className="text-sm px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    {group.categoryName}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-0 ml-auto">
            <div
              className="relative"
              ref={localeTriggerRef}
              onMouseEnter={handleLocaleEnter}
              onMouseLeave={handleLocaleLeave}
            >
              <button
                type="button"
                className="px-2 sm:px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 whitespace-nowrap"
                aria-label={labels.common.language}
              >
                <Languages className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium">
                  {locale === 'zh' ? labels.common.languageChineseShort : labels.common.languageEnglishShort}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${localeMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {hasCategoryGroups && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors shrink-0"
                aria-label={mobileMenuOpen ? labels.navbar.closeNavMenu : labels.navbar.openNavMenu}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <UserMenu locale={locale} />
          </div>
        </div>

        {hasCategoryGroups && mobileMenuOpen && (
          <div className="md:hidden pb-3 border-t border-slate-200/70 dark:border-slate-800/70">
            <div className="mt-3 grid grid-cols-[minmax(6.5rem,0.95fr)_minmax(0,1.45fr)] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="border-r border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-950/40">
                {categoryGroups.map((group) => {
                  const isActive = group.categoryId === mobileOpenGroup?.categoryId
                  return (
                    <button
                      key={group.categoryId}
                      type="button"
                      onClick={() => setMobileOpenCategory(group.categoryId)}
                      className={`block w-full px-3 py-3 text-left text-sm transition-colors ${
                        isActive
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="block line-clamp-2 break-words">{group.categoryName}</span>
                    </button>
                  )
                })}
              </div>

              <div className="min-w-0 bg-white dark:bg-slate-900">
                {mobileOpenGroup ? (
                  <div className="py-2">
                    <div className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {mobileOpenGroup.categoryName}
                    </div>
                    {mobileOpenGroup.entries.map((entry) => (
                      <Link
                        key={entry.id}
                        href={`/docs/${entry.slug}`}
                        className="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors break-words"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {entry.title}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
                    {labels.home.emptyTitle}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {canUseDOM &&
        localeMenuOpen &&
        createPortal(
          <div
            ref={localeMenuRef}
            style={{ top: localeMenuStyle.top, left: localeMenuStyle.left }}
            className="fixed w-28 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl shadow-slate-900/10 dark:shadow-black/30 py-1 z-[2147483647]"
            onMouseEnter={handleLocaleEnter}
            onMouseLeave={handleLocaleLeave}
          >
            <button
              type="button"
              onClick={() => handleLocaleChange('en')}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
                locale === 'en'
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {labels.common.languageEnglish}
            </button>
            <button
              type="button"
              onClick={() => handleLocaleChange('zh')}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
                locale === 'zh'
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {labels.common.languageChinese}
            </button>
          </div>,
          document.body
        )}

      {canUseDOM &&
        desktopOpenGroup &&
        createPortal(
          <div
            style={{ top: desktopMenuStyle.top, left: desktopMenuStyle.left }}
            className="fixed min-w-64 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl shadow-slate-900/10 dark:shadow-black/30 z-[2147483647] py-2 px-2 hidden md:block"
            onMouseEnter={clearCloseTimer}
            onMouseLeave={handleDesktopLeave}
          >
            <div className="px-2 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {desktopOpenGroup.categoryName}
            </div>
            {desktopOpenGroup.entries.map((entry) => (
              <Link
                key={entry.id}
                href={`/docs/${entry.slug}`}
                className="block px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                onClick={() => setDesktopOpenCategory(null)}
              >
                {entry.title}
              </Link>
            ))}
          </div>,
          document.body
        )}
    </header>
  )
}
