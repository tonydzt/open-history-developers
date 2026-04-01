import { Prisma, PrismaClient } from '@prisma/client'

type DbClient = PrismaClient | Prisma.TransactionClient

export async function getDocumentById(db: DbClient, id: string) {
  return db.document.findUnique({
    where: { id },
    select: {
      id: true,
      parentId: true,
      categoryId: true,
    },
  })
}

export async function getTopLevelCategoryId(db: DbClient, documentId: string) {
  let current = await getDocumentById(db, documentId)

  if (!current) {
    return null
  }

  while (current.parentId) {
    current = await getDocumentById(db, current.parentId)

    if (!current) {
      return null
    }
  }

  return current.categoryId
}

export async function getDescendantIds(db: DbClient, rootId: string) {
  const descendantIds: string[] = []
  const queue = [rootId]

  while (queue.length > 0) {
    const parentIds = queue.splice(0, queue.length)
    const children = await db.document.findMany({
      where: {
        parentId: {
          in: parentIds,
        },
      },
      select: {
        id: true,
      },
    })

    if (children.length === 0) {
      continue
    }

    const childIds = children.map((child) => child.id)
    descendantIds.push(...childIds)
    queue.push(...childIds)
  }

  return descendantIds
}

export async function syncSubtreeCategory(db: DbClient, rootId: string, categoryId: string) {
  const descendantIds = await getDescendantIds(db, rootId)

  if (descendantIds.length === 0) {
    return
  }

  await db.document.updateMany({
    where: {
      id: {
        in: descendantIds,
      },
    },
    data: {
      categoryId,
    },
  })
}
