import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const appUser = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!appUser) {
      return NextResponse.json({ error: 'App user not found' }, { status: 404 })
    }

    const body = await request.json()
    const { displayName, bio, location, username, avatarUrl } = body

    const profile = await prisma.profile.upsert({
      where: { userId: appUser.id },
      create: {
        userId: appUser.id,
        displayName: displayName ?? undefined,
        username: username ?? undefined,
        bio: bio ?? undefined,
        location: location ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
      },
      update: {
        displayName: displayName ?? undefined,
        username: username ?? undefined,
        bio: bio ?? undefined,
        location: location ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
      },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
