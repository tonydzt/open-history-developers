'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, FileText } from 'lucide-react'
import ByteMDEditor, { type ByteMDEditorRef } from '@/components/ByteMDEditor'

export default function NewDocumentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editorRef = useRef<ByteMDEditorRef>(null)
  const [title, setTitle] = useState('')
  const [published, setPublished] = useState(false)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [documents, setDocuments] = useState<{ id: string; title: string; level: number }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [parentId, setParentId] = useState<string | null>(null)

  useEffect(() => {
    const parent = searchParams.get('parentId')
    if (parent) {
      setParentId(parent)
    }
    fetchDocuments()
    fetchCategories()
  }, [searchParams])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        setCategories(await res.json())
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents')
      if (res.ok) {
        const docs = await res.json()
        const docMap = new Map(docs.map((d: any) => [d.id, { ...d, children: [] as any[] }]))
        const roots: any[] = []
        
        docs.forEach((doc: any) => {
          const node = docMap.get(doc.id)!
          if (doc.parentId && docMap.has(doc.parentId)) {
            docMap.get(doc.parentId)!.children.push(node)
          } else {
            roots.push(node)
          }
        })
        
        const flattenWithLevel = (items: any[], level = 0): { id: string; title: string; level: number }[] => {
          const result: { id: string; title: string; level: number }[] = []
          items.forEach(item => {
            result.push({ id: item.id, title: item.title, level })
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
          categoryId,
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
                    value={categoryId || ''}
                    onChange={(e) => setCategoryId(e.target.value || null)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    <option value="">无分类</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
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
