// app/task-lists/route.ts - CORRECTED VERSION

import { type NextRequest, NextResponse } from "next/server"
// --- 1. CHANGE THIS IMPORT ---
import { db as adminDb } from "@/lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")
    const id = searchParams.get("id")

    // If requesting a specific task list by ID (for shared lists)
    if (id) {
      const docRef = adminDb.collection("taskLists").doc(id)
      const docSnapshot = await docRef.get()
      
      if (!docSnapshot.exists) {
        return NextResponse.json({ error: "Task list not found" }, { status: 404 })
      }

      return NextResponse.json([{
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }])
    }

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 })
    }

    // --- 2. CHANGE THE SYNTAX ---
    const querySnapshot = await adminDb
      .collection("taskLists")
      .where("userId", "==", uid)
      .get()

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
    
    // --- 2. CHANGE THE SYNTAX ---
    const docRef = await adminDb.collection("taskLists").add({
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

    // --- 2. CHANGE THE SYNTAX ---
    const taskListRef = adminDb.collection("taskLists").doc(id)

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

    // --- 2. CHANGE THE SYNTAX ---
    await adminDb.collection("taskLists").doc(id).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task list:", error)
    return NextResponse.json({ error: "Failed to delete task list" }, { status: 500 })
  }
}