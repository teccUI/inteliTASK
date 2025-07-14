import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("intellitask")
    const users = db.collection("users")

    const user = await users.findOne({ uid: userId })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      settings: user.settings || {
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
      },
    })
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

    const client = await clientPromise
    const db = client.db("intellitask")
    const users = db.collection("users")

    const result = await users.updateOne(
      { uid: userId },
      {
        $set: {
          settings,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
