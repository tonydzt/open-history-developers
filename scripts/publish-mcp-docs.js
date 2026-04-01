const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const CATEGORY_NAME = 'MCP 开放文档'

const documents = [
  {
    key: 'root',
    order: 0,
    title: 'MCP 开放文档',
    slug: 'mcp-open-docs',
    excerpt: '面向 IDE/Agent 客户端的 MCP 接入文档，提供可直接复制的命令与 JSON 配置。',
    content: `# MCP 开放文档

本文档用于指导 IDE/Agent 客户端通过 HTTP 方式接入 MCP（Model Context Protocol）并调用本平台 API。

## 能力范围

当前 MCP Server 已封装本平台全部 API 路由：

- 文档接口
- 开放接口（RSA 签名）
- 后台分类与用户管理接口
- 当前用户 OpenAPI 私钥接口
- NextAuth 透传接口

## MCP 服务地址

本平台提供在线 MCP 端点：

\`\`\`text
https://your-domain/api/mcp
\`\`\`

本地开发时改成：

\`\`\`text
http://localhost:3000/api/mcp
\`\`\`

客户端只需要配置该地址和访问凭证，不需要单独部署 MCP Server。

## 接入目标

接入完成后，大模型可以直接通过 MCP tools 执行创建文档、查询文档、管理分类、管理用户等操作。`,
  },
  {
    key: 'quick-start',
    parentKey: 'root',
    order: 10,
    title: '快速开始',
    slug: 'mcp-open-docs-quick-start',
    excerpt: '3 步完成接入：填 MCP 地址、写配置、验证调用。',
    content: `# 快速开始

## 第一步：配置 MCP 端点

在 MCP 客户端中新增一个 HTTP MCP 服务，地址填入：

\`\`\`text
https://your-domain/api/mcp
\`\`\`

本地开发环境通常为：

\`\`\`text
http://localhost:3000/api/mcp
\`\`\`

## 第二步：写入客户端配置

通用写法（多数客户端都支持）：

\`\`\`json
{
  "mcpServers": {
    "open-history": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://your-domain/api/mcp"],
      "env": {
        "MCP_OPEN_API_USER_ID": "your-user-id",
        "MCP_OPEN_API_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\\\\n...\\\\n-----END PRIVATE KEY-----",
        "MCP_SESSION_COOKIE": "next-auth.session-token=..."
      }
    }
  }
}
\`\`\`

说明：

- 仅调用开放接口可只配置 \`MCP_OPEN_API_USER_ID\` + \`MCP_OPEN_API_PRIVATE_KEY\`
- 调用后台接口需要 \`MCP_SESSION_COOKIE\`

## 第三步：验证调用

完成后先调用 \`api_open_documents_get\` 验证链路是否可用。`,
  },
  {
    key: 'run-config',
    parentKey: 'root',
    order: 20,
    title: '各 IDE 配置',
    slug: 'mcp-open-docs-runtime-config',
    excerpt: 'Cursor、VS Code、Claude Desktop、Cline、Windsurf 的配置格式与命令。',
    content: `# 各 IDE 配置

## Cursor / VS Code / Claude Desktop（命令式接入）

\`\`\`bash
npx -y mcp-remote@latest https://your-domain/api/mcp
\`\`\`

在对应 IDE 的 MCP 配置里，将服务地址填为上面的 URL，并补充环境变量。

## Cline / Windsurf（JSON 配置）

\`\`\`json
{
  "mcpServers": {
    "open-history": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://your-domain/api/mcp"],
      "env": {
        "MCP_OPEN_API_USER_ID": "your-user-id",
        "MCP_OPEN_API_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\\\\n...\\\\n-----END PRIVATE KEY-----"
      }
    }
  }
}
\`\`\`

## 必要环境变量

- \`MCP_OPEN_API_USER_ID\`
- \`MCP_OPEN_API_PRIVATE_KEY\` 或 \`MCP_OPEN_API_PRIVATE_KEY_FILE\`
- \`MCP_SESSION_COOKIE\`（仅后台接口需要）

## 变量用途对应关系

- 自动签名：\`/api/open/*\`
- 需要 Cookie：\`/api/documents*\`、\`/api/admin/*\`、\`/api/user/*\`、\`/api/auth/*\`

## 使用建议

- 私钥仅放服务端
- 若私钥泄露，立即重置公私钥
- 生产环境建议使用专门 API 用户，不建议共用管理员主账号`,
  },
  {
    key: 'tool-list',
    parentKey: 'root',
    order: 30,
    title: '工具清单',
    slug: 'mcp-open-docs-tool-list',
    excerpt: '当前 MCP 工具名称与 API 路由映射关系。',
    content: `# 工具清单

## 命名规则

\`api_<path>_<method>\`，动态参数使用 \`_id_\` 表示。

## 已发布工具

- \`api_categories_get\`
- \`api_documents_get\`
- \`api_documents_post\`
- \`api_documents_id_get\`
- \`api_documents_id_put\`
- \`api_documents_id_patch\`
- \`api_documents_id_delete\`
- \`api_open_documents_get\`
- \`api_open_documents_post\`
- \`api_open_documents_id_get\`
- \`api_open_documents_id_put\`
- \`api_open_documents_id_delete\`
- \`api_admin_categories_get\`
- \`api_admin_categories_post\`
- \`api_admin_categories_id_put\`
- \`api_admin_categories_id_delete\`
- \`api_admin_users_get\`
- \`api_admin_users_post\`
- \`api_admin_users_id_put\`
- \`api_admin_users_id_delete\`
- \`api_admin_users_id_reset_keys_post\`
- \`api_user_open_api_key_get\`
- \`api_user_open_api_key_post\`
- \`api_auth_nextauth\`

## 接口覆盖说明

上述工具覆盖当前 \`app/api\` 全部路由。后续新增路由时，建议同步更新 MCP Server 与本章节。`,
  },
  {
    key: 'auth',
    parentKey: 'root',
    order: 40,
    title: '鉴权策略',
    slug: 'mcp-open-docs-auth',
    excerpt: '自动签名与会话 Cookie 两类鉴权模式说明。',
    content: `# 鉴权策略

## OpenAPI 自动签名

MCP Server 在调用 \`/api/open/*\` 时会自动注入：

- \`x-user-id\`
- \`x-timestamp\`
- \`x-sign\`

签名规则：

\`\`\`text
signContent = userId + timestamp + bodyHash
\`\`\`

其中：

- GET/DELETE 的 \`bodyHash\` 为空字符串
- POST/PUT/PATCH 的 \`bodyHash\` 是请求体 JSON 的 SHA256

## 会话 Cookie 透传

调用后台或用户接口时，MCP Server 会将 \`MCP_SESSION_COOKIE\` 原样透传到请求头。`,
  },
  {
    key: 'examples',
    parentKey: 'root',
    order: 50,
    title: '配置模板与首个调用',
    slug: 'mcp-open-docs-examples',
    excerpt: '直接可复制的配置模板与首个可用调用。',
    content: `# 配置模板与首个调用

## 最小可用模板（仅开放接口）

\`\`\`json
{
  "mcpServers": {
    "open-history": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://your-domain/api/mcp"],
      "env": {
        "MCP_OPEN_API_USER_ID": "your-user-id",
        "MCP_OPEN_API_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\\\\n...\\\\n-----END PRIVATE KEY-----"
      }
    }
  }
}
\`\`\`

## 管理能力模板（含后台接口）

\`\`\`json
{
  "mcpServers": {
    "open-history-admin": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://your-domain/api/mcp"],
      "env": {
        "MCP_OPEN_API_USER_ID": "your-user-id",
        "MCP_OPEN_API_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\\\\n...\\\\n-----END PRIVATE KEY-----",
        "MCP_SESSION_COOKIE": "next-auth.session-token=..."
      }
    }
  }
}
\`\`\`

## 首个验证调用

连接成功后执行：

- 工具：\`api_open_documents_get\`
- 参数：

\`\`\`json
{
  "page": 1,
  "pageSize": 10,
  "published": true
}
\`\`\`
`,
  },
  {
    key: 'troubleshooting',
    parentKey: 'root',
    order: 60,
    title: '排查与最佳实践',
    slug: 'mcp-open-docs-troubleshooting',
    excerpt: '高频错误定位方式与生产接入建议。',
    content: `# 排查与最佳实践

## 高频错误

| 状态码 | 常见原因 |
| --- | --- |
| \`401\` | Cookie 失效、OpenAPI 私钥错误、时间戳超时 |
| \`403\` | 角色权限不足（如非 SUPER_ADMIN 调用用户管理） |
| \`404\` | 资源 ID 不存在 |
| \`500\` | 服务端异常或数据库状态不一致 |

## 排查顺序

1. 检查客户端中的 MCP 地址是否指向正确环境（如 \`/api/mcp\`）
2. 检查 \`MCP_SESSION_COOKIE\` 是否过期
3. 检查 OpenAPI 的用户 ID 与私钥是否匹配
4. 检查请求参数中 ID 是否真实存在

## 生产建议

- 为 MCP 访问创建独立 API 用户
- 分环境隔离私钥（开发/测试/生产）
- 对关键工具调用保留审计日志
- 对写操作增加幂等约束与回滚预案`,
  },
]

async function main() {
  const author =
    (await prisma.user.findFirst({
      where: {
        role: {
          in: ['SUPER_ADMIN', 'ADMIN'],
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
      },
    })) || null

  if (!author) {
    throw new Error('No admin user found to publish MCP docs')
  }

  const category = await prisma.category.upsert({
    where: { name: CATEGORY_NAME },
    update: {
      description: '面向大模型与智能体的 MCP 接入说明、工具清单与鉴权文档。',
    },
    create: {
      name: CATEGORY_NAME,
      description: '面向大模型与智能体的 MCP 接入说明、工具清单与鉴权文档。',
    },
  })

  const idByKey = {}

  for (const doc of documents) {
    const saved = await prisma.document.upsert({
      where: { slug: doc.slug },
      update: {
        title: doc.title,
        excerpt: doc.excerpt,
        content: doc.content,
        order: doc.order,
        published: true,
        authorId: author.id,
        categoryId: category.id,
      },
      create: {
        title: doc.title,
        slug: doc.slug,
        excerpt: doc.excerpt,
        content: doc.content,
        order: doc.order,
        published: true,
        authorId: author.id,
        categoryId: category.id,
      },
      select: { id: true },
    })

    idByKey[doc.key] = saved.id
  }

  for (const doc of documents) {
    await prisma.document.update({
      where: { id: idByKey[doc.key] },
      data: {
        parentId: doc.parentKey ? idByKey[doc.parentKey] : null,
        order: doc.order,
        categoryId: category.id,
        published: true,
      },
    })
  }

  console.log(
    JSON.stringify(
      {
        category: {
          id: category.id,
          name: category.name,
        },
        documents: documents.map((doc) => ({
          title: doc.title,
          slug: doc.slug,
          parentKey: doc.parentKey || null,
        })),
      },
      null,
      2
    )
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
