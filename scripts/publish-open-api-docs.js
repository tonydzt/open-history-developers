const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const CATEGORY_NAME = '开放接口文档'

const documents = [
  {
    key: 'root',
    order: 0,
    title: '开放接口文档',
    slug: 'open-api-docs',
    excerpt: '文档平台对外开放 API 的使用说明、鉴权方式与完整接口参考。',
    content: `# 开放接口文档

本文档面向需要通过程序接入本平台的开发者，覆盖当前所有对外开放 API 的使用方式、鉴权规则、字段约束、错误处理和调用示例。

## 你可以用这套接口做什么

- 读取文档列表
- 读取单篇文档详情
- 创建文档
- 更新文档
- 删除文档

## 当前开放范围

当前对外开放能力集中在文档资源，基础路径为：

\`\`\`text
/api/open/documents
\`\`\`

## 阅读顺序建议

1. 先看“快速开始”，完成凭证准备和首次签名调用
2. 再看“签名鉴权”，确认签名串、时间戳和请求体哈希算法
3. 最后按需阅读对应接口章节

## 重要约束

- 所有开放接口都要求 RSA 签名鉴权
- 文档详情接口使用文档 \`id\` 查询，不支持 \`slug\`
- 子文档分类继承顶级文档，不能单独指定分类
- 修改顶级文档分类后，整棵子树会同步切换分类
`,
  },
  {
    key: 'quick-start',
    parentKey: 'root',
    order: 10,
    title: '快速开始',
    slug: 'open-api-quick-start',
    excerpt: '5 分钟完成开放接口接入：准备凭证、签名请求、发起第一个调用。',
    content: `# 快速开始

本章帮助你快速完成一次可用的开放 API 调用。

## 第一步：准备凭证

1. 登录平台
2. 打开“我的 OpenAPI 私钥”页面
3. 复制以下信息：
   - 当前登录用户的 \`id\`
   - 对应的 \`OpenAPI 私钥\`

说明：

- 服务端保存的是配套公钥，用于验签
- 私钥只应存放在服务端或安全环境中
- 重置私钥后，旧私钥会立即失效

## 第二步：准备基础地址

本地环境通常为：

\`\`\`text
http://localhost:3000/api/open
\`\`\`

生产环境请替换成你的正式域名。

## 第三步：生成签名请求头

每次请求都要携带以下 Header：

- \`x-user-id\`
- \`x-timestamp\`
- \`x-sign\`

推荐始终使用 Header 传参，不要混用 Query。

## 第四步：发起一个读取请求

\`\`\`bash
curl --request GET \\
  --url 'http://localhost:3000/api/open/documents?page=1&pageSize=10&published=true' \\
  --header 'x-user-id: your-user-id' \\
  --header 'x-timestamp: 1743400000000' \\
  --header 'x-sign: your-signature'
\`\`\`

## 第五步：核对返回结果

成功时会返回：

- \`data\`: 文档列表
- \`pagination\`: 分页信息

## 常见失败原因

- 没有传签名参数
- 私钥和用户 ID 不匹配
- 时间戳与服务端相差超过 5 分钟
- POST/PUT 的签名体和实际请求体不一致
`,
  },
  {
    key: 'auth',
    parentKey: 'root',
    order: 20,
    title: '签名鉴权',
    slug: 'open-api-authentication',
    excerpt: '开放接口使用 RSA-SHA256 签名鉴权，本章说明签名串和验签规则。',
    content: `# 签名鉴权

所有开放 API 都必须通过签名验证。

## 签名算法

- 算法：\`RSA-SHA256\`
- 验证方式：服务端使用用户公钥验签

## 签名串格式

\`\`\`text
signContent = userId + timestamp + bodyHash
\`\`\`

字段说明：

- \`userId\`: 当前调用方的用户 ID
- \`timestamp\`: 毫秒时间戳字符串
- \`bodyHash\`: 请求体 JSON 字符串的 SHA256 十六进制摘要

## bodyHash 规则

- \`GET\`、\`DELETE\`：空字符串
- \`POST\`、\`PUT\`：对请求 JSON 做 SHA256

注意：

- 必须对实际发出的 JSON 字符串计算摘要
- 字段顺序变化会影响哈希结果

## 传参方式

推荐放在请求头：

\`\`\`text
x-user-id
x-timestamp
x-sign
\`\`\`

也支持 Query 参数：

\`\`\`text
?userId=...&timestamp=...&sign=...
\`\`\`

## 时间戳校验

请求时间与服务端时间误差必须在 5 分钟内。

超时会被直接拒绝，返回 \`401\`。

## Node.js 示例

\`\`\`ts
import crypto from 'crypto'

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex')
}

function buildHeaders(userId, privateKey, body) {
  const timestamp = Date.now().toString()
  const bodyHash = body ? sha256(JSON.stringify(body)) : ''
  const signContent = \`\${userId}\${timestamp}\${bodyHash}\`
  const sign = crypto.createSign('RSA-SHA256').update(signContent).end().sign(privateKey, 'base64')

  return {
    'Content-Type': 'application/json',
    'x-user-id': userId,
    'x-timestamp': timestamp,
    'x-sign': sign,
  }
}
\`\`\`
`,
  },
  {
    key: 'overview',
    parentKey: 'root',
    order: 30,
    title: '接口总览',
    slug: 'open-api-reference-overview',
    excerpt: '当前开放的全部接口、方法、用途与状态码约定。',
    content: `# 接口总览

## 基础路径

\`\`\`text
/api/open/documents
\`\`\`

## 接口列表

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | \`/api/open/documents\` | 获取文档列表 |
| GET | \`/api/open/documents/:id\` | 获取文档详情 |
| POST | \`/api/open/documents\` | 创建文档 |
| PUT | \`/api/open/documents/:id\` | 更新文档 |
| DELETE | \`/api/open/documents/:id\` | 删除文档 |

## 资源模型

文档核心字段包括：

- \`id\`
- \`title\`
- \`slug\`
- \`content\`
- \`excerpt\`
- \`published\`
- \`parentId\`
- \`categoryId\`
- \`order\`
- \`authorId\`
- \`createdAt\`
- \`updatedAt\`

## 分类与层级规则

- 顶级文档可以直接指定分类
- 子文档会继承顶级文档分类
- 创建子文档时，传入的 \`categoryId\` 会被忽略，以顶级文档分类为准
- 调整父文档后，文档分类会自动同步为新父链顶级文档分类
- 顶级文档变更分类后，所有子孙文档会递归同步

## 通用状态码

| 状态码 | 含义 |
| --- | --- |
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 参数错误 |
| 401 | 鉴权失败 |
| 404 | 资源不存在 |
| 500 | 服务端错误 |
`,
  },
  {
    key: 'list',
    parentKey: 'root',
    order: 40,
    title: '获取文档列表',
    slug: 'open-api-list-documents',
    excerpt: '分页查询文档列表，支持按发布状态过滤。',
    content: `# 获取文档列表

## 请求信息

- 方法：\`GET\`
- 路径：\`/api/open/documents\`

## Query 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| \`page\` | number | 否 | 页码，默认 \`1\` |
| \`pageSize\` | number | 否 | 每页条数，默认 \`20\` |
| \`published\` | boolean | 否 | 是否只返回指定发布状态 |

## 示例请求

\`\`\`http
GET /api/open/documents?page=1&pageSize=20&published=true
\`\`\`

## 成功响应

\`\`\`json
{
  "data": [
    {
      "id": "doc-id",
      "title": "开放接口文档",
      "slug": "open-api-docs",
      "published": true,
      "order": 10,
      "category": {
        "id": "category-id",
        "name": "开放接口文档"
      },
      "author": {
        "id": "user-id",
        "name": "Admin",
        "email": "admin@example.com"
      },
      "children": [
        {
          "id": "child-id",
          "title": "快速开始",
          "slug": "open-api-quick-start"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
\`\`\`
`,
  },
  {
    key: 'detail',
    parentKey: 'root',
    order: 50,
    title: '获取文档详情',
    slug: 'open-api-get-document',
    excerpt: '通过文档 ID 获取单篇文档详情，响应中包含父子关系和分类信息。',
    content: `# 获取文档详情

## 请求信息

- 方法：\`GET\`
- 路径：\`/api/open/documents/:id\`

## 路径参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| \`id\` | string | 是 | 文档主键 ID |

## 说明

- 此接口使用文档 \`id\`，不使用 \`slug\`
- 每次成功读取详情都会递增一次 \`viewCount\`

## 成功响应

\`\`\`json
{
  "id": "doc-id",
  "title": "开放接口文档",
  "slug": "open-api-docs",
  "content": "# 开放接口文档",
  "published": true,
  "category": {
    "id": "category-id",
    "name": "开放接口文档",
    "description": "平台对外接口说明"
  },
  "author": {
    "id": "user-id",
    "name": "Admin",
    "email": "admin@example.com"
  },
  "parent": null,
  "children": [
    {
      "id": "child-id",
      "title": "快速开始",
      "slug": "open-api-quick-start"
    }
  ]
}
\`\`\`
`,
  },
  {
    key: 'create',
    parentKey: 'root',
    order: 60,
    title: '创建文档',
    slug: 'open-api-create-document',
    excerpt: '创建顶级文档或子文档，子文档分类自动继承顶级文档。',
    content: `# 创建文档

## 请求信息

- 方法：\`POST\`
- 路径：\`/api/open/documents\`

## 请求体字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| \`title\` | string | 是 | 文档标题 |
| \`slug\` | string | 否 | 文档路径标识，不传则自动生成 |
| \`content\` | string | 否 | Markdown 内容 |
| \`excerpt\` | string | 否 | 文档摘要 |
| \`order\` | number | 否 | 排序值，越小越靠前，默认 \`0\` |
| \`published\` | boolean | 否 | 是否发布，默认 \`false\` |
| \`parentId\` | string \\| null | 否 | 父文档 ID |
| \`categoryId\` | string | 顶级文档必填 | 顶级文档分类 ID |
| \`authorId\` | string | 是 | 作者用户 ID |

## 分类规则

- 创建顶级文档时，必须传 \`categoryId\`
- 创建子文档时，会自动继承父链顶级文档分类
- 如果给子文档传了其他 \`categoryId\`，最终仍会被服务端改写成继承值

## 示例请求

\`\`\`json
{
  "title": "新增接入指南",
  "content": "# 新增接入指南",
  "published": true,
  "categoryId": "category-id",
  "authorId": "user-id"
}
\`\`\`

## 创建子文档示例

\`\`\`json
{
  "title": "创建文档示例",
  "parentId": "root-doc-id",
  "categoryId": "will-be-overwritten",
  "authorId": "user-id"
}
\`\`\`

## 成功响应

返回新建后的完整文档对象，状态码为 \`201\`。
`,
  },
  {
    key: 'update',
    parentKey: 'root',
    order: 70,
    title: '更新文档',
    slug: 'open-api-update-document',
    excerpt: '更新文档内容、父级和分类；顶级分类变更会递归同步整个子树。',
    content: `# 更新文档

## 请求信息

- 方法：\`PUT\`
- 路径：\`/api/open/documents/:id\`

## 可更新字段

- \`title\`
- \`slug\`
- \`content\`
- \`excerpt\`
- \`order\`
- \`published\`
- \`parentId\`
- \`categoryId\`

## 分类与父级联动规则

- 子文档不能独立决定分类
- 当文档被移动到新的父文档下时，会自动继承新父链顶级文档分类
- 当顶级文档修改 \`categoryId\` 后，所有子孙文档会递归同步
- 若把文档改成顶级文档，才允许直接指定 \`categoryId\`
- 不允许把文档挂到自己的子孙文档下

## 顶级文档改分类示例

\`\`\`json
{
  "categoryId": "new-category-id"
}
\`\`\`

## 修改父文档示例

\`\`\`json
{
  "parentId": "another-root-doc-id"
}
\`\`\`

## 成功响应

返回更新后的文档对象，子孙文档分类同步由服务端自动完成。
`,
  },
  {
    key: 'delete',
    parentKey: 'root',
    order: 80,
    title: '删除文档',
    slug: 'open-api-delete-document',
    excerpt: '删除指定文档，删除前应确认层级关系和业务影响。',
    content: `# 删除文档

## 请求信息

- 方法：\`DELETE\`
- 路径：\`/api/open/documents/:id\`

## 路径参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| \`id\` | string | 是 | 文档 ID |

## 成功响应

\`\`\`json
{
  "message": "Document deleted successfully"
}
\`\`\`

## 删除建议

- 删除前先确认是否存在子文档依赖
- 如果你的客户端维护了本地缓存，删除成功后应立即失效对应缓存
`,
  },
  {
    key: 'errors',
    parentKey: 'root',
    order: 90,
    title: '错误处理与最佳实践',
    slug: 'open-api-errors-and-best-practices',
    excerpt: '常见错误码、问题排查方法，以及推荐的接入实践。',
    content: `# 错误处理与最佳实践

## 常见错误码

| 状态码 | 场景 |
| --- | --- |
| \`400\` | 参数不合法，例如 \`authorId\`、\`categoryId\`、\`parentId\` 无效 |
| \`401\` | 缺少签名参数、签名无效、时间戳超时 |
| \`404\` | 文档不存在 |
| \`500\` | 服务端异常 |

## 排查顺序

1. 先检查 \`x-user-id\` 是否和私钥匹配
2. 检查 \`x-timestamp\` 是否为毫秒时间戳且在 5 分钟内
3. 检查请求体 JSON 是否与签名时完全一致
4. 检查文档 ID、父文档 ID、分类 ID、作者 ID 是否真实存在

## 接入建议

- 私钥只放在服务端，不要下发到浏览器
- 为请求增加超时、重试和结构化日志
- 对 \`POST\`、\`PUT\` 请求记录请求体摘要，方便排查签名问题
- 在生产环境中统一封装签名逻辑，避免各业务重复实现

## 参考代码

仓库中提供了完整调用示例：

\`\`\`text
examples/open-api-client.ts
\`\`\`
`,
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
    throw new Error('No admin user found to publish open API docs')
  }

  const category = await prisma.category.upsert({
    where: { name: CATEGORY_NAME },
    update: {
      description: '平台对外开放 API 的使用说明、鉴权规则与接口参考。',
    },
    create: {
      name: CATEGORY_NAME,
      description: '平台对外开放 API 的使用说明、鉴权规则与接口参考。',
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
