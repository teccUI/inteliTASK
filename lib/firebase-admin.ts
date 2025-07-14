import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getMessaging } from "firebase-admin/messaging"
import serviceAccount from "./firebase-admin-key.json"

const firebaseAdminConfig = {
  credential: cert(serviceAccount as any),
  projectId: "intelitask-465914",
}

// Initialize Firebase Admin SDK
const app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0]

export const messaging = getMessaging(app)
export default app
