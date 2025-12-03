import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    // Dynamically import the server supabase client to access the current user
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the app user by email
    const appUser = await prisma.user.findUnique({ where: { email: authUser.email } })

    if (!appUser) {
      return NextResponse.json({ listings: [] })
    }

    const listings = await prisma.listing.findMany({
      where: { userId: appUser.id },
      include: {
        category: true,
        user: { include: { profile: { select: { displayName: true, username: true, avatarUrl: true } } } },
        images: { take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ listings })
  } catch (error) {
    console.error('Error fetching profile listings:', error)
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }
}
