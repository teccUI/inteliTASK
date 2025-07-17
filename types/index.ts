export interface User {
  uid: string
  email: string
  name: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
  settings?: UserSettings
  fcmToken?: string
  googleCalendarTokens?: GoogleCalendarTokens
}

export interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    taskReminders: boolean
    weeklyDigest: boolean
  }
  appearance: {
    theme: "light" | "dark" | "system"
    language: string
  }
  privacy: {
    shareAnalytics: boolean
    publicProfile: boolean
  }
  integrations: {
    googleCalendar: boolean
    emailSync: boolean
  }
}

export interface GoogleCalendarTokens {
  accessToken: string
  refreshToken: string
  expiryDate: number
}

export interface Task {
  id: string
  title: string
  description?: string
  dueDate?: string
  completed: boolean
  listId: string
  userId: string
  createdAt: Date | string
  updatedAt: Date | string
  priority?: "low" | "medium" | "high"
  tags?: string[]
  calendarEventId?: string
}

export interface TaskList {
  id: string
  name: string
  color: string
  userId: string
  createdAt: Date | string
  updatedAt: Date | string
  isDefault?: boolean
}

export interface Analytics {
  period: "week" | "month" | "year"
  dateRange: {
    start: string
    end: string
  }
  summary: {
    totalTasks: number
    completedTasks: number
    pendingTasks: number
    completionRate: number
  }
  breakdown: {
    tasksByList: Record<string, number>
    tasksByDay: Record<string, number>
  }
}
