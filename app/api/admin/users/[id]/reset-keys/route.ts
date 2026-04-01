import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { generateRSAKeyPair } from '@/lib/rsa-sign'

export async function POST(
  _request: Request,
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
  const { publicKey, privateKey } = generateRSAKeyPair()

  const user = await prisma.user.update({
    where: { id },
    data: {
      openApiPublicKey: publicKey,
      openApiPrivateKey: privateKey,
    },
    select: {
      id: true,
      openApiPrivateKey: true,
    },
  })

  return NextResponse.json(user)
}
