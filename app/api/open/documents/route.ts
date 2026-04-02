import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { openApiAuth } from '@/lib/open-api-auth'
import { getTopLevelCategoryId } from '@/lib/document-category'
import { getLocaleFromRequest } from '@/lib/i18n-server'
import { localizeCategory, localizeDocument, resolveLocalizedDocumentInput } from '@/lib/content-i18n'

/**
 * GET /api/open/documents - 获取文档列表
 */
export async function GET(request: NextRequest) {
  // 验证签名
  const authResult = await openApiAuth(request)
  if (!authResult.valid) {
    return authResult.response
  }

  try {
    const locale = getLocaleFromRequest(request)
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const published = searchParams.get('published')

    const where: Prisma.DocumentWhereInput = {}
    if (published !== null) {
      where.published = published === 'true'
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, nameEn: true, nameZh: true },
          },
          author: {
            select: { id: true, name: true, email: true },
          },
          children: {
            select: { id: true, title: true, titleEn: true, titleZh: true, slug: true, order: true },
          },
        },
        orderBy: [{ order: 'asc' }, { title: 'asc' }, { updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.document.count({ where }),
    ])

    return NextResponse.json({
      data: documents.map((document) =>
        localizeDocument(
          {
            ...document,
            category: document.category ? localizeCategory(document.category, locale) : null,
            children: document.children.map((child) => localizeDocument(child, locale)),
          },
          locale
        )
      ),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('Fetch documents error:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

/**
 * POST /api/open/documents - 创建文档
 */
export async function POST(request: NextRequest) {
  // 验证签名
  const authResult = await openApiAuth(request)
  if (!authResult.valid) {
    return authResult.response
  }

  try {
    const body = await request.json()
    const { slug, order, published, parentId, categoryId, authorId } = body
    const localized = resolveLocalizedDocumentInput(body)
    const title = localized.title

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!authorId) {
      return NextResponse.json({ error: 'authorId is required' }, { status: 400 })
    }

    // 验证authorId是否存在
    const author = await prisma.user.findUnique({ where: { id: authorId } })
    if (!author) {
      return NextResponse.json({ error: 'Invalid authorId' }, { status: 400 })
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
        authorId,
      },
      include: {
        category: true,
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Create document error:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}
