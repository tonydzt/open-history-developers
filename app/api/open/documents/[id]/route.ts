import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { openApiAuth } from '@/lib/open-api-auth'
import { getDescendantIds, getTopLevelCategoryId, syncSubtreeCategory } from '@/lib/document-category'

/**
 * GET /api/open/documents/:id - 获取单个文档详情
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 验证签名
  const authResult = await openApiAuth(request)
  if (!authResult.valid) {
    return authResult.response
  }

  try {
    const { id } = await params

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, description: true },
        },
        author: {
          select: { id: true, name: true, email: true },
        },
        parent: {
          select: { id: true, title: true, slug: true },
        },
        children: {
          select: { id: true, title: true, slug: true, order: true },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 增加浏览次数
    await prisma.document.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Fetch document error:', error)
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
  }
}

/**
 * PUT /api/open/documents/:id - 更新文档
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 验证签名
  const authResult = await openApiAuth(request)
  if (!authResult.valid) {
    return authResult.response
  }

  try {
    const { id } = await params
    const body = await request.json()

    // 检查文档是否存在
    const existingDoc = await prisma.document.findUnique({ where: { id } })
    if (!existingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const { title, slug, content, excerpt, order, published, parentId, categoryId } = body
    const nextParentId = parentId === undefined ? existingDoc.parentId : parentId || null
    let resolvedCategoryId = existingDoc.categoryId

    if (nextParentId) {
      const descendantIds = await getDescendantIds(prisma, id)
      if (descendantIds.includes(nextParentId)) {
        return NextResponse.json({ error: 'Cannot move document under its own descendant' }, { status: 400 })
      }

      const parentDocument = await prisma.document.findUnique({
        where: { id: nextParentId },
        select: { id: true },
      })

      if (!parentDocument) {
        return NextResponse.json({ error: 'Invalid parentId' }, { status: 400 })
      }

      const inheritedCategoryId = await getTopLevelCategoryId(prisma, nextParentId)
      if (!inheritedCategoryId) {
        return NextResponse.json({ error: 'Failed to resolve parent category' }, { status: 400 })
      }

      resolvedCategoryId = inheritedCategoryId
    } else if (categoryId !== undefined) {
      if (!categoryId || typeof categoryId !== 'string' || !categoryId.trim()) {
        return NextResponse.json({ error: 'categoryId is required for top-level documents' }, { status: 400 })
      }

      const category = await prisma.category.findUnique({ where: { id: categoryId } })
      if (!category) {
        return NextResponse.json({ error: 'Invalid categoryId' }, { status: 400 })
      }

      resolvedCategoryId = category.id
    }

    const document = await prisma.$transaction(async (tx) => {
      const updatedDocument = await tx.document.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(slug !== undefined && { slug }),
          ...(content !== undefined && { content }),
          ...(excerpt !== undefined && { excerpt }),
          ...(order !== undefined && { order }),
          ...(published !== undefined && { published }),
          ...(parentId !== undefined && { parentId: nextParentId }),
          categoryId: resolvedCategoryId,
        },
        include: {
          category: true,
          author: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      await syncSubtreeCategory(tx, id, resolvedCategoryId)

      return updatedDocument
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Update document error:', error)
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

/**
 * DELETE /api/open/documents/:id - 删除文档
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 验证签名
  const authResult = await openApiAuth(request)
  if (!authResult.valid) {
    return authResult.response
  }

  try {
    const { id } = await params

    // 检查文档是否存在
    const existingDoc = await prisma.document.findUnique({ where: { id } })
    if (!existingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    await prisma.document.delete({ where: { id } })

    return NextResponse.json({ message: 'Document deleted successfully' })
  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
