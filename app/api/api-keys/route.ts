import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { generateRSAKeyPair, generateAppId } from '@/lib/rsa-sign'

/**
 * GET /api/api-keys - 获取当前用户的所有API Keys
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: token.sub as string },
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
        // 不返回私钥，只返回公钥
        publicKey: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(apiKeys)
  } catch (error) {
    console.error('Fetch API keys error:', error)
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
  }
}

/**
 * POST /api/api-keys - 创建新的API Key
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { appName, rateLimit, expiresAt } = body

    if (!appName) {
      return NextResponse.json({ error: 'appName is required' }, { status: 400 })
    }

    // 生成RSA密钥对
    const { publicKey, privateKey } = generateRSAKeyPair()
    const appId = generateAppId()

    const apiKey = await prisma.apiKey.create({
      data: {
        appId,
        appName,
        publicKey,
        privateKey,
        rateLimit: rateLimit || 100,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        userId: token.sub as string,
      },
      select: {
        id: true,
        appId: true,
        appName: true,
        isActive: true,
        rateLimit: true,
        createdAt: true,
        expiresAt: true,
        publicKey: true,
        privateKey: true, // 创建时返回私钥，仅此一次
      },
    })

    return NextResponse.json(apiKey, { status: 201 })
  } catch (error) {
    console.error('Create API key error:', error)
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
  }
}
