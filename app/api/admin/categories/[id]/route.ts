import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'
import { resolveLocalizedCategoryInput } from '@/lib/content-i18n'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { session, authorized } = await getAdminSession()

  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  if (!authorized) {
    return NextResponse.json({ error: '无权限编辑分类' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const localized = resolveLocalizedCategoryInput(body)
  const name = localized.name

  if (!name) {
    return NextResponse.json({ error: '分类名称不能为空' }, { status: 400 })
  }

  const existingCategory = await prisma.category.findUnique({
    where: { id },
  })

  if (!existingCategory) {
    return NextResponse.json({ error: '分类不存在' }, { status: 404 })
  }

  const duplicatedCategory = await prisma.category.findFirst({
    where: {
      name,
      NOT: { id },
    },
  })

  if (duplicatedCategory) {
    return NextResponse.json({ error: '分类名称已存在' }, { status: 400 })
  }

  const category = await prisma.category.update({
    where: { id },
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

export async function DELETE(request: Request, { params }: RouteContext) {
  const { session, authorized } = await getAdminSession()

  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  if (!authorized) {
    return NextResponse.json({ error: '无权限删除分类' }, { status: 403 })
  }

  const { id } = await params

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { documents: true },
      },
    },
  })

  if (!category) {
    return NextResponse.json({ error: '分类不存在' }, { status: 404 })
  }

  if (category._count.documents > 0) {
    return NextResponse.json({ error: '分类下仍有关联文档，无法删除' }, { status: 400 })
  }

  await prisma.category.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
