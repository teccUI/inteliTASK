import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase-admin"
import { Timestamp } from "firebase-admin/firestore"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const period = searchParams.get("period") || "week" // week, month, year

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const dateFilter = new Date()
    switch (period) {
      case "week":
        dateFilter.setDate(dateFilter.getDate() - 7)
        break
      case "month":
        dateFilter.setMonth(dateFilter.getMonth() - 1)
        break
      case "year":
        dateFilter.setFullYear(dateFilter.getFullYear() - 1)
        break
    }

    const tasksRef = db.collection("tasks")
    const userTasksQuery = tasksRef.where("userId", "==", userId)
    
    // Get all tasks for the user
    const allTasksSnapshot = await userTasksQuery.get()
    const allTasks = allTasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Calculate basic metrics
    const totalTasks = allTasks.length
    const completedTasks = allTasks.filter(task => task.completed).length
    const pendingTasks = allTasks.filter(task => !task.completed).length
    
    // Calculate overdue tasks
    const today = new Date().toISOString().split("T")[0]
    const overdueTasks = allTasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      task.dueDate < today
    ).length

    // Calculate period-specific metrics
    const periodTasks = allTasks.filter(task => {
      const taskDate = task.createdAt?.toDate ? task.createdAt.toDate() : new Date(task.createdAt)
      return taskDate >= dateFilter
    })
    
    const completedThisPeriod = allTasks.filter(task => {
      if (!task.completed) return false
      const taskDate = task.updatedAt?.toDate ? task.updatedAt.toDate() : new Date(task.updatedAt)
      return taskDate >= dateFilter
    }).length

    // Generate trend data (group completed tasks by date)
    const completedTasksInPeriod = allTasks.filter(task => {
      if (!task.completed) return false
      const taskDate = task.updatedAt?.toDate ? task.updatedAt.toDate() : new Date(task.updatedAt)
      return taskDate >= dateFilter
    })

    const trendData = completedTasksInPeriod.reduce((acc, task) => {
      const taskDate = task.updatedAt?.toDate ? task.updatedAt.toDate() : new Date(task.updatedAt)
      const dateKey = taskDate.toISOString().split("T")[0]
      
      const existing = acc.find(item => item._id === dateKey)
      if (existing) {
        existing.count += 1
      } else {
        acc.push({ _id: dateKey, count: 1 })
      }
      return acc
    }, [])

    // Sort trend data by date
    trendData.sort((a, b) => a._id.localeCompare(b._id))

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    return NextResponse.json({
      overview: {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate: Math.round(completionRate),
      },
      period: {
        tasksCreated: periodTasks.length,
        tasksCompleted: completedThisPeriod,
        period,
      },
      trend: trendData,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
