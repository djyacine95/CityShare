'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ListingCard } from '@/components/marketplace/listing-card'
import { UserMenu } from '@/components/auth/user-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'

interface Listing {
  id: number
  itemName: string
  description: string | null
  type: 'sell' | 'donate' | 'borrow'
  priceCents: number | null
  imageUrl: string | null
  category: {
    id: number
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

interface Category {
  id: number
  name: string
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        // Ensure data is an array before setting
        if (Array.isArray(data)) {
          setCategories(data)
        } else {
          console.error('Categories response is not an array:', data)
          setCategories([])
        }
      })
      .catch(err => {
        console.error('Failed to fetch categories:', err)
        setCategories([])
      })
  }, [])

  // Fetch listings
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.append('q', searchQuery)
    if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory)
    if (selectedType && selectedType !== 'all') params.append('type', selectedType)

    setLoading(true)
    fetch(`/api/listings?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setListings(data.listings || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch listings:', err)
        setLoading(false)
      })
  }, [searchQuery, selectedCategory, selectedType])

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

      {/* Filters */}
      <div className="border-b bg-muted/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search for items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sell">For Sale</SelectItem>
                <SelectItem value="donate">Free (Donate)</SelectItem>
                <SelectItem value="borrow">Borrow</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No listings found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
