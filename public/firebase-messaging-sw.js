// This is the Firebase Cloud Messaging service worker.
// It handles receiving and displaying push notifications.

// Give the service worker a name and version
const CACHE_NAME = "firebase-messaging-cache-v1"

// List of URLs to cache
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/firebase-logo.png", // Example: if you have a logo for notifications
  // Add other static assets your app needs to function offline
]

// Install event: caches static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching static assets")
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.error("Service Worker: Failed to cache assets", error)
      }),
  )
})

// Activate event: cleans up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Service Worker: Deleting old cache", cacheName)
            return caches.delete(cacheName)
          }
          return null
        }),
      )
    }),
  )
})

// Fetch event: serves cached content first, then fetches from network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    }),
  )
})

// Import and configure the Firebase SDK for Firebase Cloud Messaging.
// This script is expected to be placed in the `public` directory
// and served from the root of your domain.
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js")

// Initialize the Firebase app with your project's configuration.
// This configuration should be publicly accessible.
const firebaseConfig = {
  apiKey: "YOUR_NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "YOUR_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_NEXT_PUBLIC_FIREBASE_APP_ID",
}

// Check if Firebase app is already initialized to prevent errors during hot-reloading
if (!self.firebase.apps.length) {
  self.firebase.initializeApp(firebaseConfig)
} else {
  self.firebase.app() // if already initialized, use that one
}

const messaging = self.firebase.messaging()

// Handle incoming messages when the app is in the background.
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload)

  const notificationTitle = payload.notification?.title || "Background Message Title"
  const notificationOptions = {
    body: payload.notification?.body || "Background Message body.",
    icon: payload.notification?.icon || "/firebase-logo.png", // Use a default icon
    data: payload.data, // Custom data
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close() // Close the notification

  const clickAction = event.notification.data?.FCM_MSG?.data?.click_action || "/"
  event.waitUntil(
    clients.openWindow(clickAction), // Open the URL specified in the notification data
  )
})
