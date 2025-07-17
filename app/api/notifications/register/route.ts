import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(request: NextRequest) {
  try {
    const { userId, token } = await request.json()

    if (!userId || !token) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Add token to user's FCM tokens array (avoid duplicates)
    await db.collection("users").doc(userId).update({
      fcmTokens: FieldValue.arrayUnion(token),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("FCM token registration error:", error)
    return NextResponse.json({ error: "Failed to register token" }, { status: 500 })
  }
}
