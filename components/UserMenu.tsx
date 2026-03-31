'use client'

import { useState, useRef, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, LogOut, ChevronDown, FileText, Users, Settings } from 'lucide-react'
import Link from 'next/link'

export default function UserMenu() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: '超级管理员',
    ADMIN: '管理员',
    API_USER: 'API用户'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
          {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-slate-900 dark:text-white">
            {session.user?.name || session.user?.email?.split('@')[0]}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {roleLabels[session.user?.role || 'API_USER']}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              {session.user?.email}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {roleLabels[session.user?.role || 'API_USER']}
            </div>
          </div>
          
          <div className="py-1">
            <Link
              href="/admin/documents"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <FileText className="w-4 h-4" />
              文档管理
            </Link>
            
            {session.user?.role === 'SUPER_ADMIN' && (
              <Link
                href="/admin/users"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Users className="w-4 h-4" />
                用户管理
              </Link>
            )}
            
            <Link
              href="/admin/api-keys"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              API密钥
            </Link>
          </div>
          
          <div className="border-t border-slate-100 dark:border-slate-800 py-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
