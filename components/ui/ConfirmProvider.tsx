'use client'

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react'

type ConfirmOptions = {
  title?: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
}

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null)

  const close = useCallback(
    (value: boolean) => {
      resolver?.(value)
      setResolver(null)
      setOptions(null)
    },
    [resolver]
  )

  const confirm = useCallback((input: ConfirmOptions | string) => {
    const nextOptions: ConfirmOptions =
      typeof input === 'string'
        ? { description: input }
        : input

    setOptions({
      title: nextOptions.title ?? '请确认',
      description: nextOptions.description,
      confirmText: nextOptions.confirmText ?? '确认',
      cancelText: nextOptions.cancelText ?? '取消',
      variant: nextOptions.variant ?? 'default',
    })

    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve)
    })
  }, [])

  const value = useMemo(() => ({ confirm }), [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      {options && (
        <div
          className="fixed inset-0 z-[1200] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => close(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{options.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{options.description}</p>
            </div>
            <div className="px-6 py-5 mt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => close(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {options.cancelText}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={
                  options.variant === 'danger'
                    ? 'px-4 py-2 rounded-lg text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 transition-colors'
                    : 'px-4 py-2 rounded-lg text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-colors'
                }
              >
                {options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return context
}
