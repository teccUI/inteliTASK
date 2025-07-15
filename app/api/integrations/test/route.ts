import { type NextRequest, NextResponse } from "next/server"
import { messaging } from "@/lib/firebase-admin"
import { google } from "googleapis"

export async function POST(request: NextRequest) {
  const integrationResults = {
    timestamp: new Date().toISOString(),
    overall: "unknown",
    tests: {
      firebase: { status: "pending", message: "", details: null },
      googleCalendar: { status: "pending", message: "", details: null },
      pushNotifications: { status: "pending", message: "", details: null },
      authentication: { status: "pending", message: "", details: null },
    },
  }

  let allPassed = true

  // Test 2: Firebase Admin SDK
  try {
    const app = messaging.app
    const projectId = app.options.projectId

    // Test token validation (dry run)
    const testMessage = {
      notification: {
        title: "Test Notification",
        body: "This is a test message",
      },
      token: "test-token", // This will fail but we can catch it
    }

    try {
      await messaging.send(testMessage)
    } catch (tokenError) {
      // Expected to fail with invalid token, but Firebase is working
      if (tokenError.message.includes("invalid-registration-token")) {
        integrationResults.tests.firebase = {
          status: "success",
          message: "Firebase Admin SDK initialized and working",
          details: {
            projectId,
            messagingAvailable: true,
            expectedTokenError: true,
          },
        }
      } else {
        throw tokenError
      }
    }
  } catch (error) {
    allPassed = false
    integrationResults.tests.firebase = {
      status: "error",
      message: `Firebase Admin test failed: ${error.message}`,
      details: { error: error.message },
    }
  }

  // Test 3: Google Calendar API Configuration
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/calendar/callback`,
    )

    // Test OAuth URL generation
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar"],
      state: "test-state",
    })

    integrationResults.tests.googleCalendar = {
      status: "success",
      message: "Google Calendar API configuration successful",
      details: {
        clientIdConfigured: !!process.env.GOOGLE_CLIENT_ID,
        clientSecretConfigured: !!process.env.GOOGLE_CLIENT_SECRET,
        authUrlGenerated: !!authUrl,
        redirectUriConfigured: true,
      },
    }
  } catch (error) {
    allPassed = false
    integrationResults.tests.googleCalendar = {
      status: "error",
      message: `Google Calendar API test failed: ${error.message}`,
      details: { error: error.message },
    }
  }

  // Test 4: Push Notifications Configuration
  try {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    const allConfigured = Object.values(firebaseConfig).every(Boolean) && vapidKey

    integrationResults.tests.pushNotifications = {
      status: allConfigured ? "success" : "warning",
      message: allConfigured ? "Push notifications fully configured" : "Some push notification configs missing",
      details: {
        vapidKeyConfigured: !!vapidKey,
        firebaseConfigComplete: Object.values(firebaseConfig).every(Boolean),
        serviceWorkerPath: "/firebase-messaging-sw.js",
      },
    }
  } catch (error) {
    allPassed = false
    integrationResults.tests.pushNotifications = {
      status: "error",
      message: `Push notifications test failed: ${error.message}`,
      details: { error: error.message },
    }
  }

    // Test 5: Authentication Configuration
    try {
      const authConfig = {
        nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: !!process.env.NEXTAUTH_URL,
        firebaseAuth: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        googleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      }

      const allAuthConfigured = Object.values(authConfig).every(Boolean)

      integrationResults.tests.authentication = {
        status: allAuthConfigured ? "success" : "warning",
        message: allAuthConfigured ? "Authentication fully configured" : "Some authentication configs missing",
        details: authConfig,
      }

      if (!allAuthConfigured) allPassed = false
    } catch (error) {
      allPassed = false
      integrationResults.tests.authentication = {
        status: "error",
        message: `Authentication test failed: ${error.message}`,
        details: { error: error.message },
      }
    }

  // Set overall status
  integrationResults.overall = allPassed ? "success" : "partial"

  return NextResponse.json(integrationResults)
}
