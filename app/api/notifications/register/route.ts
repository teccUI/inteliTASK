import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const { userId, token } = await request.json()

    if (!userId || !token) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const userRef = adminDb.collection("users").doc(userId)
    const doc = await userRef.get()

    if (!doc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await userRef.update({
      fcmToken: token,
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error registering FCM token:", error)
    return NextResponse.json({ error: "Failed to register token" }, { status: 500 })
  }
}
