import { type NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { db as adminDb } from "@/lib/firebase-admin"; // Correctly import the Admin DB

// Initialize the Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export async function POST(request: NextRequest) {
  try {
    // --- 1. Get ONLY the userId from the request body ---
    // The backend will securely fetch the tokens from Firestore.
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // --- 2. Fetch the user's tokens from their document in Firestore ---
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const accessToken = userData?.accessToken;
    const refreshToken = userData?.refreshToken;

    if (!accessToken) {
      return NextResponse.json({ error: "User is not authenticated with Google or access token is missing" }, { status: 401 });
    }

    // --- 3. Set the credentials on the OAuth2 client ---
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // --- 4. Initialize the CORRECT API: Google Tasks API ---
    const tasksApi = google.tasks({ version: "v1", auth: oauth2Client });

    // --- 5. Get the user's primary task list ---
    const taskListsResponse = await tasksApi.tasklists.list();
    const primaryTaskList = taskListsResponse.data.items?.[0]; // Usually the first one is the default

    if (!primaryTaskList?.id) {
      console.log("User has no Google Task lists.");
      return NextResponse.json({ success: true, message: "User has no Google Task lists to sync." });
    }

    // --- 6. Fetch all incomplete tasks from the user's primary Google Task list ---
    const googleTasksResponse = await tasksApi.tasks.list({
      tasklist: primaryTaskList.id,
      showCompleted: false, // We only want to sync tasks that are not yet done
    });

    const googleTasks = googleTasksResponse.data.items || [];
    const syncResults = { new: 0, failed: 0 };

    // --- 7. Loop through Google Tasks and save them to your Firestore database ---
    for (const googleTask of googleTasks) {
      if (!googleTask.id || !googleTask.title) {
        continue; // Skip any malformed tasks from Google
      }

      try {
        // IMPORTANT: Check if we have already synced this task to prevent duplicates
        const existingTaskQuery = await adminDb.collection("tasks")
          .where("userId", "==", userId)
          .where("googleTaskId", "==", googleTask.id) // We use a dedicated field to track the source ID
          .limit(1)
          .get();

        if (existingTaskQuery.empty) {
          // If it's empty, this is a new task, so we add it to our database
          await adminDb.collection("tasks").add({
            userId: userId,
            googleTaskId: googleTask.id, // Store the Google Task ID for future syncs
            title: googleTask.title,
            description: googleTask.notes || "",
            completed: false,
            // The 'due' field from Google Tasks is an RFC 3339 timestamp
            dueDate: googleTask.due ? new Date(googleTask.due) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          syncResults.new++;
        }
        // Note: You could add an 'else' block here to update existing tasks if they've changed on Google.
      } catch (error) {
        console.error(`Failed to process Google Task ${googleTask.id}:`, error);
        syncResults.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Sync from Google Tasks complete.",
      newTasksSynced: syncResults.new,
      failedTasks: syncResults.failed,
    });

  } catch (error) {
    console.error("Calendar sync API error:", error);
    return NextResponse.json({ error: "Failed to sync with Google Tasks" }, { status: 500 });
  }
}