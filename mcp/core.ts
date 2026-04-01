import crypto from 'crypto'
import fs from 'fs'

export type JsonRpcId = string | number | null

export type JsonRpcRequest = {
  jsonrpc: '2.0'
  id?: JsonRpcId
  method: string
  params?: unknown
}

type ToolDefinition = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  handler: (args: Record<string, unknown>, config: McpRuntimeConfig) => Promise<unknown>
}

export type JsonRpcResponse =
  | {
      jsonrpc: '2.0'
      id: JsonRpcId
      result: unknown
    }
  | {
      jsonrpc: '2.0'
      id: JsonRpcId
      error: { code: number; message: string }
    }

export type McpRuntimeConfig = {
  baseUrl: string
  sessionCookie: string
  openApiUserId: string
  openApiPrivateKey: string
}

export const SERVER_NAME = 'open-history-mcp'
export const SERVER_VERSION = '1.0.0'
export const PROTOCOL_VERSION = '2024-11-05'

export function getRuntimeConfig(overrides?: Partial<McpRuntimeConfig>): McpRuntimeConfig {
  const envBaseUrl = process.env.MCP_API_BASE_URL || 'http://localhost:3000'
  const sessionCookie = process.env.MCP_SESSION_COOKIE || ''
  const openApiUserId = process.env.MCP_OPEN_API_USER_ID || ''
  const openApiPrivateKey = resolvePrivateKey()

  return {
    baseUrl: overrides?.baseUrl || envBaseUrl,
    sessionCookie: overrides?.sessionCookie ?? sessionCookie,
    openApiUserId: overrides?.openApiUserId ?? openApiUserId,
    openApiPrivateKey: overrides?.openApiPrivateKey ?? openApiPrivateKey,
  }
}

function resolvePrivateKey(): string {
  const inline = normalizePrivateKey(process.env.MCP_OPEN_API_PRIVATE_KEY || '')
  if (inline) return inline

  const file = process.env.MCP_OPEN_API_PRIVATE_KEY_FILE || ''
  if (!file) return ''

  try {
    return fs.readFileSync(file, 'utf8')
  } catch {
    return ''
  }
}

function normalizePrivateKey(raw: string): string {
  if (!raw) return ''
  return raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw
}

function makeUrl(pathname: string, config: McpRuntimeConfig, query?: Record<string, unknown>): string {
  const url = new URL(pathname, config.baseUrl)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

function bodyHash(body: unknown): string {
  if (body === undefined || body === null) return ''
  if (typeof body === 'object' && Object.keys(body as Record<string, unknown>).length === 0) return ''
  return crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')
}

function openApiSign(timestamp: string, body: unknown, config: McpRuntimeConfig): string {
  if (!config.openApiUserId || !config.openApiPrivateKey) {
    throw new Error('Missing MCP_OPEN_API_USER_ID or MCP_OPEN_API_PRIVATE_KEY')
  }

  const content = `${config.openApiUserId}${timestamp}${bodyHash(body)}`
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(content)
  signer.end()
  return signer.sign(config.openApiPrivateKey, 'base64')
}

async function callApi(
  options: {
    method: string
    path: string
    query?: Record<string, unknown>
    body?: unknown
    auth?: 'session' | 'open'
  },
  config: McpRuntimeConfig
): Promise<unknown> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }

  if (options.auth === 'session' && config.sessionCookie) {
    headers.cookie = config.sessionCookie
  }

  if (options.auth === 'open') {
    const timestamp = String(Date.now())
    const sign = openApiSign(timestamp, options.body, config)
    headers['x-user-id'] = config.openApiUserId
    headers['x-timestamp'] = timestamp
    headers['x-sign'] = sign
  }

  const response = await fetch(makeUrl(options.path, config, options.query), {
    method: options.method,
    headers,
    body: options.method === 'GET' || options.method === 'DELETE' ? undefined : JSON.stringify(options.body ?? {}),
  })

  const text = await response.text()
  const parsed = safeJsonParse(text)

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    data: parsed,
  }
}

function safeJsonParse(text: string): unknown {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function asString(args: Record<string, unknown>, key: string, required = false): string {
  const value = args[key]
  if (typeof value === 'string') return value
  if (required) throw new Error(`Missing required argument: ${key}`)
  return ''
}

function asObject(args: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = args[key]
  if (!value) return {}
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  throw new Error(`Argument ${key} must be an object`)
}

const TOOLS: ToolDefinition[] = [
  {
    name: 'api_categories_get',
    description: 'GET /api/categories 获取分类列表',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: async (_args, config) => callApi({ method: 'GET', path: '/api/categories' }, config),
  },
  {
    name: 'api_documents_get',
    description: 'GET /api/documents 获取文档列表',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: async (_args, config) => callApi({ method: 'GET', path: '/api/documents' }, config),
  },
  {
    name: 'api_documents_post',
    description: 'POST /api/documents 创建文档（需要会话 Cookie）',
    inputSchema: {
      type: 'object',
      properties: { body: { type: 'object' } },
      required: ['body'],
      additionalProperties: false,
    },
    handler: async (args, config) =>
      callApi({ method: 'POST', path: '/api/documents', body: asObject(args, 'body'), auth: 'session' }, config),
  },
  {
    name: 'api_documents_id_get',
    description: 'GET /api/documents/:id 获取单文档',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
    handler: async (args, config) => callApi({ method: 'GET', path: `/api/documents/${asString(args, 'id', true)}` }, config),
  },
  {
    name: 'api_documents_id_put',
    description: 'PUT /api/documents/:id 更新文档（需要会话 Cookie）',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, body: { type: 'object' } },
      required: ['id', 'body'],
      additionalProperties: false,
    },
    handler: async (args, config) =>
      callApi(
        { method: 'PUT', path: `/api/documents/${asString(args, 'id', true)}`, body: asObject(args, 'body'), auth: 'session' },
        config
      ),
  },
  {
    name: 'api_documents_id_patch',
    description: 'PATCH /api/documents/:id 局部更新（需要会话 Cookie）',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, body: { type: 'object' } },
      required: ['id', 'body'],
      additionalProperties: false,
    },
    handler: async (args, config) =>
      callApi(
        { method: 'PATCH', path: `/api/documents/${asString(args, 'id', true)}`, body: asObject(args, 'body'), auth: 'session' },
        config
      ),
  },
  {
    name: 'api_documents_id_delete',
    description: 'DELETE /api/documents/:id 删除文档（需要会话 Cookie）',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
    handler: async (args, config) =>
      callApi({ method: 'DELETE', path: `/api/documents/${asString(args, 'id', true)}`, auth: 'session' }, config),
  },
  {
    name: 'api_open_documents_get',
    description: 'GET /api/open/documents 获取开放接口文档列表（自动签名）',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        pageSize: { type: 'number' },
        published: { type: 'boolean' },
      },
      additionalProperties: false,
    },
    handler: async (args, config) => callApi({ method: 'GET', path: '/api/open/documents', query: args, auth: 'open' }, config),
  },
  {
    name: 'api_open_documents_post',
    description: 'POST /api/open/documents 创建开放接口文档（自动签名）',
    inputSchema: {
      type: 'object',
      properties: { body: { type: 'object' } },
      required: ['body'],
      additionalProperties: false,
    },
    handler: async (args, config) =>
      callApi({ method: 'POST', path: '/api/open/documents', body: asObject(args, 'body'), auth: 'open' }, config),
  },
  {
    name: 'api_open_documents_id_get',
    description: 'GET /api/open/documents/:id 获取开放接口单文档（自动签名）',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
    handler: async (args, config) =>
      callApi({ method: 'GET', path: `/api/open/documents/${asString(args, 'id', true)}`, auth: 'open' }, config),
  },
  {
    name: 'api_open_documents_id_put',
    description: 'PUT /api/open/documents/:id 更新开放接口文档（自动签名）',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, body: { type: 'object' } },
      required: ['id', 'body'],
      additionalProperties: false,
    },
    handler: async (args, config) =>
      callApi(
        { method: 'PUT', path: `/api/open/documents/${asString(args, 'id', true)}`, body: asObject(args, 'body'), auth: 'open' },
        config
      ),
  },
  {
    name: 'api_open_documents_id_delete',
    description: 'DELETE /api/open/documents/:id 删除开放接口文档（自动签名）',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
    handler: async (args, config) =>
      callApi({ method: 'DELETE', path: `/api/open/documents/${asString(args, 'id', true)}`, auth: 'open' }, config),
  },
  {
    name: 'api_admin_categories_get',
    description: 'GET /api/admin/categories 获取后台分类列表（需要管理员会话 Cookie）',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: async (_args, config) => callApi({ method: 'GET', path: '/api/admin/categories', auth: 'session' }, config),
  },
  {
    name: 'api_admin_categories_post',
    description: 'POST /api/admin/categories 创建后台分类（需要管理员会话 Cookie）',
    inputSchema: {
      type: 'object',
      properties: { body: { type: 'object' } },
      required: ['body'],
      additionalProperties: false,
    },
    handler: async (args, config) =>
      callApi({ method: 'POST', path: '/api/admin/categories', body: asObject(args, 'body'), auth: 'session' }, config),
  },
  {
    name: 'api_admin_categories_id_put',
    description: 'PUT /api/admin/categories/:id 更新后台分类（需要管理员会话 Cookie）',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, body: { type: 'object' } },
      required: ['id', 'body'],
      additionalProperties: false,
    },
    handler: async (args, config) =>
      callApi(
        {
          method: 'PUT',
          path: `/api/admin/categories/${asString(args, 'id', true)}`,
          body: asObject(args, 'body'),
          auth: 'session',
        },
        config
      ),
  },
  {
    name: 'api_admin_categories_id_delete',
    description: 'DELETE /api/admin/categories/:id 删除后台分类（需要管理员会话 Cookie）',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
    handler: async (args, config) =>
      callApi({ method: 'DELETE', path: `/api/admin/categories/${asString(args, 'id', true)}`, auth: 'session' }, config),
  },
  {
    name: 'api_admin_users_get',
    description: 'GET /api/admin/users 获取用户列表（需要 SUPER_ADMIN 会话 Cookie）',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: async (_args, config) => callApi({ method: 'GET', path: '/api/admin/users', auth: 'session' }, config),
  },
  {
    name: 'api_admin_users_post',
    description: 'POST /api/admin/users 创建用户（需要 SUPER_ADMIN 会话 Cookie）',
    inputSchema: {
      type: 'object',
      properties: { body: { type: 'object' } },
      required: ['body'],
      additionalProperties: false,
    },
    handler: async (args, config) =>
      callApi({ method: 'POST', path: '/api/admin/users', body: asObject(args, 'body'), auth: 'session' }, config),
  },
  {
    name: 'api_admin_users_id_put',
    description: 'PUT /api/admin/users/:id 更新用户（需要 SUPER_ADMIN 会话 Cookie）',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, body: { type: 'object' } },
      required: ['id', 'body'],
      additionalProperties: false,
    },
    handler: async (args, config) =>
      callApi(
        { method: 'PUT', path: `/api/admin/users/${asString(args, 'id', true)}`, body: asObject(args, 'body'), auth: 'session' },
        config
      ),
  },
  {
    name: 'api_admin_users_id_delete',
    description: 'DELETE /api/admin/users/:id 删除用户（需要 SUPER_ADMIN 会话 Cookie）',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
    handler: async (args, config) =>
      callApi({ method: 'DELETE', path: `/api/admin/users/${asString(args, 'id', true)}`, auth: 'session' }, config),
  },
  {
    name: 'api_admin_users_id_reset_keys_post',
    description: 'POST /api/admin/users/:id/reset-keys 重置 OpenAPI 密钥（需要 SUPER_ADMIN 会话 Cookie）',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
    handler: async (args, config) =>
      callApi({ method: 'POST', path: `/api/admin/users/${asString(args, 'id', true)}/reset-keys`, auth: 'session' }, config),
  },
  {
    name: 'api_user_open_api_key_get',
    description: 'GET /api/user/open-api-key 获取当前登录用户 OpenAPI 私钥（需要会话 Cookie）',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: async (_args, config) => callApi({ method: 'GET', path: '/api/user/open-api-key', auth: 'session' }, config),
  },
  {
    name: 'api_user_open_api_key_post',
    description: 'POST /api/user/open-api-key 重置当前登录用户 OpenAPI 密钥（需要会话 Cookie）',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: async (_args, config) => callApi({ method: 'POST', path: '/api/user/open-api-key', auth: 'session' }, config),
  },
  {
    name: 'api_auth_nextauth',
    description: '透传 /api/auth/* (next-auth)。示例 path="signin"，method=GET|POST。',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        method: { type: 'string', enum: ['GET', 'POST'] },
        query: { type: 'object' },
        body: { type: 'object' },
      },
      required: ['path', 'method'],
      additionalProperties: false,
    },
    handler: async (args, config) => {
      const path = asString(args, 'path', true).replace(/^\/+/, '')
      const method = asString(args, 'method', true)
      const query = asObject(args, 'query')
      const body = asObject(args, 'body')
      return callApi({ method, path: `/api/auth/${path}`, query, body, auth: 'session' }, config)
    },
  },
]

const TOOL_MAP = new Map(TOOLS.map((tool) => [tool.name, tool]))

export function listTools() {
  return TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }))
}

export async function handleMcpRequest(message: JsonRpcRequest, config: McpRuntimeConfig): Promise<JsonRpcResponse | null> {
  if (message.method === 'notifications/initialized' || message.method === 'initialized') {
    return null
  }

  if (message.method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id: message.id ?? null,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: {
          name: SERVER_NAME,
          version: SERVER_VERSION,
        },
      },
    }
  }

  if (message.method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id: message.id ?? null,
      result: {
        tools: listTools(),
      },
    }
  }

  if (message.method === 'tools/call') {
    const params = (message.params ?? {}) as { name?: string; arguments?: Record<string, unknown> }
    const name = params.name
    if (!name || !TOOL_MAP.has(name)) {
      return makeError(message.id ?? null, -32601, `Tool not found: ${name ?? ''}`)
    }

    const tool = TOOL_MAP.get(name)!
    try {
      const result = await tool.handler(params.arguments ?? {}, config)
      return {
        jsonrpc: '2.0',
        id: message.id ?? null,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: false,
        },
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Tool call failed'
      return {
        jsonrpc: '2.0',
        id: message.id ?? null,
        result: {
          content: [
            {
              type: 'text',
              text: msg,
            },
          ],
          isError: true,
        },
      }
    }
  }

  return makeError(message.id ?? null, -32601, `Method not found: ${message.method}`)
}

export function makeError(id: JsonRpcId, code: number, message: string): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: { code, message },
  }
}
