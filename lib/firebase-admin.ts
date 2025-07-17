import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getMessaging } from "firebase-admin/messaging"

// Initialize Firebase Admin SDK
let app

try {
  if (getApps().length === 0) {
    if (process.env.NODE_ENV === "development") {
      // In development, use basic initialization without credentials
      app = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "intelitask-465914",
      })
    } else {
      // In production, use service account credentials
      app = initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    }
  } else {
    app = getApps()[0]
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error)
  // Create a minimal app for development
  app = initializeApp({
    projectId: "intelitask-465914",
  })
}

// Only export messaging if properly initialized
export const messaging = (() => {
  try {
    if (process.env.NODE_ENV === "development") {
      return null // Don't initialize messaging in development
    }
    return getMessaging(app)
  } catch (error) {
    console.error("Firebase messaging initialization error:", error)
    return null
  }
})()

export default app
