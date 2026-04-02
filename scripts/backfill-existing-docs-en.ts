import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categoryTranslations = [
  {
    name: '开放接口文档',
    nameEn: 'Open API Docs',
    descriptionEn:
      'Public API usage guide, authentication rules, and endpoint reference for the documentation platform.',
  },
  {
    name: 'MCP 开放文档',
    nameEn: 'MCP Docs',
    descriptionEn:
      'MCP access guide, tool reference, and authentication notes for IDE and agent clients.',
  },
]

const documentTranslations = {
  'open-api-docs': {
    titleEn: 'Open API Docs',
    excerptEn:
      'Usage guide, authentication flow, and endpoint reference for the platform public API.',
    contentEn: `# Open API Docs

This guide is for developers who want to integrate with the platform programmatically. It covers the current public API surface, signing rules, field constraints, error handling, and practical request examples.

## What you can do with the API

- Read document lists
- Read a single document
- Create a document
- Update a document
- Delete a document

## Current public scope

The current public API focuses on document resources under the base path below:

\`\`\`text
/api/open/documents
\`\`\`

## Recommended reading order

1. Start with "Quick Start" to prepare credentials and complete the first signed request.
2. Then read "Signature Authentication" to confirm the signing string, timestamp, and body hash rules.
3. Finally, read the endpoint-specific chapters you need.

## Important constraints

- Every public API request requires RSA signature authentication.
- The document detail endpoint uses document \`id\`, not \`slug\`.
- Child documents inherit the top-level category and cannot define their own category independently.
- If the category of a top-level document changes, the entire subtree is updated together.`,
  },
  'open-api-quick-start': {
    titleEn: 'Quick Start',
    excerptEn:
      'Finish the first Open API call in five minutes: prepare credentials, sign the request, and send it.',
    contentEn: `# Quick Start

This chapter helps you complete a working Open API request as quickly as possible.

## Step 1: Prepare credentials

1. Sign in to the platform.
2. Open the "My OpenAPI Private Key" page.
3. Copy the following values:
   - The current user \`id\`
   - The matching \`OpenAPI private key\`

Notes:

- The server stores the paired public key for verification.
- The private key should only live on the server side or in another secure environment.
- After a key reset, the old private key becomes invalid immediately.

## Step 2: Prepare the base URL

Local development usually uses:

\`\`\`text
http://localhost:3000/api/open
\`\`\`

Replace it with your production domain in a deployed environment.

## Step 3: Build the signing headers

Every request must include these headers:

- \`x-user-id\`
- \`x-timestamp\`
- \`x-sign\`

Use headers consistently instead of mixing headers and query parameters.

## Step 4: Send a read request

\`\`\`bash
curl --request GET \\
  --url 'http://localhost:3000/api/open/documents?page=1&pageSize=10&published=true' \\
  --header 'x-user-id: your-user-id' \\
  --header 'x-timestamp: 1743400000000' \\
  --header 'x-sign: your-signature'
\`\`\`

## Step 5: Verify the response

A successful response contains:

- \`data\`: document list
- \`pagination\`: pagination metadata

## Common failure causes

- Missing signing headers
- The private key does not match the user ID
- The timestamp differs from server time by more than five minutes
- The signed request body does not match the body actually sent`,
  },
  'open-api-authentication': {
    titleEn: 'Signature Authentication',
    excerptEn:
      'The public API uses RSA-SHA256 signatures. This chapter explains the signing string and validation rules.',
    contentEn: `# Signature Authentication

All public API requests must pass signature verification.

## Signing algorithm

- Algorithm: \`RSA-SHA256\`
- Verification: the server verifies the signature with the user's public key

## Signing string format

\`\`\`text
signContent = userId + timestamp + bodyHash
\`\`\`

Field definitions:

- \`userId\`: current caller user ID
- \`timestamp\`: millisecond timestamp string
- \`bodyHash\`: SHA256 hex digest of the JSON request body

## bodyHash rules

- \`GET\` and \`DELETE\`: empty string
- \`POST\` and \`PUT\`: SHA256 of the JSON request body

Notes:

- Always hash the exact JSON string that will be sent.
- Changing field order changes the hash result.

## Parameter transport

Recommended headers:

\`\`\`text
x-user-id
x-timestamp
x-sign
\`\`\`

Query parameters are also supported:

\`\`\`text
?userId=...&timestamp=...&sign=...
\`\`\`

## Timestamp validation

The request time must be within five minutes of server time. Expired requests are rejected with \`401\`.

## Node.js example

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
\`\`\``,
  },
  'open-api-reference-overview': {
    titleEn: 'API Overview',
    excerptEn:
      'Current public endpoints, supported methods, main use cases, and common status code conventions.',
    contentEn: `# API Overview

## Base path

\`\`\`text
/api/open/documents
\`\`\`

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | \`/api/open/documents\` | Get the document list |
| GET | \`/api/open/documents/:id\` | Get document details |
| POST | \`/api/open/documents\` | Create a document |
| PUT | \`/api/open/documents/:id\` | Update a document |
| DELETE | \`/api/open/documents/:id\` | Delete a document |

## Resource model

Core document fields include:

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

## Category and hierarchy rules

- Top-level documents can define a category directly.
- Child documents inherit the category from the top-level document.
- When a child document is created, an incoming \`categoryId\` is ignored.
- When a document is moved under another parent, its category follows the new top-level branch.
- Changing a top-level category recursively updates the entire subtree.

## Common status codes

| Status | Meaning |
| --- | --- |
| 200 | Success |
| 201 | Created |
| 400 | Invalid parameters |
| 401 | Authentication failed |
| 404 | Resource not found |
| 500 | Server error |`,
  },
  'open-api-list-documents': {
    titleEn: 'List Documents',
    excerptEn: 'Query the document list with pagination and optional publish-state filtering.',
    contentEn: `# List Documents

## Endpoint

\`\`\`http
GET /api/open/documents
\`\`\`

## Query parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| \`page\` | number | No | Page number, default is \`1\` |
| \`pageSize\` | number | No | Page size, default is \`20\` |
| \`published\` | boolean | No | Filter by publish status |

## Response structure

The response returns:

- \`data\`: current page items
- \`pagination.page\`
- \`pagination.pageSize\`
- \`pagination.total\`
- \`pagination.totalPages\`

## Notes

- Results are sorted primarily by \`order\`.
- Child documents may be returned in the \`children\` field.
- Authentication still uses the standard RSA signature flow.`,
  },
  'open-api-get-document': {
    titleEn: 'Get Document Details',
    excerptEn:
      'Read a single document by document ID. The response includes hierarchy and category information.',
    contentEn: `# Get Document Details

## Endpoint

\`\`\`http
GET /api/open/documents/:id
\`\`\`

## Path parameter

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| \`id\` | string | Yes | Document ID |

## Response highlights

The response includes:

- Basic document fields
- Category information
- Author information
- Parent document information
- Child document information

## Notes

- This endpoint only supports document \`id\`, not \`slug\`.
- A successful read increments the view count on the server side.
- If the document does not exist, the API returns \`404\`.`,
  },
  'open-api-create-document': {
    titleEn: 'Create Document',
    excerptEn:
      'Create a top-level or child document. Child documents inherit the category from the top-level node.',
    contentEn: `# Create Document

## Endpoint

\`\`\`http
POST /api/open/documents
\`\`\`

## Request body

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| \`title\` | string | Yes | Document title |
| \`slug\` | string | No | URL slug |
| \`content\` | string | No | Markdown content |
| \`excerpt\` | string | No | Document summary |
| \`order\` | number | No | Sort order |
| \`published\` | boolean | No | Publish state |
| \`parentId\` | string | No | Parent document ID |
| \`categoryId\` | string | Yes for top-level docs | Category ID |
| \`authorId\` | string | Yes | Author user ID |

## Behavior rules

- Top-level documents must provide \`categoryId\`.
- Child documents inherit the top-level category automatically.
- If \`slug\` is omitted, the server generates one from the title.

## Recommended validation

- Make sure the author exists before calling the API.
- Use a stable slug strategy in production.
- Keep \`order\` small for documents that should appear earlier.`,
  },
  'open-api-update-document': {
    titleEn: 'Update Document',
    excerptEn:
      'Update document content, parent relation, and category. Top-level category changes propagate to the subtree.',
    contentEn: `# Update Document

## Endpoint

\`\`\`http
PUT /api/open/documents/:id
\`\`\`

## Updatable fields

- \`title\`
- \`slug\`
- \`content\`
- \`excerpt\`
- \`order\`
- \`published\`
- \`parentId\`
- \`categoryId\` for top-level documents

## Important rules

- A document cannot become its own parent.
- A document cannot be moved under its own descendant.
- If the document becomes a child node, its category follows the new top-level branch.
- If the category of a top-level document changes, the subtree category is synchronized recursively.

## Recommendations

- Treat hierarchy changes as a structural operation and validate them carefully.
- If you expose this capability externally, record audit logs for parent/category changes.`,
  },
  'open-api-delete-document': {
    titleEn: 'Delete Document',
    excerptEn:
      'Delete a document by ID. Confirm hierarchy and downstream impact before deleting.',
    contentEn: `# Delete Document

## Endpoint

\`\`\`http
DELETE /api/open/documents/:id
\`\`\`

## Notes

- Deletion is based on document \`id\`.
- Make sure the target resource exists before deletion.
- Review parent-child relationships and downstream usage before you remove the document.

## Recommended checks

- Whether child documents are still needed
- Whether external links still depend on the document
- Whether audit or backup retention is required in your environment`,
  },
  'open-api-errors-and-best-practices': {
    titleEn: 'Errors and Best Practices',
    excerptEn:
      'Common status codes, troubleshooting guidance, and recommended integration practices.',
    contentEn: `# Errors and Best Practices

## Common error codes

- \`400\`: invalid parameters
- \`401\`: missing or invalid authentication
- \`404\`: resource not found
- \`500\`: server-side failure

## Troubleshooting checklist

1. Verify that the signing parameters are complete.
2. Verify that the private key matches the current user.
3. Verify that the timestamp is within the allowed time window.
4. Verify that JSON body hashing uses the exact payload sent.
5. Verify that referenced IDs actually exist.

## Integration recommendations

- Keep private keys only on the server side.
- Add timeout, retry, and structured logging around API requests.
- Record request body digests for \`POST\` and \`PUT\` to simplify signature debugging.
- Centralize signing logic in production instead of implementing it in multiple services.`,
  },
  'mcp-open-docs': {
    titleEn: 'MCP Docs',
    excerptEn:
      'MCP integration guide for IDE and agent clients, with ready-to-use commands and JSON configuration.',
    contentEn: `# MCP Docs

This document explains how IDE and agent clients can connect to the platform through MCP (Model Context Protocol) over HTTP and call the platform APIs directly.

## Capability scope

The current MCP server wraps the full set of API routes exposed by the platform:

- Document APIs
- Public OpenAPI endpoints with RSA signing
- Admin category and user management APIs
- Current-user OpenAPI private key API
- NextAuth passthrough APIs

## MCP endpoint

Production MCP endpoint:

\`\`\`text
https://your-domain/api/mcp
\`\`\`

Local development endpoint:

\`\`\`text
http://localhost:3000/api/mcp
\`\`\`

Clients only need the endpoint URL and the required credentials. No separate MCP deployment is needed.

## Expected outcome

After setup, an LLM client can call MCP tools to create documents, query documents, manage categories, and manage users through the platform.`,
  },
  'mcp-open-docs-quick-start': {
    titleEn: 'Quick Start',
    excerptEn: 'Complete the setup in three steps: endpoint, config, and first verification call.',
    contentEn: `# Quick Start

## Step 1: Configure the MCP endpoint

Add an HTTP MCP server in your MCP client and point it to:

\`\`\`text
https://your-domain/api/mcp
\`\`\`

For local development:

\`\`\`text
http://localhost:3000/api/mcp
\`\`\`

## Step 2: Add client configuration

A common configuration looks like this:

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

Notes:

- For public OpenAPI tools only, \`MCP_OPEN_API_USER_ID\` and \`MCP_OPEN_API_PRIVATE_KEY\` are enough.
- Admin APIs also require \`MCP_SESSION_COOKIE\`.

## Step 3: Verify the connection

Call \`api_open_documents_get\` first to verify that the full chain is working.`,
  },
  'mcp-open-docs-runtime-config': {
    titleEn: 'IDE Configuration',
    excerptEn:
      'Configuration formats and commands for Cursor, VS Code, Claude Desktop, Cline, and Windsurf.',
    contentEn: `# IDE Configuration

## Cursor / VS Code / Claude Desktop

\`\`\`bash
npx -y mcp-remote@latest https://your-domain/api/mcp
\`\`\`

In the MCP configuration for each IDE, use the MCP URL above and add the required environment variables.

## Cline / Windsurf

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

## Required environment variables

- \`MCP_OPEN_API_USER_ID\`
- \`MCP_OPEN_API_PRIVATE_KEY\` or \`MCP_OPEN_API_PRIVATE_KEY_FILE\`
- \`MCP_SESSION_COOKIE\` for admin APIs

## Usage notes

- \`/api/open/*\` uses automatic request signing.
- \`/api/documents*\`, \`/api/admin/*\`, \`/api/user/*\`, and \`/api/auth/*\` rely on session cookie forwarding.

## Security suggestions

- Keep private keys on the server side only.
- Rotate keys immediately if they leak.
- Prefer a dedicated API user in production instead of reusing the primary admin account.`,
  },
  'mcp-open-docs-tool-list': {
    titleEn: 'Tool List',
    excerptEn: 'Current MCP tool names and the API routes they map to.',
    contentEn: `# Tool List

## Naming rule

Tools follow this pattern:

\`\`\`text
api_<path>_<method>
\`\`\`

Dynamic path segments are represented as \`_id_\`.

## Published tools

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

## Coverage note

These tools cover the current \`app/api\` routes. When new routes are added later, update the MCP server and this document together.`,
  },
  'mcp-open-docs-auth': {
    titleEn: 'Authentication Strategy',
    excerptEn: 'How automatic signing and session-cookie forwarding work in MCP.',
    contentEn: `# Authentication Strategy

## Automatic OpenAPI signing

When MCP tools call \`/api/open/*\`, the server automatically injects:

- \`x-user-id\`
- \`x-timestamp\`
- \`x-sign\`

Signing rule:

\`\`\`text
signContent = userId + timestamp + bodyHash
\`\`\`

Where:

- For GET and DELETE, \`bodyHash\` is an empty string
- For POST, PUT, and PATCH, \`bodyHash\` is the SHA256 hash of the JSON body

## Session cookie forwarding

For admin and user APIs, the MCP server forwards \`MCP_SESSION_COOKIE\` to the upstream API as-is.`,
  },
  'mcp-open-docs-examples': {
    titleEn: 'Templates and First Call',
    excerptEn: 'Copy-ready configuration templates and the first recommended MCP call.',
    contentEn: `# Templates and First Call

## Minimal template for public APIs only

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

## Template with admin capabilities

Add \`MCP_SESSION_COOKIE\` when you need admin or current-user APIs.

## Recommended first call

Start with:

\`\`\`text
api_open_documents_get
\`\`\`

If that call succeeds, endpoint connectivity, signing, and request forwarding are all working.`,
  },
  'mcp-open-docs-troubleshooting': {
    titleEn: 'Troubleshooting and Best Practices',
    excerptEn: 'High-frequency failure checks and production guidance for MCP integrations.',
    contentEn: `# Troubleshooting and Best Practices

## Common status codes

- \`401\`: expired cookie, wrong OpenAPI private key, or expired timestamp
- \`403\`: insufficient role permissions
- \`404\`: target resource ID does not exist
- \`500\`: server failure or inconsistent database state

## Recommended troubleshooting order

1. Verify that the MCP endpoint points to the correct environment.
2. Verify that \`MCP_SESSION_COOKIE\` is still valid.
3. Verify that the OpenAPI user ID matches the private key.
4. Verify that all referenced IDs exist.

## Production guidance

- Create a dedicated API user for MCP access.
- Isolate keys by environment such as development, staging, and production.
- Keep audit logs for important tool calls.
- Add idempotency and rollback planning for write operations.`,
  },
} as const

async function main() {
  let categoryUpdated = 0
  let documentUpdated = 0

  for (const category of categoryTranslations) {
    const result = await prisma.category.updateMany({
      where: { name: category.name },
      data: {
        nameEn: category.nameEn,
        descriptionEn: category.descriptionEn,
      },
    })
    categoryUpdated += result.count
  }

  for (const [slug, translation] of Object.entries(documentTranslations)) {
    const result = await prisma.document.updateMany({
      where: { slug },
      data: {
        titleEn: translation.titleEn,
        excerptEn: translation.excerptEn,
        contentEn: translation.contentEn,
      },
    })
    documentUpdated += result.count
  }

  console.log(
    JSON.stringify(
      {
        categoryUpdated,
        documentUpdated,
        translatedSlugs: Object.keys(documentTranslations).length,
      },
      null,
      2
    )
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

