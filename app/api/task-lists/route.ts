import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 })
    }

    const taskListsRef = adminDb.collection("taskLists")
    const querySnapshot = await taskListsRef.where("userId", "==", uid).get()

    const lists = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json(lists)
  } catch (error) {
    console.error("Error fetching task lists:", error)
    return NextResponse.json({ error: "Failed to fetch task lists" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const listData = await request.json()

    if (!listData.name || !listData.userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const taskListsRef = adminDb.collection("taskLists")
    const docRef = await taskListsRef.add({
      ...listData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      id: docRef.id,
      ...listData,
    })
  } catch (error) {
    console.error("Error creating task list:", error)
    return NextResponse.json({ error: "Failed to create task list" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const taskListRef = adminDb.collection("taskLists").doc(id)
    const doc = await taskListRef.get()

    if (!doc.exists) {
      return NextResponse.json({ error: "Task list not found" }, { status: 404 })
    }

    await taskListRef.update({
      ...updateData,
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating task list:", error)
    return NextResponse.json({ error: "Failed to update task list" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const taskListRef = adminDb.collection("taskLists").doc(id)
    const doc = await taskListRef.get()

    if (!doc.exists) {
      return NextResponse.json({ error: "Task list not found" }, { status: 404 })
    }

    await taskListRef.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task list:", error)
    return NextResponse.json({ error: "Failed to delete task list" }, { status: 500 })
  }
}
