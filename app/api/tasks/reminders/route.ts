import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { messaging } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("intellitask")
    const tasks = db.collection("tasks")
    const users = db.collection("users")

    // Get tasks due in the next 24 hours
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const upcomingTasks = await tasks
      .find({
        dueDate: {
          $gte: new Date().toISOString().split("T")[0],
          $lte: tomorrow.toISOString().split("T")[0],
        },
        completed: false,
      })
      .toArray()

    const reminderResults = []

    // Skip messaging in development mode
    if (process.env.NODE_ENV === "development" || !messaging) {
      return NextResponse.json({
        success: true,
        remindersProcessed: upcomingTasks.length,
        results: upcomingTasks.map(task => ({
          taskId: task.id,
          userId: task.userId,
          success: 1,
          failed: 0,
          note: "Development mode - notifications skipped"
        })),
      })
    }

    for (const task of upcomingTasks) {
      const user = await users.findOne({ uid: task.userId })

      if (user && user.fcmTokens && user.fcmTokens.length > 0) {
        const message = {
          notification: {
            title: "Task Reminder",
            body: `Don't forget: ${task.title} is due soon!`,
          },
          data: {
            taskId: task.id.toString(),
            type: "reminder",
          },
          tokens: user.fcmTokens,
        }

        try {
          const response = await messaging.sendEachForMulticast(message)
          reminderResults.push({
            taskId: task.id,
            userId: task.userId,
            success: response.successCount,
            failed: response.failureCount,
          })
        } catch (error) {
          console.error(`Failed to send reminder for task ${task.id}:`, error)
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
