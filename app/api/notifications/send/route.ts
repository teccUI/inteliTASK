import { type NextRequest, NextResponse } from "next/server"
import { messaging, db } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, data } = await request.json()

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get user's FCM tokens from Firebase Firestore
    const userDoc = await db.collection("users").doc(userId).get()
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    const userData = userDoc.data()
    const fcmTokens = userData?.fcmTokens || []

    if (fcmTokens.length === 0) {
      return NextResponse.json({ error: "No FCM tokens found for user" }, { status: 404 })
    }

    // Send notification to all user's devices
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      tokens: fcmTokens,
    }

    const response = await messaging.sendEachForMulticast(message)

    // Remove invalid tokens
    const invalidTokens: string[] = []
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        invalidTokens.push(fcmTokens[idx])
      }
    })

    if (invalidTokens.length > 0) {
      await db.collection("users").doc(userId).update({
        fcmTokens: FieldValue.arrayRemove(...invalidTokens)
      })
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
