import path from 'path'
import Database from 'better-sqlite3'
import { PrismaClient } from '@prisma/client'

type UserRow = {
  id: string
  email: string
  name: string | null
  password: string
  role: string
  openApiPublicKey?: string | null
  openApiPrivateKey?: string | null
  createdAt: string
  updatedAt: string
}

type CategoryRow = {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

type DocumentRow = {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  order?: number
  published: number
  viewCount: number
  createdAt: string
  updatedAt: string
  parentId: string | null
  authorId: string
  categoryId: string | null
}

function resolveSqlitePath(rawUrl: string): string {
  if (!rawUrl.startsWith('file:')) {
    throw new Error('LEGACY_SQLITE_URL must start with "file:"')
  }

  const filePath = rawUrl.slice('file:'.length)
  if (!filePath) {
    throw new Error('LEGACY_SQLITE_URL is empty after "file:"')
  }

  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath)
}

function toDate(value: string): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${value}`)
  }
  return date
}

async function main() {
  const targetDbUrl = process.env.DATABASE_URL
  if (!targetDbUrl) {
    throw new Error('Missing DATABASE_URL for target PostgreSQL database')
  }

  const legacySqliteUrl = process.env.LEGACY_SQLITE_URL || 'file:./prisma/dev.db'
  const sqlitePath = resolveSqlitePath(legacySqliteUrl)

  const sqlite = new Database(sqlitePath, { readonly: true })
  const prisma = new PrismaClient({ datasources: { db: { url: targetDbUrl } } })

  try {
    const users = sqlite.prepare('SELECT * FROM "User"').all() as UserRow[]

    const categories = sqlite
      .prepare('SELECT id, name, description, createdAt, updatedAt FROM "Category"')
      .all() as CategoryRow[]

    const documents = sqlite.prepare('SELECT * FROM "Document"').all() as DocumentRow[]

    const uncategorizedCategoryId = 'uncategorized'
    const hasDocumentsWithoutCategory = documents.some((doc) => !doc.categoryId)

    await prisma.$transaction(async (tx) => {
      for (const user of users) {
        await tx.user.upsert({
          where: { id: user.id },
          create: {
            id: user.id,
            email: user.email,
            name: user.name,
            password: user.password,
            role: user.role,
            openApiPublicKey: user.openApiPublicKey,
            openApiPrivateKey: user.openApiPrivateKey,
            createdAt: toDate(user.createdAt),
            updatedAt: toDate(user.updatedAt),
          },
          update: {
            email: user.email,
            name: user.name,
            password: user.password,
            role: user.role,
            openApiPublicKey: user.openApiPublicKey,
            openApiPrivateKey: user.openApiPrivateKey,
            createdAt: toDate(user.createdAt),
            updatedAt: toDate(user.updatedAt),
          },
        })
      }

      for (const category of categories) {
        await tx.category.upsert({
          where: { id: category.id },
          create: {
            id: category.id,
            name: category.name,
            nameZh: category.name,
            description: category.description,
            descriptionZh: category.description,
            createdAt: toDate(category.createdAt),
            updatedAt: toDate(category.updatedAt),
          },
          update: {
            name: category.name,
            nameZh: category.name,
            description: category.description,
            descriptionZh: category.description,
            createdAt: toDate(category.createdAt),
            updatedAt: toDate(category.updatedAt),
          },
        })
      }

      if (hasDocumentsWithoutCategory) {
        await tx.category.upsert({
          where: { id: uncategorizedCategoryId },
          create: {
            id: uncategorizedCategoryId,
            name: 'Uncategorized',
            nameEn: 'Uncategorized',
            description: 'Auto-created during SQLite to PostgreSQL migration',
            descriptionEn: 'Auto-created during SQLite to PostgreSQL migration',
          },
          update: {},
        })
      }

      const insertedDocumentIds = new Set<string>()
      const pending = [...documents]

      while (pending.length > 0) {
        let progressed = false

        for (let i = pending.length - 1; i >= 0; i -= 1) {
          const doc = pending[i]
          if (doc.parentId && !insertedDocumentIds.has(doc.parentId)) {
            continue
          }

          await tx.document.upsert({
            where: { id: doc.id },
            create: {
              id: doc.id,
              title: doc.title,
              titleZh: doc.title,
              slug: doc.slug,
              content: doc.content,
              contentZh: doc.content,
              excerpt: doc.excerpt,
              excerptZh: doc.excerpt,
              order: doc.order ?? 0,
              published: Boolean(doc.published),
              viewCount: doc.viewCount,
              createdAt: toDate(doc.createdAt),
              updatedAt: toDate(doc.updatedAt),
              parentId: doc.parentId,
              authorId: doc.authorId,
              categoryId: doc.categoryId || uncategorizedCategoryId,
            },
            update: {
              title: doc.title,
              titleZh: doc.title,
              slug: doc.slug,
              content: doc.content,
              contentZh: doc.content,
              excerpt: doc.excerpt,
              excerptZh: doc.excerpt,
              order: doc.order ?? 0,
              published: Boolean(doc.published),
              viewCount: doc.viewCount,
              createdAt: toDate(doc.createdAt),
              updatedAt: toDate(doc.updatedAt),
              parentId: doc.parentId,
              authorId: doc.authorId,
              categoryId: doc.categoryId || uncategorizedCategoryId,
            },
          })

          insertedDocumentIds.add(doc.id)
          pending.splice(i, 1)
          progressed = true
        }

        if (!progressed) {
          const unresolved = pending.map((item) => `${item.id} (parentId=${item.parentId || 'null'})`)
          throw new Error(`Cannot resolve document parent relations: ${unresolved.join(', ')}`)
        }
      }
    })

    console.log(`Migrated ${users.length} users, ${categories.length} categories, ${documents.length} documents.`)
  } finally {
    sqlite.close()
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
