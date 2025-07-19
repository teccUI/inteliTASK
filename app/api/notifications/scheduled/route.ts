import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json();

    if (type === "overdue_check") {
      return await handleOverdueCheck();
    } else if (type === "weekly_digest") {
      return await handleWeeklyDigest();
    } else if (type === "due_soon_check") {
      return await handleDueSoonCheck();
    } else {
      return NextResponse.json({ error: "Invalid scheduled notification type" }, { status: 400 });
    }

  } catch (error) {
    console.error("Scheduled notification error:", error);
    return NextResponse.json({ error: "Failed to process scheduled notifications" }, { status: 500 });
  }
}

async function handleOverdueCheck() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all tasks that are overdue and not completed
    const tasksQuery = db.collection("tasks")
      .where("completed", "==", false);
    
    const tasksSnapshot = await tasksQuery.get();
    const overdueNotifications = [];

    for (const taskDoc of tasksSnapshot.docs) {
      const task = taskDoc.data();
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (dueDate < today) {
          // Get user info
          const userDoc = await db.collection("users").doc(task.userId).get();
          const userData = userDoc.data();
          
          if (userData?.email && userData?.settings?.notifications?.email) {
            overdueNotifications.push({
              email: userData.email,
              taskTitle: task.title,
              dueDate: task.dueDate
            });
          }
        }
      }
    }

    // Send overdue notifications
    const results = await Promise.allSettled(
      overdueNotifications.map(notification =>
        sendEmail(notification.email, 'taskOverdue', {
          taskTitle: notification.taskTitle,
          dueDate: notification.dueDate
        })
      )
    );

    const successCount = results.filter(result => result.status === 'fulfilled').length;
    const failureCount = results.filter(result => result.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      overdueNotifications: overdueNotifications.length,
      emailsSent: successCount,
      emailsFailed: failureCount
    });

  } catch (error) {
    console.error("Overdue check error:", error);
    return NextResponse.json({ error: "Failed to check overdue tasks" }, { status: 500 });
  }
}

async function handleDueSoonCheck() {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    // Get all tasks due tomorrow that are not completed
    const tasksQuery = db.collection("tasks")
      .where("completed", "==", false);
    
    const tasksSnapshot = await tasksQuery.get();
    const dueSoonNotifications = [];

    for (const taskDoc of tasksSnapshot.docs) {
      const task = taskDoc.data();
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (dueDate <= tomorrow && dueDate >= today) {
          // Get user info
          const userDoc = await db.collection("users").doc(task.userId).get();
          const userData = userDoc.data();
          
          if (userData?.email && userData?.settings?.notifications?.email) {
            dueSoonNotifications.push({
              email: userData.email,
              taskTitle: task.title,
              dueDate: task.dueDate
            });
          }
        }
      }
    }

    // Send due soon notifications
    const results = await Promise.allSettled(
      dueSoonNotifications.map(notification =>
        sendEmail(notification.email, 'taskDueSoon', {
          taskTitle: notification.taskTitle,
          dueDate: notification.dueDate
        })
      )
    );

    const successCount = results.filter(result => result.status === 'fulfilled').length;
    const failureCount = results.filter(result => result.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      dueSoonNotifications: dueSoonNotifications.length,
      emailsSent: successCount,
      emailsFailed: failureCount
    });

  } catch (error) {
    console.error("Due soon check error:", error);
    return NextResponse.json({ error: "Failed to check due soon tasks" }, { status: 500 });
  }
}

async function handleWeeklyDigest() {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get all users who have email notifications enabled
    const usersQuery = db.collection("users")
      .where("settings.notifications.email", "==", true);
    
    const usersSnapshot = await usersQuery.get();
    const digestNotifications = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Get user's tasks
      const tasksQuery = db.collection("tasks")
        .where("userId", "==", userDoc.id);
      
      const tasksSnapshot = await tasksQuery.get();
      const tasks = tasksSnapshot.docs.map(doc => doc.data());

      // Calculate stats
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.completed).length;
      const pendingTasks = tasks.filter(task => !task.completed).length;
      const overdueCount = tasks.filter(task => 
        !task.completed && 
        task.dueDate && 
        new Date(task.dueDate) < new Date()
      ).length;

      if (totalTasks > 0) { // Only send digest if user has tasks
        digestNotifications.push({
          email: userData.email,
          stats: { totalTasks, completedTasks, pendingTasks, overdueCount }
        });
      }
    }

    // Send weekly digest notifications
    const results = await Promise.allSettled(
      digestNotifications.map(notification =>
        sendEmail(notification.email, 'weeklyDigest', notification.stats)
      )
    );

    const successCount = results.filter(result => result.status === 'fulfilled').length;
    const failureCount = results.filter(result => result.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      digestNotifications: digestNotifications.length,
      emailsSent: successCount,
      emailsFailed: failureCount
    });

  } catch (error) {
    console.error("Weekly digest error:", error);
    return NextResponse.json({ error: "Failed to send weekly digest" }, { status: 500 });
  }
}