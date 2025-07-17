"use client"

import { Label } from "@/components/ui/label"

import Link from "next/link"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CalendarDays, CheckCircle, ListTodo, XCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import ProtectedRoute from "@/components/ProtectedRoute"
import IntegrationStatus from "@/components/IntegrationStatus"
import LoadingSpinner from "@/components/LoadingSpinner"
import type { Task, TaskList } from "@/types"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { Target } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface AnalyticsOverview {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  completionRate: number
}

interface AnalyticsPeriod {
  tasksCreated: number
  tasksCompleted: number
  period: string
}

interface AnalyticsTrend {
  _id: string // Date string e.g., "2023-10-26"
  count: number
}

interface AnalyticsData {
  overview: AnalyticsOverview
  period: AnalyticsPeriod
  trend: AnalyticsTrend[]
}

export default function IntelliTaskDashboard() {
  const { user, logout } = useAuth()
  const { sendNotification } = usePushNotifications()
  const [taskLists, setTaskLists] = useState<TaskList[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedList, setSelectedList] = useState<string>("")
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false)
  const [isNewListOpen, setIsNewListOpen] = useState(false)
  const [newTask, setNewTask] = useState({ title: "", description: "", dueDate: "" })
  const [newListName, setNewListName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [syncingCalendar, setSyncingCalendar] = useState(false)

  // Fetch task lists
  useEffect(() => {
    if (!user) return

    const fetchTaskLists = async () => {
      try {
        const response = await fetch(`/api/task-lists?uid=${user.uid}`)
        if (!response.ok) throw new Error("Failed to fetch task lists")
        const lists = await response.json()
        setTaskLists(lists)
        if (lists.length > 0 && !selectedList) {
          setSelectedList(lists[0].id)
        }
      } catch (error) {
        console.error("Error fetching task lists:", error)
        setError("Failed to load task lists")
      }
    }

    fetchTaskLists()
  }, [user, selectedList])

  // Fetch tasks
  useEffect(() => {
    if (!user) return

    const fetchTasks = async () => {
      try {
        const url = selectedList ? `/api/tasks?uid=${user.uid}&listId=${selectedList}` : `/api/tasks?uid=${user.uid}`

        const response = await fetch(url)
        if (!response.ok) throw new Error("Failed to fetch tasks")
        const taskList = await response.json()
        setTasks(taskList)
      } catch (error) {
        console.error("Error fetching tasks:", error)
        setError("Failed to load tasks")
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [user, selectedList])

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics?userId=${user?.uid}`)
      if (!response.ok) {
        throw new Error("Failed to fetch analytics")
      }
      const data = await response.json()
      setAnalytics(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load dashboard analytics.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCalendarSync = async () => {
    if (!user) return

    setSyncingCalendar(true)
    try {
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.uid }),
      })

      if (!response.ok) {
        throw new Error("Failed to sync Google Calendar")
      }

      const data = await response.json()
      toast({
        title: "Calendar Sync Complete",
        description: `Successfully synced ${data.syncedTasks} tasks to Google Calendar.`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sync Google Calendar.",
        variant: "destructive",
      })
    } finally {
      setSyncingCalendar(false)
    }
  }

  const addTask = async () => {
    if (!newTask.title.trim() || !user || !selectedList) return

    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.dueDate,
        completed: false,
        listId: selectedList,
        userId: user.uid,
      }

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) throw new Error("Failed to create task")

      const result = await response.json()
      const newTaskWithId = { ...taskData, id: result.id }

      setTasks((prev) => [...prev, newTaskWithId])
      setNewTask({ title: "", description: "", dueDate: "" })
      setIsNewTaskOpen(false)

      // Send notification for new task
      if (newTask.dueDate) {
        await sendNotification(
          "New Task Created",
          `Task "${newTask.title}" has been added with due date ${newTask.dueDate}`,
        )
      }
    } catch (error) {
      console.error("Error creating task:", error)
      setError("Failed to create task")
    }
  }

  const addTaskList = async () => {
    if (!newListName.trim() || !user) return

    try {
      const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-red-500", "bg-yellow-500", "bg-indigo-500"]
      const listData = {
        name: newListName,
        color: colors[Math.floor(Math.random() * colors.length)],
        userId: user.uid,
      }

      const response = await fetch("/api/task-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listData),
      })

      if (!response.ok) throw new Error("Failed to create task list")

      const result = await response.json()
      const newListWithId = { ...listData, id: result.id }

      setTaskLists((prev) => [...prev, newListWithId])
      setNewListName("")
      setIsNewListOpen(false)
      setSelectedList(newListWithId.id)
    } catch (error) {
      console.error("Error creating task list:", error)
      setError("Failed to create task list")
    }
  }

  const toggleTask = async (taskId: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return

      const updatedTask = { ...task, completed: !task.completed }

      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      })

      if (!response.ok) throw new Error("Failed to update task")

      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)))

      // Send notification for task completion
      if (updatedTask.completed) {
        await sendNotification("Task Completed!", `Great job! You completed "${task.title}"`)
      }
    } catch (error) {
      console.error("Error updating task:", error)
      setError("Failed to update task")
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete task")

      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    } catch (error) {
      console.error("Error deleting task:", error)
      setError("Failed to delete task")
    }
  }

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleShare = async (listId: string) => {
    const shareUrl = `${window.location.origin}/shared/${listId}`
    try {
      await navigator.clipboard.writeText(shareUrl)
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

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const currentList = taskLists.find((list) => list.id === selectedList)
  const currentTasks = tasks.filter((task) => !selectedList || task.listId === selectedList)

  // Calculate progress
  const allTasks = tasks
  const completedTasks = allTasks.filter((task) => task.completed)
  const dailyProgress = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your tasks..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-500 text-center mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
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
                <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <Button variant="ghost" size="icon">
                <XCircle className="w-5 h-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.photoURL || "/placeholder.svg?height=32&width=32"} alt="User" />
                      <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <ListTodo className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <XCircle className="mr-2 h-4 w-4" />
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
                      <CalendarDays className="w-4 h-4 mr-2" />
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
                            <ListTodo className="w-4 h-4" />
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
                          {tasks.filter((t) => t.listId === list.id).length}
                        </Badge>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                {/* Integration Status */}
                <IntegrationStatus 
                  name="Google Calendar" 
                  status="healthy" 
                  message="Integration is working properly"
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{currentList?.name || "All Tasks"}</h2>
                    <p className="text-gray-500">
                      {filteredTasks.filter((t) => !t.completed).length} pending,{" "}
                      {filteredTasks.filter((t) => t.completed).length} completed
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {selectedList && (
                      <Button variant="outline" size="sm" onClick={() => handleShare(selectedList)}>
                        <ListTodo className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleCalendarSync} disabled={syncingCalendar}>
                      {syncingCalendar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Sync Calendar
                    </Button>
                    <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" disabled={!selectedList}>
                          <ListTodo className="w-4 h-4 mr-2" />
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
                            <Input
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
                        <CheckCircle className="w-12 h-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                        <p className="text-gray-500 text-center mb-4">
                          {searchQuery
                            ? "No tasks match your search."
                            : selectedList
                              ? "Get started by adding your first task."
                              : "Select a task list to view tasks."}
                        </p>
                        {!searchQuery && selectedList && (
                          <Button onClick={() => setIsNewTaskOpen(true)}>
                            <ListTodo className="w-4 h-4 mr-2" />
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
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
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
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <ListTodo className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-red-600">
                                  <XCircle className="mr-2 h-4 w-4" />
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

            {/* Analytics */}
            <div className="lg:col-span-4">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    <ListTodo className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.overview.totalTasks ?? 0}</div>
                    <p className="text-xs text-muted-foreground">All tasks created</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.overview.completedTasks ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Tasks marked as done</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.overview.pendingTasks ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Tasks not yet completed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.overview.overdueTasks ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Tasks past their due date</p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Progress value={analytics?.overview.completionRate ?? 0} className="h-2 flex-1" />
                      <span className="text-sm font-medium">{analytics?.overview.completionRate ?? 0}%</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Percentage of tasks completed out of total tasks.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <Button onClick={handleCalendarSync} disabled={syncingCalendar}>
                      {syncingCalendar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Sync Google Calendar
                    </Button>
                    <Button variant="outline">View All Tasks</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
