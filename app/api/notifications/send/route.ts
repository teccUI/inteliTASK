import { type NextRequest, NextResponse } from "next/server"
import { messaging, adminDb } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, data } = await request.json()

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
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

    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token: fcmToken,
    }

    const response = await messaging.send(message)

    return NextResponse.json({ success: true, messageId: response })
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
