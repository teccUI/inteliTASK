"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, CalendarDays, Target } from "lucide-react"

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

export default function SharedTaskList() {
  const params = useParams()
  const listId = params.listId as string
  const [taskList, setTaskList] = useState<TaskList | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, this would fetch from your backend API
    // For now, we'll simulate loading shared data
    const mockTaskLists: TaskList[] = [
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
        ],
      },
    ]

    setTimeout(() => {
      const foundList = mockTaskLists.find((list) => list.id === listId)
      setTaskList(foundList || null)
      setLoading(false)
    }, 1000)
  }, [listId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared task list...</p>
        </div>
      </div>
    )
  }

  if (!taskList) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Task list not found</h3>
            <p className="text-gray-500 text-center">This shared link may be invalid or expired.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">IntelliTask</h1>
            </div>
          </div>
          <Badge variant="secondary">Shared View</Badge>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${taskList.color}`} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{taskList.name}</h2>
              <p className="text-gray-500">
                {taskList.tasks.filter((t) => !t.completed).length} pending,{" "}
                {taskList.tasks.filter((t) => t.completed).length} completed
              </p>
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            {taskList.tasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks</h3>
                  <p className="text-gray-500 text-center">This task list is empty.</p>
                </CardContent>
              </Card>
            ) : (
              taskList.tasks.map((task) => (
                <Card key={task.id} className={`transition-all ${task.completed ? "opacity-75" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1 flex-shrink-0">
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

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
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              Powered by <span className="font-medium text-gray-900">IntelliTask</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
