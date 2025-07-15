import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()

    if (!userData.uid || !userData.email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const userRef = adminDb.collection("users").doc(userData.uid)

    // Check if user already exists
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      await userRef.set({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 })
    }

    const userRef = adminDb.collection("users").doc(uid)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ id: userDoc.id, ...userDoc.data() })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
