import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { userId, type, data } = await request.json();

    if (!userId || !type) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Get user data and check if email notifications are enabled
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const userEmail = userData?.email;
    const emailNotificationsEnabled = userData?.settings?.notifications?.email;

    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 404 });
    }

    if (!emailNotificationsEnabled) {
      return NextResponse.json({ message: "Email notifications disabled for user" }, { status: 200 });
    }

    // Map notification types to email template keys
    const templateMap: Record<string, string> = {
      'task_created': 'taskCreated',
      'task_completed': 'taskCompleted',
      'task_overdue': 'taskOverdue',
      'task_due_soon': 'taskDueSoon',
      'weekly_digest': 'weeklyDigest'
    };

    const templateKey = templateMap[type];
    if (!templateKey) {
      return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
    }

    // Send email
    const emailResult = await sendEmail(userEmail, templateKey as keyof typeof import("@/lib/email").emailTemplates, data);

    if (!emailResult.success) {
      return NextResponse.json({ error: "Failed to send email", details: emailResult.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messageId: emailResult.messageId
    });

  } catch (error) {
    console.error("Email notification error:", error);
    return NextResponse.json({ error: "Failed to send email notification" }, { status: 500 });
  }
}