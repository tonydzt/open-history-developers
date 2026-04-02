import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'
import { localizeCategory, resolveLocalizedCategoryInput } from '@/lib/content-i18n'
import { getServerLocale } from '@/lib/i18n-server'

export async function GET() {
  const { session, authorized } = await getAdminSession()
  const locale = await getServerLocale()

  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  if (!authorized) {
    return NextResponse.json({ error: '无权限访问分类管理' }, { status: 403 })
  }

  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { documents: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(categories.map((category) => localizeCategory(category, locale)))
}

export async function POST(request: Request) {
  const { session, authorized } = await getAdminSession()

  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  if (!authorized) {
    return NextResponse.json({ error: '无权限创建分类' }, { status: 403 })
  }

  const body = await request.json()
  const localized = resolveLocalizedCategoryInput(body)
  const name = localized.name

  if (!name) {
    return NextResponse.json({ error: '分类名称不能为空' }, { status: 400 })
  }

  const exists = await prisma.category.findUnique({
    where: { name },
  })

  if (exists) {
    return NextResponse.json({ error: '分类名称已存在' }, { status: 400 })
  }

  const category = await prisma.category.create({
    data: {
      name,
      nameEn: localized.nameEn,
      nameZh: localized.nameZh,
      description: localized.description,
      descriptionEn: localized.descriptionEn,
      descriptionZh: localized.descriptionZh,
    },
    include: {
      _count: {
        select: { documents: true },
      },
    },
  })

  return NextResponse.json(category)
}
