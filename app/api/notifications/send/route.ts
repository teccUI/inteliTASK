import { type NextRequest, NextResponse } from "next/server"
import { messaging } from "@/lib/firebase-admin"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, data } = await request.json()

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get user's FCM tokens from MongoDB
    const client = await clientPromise
    const db = client.db("intellitask")
    const users = db.collection("users")

    const user = await users.findOne({ uid: userId })

    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      return NextResponse.json({ error: "No FCM tokens found for user" }, { status: 404 })
    }

    // Skip messaging in development mode
    if (process.env.NODE_ENV === "development" || !messaging) {
      return NextResponse.json({
        success: true,
        successCount: user.fcmTokens.length,
        failureCount: 0,
        note: "Development mode - notification skipped"
      })
    }

    // Send notification to all user's devices
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      tokens: user.fcmTokens,
    }

    const response = await messaging.sendEachForMulticast(message)

    // Remove invalid tokens
    const invalidTokens = []
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        invalidTokens.push(user.fcmTokens[idx])
      }
    })

    if (invalidTokens.length > 0) {
      await users.updateOne(
        { uid: userId },
        {
          $pull: { fcmTokens: { $in: invalidTokens } },
        },
      )
    }

    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    })
  } catch (error) {
    console.error("Push notification error:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
