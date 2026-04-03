'use client'

import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { useToast } from '@/components/ui/ToastProvider'

interface AdminDocumentRow {
  id: string
  title: string
  slug: string
  order: number
  published: boolean
  updatedAt: string
  level: number
  category: {
    name: string
  } | null
}

export default function AdminDocumentsTableClient({ documents }: { documents: AdminDocumentRow[] }) {
  const router = useRouter()
  const { confirm } = useConfirm()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [orderValues, setOrderValues] = useState<Record<string, string>>(
    Object.fromEntries(documents.map((doc) => [doc.id, String(doc.order)]))
  )
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const tableActionClass =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors'
  const dangerActionClass =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  useEffect(() => {
    setOrderValues(Object.fromEntries(documents.map((doc) => [doc.id, String(doc.order)])))
  }, [documents])

  const handleBlur = async (doc: AdminDocumentRow) => {
    const rawValue = orderValues[doc.id] ?? String(doc.order)
    const nextOrder = Number(rawValue)

    if (!Number.isFinite(nextOrder)) {
      setOrderValues((prev) => ({ ...prev, [doc.id]: String(doc.order) }))
      toast('排序必须是数字', 'error')
      return
    }

    if (nextOrder === doc.order) {
      return
    }

    setSavingId(doc.id)

    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: nextOrder }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setOrderValues((prev) => ({ ...prev, [doc.id]: String(doc.order) }))
        toast(data?.error || '排序保存失败', 'error')
        return
      }

      toast('排序已更新', 'success')
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Failed to update document order:', error)
      setOrderValues((prev) => ({ ...prev, [doc.id]: String(doc.order) }))
      toast('排序保存失败', 'error')
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (doc: AdminDocumentRow) => {
    const confirmed = await confirm({
      title: '删除文档',
      description: `确定要删除文档 ${doc.title} 吗？该操作不可恢复。`,
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger',
    })

    if (!confirmed) {
      return
    }

    setDeletingId(doc.id)

    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: 'DELETE',
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        toast(data?.error || '删除文档失败', 'error')
        return
      }

      toast('文档已删除', 'success')
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast('删除文档失败', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <table className="w-full min-w-[980px]">
      <thead className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800/50 dark:to-slate-800/30">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            标题
          </th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            分类
          </th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            排序
          </th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            状态
          </th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            更新时间
          </th>
          <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            操作
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {documents.map((doc) => (
          <tr key={doc.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors">
            <td className="px-6 py-4">
              <div className="flex items-center gap-2" style={{ paddingLeft: `${doc.level * 24}px` }}>
                {doc.level > 0 && <span className="text-indigo-400">└</span>}
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{doc.title}</div>
                  <div className="text-sm text-slate-400 dark:text-slate-500">/docs/{doc.slug}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">{doc.category?.name || '-'}</span>
            </td>
            <td className="px-6 py-4">
                <input
                  type="number"
                  value={orderValues[doc.id] ?? String(doc.order)}
                  disabled={savingId === doc.id || deletingId === doc.id || isPending}
                onChange={(event) =>
                  setOrderValues((prev) => ({
                    ...prev,
                    [doc.id]: event.target.value,
                  }))
                }
                onBlur={() => void handleBlur(doc)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur()
                  }
                }}
                className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </td>
            <td className="px-6 py-4">
              <span
                className={`px-3 py-1 text-xs rounded-full font-medium ${
                  doc.published
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/70'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/70'
                }`}
              >
                {doc.published ? '已发布' : '草稿'}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
              {new Date(doc.updatedAt).toLocaleDateString('zh-CN')}
            </td>
            <td className="px-6 py-4 text-right">
              <div className="flex items-center justify-end gap-3">
                <Link
                  href={`/admin/documents/new?parentId=${doc.id}`}
                  className={tableActionClass}
                >
                  添加子文档
                </Link>
                <Link
                  href={`/docs/${doc.slug}`}
                  target="_blank"
                  className={tableActionClass}
                >
                  查看
                </Link>
                <Link
                  href={`/admin/documents/${doc.id}/edit`}
                  className={tableActionClass}
                >
                  编辑
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDelete(doc)}
                  disabled={deletingId === doc.id || isPending}
                  className={dangerActionClass}
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingId === doc.id ? '删除中...' : '删除'}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
