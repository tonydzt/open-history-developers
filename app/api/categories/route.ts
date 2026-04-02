import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { localizeCategory } from '@/lib/content-i18n'
import { getServerLocale } from '@/lib/i18n-server'

export async function GET() {
  try {
    const locale = await getServerLocale()
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(categories.map((category) => localizeCategory(category, locale)))
  } catch {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
