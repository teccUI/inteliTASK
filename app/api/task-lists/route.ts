import { type NextRequest, NextResponse } from "next/server"
import { auth, db } from "@/lib/firebase"
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 })
    }

    const taskListsCollection = collection(db, "taskLists")
    const q = query(taskListsCollection, where("userId", "==", uid))
    const querySnapshot = await getDocs(q)

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
    const taskListsCollection = collection(db, "taskLists")

    const docRef = await addDoc(taskListsCollection, {
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
    const taskListRef = doc(db, "taskLists", id)

    await updateDoc(taskListRef, {
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

    const taskListRef = doc(db, "taskLists", id)
    await deleteDoc(taskListRef)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task list:", error)
    return NextResponse.json({ error: "Failed to delete task list" }, { status: 500 })
  }
}
