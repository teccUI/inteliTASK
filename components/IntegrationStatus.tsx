"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, AlertTriangle, Settings } from "lucide-react"
import Link from "next/link"

interface HealthStatus {
  status: string
  services: {
    [key: string]: {
      status: string
      message: string
    }
  }
}

export default function IntegrationStatus() {
  const [health, setHealth] = useState<HealthStatus | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch("/api/health")
        const data = await response.json()
        setHealth(data)
      } catch (error) {
        console.error("Health check failed:", error)
      }
    }

    checkHealth()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    }
  }

  const getOverallStatus = () => {
    if (!health) return "unknown"
    const services = Object.values(health.services)
    const hasErrors = services.some((s) => s.status === "error")
    const hasWarnings = services.some((s) => s.status === "warning")

    if (hasErrors) return "error"
    if (hasWarnings) return "warning"
    return "healthy"
  }

  const overallStatus = getOverallStatus()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center">
            {getStatusIcon(overallStatus)}
            <span className="ml-2">System Status</span>
          </CardTitle>
          <Link href="/integrations">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {health?.services &&
            Object.entries(health.services)
              .slice(0, 3)
              .map(([service, details]) => (
                <div key={service} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{service}</span>
                  <Badge variant={details.status === "healthy" ? "default" : "destructive"} className="text-xs">
                    {details.status === "healthy" ? "✓" : "✗"}
                  </Badge>
                </div>
              ))}
          <div className="pt-2">
            <Link href="/integrations">
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                View All Tests
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
