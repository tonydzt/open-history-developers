import { redirect } from 'next/navigation'
import AdminCategoriesPageClient from '@/components/AdminCategoriesPageClient'
import { getAdminSession } from '@/lib/admin-auth'

export default async function AdminCategoriesPage() {
  const { session, authorized } = await getAdminSession()

  if (!session) {
    redirect('/login')
  }

  if (!authorized) {
    redirect('/admin/documents')
  }

  return <AdminCategoriesPageClient />
}
