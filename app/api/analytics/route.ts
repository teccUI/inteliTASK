import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const period = searchParams.get("period") || "week" // week, month, year

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Calculate date range based on period
    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate.setMonth(now.getMonth() - 1)
        break
      case "year":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Get tasks for the period
    const tasksRef = adminDb.collection("tasks")
    const querySnapshot = await tasksRef.where("userId", "==", userId).where("createdAt", ">=", startDate).get()

    const tasks = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    // Calculate analytics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.completed).length
    const pendingTasks = totalTasks - completedTasks
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Tasks by list
    const tasksByList = tasks.reduce((acc, task) => {
      const listId = task.listId || "uncategorized"
      acc[listId] = (acc[listId] || 0) + 1
      return acc
    }, {})

    // Tasks by day (for charts)
    const tasksByDay = tasks.reduce((acc, task) => {
      const date = new Date(task.createdAt.toDate()).toISOString().split("T")[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    const analytics = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      summary: {
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate,
      },
      breakdown: {
        tasksByList,
        tasksByDay,
      },
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
