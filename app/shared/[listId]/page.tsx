"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, CheckCircle, ListTodo, XCircle } from "lucide-react"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  dueDate?: string
}

interface ListInfo {
  id: string
  name: string
  description?: string
  color: string
}

export default function SharedListPage() {
  const { listId } = useParams()
  const [tasks, setTasks] = useState<Task[]>([])
  const [listInfo, setListInfo] = useState<ListInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSharedData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/shared/tasks?listId=${listId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch shared tasks")
      }
      const data = await response.json()
      setTasks(data.tasks)
      setListInfo(data.listInfo)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load shared tasks.",
      })
    } finally {
      setLoading(false)
    }
  }, [listId])

  useEffect(() => {
    if (listId) {
      fetchSharedData()
    }
  }, [listId, fetchSharedData])


  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-6 h-6 rounded-full ${listInfo?.color || "bg-blue-500"}`} />
            <h1 className="text-3xl font-bold text-foreground">{listInfo?.name || "Shared Task List"}</h1>
            <Badge variant="outline" className="ml-2">
              <ListTodo className="w-3 h-3 mr-1" />
              Shared
            </Badge>
          </div>
          {listInfo?.description && (
            <p className="text-muted-foreground text-lg">{listInfo.description}</p>
          )}
          
          {/* Task Summary */}
          <div className="flex items-center space-x-6 mt-4 p-4 bg-accent/10 rounded-lg">
            <div className="flex items-center space-x-2">
              <ListTodo className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">
                {tasks.length} Total Tasks
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">
                {tasks.filter(task => task.completed).length} Completed
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">
                {tasks.filter(task => !task.completed).length} Pending
              </span>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ListTodo className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks in this list</h3>
              <p className="text-gray-500 text-center">This shared list doesn&apos;t have any tasks yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id} className={`transition-all ${task.completed ? "opacity-75" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {/* Read-only status indicator */}
                    <div className="mt-1 flex-shrink-0">
                      {task.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-orange-500" />
                      )}
                    </div>
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
                    {/* Status badge */}
                    <Badge variant={task.completed ? "default" : "secondary"} className="text-xs">
                      {task.completed ? "Done" : "Pending"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 p-4 bg-accent/5 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            This is a read-only view of a shared task list. You cannot make changes to these tasks.
          </p>
        </div>
      </div>
    </div>
  )
}
