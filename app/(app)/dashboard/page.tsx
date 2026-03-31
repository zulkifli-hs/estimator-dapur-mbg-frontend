"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Building2,
  FolderKanban,
  TrendingUp,
  Users,
  Settings2,
  GripVertical,
  FileText,
  CreditCard,
  MessageSquare,
  ImageIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  LayoutTemplate,
  Cpu,
  MemoryStick,
  HardDrive,
  ArrowUp,
  ArrowDown,
  Minus,
  UserCog,
  ShieldCheck,
} from "lucide-react"
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { projectsApi, type Project } from "@/lib/api/projects"
import { getBOQList } from "@/lib/api/boq"
import { getTerminList, type Termin } from "@/lib/api/termin"
import { discussionsApi, type Post } from "@/lib/api/discussions"
import { dashboardApi, type DashboardData } from "@/lib/api/dashboard"

// ── types ────────────────────────────────────────────────────────────────────

type ProjectWithStatus = Project & { status?: "Propose" | "Active" | "Completed" | "Archive" }

interface CurrentUser {
  _id: string
  email: string
  admin?: boolean
  profile?: { name?: string; photo?: { url: string; provider: string }; phone?: string }
}

type AdminCardId =
  | "adminStats"
  | "projectStats"
  | "projectProgress"
  | "teamComposition"
  | "boqStatus"
  | "serverStats"
  | "mediaStorage"
  | "recentProjects"

type UserCardId =
  | "userStats"
  | "myProjects"
  | "myRoles"
  | "boqStatus"
  | "paymentSchedule"
  | "recentDiscussions"

type DashboardCardId = AdminCardId | UserCardId

interface DashboardLayout {
  cardOrder: DashboardCardId[]
  hiddenCards: DashboardCardId[]
}

const ADMIN_DEFAULT: DashboardLayout = {
  cardOrder: ["adminStats", "projectStats", "projectProgress", "teamComposition", "boqStatus", "serverStats", "mediaStorage", "recentProjects", "myProjects", "myRoles", "paymentSchedule", "recentDiscussions"],
  hiddenCards: [],
}

const USER_DEFAULT: DashboardLayout = {
  cardOrder: ["userStats", "myProjects", "myRoles", "boqStatus", "paymentSchedule", "recentDiscussions"],
  hiddenCards: [],
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(value: unknown): string {
  const n = Number(value)
  if (isNaN(n) || !isFinite(n)) return "0"
  return String(n)
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
}

function trendBadge(current: number, previous: number) {
  if (previous === 0 && current === 0) return null
  if (previous === 0) return { icon: ArrowUp, label: `+${current} bulan ini`, color: "text-green-600 bg-green-500/10" }
  const delta = current - previous
  if (delta > 0) return { icon: ArrowUp, label: `+${delta} dari bulan lalu`, color: "text-green-600 bg-green-500/10" }
  if (delta < 0) return { icon: ArrowDown, label: `${delta} dari bulan lalu`, color: "text-red-600 bg-red-500/10" }
  return { icon: Minus, label: "sama dengan bulan lalu", color: "text-muted-foreground bg-muted" }
}

function getUserRolesInProject(project: ProjectWithStatus, userId: string): string[] {
  const roles: string[] = []
  if (project.owner?._id === userId) roles.push("Owner")
  if (project.admins?.some((m) => m.user?._id === userId)) roles.push("Admin")
  if (project.projectManagers?.some((m) => m.user?._id === userId)) roles.push("Project Manager")
  if (project.estimators?.some((m) => m.user?._id === userId)) roles.push("Estimator")
  if (project.designers?.some((m) => m.user?._id === userId)) roles.push("Designer")
  if (project.finances?.some((m) => m.user?._id === userId)) roles.push("Finance")
  if (project.clients?.some((m) => m.user?._id === userId)) roles.push("Client")
  return roles
}

function projectStatusStyle(status: string | undefined) {
  switch (status) {
    case "Active": return "bg-blue-500/10 text-blue-700"
    case "Completed": return "bg-green-500/10 text-green-700"
    case "Archive": return "bg-muted text-muted-foreground"
    default: return "bg-yellow-500/10 text-yellow-700"
  }
}

function boqStatusStyle(status: string) {
  switch (status) {
    case "Accepted": return "bg-green-500/10 text-green-700"
    case "Request": return "bg-yellow-500/10 text-yellow-700"
    case "Rejected": return "bg-red-500/10 text-red-700"
    default: return "bg-muted text-muted-foreground"
  }
}

function diskUsagePct(used: number, size: number): number {
  if (!size) return 0
  return Math.min(100, Math.round((used / size) * 100))
}

// ── component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [dashData, setDashData] = useState<DashboardData | null>(null)
  const [projects, setProjects] = useState<ProjectWithStatus[]>([])
  const [boqItems, setBoqItems] = useState<any[]>([])
  const [termins, setTermins] = useState<Termin[]>([])
  const [recentPosts, setRecentPosts] = useState<(Post & { projectName: string })[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = currentUser?.admin === true
  const layoutKey = isAdmin ? "dashboard-layout-admin" : "dashboard-layout-user"

  const [layout, setLayout] = useState<DashboardLayout>(() => {
    if (typeof window === "undefined") return USER_DEFAULT
    const saved = localStorage.getItem("dashboard-layout-user")
    if (saved) {
      try { return JSON.parse(saved) as DashboardLayout } catch { /* fallthrough */ }
    }
    return USER_DEFAULT
  })
  const [draggedCard, setDraggedCard] = useState<DashboardCardId | null>(null)

  // Re-initialize layout when user role becomes known
  useEffect(() => {
    const key = isAdmin ? "dashboard-layout-admin" : "dashboard-layout-user"
    const saved = localStorage.getItem(key)
    if (saved) {
      try { setLayout(JSON.parse(saved)); return } catch { /* fallthrough */ }
    }
    setLayout(isAdmin ? ADMIN_DEFAULT : USER_DEFAULT)
  }, [isAdmin])

  // Load current user from localStorage (set by app layout)
  useEffect(() => {
    const raw = localStorage.getItem("user")
    if (!raw) { router.push("/login"); return }
    try { setCurrentUser(JSON.parse(raw) as CurrentUser) }
    catch { router.push("/login") }
  }, [router])

  // Load dashboard data once user is known
  useEffect(() => {
    if (!currentUser) return
    loadData(currentUser)
  }, [currentUser])

  const loadData = async (_currentUser: CurrentUser) => {
    try {
      const [dashResponse, projectsResponse] = await Promise.allSettled([
        dashboardApi.getDashboard(),
        projectsApi.getAll(),
      ])

      const dash = dashResponse.status === "fulfilled" ? dashResponse.value : null
      const projList: ProjectWithStatus[] =
        projectsResponse.status === "fulfilled" && projectsResponse.value.success
          ? (projectsResponse.value.data ?? []) as ProjectWithStatus[]
          : []

      setDashData(dash)
      setProjects(projList)

      // Fetch per-project details for top 5 projects
      const top = projList.slice(0, 5)
      const [boqResults, terminResults, postResults] = await Promise.all([
        Promise.allSettled(top.map((p) => getBOQList(p._id))),
        Promise.allSettled(top.map((p) => getTerminList(p._id))),
        Promise.allSettled(
          top.map((p) =>
            discussionsApi.getPosts(p._id, 3, 1).then((r) =>
              ((r.data ?? []) as Post[]).map((post) => ({ ...post, projectName: p.name }))
            )
          )
        ),
      ])

      const allBoqs: any[] = []
      boqResults.forEach((r) => {
        if (r.status === "fulfilled") allBoqs.push(...(Array.isArray(r.value) ? r.value : []))
      })

      const allTermins: Termin[] = []
      terminResults.forEach((r) => {
        if (r.status === "fulfilled") allTermins.push(...(Array.isArray(r.value) ? r.value : []))
      })

      const allPosts: (Post & { projectName: string })[] = []
      postResults.forEach((r) => {
        if (r.status === "fulfilled") allPosts.push(...r.value)
      })
      allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setBoqItems(allBoqs)
      setTermins(allTermins)
      setRecentPosts(allPosts.slice(0, 8))
    } catch (err) {
      console.error("Failed to load dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }

  const updateLayout = (newLayout: DashboardLayout) => {
    setLayout(newLayout)
    localStorage.setItem(layoutKey, JSON.stringify(newLayout))
  }

  const toggleCardVisibility = (cardId: DashboardCardId) => {
    const newHidden = layout.hiddenCards.includes(cardId)
      ? layout.hiddenCards.filter((id) => id !== cardId)
      : [...layout.hiddenCards, cardId]
    updateLayout({ ...layout, hiddenCards: newHidden })
  }

  const handleDragStart = (cardId: DashboardCardId) => setDraggedCard(cardId)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = (targetCardId: DashboardCardId) => {
    if (!draggedCard || draggedCard === targetCardId) return
    const newOrder = [...layout.cardOrder]
    const di = newOrder.indexOf(draggedCard)
    const ti = newOrder.indexOf(targetCardId)
    newOrder.splice(di, 1)
    newOrder.splice(ti, 0, draggedCard)
    updateLayout({ ...layout, cardOrder: newOrder })
    setDraggedCard(null)
  }
  const handleDragEnd = () => setDraggedCard(null)
  const resetLayout = () => updateLayout(isAdmin ? ADMIN_DEFAULT : USER_DEFAULT)

  // ── derived data ───────────────────────────────────────────────────────────

  const boqStatusCounts = {
    draft: dashData?.boq?.draft ?? 0,
    request: dashData?.boq?.request ?? 0,
    accepted: dashData?.boq?.accepted ?? 0,
    rejected: dashData?.boq?.rejected ?? 0,
  }

  const terminStatusCounts = {
    draft: termins.filter((t) => t.status === "Draft").length,
    pending: termins.filter((t) => t.status === "Pending").length,
    sent: termins.filter((t) => t.status === "Sent").length,
    approved: termins.filter((t) => t.status === "Approved").length,
  }

  const boqChartData = [
    { name: "Draft",     value: boqStatusCounts.draft,    color: "hsl(215, 16%, 47%)"  },
    { name: "Requested", value: boqStatusCounts.request,  color: "hsl(38, 92%, 50%)"   },
    { name: "Accepted",  value: boqStatusCounts.accepted, color: "hsl(142, 71%, 45%)"  },
    { name: "Rejected",  value: boqStatusCounts.rejected, color: "hsl(0, 72%, 51%)"    },
  ]

  const terminChartData = [
    { status: "Draft",    count: terminStatusCounts.draft,    color: "hsl(215, 16%, 47%)" },
    { status: "Pending",  count: terminStatusCounts.pending,  color: "hsl(38, 92%, 50%)"  },
    { status: "Sent",     count: terminStatusCounts.sent,     color: "hsl(217, 91%, 60%)" },
    { status: "Approved", count: terminStatusCounts.approved, color: "hsl(142, 71%, 45%)" },
  ]

  const projectProgressData = (dashData?.projectProgress ?? []).map((item) => ({
    month: MONTH_LABELS[(item.month - 1) % 12],
    completed: item.completed,
    ongoing: item.ongoing,
  }))

  const myRolesSummary = (() => {
    if (!currentUser) return {} as Record<string, number>
    const counts: Record<string, number> = {}
    for (const p of projects) {
      const roles = getUserRolesInProject(p, currentUser._id)
      for (const r of roles) counts[r] = (counts[r] ?? 0) + 1
    }
    return counts
  })()

  const cardLabels: Record<string, string> = isAdmin
    ? {
        adminStats: "Overview Statistik",
        projectStats: "Statistik Project",
        projectProgress: "Project Progress Chart",
        teamComposition: "Komposisi Tim",
        boqStatus: "Status BOQ",
        serverStats: "Server Stats",
        mediaStorage: "Media & Storage",
        recentProjects: "Proyek Terbaru",
        myProjects: "Proyek Saya (Role Saya)",
        myRoles: "Role Saya",
        paymentSchedule: "Jadwal Pembayaran (Role Saya)",
        recentDiscussions: "Diskusi Terbaru (Role Saya)",
      }
    : {
        userStats: "Overview Statistik",
        myProjects: "Proyek Saya",
        myRoles: "Role Saya",
        boqStatus: "Status BOQ",
        paymentSchedule: "Jadwal Pembayaran",
        recentDiscussions: "Diskusi Terbaru",
      }

  // ── shared BOQ status card ─────────────────────────────────────────────────

  const boqStatusCard = (
    <Card>
      <CardHeader>
        <CardTitle>Status BOQ</CardTitle>
        <CardDescription>Distribusi Bill of Quantities berdasarkan status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[
            { label: "Draft",     count: boqStatusCounts.draft,    icon: FileText,     cls: "bg-muted",         iconCls: "text-muted-foreground" },
            { label: "Requested", count: boqStatusCounts.request,  icon: Clock,        cls: "bg-yellow-500/10", iconCls: "text-yellow-600"       },
            { label: "Accepted",  count: boqStatusCounts.accepted, icon: CheckCircle2, cls: "bg-green-500/10",  iconCls: "text-green-600"        },
            { label: "Rejected",  count: boqStatusCounts.rejected, icon: AlertCircle,  cls: "bg-red-500/10",    iconCls: "text-red-600"          },
          ].map(({ label, count, icon: Icon, cls, iconCls }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${cls} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${iconCls}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "..." : fmt(count)}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
        {boqChartData.some((d) => d.value > 0) && (
          <ChartContainer
            config={{
              Draft:     { label: "Draft",     color: "hsl(215, 16%, 47%)"  },
              Requested: { label: "Requested", color: "hsl(38, 92%, 50%)"   },
              Accepted:  { label: "Accepted",  color: "hsl(142, 71%, 45%)"  },
              Rejected:  { label: "Rejected",  color: "hsl(0, 72%, 51%)"    },
            }}
            className="h-50 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={boqChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={72}>
                  {boqChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        {boqChartData.every((d) => d.value === 0) && !loading && (
          <p className="text-center text-sm text-muted-foreground py-6">Belum ada data BOQ</p>
        )}
      </CardContent>
    </Card>
  )

  // ── Admin cards ────────────────────────────────────────────────────────────

  const adminCards: Record<AdminCardId, React.JSX.Element> = {
    adminStats: (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Users",     value: fmt(dashData?.totalUsers),        desc: "Pengguna terdaftar",    icon: Users,          stat: null as ReturnType<typeof trendBadge> },
          { title: "Total Products",  value: fmt(dashData?.totalProducts),  desc: "Produk dalam katalog",  icon: Package,        stat: null as ReturnType<typeof trendBadge> },
          { title: "Total Templates", value: fmt(dashData?.totalTemplates), desc: "Template BOQ",          icon: LayoutTemplate, stat: null as ReturnType<typeof trendBadge> },
          {
            title: "Total Projects",
            value: fmt(dashData?.totalProject?.total),
            desc: "Semua proyek",
            icon: FolderKanban,
            stat: dashData ? trendBadge(dashData.totalProject.today, dashData.totalProject.before) : null,
          },
        ].map(({ title, value, desc, icon: Icon, stat }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : value}</div>
              <p className="text-xs text-muted-foreground">{desc}</p>
              {stat && (
                <p className={`text-xs mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${stat.color}`}>
                  <stat.icon className="h-3 w-3" />
                  {stat.label}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    ),

    projectStats: (
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Active Projects",    key: "activeProject"    as const, icon: Building2,  color: "text-blue-600 bg-blue-500/10"     },
          { title: "Completed Projects", key: "completedProject" as const, icon: TrendingUp, color: "text-green-600 bg-green-500/10"   },
          { title: "Total Clients",      key: "totalClient"      as const, icon: Users,      color: "text-purple-600 bg-purple-500/10" },
        ].map(({ title, key, icon: Icon, color }) => {
          const stat = dashData?.[key]
          const trend = stat ? trendBadge(stat.today, stat.before) : null
          return (
            <Card key={title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? "..." : fmt(stat?.total)}</div>
                {trend && (
                  <p className={`text-xs mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${trend.color}`}>
                    <trend.icon className="h-3 w-3" />
                    {trend.label}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    ),

    projectProgress: (
      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
          <CardDescription>Completed vs Ongoing — 12 bulan terakhir</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {projectProgressData.length > 0 ? (
            <ChartContainer
              config={{
                completed: { label: "Completed", color: "hsl(142, 76%, 36%)" },
                ongoing:   { label: "Ongoing",   color: "hsl(221, 83%, 53%)" },
              }}
              className="h-62 sm:h-75 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} iconType="circle" />
                  <Bar dataKey="completed" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ongoing" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-12">
              {loading ? "Memuat data..." : "Belum ada data proyek"}
            </p>
          )}
        </CardContent>
      </Card>
    ),

    teamComposition: (
      <Card>
        <CardHeader>
          <CardTitle>Komposisi Tim</CardTitle>
          <CardDescription>Unique member count per role lintas semua proyek</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Estimators",       value: dashData?.team?.estimators,      color: "bg-blue-500/10 text-blue-700"     },
              { label: "Project Managers", value: dashData?.team?.projectManagers,  color: "bg-purple-500/10 text-purple-700" },
              { label: "Designers",        value: dashData?.team?.designers,        color: "bg-pink-500/10 text-pink-700"     },
              { label: "Finance",          value: dashData?.team?.finances,         color: "bg-green-500/10 text-green-700"   },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold mt-0.5">{loading ? "..." : fmt(value)}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${color}`}>
                  {label.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ),

    boqStatus: boqStatusCard,

    serverStats: (
      <Card>
        <CardHeader>
          <CardTitle>Server Stats</CardTitle>
          <CardDescription>CPU, Memory, dan Disk usage server</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading || !dashData?.serverStats ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {loading ? "Memuat data server..." : "Data server tidak tersedia"}
            </p>
          ) : (
            <>
              {/* CPU */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">CPU</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {dashData.serverStats.cpu.model} · {dashData.serverStats.cpu.cores} cores
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        dashData.serverStats.cpu.usage > 80 ? "bg-red-500"
                          : dashData.serverStats.cpu.usage > 50 ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${dashData.serverStats.cpu.usage}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold w-12 text-right">{dashData.serverStats.cpu.usage}%</span>
                </div>
              </div>

              {/* Memory */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MemoryStick className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Memory (RAM)</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {dashData.serverStats.memory.used.toFixed(1)} / {dashData.serverStats.memory.total.toFixed(1)} GB
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    {(() => {
                      const pct = dashData.serverStats.memory.total > 0
                        ? Math.round((dashData.serverStats.memory.used / dashData.serverStats.memory.total) * 100)
                        : 0
                      return (
                        <div
                          className={`h-full rounded-full ${pct > 80 ? "bg-red-500" : pct > 60 ? "bg-yellow-500" : "bg-blue-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      )
                    })()}
                  </div>
                  <span className="text-sm font-bold w-12 text-right">
                    {dashData.serverStats.memory.total > 0
                      ? `${Math.round((dashData.serverStats.memory.used / dashData.serverStats.memory.total) * 100)}%`
                      : "–"}
                  </span>
                </div>
              </div>

              {/* Disk */}
              {dashData.serverStats.disk.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Disk</span>
                  </div>
                  <div className="space-y-2">
                    {dashData.serverStats.disk.slice(0, 3).map((d) => {
                      const pct = diskUsagePct(d.used, d.size)
                      return (
                        <div key={d.mount}>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span className="font-mono">{d.mount}</span>
                            <span>{d.used.toFixed(1)} / {d.size.toFixed(1)} GB ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct > 85 ? "bg-red-500" : pct > 65 ? "bg-yellow-500" : "bg-primary"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    ),

    mediaStorage: (
      <Card>
        <CardHeader>
          <CardTitle>Media & Storage</CardTitle>
          <CardDescription>Foto, file, dan penggunaan storage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{loading ? "..." : fmt(dashData?.media?.photos)}</p>
                <p className="text-sm text-muted-foreground">Foto</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{loading ? "..." : fmt(dashData?.media?.files)}</p>
                <p className="text-sm text-muted-foreground">File</p>
              </div>
            </div>
          </div>
          {dashData?.media?.storage && dashData.media.storage.total > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Storage Usage</span>
                <span className="text-sm font-bold">
                  {Math.round((dashData.media.storage.usage / dashData.media.storage.total) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-green-500 to-yellow-500 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((dashData.media.storage.usage / dashData.media.storage.total) * 100))}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {dashData.media.storage.usage.toFixed(1)} GB dari {dashData.media.storage.total.toFixed(1)} GB
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    ),

    recentProjects: (
      <Card>
        <CardHeader>
          <CardTitle>Proyek Terbaru</CardTitle>
          <CardDescription>Proyek yang baru diperbarui</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Memuat proyek...</p>
          ) : projects.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Belum ada proyek.</p>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 6).map((project) => (
                <div
                  key={project._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => (window.location.href = `/projects/${project._id}`)}
                >
                  <div className="space-y-0.5 min-w-0 flex-1 pr-3">
                    <p className="font-medium text-sm truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{project.companyClient?.name}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded shrink-0 ${projectStatusStyle(project.status)}`}>
                    {project.status ?? "Propose"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    ),
  }

  // ── User cards ─────────────────────────────────────────────────────────────

  const userCards: Record<UserCardId, React.JSX.Element> = {
    userStats: (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Proyek",  key: "totalProject"     as const, desc: "Semua proyek saya",     icon: FolderKanban },
          { title: "Proyek Aktif",  key: "activeProject"    as const, desc: "Sedang berjalan",       icon: Building2    },
          { title: "Completed",     key: "completedProject" as const, desc: "Berhasil diselesaikan", icon: TrendingUp   },
          { title: "Total Klien",   key: "totalClient"      as const, desc: "Klien unik",            icon: Users        },
        ].map(({ title, key, desc, icon: Icon }) => {
          const stat = dashData?.[key]
          const trend = stat ? trendBadge(stat.today, stat.before) : null
          return (
            <Card key={title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : fmt(stat?.total)}</div>
                <p className="text-xs text-muted-foreground">{desc}</p>
                {trend && (
                  <p className={`text-xs mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${trend.color}`}>
                    <trend.icon className="h-3 w-3" />
                    {trend.label}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    ),

    myProjects: (
      <Card>
        <CardHeader>
          <CardTitle>Proyek Saya</CardTitle>
          <CardDescription>Semua proyek yang Anda terlibat beserta role dan status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Memuat proyek...</p>
          ) : projects.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Belum terlibat dalam proyek apapun.</p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => {
                const roles = currentUser ? getUserRolesInProject(project, currentUser._id) : []
                const projectBoqs = boqItems.filter(
                  (b) => b.project === project._id || b.project?._id === project._id
                )
                const latestBoq = projectBoqs[projectBoqs.length - 1]
                return (
                  <div
                    key={project._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer gap-3"
                    onClick={() => (window.location.href = `/projects/${project._id}`)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{project.companyClient?.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {roles.map((r) => (
                        <span key={r} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                          {r}
                        </span>
                      ))}
                      <span className={`text-xs font-medium px-2 py-1 rounded ${projectStatusStyle(project.status)}`}>
                        {project.status ?? "Propose"}
                      </span>
                      {latestBoq && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${boqStatusStyle(latestBoq.status)}`}>
                          BOQ: {latestBoq.status}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    ),

    myRoles: (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Role Saya</CardTitle>
            <CardDescription>Ringkasan peran lintas semua proyek</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Memuat...</p>
            ) : Object.keys(myRolesSummary).length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak terlibat sebagai role apapun.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(myRolesSummary).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between p-2.5 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{role}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{count} proyek</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Komposisi Tim</CardTitle>
            <CardDescription>Unique members per role lintas proyek Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: "Estimators",       value: dashData?.team?.estimators      },
                { label: "Project Managers", value: dashData?.team?.projectManagers  },
                { label: "Designers",        value: dashData?.team?.designers        },
                { label: "Finance",          value: dashData?.team?.finances         },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between p-2.5 border rounded-lg">
                  <span className="text-sm">{label}</span>
                  <span className="text-sm font-bold">{loading ? "..." : fmt(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    ),

    boqStatus: boqStatusCard,

    paymentSchedule: (
      <Card>
        <CardHeader>
          <CardTitle>Jadwal Pembayaran</CardTitle>
          <CardDescription>Status termin pembayaran proyek</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {[
              { label: "Draft",    count: terminStatusCounts.draft,    icon: FileText,     cls: "bg-muted",         iconCls: "text-muted-foreground" },
              { label: "Pending",  count: terminStatusCounts.pending,  icon: Clock,        cls: "bg-yellow-500/10", iconCls: "text-yellow-600"       },
              { label: "Sent",     count: terminStatusCounts.sent,     icon: CreditCard,   cls: "bg-blue-500/10",   iconCls: "text-blue-600"         },
              { label: "Approved", count: terminStatusCounts.approved, icon: CheckCircle2, cls: "bg-green-500/10",  iconCls: "text-green-600"        },
            ].map(({ label, count, icon: Icon, cls, iconCls }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${cls} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${iconCls}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{loading ? "..." : fmt(count)}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
          {terminChartData.some((d) => d.count > 0) && (
            <ChartContainer
              config={{ count: { label: "Count", color: "hsl(var(--chart-1))" } }}
              className="h-45 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={terminChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="status" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {terminChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
          {terminChartData.every((d) => d.count === 0) && !loading && (
            <p className="text-center text-sm text-muted-foreground py-4">Belum ada data pembayaran</p>
          )}
        </CardContent>
      </Card>
    ),

    recentDiscussions: (
      <Card>
        <CardHeader>
          <CardTitle>Diskusi Terbaru</CardTitle>
          <CardDescription>Post terkini dari semua proyek Anda</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Memuat diskusi...</p>
          ) : recentPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Belum ada diskusi.</p>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div key={post._id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-primary truncate">{post.projectName}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{relativeTime(post.createdAt)}</span>
                    </div>
                    <p className="text-sm mt-0.5 text-muted-foreground truncate">
                      <span className="font-medium text-foreground">
                        {post.createdBy?.profile?.name ?? post.createdBy?.email ?? "Unknown"}:
                      </span>{" "}
                      {post.content ?? "(lampiran)"}
                    </p>
                    {post.comments?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">{post.comments.length} komentar</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    ),
  }

  // ── render ─────────────────────────────────────────────────────────────────

  const visibleCardIds = layout.cardOrder.filter((id) => {
    if (layout.hiddenCards.includes(id)) return false
    if (isAdmin) return id in adminCards || id in userCards
    return id in userCards
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                <ShieldCheck className="h-3 w-3" />
                Admin
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            Selamat datang, {currentUser?.profile?.name ?? currentUser?.email ?? ""}!
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings2 className="h-4 w-4 mr-2" />
              Kustomisasi
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Layout Dashboard</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {layout.cardOrder
              .filter((id) => cardLabels[id])
              .map((cardId) => (
                <DropdownMenuCheckboxItem
                  key={cardId}
                  checked={!layout.hiddenCards.includes(cardId)}
                  onCheckedChange={() => toggleCardVisibility(cardId)}
                >
                  {cardLabels[cardId]}
                </DropdownMenuCheckboxItem>
              ))}
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <Button variant="ghost" size="sm" onClick={resetLayout} className="w-full justify-start">
                Reset ke Default
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4">
        {visibleCardIds.map((cardId) => {
          const allCards: Record<string, React.JSX.Element> = { ...userCards, ...adminCards }
          const component = isAdmin
            ? allCards[cardId]
            : userCards[cardId as UserCardId]
          return (
            <div
              key={cardId}
              className="relative group"
              draggable
              onDragStart={() => handleDragStart(cardId)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(cardId)}
              onDragEnd={handleDragEnd}
            >
              <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
              {component}
            </div>
          )
        })}
      </div>
    </div>
  )
}
