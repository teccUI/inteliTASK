"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface AnalyticsOverview {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  completionRate: number
}

interface AnalyticsPeriod {
  tasksCreated: number
  tasksCompleted: number
  period: string
}

interface AnalyticsTrend {
  _id: string
  count: number
}

interface AnalyticsData {
  overview: AnalyticsOverview
  period: AnalyticsPeriod
  trend: AnalyticsTrend[]
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return

      try {
        const response = await fetch(`/api/analytics?userId=${user.uid}`)
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user])

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Statistics</h1>
        <p>No analytics data available.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Statistics</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalTasks}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.completionRate}% completion rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">Active tasks</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>This {analytics.period.period === 'week' ? 'Week' : analytics.period.period === 'month' ? 'Month' : 'Year'}</CardTitle>
            <CardDescription>Tasks created this {analytics.period.period}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.period.tasksCreated}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Completed This {analytics.period.period === 'week' ? 'Week' : analytics.period.period === 'month' ? 'Month' : 'Year'}</CardTitle>
            <CardDescription>Tasks completed this {analytics.period.period}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.period.tasksCompleted}</div>
          </CardContent>
        </Card>
      </div>

      {analytics.trend.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Completion Trend</CardTitle>
              <CardDescription>Tasks completed over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.trend.map((day) => (
                  <div key={day._id} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{day._id}</span>
                    <span className="font-medium">{day.count} tasks</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}