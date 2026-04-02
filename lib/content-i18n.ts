import { type Locale } from '@/lib/i18n'

function trimOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export function resolveLocalizedCategoryInput(input: Record<string, unknown>) {
  const name = trimOrNull(input.name)
  const nameEn = trimOrNull(input.nameEn)
  const nameZh = trimOrNull(input.nameZh)
  const description = trimOrNull(input.description)
  const descriptionEn = trimOrNull(input.descriptionEn)
  const descriptionZh = trimOrNull(input.descriptionZh)

  const resolvedNameEn = nameEn ?? name ?? nameZh
  const resolvedNameZh = nameZh ?? name ?? nameEn
  const resolvedName = name ?? resolvedNameZh ?? resolvedNameEn

  const resolvedDescriptionEn = descriptionEn ?? description ?? descriptionZh
  const resolvedDescriptionZh = descriptionZh ?? description ?? descriptionEn
  const resolvedDescription = description ?? resolvedDescriptionZh ?? resolvedDescriptionEn

  return {
    name: resolvedName,
    nameEn: resolvedNameEn,
    nameZh: resolvedNameZh,
    description: resolvedDescription,
    descriptionEn: resolvedDescriptionEn,
    descriptionZh: resolvedDescriptionZh,
  }
}

export function resolveLocalizedDocumentInput(input: Record<string, unknown>) {
  const title = trimOrNull(input.title)
  const titleEn = trimOrNull(input.titleEn)
  const titleZh = trimOrNull(input.titleZh)
  const content = typeof input.content === 'string' ? input.content : undefined
  const contentEn = typeof input.contentEn === 'string' ? input.contentEn : undefined
  const contentZh = typeof input.contentZh === 'string' ? input.contentZh : undefined
  const excerpt = trimOrNull(input.excerpt)
  const excerptEn = trimOrNull(input.excerptEn)
  const excerptZh = trimOrNull(input.excerptZh)

  const resolvedTitleEn = titleEn ?? title ?? titleZh
  const resolvedTitleZh = titleZh ?? title ?? titleEn
  const resolvedTitle = title ?? resolvedTitleZh ?? resolvedTitleEn

  const resolvedContentEn = contentEn ?? content ?? contentZh ?? ''
  const resolvedContentZh = contentZh ?? content ?? contentEn ?? ''
  const resolvedContent = content ?? resolvedContentZh ?? resolvedContentEn

  const resolvedExcerptEn = excerptEn ?? excerpt ?? excerptZh
  const resolvedExcerptZh = excerptZh ?? excerpt ?? excerptEn
  const resolvedExcerpt = excerpt ?? resolvedExcerptZh ?? resolvedExcerptEn

  return {
    title: resolvedTitle,
    titleEn: resolvedTitleEn,
    titleZh: resolvedTitleZh,
    content: resolvedContent,
    contentEn: resolvedContentEn,
    contentZh: resolvedContentZh,
    excerpt: resolvedExcerpt,
    excerptEn: resolvedExcerptEn,
    excerptZh: resolvedExcerptZh,
  }
}

export function pickLocalizedText(locale: Locale, values: { base?: string | null; en?: string | null; zh?: string | null }) {
  if (locale === 'zh') {
    return values.zh || values.base || values.en || ''
  }
  return values.en || values.base || values.zh || ''
}

export function localizeCategory<T extends {
  name?: string | null
  nameEn?: string | null
  nameZh?: string | null
  description?: string | null
  descriptionEn?: string | null
  descriptionZh?: string | null
}>(category: T, locale: Locale): T {
  return {
    ...category,
    name: pickLocalizedText(locale, { base: category.name, en: category.nameEn, zh: category.nameZh }),
    description: pickLocalizedText(locale, {
      base: category.description,
      en: category.descriptionEn,
      zh: category.descriptionZh,
    }) || null,
  }
}

export function localizeDocument<T extends {
  title?: string | null
  titleEn?: string | null
  titleZh?: string | null
  content?: string | null
  contentEn?: string | null
  contentZh?: string | null
  excerpt?: string | null
  excerptEn?: string | null
  excerptZh?: string | null
}>(document: T, locale: Locale): T {
  return {
    ...document,
    title: pickLocalizedText(locale, { base: document.title, en: document.titleEn, zh: document.titleZh }),
    content: pickLocalizedText(locale, {
      base: document.content,
      en: document.contentEn,
      zh: document.contentZh,
    }),
    excerpt:
      pickLocalizedText(locale, {
        base: document.excerpt,
        en: document.excerptEn,
        zh: document.excerptZh,
      }) || null,
  }
}
