import { type NextRequest, NextResponse } from "next/server";
import { db as adminDb } from "@/lib/firebase-admin";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const updateData = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Task ID is required for update" }, { status: 400 });
    }

    // Use the Admin SDK syntax for updating documents
    const taskRef = adminDb.collection("tasks").doc(id);

    await taskRef.update({
      ...updateData,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}