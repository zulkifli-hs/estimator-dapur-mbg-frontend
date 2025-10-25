"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import { projectsApi } from "@/lib/api/projects"
import { ProjectOverview } from "@/components/projects/project-overview"
import { ProjectDocuments } from "@/components/projects/project-documents"
import { ProjectAlbums } from "@/components/projects/project-albums"
import { ProjectBOQ } from "@/components/projects/project-boq"
import { ProjectTermin } from "@/components/projects/project-termin"
import Link from "next/link"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (params.id) {
      loadProject()
    }
  }, [params.id])

  const loadProject = async () => {
    try {
      const response = await projectsApi.getById(params.id as string)
      if (response.success && response.data) {
        setProject(response.data)
      }
    } catch (error) {
      console.error("Failed to load project:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Project not found</p>
        <Button onClick={() => router.push("/projects")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.companyClient?.name || "No client"}</p>
        </div>
        <Button variant="outline" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="albums">Albums</TabsTrigger>
          <TabsTrigger value="boq">BOQ</TabsTrigger>
          <TabsTrigger value="termin">Termin</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ProjectOverview project={project} onUpdate={loadProject} />
        </TabsContent>

        <TabsContent value="documents">
          <ProjectDocuments projectId={project._id} />
        </TabsContent>

        <TabsContent value="albums">
          <ProjectAlbums projectId={project._id} />
        </TabsContent>

        <TabsContent value="boq">
          <ProjectBOQ projectId={project._id} />
        </TabsContent>

        <TabsContent value="termin">
          <ProjectTermin projectId={project._id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
