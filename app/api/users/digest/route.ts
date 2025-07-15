import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { messaging } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    const client = await clientPromise
    const db = client.db("intellitask")
    const tasks = db.collection("tasks")
    const users = db.collection("users")

    // Get user's weekly stats
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [completedThisWeek, totalTasks, user] = await Promise.all([
      tasks.countDocuments({
        userId,
        completed: true,
        updatedAt: { $gte: weekAgo },
      }),
      tasks.countDocuments({ userId }),
      users.findOne({ uid: userId }),
    ])

    const pendingTasks = await tasks.countDocuments({
      userId,
      completed: false,
    })

    if (user && user.fcmTokens && user.fcmTokens.length > 0) {
      const message = {
        notification: {
          title: "Weekly Progress Report",
          body: `You completed ${completedThisWeek} tasks this week! ${pendingTasks} tasks remaining.`,
        },
        data: {
          type: "weekly_digest",
          completedThisWeek: completedThisWeek.toString(),
          pendingTasks: pendingTasks.toString(),
        },
        tokens: user.fcmTokens,
      }

      const response = await messaging.sendEachForMulticast(message)

      return NextResponse.json({
        success: true,
        digestSent: response.successCount > 0,
        stats: {
          completedThisWeek,
          pendingTasks,
          totalTasks,
        },
      })
    }

    return NextResponse.json({ error: "No FCM tokens found" }, { status: 404 })
  } catch (error) {
    console.error("Weekly digest error:", error)
    return NextResponse.json({ error: "Failed to send digest" }, { status: 500 })
  }
}
