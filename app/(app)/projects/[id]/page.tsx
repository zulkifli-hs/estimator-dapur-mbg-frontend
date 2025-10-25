"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Edit,
  Trash2,
  LayoutDashboard,
  Layout,
  Calculator,
  TrendingUp,
  FileText,
  FolderOpen,
  Users,
} from "lucide-react"
import { projectsApi } from "@/lib/api/projects"
import { ProjectOverview } from "@/components/projects/project-overview"
import { ProjectLayout } from "@/components/projects/project-layout"
import { ProjectBOQ } from "@/components/projects/project-boq"
import { ProjectProgress } from "@/components/projects/project-progress"
import { ProjectInvoice } from "@/components/projects/project-invoice"
import { ProjectDocuments } from "@/components/projects/project-documents"
import { ProjectMembers } from "@/components/projects/project-members"
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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            <span>Layout</span>
          </TabsTrigger>
          <TabsTrigger value="boq" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span>BOQ</span>
          </TabsTrigger>
          <TabsTrigger value="project" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Project</span>
          </TabsTrigger>
          <TabsTrigger value="invoice" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Invoice</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span>Documents</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Members</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ProjectOverview project={project} onUpdate={loadProject} />
        </TabsContent>

        <TabsContent value="layout">
          <ProjectLayout projectId={project._id} />
        </TabsContent>

        <TabsContent value="boq">
          <ProjectBOQ projectId={project._id} />
        </TabsContent>

        <TabsContent value="project">
          <ProjectProgress projectId={project._id} />
        </TabsContent>

        <TabsContent value="invoice">
          <ProjectInvoice projectId={project._id} />
        </TabsContent>

        <TabsContent value="documents">
          <ProjectDocuments projectId={project._id} />
        </TabsContent>

        <TabsContent value="members">
          <ProjectMembers project={project} onUpdate={loadProject} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
