'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageSelector } from '@/components/ui/image-selector'
import { UserMenu } from '@/components/auth/user-menu'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Category {
  id: number
  name: string
}

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

export default function PostItemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  // Form state
  const [itemName, setItemName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'sell' | 'donate' | 'borrow'>('sell')
  const [categoryId, setCategoryId] = useState<string>('')
  const [condition, setCondition] = useState<string>('')
  const [price, setPrice] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])

  // Check authentication and load categories
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login?redirect=/post')
        return
      }

      setLoading(false)
    }

    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        if (Array.isArray(data)) {
          setCategories(data)
        }
      } catch (err) {
        console.error('Failed to load categories:', err)
      }
    }

    checkAuth()
    loadCategories()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      // Validation
      if (!itemName.trim()) {
        throw new Error('Item name is required')
      }

      if (!type) {
        throw new Error('Please select a listing type')
      }

      // Convert price to cents if it's a sale
      let priceCents = null
      if (type === 'sell') {
        const priceNum = parseFloat(price)
        if (isNaN(priceNum) || priceNum <= 0) {
          throw new Error('Please enter a valid price for items for sale')
        }
        priceCents = Math.round(priceNum * 100)
      }

      // Step 1: Upload images first (if any)
      let imageUrls: string[] = []
      if (imageFiles.length > 0) {
        const formData = new FormData()
        imageFiles.forEach((file) => {
          formData.append('files', file)
        })

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          throw new Error(uploadData.error || 'Failed to upload images')
        }

        const uploadData = await uploadResponse.json()
        imageUrls = uploadData.urls
      }

      // Step 2: Create listing with uploaded image URLs
      const listingData = {
        itemName: itemName.trim(),
        description: description.trim() || null,
        type,
        categoryId: categoryId ? parseInt(categoryId) : null,
        condition: condition || null,
        priceCents,
        imageUrl: imageUrls[0] || null, // Primary image
        images: imageUrls, // All images
      }

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listingData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create listing')
      }

      const listing = await response.json()

      // Redirect to the new listing or marketplace
      router.push(`/listings/${listing.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/Logo.png"
                alt="CityShare Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <h1 className="text-2xl font-bold">CityShare</h1>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Post an Item</CardTitle>
            <CardDescription>
              Share an item with your community - sell, donate, or lend it out
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Item Name */}
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name *</Label>
                <Input
                  id="itemName"
                  placeholder="e.g., Blue Denim Jacket"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your item..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  rows={4}
                />
              </div>

              {/* Listing Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Listing Type *</Label>
                <Select value={type} onValueChange={(value: any) => setType(value)} disabled={submitting}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sell">For Sale</SelectItem>
                    <SelectItem value="donate">Donate (Free)</SelectItem>
                    <SelectItem value="borrow">Available to Borrow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price (only for sell) */}
              {type === 'sell' && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              )}

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId} disabled={submitting}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select value={condition} onValueChange={setCondition} disabled={submitting}>
                  <SelectTrigger id="condition">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((cond) => (
                      <SelectItem key={cond.value} value={cond.value}>
                        {cond.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Images */}
              <div className="space-y-2">
                <Label>Images</Label>
                <ImageSelector
                  value={imageFiles}
                  onChange={setImageFiles}
                  maxFiles={5}
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  Select up to 5 images. The first image will be the primary photo. Images will be uploaded when you submit the form.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post Item'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/marketplace')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
