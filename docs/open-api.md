# 开放API文档

## 概述

本文档描述了文档管理平台的开放API接口，支持通过RSA非对称加密签名验证的方式进行API调用。

## 鉴权方式

### 签名机制

所有开放API请求都需要进行签名验证，签名流程如下：

1. **生成签名内容**：`signContent = appId + timestamp + bodyHash`
   - `appId`: 应用ID
   - `timestamp`: 当前时间戳（毫秒）
   - `bodyHash`: 请求体的SHA256哈希值（GET/DELETE请求为空字符串）

2. **生成签名**：使用RSA私钥对签名内容进行签名
   ```
   sign = RSA私钥签名(signContent)
   ```

3. **传递签名信息**：通过HTTP头或查询参数传递
   - HTTP头方式（推荐）：
     - `x-app-id`: 应用ID
     - `x-timestamp`: 时间戳
     - `x-sign`: 签名
   - 查询参数方式：
     - `?appId=xxx&timestamp=xxx&sign=xxx`

### 时间戳验证

- 请求时间戳与服务器时间的误差不能超过5分钟
- 防止重放攻击

## API接口列表

### 1. 文档管理

#### 获取文档列表

```
GET /api/open/documents
```

**查询参数：**
- `page` (可选): 页码，默认1
- `pageSize` (可选): 每页数量，默认20
- `published` (可选): 是否已发布，true/false

**响应示例：**
```json
{
  "data": [
    {
      "id": "doc-uuid",
      "title": "文档标题",
      "slug": "doc-slug",
      "content": "文档内容",
      "excerpt": "摘要",
      "published": true,
      "viewCount": 100,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "category": {
        "id": "cat-uuid",
        "name": "分类名称"
      },
      "author": {
        "id": "user-uuid",
        "name": "作者名称",
        "email": "author@example.com"
      },
      "children": []
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### 获取单个文档详情

```
GET /api/open/documents/:id
```

**路径参数：**
- `id`: 文档ID

**响应示例：**
```json
{
  "id": "doc-uuid",
  "title": "文档标题",
  "slug": "doc-slug",
  "content": "文档内容",
  "excerpt": "摘要",
  "published": true,
  "viewCount": 101,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "category": {
    "id": "cat-uuid",
    "name": "分类名称",
    "description": "分类描述"
  },
  "author": {
    "id": "user-uuid",
    "name": "作者名称",
    "email": "author@example.com"
  },
  "parent": null,
  "children": []
}
```

#### 创建文档

```
POST /api/open/documents
```

**请求体：**
```json
{
  "title": "文档标题",
  "slug": "doc-slug",
  "content": "文档内容",
  "excerpt": "摘要",
  "published": false,
  "parentId": null,
  "categoryId": "cat-uuid",
  "authorId": "user-uuid"
}
```

**必需字段：**
- `title`: 文档标题
- `authorId`: 作者ID（必须是系统中存在的用户）

**可选字段：**
- `slug`: URL别名（不提供则自动生成）
- `content`: 文档内容
- `excerpt`: 摘要
- `published`: 是否发布
- `parentId`: 父文档ID
- `categoryId`: 分类ID

**响应示例：**
```json
{
  "id": "new-doc-uuid",
  "title": "文档标题",
  "slug": "doc-slug",
  "content": "文档内容",
  "excerpt": "摘要",
  "published": false,
  "viewCount": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "category": null,
  "author": {
    "id": "user-uuid",
    "name": "作者名称",
    "email": "author@example.com"
  }
}
```

#### 更新文档

```
PUT /api/open/documents/:id
```

**路径参数：**
- `id`: 文档ID

**请求体：**
```json
{
  "title": "更新后的标题",
  "content": "更新后的内容",
  "published": true
}
```

**可更新字段：**
- `title`: 文档标题
- `slug`: URL别名
- `content`: 文档内容
- `excerpt`: 摘要
- `published`: 是否发布
- `parentId`: 父文档ID
- `categoryId`: 分类ID

**响应示例：**
```json
{
  "id": "doc-uuid",
  "title": "更新后的标题",
  "slug": "doc-slug",
  "content": "更新后的内容",
  "excerpt": "摘要",
  "published": true,
  "viewCount": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T01:00:00.000Z",
  "category": null,
  "author": {
    "id": "user-uuid",
    "name": "作者名称",
    "email": "author@example.com"
  }
}
```

#### 删除文档

```
DELETE /api/open/documents/:id
```

**路径参数：**
- `id`: 文档ID

**响应示例：**
```json
{
  "message": "Document deleted successfully"
}
```

### 2. API Key管理

#### 获取API Key列表

```
GET /api/api-keys
```

需要登录认证（NextAuth session）。

**响应示例：**
```json
[
  {
    "id": "key-uuid",
    "appId": "app_xxxxxxxxxxxxx",
    "appName": "我的应用",
    "isActive": true,
    "rateLimit": 100,
    "lastUsedAt": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": null,
    "publicKey": "-----BEGIN PUBLIC KEY-----\n..."
  }
]
```

#### 创建API Key

```
POST /api/api-keys
```

需要登录认证（NextAuth session）。

**请求体：**
```json
{
  "appName": "我的应用",
  "rateLimit": 100,
  "expiresAt": "2025-01-01T00:00:00.000Z"
}
```

**响应示例：**
```json
{
  "id": "key-uuid",
  "appId": "app_xxxxxxxxxxxxx",
  "appName": "我的应用",
  "isActive": true,
  "rateLimit": 100,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "expiresAt": "2025-01-01T00:00:00.000Z",
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n..."
}
```

**重要提示：** 私钥仅在创建时返回一次，请妥善保存！

#### 更新API Key

```
PUT /api/api-keys/:id
```

需要登录认证（NextAuth session）。

**请求体：**
```json
{
  "appName": "更新后的应用名",
  "isActive": false,
  "rateLimit": 200
}
```

#### 删除API Key

```
DELETE /api/api-keys/:id
```

需要登录认证（NextAuth session）。

## 错误响应

所有API在发生错误时返回统一的错误格式：

```json
{
  "error": "错误描述信息"
}
```

**常见错误码：**
- `400`: 请求参数错误
- `401`: 认证失败（签名无效、appId无效等）
- `403`: 权限不足（API Key已禁用或过期）
- `404`: 资源不存在
- `500`: 服务器内部错误

## 调用示例

### Node.js示例

参考 [examples/open-api-client.ts](../examples/open-api-client.ts) 文件。

### cURL示例

```bash
# 生成签名（需要使用脚本）
# 这里假设你已经有了签名信息

# 获取文档列表
curl -X GET "http://localhost:3000/api/open/documents?page=1&pageSize=10" \
  -H "Content-Type: application/json" \
  -H "x-app-id: your-app-id" \
  -H "x-timestamp: 1234567890000" \
  -H "x-sign: your-signature"

# 创建文档
curl -X POST "http://localhost:3000/api/open/documents" \
  -H "Content-Type: application/json" \
  -H "x-app-id: your-app-id" \
  -H "x-timestamp: 1234567890000" \
  -H "x-sign: your-signature" \
  -d '{
    "title": "测试文档",
    "content": "这是测试内容",
    "authorId": "user-uuid"
  }'
```

## 安全建议

1. **私钥保护**：私钥仅在创建API Key时返回一次，请妥善保存，不要泄露
2. **HTTPS**：生产环境务必使用HTTPS协议
3. **时间同步**：确保客户端和服务器时间同步
4. **签名唯一性**：每次请求使用不同的时间戳，避免签名重用
5. **权限最小化**：根据实际需求设置API Key的权限和过期时间

## 速率限制

- 默认每个API Key每分钟最多100次请求
- 可在创建或更新API Key时自定义速率限制
- 超过限制将返回429错误

## 最佳实践

1. **缓存公钥**：客户端可以缓存公钥，避免每次请求都传输
2. **错误处理**：妥善处理API错误，实现重试机制
3. **日志记录**：记录API调用日志，便于排查问题
4. **监控告警**：监控API调用频率和错误率

## 技术支持

如有问题，请联系技术支持或查看项目文档。
