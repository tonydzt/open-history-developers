# 开放 API 文档

## 概述

开放 API 使用 RSA 签名鉴权，凭证以用户维度管理。  
密钥在后台 `用户管理` 页面维护，不再提供独立的 `API Key` 管理接口。

## 获取鉴权凭证

1. 进入后台 `用户管理`。
2. 在用户列表中获取：
   - 用户 `id`
   - `OpenAPI 私钥`（`openApiPrivateKey`）
3. 服务端保存对应公钥（`openApiPublicKey`）用于验签。
4. 如需轮换，点击“重置公私钥”。

## 鉴权方式

### 签名内容

```text
signContent = userId + timestamp + bodyHash
```

- `userId`: 用户 ID
- `timestamp`: 毫秒时间戳
- `bodyHash`: 请求体 JSON 的 SHA256；GET/DELETE 为空字符串

### 签名

```text
sign = RSA-SHA256(privateKey, signContent)
```

### 传参方式

- Header（推荐）
  - `x-user-id`
  - `x-timestamp`
  - `x-sign`
- 或 Query
  - `?userId=xxx&timestamp=xxx&sign=xxx`

### 时间戳校验

- 请求时间与服务端误差必须在 5 分钟内。

## API 列表

### 获取文档列表

```http
GET /api/open/documents
```

查询参数：
- `page` 可选，默认 `1`
- `pageSize` 可选，默认 `20`
- `published` 可选，`true/false`

### 获取文档详情

```http
GET /api/open/documents/:id
```

### 创建文档

```http
POST /api/open/documents
```

请求体示例：

```json
{
  "title": "文档标题",
  "slug": "doc-slug",
  "content": "文档内容",
  "excerpt": "摘要",
  "order": 10,
  "published": false,
  "parentId": null,
  "categoryId": "cat-uuid",
  "authorId": "user-uuid"
}
```

说明：顶级文档的 `categoryId` 为必填字段，`order` 越小越靠前。

### 更新文档

```http
PUT /api/open/documents/:id
```

说明：顶级文档更新时可传 `categoryId` 和 `order`；子文档会继承顶级文档分类。

### 删除文档

```http
DELETE /api/open/documents/:id
```

## 错误码

- `401`: 鉴权失败（参数缺失、userId 无效、签名无效）
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务端错误

## 示例

参考 [examples/open-api-client.ts](../examples/open-api-client.ts)。
