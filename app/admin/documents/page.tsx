import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

async function getDocuments() {
  const docs = await prisma.document.findMany({
    include: { 
      category: true, 
      author: true
    },
    orderBy: { updatedAt: 'desc' }
  })
  
  const docMap = new Map(docs.map(d => [d.id, { ...d, children: [] as any[] }]))
  const roots: any[] = []
  
  docs.forEach(doc => {
    const node = docMap.get(doc.id)!
    if (doc.parentId && docMap.has(doc.parentId)) {
      docMap.get(doc.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  
  return roots
}

function flattenDocuments(documents: any[], level = 0): any[] {
  const result: any[] = []
  documents.forEach(doc => {
    result.push({ ...doc, level })
    if (doc.children && doc.children.length > 0) {
      result.push(...flattenDocuments(doc.children, level + 1))
    }
  })
  return result
}

export default async function AdminDocumentsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const documents = await getDocuments()
  const flatDocuments = flattenDocuments(documents)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-indigo-800 dark:from-white dark:to-indigo-300 bg-clip-text text-transparent">
              文档管理
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              管理所有文档内容（支持多层级结构）
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              返回首页
            </Link>
            <Link
              href="/admin/documents/new"
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 py-2.5 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
            >
              + 新建文档
            </Link>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800/50 dark:to-slate-800/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  标题
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  分类
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
              {flatDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2" style={{ paddingLeft: `${doc.level * 24}px` }}>
                      {doc.level > 0 && (
                        <span className="text-indigo-400">└</span>
                      )}
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {doc.title}
                        </div>
                        <div className="text-sm text-slate-400 dark:text-slate-500">
                          /docs/{doc.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {doc.category?.name || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium ${
                        doc.published
                          ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-900/50 dark:to-teal-900/50 dark:text-emerald-300'
                          : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900/50 dark:to-orange-900/50 dark:text-amber-300'
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
                        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-medium transition-colors"
                      >
                        添加子文档
                      </Link>
                      <Link
                        href={`/docs/${doc.slug}`}
                        target="_blank"
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
                      >
                        查看
                      </Link>
                      <Link
                        href={`/admin/documents/${doc.id}/edit`}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
                      >
                        编辑
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {flatDocuments.length === 0 && (
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
      </div>
    </div>
  )
}
