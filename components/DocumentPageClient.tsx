'use client'

import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { ArrowLeft, Calendar, User, Eye, ChevronRight, FileText, ChevronDown, PanelLeftClose, PanelRightClose, PanelLeft, PanelRight } from 'lucide-react'

interface Document {
  id: string
  title: string
  slug: string
  parentId: string | null
  children: Document[]
}

interface DocumentPageProps {
  document: {
    id: string
    title: string
    slug: string
    content: string
    viewCount: number
    updatedAt: string
    author: { name: string | null; email: string }
    category: { name: string } | null
    children: { id: string; title: string; slug: string }[]
  }
  documentTree: Document[]
}

const DOC_TREE_EXPANDED_KEY = 'docs-tree-expanded'
const MOBILE_MEDIA_QUERY = '(max-width: 767px)'

function findAncestorIdsBySlug(documents: Document[], targetSlug: string): string[] {
  for (const doc of documents) {
    if (doc.slug === targetSlug) {
      return []
    }

    const childAncestors = findAncestorIdsBySlug(doc.children || [], targetSlug)
    if (childAncestors.length > 0 || (doc.children || []).some(child => child.slug === targetSlug)) {
      return [doc.id, ...childAncestors]
    }
  }

  return []
}

function DocumentTree({
  documents,
  currentSlug,
  expanded,
  onToggle,
  onNavigate,
  level = 0,
}: {
  documents: Document[]
  currentSlug: string
  expanded: Set<string>
  onToggle: (id: string) => void
  onNavigate?: () => void
  level?: number
}) {
  if (documents.length === 0) return null

  return (
    <div className="space-y-0.5">
      {documents.map((doc) => {
        const hasChildren = doc.children && doc.children.length > 0
        const isExpanded = expanded.has(doc.id)
        const isCurrent = doc.slug === currentSlug

        return (
          <div key={doc.id}>
            <div
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                isCurrent
                  ? 'bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              style={{ paddingLeft: `${8 + level * 12}px` }}
            >
              {hasChildren && (
                <button
                  onClick={() => onToggle(doc.id)}
                  className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                  />
                </button>
              )}
              {!hasChildren && <span className="w-4" />}
              <Link
                href={`/docs/${doc.slug}`}
                className="flex items-center gap-2 flex-1 min-w-0"
                onClick={onNavigate}
              >
                <FileText className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                <span className="truncate">{doc.title}</span>
              </Link>
            </div>
            {hasChildren && isExpanded && (
              <DocumentTree
                documents={doc.children}
                currentSlug={currentSlug}
                expanded={expanded}
                onToggle={onToggle}
                onNavigate={onNavigate}
                level={level + 1}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function TOC({ content, onNavigate }: { content: string; onNavigate?: () => void }) {
  const headings = content.match(/^#{1,3}\s+.+$/gm) || []
  const items = headings.map(h => {
    const level = (h.match(/^#+/) || [''])[0].length
    const text = h.replace(/^#+\s+/, '')
    const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    return { level, text, id }
  })

  if (items.length === 0) return null

  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
        目录
      </div>
      {items.map((item, index) => (
        <a
          key={index}
          href={`#${item.id}`}
          onClick={onNavigate}
          className="block text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
          style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
        >
          {item.text}
        </a>
      ))}
    </div>
  )
}

export default function DocumentPageClient({ document: currentDocument, documentTree }: DocumentPageProps) {
  const isMobileViewport = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {}
      const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY)
      mediaQuery.addEventListener('change', onStoreChange)
      return () => mediaQuery.removeEventListener('change', onStoreChange)
    },
    () => window.matchMedia(MOBILE_MEDIA_QUERY).matches,
    () => false
  )
  const [desktopLeftSidebarOpen, setDesktopLeftSidebarOpen] = useState(true)
  const [desktopRightSidebarOpen, setDesktopRightSidebarOpen] = useState(true)
  const [mobilePanel, setMobilePanel] = useState<'left' | 'right' | null>(null)
  const ancestorIds = useMemo(() => findAncestorIdsBySlug(documentTree, currentDocument.slug), [documentTree, currentDocument.slug])
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(ancestorIds))

  useEffect(() => {
    const stored = sessionStorage.getItem(DOC_TREE_EXPANDED_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        const nextExpanded = new Set(parsed)
        const timer = window.setTimeout(() => {
          setExpanded(nextExpanded)
        }, 0)
        return () => window.clearTimeout(timer)
      }
    } catch {
      // Ignore invalid storage data and keep the SSR-compatible default state.
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem(DOC_TREE_EXPANDED_KEY, JSON.stringify(Array.from(expanded)))
  }, [expanded])

  useEffect(() => {
    if (!isMobileViewport || !mobilePanel) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileViewport, mobilePanel])

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const closeMobilePanels = () => {
    setMobilePanel(null)
  }

  const toggleLeftSidebar = () => {
    if (isMobileViewport) {
      setMobilePanel((prev) => (prev === 'left' ? null : 'left'))
      return
    }
    setDesktopLeftSidebarOpen(prev => !prev)
  }

  const toggleRightSidebar = () => {
    if (isMobileViewport) {
      setMobilePanel((prev) => (prev === 'right' ? null : 'right'))
      return
    }
    setDesktopRightSidebarOpen(prev => !prev)
  }

  const leftSidebarOpen = isMobileViewport ? mobilePanel === 'left' : desktopLeftSidebarOpen
  const rightSidebarOpen = isMobileViewport ? mobilePanel === 'right' : desktopRightSidebarOpen
  const mobileOverlayOpen = isMobileViewport && mobilePanel !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLeftSidebar}
              className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={leftSidebarOpen ? '隐藏目录' : '显示目录'}
            >
              {leftSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">返回首页</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleRightSidebar}
              className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={rightSidebarOpen ? '隐藏大纲' : '显示大纲'}
            >
              {rightSidebarOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`hidden md:block flex-shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm transition-all duration-300 ${
          leftSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}>
          <div className="h-[calc(100vh-56px)] overflow-y-auto sticky top-14">
            <div className="p-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">文档目录</h2>
              <DocumentTree documents={documentTree} currentSlug={currentDocument.slug} expanded={expanded} onToggle={toggleExpand} />
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 py-6 sm:py-8 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto">
            <article className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
              <div className="px-5 sm:px-12 pt-8 sm:pt-12 pb-8">
                {currentDocument.category && (
                  <div className="mb-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-600 dark:text-indigo-300">
                      {currentDocument.category.name}
                    </span>
                  </div>
                )}

                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight mb-4">
                  {currentDocument.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <User className="w-4 h-4" />
                    <span>{currentDocument.author.name || currentDocument.author.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(currentDocument.updatedAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Eye className="w-4 h-4" />
                    <span>{currentDocument.viewCount + 1} 阅读</span>
                  </div>
                </div>
              </div>

              <div className="px-5 sm:px-12 pb-12">
                <div className="prose dark:prose-invert prose-slate max-w-none [&_h1]:scroll-mt-20 [&_h2]:scroll-mt-20 [&_h3]:scroll-mt-20">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => {
                        const text = String(children)
                        const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
                        return <h1 id={id}>{children}</h1>
                      },
                      h2: ({ children }) => {
                        const text = String(children)
                        const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
                        return <h2 id={id}>{children}</h2>
                      },
                      h3: ({ children }) => {
                        const text = String(children)
                        const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
                        return <h3 id={id}>{children}</h3>
                      },
                    }}
                  >
                    {currentDocument.content}
                  </ReactMarkdown>
                </div>
              </div>

              {currentDocument.children && currentDocument.children.length > 0 && (
                <div className="px-5 sm:px-12 pb-12 border-t border-slate-100 dark:border-slate-800 pt-8">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">子文档</h2>
                  <div className="grid gap-3">
                    {currentDocument.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/docs/${child.slug}`}
                        className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-xl hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 transition-all group"
                      >
                        <FileText className="w-5 h-5 text-indigo-400" />
                        <span className="text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {child.title}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 ml-auto group-hover:translate-x-1 group-hover:text-indigo-500 transition-all" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </div>
        </main>

        <aside className={`hidden md:block flex-shrink-0 border-l border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm transition-all duration-300 ${
          rightSidebarOpen ? 'w-56' : 'w-0 overflow-hidden'
        }`}>
          <div className="h-[calc(100vh-56px)] overflow-y-auto sticky top-14">
            <div className="p-4">
              <TOC content={currentDocument.content} />
            </div>
          </div>
        </aside>
      </div>

      {mobileOverlayOpen && (
        <button
          type="button"
          className="md:hidden fixed inset-x-0 top-14 bottom-0 z-40 bg-slate-950/35 backdrop-blur-[1px]"
          aria-label="关闭目录面板"
          onClick={closeMobilePanels}
        />
      )}

      <aside
        className={`md:hidden fixed top-14 bottom-0 left-0 z-50 w-[min(20rem,88vw)] border-r border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-slate-900/20 transition-transform duration-300 ${
          leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">文档目录</h2>
            <DocumentTree
              documents={documentTree}
              currentSlug={currentDocument.slug}
              expanded={expanded}
              onToggle={toggleExpand}
              onNavigate={closeMobilePanels}
            />
          </div>
        </div>
      </aside>

      <aside
        className={`md:hidden fixed top-14 bottom-0 right-0 z-50 w-[min(18rem,82vw)] border-l border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-slate-900/20 transition-transform duration-300 ${
          rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto">
          <div className="p-4">
            <TOC content={currentDocument.content} onNavigate={closeMobilePanels} />
          </div>
        </div>
      </aside>
    </div>
  )
}
