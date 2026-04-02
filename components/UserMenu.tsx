'use client'

import { useState, useRef, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { LogOut, ChevronDown, LayoutDashboard, KeyRound, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { type Locale } from '@/lib/i18n'

export default function UserMenu({ locale = 'en' }: { locale?: Locale }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const openMenu = () => {
    clearCloseTimer()
    setIsOpen(true)
  }

  const closeMenu = () => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 120)
  }

  useEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const menuWidth = 256
      const viewportWidth = window.innerWidth
      const left = Math.min(Math.max(8, rect.right - menuWidth), viewportWidth - menuWidth - 8)
      const top = rect.bottom + 10
      setMenuStyle({ top, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedTrigger = triggerRef.current?.contains(target)
      const clickedMenu = menuRef.current?.contains(target)
      if (!clickedTrigger && !clickedMenu) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  if (!session) return null

  const roleLabels: Record<string, Record<string, string>> = {
    en: { SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', API_USER: 'API User' },
    zh: { SUPER_ADMIN: '超级管理员', ADMIN: '管理员', API_USER: 'API用户' },
  }
  const canUseDOM = typeof document !== 'undefined'
  const canAccessAdmin = session.user?.role === 'SUPER_ADMIN' || session.user?.role === 'ADMIN'
  const labels = locale === 'zh'
    ? {
        accountCenter: '账户中心',
        adminConsole: '后台管理',
        myPrivateKey: '我的私钥',
        signOut: '退出登录',
      }
    : {
        accountCenter: 'Account Center',
        adminConsole: 'Admin Console',
        myPrivateKey: 'My Private Key',
        signOut: 'Sign out',
      }

  const menuContent = (
    <div
      ref={menuRef}
      style={{ top: menuStyle.top, left: menuStyle.left }}
      className="fixed w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xl shadow-slate-900/10 dark:shadow-black/30 z-[2147483647] overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-100/90 dark:border-slate-800/90 bg-slate-50/70 dark:bg-slate-950/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">{labels.accountCenter}</div>
        </div>
        <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{session.user?.email}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{roleLabels[locale][session.user?.role || 'API_USER']}</div>
      </div>

      <div className="py-2 px-2">
        {canAccessAdmin && (
          <Link
            href="/admin/documents"
            className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <LayoutDashboard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            {labels.adminConsole}
          </Link>
        )}

        <Link
          href="/open-api-key"
          className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          onClick={() => setIsOpen(false)}
        >
          <KeyRound className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          {labels.myPrivateKey}
        </Link>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 py-2 px-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {labels.signOut}
        </button>
      </div>
    </div>
  )

  return (
    <div className="relative" ref={triggerRef} onMouseEnter={openMenu} onMouseLeave={closeMenu}>
      <button
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${
          isOpen
            ? 'bg-slate-100 border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white'
            : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 flex items-center justify-center text-white dark:text-slate-900 text-sm font-medium">
          {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-slate-900 dark:text-white">
            {session.user?.name || session.user?.email?.split('@')[0]}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {roleLabels[locale][session.user?.role || 'API_USER']}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {canUseDOM &&
        isOpen &&
        createPortal(
          <div onMouseEnter={openMenu} onMouseLeave={closeMenu}>
            {menuContent}
          </div>,
          document.body
        )}
    </div>
  )
}
