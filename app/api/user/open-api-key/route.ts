import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { generateRSAKeyPair } from '@/lib/rsa-sign'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      openApiPrivateKey: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function POST() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { publicKey, privateKey } = generateRSAKeyPair()

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      openApiPublicKey: publicKey,
      openApiPrivateKey: privateKey,
    },
    select: {
      id: true,
      email: true,
      openApiPrivateKey: true,
    },
  })

  return NextResponse.json(user)
}
