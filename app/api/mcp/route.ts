import { NextRequest, NextResponse } from 'next/server'
import { getRuntimeConfig, handleMcpRequest, JsonRpcRequest, makeError, SERVER_NAME, SERVER_VERSION } from '@/mcp/core'

function normalizePrivateKey(value: string): string {
  return value.includes('\\n') ? value.replace(/\\n/g, '\n') : value
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin

  return NextResponse.json({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    endpoint: `${origin}/api/mcp`,
    transport: 'http-jsonrpc',
  })
}

export async function POST(request: NextRequest) {
  let payload: JsonRpcRequest

  try {
    payload = (await request.json()) as JsonRpcRequest
  } catch {
    return NextResponse.json(makeError(null, -32700, 'Parse error'), { status: 400 })
  }

  const headerUserId = request.headers.get('x-open-api-user-id') || undefined
  const headerPrivateKeyRaw = request.headers.get('x-open-api-private-key')
  const headerPrivateKey = headerPrivateKeyRaw ? normalizePrivateKey(headerPrivateKeyRaw) : undefined
  const headerSessionCookie = request.headers.get('x-mcp-session-cookie') || undefined

  const config = getRuntimeConfig({
    baseUrl: process.env.MCP_API_BASE_URL || request.nextUrl.origin,
    openApiUserId: headerUserId,
    openApiPrivateKey: headerPrivateKey,
    sessionCookie: headerSessionCookie,
  })

  try {
    const response = await handleMcpRequest(payload, config)
    if (!response) {
      return new NextResponse(null, { status: 204 })
    }
    return NextResponse.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json(makeError(payload.id ?? null, -32603, message), { status: 500 })
  }
}
