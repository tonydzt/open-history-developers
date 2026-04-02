import Link from 'next/link'
import { getMessages } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n-server'
import { prisma } from '@/lib/prisma'
import { localizeCategory, localizeDocument } from '@/lib/content-i18n'

export default async function Home() {
  const locale = await getServerLocale()
  const t = getMessages(locale)

  const documents = await prisma.document.findMany({
    where: {
      published: true,
      parentId: null,
    },
    include: {
      category: true,
      author: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }, { title: 'asc' }],
  })
  const localizedDocuments = documents.map((document) =>
    localizeDocument(
      {
        ...document,
        category: document.category ? localizeCategory(document.category, locale) : null,
      },
      locale
    )
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-full text-indigo-600 dark:text-indigo-300 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            {t.home.badge}
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent mb-6">
            {t.home.title}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {t.home.subtitle}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {localizedDocuments.map((doc) => (
            <Link
              key={doc.id}
              href={`/docs/${doc.slug}`}
              className="group relative bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-600 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 p-6 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-600 dark:text-indigo-300">
                    {doc.category?.name || t.home.uncategorized}
                  </span>
                  <span className="text-sm text-slate-400 dark:text-slate-500">
                    {new Date(doc.updatedAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {doc.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 line-clamp-2 text-sm">
                  {doc.excerpt || doc.content.slice(0, 100) + '...'}
                </p>
                <div className="mt-4 flex items-center text-indigo-500 dark:text-indigo-400 text-sm font-medium">
                  {t.home.readDocument}
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {localizedDocuments.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-lg">{t.home.emptyTitle}</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">{t.home.emptyHint}</p>
          </div>
        )}
      </div>
    </div>
  )
}
