import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { openApiAuth } from '@/lib/open-api-auth'

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
          select: { id: true, title: true, slug: true },
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

    const { title, slug, content, excerpt, published, parentId, categoryId } = body

    const document = await prisma.document.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(published !== undefined && { published }),
        ...(parentId !== undefined && { parentId }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: {
        category: true,
        author: {
          select: { id: true, name: true, email: true },
        },
      },
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
