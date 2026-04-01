import { getRuntimeConfig, handleMcpRequest, JsonRpcRequest, makeError } from './core'

class McpStdioServer {
  private buffer = Buffer.alloc(0)

  constructor() {
    process.stdin.on('data', (chunk: Buffer) => {
      this.buffer = Buffer.concat([this.buffer, chunk])
      this.processBuffer().catch((error) => {
        const message = error instanceof Error ? error.message : 'Internal error'
        this.writeMessage(makeError(null, -32603, message))
      })
    })
  }

  private async processBuffer(): Promise<void> {
    while (true) {
      const headerEnd = this.buffer.indexOf('\r\n\r\n')
      if (headerEnd === -1) return

      const headerText = this.buffer.subarray(0, headerEnd).toString('utf8')
      const contentLengthMatch = headerText.match(/Content-Length:\s*(\d+)/i)
      if (!contentLengthMatch) {
        throw new Error('Missing Content-Length header')
      }

      const contentLength = Number.parseInt(contentLengthMatch[1], 10)
      const messageStart = headerEnd + 4
      const messageEnd = messageStart + contentLength
      if (this.buffer.length < messageEnd) return

      const body = this.buffer.subarray(messageStart, messageEnd).toString('utf8')
      this.buffer = this.buffer.subarray(messageEnd)

      const message = JSON.parse(body) as JsonRpcRequest
      const response = await handleMcpRequest(message, getRuntimeConfig())
      if (response) {
        this.writeMessage(response)
      }
    }
  }

  private writeMessage(payload: unknown): void {
    const body = JSON.stringify(payload)
    const header = `Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n`
    process.stdout.write(header)
    process.stdout.write(body)
  }
}

new McpStdioServer()
