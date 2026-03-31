import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: '无权限，只有超级管理员可以管理用户' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: '无权限，只有超级管理员可以创建用户' }, { status: 403 })
  }

  const body = await request.json()
  const { email, name, password, role } = body

  if (!email || !password || !role) {
    return NextResponse.json({ error: '邮箱、密码和角色为必填项' }, { status: 400 })
  }

  if (!['SUPER_ADMIN', 'ADMIN', 'API_USER'].includes(role)) {
    return NextResponse.json({ error: '无效的角色' }, { status: 400 })
  }

  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    return NextResponse.json({ error: '邮箱已存在' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      name: name || email.split('@')[0],
      password: hashedPassword,
      role,
    }
  })

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
}
