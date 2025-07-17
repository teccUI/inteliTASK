# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IntelliTask is a modern task management application built with Next.js 15, React 19, and Firebase. It provides task organization, Google Calendar integration, push notifications, and user analytics.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check code quality

### Testing
- `npm test` - Run test suite (see tests/ directory)
- Single test files can be run with standard Jest patterns

## Architecture Overview

### Core Technologies
- **Next.js 15** with App Router for full-stack React application
- **Firebase** for authentication, Firestore database, and cloud messaging
- **Tailwind CSS** + **shadcn/ui** for styling and components
- **TypeScript** with strict mode enabled
- **React 19** with modern hooks and context patterns

### Key Directories
- `app/` - Next.js App Router pages and API routes
- `components/` - Reusable React components (includes shadcn/ui in ui/ subdirectory)
- `contexts/` - React Context providers (primarily AuthContext)
- `lib/` - Utility functions and service configurations
- `types/` - TypeScript type definitions
- `hooks/` - Custom React hooks

### Database Architecture
Uses Firebase Firestore with these primary collections:
- `users` - User profiles and preferences
- `tasks` - Individual task documents
- `task-lists` - Task list containers
- Analytics data computed from tasks

### Authentication Flow
- Firebase Authentication handles user management
- AuthContext provides user state throughout the app
- ProtectedRoute component wraps pages requiring authentication
- Supports email/password and Google OAuth login

### API Routes Structure
Located in `app/api/`:
- `/api/users` - User CRUD operations
- `/api/tasks` - Task management
- `/api/task-lists` - Task list operations
- `/api/analytics` - User analytics
- `/api/calendar/` - Google Calendar integration
- `/api/notifications/` - Push notification handling

## Environment Configuration

Required environment variables in `.env.local`:
- Firebase client config (NEXT_PUBLIC_FIREBASE_*)
- Firebase Admin SDK credentials (FIREBASE_*)
- Google OAuth credentials (GOOGLE_CLIENT_*)
- NextAuth configuration (NEXTAUTH_*)
- VAPID key for push notifications

## Key Components

### State Management
- **AuthContext** (`contexts/AuthContext.tsx`) - Global user authentication state
- Local state with useState/useEffect for component-specific data
- No external state management library used

### UI Components
- Built on shadcn/ui component library
- Consistent design system with Tailwind CSS
- Custom components extend shadcn/ui base components
- Dark mode support via next-themes

### Push Notifications
- Service worker in `public/firebase-messaging-sw.js`
- FCM token management in usePushNotifications hook
- Notification handling in API routes

## Development Patterns

### File Organization
- Co-locate related components and utilities
- Use absolute imports with `@/` prefix (configured in tsconfig.json)
- API routes mirror the application's data structure

### Error Handling
- Try-catch blocks in API routes with proper HTTP status codes
- Toast notifications for user-facing errors
- Console logging for debugging

### Data Fetching
- Uses native fetch() API for client-server communication
- API routes handle Firebase Admin SDK operations
- Client-side Firebase SDK for real-time authentication

## Firebase Integration

### Client-side (`lib/firebase.ts`)
- Configures Firebase app, auth, Firestore, and messaging
- Handles browser-specific initialization

### Server-side (`lib/firebase-admin.ts`)
- Firebase Admin SDK for server operations
- Handles authentication verification and database operations

## Testing

Test files located in `tests/` directory. The project uses standard Jest testing patterns. Check existing test files for testing conventions.

## Code Style

- TypeScript strict mode enabled
- ESLint configuration follows Next.js standards
- Consistent use of arrow functions and modern JavaScript features
- Tailwind CSS for styling with utility-first approach