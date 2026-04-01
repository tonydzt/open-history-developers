'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Shapes, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { useToast } from '@/components/ui/ToastProvider'

interface CategoryItem {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  _count: {
    documents: number
  }
}

interface CategoryFormState {
  name: string
  description: string
}

const emptyForm: CategoryFormState = {
  name: '',
  description: '',
}

function CategoryModal({
  title,
  saving,
  formData,
  onClose,
  onSubmit,
  onChange,
}: {
  title: string
  saving: boolean
  formData: CategoryFormState
  onClose: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onChange: (next: CategoryFormState) => void
}) {
  return (
    <div
      className="fixed inset-0 z-[1200] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={onSubmit}>
          <div className="px-6 pt-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              分类名称唯一，删除前请先迁移该分类下的文档。
            </p>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                分类名称
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(event) => onChange({ ...formData, name: event.target.value })}
                placeholder="例如：OpenAPI 指南"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={50}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                分类描述
              </label>
              <textarea
                value={formData.description}
                onChange={(event) => onChange({ ...formData, description: event.target.value })}
                placeholder="可选，简要描述分类用途"
                className="w-full min-h-28 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                maxLength={200}
              />
            </div>
          </div>

          <div className="px-6 py-5 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminCategoriesPageClient() {
  const router = useRouter()
  const { confirm } = useConfirm()
  const { toast } = useToast()
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [formData, setFormData] = useState<CategoryFormState>(emptyForm)
  const tableActionClass =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors'
  const dangerActionClass =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium transition-colors'

  const isEditing = useMemo(() => Boolean(editingCategory), [editingCategory])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/categories')

      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (response.status === 403) {
        toast('无权限访问分类管理', 'error')
        router.push('/admin/documents')
        return
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        toast(data?.error || '加载分类失败', 'error')
        return
      }

      setCategories(await response.json())
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      toast('加载分类失败', 'error')
    } finally {
      setLoading(false)
    }
  }, [router, toast])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingCategory(null)
    setFormData(emptyForm)
    setSaving(false)
  }

  const openCreateModal = () => {
    setEditingCategory(null)
    setFormData(emptyForm)
    setShowCreateModal(true)
  }

  const openEditModal = (category: CategoryItem) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
    }

    if (!payload.name) {
      toast('请输入分类名称', 'error')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(
        isEditing ? `/api/admin/categories/${editingCategory!.id}` : '/api/admin/categories',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        toast(data?.error || (isEditing ? '更新分类失败' : '创建分类失败'), 'error')
        return
      }

      toast(isEditing ? '分类已更新' : '分类已创建', 'success')
      closeModal()
      await fetchCategories()
    } catch (error) {
      console.error('Failed to save category:', error)
      toast(isEditing ? '更新分类失败' : '创建分类失败', 'error')
      setSaving(false)
    }
  }

  const handleDelete = async (category: CategoryItem) => {
    const confirmed = await confirm({
      title: '删除分类',
      description:
        category._count.documents > 0
          ? `分类 ${category.name} 下还有 ${category._count.documents} 篇文档，无法直接删除。`
          : `确定要删除分类 ${category.name} 吗？该操作不可恢复。`,
      confirmText: category._count.documents > 0 ? '我知道了' : '删除',
      cancelText: '取消',
      variant: 'danger',
    })

    if (!confirmed || category._count.documents > 0) {
      return
    }

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE',
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        toast(data?.error || '删除分类失败', 'error')
        return
      }

      toast('分类已删除', 'success')
      await fetchCategories()
    } catch (error) {
      console.error('Failed to delete category:', error)
      toast('删除分类失败', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 flex items-center justify-center">
        <div className="text-slate-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-indigo-800 dark:from-white dark:to-indigo-300 bg-clip-text text-transparent">
            分类管理
          </h1>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 py-2.5 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25"
          >
            <Plus className="w-4 h-4" />
            新建分类
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-5 shadow-xl">
            <div className="text-sm text-slate-500 dark:text-slate-400">分类总数</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{categories.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-5 shadow-xl">
            <div className="text-sm text-slate-500 dark:text-slate-400">已关联文档</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
              {categories.reduce((sum, item) => sum + item._count.documents, 0)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-5 shadow-xl">
            <div className="text-sm text-slate-500 dark:text-slate-400">空分类</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
              {categories.filter((item) => item._count.documents === 0).length}
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800/50 dark:to-slate-800/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  分类
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  描述
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  文档数
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
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                        <Shapes className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{category.name}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">{category.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {category.description || '暂无描述'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs rounded-full font-medium bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 dark:from-slate-800 dark:to-slate-700 dark:text-slate-200">
                      {category._count.documents} 篇
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {new Date(category.updatedAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => openEditModal(category)}
                        className={tableActionClass}
                      >
                        <Pencil className="w-4 h-4" />
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
                        className={dangerActionClass}
                      >
                        <Trash2 className="w-4 h-4" />
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {categories.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <Shapes className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">暂无分类</p>
              <button
                type="button"
                onClick={openCreateModal}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-2 inline-block font-medium"
              >
                创建第一个分类
              </button>
            </div>
          )}
        </div>
      </div>

      {(showCreateModal || editingCategory) && (
        <CategoryModal
          title={isEditing ? '编辑分类' : '新建分类'}
          saving={saving}
          formData={formData}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onChange={setFormData}
        />
      )}
    </div>
  )
}
