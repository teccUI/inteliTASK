"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { ListTodo, MoreVertical, Plus, Edit2, Trash2, Loader2, CheckCircle, Clock, Save, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { TaskList, Task } from "@/types"

export default function TaskListsPage() {
  const { user } = useAuth()
  const [taskLists, setTaskLists] = useState<TaskList[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewListOpen, setIsNewListOpen] = useState(false)
  const [editingList, setEditingList] = useState<TaskList | null>(null)
  const [viewingList, setViewingList] = useState<TaskList | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newListName, setNewListName] = useState("")
  const [editListForm, setEditListForm] = useState({ name: "", description: "" })
  const [editTaskForm, setEditTaskForm] = useState({ title: "", description: "", dueDate: "" })

  const fetchTaskLists = useCallback(async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/task-lists?uid=${user.uid}`)
      if (!response.ok) throw new Error("Failed to fetch task lists")
      const lists = await response.json()
      setTaskLists(lists)
    } catch (error) {
      console.error("Error fetching task lists:", error)
      toast({
        title: "Error",
        description: "Failed to load task lists.",
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchTasks = useCallback(async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/tasks?uid=${user.uid}`)
      if (!response.ok) throw new Error("Failed to fetch tasks")
      const taskList = await response.json()
      setTasks(taskList)
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchTaskLists()
      fetchTasks()
    }
  }, [user, fetchTaskLists, fetchTasks])

  const addTaskList = async () => {
    if (!newListName.trim() || !user) return

    try {
      const response = await fetch("/api/task-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newListName,
          color: "bg-blue-500",
          userId: user.uid,
        }),
      })

      if (!response.ok) throw new Error("Failed to create task list")

      const result = await response.json()
      const newList = {
        id: result.id,
        name: newListName,
        color: "bg-blue-500",
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setTaskLists((prev) => [...prev, newList as TaskList])
      setNewListName("")
      setIsNewListOpen(false)

      toast({
        title: "Success",
        description: "Task list created successfully.",
      })
    } catch (error) {
      console.error("Error creating task list:", error)
      toast({
        title: "Error",
        description: "Failed to create task list.",
      })
    }
  }

  const openEditList = (list: TaskList) => {
    setEditingList(list)
    setEditListForm({
      name: list.name,
      description: list.description || "",
    })
  }

  const updateTaskList = async () => {
    if (!editingList || !editListForm.name.trim() || !user) return

    try {
      const response = await fetch("/api/task-lists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingList.id,
          name: editListForm.name,
          description: editListForm.description,
          color: editingList.color,
          userId: user.uid,
        }),
      })

      if (!response.ok) throw new Error("Failed to update task list")

      setTaskLists((prev) =>
        prev.map((list) =>
          list.id === editingList.id
            ? { ...list, name: editListForm.name, description: editListForm.description }
            : list
        )
      )
      setEditingList(null)

      toast({
        title: "Success",
        description: "Task list updated successfully.",
      })
    } catch (error) {
      console.error("Error updating task list:", error)
      toast({
        title: "Error",
        description: "Failed to update task list.",
      })
    }
  }

  const deleteTaskList = async (listId: string) => {
    if (!user) return

    // Check if list has tasks
    const listTasks = tasks.filter((task) => task.listId === listId)
    if (listTasks.length > 0) {
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

      setTaskLists((prev) => prev.filter((list) => list.id !== listId))

      toast({
        title: "Success",
        description: "Task list deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting task list:", error)
      toast({
        title: "Error",
        description: "Failed to delete task list.",
      })
    }
  }

  const getTaskCountForList = (listId: string) => {
    return tasks.filter((task) => task.listId === listId).length
  }

  const getCompletedTaskCountForList = (listId: string) => {
    return tasks.filter((task) => task.listId === listId && task.completed).length
  }

  const getTasksForList = (listId: string) => {
    return tasks.filter((task) => task.listId === listId)
  }

  const openEditTask = (task: Task) => {
    setEditingTask(task)
    setEditTaskForm({
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
    })
  }

  const updateTask = async () => {
    if (!editingTask || !editTaskForm.title.trim() || !user) return

    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTask.id,
          title: editTaskForm.title,
          description: editTaskForm.description,
          dueDate: editTaskForm.dueDate || null,
          completed: editingTask.completed,
          listId: editingTask.listId,
          userId: user.uid,
        }),
      })

      if (!response.ok) throw new Error("Failed to update task")

      setTasks((prev) =>
        prev.map((task) =>
          task.id === editingTask.id
            ? { 
                ...task, 
                title: editTaskForm.title, 
                description: editTaskForm.description,
                dueDate: editTaskForm.dueDate || null,
              }
            : task
        )
      )
      setEditingTask(null)

      toast({
        title: "Success",
        description: "Task updated successfully.",
      })
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "Failed to update task.",
      })
    }
  }

  const toggleTaskCompletion = async (task: Task) => {
    if (!user) return

    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          completed: !task.completed,
          listId: task.listId,
          userId: user.uid,
        }),
      })

      if (!response.ok) throw new Error("Failed to update task")

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, completed: !t.completed } : t
        )
      )

      toast({
        title: "Success",
        description: `Task ${!task.completed ? "completed" : "reopened"}.`,
      })
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "Failed to update task.",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Task Lists</h1>
        <Dialog open={isNewListOpen} onOpenChange={setIsNewListOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New List
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Task List</DialogTitle>
              <DialogDescription>Give your new task list a name to get started.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="list-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="list-name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter list name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addTaskList}>Create List</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {taskLists.length === 0 ? (
        <div className="text-center py-12">
          <ListTodo className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No task lists yet</h3>
          <p className="text-muted-foreground mb-4">Create your first task list to organize your tasks.</p>
          <Button onClick={() => setIsNewListOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First List
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {taskLists.map((list) => {
            const taskCount = getTaskCountForList(list.id)
            const completedCount = getCompletedTaskCountForList(list.id)
            const completionPercentage = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0

            return (
              <Card key={list.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${list.color}`} />
                    <CardTitle className="text-sm font-medium">{list.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditList(list)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteTaskList(list.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{taskCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {completedCount} of {taskCount} completed
                  </p>
                  {taskCount > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setViewingList(list)}
                    >
                      View Tasks
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Task List Dialog */}
      <Dialog open={editingList !== null} onOpenChange={(open) => !open && setEditingList(null)}>
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
            <Button onClick={updateTaskList}>Update List</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Tasks Modal */}
      <Dialog open={viewingList !== null} onOpenChange={(open) => {
        if (!open) {
          setViewingList(null)
          setEditingTask(null)
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[600px]">
          <DialogHeader>
            <DialogTitle>Tasks in {viewingList?.name}</DialogTitle>
            <DialogDescription>
              {getTaskCountForList(viewingList?.id || "")} total tasks, {getCompletedTaskCountForList(viewingList?.id || "")} completed
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {viewingList && getTasksForList(viewingList.id).length === 0 ? (
              <div className="text-center py-8">
                <ListTodo className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No tasks in this list yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {viewingList && getTasksForList(viewingList.id).map((task) => (
                  <div key={task.id}>
                    {editingTask?.id === task.id ? (
                      <div className="p-3 rounded-lg border bg-background space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="edit-task-title">Title</Label>
                          <Input
                            id="edit-task-title"
                            value={editTaskForm.title}
                            onChange={(e) => setEditTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="Task title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-task-description">Description</Label>
                          <Textarea
                            id="edit-task-description"
                            value={editTaskForm.description}
                            onChange={(e) => setEditTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Task description (optional)"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-task-duedate">Due Date</Label>
                          <Input
                            id="edit-task-duedate"
                            type="date"
                            value={editTaskForm.dueDate}
                            onChange={(e) => setEditTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTask(null)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={updateTask}
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          task.completed ? "bg-muted/50" : "bg-background"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleTaskCompletion(task)}
                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              task.completed ? "bg-green-500" : "border-2 border-muted-foreground hover:border-green-500"
                            } transition-colors`}
                          >
                            {task.completed && <CheckCircle className="w-3 h-3 text-white" />}
                          </button>
                          <div className="flex-1">
                            <h4 className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {task.dueDate && (
                            <div className={`flex items-center text-xs px-2 py-1 rounded ${
                              new Date(task.dueDate) < new Date() && !task.completed
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}>
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditTask(task)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingList(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}