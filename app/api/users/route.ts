import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("intellitask")
    const users = db.collection("users")

    const userData = await request.json()

    // Check if user already exists
    const existingUser = await users.findOne({ uid: userData.uid })

    if (!existingUser) {
      await users.insertOne({
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

    const client = await clientPromise
    const db = client.db("intellitask")
    const users = db.collection("users")

    const user = await users.findOne({ uid })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
