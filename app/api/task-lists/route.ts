import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("intellitask")
    const taskLists = db.collection("taskLists")

    const lists = await taskLists.find({ userId: uid }).toArray()

    return NextResponse.json(lists)
  } catch (error) {
    console.error("Error fetching task lists:", error)
    return NextResponse.json({ error: "Failed to fetch task lists" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("intellitask")
    const taskLists = db.collection("taskLists")

    const listData = await request.json()

    const result = await taskLists.insertOne({
      ...listData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      id: result.insertedId,
      ...listData,
    })
  } catch (error) {
    console.error("Error creating task list:", error)
    return NextResponse.json({ error: "Failed to create task list" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("intellitask")
    const taskLists = db.collection("taskLists")

    const { id, ...updateData } = await request.json()

    const result = await taskLists.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Task list not found" }, { status: 404 })
    }

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

    const client = await clientPromise
    const db = client.db("intellitask")
    const taskLists = db.collection("taskLists")

    const result = await taskLists.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Task list not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task list:", error)
    return NextResponse.json({ error: "Failed to delete task list" }, { status: 500 })
  }
}
