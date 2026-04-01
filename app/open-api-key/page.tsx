'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { useToast } from '@/components/ui/ToastProvider'
import { KeyRound, Copy, RotateCcw } from 'lucide-react'

interface KeyData {
  id: string
  email: string
  openApiPrivateKey: string | null
}

export default function OpenApiKeyPage() {
  const router = useRouter()
  const { confirm } = useConfirm()
  const { toast } = useToast()
  const [data, setData] = useState<KeyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchKey = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/open-api-key')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        throw new Error('加载失败')
      }
      setData(await res.json())
    } catch {
      toast('加载私钥失败', 'error')
    } finally {
      setLoading(false)
    }
  }, [router, toast])

  useEffect(() => {
    fetchKey()
  }, [fetchKey])

  const handleCopy = async () => {
    if (!data?.openApiPrivateKey) return
    try {
      await navigator.clipboard.writeText(data.openApiPrivateKey)
      setCopied(true)
      toast('私钥已复制', 'success')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast('复制失败，请手动复制', 'error')
    }
  }

  const handleReset = async () => {
    const ok = await confirm({
      title: '重置私钥',
      description: '重置后旧私钥将立即失效，现有调用会失败。确认继续吗？',
      confirmText: '确认重置',
      cancelText: '取消',
      variant: 'danger',
    })
    if (!ok) return

    setResetting(true)
    try {
      const res = await fetch('/api/user/open-api-key', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || '重置失败')
      }
      setData(await res.json())
      toast('私钥已重置，请立即复制并安全保存', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : '重置失败', 'error')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-indigo-800 dark:from-white dark:to-indigo-300 bg-clip-text text-transparent">
            我的 OpenAPI 私钥
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            私钥用于请求签名，请妥善保管，不要暴露在前端或公共仓库。
          </p>
        </div>

        <div className="bg-white/85 dark:bg-slate-900/55 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl p-6">
          {loading ? (
            <div className="text-slate-500 dark:text-slate-400">加载中...</div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">{data?.email}</span>
              </div>

              <textarea
                value={data?.openApiPrivateKey || ''}
                readOnly
                className="w-full h-64 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs leading-5 text-slate-700 dark:text-slate-200 font-mono"
              />

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? '已复制' : '复制私钥'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={resetting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 transition-colors disabled:opacity-60"
                >
                  <RotateCcw className="w-4 h-4" />
                  {resetting ? '重置中...' : '重置私钥'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
