import { NextResponse } from "next/server"
import { db, messaging } from "@/lib/firebase-admin"

export async function POST() {
  try {
    const tasksCollection = db.collection("tasks")
    const usersCollection = db.collection("users")

    // Get tasks due in the next 24 hours
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const upcomingTasksSnapshot = await tasksCollection
      .where("dueDate", ">=", new Date().toISOString().split("T")[0])
      .where("dueDate", "<=", tomorrow.toISOString().split("T")[0])
      .where("completed", "==", false)
      .get()

    const reminderResults = []

    for (const taskDoc of upcomingTasksSnapshot.docs) {
      const taskData = taskDoc.data()
      const task = { id: taskDoc.id, ...taskData }
      const userDoc = await usersCollection.doc(taskData.userId).get()

      if (userDoc.exists) {
        const user = userDoc.data()
        
        if (user && user.fcmTokens && user.fcmTokens.length > 0) {
          const message = {
            notification: {
              title: "Task Reminder",
              body: `Don't forget: ${taskData.title} is due soon!`,
            },
            data: {
              taskId: task.id,
              type: "reminder",
            },
            tokens: user.fcmTokens,
          }

          try {
            const response = await messaging.sendEachForMulticast(message)
            reminderResults.push({
              taskId: task.id,
              userId: taskData.userId,
              success: response.successCount,
              failed: response.failureCount,
            })
          } catch (error) {
            console.error(`Failed to send reminder for task ${task.id}:`, error)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      remindersProcessed: reminderResults.length,
      results: reminderResults,
    })
  } catch (error) {
    console.error("Task reminder error:", error)
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 })
  }
}
