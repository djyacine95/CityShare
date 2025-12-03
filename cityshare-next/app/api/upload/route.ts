import { NextRequest, NextResponse } from 'next/server'
import { uploadImage, uploadMultipleImages } from '@/lib/storage'

// POST /api/upload - Upload image(s) to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    // Optional folder param to place uploads in a subfolder (e.g., 'avatars')
    const folder = formData.get('folder') as string | null

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate file sizes (max 5MB per file)
    const maxSize = 5 * 1024 * 1024 // 5MB
    for (const file of files) {
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Max size: 5MB` },
          { status: 400 }
        )
      }
    }

    // Upload files
    let urls: string[]
    if (files.length === 1) {
      const url = await uploadImage(files[0], 'listings', folder ?? undefined)
      urls = [url]
    } else {
      urls = await uploadMultipleImages(files, 'listings', folder ?? undefined)
    }

    return NextResponse.json({
      success: true,
      urls,
      count: urls.length,
    })
  } catch (error) {
    console.error('Error uploading images:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload images' },
      { status: 500 }
    )
  }
}
