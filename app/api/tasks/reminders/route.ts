import { type NextRequest, NextResponse } from "next/server"
import { adminDb, messaging } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user's tasks that are due today or overdue
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tasksRef = adminDb.collection("tasks")
    const querySnapshot = await tasksRef.where("userId", "==", userId).where("completed", "==", false).get()

    const dueTasks = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((task) => {
        if (!task.dueDate) return false
        const dueDate = new Date(task.dueDate)
        dueDate.setHours(0, 0, 0, 0)
        return dueDate <= today
      })

    if (dueTasks.length === 0) {
      return NextResponse.json({ message: "No due tasks found" })
    }

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

    // Send reminder notification
    const message = {
      notification: {
        title: "Task Reminder",
        body: `You have ${dueTasks.length} task(s) due today`,
      },
      data: {
        type: "task_reminder",
        taskCount: dueTasks.length.toString(),
      },
      token: fcmToken,
    }

    const response = await messaging.send(message)

    return NextResponse.json({
      success: true,
      messageId: response,
      remindersSent: dueTasks.length,
    })
  } catch (error) {
    console.error("Error sending task reminders:", error)
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 })
  }
}
