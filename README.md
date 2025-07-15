# IntelliTask

IntelliTask is a modern task management application designed to help users organize their tasks, manage task lists, and stay productive with features like Google Calendar integration and push notifications.

## Features

-   **User Authentication:** Secure sign-up, login, and password reset using Firebase Authentication.
-   **Task Management:** Create, read, update, and delete tasks.
-   **Task Lists:** Organize tasks into custom lists.
-   **Google Calendar Integration:** Sync tasks with due dates to Google Calendar.
-   **Push Notifications:** Receive reminders for upcoming tasks and weekly progress digests.
-   **User Settings:** Customize notification preferences, appearance, and privacy settings.
-   **Analytics Dashboard:** View task completion rates and trends.
-   **Responsive Design:** Optimized for various screen sizes.

## Technologies Used

-   **Next.js:** React framework for building full-stack applications.
-   **React:** Frontend library for building user interfaces.
-   **Firebase:**
    -   **Authentication:** User management.
    -   **Firestore:** NoSQL database for storing application data.
    -   **Cloud Messaging (FCM):** Push notifications.
-   **Google APIs:** For Google Calendar integration.
-   **Tailwind CSS:** For styling and responsive design.
-   **shadcn/ui:** Reusable UI components.
-   **Lucide React:** Icon library.

## Getting Started

### Prerequisites

-   Node.js (v18.x or later)
-   npm or yarn
-   A Firebase project with Authentication, Firestore, and Cloud Messaging enabled.
-   A Google Cloud project with Google Calendar API enabled and OAuth 2.0 credentials configured.

### Installation

1.  **Clone the repository:**
    \`\`\`bash
    git clone https://github.com/your-repo/intellitask.git
    cd intellitask
    \`\`\`

2.  **Install dependencies:**
    \`\`\`bash
    npm install
    # or
    yarn install
    \`\`\`

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root of your project and add the following:

    \`\`\`env
    # Firebase Configuration (Client-side)
    NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

    # Firebase Admin SDK (Server-side)
    FIREBASE_PROJECT_ID=your_firebase_project_id
    FIREBASE_CLIENT_EMAIL=your_service_account_email
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

    # Google OAuth
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret

    # NextAuth
    NEXTAUTH_SECRET=your_nextauth_secret
    NEXTAUTH_URL=http://localhost:3000

    # Push Notifications
    NEXT_PUBLIC_VAPID_KEY=your_vapid_key
    \`\`\`
    **Note:** For `FIREBASE_PRIVATE_KEY`, ensure you replace `\n` with actual newline characters if copying from a single line.

4.  **Run the development server:**
    \`\`\`bash
    npm run dev
    # or
    yarn dev
    \`\`\`
    Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

\`\`\`
.
├── app/                  # Next.js App Router routes, pages, and API routes
│   ├── api/              # API routes for backend logic
│   ├── auth/             # Authentication pages (login, register, forgot-password)
│   ├── integrations/     # Integrations page
│   ├── profile/          # User profile page
│   ├── settings/         # User settings page
│   ├── shared/[listId]/  # Shared task list page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main dashboard page
│   └── ...
├── components/           # Reusable React components
│   ├── ui/               # shadcn/ui components
│   ├── AuthProvider.tsx  # Authentication context
│   ├── ProtectedRoute.tsx# Component for protected routes
│   └── ...
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and Firebase configurations
│   ├── firebase.ts       # Firebase client SDK initialization
│   ├── firebase-admin.ts # Firebase Admin SDK initialization
│   └── utils.ts          # General utility functions
├── public/               # Static assets (images, service worker)
├── styles/               # Global CSS styles
├── types/                # TypeScript type definitions
├── next.config.mjs       # Next.js configuration
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── tailwind.config.ts    # Tailwind CSS configuration
\`\`\`

## API Endpoints

-   `/api/users`: User management (create, fetch)
-   `/api/task-lists`: Task list CRUD operations
-   `/api/tasks`: Task CRUD operations
-   `/api/analytics`: User analytics data
-   `/api/calendar/auth`: Initiate Google Calendar OAuth
-   `/api/calendar/callback`: Google Calendar OAuth callback
-   `/api/calendar/sync`: Sync tasks to Google Calendar
-   `/api/notifications/register`: Register FCM token
-   `/api/notifications/send`: Send push notification
-   `/api/tasks/reminders`: Send task reminders
-   `/api/users/digest`: Send weekly user digest
-   `/api/users/settings`: User settings management
-   `/api/health`: Application health check
-   `/api/integrations/test`: Integration test endpoint

## Contributing

Feel free to fork the repository and contribute!

## License

[MIT License](LICENSE)
