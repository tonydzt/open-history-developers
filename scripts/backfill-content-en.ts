import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type TranslateFn = (text: string, kind: 'title' | 'short' | 'markdown') => Promise<string>

function isMissing(value: string | null | undefined) {
  return !value || !value.trim()
}

function mostlyAscii(text: string) {
  if (!text.trim()) return true
  let ascii = 0
  for (const ch of text) {
    if (ch.charCodeAt(0) <= 127) ascii += 1
  }
  return ascii / text.length > 0.9
}

async function buildTranslator(): Promise<{
  translate: TranslateFn
  mode: 'openai' | 'fallback'
}> {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini'

  if (!apiKey) {
    return {
      mode: 'fallback',
      translate: async (text) => text,
    }
  }

  const cache = new Map<string, string>()
  const endpoint = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions'

  const translate: TranslateFn = async (text, kind) => {
    const source = text.trim()
    if (!source || mostlyAscii(source)) return source

    const cacheKey = `${kind}::${source}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const styleHint =
      kind === 'markdown'
        ? 'Preserve all Markdown structure, headings, links, and code blocks exactly.'
        : kind === 'title'
          ? 'Keep it concise and natural as a title.'
          : 'Keep it concise and natural.'

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You are a professional translator. Translate Chinese text to English. Return only the translated text.',
          },
          {
            role: 'user',
            content: `${styleHint}\n\nSource text:\n${source}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(`OpenAI translate failed: ${response.status} ${message}`)
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const translated = data.choices?.[0]?.message?.content?.trim()
    if (!translated) {
      throw new Error('OpenAI translate returned empty content')
    }

    cache.set(cacheKey, translated)
    return translated
  }

  return { mode: 'openai', translate }
}

async function main() {
  const { mode, translate } = await buildTranslator()
  console.log(`Backfill mode: ${mode}`)

  const categories = await prisma.category.findMany()
  const documents = await prisma.document.findMany()

  let categoryUpdated = 0
  let documentUpdated = 0

  for (const category of categories) {
    const sourceName = category.nameEn || category.nameZh || category.name || ''
    const sourceDesc = category.descriptionEn || category.descriptionZh || category.description || ''

    const needNameEn = isMissing(category.nameEn) && !!sourceName.trim()
    const needDescriptionEn = isMissing(category.descriptionEn) && !!sourceDesc.trim()

    if (!needNameEn && !needDescriptionEn) continue

    const nameEn = needNameEn ? await translate(sourceName, 'title') : category.nameEn
    const descriptionEn = needDescriptionEn ? await translate(sourceDesc, 'short') : category.descriptionEn

    await prisma.category.update({
      where: { id: category.id },
      data: {
        ...(needNameEn ? { nameEn } : {}),
        ...(needDescriptionEn ? { descriptionEn } : {}),
      },
    })
    categoryUpdated += 1
  }

  for (const document of documents) {
    const sourceTitle = document.titleEn || document.titleZh || document.title || ''
    const sourceExcerpt = document.excerptEn || document.excerptZh || document.excerpt || ''
    const sourceContent = document.contentEn || document.contentZh || document.content || ''

    const needTitleEn = isMissing(document.titleEn) && !!sourceTitle.trim()
    const needExcerptEn = isMissing(document.excerptEn) && !!sourceExcerpt.trim()
    const needContentEn = isMissing(document.contentEn) && !!sourceContent.trim()

    if (!needTitleEn && !needExcerptEn && !needContentEn) continue

    const titleEn = needTitleEn ? await translate(sourceTitle, 'title') : document.titleEn
    const excerptEn = needExcerptEn ? await translate(sourceExcerpt, 'short') : document.excerptEn
    const contentEn = needContentEn ? await translate(sourceContent, 'markdown') : document.contentEn

    await prisma.document.update({
      where: { id: document.id },
      data: {
        ...(needTitleEn ? { titleEn } : {}),
        ...(needExcerptEn ? { excerptEn } : {}),
        ...(needContentEn ? { contentEn } : {}),
      },
    })
    documentUpdated += 1
  }

  console.log(
    JSON.stringify(
      {
        mode,
        categoryTotal: categories.length,
        categoryUpdated,
        documentTotal: documents.length,
        documentUpdated,
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

