'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { UserMenu } from '@/components/auth/user-menu'
import { ArrowLeft, MapPin, Calendar, MessageCircle, Loader2 } from 'lucide-react'

interface Listing {
  id: number
  itemName: string
  description: string | null
  type: 'sell' | 'donate' | 'borrow'
  priceCents: number | null
  condition: string | null
  imageUrl: string | null
  createdAt: string
  category: {
    id: number
    name: string
  } | null
  user: {
    profile: {
      displayName: string
      username: string | null
      avatarUrl: string | null
      location: string | null
    } | null
  }
  images: Array<{
    id: number
    url: string
  }>
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/listings/${params.id}`)

        if (!response.ok) {
          if (response.status === 404) {
            setError('Listing not found')
          } else {
            setError('Failed to load listing')
          }
          setLoading(false)
          return
        }

        const data = await response.json()
        setListing(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching listing:', err)
        setError('Failed to load listing')
        setLoading(false)
      }
    }

    fetchListing()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background">
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
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">{error || 'Listing not found'}</h1>
          <Button onClick={() => router.push('/marketplace')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>
        </div>
      </div>
    )
  }

  const allImages = listing.images.length > 0
    ? listing.images.map(img => img.url)
    : listing.imageUrl
    ? [listing.imageUrl]
    : []

  const price = listing.priceCents ? `$${(listing.priceCents / 100).toFixed(2)}` : null

  const typeColors = {
    sell: 'bg-green-500',
    donate: 'bg-blue-500',
    borrow: 'bg-purple-500',
  }

  const typeLabels = {
    sell: 'For Sale',
    donate: 'Free (Donate)',
    borrow: 'Available to Borrow',
  }

  const conditionLabels: Record<string, string> = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
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
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push('/marketplace')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <Card className="overflow-hidden">
              <div className="relative aspect-square bg-muted">
                {allImages.length > 0 ? (
                  <Image
                    src={allImages[selectedImage]}
                    alt={listing.itemName}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-8">
                      <svg
                        className="mx-auto h-24 w-24 text-muted-foreground/30"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-muted-foreground mt-4">No image</p>
                    </div>
                  </div>
                )}
                <Badge className={`absolute top-4 right-4 ${typeColors[listing.type]}`}>
                  {listing.type.toUpperCase()}
                </Badge>
              </div>
            </Card>

            {/* Image Thumbnails */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {allImages.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <Image
                      src={url}
                      alt={`${listing.itemName} ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Title and Price */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold">{listing.itemName}</h1>
                {price && (
                  <p className="text-3xl font-bold text-green-600">{price}</p>
                )}
              </div>
              {listing.category && (
                <p className="text-lg text-muted-foreground">{listing.category.name}</p>
              )}
            </div>

            <Separator />

            {/* Listing Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Type:</span>
                <Badge className={typeColors[listing.type]}>
                  {typeLabels[listing.type]}
                </Badge>
              </div>

              {listing.condition && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Condition:</span>
                  <span>{conditionLabels[listing.condition] || listing.condition}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Posted {new Date(listing.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <Separator />

            {/* Description */}
            {listing.description && (
              <div>
                <h2 className="font-semibold text-lg mb-2">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Seller Info */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="font-semibold text-lg mb-4">Seller Information</h2>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={listing.user.profile?.avatarUrl || undefined} />
                    <AvatarFallback>
                      {listing.user.profile?.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {listing.user.profile?.displayName || 'Anonymous'}
                    </p>
                    {listing.user.profile?.username && (
                      <p className="text-sm text-muted-foreground">
                        @{listing.user.profile.username}
                      </p>
                    )}
                    {listing.user.profile?.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{listing.user.profile.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button className="w-full mt-4">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contact Seller
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
