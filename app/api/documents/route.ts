import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      include: {
        category: true,
        author: true,
        children: true
      },
      orderBy: { updatedAt: 'desc' }
    })
    return NextResponse.json(documents)
  } catch (error) {
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
    const { title, slug, content, excerpt, published, parentId, categoryId } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const document = await prisma.document.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, ''),
        content: content || '',
        excerpt,
        published: published || false,
        parentId: parentId || null,
        categoryId: categoryId || null,
        authorId: token.sub as string,
      },
      include: {
        category: true,
        author: true,
      }
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Create document error:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}
