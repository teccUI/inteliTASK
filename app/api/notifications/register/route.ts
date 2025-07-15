import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { userId, token } = await request.json()

    if (!userId || !token) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("intellitask")
    const users = db.collection("users")

    // Add token to user's FCM tokens array (avoid duplicates)
    await users.updateOne(
      { uid: userId },
      {
        $addToSet: { fcmTokens: token },
        $set: { updatedAt: new Date() },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("FCM token registration error:", error)
    return NextResponse.json({ error: "Failed to register token" }, { status: 500 })
  }
}
