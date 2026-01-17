"use client"

import type React from "react"

import { useEffect, useState } from "react"
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
} from "lucide-react"
import { projectsApi } from "@/lib/api/projects"
import Link from "next/link"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archive", label: "Archive" },
] as const

type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return { label: "Active", className: "bg-green-100 text-green-700 border-green-200" }
    case "completed":
      return { label: "Completed", className: "bg-blue-100 text-blue-700 border-blue-200" }
    case "archive":
      return { label: "Archived", className: "bg-gray-100 text-gray-700 border-gray-200" }
    default:
      return { label: status || "Unknown", className: "bg-gray-100 text-gray-700 border-gray-200" }
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [filteredProjects, setFilteredProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
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

  const handleStatusChange = async (e: React.MouseEvent, project: any, status: "active" | "completed" | "archive") => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const response = await projectsApi.updateStatus(project._id, status)
      if (response.success) {
        toast.success(`Project status updated to ${status}`)
        loadProjects()
      } else {
        toast.error("Failed to update project status")
      }
    } catch (error) {
      console.error("Failed to update project status:", error)
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
                        <Badge className="bg-primary/10 text-primary w-fit">{project.type || "Project"}</Badge>
                        <Badge variant="outline" className={getStatusBadge(project.status).className}>
                          {getStatusBadge(project.status).label}
                        </Badge>
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
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Change Status
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {project.status !== "active" && (
                            <DropdownMenuItem onClick={(e) => handleStatusChange(e as any, project, "active")}>
                              <Play className="h-4 w-4 mr-2" />
                              Active
                            </DropdownMenuItem>
                          )}
                          {project.status !== "completed" && (
                            <DropdownMenuItem onClick={(e) => handleStatusChange(e as any, project, "completed")}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Completed
                            </DropdownMenuItem>
                          )}
                          {project.status !== "archive" && (
                            <DropdownMenuItem onClick={(e) => handleStatusChange(e as any, project, "archive")}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
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
                    <Badge className="bg-primary/10 text-primary">{project.type || "Project"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusBadge(project.status).className}>
                      {getStatusBadge(project.status).label}
                    </Badge>
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
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Change Status
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {project.status !== "active" && (
                              <DropdownMenuItem onClick={(e) => handleStatusChange(e as any, project, "active")}>
                                <Play className="h-4 w-4 mr-2" />
                                Active
                              </DropdownMenuItem>
                            )}
                            {project.status !== "completed" && (
                              <DropdownMenuItem onClick={(e) => handleStatusChange(e as any, project, "completed")}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Completed
                              </DropdownMenuItem>
                            )}
                            {project.status !== "archive" && (
                              <DropdownMenuItem onClick={(e) => handleStatusChange(e as any, project, "archive")}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
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
          <DialogFooter className="gap-2 sm:gap-0">
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
