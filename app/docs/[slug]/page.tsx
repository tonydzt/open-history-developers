import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DocumentPageClient from '@/components/DocumentPageClient'
import { getServerLocale } from '@/lib/i18n-server'
import { localizeCategory, localizeDocument } from '@/lib/content-i18n'

interface PageProps {
  params: Promise<{ slug: string }>
}

type DocumentTreeItem = {
  id: string
  title: string
  slug: string
  parentId: string | null
  order: number
  children: DocumentTreeItem[]
}

async function getDocumentTreeByRoot(currentDocumentId: string, locale: 'en' | 'zh') {
  const docs = await prisma.document.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      titleEn: true,
      titleZh: true,
      slug: true,
      parentId: true,
      order: true,
    },
    orderBy: [{ order: 'asc' }, { title: 'asc' }],
  })

  const localizedDocs = docs.map((doc) => localizeDocument(doc, locale))
  const docMap = new Map<string, DocumentTreeItem>(localizedDocs.map((d) => [d.id, { ...d, children: [] }]))
  const parentMap = new Map<string, string | null>(localizedDocs.map((d) => [d.id, d.parentId]))

  localizedDocs.forEach(doc => {
    if (doc.parentId && docMap.has(doc.parentId)) {
      docMap.get(doc.parentId)!.children.push(docMap.get(doc.id)!)
    }
  })

  let rootId = currentDocumentId
  const visited = new Set<string>()

  while (parentMap.get(rootId)) {
    if (visited.has(rootId)) break
    visited.add(rootId)
    const parentId = parentMap.get(rootId)
    if (!parentId || !parentMap.has(parentId)) break
    rootId = parentId
  }

  const root = docMap.get(rootId)
  return root ? [root] : []
}

export default async function DocumentPage({ params }: PageProps) {
  const locale = await getServerLocale()
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)

  const document = await prisma.document.findUnique({
    where: { slug: decodedSlug },
    include: {
      category: true,
      author: {
        select: { id: true, name: true, email: true },
      },
      children: true
    }
  })

  if (!document || !document.published) {
    notFound()
  }

  const documentTree = await getDocumentTreeByRoot(document.id, locale)
  const localizedDocument = localizeDocument(
    {
      ...document,
      category: document.category ? localizeCategory(document.category, locale) : null,
      children: document.children.map((child) => localizeDocument(child, locale)),
    },
    locale
  )

  await prisma.document.update({
    where: { id: document.id },
    data: { viewCount: { increment: 1 } }
  })

  return (
    <DocumentPageClient
      document={{
        id: localizedDocument.id,
        title: localizedDocument.title,
        slug: localizedDocument.slug,
        content: localizedDocument.content,
        viewCount: localizedDocument.viewCount,
        updatedAt: localizedDocument.updatedAt.toISOString(),
        author: { name: localizedDocument.author.name, email: localizedDocument.author.email },
        category: localizedDocument.category ? { name: localizedDocument.category.name } : null,
        children: localizedDocument.children.map(c => ({ id: c.id, title: c.title, slug: c.slug }))
      }}
      documentTree={documentTree}
    />
  )
}
