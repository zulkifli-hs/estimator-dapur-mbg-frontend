"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Bug, MoreHorizontal, Pencil, Trash2, ImageIcon, X, ExternalLink, GripVertical } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type BugReportStatus = "backlog" | "on-going" | "review" | "done"

interface BugReport {
  _id: string
  title: string
  description: string
  url: string
  images: string[]
  status: BugReportStatus
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = "bug_reports"

const getReportsFromStorage = (): BugReport[] => {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

const saveReportsToStorage = (reports: BugReport[]) => {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const statusColumns: { id: BugReportStatus; title: string; color: string }[] = [
  { id: "backlog", title: "Backlog", color: "bg-gray-100 border-gray-300" },
  { id: "on-going", title: "On Going", color: "bg-blue-50 border-blue-300" },
  { id: "review", title: "Review", color: "bg-yellow-50 border-yellow-300" },
  { id: "done", title: "Done", color: "bg-green-50 border-green-300" },
]

export default function BugReportPage() {
  const [reports, setReports] = useState<BugReport[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [draggedReport, setDraggedReport] = useState<BugReport | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<BugReportStatus | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    images: [] as string[],
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const storedReports = getReportsFromStorage()
    setReports(storedReports)
    setLoading(false)
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, base64],
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      url: "",
      images: [],
    })
  }

  const handleCreate = async () => {
    if (!formData.title || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Title and description are required",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const newReport: BugReport = {
        _id: generateId(),
        title: formData.title,
        description: formData.description,
        url: formData.url,
        images: formData.images,
        status: "backlog",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const updatedReports = [newReport, ...reports]
      saveReportsToStorage(updatedReports)
      setReports(updatedReports)

      toast({
        title: "Success",
        description: "Bug report created successfully",
      })
      setCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create bug report",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedReport) return

    setSubmitting(true)
    try {
      const updatedReports = reports.map((r) =>
        r._id === selectedReport._id
          ? {
              ...r,
              title: formData.title,
              description: formData.description,
              url: formData.url,
              images: formData.images,
              updatedAt: new Date().toISOString(),
            }
          : r,
      )
      saveReportsToStorage(updatedReports)
      setReports(updatedReports)

      toast({
        title: "Success",
        description: "Bug report updated successfully",
      })
      setEditDialogOpen(false)
      setSelectedReport(null)
      resetForm()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bug report",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedReport) return

    setSubmitting(true)
    try {
      const updatedReports = reports.filter((r) => r._id !== selectedReport._id)
      saveReportsToStorage(updatedReports)
      setReports(updatedReports)

      toast({
        title: "Success",
        description: "Bug report deleted successfully",
      })
      setDeleteDialogOpen(false)
      setSelectedReport(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete bug report",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (report: BugReport, newStatus: BugReportStatus) => {
    try {
      const updatedReports = reports.map((r) =>
        r._id === report._id ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r,
      )
      saveReportsToStorage(updatedReports)
      setReports(updatedReports)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (report: BugReport) => {
    setSelectedReport(report)
    setFormData({
      title: report.title,
      description: report.description,
      url: report.url,
      images: report.images,
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (report: BugReport) => {
    setSelectedReport(report)
    setDeleteDialogOpen(true)
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, report: BugReport) => {
    setDraggedReport(report)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, status: BugReportStatus) => {
    e.preventDefault()
    setDragOverColumn(status)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, newStatus: BugReportStatus) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (draggedReport && draggedReport.status !== newStatus) {
      await handleStatusChange(draggedReport, newStatus)
    }
    setDraggedReport(null)
  }

  const getReportsByStatus = (status: BugReportStatus) => {
    return reports.filter((report) => report.status === status)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bug Report</h1>
          <p className="text-muted-foreground">Track and manage bug reports</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Report Bug
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusColumns.map((column) => (
          <div
            key={column.id}
            className={`rounded-lg border-2 ${column.color} ${
              dragOverColumn === column.id ? "ring-2 ring-primary" : ""
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="p-3 border-b bg-white/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{column.title}</h3>
                <span className="text-sm text-muted-foreground bg-white px-2 py-0.5 rounded-full">
                  {getReportsByStatus(column.id).length}
                </span>
              </div>
            </div>
            <div className="p-2 space-y-2 min-h-[200px]">
              {getReportsByStatus(column.id).map((report) => (
                <Card
                  key={report._id}
                  className={`cursor-grab active:cursor-grabbing ${
                    draggedReport?._id === report._id ? "opacity-50" : ""
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, report)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{report.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{report.description}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(report)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {report.url && (
                            <DropdownMenuItem asChild>
                              <a href={report.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open URL
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(report)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {report.images.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {report.images.slice(0, 3).map((_, idx) => (
                          <div key={idx} className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                            <ImageIcon className="h-3 w-3 text-muted-foreground" />
                          </div>
                        ))}
                        {report.images.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{report.images.length - 3}</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Report a Bug
            </DialogTitle>
            <DialogDescription>Provide details about the bug you encountered</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of the bug"
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed steps to reproduce the bug"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="Page URL where the bug occurred"
              />
            </div>
            <div>
              <Label>Screenshots</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Add Images
                </Button>
              </div>
              {formData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={img || "/placeholder.svg"}
                        alt={`Screenshot ${idx + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating..." : "Create Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Bug Report
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-url">URL</Label>
              <Input
                id="edit-url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
            <div>
              <Label>Screenshots</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="edit-file-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("edit-file-input")?.click()}
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Add Images
                </Button>
              </div>
              {formData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={img || "/placeholder.svg"}
                        alt={`Screenshot ${idx + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Bug Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedReport?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
