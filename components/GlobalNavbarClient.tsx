'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ChevronDown, FileText, Menu, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import UserMenu from '@/components/UserMenu'

export interface NavbarCategoryGroup {
  categoryId: string
  categoryName: string
  entries: Array<{ id: string; title: string; slug: string }>
}

interface GlobalNavbarClientProps {
  categoryGroups: NavbarCategoryGroup[]
}

export default function GlobalNavbarClient({ categoryGroups }: GlobalNavbarClientProps) {
  const { data: session, status } = useSession()
  const [desktopOpenCategory, setDesktopOpenCategory] = useState<string | null>(null)
  const [desktopMenuStyle, setDesktopMenuStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileOpenCategory, setMobileOpenCategory] = useState<string | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const canUseDOM = typeof document !== 'undefined'
  const hasCategoryGroups = categoryGroups.length > 0

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const handleDesktopEnter = (categoryId: string) => {
    clearCloseTimer()
    if (canUseDOM) {
      const trigger = triggerRefs.current[categoryId]
      if (trigger) {
        const rect = trigger.getBoundingClientRect()
        const menuWidth = 224
        const viewportWidth = window.innerWidth
        const left = Math.min(Math.max(8, rect.left), viewportWidth - menuWidth - 8)
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

  const toggleMobileCategory = (categoryId: string) => {
    setMobileOpenCategory((prev) => (prev === categoryId ? null : categoryId))
  }

  useEffect(() => {
    if (!desktopOpenCategory || !canUseDOM) return

    const update = () => {
      const trigger = triggerRefs.current[desktopOpenCategory]
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const menuWidth = 224
      const viewportWidth = window.innerWidth
      const left = Math.min(Math.max(8, rect.left), viewportWidth - menuWidth - 8)
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

  const desktopOpenGroup = desktopOpenCategory
    ? categoryGroups.find((group) => group.categoryId === desktopOpenCategory) || null
    : null

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-14 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">文档开放平台</span>
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

          <div className="flex items-center gap-2 shrink-0">
            {hasCategoryGroups && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                aria-label={mobileMenuOpen ? '关闭导航菜单' : '打开导航菜单'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            {status !== 'loading' && !session && (
              <Link
                href="/login"
                className="text-sm px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors"
              >
                登录
              </Link>
            )}
            <UserMenu />
          </div>
        </div>

        {hasCategoryGroups && mobileMenuOpen && (
          <div className="md:hidden pb-3 space-y-1 border-t border-slate-200/70 dark:border-slate-800/70">
            {categoryGroups.map((group) => (
              <div key={group.categoryId} className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => toggleMobileCategory(group.categoryId)}
                  className="w-full px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
                >
                  <span>{group.categoryName}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${mobileOpenCategory === group.categoryId ? 'rotate-180' : ''}`}
                  />
                </button>
                {mobileOpenCategory === group.categoryId && (
                  <div className="bg-slate-50 dark:bg-slate-950/40 py-1">
                    {group.entries.map((entry) => (
                      <Link
                        key={entry.id}
                        href={`/docs/${entry.slug}`}
                        className="block px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {entry.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
