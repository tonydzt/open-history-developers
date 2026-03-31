import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOpenApiSignature } from './rsa-sign'

/**
 * 开放API签名验证中间件
 */
export async function openApiAuth(request: NextRequest) {
  try {
    // 1. 从请求头或查询参数获取签名信息
    const appId = request.headers.get('x-app-id') || request.nextUrl.searchParams.get('appId')
    const timestamp = request.headers.get('x-timestamp') || request.nextUrl.searchParams.get('timestamp')
    const sign = request.headers.get('x-sign') || request.nextUrl.searchParams.get('sign')

    if (!appId || !timestamp || !sign) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: 'Missing authentication parameters. Required: appId, timestamp, sign' },
          { status: 401 }
        ),
      }
    }

    // 2. 查询API Key
    const apiKey = await prisma.apiKey.findUnique({
      where: { appId },
    })

    if (!apiKey) {
      return {
        valid: false,
        response: NextResponse.json({ error: 'Invalid appId' }, { status: 401 }),
      }
    }

    // 3. 检查API Key状态
    if (!apiKey.isActive) {
      return {
        valid: false,
        response: NextResponse.json({ error: 'API Key is disabled' }, { status: 403 }),
      }
    }

    // 4. 检查过期时间
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return {
        valid: false,
        response: NextResponse.json({ error: 'API Key has expired' }, { status: 403 }),
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

    // 6. 验证签名
    const verifyResult = verifyOpenApiSignature({
      appId,
      timestamp,
      sign,
      body,
      publicKey: apiKey.publicKey,
    })

    if (!verifyResult.valid) {
      return {
        valid: false,
        response: NextResponse.json({ error: verifyResult.error }, { status: 401 }),
      }
    }

    // 7. 更新最后使用时间
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })

    return { valid: true, apiKey }
  } catch (error) {
    console.error('Open API auth error:', error)
    return {
      valid: false,
      response: NextResponse.json({ error: 'Authentication failed' }, { status: 500 }),
    }
  }
}
