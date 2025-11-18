import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ListingType, ListingStatus } from '@prisma/client'

// GET /api/listings - Get all listings with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const q = searchParams.get('q') // search query
    const category = searchParams.get('category')
    const type = searchParams.get('type') as ListingType | null
    const status = searchParams.get('status') as ListingStatus | null
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {
      status: status || 'active', // default to active listings
    }

    if (q) {
      where.OR = [
        { itemName: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.categoryId = parseInt(category)
    }

    if (type) {
      where.type = type
    }

    // Fetch listings
    const listings = await prisma.listing.findMany({
      where,
      include: {
        category: true,
        user: {
          include: {
            profile: {
              select: {
                displayName: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        images: {
          take: 1, // Just get the first image for list view
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    // Get total count for pagination
    const total = await prisma.listing.count({ where })

    return NextResponse.json({
      listings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    )
  }
}

// POST /api/listings - Create a new listing
export async function POST(request: NextRequest) {
  try {
    // Import auth utilities dynamically to avoid import issues
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Get user from database by email, or create if doesn't exist
    let user = await prisma.user.findUnique({
      where: { email: authUser.email },
    })

    // Auto-create user profile if it doesn't exist
    if (!user) {
      const displayName = authUser.user_metadata?.display_name ||
                         authUser.email?.split('@')[0] ||
                         'User'

      // Create a temporary password hash (user is authenticated via Supabase)
      const bcrypt = await import('bcryptjs')
      const tempPassword = await bcrypt.hash('temp-' + Math.random(), 10)

      user = await prisma.user.create({
        data: {
          email: authUser.email!,
          password: tempPassword, // Placeholder - actual auth is via Supabase
          profile: {
            create: {
              displayName,
              isStudent: false,
            },
          },
        },
        include: {
          profile: true,
        },
      })
    }

    const body = await request.json()

    const {
      itemName,
      description,
      categoryId,
      type,
      condition,
      priceCents,
      imageUrl,
      images, // Array of image URLs
    } = body

    // Validate required fields
    if (!itemName || !type) {
      return NextResponse.json(
        { error: 'Item name and type are required' },
        { status: 400 }
      )
    }

    // Validate type
    if (!['sell', 'donate', 'borrow'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid listing type' },
        { status: 400 }
      )
    }

    // Create listing with images
    const listing = await prisma.listing.create({
      data: {
        itemName,
        description,
        categoryId: categoryId ? parseInt(categoryId) : null,
        type: type as ListingType,
        condition,
        priceCents: priceCents ? parseInt(priceCents) : null,
        imageUrl,
        userId: user.id,
        // Create ListingImage records if images array provided
        images: images && Array.isArray(images) && images.length > 0 ? {
          create: images.map((url: string) => ({
            url,
          })),
        } : undefined,
      },
      include: {
        category: true,
        user: {
          include: {
            profile: true,
          },
        },
        images: true,
      },
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    console.error('Error creating listing:', error)
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    )
  }
}
