"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DialogTitle } from "@/components/ui/dialog"

import { DialogHeader } from "@/components/ui/dialog"

import { DialogContent } from "@/components/ui/dialog"

import { Dialog } from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Calendar, ImageIcon, TrendingUp, FileCheck, Edit, Plus, X, Download, Eye, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { boqApi } from "@/lib/api/boq"
import { albumsApi } from "@/lib/api/albums"
import { GanttChartEditor } from "./gantt-chart-editor"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GanttChartView } from "./gantt-chart-view"
import { CreateAlbumDialog } from "./create-album-dialog"
import { AlbumDetailDialog } from "./album-detail-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from 'lucide-react' // Import Loader2

interface ProjectProgressProps {
  projectId: string
}

export function ProjectProgress({ projectId }: ProjectProgressProps) {
  const [activeTab, setActiveTab] = useState("gantt")
  const [mainBOQ, setMainBOQ] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showGanttEditor, setShowGanttEditor] = useState(false)
  const [ganttTasks, setGanttTasks] = useState<any[]>([])

  const [albums, setAlbums] = useState<any[]>([])
  const [albumsLoading, setAlbumsLoading] = useState(false)
  const [showCreateAlbum, setShowCreateAlbum] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<{ id: string; name: string } | null>(null)
  const [deleteAlbumConfirm, setDeleteAlbumConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deletingAlbum, setDeletingAlbum] = useState(false)
  const [exportingPdf, setExportingPdf] = useState<string | null>(null)
  const [previewPdf, setPreviewPdf] = useState<{ url: string; name: string } | null>(null)
  const { toast } = useToast()

  const tabs = [
    { value: "gantt", label: "Gantt Chart" },
    { value: "photos", label: "Project Photos" },
    { value: "scurve", label: "S Curve" },
    { value: "bast", label: "BAST/BAPP" },
  ]

  useEffect(() => {
    loadBOQData()
    loadAlbums()
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

    if (Array.isArray(boq.preliminary)) {
      boq.preliminary.forEach((item: any, index: number) => {
        tasks.push({
          id: `preliminary-${index}`,
          name: item.name,
          category: "Preliminary",
          startDate: item.startDate ? new Date(item.startDate) : null,
          endDate: item.endDate ? new Date(item.endDate) : null,
          duration: item.startDate && item.endDate ? calculateDuration(item.startDate, item.endDate) : 0,
        })
      })
    }

    if (Array.isArray(boq.fittingOut)) {
      boq.fittingOut.forEach((category: any) => {
        if (Array.isArray(category.products)) {
          category.products.forEach((product: any, index: number) => {
            tasks.push({
              id: `fitting-${category.name}-${index}`,
              name: product.name,
              category: `Fitting Out - ${category.name}`,
              startDate: product.startDate ? new Date(product.startDate) : null,
              endDate: product.endDate ? new Date(product.endDate) : null,
              duration: product.startDate && product.endDate ? calculateDuration(product.startDate, product.endDate) : 0,
            })
          })
        }
      })
    }

    if (Array.isArray(boq.furnitureWork)) {
      boq.furnitureWork.forEach((category: any) => {
        if (Array.isArray(category.products)) {
          category.products.forEach((product: any, index: number) => {
            tasks.push({
              id: `furniture-${category.name}-${index}`,
              name: product.name,
              category: `Furniture Work - ${category.name}`,
              startDate: product.startDate ? new Date(product.startDate) : null,
              endDate: product.endDate ? new Date(product.endDate) : null,
              duration: product.startDate && product.endDate ? calculateDuration(product.startDate, product.endDate) : 0,
            })
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

  const loadAlbums = async () => {
    setAlbumsLoading(true)
    try {
      const response = await albumsApi.getByProject(projectId, { limit: 100 })
      if (response.success) {
        // Handle both array and paginated response
        const albumsData = Array.isArray(response.data) ? response.data : response.data?.list || []
        setAlbums(albumsData)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load albums",
        variant: "destructive",
      })
    } finally {
      setAlbumsLoading(false)
    }
  }

  const hasGanttDates = ganttTasks.some(task => task.startDate && task.endDate)

  const handleDeleteAlbum = async () => {
    if (!deleteAlbumConfirm) return

    setDeletingAlbum(true)
    try {
      const response = await albumsApi.delete(deleteAlbumConfirm.id, projectId)
      if (response.success) {
        toast({
          title: "Success",
          description: "Album deleted successfully",
        })
        await loadAlbums()
      } else {
        throw new Error("Failed to delete album")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete album",
        variant: "destructive",
      })
    } finally {
      setDeletingAlbum(false)
      setDeleteAlbumConfirm(null)
    }
  }

  const generatePdfDocument = async (album: any) => {
    // Dynamically import jsPDF
    const { default: jsPDF } = await import('jspdf')

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const columnGap = 10
    const imgWidth = (pageWidth - (margin * 2) - columnGap) / 2
    
    // Add centered title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    const titleWidth = doc.getTextWidth(album.name)
    doc.text(album.name, (pageWidth - titleWidth) / 2, margin + 5)

    let yPosition = margin + 15
    let column = 0
    let maxRowHeight = 0

    // Load and add images
    if (album.list && album.list.length > 0) {
      for (let i = 0; i < album.list.length; i++) {
        const photo = album.list[i]
        if (!photo.provider || !photo.url) continue

        try {
          const imageUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${photo.provider}/${photo.url}`
          
          // Load image as base64
          const response = await fetch(imageUrl)
          const blob = await response.blob()
          const reader = new FileReader()
          
          await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })

          const base64Image = reader.result as string

          // Create a temporary image to get original dimensions
          const img = new Image()
          await new Promise((resolve) => {
            img.onload = resolve
            img.src = base64Image
          })

          // Calculate image height maintaining aspect ratio
          const aspectRatio = img.height / img.width
          const imgHeight = imgWidth * aspectRatio

          // Calculate x position based on column
          const xPosition = column === 0 ? margin : margin + imgWidth + columnGap
          
          // Check if we need a new page
          if (yPosition + imgHeight + 15 > pageHeight - margin) {
            doc.addPage()
            yPosition = margin
            column = 0
            maxRowHeight = 0
          }

          // Add image maintaining aspect ratio
          doc.addImage(base64Image, 'JPEG', xPosition, yPosition, imgWidth, imgHeight)
          
          // Add photo note below image (if exists)
          if (photo.note) {
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            const labelWidth = doc.getTextWidth(photo.note)
            const maxLabelWidth = imgWidth - 2
            
            if (labelWidth <= maxLabelWidth) {
              doc.text(photo.note, xPosition + (imgWidth - labelWidth) / 2, yPosition + imgHeight + 5)
            } else {
              // If text is too long, wrap it
              const lines = doc.splitTextToSize(photo.note, maxLabelWidth)
              doc.text(lines, xPosition + 1, yPosition + imgHeight + 5)
            }
          }

          // Track the maximum height in the current row
          maxRowHeight = Math.max(maxRowHeight, imgHeight)

          // Move to next column or row
          if (column === 0) {
            column = 1
          } else {
            column = 0
            yPosition += maxRowHeight + 15
            maxRowHeight = 0
          }

        } catch (error) {
          console.error(`Failed to load image ${i + 1}:`, error)
        }
      }
    }

    return doc
  }

  const handleExportPdf = async (album: any) => {
    setExportingPdf(album._id)
    try {
      const doc = await generatePdfDocument(album)
      doc.save(`${album.name}.pdf`)

      toast({
        title: "Success",
        description: "PDF exported successfully",
      })
    } catch (error: any) {
      console.error("Failed to export PDF:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to export PDF",
        variant: "destructive",
      })
    } finally {
      setExportingPdf(null)
    }
  }

  const handlePreviewPdf = async (album: any) => {
    setExportingPdf(album._id)
    try {
      const doc = await generatePdfDocument(album)
      const pdfBlob = doc.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      
      setPreviewPdf({ url: pdfUrl, name: album.name })
    } catch (error: any) {
      console.error("Failed to preview PDF:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to preview PDF",
        variant: "destructive",
      })
    } finally {
      setExportingPdf(null)
    }
  }

  const handleUpdateGanttTask = async (taskId: string, startDate: Date | null, endDate: Date | null) => {
    if (!mainBOQ) return

    try {
      const formatDateForAPI = (date: Date | null): string | undefined => {
        if (!date) return undefined
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
      }

      // Find which section the task belongs to
      const taskData = ganttTasks.find((t) => t.id === taskId)
      if (!taskData) return

      // Prepare update payload based on task category
      const updatePayload: any = {
        preliminary: [],
        fittingOut: [],
        furnitureWork: [],
      }

      if (Array.isArray(mainBOQ.preliminary)) {
        updatePayload.preliminary = mainBOQ.preliminary.map((item: any) => ({
          name: item.name,
          startDate: item.startDate ? formatDateForAPI(new Date(item.startDate)) : undefined,
          endDate: item.endDate ? formatDateForAPI(new Date(item.endDate)) : undefined,
        }))
      }

      if (Array.isArray(mainBOQ.fittingOut)) {
        updatePayload.fittingOut = mainBOQ.fittingOut.map((category: any) => ({
          name: category.name,
          products: (category.products || []).map((product: any) => ({
            name: product.name,
            startDate: product.startDate ? formatDateForAPI(new Date(product.startDate)) : undefined,
            endDate: product.endDate ? formatDateForAPI(new Date(product.endDate)) : undefined,
          })),
        }))
      }

      if (Array.isArray(mainBOQ.furnitureWork)) {
        updatePayload.furnitureWork = mainBOQ.furnitureWork.map((category: any) => ({
          name: category.name,
          products: (category.products || []).map((product: any) => ({
            name: product.name,
            startDate: product.startDate ? formatDateForAPI(new Date(product.startDate)) : undefined,
            endDate: product.endDate ? formatDateForAPI(new Date(product.endDate)) : undefined,
          })),
        }))
      }

      if (taskId.startsWith("preliminary-")) {
        const index = Number.parseInt(taskId.split("-")[1])
        if (updatePayload.preliminary[index]) {
          updatePayload.preliminary[index].startDate = formatDateForAPI(startDate)
          updatePayload.preliminary[index].endDate = formatDateForAPI(endDate)
        }
      } else if (taskId.startsWith("fitting-")) {
        // Parse category and index from taskId
        const parts = taskId.split("-")
        const categoryName = parts.slice(1, -1).join("-")
        const index = Number.parseInt(parts[parts.length - 1])

        const categoryIndex = updatePayload.fittingOut.findIndex((cat: any) => cat.name === categoryName)
        if (categoryIndex !== -1 && updatePayload.fittingOut[categoryIndex].products[index]) {
          updatePayload.fittingOut[categoryIndex].products[index].startDate = formatDateForAPI(startDate)
          updatePayload.fittingOut[categoryIndex].products[index].endDate = formatDateForAPI(endDate)
        }
      } else if (taskId.startsWith("furniture-")) {
        // Parse category and index from taskId
        const parts = taskId.split("-")
        const categoryName = parts.slice(1, -1).join("-")
        const index = Number.parseInt(parts[parts.length - 1])

        const categoryIndex = updatePayload.furnitureWork.findIndex((cat: any) => cat.name === categoryName)
        if (categoryIndex !== -1 && updatePayload.furnitureWork[categoryIndex].products[index]) {
          updatePayload.furnitureWork[categoryIndex].products[index].startDate = formatDateForAPI(startDate)
          updatePayload.furnitureWork[categoryIndex].products[index].endDate = formatDateForAPI(endDate)
        }
      }

      // Call API to update gantt chart
      const response = await boqApi.updateGanttChart(projectId, mainBOQ._id, updatePayload)
      if (response.success) {
        toast({
          title: "Success",
          description: startDate && endDate ? "Task timeline updated successfully" : "Task timeline removed successfully",
        })
        await loadBOQData()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update task timeline",
        variant: "destructive",
      })
      throw error
    }
  }

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
              ) : (
                <GanttChartView tasks={ganttTasks} onUpdateTask={handleUpdateGanttTask} />
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
                <Button onClick={() => setShowCreateAlbum(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Album
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {albumsLoading ? (
                <div className="flex items-center justify-center h-48">
                  <p className="text-muted-foreground">Loading albums...</p>
                </div>
              ) : albums.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {albums.map((album) => (
                    <Card
                      key={album._id}
                      className="group hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedAlbum({ id: album._id, name: album.name })}
                    >
                      <CardContent className="p-4">
                        <div
                          className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center cursor-pointer"
                          onClick={() => setSelectedAlbum({ id: album._id, name: album.name })}
                        >
                          {album.list && album.list.length > 0 && album.list[0].provider && album.list[0].url ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${album.list[0].provider}/${album.list[0].url}`}
                              alt={album.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => setSelectedAlbum({ id: album._id, name: album.name })}
                          >
                            <h3 className="font-semibold mb-1">{album.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(album.createdAt).toLocaleDateString("id-ID")}
                            </p>
                            <Badge variant="secondary" className="mt-2">
                              {album.list?.length || 0} photo{album.list?.length !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePreviewPdf(album)
                                }}
                                disabled={exportingPdf === album._id || !album.list || album.list.length === 0}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleExportPdf(album)
                                }}
                                disabled={exportingPdf === album._id || !album.list || album.list.length === 0}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteAlbumConfirm({ id: album._id, name: album.name })
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Delete Album
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                  <div className="text-center space-y-2">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">No albums yet</p>
                    <Button onClick={() => setShowCreateAlbum(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Album
                    </Button>
                  </div>
                </div>
              )}
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
              <div className="flex items-center justify-center h-[500px] bg-gradient-to-br from-primary/5 via-primary/10 to-background rounded-xl border-2 border-dashed border-primary/20">
                <div className="text-center space-y-8 max-w-sm px-6">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 animate-ping">
                      <TrendingUp className="h-24 w-24 text-primary/30" />
                    </div>
                    <TrendingUp className="h-24 w-24 text-primary relative z-10" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      Coming Soon
                    </h3>
                    <Badge variant="outline" className="text-sm px-4 py-1 border-primary/40">
                      Under Construction
                    </Badge>
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    We're building something amazing to track your project progress
                  </p>
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
                {/* Dummy data for BAST/BAPP */}
                {[
                  { id: 1, type: "BAST", title: "Handover Phase 1", date: "2025-01-20", status: "Signed" },
                  { id: 2, type: "BAPP", title: "Progress Payment 1", date: "2025-01-15", status: "Approved" },
                  { id: 3, type: "BAST", title: "Material Delivery", date: "2025-01-10", status: "Pending" },
                ].map((doc) => (
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

      <CreateAlbumDialog
        open={showCreateAlbum}
        onOpenChange={setShowCreateAlbum}
        projectId={projectId}
        onSuccess={loadAlbums}
      />

      {selectedAlbum && (
        <AlbumDetailDialog
          open={!!selectedAlbum}
          onOpenChange={(open) => !open && setSelectedAlbum(null)}
          projectId={projectId}
          albumId={selectedAlbum.id}
          albumName={selectedAlbum.name}
          onPhotoAdded={loadAlbums}
          onPreviewPdf={() => {
            const album = albums.find((a) => a._id === selectedAlbum.id)
            if (album) handlePreviewPdf(album)
          }}
          onDownloadPdf={() => {
            const album = albums.find((a) => a._id === selectedAlbum.id)
            if (album) handleExportPdf(album)
          }}
          onDeleteAlbum={() => {
            setDeleteAlbumConfirm({ id: selectedAlbum.id, name: selectedAlbum.name })
          }}
          isExportingPdf={exportingPdf === selectedAlbum.id}
        />
      )}

      <AlertDialog open={!!deleteAlbumConfirm} onOpenChange={(open) => !open && setDeleteAlbumConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Album</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the album "{deleteAlbumConfirm?.name}"? This will also delete all photos
              in this album. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAlbum}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAlbum}
              disabled={deletingAlbum}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingAlbum ? (
                <>
                  <X className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Album"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!previewPdf} onOpenChange={(open) => {
        if (!open) {
          if (previewPdf?.url) {
            URL.revokeObjectURL(previewPdf.url)
          }
          setPreviewPdf(null)
        }
      }}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewPdf?.name} - Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewPdf && (
              <iframe
                src={previewPdf.url}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
