"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface UserProfile {
  uid: string
  email: string
  name: string
  avatar?: string
  createdAt: string
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")

  useEffect(() => {
    if (!authLoading && user) {
      fetchProfile()
    }
  }, [user, authLoading])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users?uid=${user?.uid}`)
      if (!response.ok) {
        throw new Error("Failed to fetch profile")
      }
      const data = await response.json()
      setProfile(data)
      setName(data.name || "")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load profile.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return

    setSaving(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST", // Using POST for update as per previous API design
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid: user.uid, name, email: user.email }), // Only updating name for now
      })

      if (!response.ok) {
        throw new Error("Failed to save profile")
      }

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved.",
      })
      fetchProfile() // Re-fetch to ensure data consistency
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold">Profile Not Found</h2>
        <p className="mt-2 text-muted-foreground">Please ensure you are logged in.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Profile Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Public Profile</CardTitle>
          <CardDescription>This information will be displayed publicly.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar || "/placeholder-user.jpg"} alt={profile.name || "User Avatar"} />
                <AvatarFallback>{profile.name ? profile.name[0] : "U"}</AvatarFallback>
              </Avatar>
              <div className="grid gap-1.5">
                <h3 className="text-lg font-semibold">{profile.name}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                {/* Add button to change avatar if desired */}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                required
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
