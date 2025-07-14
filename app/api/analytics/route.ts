import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const period = searchParams.get("period") || "week" // week, month, year

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("intellitask")
    const tasks = db.collection("tasks")

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

    const [totalTasks, completedTasks, pendingTasks, overdueTasks, tasksThisPeriod, completedThisPeriod] =
      await Promise.all([
        tasks.countDocuments({ userId }),
        tasks.countDocuments({ userId, completed: true }),
        tasks.countDocuments({ userId, completed: false }),
        tasks.countDocuments({
          userId,
          completed: false,
          dueDate: { $lt: new Date().toISOString().split("T")[0] },
        }),
        tasks.countDocuments({
          userId,
          createdAt: { $gte: dateFilter },
        }),
        tasks.countDocuments({
          userId,
          completed: true,
          updatedAt: { $gte: dateFilter },
        }),
      ])

    // Get task completion trend
    const trendData = await tasks
      .aggregate([
        {
          $match: {
            userId,
            completed: true,
            updatedAt: { $gte: dateFilter },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$updatedAt",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray()

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
        tasksCreated: tasksThisPeriod,
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
