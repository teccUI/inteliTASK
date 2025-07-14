"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Target } from "lucide-react"

interface HealthStatus {
  timestamp: string
  status: string
  services: {
    [key: string]: {
      status: string
      message: string
    }
  }
  environment: {
    [key: string]: boolean | string
  }
}

export default function SetupPage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchHealthStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/health")
      const data = await response.json()
      setHealthStatus(data)
    } catch (error) {
      console.error("Failed to fetch health status:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthStatus()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking system health...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">IntelliTask Setup</h1>
          </div>
          <Button onClick={fetchHealthStatus} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    {healthStatus && getStatusIcon(healthStatus.status)}
                    <span>System Status</span>
                  </CardTitle>
                  <CardDescription>
                    Last checked: {healthStatus ? new Date(healthStatus.timestamp).toLocaleString() : "Never"}
                  </CardDescription>
                </div>
                {healthStatus && getStatusBadge(healthStatus.status)}
              </div>
            </CardHeader>
          </Card>

          {/* Services Status */}
          <Card>
            <CardHeader>
              <CardTitle>Services Health Check</CardTitle>
              <CardDescription>Status of all integrated services and APIs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {healthStatus?.services &&
                Object.entries(healthStatus.services).map(([service, details]) => (
                  <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(details.status)}
                      <div>
                        <h4 className="font-medium capitalize">{service.replace(/([A-Z])/g, " $1").trim()}</h4>
                        <p className="text-sm text-gray-500">{details.message}</p>
                      </div>
                    </div>
                    {getStatusBadge(details.status)}
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Environment Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Configuration</CardTitle>
              <CardDescription>Configuration status of environment variables and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {healthStatus?.environment &&
                Object.entries(healthStatus.environment).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {typeof value === "boolean" ? (
                        value ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      )}
                      <div>
                        <h4 className="font-medium">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())
                            .trim()}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {typeof value === "boolean" ? (value ? "Configured" : "Not configured") : String(value)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={typeof value === "boolean" ? (value ? "default" : "destructive") : "secondary"}>
                      {typeof value === "boolean" ? (value ? "✓" : "✗") : String(value)}
                    </Badge>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
              <CardDescription>Follow these steps to complete your IntelliTask setup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Create .env.local file</h4>
                    <p className="text-sm text-gray-500">
                      Copy the .env.example file to .env.local and fill in all the required values
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Install Dependencies</h4>
                    <p className="text-sm text-gray-500">Run `npm install` to install all required packages</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Start Development Server</h4>
                    <p className="text-sm text-gray-500">Run `npm run dev` to start the application</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-medium">Ready to Use!</h4>
                    <p className="text-sm text-gray-500">
                      Your IntelliTask application is ready. Visit{" "}
                      <a href="/" className="text-blue-600 hover:underline">
                        the dashboard
                      </a>{" "}
                      to get started.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
