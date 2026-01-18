"use client"

import { useState } from "react"
import { BugReportForm } from "@/components/BugReportForm"
import { BugKanbanBoard } from "@/components/BugKanbanBoard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bug } from "lucide-react"

export default function BugReportPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleReportSuccess = () => {
    // Refresh the kanban board after successful submission
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Bug className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Bug Reports</h1>
          <p className="text-muted-foreground">
            Report bugs and track their resolution status
          </p>
        </div>
      </div>

      <Tabs defaultValue="board" className="w-full">
        <TabsList>
          <TabsTrigger value="board">Kanban Board</TabsTrigger>
          <TabsTrigger value="report">Report Bug</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-6">
          <BugKanbanBoard refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="report" className="mt-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Report a Bug</CardTitle>
              <CardDescription>
                Help us improve by reporting any bugs or issues you encounter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BugReportForm
                onSuccess={handleReportSuccess}
                userEmail="user@example.com" // TODO: Get from session
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
