'use client'

import { useState, useEffect } from 'react'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, FileText } from 'lucide-react'
import ByteMDEditor from '@/components/ByteMDEditor'

interface ApiDocument {
  id: string
  title: string
  parentId: string | null
  categoryId: string
  order: number
}

interface DocumentTreeNode extends ApiDocument {
  children: DocumentTreeNode[]
}

interface DocumentOption {
  id: string
  title: string
  level: number
  categoryId: string
}

function NewDocumentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedParentId = searchParams.get('parentId')
  const [title, setTitle] = useState('')
  const [published, setPublished] = useState(false)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [documents, setDocuments] = useState<DocumentOption[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [parentId, setParentId] = useState<string | null>(requestedParentId)
  const [order, setOrder] = useState(0)

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const categoryData = await res.json()
        setCategories(categoryData)
        if (categoryData.length > 0) {
          setCategoryId((current) => current || categoryData[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  async function fetchDocuments() {
    try {
      const res = await fetch('/api/documents')
      if (res.ok) {
        const docs: ApiDocument[] = await res.json()
        const docMap = new Map<string, DocumentTreeNode>(
          docs.map((doc) => [doc.id, { ...doc, children: [] }])
        )
        const roots: DocumentTreeNode[] = []
        
        docs.forEach((doc) => {
          const node = docMap.get(doc.id)!
          if (doc.parentId && docMap.has(doc.parentId)) {
            docMap.get(doc.parentId)!.children.push(node)
          } else {
            roots.push(node)
          }
        })
        
        const flattenWithLevel = (items: DocumentTreeNode[], level = 0): DocumentOption[] => {
          const result: DocumentOption[] = []
          items.forEach(item => {
            result.push({ id: item.id, title: item.title, level, categoryId: item.categoryId })
            if (item.children && item.children.length > 0) {
              result.push(...flattenWithLevel(item.children, level + 1))
            }
          })
          return result
        }
        
        setDocuments(flattenWithLevel(roots))
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    }
  }

  const generateSlug = (title: string) => {
    const timestamp = Date.now().toString(36)
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50)
    return `${base}-${timestamp}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('请输入文档标题')
      return
    }

    const effectiveCategoryId = parentDocument?.categoryId || categoryId

    if (!effectiveCategoryId) {
      alert('请选择文档分类')
      return
    }
    
    setSaving(true)

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          slug: generateSlug(title),
          content,
          published,
          parentId,
          order,
          categoryId: effectiveCategoryId,
        }),
      })

      if (res.ok) {
        router.push('/admin/documents')
      } else {
        const error = await res.json()
        alert(error.error || '创建失败')
      }
    } catch (error) {
      console.error('Failed to create document:', error)
      alert('创建失败')
    }
    setSaving(false)
  }

  useEffect(() => {
    void (async () => {
      await Promise.all([fetchDocuments(), fetchCategories()])
    })()
  }, [])

  const parentDocument = parentId ? documents.find((document) => document.id === parentId) : null
  const isChildDocument = Boolean(parentId)
  const effectiveCategoryId = parentDocument?.categoryId || categoryId

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/documents"
              className="p-2 -ml-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-slate-500">新建文档</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPublished(!published)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                published
                  ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-900/40 dark:to-teal-900/40 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {published ? '已发布' : '草稿'}
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1.5 rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25"
            >
              <Save className="w-4 h-4" />
              {saving ? '创建中...' : '创建'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
            <div className="p-6 space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入文档标题..."
                required
                className="w-full text-3xl font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 bg-transparent border-none outline-none"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                    分类
                  </label>
                  <select
                    value={effectiveCategoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    disabled={isChildDocument}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>请选择分类</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {isChildDocument && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      子文档自动继承顶级文档分类，不能单独修改。
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                    父文档
                  </label>
                  <select
                    value={parentId || ''}
                    onChange={(e) => setParentId(e.target.value || null)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    <option value="">无（顶级文档）</option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {'　'.repeat(doc.level)}{doc.level > 0 ? '└ ' : ''}{doc.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                    排序
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">内容编辑</h3>
            </div>
            <div className="editor-container p-6">
              <ByteMDEditor
                value={content}
                onChange={setContent}
                placeholder="开始编写文档内容..."
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function NewDocumentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <NewDocumentPageContent />
    </Suspense>
  )
}
