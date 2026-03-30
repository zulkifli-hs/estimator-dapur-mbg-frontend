"use client"

import { useEffect, useMemo, useState } from "react"
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
import { getProfile } from "@/lib/api/auth"
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
  { value: "overview", label: "Overview", icon: LayoutDashboard, roles: ["ALL"] },
  { value: "layout", label: "Layout", icon: Layout, roles: ["OWNER", "ADMIN", "DESIGNER"] },
  { value: "boq", label: "BOQ", icon: Calculator, roles: ["OWNER", "ADMIN", "ESTIMATOR"] },
  { value: "project", label: "Project", icon: TrendingUp, roles: ["OWNER", "ADMIN", "PROJECT_MANAGER"] },
  { value: "procurement", label: "Procurement", icon: ShoppingCart, roles: ["OWNER", "ADMIN", "ESTIMATOR", "DESIGNER", "PROJECT_MANAGER"] },
  { value: "invoice", label: "Invoice", icon: FileText, roles: ["OWNER", "ADMIN", "FINANCE"] },
  { value: "documents", label: "Documents", icon: FolderOpen, roles: ["ALL"] },
  { value: "members", label: "Members", icon: Users, roles: ["OWNER", "ADMIN"] },
]

const GRID_COLS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
  7: "md:grid-cols-7",
  8: "md:grid-cols-8",
}

function getUserProjectRoles(project: any, userId: string): Set<string> {
  const roles = new Set<string>()
  const toId = (ref: any): string => ref?._id?.toString() ?? ref?.toString() ?? ""

  if (toId(project.owner) === userId) roles.add("OWNER")

  const roleMap: Array<[string, string]> = [
    ["admins", "ADMIN"],
    ["estimators", "ESTIMATOR"],
    ["projectManagers", "PROJECT_MANAGER"],
    ["finances", "FINANCE"],
    ["designers", "DESIGNER"],
  ]
  for (const [field, role] of roleMap) {
    if (Array.isArray(project[field]) && project[field].some((m: any) => toId(m.user) === userId)) {
      roles.add(role)
    }
  }
  return roles
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const visibleTabs = useMemo(() => {
    if (isGlobalAdmin) return PROJECT_TABS
    if (!project || !currentUserId) return PROJECT_TABS
    const userRoles = getUserProjectRoles(project, currentUserId)
    return PROJECT_TABS.filter((tab) =>
      tab.roles.includes("ALL") || tab.roles.some((r) => userRoles.has(r))
    )
  }, [project, currentUserId, isGlobalAdmin])

  useEffect(() => {
    if (params.id) {
      loadProject()
    }
  }, [params.id])

  useEffect(() => {
    const tabFromQuery = searchParams.get("tab")
    if (tabFromQuery && visibleTabs.some((tab) => tab.value === tabFromQuery) && tabFromQuery !== activeTab) {
      setActiveTab(tabFromQuery)
    }
  }, [searchParams, activeTab, visibleTabs])

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
      const [projectResponse, profileResponse] = await Promise.all([
        projectsApi.getById(params.id as string),
        getProfile(),
      ])
      if (projectResponse.success && projectResponse.data) {
        setProject(projectResponse.data)
      }
      if (profileResponse.code === 200 && profileResponse.data) {
        setCurrentUserId(profileResponse.data._id)
        setIsGlobalAdmin(profileResponse.data.admin === true)
      }
    } catch (error) {
      console.error("Failed to load project:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!project || !currentUserId || isGlobalAdmin) return
    const userRoles = getUserProjectRoles(project, currentUserId)
    const tabRoles = PROJECT_TABS.find((t) => t.value === activeTab)?.roles ?? ["ALL"]
    const hasAccess = tabRoles.includes("ALL") || tabRoles.some((r) => userRoles.has(r))
    if (!hasAccess) {
      handleTabChange("overview")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, currentUserId, isGlobalAdmin])

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
          <TabsList className={`inline-flex w-full md:grid ${GRID_COLS[visibleTabs.length] ?? "md:grid-cols-8"} h-auto p-1 overflow-x-auto scrollbar-hide`}>
            {visibleTabs.map((tab) => {
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

        {visibleTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.value === "overview" && <ProjectOverview project={project} onUpdate={loadProject} />}
            {tab.value === "layout" && <ProjectLayout projectId={project._id} project={project} onUpdate={loadProject} />}
            {tab.value === "boq" && <ProjectBOQ projectId={project._id} />}
            {tab.value === "project" && <ProjectProgress projectId={project._id} project={project} />}
            {tab.value === "procurement" && <ProjectProcurement projectId={project._id} />}
            {tab.value === "invoice" && <ProjectInvoice projectId={project._id} project={project} onUpdate={loadProject} />}
            {tab.value === "documents" && <ProjectDocuments projectId={project._id} />}
            {tab.value === "members" && <ProjectMembers project={project} onUpdate={loadProject} />}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
