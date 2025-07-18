import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const userRef = db.collection("users").doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()
    const settings = userData?.settings || {
      notifications: {
        email: true,
        push: false,
        taskReminders: true,
        weeklyDigest: true,
      },
      appearance: {
        theme: "light",
        language: "en",
      },
      privacy: {
        shareAnalytics: false,
        publicProfile: false,
      },
      integrations: {
        googleCalendar: false,
        emailSync: false,
      },
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error fetching user settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, settings } = await request.json()

    if (!userId || !settings) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const userRef = db.collection("users").doc(userId)

    await userRef.update({
      settings,
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
