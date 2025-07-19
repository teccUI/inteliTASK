import { type NextRequest, NextResponse } from "next/server";
import { db as adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get("listId");

    if (!listId) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400 });
    }

    // First, verify that the task list exists and is shareable
    const listDoc = await adminDb.collection("taskLists").doc(listId).get();
    
    if (!listDoc.exists) {
      return NextResponse.json({ error: "Task list not found" }, { status: 404 });
    }

    // Fetch tasks for this list
    const tasksQuery = adminDb
      .collection("tasks")
      .where("listId", "==", listId);

    const querySnapshot = await tasksQuery.get();

    const tasks = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Remove sensitive data for shared view
      userId: undefined
    }));

    return NextResponse.json({
      tasks,
      listInfo: {
        id: listDoc.id,
        name: listDoc.data()?.name || "Shared List",
        description: listDoc.data()?.description || "",
        color: listDoc.data()?.color || "bg-blue-500"
      }
    });
  } catch (error) {
    console.error("Error fetching shared tasks:", error);
    return NextResponse.json({ error: "Failed to fetch shared tasks" }, { status: 500 });
  }
}