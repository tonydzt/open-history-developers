import { prisma } from '@/lib/prisma'
import GlobalNavbarClient, { type NavbarCategoryGroup } from '@/components/GlobalNavbarClient'

async function getNavbarCategoryGroups(): Promise<NavbarCategoryGroup[]> {
  const docs = await prisma.document.findMany({
    where: {
      published: true,
      parentId: null,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      category: {
        select: {
          id: true,
          name: true,
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
  for (const doc of docs) {
    if (!doc.category) continue
    const current = grouped.get(doc.category.id)
    if (!current) {
      grouped.set(doc.category.id, {
        categoryId: doc.category.id,
        categoryName: doc.category.name,
        entries: [{ id: doc.id, title: doc.title, slug: doc.slug }],
      })
    } else {
      current.entries.push({ id: doc.id, title: doc.title, slug: doc.slug })
    }
  }

  return Array.from(grouped.values())
}

export default async function GlobalNavbar() {
  const categoryGroups = await getNavbarCategoryGroups()
  return <GlobalNavbarClient categoryGroups={categoryGroups} />
}
