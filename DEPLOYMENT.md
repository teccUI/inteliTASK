# IntelliTask Deployment Guide

This guide outlines the steps to deploy the IntelliTask application.

## Prerequisites

- Vercel CLI installed (`npm i -g vercel`)
- Firebase project set up with:
  - Authentication (Email/Password, Google Sign-in enabled)
  - Firestore Database
  - Cloud Messaging (FCM)
- Google Cloud Project for Calendar API:
  - Calendar API enabled
  - OAuth 2.0 Client IDs configured (Web application type)
  - Redirect URI: `YOUR_NEXTAUTH_URL/api/calendar/callback`
- Environment variables configured in Vercel.

## Environment Variables

Ensure the following environment variables are set in your Vercel project settings:

### Firebase Configuration (Client-side)

These are used by the Firebase client SDK.

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Firebase Admin SDK (Server-side)

These are used by the Firebase Admin SDK for server-side operations (e.g., sending push notifications, managing users).

- `FIREBASE_PROJECT_ID` (Your Firebase project ID)
- `FIREBASE_CLIENT_EMAIL` (Service account email from Firebase)
- `FIREBASE_PRIVATE_KEY` (Private key from Firebase service account JSON, replace `\n` with actual newlines if copying directly)

### Google OAuth (Server-side)

Used for Google Calendar integration.

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### NextAuth (Server-side)

Used for NextAuth.js authentication.

- `NEXTAUTH_SECRET` (A long, random string)
- `NEXTAUTH_URL` (Your application's URL, e.g., `https://your-app.vercel.app`)

### Push Notifications (Client-side)

Used for Web Push notifications.

- `NEXT_PUBLIC_VAPID_KEY` (Public VAPID key generated for push notifications)

## Deployment Steps

1.  **Install Dependencies:**
    \`\`\`bash
    npm install
    \`\`\`

2.  **Build the Project:**
    \`\`\`bash
    npm run build
    \`\`\`

3.  **Deploy to Vercel:**
    \`\`\`bash
    vercel
    \`\`\`
    Follow the prompts. Ensure your environment variables are correctly configured in your Vercel project.

## Post-Deployment

-   **Verify Integrations:**
    Navigate to `/api/health` and `/api/integrations/test` endpoints to verify all services are running correctly.
-   **Firebase Messaging Service Worker:**
    Ensure `public/firebase-messaging-sw.js` is accessible at the root of your domain.
-   **Google Calendar OAuth:**
    Make sure the redirect URI in your Google Cloud project matches `YOUR_NEXTAUTH_URL/api/calendar/callback`.

## Troubleshooting

-   **Environment Variables:** Double-check all environment variables are correctly set in Vercel.
-   **Firebase Admin SDK:** Ensure the `FIREBASE_PRIVATE_KEY` is correctly formatted (newlines are important).
-   **Network Issues:** Verify your Vercel deployment has network access to Firebase and Google APIs.
\`\`\`
