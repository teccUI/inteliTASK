"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    taskReminders: boolean
    weeklyDigest: boolean
  }
  integrations: {
    googleCalendar: boolean
    emailSync: boolean
  }
}

export default function IntegrationsPage() {
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

  const handleSettingChange = (category: keyof UserSettings["integrations"], value: boolean) => {
    setSettings((prev) => {
      if (!prev) return null
      return {
        ...prev,
        integrations: {
          ...prev.integrations,
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
        description: "Your integration settings have been updated.",
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

  const handleGoogleCalendarConnect = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/calendar/auth?userId=${user.uid}`)
      if (!response.ok) {
        throw new Error("Failed to get Google Auth URL")
      }
      const data = await response.json()
      window.location.href = data.authUrl
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate Google Calendar connection.",
        variant: "destructive",
      })
    }
  }

  const handleGoogleCalendarSync = async () => {
    if (!user) return

    try {
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.uid }),
      })

      if (!response.ok) {
        throw new Error("Failed to sync Google Calendar")
      }

      const data = await response.json()
      toast({
        title: "Calendar Sync Complete",
        description: `Successfully synced ${data.syncedTasks} tasks to Google Calendar.`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sync Google Calendar.",
        variant: "destructive",
      })
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
      <h1 className="mb-6 text-3xl font-bold">Integrations</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
          <CardDescription>Connect and sync your tasks with Google Calendar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="google-calendar-toggle">Enable Google Calendar Sync</Label>
            <Switch
              id="google-calendar-toggle"
              checked={settings?.integrations.googleCalendar || false}
              onCheckedChange={(checked) => handleSettingChange("googleCalendar", checked)}
            />
          </div>
          {settings?.integrations.googleCalendar && (
            <div className="flex flex-col gap-2">
              <Button onClick={handleGoogleCalendarConnect}>Connect Google Account</Button>
              <Button onClick={handleGoogleCalendarSync} variant="outline">
                Sync Tasks Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Email Sync</CardTitle>
          <CardDescription>Integrate with your email to create tasks from emails.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-sync-toggle">Enable Email Sync</Label>
            <Switch
              id="email-sync-toggle"
              checked={settings?.integrations.emailSync || false}
              onCheckedChange={(checked) => handleSettingChange("emailSync", checked)}
              disabled // Feature not yet implemented
            />
          </div>
          {settings?.integrations.emailSync && (
            <p className="text-sm text-muted-foreground">Email sync feature coming soon!</p>
          )}
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
