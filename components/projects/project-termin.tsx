"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2 } from "lucide-react"
import { terminApi } from "@/lib/api/termin"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProjectTerminProps {
  projectId: string
}

export function ProjectTermin({ projectId }: ProjectTerminProps) {
  const [terminItems, setTerminItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalItems: 0,
    completedItems: 0,
    progress: 0,
  })

  useEffect(() => {
    loadTermin()
  }, [projectId])

  const loadTermin = async () => {
    try {
      const response = await terminApi.getByProject(projectId)
      if (response.success && response.data) {
        setTerminItems(response.data)
        calculateSummary(response.data)
      }
    } catch (error) {
      console.error("Failed to load termin:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (items: any[]) => {
    const totalItems = items.length
    const completedItems = items.filter((item) => item.status === "completed").length
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

    setSummary({ totalItems, completedItems, progress })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "in-progress":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Phases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalItems}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.completedItems}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.progress.toFixed(1)}%</p>
            <Progress value={summary.progress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Termin Plan</CardTitle>
              <CardDescription>Track project phases and payment schedule</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Phase
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading termin plan...</p>
          ) : terminItems.length === 0 ? (
            <Alert>
              <AlertDescription className="text-center">
                No termin phases added yet. Click "Add Phase" to create your project schedule.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {terminItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium">{item.phase_name}</p>
                      <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                    </div>
                    {item.description && <p className="text-sm text-muted-foreground mb-2">{item.description}</p>}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Progress: {item.progress}%</span>
                      {item.payment_percentage && <span>Payment: {item.payment_percentage}%</span>}
                      {item.due_date && <span>Due: {new Date(item.due_date).toLocaleDateString()}</span>}
                    </div>
                    <Progress value={item.progress} className="mt-2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
