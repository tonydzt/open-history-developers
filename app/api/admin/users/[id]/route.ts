import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { name, role, password } = body

  const updateData: { name?: string; role?: string; password?: string } = {}
  
  if (name) updateData.name = name
  if (role && ['SUPER_ADMIN', 'ADMIN', 'API_USER'].includes(role)) {
    updateData.role = role
  }
  if (password) {
    updateData.password = await bcrypt.hash(password, 10)
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: '没有要更新的内容' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData
  })

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { id } = await params

  if (id === session.user.id) {
    return NextResponse.json({ error: '不能删除自己' }, { status: 400 })
  }

  await prisma.user.delete({
    where: { id }
  })

  return NextResponse.json({ success: true })
}
