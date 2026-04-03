'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, Save, FileText, Plus, X } from 'lucide-react'
import ByteMDEditor, { type ByteMDEditorRef } from '@/components/ByteMDEditor'

interface PageProps {
  params: Promise<{ id: string }>
}

interface ApiParam {
  name: string
  type: string
  required: boolean
  description: string
}

interface ApiData {
  name: string
  description: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  params: ApiParam[]
  headers: ApiParam[]
  body: string
  response: string
}

interface ApiDocument {
  id: string
  title: string
  titleEn?: string | null
  titleZh?: string | null
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

const LOCALE_TABS = [
  {
    code: 'zh',
    label: '中文',
    titlePlaceholder: '中文标题...',
    contentLabel: '中文内容',
    contentPlaceholder: '开始编写中文文档内容...',
  },
  {
    code: 'en',
    label: 'English',
    titlePlaceholder: 'English title...',
    contentLabel: 'English Content',
    contentPlaceholder: 'Start writing English content...',
  },
] as const

type LocaleCode = (typeof LOCALE_TABS)[number]['code']

const defaultApiData: ApiData = {
  name: '',
  description: '',
  method: 'GET',
  path: '',
  params: [],
  headers: [],
  body: '',
  response: ''
}

export default function EditDocumentPage({ params }: PageProps) {
  const router = useRouter()
  const editorRef = useRef<ByteMDEditorRef>(null)
  const [id, setId] = useState<string>('')
  const [titleEn, setTitleEn] = useState('')
  const [titleZh, setTitleZh] = useState('')
  const [published, setPublished] = useState(false)
  const [contentEn, setContentEn] = useState('')
  const [contentZh, setContentZh] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editorReady, setEditorReady] = useState(false)
  const [showApiModal, setShowApiModal] = useState(false)
  const [apiData, setApiData] = useState<ApiData>(defaultApiData)
  const [parentId, setParentId] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [order, setOrder] = useState(0)
  const [documents, setDocuments] = useState<DocumentOption[]>([])
  const [rawDocuments, setRawDocuments] = useState<ApiDocument[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [activeLocale, setActiveLocale] = useState<LocaleCode>('zh')

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const categoryData = await res.json()
        setCategories(categoryData)
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
        setRawDocuments(docs)
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
            result.push({
              id: item.id,
              title: item.titleZh || item.titleEn || item.title,
              level,
              categoryId: item.categoryId,
            })
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

  async function fetchDocument(docId: string) {
    try {
      const res = await fetch(`/api/documents/${docId}`)
      if (res.ok) {
        const doc = await res.json()
        setTitleEn(doc.titleEn || '')
        setTitleZh(doc.titleZh || doc.title || '')
        setContentEn(doc.contentEn || '')
        setContentZh(doc.contentZh || doc.content || '')
        setPublished(doc.published)
        setParentId(doc.parentId)
        setCategoryId(doc.categoryId || '')
        setOrder(doc.order || 0)
        setEditorReady(true)
      }
    } catch (error) {
      console.error('Failed to fetch document:', error)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!titleEn.trim() || !titleZh.trim()) {
      alert('请填写中英文文档标题')
      return
    }

    const effectiveCategoryId = parentDocument?.categoryId || categoryId

    if (!effectiveCategoryId) {
      alert('请选择文档分类')
      return
    }

    setSaving(true)

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: titleZh || titleEn,
          titleEn,
          titleZh,
          content: contentZh || contentEn,
          contentEn,
          contentZh,
          published,
          parentId,
          order,
          categoryId: effectiveCategoryId,
        }),
      })

      if (res.ok) {
        router.push('/admin/documents')
      } else {
        alert('保存失败')
      }
    } catch (error) {
      console.error('Failed to save document:', error)
      alert('保存失败')
    }
    setSaving(false)
  }

  useEffect(() => {
    params.then(({ id }) => {
      setId(id)
      fetchDocument(id)
      fetchDocuments()
      fetchCategories()
    })
  }, [params])

  const getDescendantIds = (documentId: string) => {
    const descendantIds = new Set<string>()
    const queue = [documentId]

    while (queue.length > 0) {
      const currentId = queue.shift()!
      rawDocuments.forEach((document) => {
        if (document.parentId === currentId && !descendantIds.has(document.id)) {
          descendantIds.add(document.id)
          queue.push(document.id)
        }
      })
    }

    return descendantIds
  }

  const descendantIds = id ? getDescendantIds(id) : new Set<string>()
  const selectableDocuments = documents.filter((document) => document.id !== id && !descendantIds.has(document.id))
  const parentDocument = parentId ? documents.find((document) => document.id === parentId) : null
  const isChildDocument = Boolean(parentId)
  const effectiveCategoryId = parentDocument?.categoryId || categoryId
  const activeTab = LOCALE_TABS.find((tab) => tab.code === activeLocale) || LOCALE_TABS[0]
  const activeTitle = activeLocale === 'zh' ? titleZh : titleEn
  const activeContent = activeLocale === 'zh' ? contentZh : contentEn

  const addParam = (type: 'params' | 'headers') => {
    setApiData(prev => ({
      ...prev,
      [type]: [...prev[type], { name: '', type: 'string', required: false, description: '' }]
    }))
  }

  const updateParam = (type: 'params' | 'headers', index: number, field: keyof ApiParam, value: string | boolean) => {
    setApiData(prev => ({
      ...prev,
      [type]: prev[type].map((p, i) => i === index ? { ...p, [field]: value } : p)
    }))
  }

  const removeParam = (type: 'params' | 'headers', index: number) => {
    setApiData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }))
  }

  const generateApiMarkdown = () => {
    const { name, description, method, path, params, headers, body, response } = apiData
    
    let markdown = `## ${name}\n\n`
    markdown += `${description}\n\n`
    markdown += `### 请求信息\n\n`
    markdown += `**方法**: \`${method}\`\n\n`
    markdown += `**路径**: \`${path}\`\n\n`
    
    if (params.length > 0) {
      markdown += `### 请求参数\n\n`
      markdown += `| 参数名 | 类型 | 必填 | 说明 |\n`
      markdown += `|--------|------|------|------|\n`
      params.forEach(p => {
        markdown += `| ${p.name} | ${p.type} | ${p.required ? '是' : '否'} | ${p.description} |\n`
      })
      markdown += '\n'
    }
    
    if (headers.length > 0) {
      markdown += `### 请求头\n\n`
      markdown += `| 参数名 | 类型 | 必填 | 说明 |\n`
      markdown += `|--------|------|------|------|\n`
      headers.forEach(p => {
        markdown += `| ${p.name} | ${p.type} | ${p.required ? '是' : '否'} | ${p.description} |\n`
      })
      markdown += '\n'
    }
    
    if (body) {
      markdown += `### 请求体\n\n\`\`\`json\n${body}\n\`\`\`\n\n`
    }
    
    if (response) {
      markdown += `### 响应示例\n\n\`\`\`json\n${response}\n\`\`\`\n\n`
    }
    
    return markdown
  }

  const insertApiDoc = () => {
    const markdown = generateApiMarkdown()
    if (editorRef.current) {
      editorRef.current.insertText('\n' + markdown)
    } else {
      if (activeLocale === 'zh') {
        setContentZh((prev) => prev + '\n' + markdown)
      } else {
        setContentEn((prev) => prev + '\n' + markdown)
      }
    }
    setShowApiModal(false)
    setApiData(defaultApiData)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
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
              <span className="text-sm text-slate-500">编辑文档</span>
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
              {published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {published ? '已发布' : '草稿'}
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1.5 rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25"
            >
              <Save className="w-4 h-4" />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
            <div className="p-6 space-y-4">
              <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                {LOCALE_TABS.map((tab) => (
                  <button
                    key={tab.code}
                    type="button"
                    onClick={() => setActiveLocale(tab.code)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      activeLocale === tab.code
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={activeTitle}
                onChange={(e) => {
                  const value = e.target.value
                  if (activeLocale === 'zh') {
                    setTitleZh(value)
                    return
                  }
                  setTitleEn(value)
                }}
                placeholder={activeTab.titlePlaceholder}
                required
                className="w-full text-xl font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
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
                    {selectableDocuments.map((doc) => (
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
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">内容编辑</h3>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                  {LOCALE_TABS.map((tab) => (
                    <button
                      key={tab.code}
                      type="button"
                      onClick={() => setActiveLocale(tab.code)}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        activeLocale === tab.code
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (editorRef.current) {
                      editorRef.current.saveCursor()
                    }
                    setShowApiModal(true)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  插入 API 文档
                </button>
              </div>
            </div>
            <div className="editor-container">
              {editorReady && (
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">{activeTab.contentLabel}</p>
                  <ByteMDEditor
                    key={activeLocale}
                    ref={editorRef}
                    value={activeContent}
                    onChange={(value) => {
                      if (activeLocale === 'zh') {
                        setContentZh(value)
                        return
                      }
                      setContentEn(value)
                    }}
                    placeholder={activeTab.contentPlaceholder}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* API Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">插入 API 文档</h2>
              <button
                onClick={() => setShowApiModal(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    接口名称
                  </label>
                  <input
                    type="text"
                    value={apiData.name}
                    onChange={(e) => setApiData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="获取用户列表"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    接口描述
                  </label>
                  <textarea
                    value={apiData.description}
                    onChange={(e) => setApiData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="描述这个接口的用途..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      请求方法
                    </label>
                    <select
                      value={apiData.method}
                      onChange={(e) =>
                        setApiData((prev) => ({ ...prev, method: e.target.value as ApiData['method'] }))
                      }
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      请求路径
                    </label>
                    <input
                      type="text"
                      value={apiData.path}
                      onChange={(e) => setApiData(prev => ({ ...prev, path: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="/api/users"
                    />
                  </div>
                </div>
              </div>

              {/* Params */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    请求参数
                  </label>
                  <button
                    onClick={() => addParam('params')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + 添加参数
                  </button>
                </div>
                <div className="space-y-2">
                  {apiData.params.map((param, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <input
                        type="text"
                        value={param.name}
                        onChange={(e) => updateParam('params', index, 'name', e.target.value)}
                        placeholder="参数名"
                        className="flex-1 px-2 py-1 text-sm bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <select
                        value={param.type}
                        onChange={(e) => updateParam('params', index, 'type', e.target.value)}
                        className="px-2 py-1 text-sm bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="string">string</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                        <option value="object">object</option>
                        <option value="array">array</option>
                      </select>
                      <label className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                        <input
                          type="checkbox"
                          checked={param.required}
                          onChange={(e) => updateParam('params', index, 'required', e.target.checked)}
                          className="rounded"
                        />
                        必填
                      </label>
                      <input
                        type="text"
                        value={param.description}
                        onChange={(e) => updateParam('params', index, 'description', e.target.value)}
                        placeholder="说明"
                        className="flex-1 px-2 py-1 text-sm bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeParam('params', index)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Headers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    请求头
                  </label>
                  <button
                    onClick={() => addParam('headers')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + 添加请求头
                  </button>
                </div>
                <div className="space-y-2">
                  {apiData.headers.map((header, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <input
                        type="text"
                        value={header.name}
                        onChange={(e) => updateParam('headers', index, 'name', e.target.value)}
                        placeholder="Header 名"
                        className="flex-1 px-2 py-1 text-sm bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={header.description}
                        onChange={(e) => updateParam('headers', index, 'description', e.target.value)}
                        placeholder="说明"
                        className="flex-1 px-2 py-1 text-sm bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeParam('headers', index)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  请求体 (JSON)
                </label>
                <textarea
                  value={apiData.body}
                  onChange={(e) => setApiData(prev => ({ ...prev, body: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder='{"key": "value"}'
                />
              </div>

              {/* Response */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  响应示例 (JSON)
                </label>
                <textarea
                  value={apiData.response}
                  onChange={(e) => setApiData(prev => ({ ...prev, response: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder='{"code": 200, "data": {}}'
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => setShowApiModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={insertApiDoc}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                插入文档
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
