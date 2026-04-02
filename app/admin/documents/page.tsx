import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import AdminDocumentsTableClient from '@/components/AdminDocumentsTableClient'
import { AdminDocumentsCategoryFilter, AdminDocumentsPageSizeSelect } from '@/components/AdminDocumentsQueryControls'
import { getServerLocale } from '@/lib/i18n-server'
import { localizeCategory, localizeDocument } from '@/lib/content-i18n'

type DocumentWithRelations = Prisma.DocumentGetPayload<{
  include: {
    category: true
    author: {
      select: { id: true; name: true; email: true }
    }
  }
}>

type FlattenedDocument = DocumentWithRelations & {
  level: number
}

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }
  return parsed
}

async function toFlatDocuments(docs: DocumentWithRelations[]): Promise<FlattenedDocument[]> {
  const parentCache = new Map<string, string | null>()
  const levelCache = new Map<string, number>()

  for (const doc of docs) {
    parentCache.set(doc.id, doc.parentId)
  }

  const resolveLevel = async (docId: string): Promise<number> => {
    if (levelCache.has(docId)) {
      return levelCache.get(docId)!
    }

    let level = 0
    let currentId: string | null = docId
    const visited = new Set<string>()

    while (currentId) {
      if (visited.has(currentId)) {
        break
      }
      visited.add(currentId)

      if (!parentCache.has(currentId)) {
        const parent = await prisma.document.findUnique({
          where: { id: currentId },
          select: { parentId: true },
        })
        parentCache.set(currentId, parent?.parentId || null)
      }

      const nextParentId: string | null = parentCache.get(currentId) ?? null
      if (!nextParentId) {
        break
      }

      level += 1
      currentId = nextParentId
    }

    levelCache.set(docId, level)
    return level
  }

  const result: FlattenedDocument[] = []
  for (const doc of docs) {
    const level = await resolveLevel(doc.id)
    result.push({ ...doc, level })
  }

  return result
}

function buildAdminDocumentsHref(params: { categoryId?: string; page: number; pageSize: number }) {
  const search = new URLSearchParams()
  if (params.categoryId) {
    search.set('categoryId', params.categoryId)
  }
  search.set('page', String(params.page))
  search.set('pageSize', String(params.pageSize))
  return `/admin/documents?${search.toString()}`
}

async function getDocumentsPage(params: { categoryId?: string; page: number; pageSize: number }) {
  const { categoryId, page, pageSize } = params
  const where: Prisma.DocumentWhereInput = categoryId ? { categoryId } : {}
  const total = await prisma.document.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const skip = (currentPage - 1) * pageSize

  const docs = await prisma.document.findMany({
    where: categoryId
      ? {
          categoryId,
        }
      : undefined,
    include: {
      category: true,
      author: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [{ order: 'asc' }, { title: 'asc' }, { updatedAt: 'desc' }],
    skip,
    take: pageSize,
  })

  return {
    docs: await toFlatDocuments(docs),
    total,
    totalPages,
    page: currentPage,
    pageSize,
  }
}

async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
  })
}

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; page?: string; pageSize?: string }>
}) {
  const session = await getServerSession(authOptions)
  const locale = await getServerLocale()

  if (!session) {
    redirect('/login')
  }

  const { categoryId, page: pageParam, pageSize: pageSizeParam } = await searchParams
  const page = parsePositiveInt(pageParam, DEFAULT_PAGE)
  const pageSizeInput = parsePositiveInt(pageSizeParam, DEFAULT_PAGE_SIZE)
  const pageSize = PAGE_SIZE_OPTIONS.includes(pageSizeInput) ? pageSizeInput : DEFAULT_PAGE_SIZE

  const categories = await getCategories()
  const localizedCategories = categories.map((category) => localizeCategory(category, locale))
  const selectedCategory = categoryId
    ? localizedCategories.find((category) => category.id === categoryId) || null
    : null

  const paginationResult = await getDocumentsPage({
    categoryId: selectedCategory?.id,
    page,
    pageSize,
  })

  const previousPageHref = buildAdminDocumentsHref({
    categoryId: selectedCategory?.id,
    page: Math.max(1, paginationResult.page - 1),
    pageSize: paginationResult.pageSize,
  })
  const nextPageHref = buildAdminDocumentsHref({
    categoryId: selectedCategory?.id,
    page: Math.min(paginationResult.totalPages, paginationResult.page + 1),
    pageSize: paginationResult.pageSize,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-indigo-800 dark:from-white dark:to-indigo-300 bg-clip-text text-transparent">
            文档管理
          </h1>
          <Link
            href="/admin/documents/new"
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 py-2.5 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
          >
            + 新建文档
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm px-4 py-4 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
          <AdminDocumentsCategoryFilter
            categories={localizedCategories.map((category) => ({ id: category.id, name: category.name }))}
            selectedCategoryId={selectedCategory?.id || ''}
          />
        </div>

        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
          <AdminDocumentsTableClient
            documents={paginationResult.docs.map((source) => {
              const doc = localizeDocument(source, locale)
              const category = doc.category ? localizeCategory(doc.category, locale) : null
              return {
                id: doc.id,
                title: doc.title,
                slug: doc.slug,
                order: doc.order,
                published: doc.published,
                updatedAt: doc.updatedAt.toISOString(),
                level: doc.level,
                category: category ? { name: category.name } : null,
              }
            })}
          />

          {paginationResult.docs.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-500 dark:text-slate-400">暂无文档</p>
              <Link
                href="/admin/documents/new"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-2 inline-block font-medium"
              >
                创建第一篇文档
              </Link>
            </div>
          )}
        </div>

        {paginationResult.total > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm px-4 py-3 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                第 {paginationResult.page} / {paginationResult.totalPages} 页，共 {paginationResult.total} 条
              </p>
              <AdminDocumentsPageSizeSelect pageSize={paginationResult.pageSize} options={PAGE_SIZE_OPTIONS} />
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={previousPageHref}
                aria-disabled={paginationResult.page <= 1}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  paginationResult.page <= 1
                    ? 'pointer-events-none bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                    : 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
                }`}
              >
                上一页
              </Link>
              <Link
                href={nextPageHref}
                aria-disabled={paginationResult.page >= paginationResult.totalPages}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  paginationResult.page >= paginationResult.totalPages
                    ? 'pointer-events-none bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                    : 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
                }`}
              >
                下一页
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
