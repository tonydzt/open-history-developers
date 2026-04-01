'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type CategoryOption = {
  id: string
  name: string
}

export function AdminDocumentsCategoryFilter({
  categories,
  selectedCategoryId,
}: {
  categories: CategoryOption[]
  selectedCategoryId: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <div>
      <label
        htmlFor="categoryId"
        className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2"
      >
        分类筛选
      </label>
      <select
        id="categoryId"
        name="categoryId"
        value={selectedCategoryId}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString())
          const nextCategoryId = event.target.value

          if (nextCategoryId) {
            params.set('categoryId', nextCategoryId)
          } else {
            params.delete('categoryId')
          }

          params.set('page', '1')
          router.push(`${pathname}?${params.toString()}`)
        }}
        className="min-w-56 px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
      >
        <option value="">全部分类</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export function AdminDocumentsPageSizeSelect({
  pageSize,
  options,
}: {
  pageSize: number
  options: number[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <div className="flex items-center">
      <label
        htmlFor="pageSizeBottom"
        className="mr-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
      >
        每页数量
      </label>
      <select
        id="pageSizeBottom"
        name="pageSize"
        value={String(pageSize)}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set('pageSize', event.target.value)
          params.set('page', '1')
          router.push(`${pathname}?${params.toString()}`)
        }}
        className="min-w-24 px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size} 条
          </option>
        ))}
      </select>
    </div>
  )
}
