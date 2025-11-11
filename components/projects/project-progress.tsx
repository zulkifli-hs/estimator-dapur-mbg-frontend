"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Calendar, ImageIcon, TrendingUp, FileCheck, Edit } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { boqApi } from "@/lib/api/boq"
import { GanttChartEditor } from "./gantt-chart-editor"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProjectProgressProps {
  projectId: string
}

export function ProjectProgress({ projectId }: ProjectProgressProps) {
  const [activeTab, setActiveTab] = useState("gantt")
  const [mainBOQ, setMainBOQ] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showGanttEditor, setShowGanttEditor] = useState(false)
  const [ganttTasks, setGanttTasks] = useState<any[]>([])

  const tabs = [
    { value: "gantt", label: "Gantt Chart" },
    { value: "photos", label: "Project Photos" },
    { value: "scurve", label: "S Curve" },
    { value: "bast", label: "BAST/BAPP" },
  ]

  useEffect(() => {
    loadBOQData()
  }, [projectId])

  const loadBOQData = async () => {
    try {
      const response = await boqApi.getByProject(projectId)
      if (response.success && response.data && Array.isArray(response.data)) {
        const main = response.data.find((boq: any) => boq.number === 1)
        setMainBOQ(main || null)
        if (main) {
          generateGanttTasks(main)
        }
      }
    } catch (error) {
      console.error("Failed to load BOQ:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateGanttTasks = (boq: any) => {
    const tasks: any[] = []

    // Add preliminary tasks
    if (Array.isArray(boq.preliminary)) {
      boq.preliminary.forEach((item: any, index: number) => {
        if (item.startDate && item.endDate) {
          tasks.push({
            id: `preliminary-${index}`,
            name: item.name,
            category: "Preliminary",
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            duration: calculateDuration(item.startDate, item.endDate),
          })
        }
      })
    }

    // Add fitting out tasks
    if (Array.isArray(boq.fittingOut)) {
      boq.fittingOut.forEach((category: any) => {
        if (Array.isArray(category.products)) {
          category.products.forEach((product: any, index: number) => {
            if (product.startDate && product.endDate) {
              tasks.push({
                id: `fitting-${category.name}-${index}`,
                name: product.name,
                category: `Fitting Out - ${category.name}`,
                startDate: new Date(product.startDate),
                endDate: new Date(product.endDate),
                duration: calculateDuration(product.startDate, product.endDate),
              })
            }
          })
        }
      })
    }

    // Add furniture work tasks
    if (Array.isArray(boq.furnitureWork)) {
      boq.furnitureWork.forEach((category: any) => {
        if (Array.isArray(category.products)) {
          category.products.forEach((product: any, index: number) => {
            if (product.startDate && product.endDate) {
              tasks.push({
                id: `furniture-${category.name}-${index}`,
                name: product.name,
                category: `Furniture Work - ${category.name}`,
                startDate: new Date(product.startDate),
                endDate: new Date(product.endDate),
                duration: calculateDuration(product.startDate, product.endDate),
              })
            }
          })
        }
      })
    }

    setGanttTasks(tasks)
  }

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
  }

  // Dummy data for project photos
  const projectPhotos = [
    { id: 1, title: "Site Preparation", date: "2025-01-05", photos: 12 },
    { id: 2, title: "Foundation Work", date: "2025-01-10", photos: 8 },
    { id: 3, title: "Partition Installation", date: "2025-01-15", photos: 15 },
  ]

  // Dummy data for BAST/BAPP
  const bastDocuments = [
    { id: 1, type: "BAST", title: "Handover Phase 1", date: "2025-01-20", status: "Signed" },
    { id: 2, type: "BAPP", title: "Progress Payment 1", date: "2025-01-15", status: "Approved" },
    { id: 3, type: "BAST", title: "Material Delivery", date: "2025-01-10", status: "Pending" },
  ]

  const hasGanttDates = ganttTasks.length > 0

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Mobile: Dropdown */}
        <div className="block md:hidden">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: Tabs */}
        <TabsList className="hidden md:grid w-full grid-cols-4">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="gantt">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gantt Chart</CardTitle>
                  <CardDescription>Project timeline from Main BOQ</CardDescription>
                </div>
                {mainBOQ && (
                  <Button onClick={() => setShowGanttEditor(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {hasGanttDates ? "Edit Timeline" : "Add Timeline"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : !mainBOQ ? (
                <Alert>
                  <AlertDescription>
                    No Main BOQ found. Please create a Main BOQ first to generate the Gantt Chart.
                  </AlertDescription>
                </Alert>
              ) : !hasGanttDates ? (
                <div className="flex items-center justify-center h-[400px] border-2 border-dashed rounded-lg">
                  <div className="text-center space-y-3">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">No timeline set for BOQ items</p>
                    <Button onClick={() => setShowGanttEditor(true)}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Add Timeline
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px] space-y-2">
                      {ganttTasks.map((task) => (
                        <div key={task.id} className="border rounded-lg p-4">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-4">
                              <p className="font-medium text-sm">{task.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{task.category}</p>
                            </div>
                            <div className="col-span-2 text-sm">
                              <p className="text-muted-foreground text-xs">Start</p>
                              <p className="font-medium">{formatDate(task.startDate)}</p>
                            </div>
                            <div className="col-span-2 text-sm">
                              <p className="text-muted-foreground text-xs">End</p>
                              <p className="font-medium">{formatDate(task.endDate)}</p>
                            </div>
                            <div className="col-span-2 text-sm">
                              <p className="text-muted-foreground text-xs">Duration</p>
                              <p className="font-medium">{task.duration} days</p>
                            </div>
                            <div className="col-span-2">
                              <Badge variant="secondary">{task.category.split(" - ")[0]}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Photos</CardTitle>
                  <CardDescription>Progress documentation and site photos</CardDescription>
                </div>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projectPhotos.map((album) => (
                  <Card key={album.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold mb-1">{album.title}</h3>
                      <p className="text-sm text-muted-foreground">{album.date}</p>
                      <Badge variant="secondary" className="mt-2">
                        {album.photos} photos
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scurve">
          <Card>
            <CardHeader>
              <CardTitle>S Curve</CardTitle>
              <CardDescription>Project progress vs planned progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[400px] border-2 border-dashed rounded-lg">
                <div className="text-center space-y-2">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">S Curve chart will be displayed here</p>
                  <p className="text-sm text-muted-foreground">Showing planned vs actual progress over time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bast">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>BAST/BAPP Documents</CardTitle>
                  <CardDescription>Handover and progress payment documents</CardDescription>
                </div>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bastDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <FileCheck className="h-8 w-8 text-primary" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{doc.type}</Badge>
                          <p className="font-medium">{doc.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{doc.date}</p>
                      </div>
                    </div>
                    <Badge variant={doc.status === "Signed" || doc.status === "Approved" ? "default" : "secondary"}>
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {mainBOQ && (
        <GanttChartEditor
          projectId={projectId}
          boq={mainBOQ}
          open={showGanttEditor}
          onOpenChange={setShowGanttEditor}
          onSuccess={loadBOQData}
        />
      )}
    </div>
  )
}
