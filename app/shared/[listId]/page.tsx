"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  dueDate?: string
}

export default function SharedListPage() {
  const { listId } = useParams()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [listName, setListName] = useState("Shared Task List")

  useEffect(() => {
    if (listId) {
      fetchTasks()
      fetchListName()
    }
  }, [listId])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tasks?listId=${listId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch tasks")
      }
      const data = await response.json()
      setTasks(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load tasks.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchListName = async () => {
    try {
      const response = await fetch(`/api/task-lists?id=${listId}`) // Assuming an API to fetch single list by ID
      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0) {
          setListName(data[0].name)
        }
      }
    } catch (error) {
      console.error("Failed to fetch list name:", error)
    }
  }

  const handleTaskCompletionChange = async (taskId: string, completed: boolean) => {
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, completed } : task)))

    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: taskId, completed }),
      })

      if (!response.ok) {
        throw new Error("Failed to update task")
      }
      toast({
        title: "Task Updated",
        description: `Task "${tasks.find((t) => t.id === taskId)?.title}" marked as ${completed ? "completed" : "incomplete"}.`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update task.",
        variant: "destructive",
      })
      // Revert UI if API call fails
      setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, completed: !completed } : task)))
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
      <h1 className="mb-6 text-3xl font-bold">{listName}</h1>

      {tasks.length === 0 ? (
        <p className="text-muted-foreground">No tasks in this list yet.</p>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.completed}
                  onCheckedChange={(checked: boolean) => handleTaskCompletionChange(task.id, checked)}
                />
                <div className="grid gap-1.5">
                  <Label
                    htmlFor={`task-${task.id}`}
                    className={`text-lg font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}
                  >
                    {task.title}
                  </Label>
                  {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                  {task.dueDate && <p className="text-xs text-muted-foreground">Due: {task.dueDate}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
