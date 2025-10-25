"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, MapPin, Calendar, User } from "lucide-react"
import { projectsApi } from "@/lib/api/projects"
import Link from "next/link"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { Badge } from "@/components/ui/badge"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [filteredProjects, setFilteredProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadProjects()
  }, [page])

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
      const response = await projectsApi.getAll({ page, limit: 10 })
      console.log("[v0] Projects API response:", response)

      if (response.success && response.data) {
        console.log("[v0] Projects data:", response.data)
        setProjects(response.data)
        setFilteredProjects(response.data)
        if (response.totalPage) {
          setTotalPages(response.totalPage)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to load projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectCreated = () => {
    setCreateDialogOpen(false)
    loadProjects()
  }

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
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link key={project._id} href={`/projects/${project._id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                    <Badge className="bg-primary/10 text-primary">{project.type || "Project"}</Badge>
                  </div>
                  <CardDescription className="line-clamp-1">
                    {project.building} - Floor {project.floor}
                  </CardDescription>
                </CardHeader>
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
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleProjectCreated}
      />
    </div>
  )
}
