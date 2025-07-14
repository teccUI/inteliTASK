# IntelliTask - Smart Task Management Application

A modern, full-featured task management application built with Next.js, Firebase, and MongoDB.

## 🚀 Features

### ✅ **Core Features**
- **User Authentication** - Firebase Auth with email/password and Google OAuth
- **Task Management** - Create, edit, delete, and organize tasks
- **Task Lists** - Organize tasks into custom lists with color coding
- **Real-time Sync** - Data synced across all devices
- **Search & Filter** - Find tasks quickly with powerful search

### 🗓️ **Calendar Integration**
- **Google Calendar Sync** - Automatically sync tasks to Google Calendar
- **Due Date Reminders** - Get notified about upcoming deadlines
- **Event Creation** - Tasks with due dates become calendar events

### 🔔 **Notifications**
- **Push Notifications** - Browser push notifications for task reminders
- **Email Notifications** - Task reminders and weekly digests
- **Weekly Reports** - Progress summaries delivered weekly

### 📊 **Analytics & Insights**
- **Progress Tracking** - Visual progress indicators
- **Completion Analytics** - Track your productivity over time
- **Task Statistics** - Detailed insights into your task management

### 🎨 **User Experience**
- **Responsive Design** - Works perfectly on desktop and mobile
- **Dark/Light Mode** - Theme preferences
- **Customizable Settings** - Personalize your experience
- **Shared Lists** - Share task lists with others

## 🛠️ **Technology Stack**

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB
- **Authentication**: Firebase Auth
- **Push Notifications**: Firebase Cloud Messaging
- **Calendar**: Google Calendar API
- **UI Components**: Radix UI, shadcn/ui

## 📋 **Prerequisites**

- Node.js 18+ 
- MongoDB database
- Firebase project
- Google Cloud Platform project with Calendar API enabled

## 🚀 **Quick Start**

### 1. Clone the Repository
\`\`\`bash
git clone <your-repo-url>
cd intellitask
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Environment Setup
Copy `.env.example` to `.env.local` and fill in your credentials:

\`\`\`env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Calendar
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth
NEXTAUTH_SECRET=72502f0e2758434c73f483885dc82acf
NEXTAUTH_URL=http://localhost:3000

# Push Notifications
NEXT_PUBLIC_VAPID_KEY=your_vapid_key
\`\`\`

### 4. Firebase Admin Setup
Place your Firebase Admin SDK key file at `lib/firebase-admin-key.json`

### 5. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` to see your application!

## 📁 **Project Structure**

\`\`\`
intellitask/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── profile/           # User profile
│   ├── settings/          # User settings
│   └── shared/            # Shared task lists
├── components/            # React components
│   └── ui/               # UI components
├── contexts/              # React contexts
├── hooks/                 # Custom hooks
├── lib/                   # Utility libraries
└── public/               # Static assets
\`\`\`

## 🔧 **Configuration**

### Firebase Setup
1. Create a Firebase project
2. Enable Authentication (Email/Password and Google)
3. Enable Firestore Database
4. Enable Cloud Messaging
5. Generate VAPID keys for push notifications

### Google Calendar API
1. Enable Google Calendar API in Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs

### MongoDB Setup
1. Create a MongoDB database
2. Get your connection string
3. The app will automatically create required collections

## 🚀 **Deployment**

### Vercel (Recommended)
\`\`\`bash
npm run build
vercel --prod
\`\`\`

### Other Platforms
The application can be deployed to any Node.js hosting platform:
- Netlify
- Railway
- Heroku
- DigitalOcean App Platform

## 📊 **API Endpoints**

### Authentication
- `POST /api/users` - Create user
- `GET /api/users` - Get user data

### Tasks
- `GET /api/tasks` - Get tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks` - Update task
- `DELETE /api/tasks` - Delete task

### Task Lists
- `GET /api/task-lists` - Get task lists
- `POST /api/task-lists` - Create task list
- `PUT /api/task-lists` - Update task list
- `DELETE /api/task-lists` - Delete task list

### Calendar
- `GET /api/calendar/auth` - Get Google OAuth URL
- `POST /api/calendar/sync` - Sync tasks to calendar

### Notifications
- `POST /api/notifications/send` - Send push notification
- `POST /api/notifications/register` - Register FCM token

## 🔍 **Health Check**

Visit `/setup` to check system health and configuration status.

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License.

## 🆘 **Support**

If you encounter any issues:
1. Check the `/setup` page for configuration problems
2. Review the console for error messages
3. Ensure all environment variables are set correctly
4. Verify Firebase and Google Cloud configurations

## 🎯 **Roadmap**

- [ ] Mobile app (React Native)
- [ ] Team collaboration features
- [ ] Advanced analytics dashboard
- [ ] Integration with more calendar providers
- [ ] AI-powered task suggestions
- [ ] Offline support with sync

---

Built with ❤️ using Next.js and modern web technologies.
