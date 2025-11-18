'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string[]
  onChange: (urls: string[]) => void
  maxFiles?: number
  disabled?: boolean
  className?: string
}

export function ImageUpload({
  value = [],
  onChange,
  maxFiles = 5,
  disabled = false,
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      // Check if adding these files would exceed max
      if (value.length + files.length > maxFiles) {
        setError(`Maximum ${maxFiles} images allowed`)
        return
      }

      setUploading(true)
      setError(null)

      try {
        const formData = new FormData()
        Array.from(files).forEach((file) => {
          formData.append('files', file)
        })

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to upload images')
        }

        const data = await response.json()
        onChange([...value, ...data.urls])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload images')
        console.error('Upload error:', err)
      } finally {
        setUploading(false)
      }
    },
    [value, maxFiles, onChange]
  )

  const handleRemove = useCallback(
    (url: string) => {
      onChange(value.filter((u) => u !== url))
    },
    [value, onChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (disabled || uploading) return
      handleUpload(e.dataTransfer.files)
    },
    [disabled, uploading, handleUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      {value.length < maxFiles && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            disabled || uploading
              ? 'border-muted bg-muted/20 cursor-not-allowed'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer',
            error && 'border-destructive'
          )}
        >
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            multiple
            disabled={disabled || uploading}
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={cn(
              'flex flex-col items-center gap-2',
              disabled || uploading ? 'cursor-not-allowed' : 'cursor-pointer'
            )}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WEBP or GIF (max 5MB per file)
              </p>
              <p className="text-xs text-muted-foreground">
                {value.length} / {maxFiles} images
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div
              key={url}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
            >
              <Image
                src={url}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(url)}
                disabled={disabled || uploading}
              >
                <X className="h-4 w-4" />
              </Button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
