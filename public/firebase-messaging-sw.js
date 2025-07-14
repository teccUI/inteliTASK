// Import Firebase scripts
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js")

// Declare Firebase variable
const firebase = self.firebase

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyCTIl8CjsxoepXtr_irYHoPq9En_7v6_VY",
  authDomain: "intelitask-465914.firebaseapp.com",
  projectId: "intelitask-465914",
  storageBucket: "intelitask-465914.firebasestorage.app",
  messagingSenderId: "407373421651",
  appId: "1:407373421651:web:1d6da4bcbafd1f58577aa6",
})

// Retrieve Firebase Messaging object
const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Received background message ", payload)

  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: "intellitask-notification",
    requireInteraction: true,
    actions: [
      {
        action: "view",
        title: "View Task",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "view") {
    // Open the app
    event.waitUntil(clients.openWindow("/"))
  }
})
