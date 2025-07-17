"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Plus,
  Calendar,
  Share2,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  User,
  LogOut,
  Settings,
  Bell,
  Search,
  CalendarDays,
  Target,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import IntegrationStatus from "@/components/IntegrationStatus"

interface Task {
  id: string
  title: string
  description: string
  dueDate: string
  completed: boolean
  listId: string
}

interface TaskList {
  id: string
  name: string
  color: string
  tasks: Task[]
}

export default function IntelliTaskDashboard() {
  const [taskLists, setTaskLists] = useState<TaskList[]>([
    {
      id: "1",
      name: "Work",
      color: "bg-blue-500",
      tasks: [
        {
          id: "1",
          title: "Complete project proposal",
          description: "Finish the Q4 project proposal for client review",
          dueDate: "2024-01-15",
          completed: false,
          listId: "1",
        },
        {
          id: "2",
          title: "Team meeting preparation",
          description: "Prepare agenda and materials for weekly team meeting",
          dueDate: "2024-01-14",
          completed: true,
          listId: "1",
        },
        {
          id: "3",
          title: "Code review",
          description: "Review pull requests from team members",
          dueDate: "2024-01-16",
          completed: false,
          listId: "1",
        },
        {
          id: "6",
          title: "Daily standup meeting",
          description: "Attend the daily team standup",
          dueDate: new Date().toISOString().split("T")[0], // Today's date
          completed: true,
          listId: "1",
        },
        {
          id: "7",
          title: "Review code changes",
          description: "Review pending pull requests",
          dueDate: new Date().toISOString().split("T")[0], // Today's date
          completed: false,
          listId: "1",
        },
      ],
    },
    {
      id: "2",
      name: "Personal",
      color: "bg-green-500",
      tasks: [
        {
          id: "4",
          title: "Grocery shopping",
          description: "Buy ingredients for weekend dinner party",
          dueDate: "2024-01-13",
          completed: false,
          listId: "2",
        },
        {
          id: "5",
          title: "Exercise",
          description: "30-minute workout at the gym",
          dueDate: "2024-01-14",
          completed: true,
          listId: "2",
        },
      ],
    },
  ])

  const [selectedList, setSelectedList] = useState<string>("1")
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false)
  const [isNewListOpen, setIsNewListOpen] = useState(false)
  const [newTask, setNewTask] = useState({ title: "", description: "", dueDate: "" })
  const [newListName, setNewListName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const { user, logout } = useAuth()
  const { sendNotification } = usePushNotifications()

  const currentList = taskLists.find((list) => list.id === selectedList)

  // Calculate overall progress instead of just today's tasks
  const allTasks = taskLists.flatMap((list) => list.tasks)
  const completedTasks = allTasks.filter((task) => task.completed)
  const dailyProgress = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0

  const addTask = () => {
    if (newTask.title.trim() && currentList) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.dueDate,
        completed: false,
        listId: selectedList,
      }

      setTaskLists((prev) =>
        prev.map((list) => (list.id === selectedList ? { ...list, tasks: [...list.tasks, task] } : list)),
      )

      setNewTask({ title: "", description: "", dueDate: "" })
      setIsNewTaskOpen(false)
    }
  }

  const addTaskList = () => {
    if (newListName.trim()) {
      const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-red-500", "bg-yellow-500", "bg-indigo-500"]
      const newList: TaskList = {
        id: Date.now().toString(),
        name: newListName,
        color: colors[Math.floor(Math.random() * colors.length)],
        tasks: [],
      }

      setTaskLists((prev) => [...prev, newList])
      setNewListName("")
      setIsNewListOpen(false)
      setSelectedList(newList.id)
    }
  }

  const toggleTask = (taskId: string) => {
    setTaskLists((prev) =>
      prev.map((list) => ({
        ...list,
        tasks: list.tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
      })),
    )
  }

  const deleteTask = (taskId: string) => {
    setTaskLists((prev) =>
      prev.map((list) => ({
        ...list,
        tasks: list.tasks.filter((task) => task.id !== taskId),
      })),
    )
  }

  const filteredTasks =
    currentList?.tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || []

  const handleShare = async (listId: string) => {
    const shareUrl = `${window.location.origin}/shared/${listId}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      // You could add a toast notification here
      alert("Share link copied to clipboard!")
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      alert("Share link copied to clipboard!")
    }
  }

  const handleCalendarSync = async () => {
    if (!user) return

    try {
      // First, get the Google OAuth URL
      const authResponse = await fetch(`/api/calendar/auth?userId=${user.uid}`)
      const { authUrl } = await authResponse.json()

      if (authUrl) {
        // Open Google OAuth in a popup
        const popup = window.open(authUrl, "google-calendar-auth", "width=500,height=600")

        // Listen for the popup to close
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed)
            // Check if authentication was successful
            const urlParams = new URLSearchParams(window.location.search)
            if (urlParams.get("calendar_connected") === "true") {
              alert("Google Calendar connected successfully!")
              // Trigger sync
              syncTasks()
            }
          }
        }, 1000)
      }
    } catch (error) {
      console.error("Calendar auth error:", error)
      alert("Failed to connect to Google Calendar")
    }
  }

  const syncTasks = async () => {
    if (!user) return

    try {
      // Get user's stored tokens
      const userResponse = await fetch(`/api/users?uid=${user.uid}`)
      const userData = await userResponse.json()
      
      if (!userData.googleCalendarTokens) {
        alert("Please connect to Google Calendar first")
        return
      }

      const response = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          accessToken: userData.googleCalendarTokens.accessToken,
          refreshToken: userData.googleCalendarTokens.refreshToken,
        }),
      })

      const result = await response.json()
      if (result.success) {
        alert(`Successfully synced ${result.syncedTasks} tasks to Google Calendar!`)
      } else {
        alert("Failed to sync tasks to calendar")
      }
    } catch (error) {
      console.error("Sync error:", error)
      alert("Failed to sync tasks to calendar")
    }
  }

  const handleLogout = () => {
    // Clear user session/tokens
    localStorage.removeItem("userToken")
    // Redirect to login
    window.location.href = "/auth/login"
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">IntelliTask</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLogout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Daily Progress */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Today's Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Completed</span>
                        <span>
                          {completedTasks.length}/{allTasks.length}
                        </span>
                      </div>
                      <Progress value={dailyProgress} className="h-2" />
                      <p className="text-xs text-gray-500">{Math.round(dailyProgress)}% complete</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Task Lists */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Task Lists</CardTitle>
                      <Dialog open={isNewListOpen} onOpenChange={setIsNewListOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Create New List</DialogTitle>
                            <DialogDescription>Add a new task list to organize your tasks.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="listName" className="text-right">
                                Name
                              </Label>
                              <Input
                                id="listName"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g., Shopping, Work, Personal"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={addTaskList}>Create List</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {taskLists.map((list) => (
                      <button
                        key={list.id}
                        onClick={() => setSelectedList(list.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                          selectedList === list.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${list.color}`} />
                          <span className="text-sm font-medium">{list.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {list.tasks.length}
                        </Badge>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                {/* Integration Status */}
                <IntegrationStatus />
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{currentList?.name}</h2>
                    <p className="text-gray-500">
                      {filteredTasks.filter((t) => !t.completed).length} pending,{" "}
                      {filteredTasks.filter((t) => t.completed).length} completed
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleShare(selectedList)}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCalendarSync}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Sync Calendar
                    </Button>
                    <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Add New Task</DialogTitle>
                          <DialogDescription>Create a new task in {currentList?.name}.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">
                              Title
                            </Label>
                            <Input
                              id="title"
                              value={newTask.title}
                              onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                              className="col-span-3"
                              placeholder="Task title"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                              Description
                            </Label>
                            <Textarea
                              id="description"
                              value={newTask.description}
                              onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                              className="col-span-3"
                              placeholder="Task description"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dueDate" className="text-right">
                              Due Date
                            </Label>
                            <Input
                              id="dueDate"
                              type="date"
                              value={newTask.dueDate}
                              onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
                              className="col-span-3"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={addTask}>Add Task</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  {filteredTasks.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <CheckCircle2 className="w-12 h-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                        <p className="text-gray-500 text-center mb-4">
                          {searchQuery ? "No tasks match your search." : "Get started by adding your first task."}
                        </p>
                        {!searchQuery && (
                          <Button onClick={() => setIsNewTaskOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Task
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    filteredTasks.map((task) => (
                      <Card key={task.id} className={`transition-all ${task.completed ? "opacity-75" : ""}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <button onClick={() => toggleTask(task.id)} className="mt-1 flex-shrink-0">
                              {task.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <h3
                                className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}
                              >
                                {task.title}
                              </h3>
                              {task.description && (
                                <p
                                  className={`text-sm mt-1 ${task.completed ? "line-through text-gray-400" : "text-gray-600"}`}
                                >
                                  {task.description}
                                </p>
                              )}
                              {task.dueDate && (
                                <div className="flex items-center mt-2">
                                  <CalendarDays className="w-4 h-4 text-gray-400 mr-1" />
                                  <span className="text-xs text-gray-500">
                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
