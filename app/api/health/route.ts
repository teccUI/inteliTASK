import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { messaging } from "@/lib/firebase-admin"

export async function GET(request: NextRequest) {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: "healthy",
    services: {
      mongodb: { status: "unknown", message: "" },
      firebase: { status: "unknown", message: "" },
      googleCalendar: { status: "unknown", message: "" },
      pushNotifications: { status: "unknown", message: "" },
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      nextAuthConfigured: !!process.env.NEXTAUTH_SECRET,
      mongoConfigured: !!process.env.MONGODB_URI,
      googleClientConfigured: !!process.env.GOOGLE_CLIENT_ID,
      vapidConfigured: !!process.env.NEXT_PUBLIC_VAPID_KEY,
    },
  }

  // Test MongoDB connection
  try {
    const client = await clientPromise
    await client.db("intellitask").admin().ping()
    healthCheck.services.mongodb = { status: "healthy", message: "Connected successfully" }
  } catch (error) {
    healthCheck.services.mongodb = { status: "error", message: `MongoDB connection failed: ${error.message}` }
    healthCheck.status = "degraded"
  }

  // Test Firebase Admin
  try {
    // Simple test to verify Firebase Admin is initialized
    const app = messaging.app
    healthCheck.services.firebase = { status: "healthy", message: "Firebase Admin SDK initialized" }
  } catch (error) {
    healthCheck.services.firebase = { status: "error", message: `Firebase Admin error: ${error.message}` }
    healthCheck.status = "degraded"
  }

  // Test Google Calendar API configuration
  try {
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      healthCheck.services.googleCalendar = { status: "healthy", message: "Google Calendar API configured" }
    } else {
      healthCheck.services.googleCalendar = { status: "warning", message: "Google Calendar API not configured" }
    }
  } catch (error) {
    healthCheck.services.googleCalendar = { status: "error", message: `Google Calendar error: ${error.message}` }
  }

  // Test Push Notifications
  try {
    if (process.env.NEXT_PUBLIC_VAPID_KEY) {
      healthCheck.services.pushNotifications = { status: "healthy", message: "Push notifications configured" }
    } else {
      healthCheck.services.pushNotifications = { status: "warning", message: "VAPID key not configured" }
    }
  } catch (error) {
    healthCheck.services.pushNotifications = { status: "error", message: `Push notifications error: ${error.message}` }
  }

  return NextResponse.json(healthCheck)
}
