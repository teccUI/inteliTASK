import { type NextRequest, NextResponse } from "next/server"
import { adminDb, messaging } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user's task statistics for the week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const tasksRef = adminDb.collection("tasks")
    const querySnapshot = await tasksRef.where("userId", "==", userId).where("createdAt", ">=", weekAgo).get()

    const weekTasks = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    const completedTasks = weekTasks.filter((task) => task.completed)
    const totalTasks = weekTasks.length

    // Get user's FCM token
    const userRef = adminDb.collection("users").doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()
    const fcmToken = userData?.fcmToken

    if (!fcmToken) {
      return NextResponse.json({ error: "User has no FCM token registered" }, { status: 400 })
    }

    // Send weekly digest notification
    const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0

    const message = {
      notification: {
        title: "Weekly Digest",
        body: `This week: ${completedTasks.length}/${totalTasks} tasks completed (${completionRate}%)`,
      },
      data: {
        type: "weekly_digest",
        completedTasks: completedTasks.length.toString(),
        totalTasks: totalTasks.toString(),
        completionRate: completionRate.toString(),
      },
      token: fcmToken,
    }

    const response = await messaging.send(message)

    return NextResponse.json({
      success: true,
      messageId: response,
      stats: {
        completedTasks: completedTasks.length,
        totalTasks,
        completionRate,
      },
    })
  } catch (error) {
    console.error("Error sending weekly digest:", error)
    return NextResponse.json({ error: "Failed to send digest" }, { status: 500 })
  }
}
