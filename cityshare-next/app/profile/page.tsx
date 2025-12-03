"use client"

import { useEffect, useState } from 'react'
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserMenu } from "@/components/auth/user-menu"
import { Button } from "@/components/ui/button"
import { ListingCard } from '@/components/marketplace/listing-card'
import { BadgeCheck, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Listing {
  id: number
  itemName: string
  description: string | null
  type: 'sell' | 'donate' | 'borrow'
  priceCents: number | null
  imageUrl: string | null
  category: { id: number; name: string } | null
  user: { profile: { displayName: string; username: string | null; avatarUrl: string | null } | null }
  images: Array<{ url: string }>
}

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const initials = displayName ? displayName.charAt(0).toUpperCase() : 'U'
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    // fetch profile listings
    fetch('/api/profile/listings')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((data) => {
        if (!mounted) return
        setListings(data.listings || [])
      })
      .catch((err) => {
        console.error('Error loading profile listings:', err)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [])

  // Fetch Supabase auth user to populate display name and avatar
  useEffect(() => {
    let mounted = true
    const supabase = createClient()
    supabase.auth.getUser()
      .then(({ data: { user }, error }) => {
        if (!mounted) return
        if (error || !user) {
          setDisplayName(null)
          setUsername(null)
          setAvatarUrl(null)
          return
        }

        const dn = (user.user_metadata as any)?.display_name || user.email?.split('@')[0] || null
        const un = user.email ? user.email.split('@')[0] : null
        const av = (user.user_metadata as any)?.avatar_url || null

        setDisplayName(dn)
        setUsername(un)
        setAvatarUrl(av)
      })
      .catch((e) => console.error('Error fetching supabase user:', e))

    return () => { mounted = false }
  }, [])

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

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-card p-8 rounded-lg shadow">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              {avatarUrl ? (
                // use AvatarImage when avatarUrl present
                <AvatarImage src={avatarUrl} />
              ) : (
                <AvatarFallback className="text-4xl">{initials}</AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <span>{displayName ?? 'Your Name'}</span>
                <span title="User has been verified as an SJSU student" className="inline-flex items-center">
                  <BadgeCheck className="w-4 h-4 text-muted-foreground/70" />
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">{username ? `@${username}` : '@username'}</p>

              <p className="mt-4 text-sm text-muted-foreground">
                Insert bio here.
              </p>

              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>No location</span>
              </div>

              <div className="mt-6">
                <Button asChild variant="outline">
                  <Link href="/profile/edit">Edit profile</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* User's listings section */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Your Listings</h3>
            <Link href="/post">
              <Button size="sm">Post a listing</Button>
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading your listings...</p>
          ) : listings.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have no listings yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l as any} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
