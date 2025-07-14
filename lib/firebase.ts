import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getMessaging, isSupported } from "firebase/messaging"

const firebaseConfig = {
  apiKey: "AIzaSyCTIl8CjsxoepXtr_irYHoPq9En_7v6_VY",
  authDomain: "intelitask-465914.firebaseapp.com",
  projectId: "intelitask-465914",
  storageBucket: "intelitask-465914.firebasestorage.app",
  messagingSenderId: "407373421651",
  appId: "1:407373421651:web:1d6da4bcbafd1f58577aa6",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

// Initialize Firebase Messaging (only in browser environment)
export const messaging = typeof window !== "undefined" && isSupported() ? getMessaging(app) : null

export default app
