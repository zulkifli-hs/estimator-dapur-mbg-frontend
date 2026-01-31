"use client"

import type React from "react"

import { useEffect } from "react"

import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  User,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
  ChevronDown,
  Check,
  MoreHorizontal,
  CheckCircle,
  Archive,
  Play,
  FileText,
} from "lucide-react"
import { projectsApi } from "@/lib/api/projects"
import Link from "next/link"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { toast } from "sonner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "propose", label: "Propose" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archive", label: "Archive" },
] as const

type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"]

const getStatusIcon = (status: string) => {
  const normalizedStatus = status?.toLowerCase() || ""

  if (normalizedStatus === "propose") {
    return <FileText className="h-3 w-3" />
  }
  if (normalizedStatus === "active") {
    return <Play className="h-3 w-3" />
  }
  if (normalizedStatus === "completed") {
    return <CheckCircle className="h-3 w-3" />
  }
  if (normalizedStatus === "archive") {
    return <Archive className="h-3 w-3" />
  }
  return null
}

const getStatusBadge = (status: string) => {
  const normalizedStatus = status?.toLowerCase() || ""

  if (normalizedStatus === "propose") {
    return {
      label: "Propose",
      bgColor: "#fef3c7",
      textColor: "#92400e",
      borderColor: "#fcd34d",
      dotColor: "#f59e0b",
    }
  }
  if (normalizedStatus === "active") {
    return {
      label: "Active",
      bgColor: "#dcfce7",
      textColor: "#15803d",
      borderColor: "#86efac",
      dotColor: "#22c55e",
    }
  }
  if (normalizedStatus === "completed") {
    return {
      label: "Completed",
      bgColor: "#dbeafe",
      textColor: "#1d4ed8",
      borderColor: "#93c5fd",
      dotColor: "#3b82f6",
    }
  }
  if (normalizedStatus === "archive") {
    return {
      label: "Archived",
      bgColor: "#f3f4f6",
      textColor: "#4b5563",
      borderColor: "#d1d5db",
      dotColor: "#9ca3af",
    }
  }
  // Default fallback
  return {
    label: status || "Unknown",
    bgColor: "#f3f4f6",
    textColor: "#4b5563",
    borderColor: "#d1d5db",
    dotColor: "#9ca3af",
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "text-green-600"
    case "completed":
      return "text-blue-600"
    case "archive":
      return "text-gray-600"
    default:
      return ""
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [filteredProjects, setFilteredProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [selectedProjectForStatus, setSelectedProjectForStatus] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [viewMode, setViewMode] = useState<"card" | "list">("card")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingProject, setDeletingProject] = useState<any>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [page, statusFilter])

  useEffect(() => {
    if (searchQuery) {
      const filtered = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.companyClient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.building?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredProjects(filtered)
    } else {
      setFilteredProjects(projects)
    }
  }, [searchQuery, projects])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await projectsApi.getAll({
        page,
        limit: 10,
        status: statusFilter !== "all" ? statusFilter : undefined,
      })

      if (response.success && response.data) {
        setProjects(response.data)
        setFilteredProjects(response.data)
        if (response.totalPage) {
          setTotalPages(response.totalPage)
        }
      }
    } catch (error) {
      console.error("Failed to load projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusFilterChange = (status: StatusFilter) => {
    setStatusFilter(status)
    setPage(1)
  }

  const handleProjectCreated = () => {
    setCreateDialogOpen(false)
    loadProjects()
  }

  const handleEditClick = (e: React.MouseEvent, project: any) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingProject(project)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (e: React.MouseEvent, project: any) => {
    e.preventDefault()
    e.stopPropagation()
    setDeletingProject(project)
    setDeleteConfirmName("")
    setDeleteDialogOpen(true)
  }

  const openStatusDialog = (e: React.MouseEvent, project: any) => {
    e.stopPropagation()
    e.preventDefault()
    setSelectedProjectForStatus(project)
    setStatusDialogOpen(true)
  }

  const handleStatusChange = async (status: "propose" | "active" | "completed" | "archive") => {
    if (!selectedProjectForStatus) return

    try {
      const result = await projectsApi.updateStatus(selectedProjectForStatus._id, status)
      if (result.success) {
        toast.success(`Project status updated to ${status}`)
        setStatusDialogOpen(false)
        setSelectedProjectForStatus(null)
        loadProjects()
      } else {
        toast.error("Failed to update project status")
      }
    } catch (error) {
      console.error("Error updating project status:", error)
      toast.error("Failed to update project status")
    }
  }

  const handleEditSuccess = () => {
    setEditDialogOpen(false)
    setEditingProject(null)
    loadProjects()
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirmName === deletingProject?.name) {
      setIsDeleting(true)
      try {
        const response = await projectsApi.delete(deletingProject._id)
        if (response.success) {
          toast.success("Project deleted successfully")
          setDeleteDialogOpen(false)
          loadProjects()
        } else {
          toast.error("Failed to delete project")
        }
      } catch (error) {
        console.error("Failed to delete project:", error)
        toast.error("Failed to delete project")
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const currentFilterLabel = STATUS_OPTIONS.find((opt) => opt.value === statusFilter)?.label || "All"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage and track all your interior design projects</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by name, client, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as "card" | "list")}
          >
            <ToggleGroupItem value="card" aria-label="Card view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                {currentFilterLabel}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {STATUS_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleStatusFilterChange(option.value)}
                  className="flex items-center justify-between"
                >
                  {option.label}
                  {statusFilter === option.value && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No projects found matching your search" : "No projects yet"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "card" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project._id} className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Link href={`/projects/${project._id}`} className="flex-1">
                    <div className="space-y-2">
                      <CardTitle className="text-lg line-clamp-2 hover:text-primary transition-colors">
                        {project.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="bg-primary/10 text-primary w-fit px-2.5 py-0.5 rounded-full text-xs font-medium">
                          {project.type || "Project"}
                        </div>
                        <div
                          style={{
                            backgroundColor: getStatusBadge(project.status).bgColor,
                            color: getStatusBadge(project.status).textColor,
                            borderColor: getStatusBadge(project.status).borderColor,
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border"
                        >
                          {getStatusIcon(project.status)}
                          {getStatusBadge(project.status).label}
                        </div>
                      </div>
                    </div>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleEditClick(e as any, project)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => openStatusDialog(e as any, project)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Change Status
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => handleDeleteClick(e as any, project)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Link href={`/projects/${project._id}`}>
                  <CardDescription className="line-clamp-1">
                    {project.building} - Floor {project.floor}
                  </CardDescription>
                </Link>
              </CardHeader>
              <Link href={`/projects/${project._id}`}>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="line-clamp-1">{project.companyClient?.name || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{project.area} m²</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project._id}>
                  <TableCell>
                    <Link
                      href={`/projects/${project._id}`}
                      className="font-medium hover:text-primary transition-colors whitespace-normal break-words max-w-[200px]"
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {project.type || "Project"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      style={{
                        backgroundColor: getStatusBadge(project.status).bgColor,
                        color: getStatusBadge(project.status).textColor,
                        borderColor: getStatusBadge(project.status).borderColor,
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium w-fit border"
                    >
                      {getStatusIcon(project.status)}
                      {getStatusBadge(project.status).label}
                    </div>
                  </TableCell>
                  <TableCell>{project.building}</TableCell>
                  <TableCell>{project.floor}</TableCell>
                  <TableCell>{project.area} m²</TableCell>
                  <TableCell className="whitespace-normal break-words max-w-[150px]">
                    {project.companyClient?.name || "N/A"}
                  </TableCell>
                  <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleEditClick(e as any, project)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => openStatusDialog(e as any, project)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Change Status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteClick(e as any, project)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleProjectCreated}
      />

      <CreateProjectDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
        editProject={editingProject}
      />

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Project Status</DialogTitle>
            <DialogDescription className="text-sm">
              <span className="font-semibold">{selectedProjectForStatus?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Current Status */}
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground mb-1">Current Status:</p>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: getStatusBadge(selectedProjectForStatus?.status || "").bgColor,
                  color: getStatusBadge(selectedProjectForStatus?.status || "").textColor,
                  border: `1px solid ${getStatusBadge(selectedProjectForStatus?.status || "").borderColor}`,
                }}
              >
                {getStatusIcon(selectedProjectForStatus?.status || "")}
                {getStatusBadge(selectedProjectForStatus?.status || "").label}
              </div>
            </div>

            {/* Status Options */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Select new status:</p>
              <div className="space-y-2">
                {selectedProjectForStatus?.status?.toLowerCase() !== "propose" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-amber-600 hover:text-amber-600 hover:bg-amber-50 bg-transparent"
                    onClick={() => handleStatusChange("propose")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Propose
                  </Button>
                )}
                {selectedProjectForStatus?.status?.toLowerCase() !== "active" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-green-600 hover:text-green-600 hover:bg-green-50 bg-transparent"
                    onClick={() => handleStatusChange("active")}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Active
                  </Button>
                )}
                {selectedProjectForStatus?.status?.toLowerCase() !== "completed" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-blue-600 hover:text-blue-600 hover:bg-blue-50 bg-transparent"
                    onClick={() => handleStatusChange("completed")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Completed
                  </Button>
                )}
                {selectedProjectForStatus?.status?.toLowerCase() !== "archive" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-gray-600 hover:text-gray-600 hover:bg-gray-50 bg-transparent"
                    onClick={() => handleStatusChange("archive")}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Project</DialogTitle>
            <DialogDescription className="text-sm">
              This action cannot be undone. All associated data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg bg-destructive/10 p-3">
              <p className="text-xs text-muted-foreground">Project to delete:</p>
              <p className="font-semibold text-destructive">{deletingProject?.name}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-name" className="text-sm">
                Type <span className="font-semibold">{deletingProject?.name}</span> to confirm:
              </Label>
              <Input
                id="confirm-name"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="Enter project name"
                className="h-9"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleteConfirmName !== deletingProject?.name || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
