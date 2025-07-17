import { type NextRequest, NextResponse } from "next/server"
import { db, messaging } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    const tasksCollection = db.collection("tasks")
    const usersCollection = db.collection("users")

    // Get user's weekly stats
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [completedThisWeekSnapshot, totalTasksSnapshot, userDoc] = await Promise.all([
      tasksCollection
        .where("userId", "==", userId)
        .where("completed", "==", true)
        .where("updatedAt", ">=", weekAgo)
        .get(),
      tasksCollection
        .where("userId", "==", userId)
        .get(),
      usersCollection.doc(userId).get(),
    ])

    const pendingTasksSnapshot = await tasksCollection
      .where("userId", "==", userId)
      .where("completed", "==", false)
      .get()

    const completedThisWeek = completedThisWeekSnapshot.size
    const totalTasks = totalTasksSnapshot.size
    const pendingTasks = pendingTasksSnapshot.size

    if (userDoc.exists) {
      const user = userDoc.data()
      
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
      }

    return NextResponse.json({ error: "No FCM tokens found" }, { status: 404 })
  } catch (error) {
    console.error("Weekly digest error:", error)
    return NextResponse.json({ error: "Failed to send digest" }, { status: 500 })
  }
}
