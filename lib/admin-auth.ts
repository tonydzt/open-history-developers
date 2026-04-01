import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function getAdminSession() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { session: null, authorized: false }
  }

  const authorized = ['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)

  return { session, authorized }
}
