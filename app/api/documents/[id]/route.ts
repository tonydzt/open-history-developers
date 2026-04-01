import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { getDescendantIds, getTopLevelCategoryId, syncSubtreeCategory } from '@/lib/document-category'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        category: true,
        author: {
          select: { id: true, name: true, email: true },
        },
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, slug, content, excerpt, order, published, parentId, categoryId } = body

    const existingDocument = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        parentId: true,
        categoryId: true,
      },
    })

    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const nextParentId = parentId || null

    if (nextParentId === id) {
      return NextResponse.json({ error: 'Document cannot be its own parent' }, { status: 400 })
    }

    let resolvedCategoryId = existingDocument.categoryId

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
    } else if (categoryId && typeof categoryId === 'string' && categoryId.trim()) {
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
          title,
          slug,
          content,
          excerpt,
          order,
          published,
          parentId: nextParentId,
          categoryId: resolvedCategoryId,
        },
      })

      await syncSubtreeCategory(tx, id, resolvedCategoryId)

      return updatedDocument
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { order } = body

    if (typeof order !== 'number' || !Number.isFinite(order)) {
      return NextResponse.json({ error: 'order must be a valid number' }, { status: 400 })
    }

    const document = await prisma.document.update({
      where: { id },
      data: { order },
      select: { id: true, order: true },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Patch order error:', error)
    return NextResponse.json({ error: 'Failed to update document order' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.document.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
