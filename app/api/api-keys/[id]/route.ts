import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/api-keys/:id - 获取单个API Key详情
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const apiKey = await prisma.apiKey.findFirst({
      where: { id, userId: token.sub as string },
      select: {
        id: true,
        appId: true,
        appName: true,
        isActive: true,
        rateLimit: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
        publicKey: true,
        // 不返回私钥
      },
    })

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not found' }, { status: 404 })
    }

    return NextResponse.json(apiKey)
  } catch (error) {
    console.error('Fetch API key error:', error)
    return NextResponse.json({ error: 'Failed to fetch API key' }, { status: 500 })
  }
}

/**
 * PUT /api/api-keys/:id - 更新API Key
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // 验证API Key是否属于当前用户
    const existingKey = await prisma.apiKey.findFirst({
      where: { id, userId: token.sub as string },
    })

    if (!existingKey) {
      return NextResponse.json({ error: 'API Key not found' }, { status: 404 })
    }

    const { appName, isActive, rateLimit, expiresAt } = body

    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: {
        ...(appName !== undefined && { appName }),
        ...(isActive !== undefined && { isActive }),
        ...(rateLimit !== undefined && { rateLimit }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
      select: {
        id: true,
        appId: true,
        appName: true,
        isActive: true,
        rateLimit: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
        publicKey: true,
      },
    })

    return NextResponse.json(apiKey)
  } catch (error) {
    console.error('Update API key error:', error)
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 })
  }
}

/**
 * DELETE /api/api-keys/:id - 删除API Key
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // 验证API Key是否属于当前用户
    const existingKey = await prisma.apiKey.findFirst({
      where: { id, userId: token.sub as string },
    })

    if (!existingKey) {
      return NextResponse.json({ error: 'API Key not found' }, { status: 404 })
    }

    await prisma.apiKey.delete({ where: { id } })

    return NextResponse.json({ message: 'API Key deleted successfully' })
  } catch (error) {
    console.error('Delete API key error:', error)
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
  }
}
