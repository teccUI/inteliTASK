import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user's Google Calendar tokens
    const userRef = adminDb.collection("users").doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()
    const tokens = userData?.googleCalendarTokens

    if (!tokens) {
      return NextResponse.json({ error: "Google Calendar not connected" }, { status: 400 })
    }

    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/calendar/callback`,
    )

    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date: tokens.expiryDate,
    })

    const calendar = google.calendar({ version: "v3", auth: oauth2Client })

    // Get user's incomplete tasks with due dates
    const tasksRef = adminDb.collection("tasks")
    const querySnapshot = await tasksRef.where("userId", "==", userId).where("completed", "==", false).get()

    const tasks = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).filter((task) => task.dueDate)

    let syncedTasks = 0

    // Create calendar events for tasks
    for (const task of tasks) {
      try {
        const event = {
          summary: task.title,
          description: task.description || "",
          start: {
            date: task.dueDate,
          },
          end: {
            date: task.dueDate,
          },
        }

        await calendar.events.insert({
          calendarId: "primary",
          requestBody: event,
        })

        syncedTasks++
      } catch (eventError) {
        console.error(`Error creating event for task ${task.id}:`, eventError)
      }
    }

    return NextResponse.json({
      success: true,
      syncedTasks,
      totalTasks: tasks.length,
    })
  } catch (error) {
    console.error("Error syncing calendar:", error)
    return NextResponse.json({ error: "Failed to sync calendar" }, { status: 500 })
  }
}
