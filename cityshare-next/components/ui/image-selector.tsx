'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageSelectorProps {
  value?: File[]
  onChange: (files: File[]) => void
  maxFiles?: number
  disabled?: boolean
  className?: string
}

export function ImageSelector({
  value = [],
  onChange,
  maxFiles = 5,
  disabled = false,
  className,
}: ImageSelectorProps) {
  const [error, setError] = useState<string | null>(null)
  const [previews, setPreviews] = useState<string[]>([])

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return

      // Check if adding these files would exceed max
      if (value.length + files.length > maxFiles) {
        setError(`Maximum ${maxFiles} images allowed`)
        return
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      const maxSize = 5 * 1024 * 1024 // 5MB

      const newFiles: File[] = []
      const newPreviews: string[] = []

      Array.from(files).forEach((file) => {
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          setError(`Invalid file type: ${file.type}`)
          return
        }

        // Validate file size
        if (file.size > maxSize) {
          setError(`File too large: ${file.name}. Max size: 5MB`)
          return
        }

        newFiles.push(file)
        // Create preview URL
        const previewUrl = URL.createObjectURL(file)
        newPreviews.push(previewUrl)
      })

      if (newFiles.length > 0) {
        setError(null)
        onChange([...value, ...newFiles])
        setPreviews([...previews, ...newPreviews])
      }
    },
    [value, maxFiles, onChange, previews]
  )

  const handleRemove = useCallback(
    (index: number) => {
      // Revoke preview URL to free memory
      URL.revokeObjectURL(previews[index])

      const newFiles = value.filter((_, i) => i !== index)
      const newPreviews = previews.filter((_, i) => i !== index)

      onChange(newFiles)
      setPreviews(newPreviews)
    },
    [value, previews, onChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (disabled) return
      handleFileSelect(e.dataTransfer.files)
    },
    [disabled, handleFileSelect]
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
            disabled
              ? 'border-muted bg-muted/20 cursor-not-allowed'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer',
            error && 'border-destructive'
          )}
        >
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            multiple
            disabled={disabled}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="image-selector"
          />
          <label
            htmlFor="image-selector"
            className={cn(
              'flex flex-col items-center gap-2',
              disabled ? 'cursor-not-allowed' : 'cursor-pointer'
            )}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WEBP or GIF (max 5MB per file)
              </p>
              <p className="text-xs text-muted-foreground">
                {value.length} / {maxFiles} images selected
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
          {previews.map((preview, index) => (
            <div
              key={preview}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
            >
              <Image
                src={preview}
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
                onClick={() => handleRemove(index)}
                disabled={disabled}
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
