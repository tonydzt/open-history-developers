'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Copy, MonitorSmartphone, TerminalSquare } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'

interface KeyData {
  id: string
  email: string
  openApiPrivateKey: string | null
}

type PlatformId = 'cursor' | 'cline' | 'windsurf' | 'trae' | 'claude-desktop' | 'terminal' | 'vscode-codex'
type PlatformMode = 'config' | 'command' | 'form'

type PlatformDefinition = {
  id: PlatformId
  name: string
  mode: PlatformMode
  target: string
}

const PLATFORM_OPTIONS: PlatformDefinition[] = [
  { id: 'vscode-codex', name: 'VS Code Codex', mode: 'form', target: 'VS Code Codex 自定义 MCP 表单' },
  { id: 'cursor', name: 'Cursor', mode: 'config', target: '~/.cursor/mcp.json' },
  { id: 'cline', name: 'Cline', mode: 'config', target: 'Cline MCP 配置' },
  { id: 'windsurf', name: 'Windsurf', mode: 'config', target: 'Windsurf MCP 配置' },
  { id: 'trae', name: 'Trae', mode: 'config', target: '.trae/mcp.json' },
  { id: 'claude-desktop', name: 'Claude Desktop', mode: 'config', target: 'claude_desktop_config.json' },
  { id: 'terminal', name: 'Terminal', mode: 'command', target: '直接执行命令' },
]

function toEscapedPrivateKey(value: string): string {
  return value.replace(/\r?\n/g, '\\n')
}

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\"'\"'`)}'`
}

function buildJsonConfig(endpoint: string, userId: string, privateKeyEscaped: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        'open-history': {
          command: 'npx',
          args: ['-y', 'mcp-remote@latest', endpoint],
          env: {
            MCP_OPEN_API_USER_ID: userId,
            MCP_OPEN_API_PRIVATE_KEY: privateKeyEscaped,
          },
        },
      },
    },
    null,
    2
  )
}

function buildTerminalCommand(endpoint: string, userId: string, privateKeyEscaped: string): string {
  return [
    `MCP_OPEN_API_USER_ID=${shellSingleQuote(userId)}`,
    `MCP_OPEN_API_PRIVATE_KEY=${shellSingleQuote(privateKeyEscaped)}`,
    `npx -y mcp-remote@latest ${shellSingleQuote(endpoint)}`,
  ].join(' ')
}

function buildVscodeCodexForm(endpoint: string, userId: string, privateKeyEscaped: string): string {
  return [
    '名称：open-history',
    '传输：流式 HTTP',
    `URL：${endpoint}`,
    'Bearer 令牌环境变量：留空',
    '',
    '标头（可选，直接填值）：',
    `- x-open-api-user-id: ${userId}`,
    `- x-open-api-private-key: ${privateKeyEscaped}`,
    '- x-mcp-session-cookie: next-auth.session-token=...（仅需后台接口时）',
    '',
    '来自环境变量的标头（推荐）：',
    '- x-open-api-user-id: MCP_OPEN_API_USER_ID',
    '- x-open-api-private-key: MCP_OPEN_API_PRIVATE_KEY',
    '- x-mcp-session-cookie: MCP_SESSION_COOKIE（可选）',
  ].join('\n')
}

export default function McpSetupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState<KeyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [endpoint, setEndpoint] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>('cursor')

  const fetchKey = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/open-api-key')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        throw new Error('加载失败')
      }
      setData(await res.json())
    } catch {
      toast('加载 OpenAPI 凭证失败', 'error')
    } finally {
      setLoading(false)
    }
  }, [router, toast])

  useEffect(() => {
    fetchKey()
  }, [fetchKey])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEndpoint(`${window.location.origin}/api/mcp`)
    }
  }, [])

  const selectedOption = useMemo(
    () => PLATFORM_OPTIONS.find((option) => option.id === selectedPlatform) || PLATFORM_OPTIONS[0],
    [selectedPlatform]
  )

  const generatedContent = useMemo(() => {
    if (!data?.id || !data.openApiPrivateKey || !endpoint) return ''
    const privateKeyEscaped = toEscapedPrivateKey(data.openApiPrivateKey)
    if (selectedOption.id === 'vscode-codex') {
      return buildVscodeCodexForm(endpoint, data.id, privateKeyEscaped)
    }
    if (selectedOption.mode === 'command') {
      return buildTerminalCommand(endpoint, data.id, privateKeyEscaped)
    }
    return buildJsonConfig(endpoint, data.id, privateKeyEscaped)
  }, [data, endpoint, selectedOption.id, selectedOption.mode])

  const handleCopy = async () => {
    if (!generatedContent) return
    try {
      await navigator.clipboard.writeText(generatedContent)
      setCopied(true)
      toast('内容已复制', 'success')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast('复制失败，请手动复制', 'error')
    }
  }

  const hasKey = Boolean(data?.openApiPrivateKey)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-indigo-800 dark:from-white dark:to-indigo-300 bg-clip-text text-transparent">
            MCP 一键配置
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            选择平台后复制即可使用，无需手动替换用户 ID、私钥或 MCP 地址。
          </p>
        </div>

        <div className="bg-white/85 dark:bg-slate-900/55 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl p-6">
          {loading ? (
            <div className="text-slate-500 dark:text-slate-400">加载中...</div>
          ) : !hasKey ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 text-amber-900 px-4 py-4">
              <p className="text-sm">当前账号还没有可用私钥，请先生成私钥后再复制配置。</p>
              <Link href="/open-api-key" className="inline-flex mt-3 text-sm font-medium text-indigo-700 hover:text-indigo-800">
                前往我的私钥
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 mb-5">
                <label className="block">
                  <span className="text-sm text-slate-600 dark:text-slate-400">选择平台</span>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value as PlatformId)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                  >
                    {PLATFORM_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/70 px-3 py-2.5">
                  <div className="text-xs text-slate-500 dark:text-slate-400">输出类型</div>
                  <div className="mt-1 text-sm text-slate-800 dark:text-slate-100 font-medium flex items-center gap-2">
                    {selectedOption.mode === 'command' ? <TerminalSquare className="w-4 h-4" /> : <MonitorSmartphone className="w-4 h-4" />}
                    {selectedOption.mode === 'config' ? '配置文件' : selectedOption.mode === 'form' ? '表单填写' : '安装命令'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{selectedOption.target}</div>
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">账号：{data?.email}</div>
              <textarea
                value={generatedContent}
                readOnly
                className="w-full h-[360px] p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs leading-5 text-slate-700 dark:text-slate-200 font-mono"
              />

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? '已复制' : '复制内容'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
