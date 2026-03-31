/**
 * 开放API调用示例
 * 
 * 本文件演示如何调用文档管理平台的开放API
 */

import crypto from 'crypto'

// ============ 配置信息 ============
const API_BASE_URL = 'http://localhost:3000/api/open'
const APP_ID = 'your-app-id' // 替换为你的appId
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
your-private-key-here
-----END PRIVATE KEY-----` // 替换为你的私钥

// ============ 签名工具函数 ============

/**
 * 生成请求体的hash值
 */
function generateBodyHash(body: any): string {
  if (!body || Object.keys(body).length === 0) {
    return ''
  }
  const bodyString = JSON.stringify(body)
  return crypto.createHash('sha256').update(bodyString).digest('hex')
}

/**
 * 生成签名内容
 */
function generateSignContent(appId: string, timestamp: string, bodyHash: string): string {
  return `${appId}${timestamp}${bodyHash}`
}

/**
 * 使用RSA私钥签名
 */
function signWithPrivateKey(privateKey: string, content: string): string {
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(content)
  sign.end()
  return sign.sign(privateKey, 'base64')
}

/**
 * 生成请求签名
 */
function generateSignature(appId: string, privateKey: string, body?: any): { timestamp: string; sign: string } {
  const timestamp = Date.now().toString()
  const bodyHash = generateBodyHash(body)
  const signContent = generateSignContent(appId, timestamp, bodyHash)
  const sign = signWithPrivateKey(privateKey, signContent)
  
  return { timestamp, sign }
}

/**
 * 构建请求头
 */
function buildHeaders(appId: string, privateKey: string, body?: any): Record<string, string> {
  const { timestamp, sign } = generateSignature(appId, privateKey, body)
  
  return {
    'Content-Type': 'application/json',
    'x-app-id': appId,
    'x-timestamp': timestamp,
    'x-sign': sign,
  }
}

// ============ API调用示例 ============

/**
 * 示例1: 获取文档列表
 * GET /api/open/documents
 */
async function getDocuments(page = 1, pageSize = 10, published?: boolean) {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  })
  
  if (published !== undefined) {
    params.append('published', published.toString())
  }

  const headers = buildHeaders(APP_ID, PRIVATE_KEY)
  
  const response = await fetch(`${API_BASE_URL}/documents?${params}`, {
    method: 'GET',
    headers,
  })
  
  const data = await response.json()
  console.log('获取文档列表:', data)
  return data
}

/**
 * 示例2: 获取单个文档详情
 * GET /api/open/documents/:id
 */
async function getDocument(id: string) {
  const headers = buildHeaders(APP_ID, PRIVATE_KEY)
  
  const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
    method: 'GET',
    headers,
  })
  
  const data = await response.json()
  console.log('获取文档详情:', data)
  return data
}

/**
 * 示例3: 创建文档
 * POST /api/open/documents
 */
async function createDocument(documentData: {
  title: string
  slug?: string
  content?: string
  excerpt?: string
  published?: boolean
  parentId?: string
  categoryId?: string
  authorId: string // 必需
}) {
  const headers = buildHeaders(APP_ID, PRIVATE_KEY, documentData)
  
  const response = await fetch(`${API_BASE_URL}/documents`, {
    method: 'POST',
    headers,
    body: JSON.stringify(documentData),
  })
  
  const data = await response.json()
  console.log('创建文档:', data)
  return data
}

/**
 * 示例4: 更新文档
 * PUT /api/open/documents/:id
 */
async function updateDocument(id: string, updates: {
  title?: string
  slug?: string
  content?: string
  excerpt?: string
  published?: boolean
  parentId?: string
  categoryId?: string
}) {
  const headers = buildHeaders(APP_ID, PRIVATE_KEY, updates)
  
  const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updates),
  })
  
  const data = await response.json()
  console.log('更新文档:', data)
  return data
}

/**
 * 示例5: 删除文档
 * DELETE /api/open/documents/:id
 */
async function deleteDocument(id: string) {
  const headers = buildHeaders(APP_ID, PRIVATE_KEY)
  
  const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
    method: 'DELETE',
    headers,
  })
  
  const data = await response.json()
  console.log('删除文档:', data)
  return data
}

// ============ 使用示例 ============

async function main() {
  try {
    // 1. 获取文档列表
    await getDocuments(1, 10, true)
    
    // 2. 创建文档
    const newDoc = await createDocument({
      title: '测试文档',
      content: '# 测试内容\n\n这是一个测试文档。',
      excerpt: '这是测试文档的摘要',
      published: true,
      authorId: 'your-user-id', // 替换为实际的用户ID
    })
    
    // 3. 获取文档详情
    if (newDoc.id) {
      await getDocument(newDoc.id)
      
      // 4. 更新文档
      await updateDocument(newDoc.id, {
        title: '更新后的测试文档',
        content: '# 更新后的内容\n\n文档已更新。',
      })
      
      // 5. 删除文档
      // await deleteDocument(newDoc.id)
    }
  } catch (error) {
    console.error('API调用错误:', error)
  }
}

// 运行示例
// main()

// ============ 导出函数供外部使用 ============
export {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  generateSignature,
  buildHeaders,
}
