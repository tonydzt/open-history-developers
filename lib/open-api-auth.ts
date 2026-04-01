import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOpenApiSignature } from './rsa-sign'

/**
 * 开放API签名验证中间件
 */
export async function openApiAuth(request: NextRequest) {
  try {
    // 1. 从请求头或查询参数获取签名信息
    const userId = request.headers.get('x-user-id') || request.nextUrl.searchParams.get('userId')
    const timestamp = request.headers.get('x-timestamp') || request.nextUrl.searchParams.get('timestamp')
    const sign = request.headers.get('x-sign') || request.nextUrl.searchParams.get('sign')

    if (!userId || !timestamp || !sign) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: 'Missing authentication parameters. Required: userId, timestamp, sign' },
          { status: 401 }
        ),
      }
    }

    // 2. 查询用户开放API凭证
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        openApiPublicKey: true,
      },
    })

    if (!user || !user.openApiPublicKey) {
      return {
        valid: false,
        response: NextResponse.json({ error: 'Invalid userId or public key not configured' }, { status: 401 }),
      }
    }

    // 5. 获取请求体（如果有）
    let body = null
    if (request.method !== 'GET' && request.method !== 'DELETE') {
      try {
        const clonedRequest = request.clone()
        body = await clonedRequest.json()
      } catch {
        // body为空或不是JSON，忽略
      }
    }

    // 3. 验证签名
    const verifyResult = verifyOpenApiSignature({
      userId,
      timestamp,
      sign,
      body,
      publicKey: user.openApiPublicKey,
    })

    if (!verifyResult.valid) {
      return {
        valid: false,
        response: NextResponse.json({ error: verifyResult.error }, { status: 401 }),
      }
    }

    return {
      valid: true,
      user: { id: user.id },
    }
  } catch (error) {
    console.error('Open API auth error:', error)
    return {
      valid: false,
      response: NextResponse.json({ error: 'Authentication failed' }, { status: 500 }),
    }
  }
}
