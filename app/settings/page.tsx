"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    taskReminders: boolean
    weeklyDigest: boolean
  }
  appearance: {
    theme: "light" | "dark" | "system"
    language: string
  }
  privacy: {
    shareAnalytics: boolean
    publicProfile: boolean
  }
  integrations: {
    googleCalendar: boolean
    emailSync: boolean
  }
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      fetchSettings()
    }
  }, [user])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users/settings?userId=${user?.uid}`)
      if (!response.ok) {
        throw new Error("Failed to fetch settings")
      }
      const data = await response.json()
      setSettings(data.settings)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load settings.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationChange = (category: keyof UserSettings["notifications"], value: boolean) => {
    setSettings((prev) => {
      if (!prev) return null
      return {
        ...prev,
        notifications: {
          ...prev.notifications,
          [category]: value,
        },
      }
    })
  }

  const handleAppearanceChange = (category: keyof UserSettings["appearance"], value: string) => {
    setSettings((prev) => {
      if (!prev) return null
      return {
        ...prev,
        appearance: {
          ...prev.appearance,
          [category]: value,
        },
      }
    })
  }

  const handlePrivacyChange = (category: keyof UserSettings["privacy"], value: boolean) => {
    setSettings((prev) => {
      if (!prev) return null
      return {
        ...prev,
        privacy: {
          ...prev.privacy,
          [category]: value,
        },
      }
    })
  }

  const saveSettings = async () => {
    if (!user || !settings) return

    setSaving(true)
    try {
      const response = await fetch("/api/users/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.uid, settings }),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      toast({
        title: "Settings Saved",
        description: "Your settings have been updated.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage your notification preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <Switch
              id="email-notifications"
              checked={settings?.notifications.email || false}
              onCheckedChange={(checked) => handleNotificationChange("email", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications">Push Notifications</Label>
            <Switch
              id="push-notifications"
              checked={settings?.notifications.push || false}
              onCheckedChange={(checked) => handleNotificationChange("push", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="task-reminders">Task Reminders</Label>
            <Switch
              id="task-reminders"
              checked={settings?.notifications.taskReminders || false}
              onCheckedChange={(checked) => handleNotificationChange("taskReminders", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="weekly-digest">Weekly Digest</Label>
            <Switch
              id="weekly-digest"
              checked={settings?.notifications.weeklyDigest || false}
              onCheckedChange={(checked) => handleNotificationChange("weeklyDigest", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={settings?.appearance.theme || "system"}
              onValueChange={(value: "light" | "dark" | "system") => handleAppearanceChange("theme", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="language">Language</Label>
            <Select
              value={settings?.appearance.language || "en"}
              onValueChange={(value) => handleAppearanceChange("language", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Manage your privacy settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="share-analytics">Share Analytics Data</Label>
            <Switch
              id="share-analytics"
              checked={settings?.privacy.shareAnalytics || false}
              onCheckedChange={(checked) => handlePrivacyChange("shareAnalytics", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="public-profile">Public Profile</Label>
            <Switch
              id="public-profile"
              checked={settings?.privacy.publicProfile || false}
              onCheckedChange={(checked) => handlePrivacyChange("publicProfile", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
