import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listId = searchParams.get("listId")
    const uid = searchParams.get("uid")

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 })
    }

    const tasksRef = adminDb.collection("tasks")
    let query = tasksRef.where("userId", "==", uid)

    if (listId) {
      query = query.where("listId", "==", listId)
    }

    const querySnapshot = await query.get()

    const taskList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json(taskList)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const taskData = await request.json()

    if (!taskData.title || !taskData.userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const tasksRef = adminDb.collection("tasks")
    const docRef = await tasksRef.add({
      ...taskData,
      completed: taskData.completed || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      id: docRef.id,
      ...taskData,
    })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const taskRef = adminDb.collection("tasks").doc(id)
    const doc = await taskRef.get()

    if (!doc.exists) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    await taskRef.update({
      ...updateData,
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const taskRef = adminDb.collection("tasks").doc(id)
    const doc = await taskRef.get()

    if (!doc.exists) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    await taskRef.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
