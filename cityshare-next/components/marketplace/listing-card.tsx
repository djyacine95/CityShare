import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Listing {
  id: number
  itemName: string
  description: string | null
  type: 'sell' | 'donate' | 'borrow'
  priceCents: number | null
  imageUrl: string | null
  category: {
    name: string
  } | null
  user: {
    profile: {
      displayName: string
      username: string | null
      avatarUrl: string | null
    } | null
  }
  images: Array<{
    url: string
  }>
}

interface ListingCardProps {
  listing: Listing
}

export function ListingCard({ listing }: ListingCardProps) {
  const imageUrl = listing.images[0]?.url || listing.imageUrl || null
  const price = listing.priceCents ? `$${(listing.priceCents / 100).toFixed(2)}` : null

  const typeColors = {
    sell: 'bg-green-500',
    donate: 'bg-blue-500',
    borrow: 'bg-purple-500',
  }

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="relative aspect-square bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={listing.itemName}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <div className="text-center p-4">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground/30"
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
                <p className="text-xs text-muted-foreground mt-2">No image</p>
              </div>
            </div>
          )}
          <Badge className={`absolute top-2 right-2 ${typeColors[listing.type]}`}>
            {listing.type.toUpperCase()}
          </Badge>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg line-clamp-1">{listing.itemName}</h3>
              {listing.category && (
                <p className="text-sm text-muted-foreground">{listing.category.name}</p>
              )}
            </div>
            {price && (
              <p className="text-lg font-bold text-green-600 ml-2">{price}</p>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          {listing.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {listing.description}
            </p>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={listing.user.profile?.avatarUrl || undefined} />
              <AvatarFallback>
                {listing.user.profile?.displayName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {listing.user.profile?.displayName || 'Anonymous'}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
