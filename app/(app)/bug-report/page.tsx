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
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Plus, Bug, MoreHorizontal, ExternalLink, ImageIcon, X, Loader2, Trash2, AlertCircle } from "lucide-react"
import type { BugReport, BugStatus, CreateBugReportInput } from "@/lib/types/bug-report"

const statusColumns: { status: BugStatus; label: string; color: string }[] = [
  { status: "backlog", label: "Backlog", color: "bg-gray-500" },
  { status: "on-going", label: "On-going", color: "bg-blue-500" },
  { status: "review", label: "Review", color: "bg-yellow-500" },
  { status: "done", label: "Done", color: "bg-green-500" },
]

export default function BugReportPage() {
  const [bugReports, setBugReports] = useState<BugReport[]>([])
  const [loading, setLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState(false) // Added preview mode state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState<CreateBugReportInput>({
    title: "",
    description: "",
    url: "",
    images: [],
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const fetchBugReports = async () => {
    try {
      const response = await fetch("/api/bug-reports")
      const data = await response.json()

      if (data.previewMode) {
        setPreviewMode(true)
        setLoading(false)
        return
      }

      if (data.success) {
        setBugReports(data.data)
      }
    } catch (error) {
      console.error("Error fetching bug reports:", error)
      setPreviewMode(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBugReports()
  }, [])

  const handleCreateBugReport = async () => {
    if (!formData.title || !formData.description) {
      toast({
        title: "Error",
        description: "Title and description are required",
        variant: "destructive",
      })
      return
    }

    setCreating(true)
    try {
      const response = await fetch("/api/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Bug report created successfully",
        })
        setCreateDialogOpen(false)
        setFormData({ title: "", description: "", url: "", images: [] })
        fetchBugReports()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error creating bug report:", error)
      toast({
        title: "Error",
        description: "Failed to create bug report",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (bugId: string, newStatus: BugStatus) => {
    try {
      const response = await fetch(`/api/bug-reports/${bugId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Status updated successfully",
        })
        fetchBugReports()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteBugReport = async (bugId: string) => {
    try {
      const response = await fetch(`/api/bug-reports/${bugId}`, {
        method: "DELETE",
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Bug report deleted successfully",
        })
        setDetailDialogOpen(false)
        setSelectedBug(null)
        fetchBugReports()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error deleting bug report:", error)
      toast({
        title: "Error",
        description: "Failed to delete bug report",
        variant: "destructive",
      })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        setFormData((prev) => ({
          ...prev,
          images: [...(prev.images || []), base64],
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || [],
    }))
  }

  const getBugsByStatus = (status: BugStatus) => {
    return bugReports.filter((bug) => bug.status === status)
  }

  const openBugDetail = (bug: BugReport) => {
    setSelectedBug(bug)
    setDetailDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (previewMode) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Bug Report</h1>
          <p className="text-muted-foreground">Track and manage bug reports</p>
        </div>

        {/* Preview Mode Message */}
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/50">
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  Preview Mode - Feature Not Available
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  The Bug Report feature requires a MongoDB database connection which is not available in the v0 preview
                  environment.
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  This feature will work properly when deployed to production with a valid{" "}
                  <code className="rounded bg-amber-200 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900">
                    MONGODB_URI
                  </code>{" "}
                  environment variable configured.
                </p>
                <div className="pt-2">
                  <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Feature Highlights:</h4>
                  <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                    <li>Create bug reports with title, description, URL, and screenshots</li>
                    <li>Kanban board view with Backlog, On-going, Review, and Done columns</li>
                    <li>Drag-and-drop style status management</li>
                    <li>Image attachments with base64 encoding</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Kanban Board (empty state) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-50">
          {statusColumns.map((column) => (
            <div key={column.status} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                <h3 className="font-semibold">{column.label}</h3>
                <Badge variant="secondary" className="ml-auto">
                  0
                </Badge>
              </div>
              <div className="h-[200px] rounded-lg border-2 border-dashed border-muted flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Available in production</p>
              </div>
            </div>
          ))}
        </div>
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
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Bug Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Bug Report</DialogTitle>
              <DialogDescription>Fill in the details to create a new bug report</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the bug"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the bug, steps to reproduce, expected behavior..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL (optional)</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/page-with-bug"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Images (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.images?.map((img, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                      <img
                        src={img || "/placeholder.svg"}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center hover:border-primary/50 transition-colors"
                  >
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBugReport} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusColumns.map((column) => (
          <div key={column.status} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <h3 className="font-semibold">{column.label}</h3>
              <Badge variant="secondary" className="ml-auto">
                {getBugsByStatus(column.status).length}
              </Badge>
            </div>
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-3 pr-2">
                {getBugsByStatus(column.status).map((bug) => (
                  <Card
                    key={bug._id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openBugDetail(bug)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Bug className="h-4 w-4 text-destructive flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{bug.title}</span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {statusColumns
                              .filter((s) => s.status !== bug.status)
                              .map((s) => (
                                <DropdownMenuItem
                                  key={s.status}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStatusChange(bug._id!, s.status)
                                  }}
                                >
                                  <div className={`w-2 h-2 rounded-full ${s.color} mr-2`} />
                                  Move to {s.label}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{bug.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {bug.url && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                        {bug.images && bug.images.length > 0 && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <ImageIcon className="h-3 w-3" />
                            <span className="text-xs">{bug.images.length}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {getBugsByStatus(column.status).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No bugs in {column.label.toLowerCase()}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ))}
      </div>

      {/* Bug Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedBug && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Bug className="h-5 w-5 text-destructive" />
                    <DialogTitle>{selectedBug.title}</DialogTitle>
                  </div>
                  <Badge className={statusColumns.find((s) => s.status === selectedBug.status)?.color}>
                    {statusColumns.find((s) => s.status === selectedBug.status)?.label}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Description</Label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{selectedBug.description}</p>
                </div>
                {selectedBug.url && (
                  <div>
                    <Label className="text-muted-foreground text-xs">URL</Label>
                    <a
                      href={selectedBug.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-primary flex items-center gap-1 hover:underline"
                    >
                      {selectedBug.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {selectedBug.images && selectedBug.images.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Images ({selectedBug.images.length})</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedBug.images.map((img, index) => (
                        <a
                          key={index}
                          href={img}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-24 h-24 rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={img || "/placeholder.svg"}
                            alt={`Screenshot ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Created: {new Date(selectedBug.createdAt).toLocaleString()}</span>
                  <span>Updated: {new Date(selectedBug.updatedAt).toLocaleString()}</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="destructive" onClick={() => handleDeleteBugReport(selectedBug._id!)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Change Status</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {statusColumns
                      .filter((s) => s.status !== selectedBug.status)
                      .map((s) => (
                        <DropdownMenuItem
                          key={s.status}
                          onClick={() => {
                            handleStatusChange(selectedBug._id!, s.status)
                            setSelectedBug({ ...selectedBug, status: s.status })
                          }}
                        >
                          <div className={`w-2 h-2 rounded-full ${s.color} mr-2`} />
                          {s.label}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
