import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DocumentPageClient from '@/components/DocumentPageClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getDocumentTree() {
  const docs = await prisma.document.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      slug: true,
      parentId: true,
    },
    orderBy: { title: 'asc' }
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

export default async function DocumentPage({ params }: PageProps) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  
  console.log('=== Document Page Debug ===')
  console.log('slug from params:', JSON.stringify(slug))
  console.log('decodedSlug:', JSON.stringify(decodedSlug))

  const [document, documentTree] = await Promise.all([
    prisma.document.findUnique({
      where: { slug: decodedSlug },
      include: { category: true, author: true, children: true }
    }),
    getDocumentTree()
  ])
  
  console.log('document found:', document ? document.title : 'NOT FOUND')

  if (!document || !document.published) {
    notFound()
  }

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
