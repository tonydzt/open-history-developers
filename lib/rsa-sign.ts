import crypto from 'crypto'

/**
 * 生成RSA密钥对
 */
export function generateRSAKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  })

  return { publicKey, privateKey }
}

/**
 * 生成请求体的hash值
 */
export function generateBodyHash(body: any): string {
  if (!body || Object.keys(body).length === 0) {
    return ''
  }
  const bodyString = JSON.stringify(body)
  return crypto.createHash('sha256').update(bodyString).digest('hex')
}

/**
 * 生成签名内容
 * sign = RSA私钥签名(appId + timestamp + 请求体hash)
 */
export function generateSignContent(appId: string, timestamp: string, bodyHash: string): string {
  return `${appId}${timestamp}${bodyHash}`
}

/**
 * 使用RSA私钥签名
 */
export function signWithPrivateKey(privateKey: string, content: string): string {
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(content)
  sign.end()
  return sign.sign(privateKey, 'base64')
}

/**
 * 使用RSA公钥验证签名
 */
export function verifyWithPublicKey(publicKey: string, content: string, signature: string): boolean {
  try {
    const verify = crypto.createVerify('RSA-SHA256')
    verify.update(content)
    verify.end()
    return verify.verify(publicKey, signature, 'base64')
  } catch (error) {
    console.error('Signature verification failed:', error)
    return false
  }
}

/**
 * 验证开放API请求签名
 */
export interface VerifySignatureParams {
  appId: string
  timestamp: string
  sign: string
  body?: any
  publicKey: string
}

export interface VerifySignatureResult {
  valid: boolean
  error?: string
}

export function verifyOpenApiSignature(params: VerifySignatureParams): VerifySignatureResult {
  const { appId, timestamp, sign, body, publicKey } = params

  // 1. 检查必需参数
  if (!appId || !timestamp || !sign) {
    return { valid: false, error: 'Missing required parameters: appId, timestamp, or sign' }
  }

  // 2. 检查时间戳有效性（防止重放攻击，允许5分钟误差）
  const timestampNum = parseInt(timestamp, 10)
  const now = Date.now()
  const timeDiff = Math.abs(now - timestampNum)
  const maxTimeDiff = 5 * 60 * 1000 // 5分钟

  if (isNaN(timestampNum) || timeDiff > maxTimeDiff) {
    return { valid: false, error: 'Invalid or expired timestamp' }
  }

  // 3. 生成签名内容
  const bodyHash = generateBodyHash(body)
  const signContent = generateSignContent(appId, timestamp, bodyHash)

  // 4. 验证签名
  const isValid = verifyWithPublicKey(publicKey, signContent, sign)

  if (!isValid) {
    return { valid: false, error: 'Invalid signature' }
  }

  return { valid: true }
}

/**
 * 生成随机appId
 */
export function generateAppId(): string {
  return `app_${crypto.randomBytes(16).toString('hex')}`
}
