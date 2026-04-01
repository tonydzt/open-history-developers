import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DocumentPageClient from '@/components/DocumentPageClient'

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

async function getDocumentTreeByRoot(currentDocumentId: string) {
  const docs = await prisma.document.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      slug: true,
      parentId: true,
      order: true,
    },
    orderBy: [{ order: 'asc' }, { title: 'asc' }],
  })

  const docMap = new Map<string, DocumentTreeItem>(docs.map((d) => [d.id, { ...d, children: [] }]))
  const parentMap = new Map<string, string | null>(docs.map((d) => [d.id, d.parentId]))

  docs.forEach(doc => {
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

  const documentTree = await getDocumentTreeByRoot(document.id)

  await prisma.document.update({
    where: { id: document.id },
    data: { viewCount: { increment: 1 } }
  })

  return (
    <DocumentPageClient
      document={{
        id: document.id,
        title: document.title,
        slug: document.slug,
        content: document.content,
        viewCount: document.viewCount,
        updatedAt: document.updatedAt.toISOString(),
        author: { name: document.author.name, email: document.author.email },
        category: document.category ? { name: document.category.name } : null,
        children: document.children.map(c => ({ id: c.id, title: c.title, slug: c.slug }))
      }}
      documentTree={documentTree}
    />
  )
}
