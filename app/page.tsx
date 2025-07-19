"use client"

import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useEffect, useState, useCallback } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [newTask, setNewTask] = useState({ title: "", description: "", dueDate: "", listId: "" })
  const [newListName, setNewListName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, setAnalytics] = useState<AnalyticsData | null>(null)
  const [syncingCalendar, setSyncingCalendar] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editTaskForm, setEditTaskForm] = useState({ title: "", description: "", dueDate: "" })
  const [editingTaskList, setEditingTaskList] = useState<TaskList | null>(null)
  const [editListForm, setEditListForm] = useState({ name: "", description: "" })

  // Memoize fetchTasks to prevent re-creation on every render
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    try {
      // Always fetch ALL tasks, not filtered by selectedList
      const url = `/api/tasks?uid=${user.uid}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const taskList = await response.json();
      setTasks(taskList);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError("Failed to load tasks");
    }
  }, [user]);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/analytics?userId=${user.uid}`)
      if (!response.ok) {
        throw new Error("Failed to fetch analytics")
      }
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load dashboard analytics.",
      })
    }
  }, [user])

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
        // Create a default list if none exist
        if (lists.length === 0) {
          const defaultListData = {
            name: "My Tasks",
            color: "bg-blue-500",
            userId: user.uid,
          }
          const createResponse = await fetch("/api/task-lists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(defaultListData),
          })
          if (createResponse.ok) {
            const result = await createResponse.json()
            const newList = { 
              ...defaultListData, 
              id: result.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            setTaskLists([newList])
            setSelectedList(newList.id)
          }
        }
      } catch (error) {
        console.error("Error fetching task lists:", error)
        setError("Failed to load task lists")
      }
    }

    fetchTaskLists()
  }, [user]) // Remove selectedList dependency to prevent loops

  // Combined data fetching for better performance
  useEffect(() => {
    if (user) {
      setLoading(true);
      
      // Fetch all data in parallel
      Promise.all([
        fetchTasks(),
        fetchAnalytics()
      ]).finally(() => setLoading(false));
    }
  }, [user, fetchTasks, fetchAnalytics]);

  // Auto-assign tasks without listId to the first available list
  useEffect(() => {
    if (tasks.length > 0 && taskLists.length > 0) {
      const tasksWithoutListId = tasks.filter(task => !task.listId || task.listId === null || task.listId === undefined);
      if (tasksWithoutListId.length > 0) {
        const firstListId = taskLists[0].id;
        console.log(`Auto-assigning ${tasksWithoutListId.length} tasks to list ${firstListId}`);
        
        // Update tasks without listId using Promise.all for better performance
        const updatePromises = tasksWithoutListId.map(async (task) => {
          try {
            const response = await fetch("/api/tasks", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...task, listId: firstListId }),
            });
            if (response.ok) {
              return { ...task, listId: firstListId };
            }
            return task;
          } catch (error) {
            console.error("Error updating task listId:", error);
            return task;
          }
        });

        // Update all tasks at once after all API calls complete
        Promise.all(updatePromises).then((updatedTasks) => {
          setTasks(prev => prev.map(task => {
            const updatedTask = updatedTasks.find(updated => updated.id === task.id);
            return updatedTask || task;
          }));
        });
      }
    }
  }, [tasks, taskLists]);

  // --- THIS IS THE FULLY CORRECTED FUNCTION ---
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
        throw new Error("Failed to sync Google Tasks")
      }

      const data = await response.json()

      // 1. UPDATE THE TOAST MESSAGE to reflect the new API response
      toast({
        title: "Calendar Sync Complete",
        description: `Successfully synced ${data.newTasksSynced} new tasks from Google.`,
      })

      // 2. RE-FETCH THE TASKS to update the UI with the new data
      await fetchTasks();

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sync Google Tasks.",
      })
    } finally {
      setSyncingCalendar(false)
    }
  }

  const addTask = async () => {
    if (!newTask.title.trim() || !user || !newTask.listId) return

    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.dueDate,
        completed: false,
        listId: newTask.listId,
        userId: user.uid,
      }

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) throw new Error("Failed to create task")

      const result = await response.json()
      const newTaskWithId = { 
        ...taskData, 
        id: result.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setTasks((prev) => [...prev, newTaskWithId as Task])
      setNewTask({ title: "", description: "", dueDate: "", listId: "" })
      setIsNewTaskOpen(false)

      // Send push notification
      if (newTask.dueDate) {
        await sendNotification(
          "New Task Created",
          `Task "${newTask.title}" has been added with due date ${newTask.dueDate}`,
        )
      }

      // Send email notification
      if (user) {
        try {
          await fetch("/api/notifications/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.uid,
              type: "task_created",
              data: {
                taskTitle: newTask.title,
                dueDate: newTask.dueDate
              }
            })
          })
        } catch (error) {
          console.warn("Failed to send email notification:", error)
        }
      }
    } catch (error) {
      console.error("Error creating task:", error)
      setError("Failed to create task")
    }
  }

  const openEditTask = (task: Task) => {
    setEditingTask(task)
    setEditTaskForm({
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate || ""
    })
  }

  const updateTask = async () => {
    if (!editingTask || !editTaskForm.title.trim() || !user) return

    try {
      const taskData = {
        title: editTaskForm.title,
        description: editTaskForm.description,
        dueDate: editTaskForm.dueDate,
      }

      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) throw new Error("Failed to update task")

      const updatedTask = { 
        ...editingTask, 
        ...taskData,
        updatedAt: new Date().toISOString()
      }

      setTasks((prev) => prev.map(task => 
        task.id === editingTask.id ? updatedTask : task
      ))
      setEditingTask(null)
      setEditTaskForm({ title: "", description: "", dueDate: "" })

      toast({
        title: "Task Updated",
        description: `Task "${taskData.title}" has been updated successfully.`,
      })
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
      })
    }
  }

  const openEditTaskList = (taskList: TaskList) => {
    setEditingTaskList(taskList)
    setEditListForm({
      name: taskList.name,
      description: taskList.description || ""
    })
  }

  const updateTaskList = async () => {
    if (!editingTaskList || !editListForm.name.trim() || !user) return

    try {
      const listData = {
        id: editingTaskList.id,
        name: editListForm.name,
        description: editListForm.description,
      }

      const response = await fetch("/api/task-lists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listData),
      })

      if (!response.ok) throw new Error("Failed to update task list")

      const updatedTaskList = { 
        ...editingTaskList, 
        name: editListForm.name,
        description: editListForm.description,
        updatedAt: new Date().toISOString()
      }

      setTaskLists((prev) => prev.map(list => 
        list.id === editingTaskList.id ? updatedTaskList : list
      ))
      setEditingTaskList(null)
      setEditListForm({ name: "", description: "" })

      toast({
        title: "Task List Updated",
        description: `Task list "${editListForm.name}" has been updated successfully.`,
      })
    } catch (error) {
      console.error("Error updating task list:", error)
      toast({
        title: "Error",
        description: "Failed to update task list. Please try again.",
      })
    }
  }

  const deleteTaskList = async (listId: string) => {
    if (!user) return

    const listToDelete = taskLists.find(list => list.id === listId)
    if (!listToDelete) return

    // Check if there are tasks in this list
    const tasksInList = tasks.filter(task => task.listId === listId)
    if (tasksInList.length > 0) {
      toast({
        title: "Cannot Delete List",
        description: "Please move or delete all tasks before deleting the list.",
      })
      return
    }

    try {
      const response = await fetch(`/api/task-lists?id=${listId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete task list")

      setTaskLists((prev) => prev.filter(list => list.id !== listId))
      
      // If this was the selected list, select the first remaining list
      if (selectedList === listId) {
        const remainingLists = taskLists.filter(list => list.id !== listId)
        setSelectedList(remainingLists.length > 0 ? remainingLists[0].id : "")
      }

      toast({
        title: "Task List Deleted",
        description: `Task list "${listToDelete.name}" has been deleted.`,
      })
    } catch (error) {
      console.error("Error deleting task list:", error)
      toast({
        title: "Error",
        description: "Failed to delete task list. Please try again.",
      })
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
      const newListWithId = { 
        ...listData, 
        id: result.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setTaskLists((prev) => [...prev, newListWithId as TaskList])
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

      if (updatedTask.completed) {
        await sendNotification("Task Completed!", `Great job! You completed "${task.title}"`)
        
        // Send email notification for task completion
        if (user) {
          try {
            await fetch("/api/notifications/email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.uid,
                type: "task_completed",
                data: {
                  taskTitle: task.title
                }
              })
            })
          } catch (error) {
            console.warn("Failed to send email notification:", error)
          }
        }
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

  // Filter tasks for the selected list (for display in main area)
  const selectedListTasks = selectedList 
    ? tasks.filter((task) => task.listId === selectedList)
    : tasks

  // If no tasks found for selected list, show all tasks temporarily
  const displayTasks = selectedListTasks.length === 0 && selectedList 
    ? tasks.filter(task => !task.listId || task.listId === null || task.listId === undefined)
    : selectedListTasks

  const filteredTasks = displayTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Debug logging (can be removed in production)
  if (process.env.NODE_ENV === 'development') {
    console.log("Debug info:", {
      selectedList,
      totalTasks: tasks.length,
      selectedListTasks: selectedListTasks.length,
      displayTasks: displayTasks.length,
      filteredTasks: filteredTasks.length,
      searchQuery,
      allTasks: tasks.map(t => ({ id: t.id, title: t.title, listId: t.listId })),
      tasksWithoutListId: tasks.filter(t => !t.listId).length,
      taskLists: taskLists.map(l => ({ id: l.id, name: l.name }))
    })
  }

  const handleShare = async (listId: string) => {
    const shareUrl = `${window.location.origin}/shared/${listId}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert("Share link copied to clipboard!")
    } catch {
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
  
  // Calculate metrics for ALL tasks (not just selected list)
  const allTasks = tasks
  const completedTasks = allTasks.filter((task) => task.completed)
  const dailyProgress = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your tasks..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-foreground">IntelliTask</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
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

        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Horizontal Task Lists Section - Show when more than 2 lists */}
          {taskLists.length > 2 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Task Lists</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {taskLists.map((list) => (
                  <Card 
                    key={list.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedList === list.id ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2" onClick={() => setSelectedList(list.id)}>
                          <div className={`w-4 h-4 rounded-full ${list.color}`} />
                          <CardTitle className="text-sm font-medium">{list.name}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {tasks.filter((t) => t.listId === list.id).length}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                                <XCircle className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditTaskList(list)}>
                                <ListTodo className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteTaskList(list.id)} className="text-red-600">
                                <XCircle className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent onClick={() => setSelectedList(list.id)}>
                      <div className="text-xs text-muted-foreground">
                        {tasks.filter((t) => t.listId === list.id && t.completed).length} completed, {" "}
                        {tasks.filter((t) => t.listId === list.id && !t.completed).length} pending
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <aside className="lg:col-span-1">
              <div className="space-y-6">
                {/* Task Metrics Cards */}
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Target className="w-4 h-4 mr-2" />
                        Total Tasks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">{allTasks.length}</div>
                      <p className="text-xs text-muted-foreground mt-1">All tasks created</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Completed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
                      <p className="text-xs text-muted-foreground mt-1">Tasks completed</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <ListTodo className="w-4 h-4 mr-2 text-blue-500" />
                        Pending
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{allTasks.filter(t => !t.completed).length}</div>
                      <p className="text-xs text-muted-foreground mt-1">Tasks pending</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <XCircle className="w-4 h-4 mr-2 text-red-500" />
                        Overdue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {allTasks.filter(task => 
                          !task.completed && 
                          task.dueDate && 
                          new Date(task.dueDate) < new Date()
                        ).length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Overdue tasks</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <CalendarDays className="w-4 h-4 mr-2 text-purple-500" />
                        Completion Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">{Math.round(dailyProgress)}%</div>
                      <p className="text-xs text-muted-foreground mt-1">Overall completion</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <CalendarDays className="w-4 h-4 mr-2" />
                      Today&apos;s Progress
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
                      <p className="text-xs text-muted-foreground">{Math.round(dailyProgress)}% complete</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Only show task lists in sidebar when there are 2 or fewer lists */}
                {taskLists.length <= 2 && (
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
                        <div
                          key={list.id}
                          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                            selectedList === list.id 
                              ? "bg-accent text-accent-foreground border-2 border-primary" 
                              : "hover:bg-accent/50 hover:text-accent-foreground"
                          }`}
                        >
                          <div className="flex items-center space-x-3 flex-1 cursor-pointer" onClick={() => setSelectedList(list.id)}>
                            <div className={`w-3 h-3 rounded-full ${list.color}`} />
                            <span className="text-sm font-medium">{list.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={selectedList === list.id ? "default" : "outline"} className="text-xs">
                              {tasks.filter((t) => t.listId === list.id).length}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <XCircle className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditTaskList(list)}>
                                  <ListTodo className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteTaskList(list.id)} className="text-red-600">
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                
                {/* Show Add List button when there are more than 2 lists */}
                {taskLists.length > 2 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Dialog open={isNewListOpen} onOpenChange={setIsNewListOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <ListTodo className="w-4 h-4 mr-2" />
                            Add New List
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
                    </CardContent>
                  </Card>
                )}

                <IntegrationStatus 
                  name="Google Calendar" 
                  status="healthy" 
                  message="Integration is working properly"
                />
              </div>
            </aside>

            <section className="lg:col-span-3">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{currentList?.name || "All Tasks"}</h2>
                    <p className="text-muted-foreground">
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
                        <Button size="sm">
                          <ListTodo className="w-4 h-4 mr-2" />
                          Add Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Add New Task</DialogTitle>
                          <DialogDescription>Create a new task and assign it to a task list.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="task-list" className="text-right">
                              Task List
                            </Label>
                            <Select
                              value={newTask.listId}
                              onValueChange={(value) => setNewTask((prev) => ({ ...prev, listId: value }))}
                            >
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a task list" />
                              </SelectTrigger>
                              <SelectContent>
                                {taskLists.map((list) => (
                                  <SelectItem key={list.id} value={list.id}>
                                    {list.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
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

                {/* Edit Task Dialog */}
                <Dialog open={editingTask !== null} onOpenChange={(open) => !open && setEditingTask(null)}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Edit Task</DialogTitle>
                      <DialogDescription>Update the details of your task.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-title" className="text-right">
                          Title
                        </Label>
                        <Input
                          id="edit-title"
                          value={editTaskForm.title}
                          onChange={(e) => setEditTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-description" className="text-right">
                          Description
                        </Label>
                        <Input
                          id="edit-description"
                          value={editTaskForm.description}
                          onChange={(e) => setEditTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                          className="col-span-3"
                          placeholder="Optional description"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-dueDate" className="text-right">
                          Due Date
                        </Label>
                        <Input
                          id="edit-dueDate"
                          type="date"
                          value={editTaskForm.dueDate}
                          onChange={(e) => setEditTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditingTask(null)}>
                        Cancel
                      </Button>
                      <Button onClick={updateTask}>Update Task</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Edit Task List Dialog */}
                <Dialog open={editingTaskList !== null} onOpenChange={(open) => !open && setEditingTaskList(null)}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Edit Task List</DialogTitle>
                      <DialogDescription>Update the details of your task list.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-list-name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="edit-list-name"
                          value={editListForm.name}
                          onChange={(e) => setEditListForm((prev) => ({ ...prev, name: e.target.value }))}
                          className="col-span-3"
                          placeholder="Task list name"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-list-description" className="text-right">
                          Description
                        </Label>
                        <Input
                          id="edit-list-description"
                          value={editListForm.description}
                          onChange={(e) => setEditListForm((prev) => ({ ...prev, description: e.target.value }))}
                          className="col-span-3"
                          placeholder="Optional description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditingTaskList(null)}>
                        Cancel
                      </Button>
                      <Button onClick={updateTaskList}>Update List</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

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
                      <Card key={task.id} className={`transition-all hover:shadow-md hover:bg-accent/5 cursor-pointer ${task.completed ? "opacity-75" : ""}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <button onClick={() => toggleTask(task.id)} className="mt-1 flex-shrink-0">
                              {task.completed ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <h3
                                className={`font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                              >
                                {task.title}
                              </h3>
                              {task.description && (
                                <p
                                  className={`text-sm mt-1 ${task.completed ? "line-through text-muted-foreground" : "text-muted-foreground"}`}
                                >
                                  {task.description}
                                </p>
                              )}
                              {task.dueDate && (
                                <div className="flex items-center mt-2">
                                  <CalendarDays className="w-4 h-4 text-muted-foreground mr-1" />
                                  <span className={`text-xs ${
                                    new Date(task.dueDate) < new Date() && !task.completed 
                                      ? "text-red-500" 
                                      : "text-muted-foreground"
                                  }`}>
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
                                <DropdownMenuItem onClick={() => openEditTask(task)}>
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
            </section>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}