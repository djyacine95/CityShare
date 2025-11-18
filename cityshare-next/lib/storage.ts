import { createClient } from '@/lib/supabase/server'

/**
 * Upload an image to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name (default: 'listings')
 * @param folder - Optional folder path within the bucket
 * @returns The public URL of the uploaded file
 */
export async function uploadImage(
  file: File,
  bucket: string = 'listings',
  folder?: string
): Promise<string> {
  const supabase = await createClient()

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = folder ? `${folder}/${fileName}` : fileName

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

/**
 * Delete an image from Supabase Storage
 * @param url - The public URL of the image to delete
 * @param bucket - The storage bucket name (default: 'listings')
 */
export async function deleteImage(
  url: string,
  bucket: string = 'listings'
): Promise<void> {
  const supabase = await createClient()

  // Extract file path from URL
  const urlParts = url.split('/')
  const bucketIndex = urlParts.findIndex(part => part === bucket)
  if (bucketIndex === -1) {
    throw new Error('Invalid image URL')
  }

  const filePath = urlParts.slice(bucketIndex + 1).join('/')

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath])

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`)
  }
}

/**
 * Upload multiple images
 * @param files - Array of files to upload
 * @param bucket - The storage bucket name (default: 'listings')
 * @param folder - Optional folder path within the bucket
 * @returns Array of public URLs
 */
export async function uploadMultipleImages(
  files: File[],
  bucket: string = 'listings',
  folder?: string
): Promise<string[]> {
  const uploadPromises = files.map(file => uploadImage(file, bucket, folder))
  return Promise.all(uploadPromises)
}
