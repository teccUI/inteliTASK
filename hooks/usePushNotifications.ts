"use client"

import { useEffect, useState, useCallback } from "react"
import { getMessaging, getToken, onMessage } from "firebase/messaging"
import { initializeApp } from "firebase/app"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"

// Firebase configuration for client-side
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase only once
let firebaseAppInitialized = false
let firebaseApp: any

if (typeof window !== "undefined" && !firebaseAppInitialized) {
  firebaseApp = initializeApp(firebaseConfig)
  firebaseAppInitialized = true
}

export function usePushNotifications() {
  const { user } = useAuth()
  const [token, setToken] = useState<string | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission)

      if (Notification.permission === "granted" && firebaseApp) {
        const messaging = getMessaging(firebaseApp)
        getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY })
          .then((currentToken) => {
            if (currentToken) {
              setToken(currentToken)
              // You might want to send this token to your backend to associate with a user
              console.log("FCM Registration Token:", currentToken)
            } else {
              console.log("No registration token available. Request permission to generate one.")
            }
          })
          .catch((err) => {
            console.error("An error occurred while retrieving token. ", err)
          })

        // Handle incoming messages while the app is in the foreground
        onMessage(messaging, (payload) => {
          console.log("Message received. ", payload)
          toast({
            title: payload.notification?.title || "New Notification",
            description: payload.notification?.body,
            duration: 9000,
          })
        })
      }
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser does not support web notifications.",
      })
      return false
    }

    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)

    if (permission === "granted" && firebaseApp) {
      const messaging = getMessaging(firebaseApp)
      try {
        const currentToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY })
        setToken(currentToken)
        console.log("FCM Registration Token:", currentToken)
        toast({
          title: "Notifications Enabled",
          description: "You will now receive push notifications.",
        })
        return true
      } catch (err) {
        console.error("Unable to get permission to notify.", err)
        toast({
          title: "Error enabling notifications",
          description: "Please check console for details.",
        })
        return false
      }
    } else {
      toast({
        title: "Notification permission denied",
        description: "You will not receive push notifications.",
      })
      return false
    }
  }, [])

  const sendNotification = useCallback(
    async (title: string, body: string, data?: Record<string, string>) => {
      if (!token) {
        console.warn("No FCM token available. Cannot send notification.")
        toast({
          title: "Notification Failed",
          description: "Push notifications are not enabled or token is missing.",
        })
        return
      }

      try {
        const response = await fetch("/api/notifications/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user?.uid || "", title, body, data }),
        })

        if (!response.ok) {
          throw new Error("Failed to send notification via backend")
        }

        const result = await response.json()
        console.log("Notification sent result:", result)
        toast({
          title: "Notification Sent",
          description: "Test notification sent successfully!",
        })
      } catch (error) {
        console.error("Error sending notification:", error)
        toast({
          title: "Notification Send Failed",
          description: "Could not send test notification.",
        })
      }
    },
    [token, user],
  )

  return { token, notificationPermission, requestPermission, sendNotification }
}
