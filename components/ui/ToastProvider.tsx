'use client'

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

type Toast = {
  id: number
  message: string
  type: ToastType
}

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((prev) => [...prev, { id, message, type }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2200)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-20 right-4 z-[1300] space-y-2">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={
              item.type === 'success'
                ? 'min-w-64 max-w-sm px-4 py-3 rounded-xl border border-emerald-200/70 dark:border-emerald-700/70 bg-white/95 dark:bg-slate-900/95 shadow-lg text-sm text-emerald-700 dark:text-emerald-300'
                : item.type === 'error'
                  ? 'min-w-64 max-w-sm px-4 py-3 rounded-xl border border-red-200/70 dark:border-red-700/70 bg-white/95 dark:bg-slate-900/95 shadow-lg text-sm text-red-700 dark:text-red-300'
                  : 'min-w-64 max-w-sm px-4 py-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white/95 dark:bg-slate-900/95 shadow-lg text-sm text-slate-700 dark:text-slate-200'
            }
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
