import * as admin from "firebase-admin"

// Check if Firebase Admin app is already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    })
  } catch (error: any) {
    console.error("Firebase Admin initialization error:", error.stack)
    // Log specific error details for debugging
    if (error.code === "app/duplicate-app") {
      console.warn("Firebase Admin app already initialized. This might happen in hot-reloading environments.")
    } else if (error.code === "auth/invalid-credential") {
      console.error(
        "Firebase Admin: Invalid credentials. Check FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID.",
      )
    } else {
      console.error("Firebase Admin: Unknown initialization error.", error)
    }
  }
}

const db = admin.firestore()
const auth = admin.auth()
const messaging = admin.messaging()

export { db, auth, messaging }
