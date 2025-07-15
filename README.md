# IntelliTask - Smart Task Management

A modern, intelligent task management application built with Next.js, Firebase, and TypeScript.

## Features

- 🔐 **Authentication**: Firebase Auth with Google OAuth
- 📝 **Task Management**: Create, edit, delete, and organize tasks
- 📋 **Task Lists**: Organize tasks into custom lists
- 📅 **Calendar Integration**: Sync tasks with Google Calendar
- 🔔 **Push Notifications**: Real-time notifications for task updates
- 📊 **Analytics**: Track productivity and task completion rates
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS
- 🌙 **Dark Mode**: Support for light/dark themes
- 📱 **Mobile Responsive**: Works seamlessly on all devices

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS, shadcn/ui
- **Icons**: Lucide React
- **Notifications**: Firebase Cloud Messaging

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- Firebase project with Firestore and Authentication enabled
- Google Cloud Console project for Calendar API

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd intellitask
\`\`\`

2. Install dependencies:
\`\`\`bash
pnpm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Configure your environment variables in `.env.local`:

\`\`\`env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Push Notifications
NEXT_PUBLIC_VAPID_KEY=your_vapid_key
\`\`\`

5. Run the development server:
\`\`\`bash
pnpm dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Enable Authentication with Google provider
5. Enable Cloud Messaging

### 2. Get Configuration

1. Go to Project Settings > General
2. Copy the Firebase config object
3. Add values to your `.env.local` file

### 3. Service Account

1. Go to Project Settings > Service Accounts
2. Generate new private key
3. Add the values to your environment variables

## Google Calendar Integration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `http://localhost:3000/api/calendar/callback`
6. Add client ID and secret to environment variables

## API Endpoints

### Authentication
- `POST /api/users` - Create/update user
- `GET /api/users?uid={uid}` - Get user by UID

### Task Management
- `GET /api/tasks?uid={uid}&listId={listId}` - Get tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks` - Update task
- `DELETE /api/tasks?id={id}` - Delete task

### Task Lists
- `GET /api/task-lists?uid={uid}` - Get task lists
- `POST /api/task-lists` - Create task list
- `PUT /api/task-lists` - Update task list
- `DELETE /api/task-lists?id={id}` - Delete task list

### Integrations
- `GET /api/calendar/auth?userId={uid}` - Get Google OAuth URL
- `GET /api/calendar/callback` - Handle OAuth callback
- `POST /api/calendar/sync` - Sync tasks to calendar

### Notifications
- `POST /api/notifications/register` - Register FCM token
- `POST /api/notifications/send` - Send notification
- `POST /api/tasks/reminders` - Send task reminders
- `POST /api/users/digest` - Send weekly digest

### System
- `GET /api/health` - Health check
- `POST /api/integrations/test` - Test all integrations
- `GET /api/analytics?userId={uid}&period={period}` - Get analytics

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── profile/           # User profile
│   ├── settings/          # User settings
│   └── shared/            # Shared task lists
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── contexts/             # React contexts
├── hooks/                # Custom hooks
├── lib/                  # Utility libraries
├── types/                # TypeScript type definitions
└── public/               # Static assets
\`\`\`

## Development

### Code Quality

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Error boundaries for error handling

### Testing

Run the health check endpoint to verify all integrations:

\`\`\`bash
curl http://localhost:3000/api/health
\`\`\`

Run integration tests:

\`\`\`bash
curl -X POST http://localhost:3000/api/integrations/test
\`\`\`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Manual Deployment

1. Build the application:
\`\`\`bash
pnpm build
\`\`\`

2. Start the production server:
\`\`\`bash
pnpm start
\`\`\`

## Environment Variables

All required environment variables are documented in `.env.example`. Make sure to:

1. Never commit `.env.local` to version control
2. Use strong, unique secrets for production
3. Rotate secrets regularly
4. Use Vercel's environment variable management for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team.
\`\`\`

Now let's create a deployment checklist:
