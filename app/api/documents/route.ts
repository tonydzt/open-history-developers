import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { getTopLevelCategoryId } from '@/lib/document-category'
import { localizeCategory, localizeDocument, resolveLocalizedDocumentInput } from '@/lib/content-i18n'
import { getServerLocale } from '@/lib/i18n-server'

export async function GET() {
  try {
    const locale = await getServerLocale()
    const documents = await prisma.document.findMany({
      include: {
        category: true,
        author: {
          select: { id: true, name: true, email: true },
        },
        children: true
      },
      orderBy: [{ order: 'asc' }, { title: 'asc' }, { updatedAt: 'desc' }]
    })
    return NextResponse.json(
      documents.map((document) =>
        localizeDocument(
          {
            ...document,
            category: document.category ? localizeCategory(document.category, locale) : null,
            children: document.children.map((child) => localizeDocument(child, locale)),
          },
          locale
        )
      )
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { slug, order, published, parentId, categoryId } = body
    const localized = resolveLocalizedDocumentInput(body)
    const title = localized.title

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    let resolvedCategoryId = ''

    if (parentId) {
      const parentDocument = await prisma.document.findUnique({
        where: { id: parentId },
        select: { id: true },
      })

      if (!parentDocument) {
        return NextResponse.json({ error: 'Invalid parentId' }, { status: 400 })
      }

      const inheritedCategoryId = await getTopLevelCategoryId(prisma, parentId)

      if (!inheritedCategoryId) {
        return NextResponse.json({ error: 'Failed to resolve parent category' }, { status: 400 })
      }

      resolvedCategoryId = inheritedCategoryId
    } else {
      if (!categoryId || typeof categoryId !== 'string' || !categoryId.trim()) {
        return NextResponse.json({ error: 'categoryId is required for top-level documents' }, { status: 400 })
      }

      const category = await prisma.category.findUnique({ where: { id: categoryId } })
      if (!category) {
        return NextResponse.json({ error: 'Invalid categoryId' }, { status: 400 })
      }

      resolvedCategoryId = category.id
    }

    const document = await prisma.document.create({
      data: {
        title,
        titleEn: localized.titleEn,
        titleZh: localized.titleZh,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, ''),
        content: localized.content,
        contentEn: localized.contentEn,
        contentZh: localized.contentZh,
        excerpt: localized.excerpt,
        excerptEn: localized.excerptEn,
        excerptZh: localized.excerptZh,
        order: typeof order === 'number' ? order : 0,
        published: published || false,
        parentId: parentId || null,
        categoryId: resolvedCategoryId,
        authorId: token.sub as string,
      },
      include: {
        category: true,
        author: {
          select: { id: true, name: true, email: true },
        },
      }
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Create document error:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}
