import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getMessaging } from "firebase-admin/messaging"

// For development, use environment variables or mock credentials
const firebaseAdminConfig = process.env.NODE_ENV === "development"
  ? {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "intelitask-465914",
    }
  : {
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    }

// Initialize Firebase Admin SDK
const app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0]

// Only export messaging if in production or if proper credentials are available
export const messaging = process.env.NODE_ENV === "production" 
  ? getMessaging(app) 
  : null

export default app
