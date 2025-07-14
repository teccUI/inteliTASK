"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Target,
  Database,
  Calendar,
  Bell,
  Shield,
  Flame,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

interface IntegrationTest {
  status: string
  message: string
  details: any
}

interface IntegrationResults {
  timestamp: string
  overall: string
  tests: {
    [key: string]: IntegrationTest
  }
}

export default function IntegrationsPage() {
  const [results, setResults] = useState<IntegrationResults | null>(null)
  const [loading, setLoading] = useState(false)

  const runIntegrationTests = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/integrations/test", {
        method: "POST",
      })
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error("Failed to run integration tests:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runIntegrationTests()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
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
      case "success":
        return <Badge className="bg-green-100 text-green-800">✓ Working</Badge>
      case "error":
        return <Badge variant="destructive">✗ Failed</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">⚠ Partial</Badge>
      default:
        return <Badge variant="secondary">? Unknown</Badge>
    }
  }

  const getServiceIcon = (service: string) => {
    switch (service) {
      case "mongodb":
        return <Database className="w-6 h-6 text-green-600" />
      case "firebase":
        return <Flame className="w-6 h-6 text-orange-600" />
      case "googleCalendar":
        return <Calendar className="w-6 h-6 text-blue-600" />
      case "pushNotifications":
        return <Bell className="w-6 h-6 text-purple-600" />
      case "authentication":
        return <Shield className="w-6 h-6 text-indigo-600" />
      default:
        return <Target className="w-6 h-6 text-gray-600" />
    }
  }

  const getServiceName = (service: string) => {
    const names = {
      mongodb: "MongoDB Database",
      firebase: "Firebase Admin SDK",
      googleCalendar: "Google Calendar API",
      pushNotifications: "Push Notifications",
      authentication: "Authentication System",
    }
    return names[service as keyof typeof names] || service
  }

  const calculateOverallProgress = () => {
    if (!results) return 0
    const tests = Object.values(results.tests)
    const successCount = tests.filter((test) => test.status === "success").length
    return (successCount / tests.length) * 100
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Integration Tests</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    {results && getStatusIcon(results.overall)}
                    <span>Integration Status</span>
                  </CardTitle>
                  <CardDescription>
                    Last tested: {results ? new Date(results.timestamp).toLocaleString() : "Never"}
                  </CardDescription>
                </div>
                <Button onClick={runIntegrationTests} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Testing..." : "Run Tests"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-gray-500">{Math.round(calculateOverallProgress())}%</span>
                </div>
                <Progress value={calculateOverallProgress()} className="h-3" />
                {results && <div className="flex justify-center">{getStatusBadge(results.overall)}</div>}
              </div>
            </CardContent>
          </Card>

          {/* Integration Tests */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results?.tests &&
              Object.entries(results.tests).map(([service, test]) => (
                <Card key={service} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getServiceIcon(service)}
                        <div>
                          <CardTitle className="text-lg">{getServiceName(service)}</CardTitle>
                          <CardDescription className="text-sm">{test.message}</CardDescription>
                        </div>
                      </div>
                      {getStatusIcon(test.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-center">{getStatusBadge(test.status)}</div>

                      {test.details && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Details:</h4>
                          <div className="bg-gray-50 rounded-lg p-3">
                            {typeof test.details === "object" ? (
                              <div className="space-y-1">
                                {Object.entries(test.details).map(([key, value]) => (
                                  <div key={key} className="flex justify-between text-xs">
                                    <span className="text-gray-600 capitalize">
                                      {key.replace(/([A-Z])/g, " $1").trim()}:
                                    </span>
                                    <span
                                      className={`font-medium ${
                                        typeof value === "boolean"
                                          ? value
                                            ? "text-green-600"
                                            : "text-red-600"
                                          : "text-gray-900"
                                      }`}
                                    >
                                      {typeof value === "boolean" ? (value ? "✓" : "✗") : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-600">{String(test.details)}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Integration Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Setup Guide</CardTitle>
              <CardDescription>Follow these steps to ensure all integrations are working correctly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Required Environment Variables</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>MONGODB_URI</span>
                      <Badge variant={process.env.MONGODB_URI ? "default" : "destructive"}>
                        {process.env.MONGODB_URI ? "✓" : "✗"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>GOOGLE_CLIENT_ID</span>
                      <Badge variant={process.env.GOOGLE_CLIENT_ID ? "default" : "destructive"}>
                        {process.env.GOOGLE_CLIENT_ID ? "✓" : "✗"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>NEXTAUTH_SECRET</span>
                      <Badge variant={process.env.NEXTAUTH_SECRET ? "default" : "destructive"}>
                        {process.env.NEXTAUTH_SECRET ? "✓" : "✗"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>NEXT_PUBLIC_VAPID_KEY</span>
                      <Badge variant={process.env.NEXT_PUBLIC_VAPID_KEY ? "default" : "destructive"}>
                        {process.env.NEXT_PUBLIC_VAPID_KEY ? "✓" : "✗"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Quick Fixes</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• Ensure all environment variables are set in .env.local</p>
                    <p>• Verify Firebase Admin SDK key is in lib/firebase-admin-key.json</p>
                    <p>• Check Google Calendar API is enabled in GCP Console</p>
                    <p>• Confirm MongoDB connection string is correct</p>
                    <p>• Restart the development server after changes</p>
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
