"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import IntegrationStatus from "@/components/IntegrationStatus"

interface HealthCheckResult {
  timestamp: string
  status: "healthy" | "degraded" | "unhealthy"
  services: {
    firebase: { status: string; message: string }
    googleCalendar: { status: string; message: string }
    pushNotifications: { status: string; message: string }
    authentication: { status: string; message: string; details?: unknown }
  }
  environment: {
    nodeEnv: string
    nextAuthConfigured: boolean
    googleClientConfigured: boolean
    vapidConfigured: boolean
  }
}

interface IntegrationTestResult {
  timestamp: string
  overall: "success" | "partial" | "failure"
  tests: {
    firebase: { status: string; message: string; details: unknown }
    googleCalendar: { status: string; message: string; details: unknown }
    pushNotifications: { status: string; message: string; details: unknown }
    authentication: { status: string; message: string; details: unknown }
  }
}

export default function SetupPage() {
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null)
  const [integrationTest, setIntegrationTest] = useState<IntegrationTestResult | null>(null)
  const [loadingHealth, setLoadingHealth] = useState(true)
  const [loadingIntegration, setLoadingIntegration] = useState(false)

  useEffect(() => {
    fetchHealthCheck()
  }, [])

  const fetchHealthCheck = async () => {
    setLoadingHealth(true)
    try {
      const response = await fetch("/api/health")
      const data = await response.json()
      setHealthCheck(data)
    } catch (error) {
      console.error("Failed to fetch health check:", error)
      setHealthCheck(null)
    } finally {
      setLoadingHealth(false)
    }
  }

  const runIntegrationTests = async () => {
    setLoadingIntegration(true)
    try {
      const response = await fetch("/api/integrations/test", { method: "POST" })
      const data = await response.json()
      setIntegrationTest(data)
    } catch (error) {
      console.error("Failed to run integration tests:", error)
      setIntegrationTest(null)
    } finally {
      setLoadingIntegration(false)
    }
  }

  const getStatusIcon = (status: string) => {
    if (status === "healthy" || status === "success") {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else if (status === "warning" || status === "partial") {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Application Setup & Health</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            System Health Check{" "}
            {loadingHealth ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              getStatusIcon(healthCheck?.status || "unknown")
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthCheck ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Last checked: {new Date(healthCheck.timestamp).toLocaleString()}
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <IntegrationStatus
                  name="Firebase Admin SDK"
                  status={healthCheck.services.firebase.status}
                  message={healthCheck.services.firebase.message}
                />
                <IntegrationStatus
                  name="Google Calendar API"
                  status={healthCheck.services.googleCalendar.status}
                  message={healthCheck.services.googleCalendar.message}
                />
                <IntegrationStatus
                  name="Push Notifications"
                  status={healthCheck.services.pushNotifications.status}
                  message={healthCheck.services.pushNotifications.message}
                />
                <IntegrationStatus
                  name="Authentication"
                  status={healthCheck.services.authentication.status}
                  message={healthCheck.services.authentication.message}
                  details={healthCheck.services.authentication.details}
                />
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="text-lg font-semibold">Environment Variables</h3>
                <p className="text-sm">
                  `NEXTAUTH_SECRET`: {healthCheck.environment.nextAuthConfigured ? "Configured" : "Missing"}
                </p>
                <p className="text-sm">
                  `GOOGLE_CLIENT_ID`/`SECRET`:{" "}
                  {healthCheck.environment.googleClientConfigured ? "Configured" : "Missing"}
                </p>
                <p className="text-sm">
                  `NEXT_PUBLIC_VAPID_KEY`: {healthCheck.environment.vapidConfigured ? "Configured" : "Missing"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Failed to load health check data.</p>
          )}
          <Button onClick={fetchHealthCheck} className="mt-4" disabled={loadingHealth}>
            {loadingHealth ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh Health Check
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Integration Tests{" "}
            {loadingIntegration ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              integrationTest && getStatusIcon(integrationTest.overall)
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Run a series of tests to verify external integrations are working.
          </p>
          <Button onClick={runIntegrationTests} className="mt-4" disabled={loadingIntegration}>
            {loadingIntegration ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Run Integration Tests
          </Button>
          {integrationTest && (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Last run: {new Date(integrationTest.timestamp).toLocaleString()}
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <IntegrationStatus
                  name="Firebase Admin SDK Test"
                  status={integrationTest.tests.firebase.status}
                  message={integrationTest.tests.firebase.message}
                  details={integrationTest.tests.firebase.details}
                />
                <IntegrationStatus
                  name="Google Calendar API Test"
                  status={integrationTest.tests.googleCalendar.status}
                  message={integrationTest.tests.googleCalendar.message}
                  details={integrationTest.tests.googleCalendar.details}
                />
                <IntegrationStatus
                  name="Push Notifications Test"
                  status={integrationTest.tests.pushNotifications.status}
                  message={integrationTest.tests.pushNotifications.message}
                  details={integrationTest.tests.pushNotifications.details}
                />
                <IntegrationStatus
                  name="Authentication Test"
                  status={integrationTest.tests.authentication.status}
                  message={integrationTest.tests.authentication.message}
                  details={integrationTest.tests.authentication.details}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
