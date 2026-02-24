"use client"

import { useEffect, useState } from "react"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
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
  ShoppingCart,
} from "lucide-react"
import { projectsApi } from "@/lib/api/projects"
import { ProjectOverview } from "@/components/projects/project-overview"
import { ProjectLayout } from "@/components/projects/project-layout"
import { ProjectBOQ } from "@/components/projects/project-boq"
import { ProjectProgress } from "@/components/projects/project-progress"
import { ProjectInvoice } from "@/components/projects/project-invoice"
import { ProjectDocuments } from "@/components/projects/project-documents"
import { ProjectMembers } from "@/components/projects/project-members"
import { ProjectProcurement } from "@/components/projects/project-procurement"
import Link from "next/link"

const PROJECT_TABS = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "layout", label: "Layout", icon: Layout },
  { value: "boq", label: "BOQ", icon: Calculator },
  { value: "project", label: "Project", icon: TrendingUp },
  { value: "procurement", label: "Procurement", icon: ShoppingCart },
  { value: "invoice", label: "Invoice", icon: FileText },
  { value: "documents", label: "Documents", icon: FolderOpen },
  { value: "members", label: "Members", icon: Users },
]

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (params.id) {
      loadProject()
    }
  }, [params.id])

  useEffect(() => {
    const tabFromQuery = searchParams.get("tab")
    if (tabFromQuery && PROJECT_TABS.some((tab) => tab.value === tabFromQuery) && tabFromQuery !== activeTab) {
      setActiveTab(tabFromQuery)
    }
  }, [searchParams, activeTab])

  const handleTabChange = (nextTab: string) => {
    setActiveTab(nextTab)

    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", nextTab)
    params.delete("subtab")

    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

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
      <div className="flex items-center justify-center min-h-100">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-4">
        <p className="text-muted-foreground">Project not found</p>
        <Button onClick={() => router.push("/projects")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-2 md:gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight truncate">{project.name}</h1>
          <p className="text-sm text-muted-foreground truncate">{project.companyClient?.name || "No client"}</p>
        </div>
        {/* <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10 bg-transparent">
          <Edit className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10 bg-transparent">
          <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
        </Button> */}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 md:space-y-6">
        <div className="relative">
          <TabsList className="inline-flex w-full md:grid md:grid-cols-8 h-auto p-1 overflow-x-auto scrollbar-hide">
            {PROJECT_TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center justify-center gap-1.5 md:gap-2 whitespace-nowrap px-3 md:px-4 py-2 text-sm data-[state=active]:bg-background"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        <TabsContent value="overview">
          <ProjectOverview project={project} onUpdate={loadProject} />
        </TabsContent>

        <TabsContent value="layout">
          <ProjectLayout projectId={project._id} project={project} onUpdate={loadProject} />
        </TabsContent>

        <TabsContent value="boq">
          <ProjectBOQ projectId={project._id} />
        </TabsContent>

        <TabsContent value="project">
          <ProjectProgress projectId={project._id} />
        </TabsContent>

        <TabsContent value="procurement">
          <ProjectProcurement projectId={project._id} />
        </TabsContent>

        <TabsContent value="invoice">
          <ProjectInvoice projectId={project._id} project={project} onUpdate={loadProject} />
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
