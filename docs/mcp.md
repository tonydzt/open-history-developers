# MCP 接入说明

本项目提供两种 MCP 接入方式：

- 在线 HTTP 端点：`/api/mcp`
- 本地 `stdio` 入口：`mcp/server.ts`

两者共用同一套 MCP tools 定义。

## 已封装接口

- `GET /api/categories`
- `GET /api/documents`
- `POST /api/documents`
- `GET /api/documents/:id`
- `PUT /api/documents/:id`
- `PATCH /api/documents/:id`
- `DELETE /api/documents/:id`
- `GET /api/open/documents`
- `POST /api/open/documents`
- `GET /api/open/documents/:id`
- `PUT /api/open/documents/:id`
- `DELETE /api/open/documents/:id`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `POST /api/admin/users/:id/reset-keys`
- `GET /api/user/open-api-key`
- `POST /api/user/open-api-key`
- `GET/POST /api/auth/*`（通过 `api_auth_nextauth` 透传）

## 在线部署

部署到 Next.js 环境后，MCP HTTP 端点为：

```text
https://your-domain/api/mcp
```

客户端以 JSON-RPC 方式向该端点发送 `initialize`、`tools/list`、`tools/call` 请求。

## 本地调试

```bash
npm run mcp:start
```

## 环境变量

- `MCP_API_BASE_URL`: API 服务地址，默认 `http://localhost:3000`
- `MCP_SESSION_COOKIE`: 会话 Cookie（用于 `/api/documents`、`/api/admin/*`、`/api/user/*`）
- `MCP_OPEN_API_USER_ID`: OpenAPI 用户 ID（用于 `/api/open/*`）
- `MCP_OPEN_API_PRIVATE_KEY`: OpenAPI 私钥（支持 `\\n`）
- `MCP_OPEN_API_PRIVATE_KEY_FILE`: OpenAPI 私钥文件路径（与上面二选一）

## 鉴权策略

- OpenAPI 工具会自动计算 `x-user-id/x-timestamp/x-sign`。
- 后台接口和用户接口通过 `MCP_SESSION_COOKIE` 转发 Cookie。

## 工具命名

MCP tools 名称和路由一一对应，规则如下：

- `api_<path>_<method>`
- 动态路径参数用 `_id_` 形式表示

示例：

- `api_open_documents_get`
- `api_open_documents_id_put`
- `api_admin_users_id_reset_keys_post`
