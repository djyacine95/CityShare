"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserMenu } from '@/components/auth/user-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function EditProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [displayName, setDisplayName] = useState<string>('')
  const [bio, setBio] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)

    // load auth user metadata
    supabase.auth.getUser()
      .then(({ data: { user }, error }) => {
        if (!mounted) return
        if (user) {
          const dn = (user.user_metadata as any)?.display_name || ''
          const av = (user.user_metadata as any)?.avatar_url || null
          setDisplayName(dn)
          setAvatarUrl(av)
        }
      })
      .catch((e) => console.error('Error fetching supabase user:', e))

    // load profile row
    fetch('/api/profile/me')
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return
        const p = data.profile
        if (p) {
          setBio(p.bio || '')
          setLocation(p.location || '')
          // prefer profile displayName if present
          if (p.displayName) setDisplayName(p.displayName)
          if (p.avatarUrl) setAvatarUrl(p.avatarUrl)
        }
      })
      .catch((e) => console.error('Error loading profile row:', e))
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      // update supabase auth user metadata
      const { error: supaErr } = await supabase.auth.updateUser({ data: { display_name: displayName, avatar_url: avatarUrl } })
      if (supaErr) throw supaErr

      // update profile in DB
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, bio, location, avatarUrl }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Failed to save profile')
      }

      router.push('/profile')
    } catch (e: any) {
      console.error('Save error', e)
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]

    // basic validation (match upload API)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const maxSize = 5 * 1024 * 1024
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type')
      return
    }
    if (file.size > maxSize) {
      setError('File too large (max 5MB)')
      return
    }

    setUploadingAvatar(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('files', file)
      // Upload avatars into a dedicated folder
      formData.append('folder', 'avatars')

      const response = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Upload failed')
      }
      const data = await response.json()
      const url = data.urls?.[0]
      if (!url) throw new Error('No URL returned from upload')
      setAvatarUrl(url)
    } catch (e: any) {
      console.error('Avatar upload error', e)
      setError(e?.message || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/images/Logo.png" alt="CityShare Logo" width={40} height={40} className="object-contain" />
              <h1 className="text-2xl font-bold">CityShare</h1>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-card p-8 rounded-lg shadow">
          <div className="flex items-start gap-6">
            <div>
              <label htmlFor="avatar-upload" className="block cursor-pointer">
                <Avatar className="h-24 w-24">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} />
                  ) : (
                    <AvatarFallback className="text-4xl">{displayName?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                  )}
                </Avatar>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarFile(e.target.files)}
                />
              </label>
              <div className="mt-2 text-xs text-muted-foreground">
                {uploadingAvatar ? 'Uploading...' : 'Click image to upload'}
              </div>
            </div>

            <div className="flex-1">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Display name</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>

                <div>
                  <Label>Bio</Label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} />
                </div>

                <div>
                  <Label>Location</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <Button onClick={handleSave} disabled={saving || loading}>
                    {saving ? 'Saving...' : 'Save changes'}
                  </Button>
                  <Link href="/profile">
                    <Button variant="ghost">Cancel</Button>
                  </Link>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
