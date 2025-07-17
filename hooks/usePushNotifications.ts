"use client"

import { useEffect, useState } from "react"
import { getMessaging, getToken, onMessage } from "firebase/messaging"
import { useAuth } from "@/contexts/AuthContext"

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [token, setToken] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Request notification permission
      const requestPermission = async () => {
        const permission = await Notification.requestPermission()
        setPermission(permission)

        if (permission === "granted" && user) {
          try {
            const messaging = getMessaging()
            const currentToken = await getToken(messaging, {
              vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY!,
            })

            if (currentToken) {
              setToken(currentToken)

              // Register token with backend
              await fetch("/api/notifications/register", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: user.uid,
                  token: currentToken,
                }),
              })

              // Listen for foreground messages
              onMessage(messaging, (payload) => {
                console.log("Message received. ", payload)
                // Handle foreground notification
                if (payload.notification) {
                  new Notification(payload.notification.title || "", {
                    body: payload.notification.body,
                    icon: "/icon-192x192.png",
                  })
                }
              })
            }
          } catch (error) {
            console.error("Error getting FCM token:", error)
          }
        }
      }

      requestPermission()
    }
  }, [user])

  const sendNotification = async (title: string, body: string, data?: any) => {
    if (!user) return

    try {
      await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          title,
          body,
          data,
        }),
      })
    } catch (error) {
      console.error("Error sending notification:", error)
    }
  }

  return {
    permission,
    token,
    sendNotification,
  }
}
