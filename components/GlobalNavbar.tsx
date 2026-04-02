import { prisma } from '@/lib/prisma'
import { getMessages } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n-server'
import GlobalNavbarClient, { type NavbarCategoryGroup } from '@/components/GlobalNavbarClient'
import { localizeCategory, localizeDocument } from '@/lib/content-i18n'

async function getNavbarCategoryGroups(locale: 'en' | 'zh'): Promise<NavbarCategoryGroup[]> {
  const docs = await prisma.document.findMany({
    where: {
      published: true,
      parentId: null,
    },
    select: {
      id: true,
      title: true,
      titleEn: true,
      titleZh: true,
      slug: true,
      category: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          nameZh: true,
        },
      },
    },
    orderBy: [
      { category: { name: 'asc' } },
      { order: 'asc' },
      { title: 'asc' },
    ],
  })

  const grouped = new Map<string, NavbarCategoryGroup>()
  for (const source of docs) {
    if (!source.category) continue
    const doc = localizeDocument(source, locale)
    const category = localizeCategory(source.category, locale)
    const current = grouped.get(category.id)
    if (!current) {
      grouped.set(category.id, {
        categoryId: category.id,
        categoryName: category.name,
        entries: [{ id: doc.id, title: doc.title, slug: doc.slug }],
      })
    } else {
      current.entries.push({ id: doc.id, title: doc.title, slug: doc.slug })
    }
  }

  return Array.from(grouped.values())
}

export default async function GlobalNavbar() {
  const locale = await getServerLocale()
  const t = getMessages(locale)
  const categoryGroups = await getNavbarCategoryGroups(locale)
  return <GlobalNavbarClient categoryGroups={categoryGroups} locale={locale} labels={t} />
}
