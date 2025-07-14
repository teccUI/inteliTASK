import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import clientPromise from "@/lib/mongodb"

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/calendar/callback`,
)

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken, userId } = await request.json()

    if (!accessToken || !userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Set credentials
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    const calendar = google.calendar({ version: "v3", auth: oauth2Client })

    // Get user's tasks from MongoDB
    const client = await clientPromise
    const db = client.db("intellitask")
    const tasks = db.collection("tasks")

    const userTasks = await tasks.find({ userId, completed: false }).toArray()

    // Sync tasks to Google Calendar
    const syncResults = []

    for (const task of userTasks) {
      if (task.dueDate && !task.calendarEventId) {
        try {
          const event = {
            summary: task.title,
            description: task.description,
            start: {
              dateTime: new Date(task.dueDate).toISOString(),
              timeZone: "UTC",
            },
            end: {
              dateTime: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
              timeZone: "UTC",
            },
            reminders: {
              useDefault: false,
              overrides: [
                { method: "email", minutes: 24 * 60 }, // 1 day before
                { method: "popup", minutes: 60 }, // 1 hour before
              ],
            },
          }

          const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: event,
          })

          // Update task with calendar event ID
          await tasks.updateOne(
            { _id: task._id },
            {
              $set: {
                calendarEventId: response.data.id,
                updatedAt: new Date(),
              },
            },
          )

          syncResults.push({
            taskId: task._id,
            eventId: response.data.id,
            status: "synced",
          })
        } catch (error) {
          console.error(`Error syncing task ${task._id}:`, error)
          syncResults.push({
            taskId: task._id,
            status: "error",
            error: error.message,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      syncedTasks: syncResults.length,
      results: syncResults,
    })
  } catch (error) {
    console.error("Calendar sync error:", error)
    return NextResponse.json({ error: "Failed to sync calendar" }, { status: 500 })
  }
}
