"use client"

import { useEffect, useState } from "react"
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
import { Building2, FolderKanban, TrendingUp, Users, Settings2, GripVertical, FileText, CreditCard, MessageSquare, Image, Calendar, DollarSign, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { projectsApi } from "@/lib/api/projects"
import { boqApi } from "@/lib/api/boq"
import { terminApi } from "@/lib/api/termin"
import { discussionsApi } from "@/lib/api/discussions"
import { albumsApi } from "@/lib/api/albums"

// Mock data for charts
const projectProgressData = [
  { month: "Jan", completed: 4, ongoing: 8 },
  { month: "Feb", completed: 6, ongoing: 7 },
  { month: "Mar", completed: 5, ongoing: 9 },
  { month: "Apr", completed: 8, ongoing: 6 },
  { month: "May", completed: 7, ongoing: 8 },
  { month: "Jun", completed: 9, ongoing: 5 },
]

const budgetData = [
  { month: "Jan", budget: 45000, spent: 38000 },
  { month: "Feb", budget: 52000, spent: 48000 },
  { month: "Mar", budget: 48000, spent: 42000 },
  { month: "Apr", budget: 61000, spent: 55000 },
  { month: "May", budget: 55000, spent: 51000 },
  { month: "Jun", budget: 67000, spent: 59000 },
]

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalClients: number
}

type DashboardCardId =
  | "stats"
  | "projectProgress"
  | "budgetOverview"
  | "recentProjects"
  | "boqStatus"
  | "paymentSchedule"
  | "discussionActivity"
  | "teamCollaboration"
  | "documentStats"
  | "projectTimeline"

interface DashboardLayout {
  cardOrder: DashboardCardId[]
  hiddenCards: DashboardCardId[]
}

const DEFAULT_LAYOUT: DashboardLayout = {
  cardOrder: [
    "stats",
    "projectProgress",
    "budgetOverview",
    "boqStatus",
    "paymentSchedule",
    "discussionActivity",
    "teamCollaboration",
    "documentStats",
    "projectTimeline",
    "recentProjects",
  ],
  hiddenCards: [],
}

interface EnhancedStats extends DashboardStats {
  totalBOQs: number
  totalTermins: number
  totalDiscussions: number
  totalAlbums: number
  teamMembers: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<EnhancedStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalClients: 0,
    totalBOQs: 0,
    totalTermins: 0,
    totalDiscussions: 0,
    totalAlbums: 0,
    teamMembers: 0,
  })
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const [boqData, setBoqData] = useState<any[]>([])
  const [terminData, setTerminData] = useState<any[]>([])
  const [discussionData, setDiscussionData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT)
  const [draggedCard, setDraggedCard] = useState<DashboardCardId | null>(null)

  useEffect(() => {
    loadDashboardData()
    const savedLayout = localStorage.getItem("dashboard-layout")
    if (savedLayout) {
      try {
        setLayout(JSON.parse(savedLayout))
      } catch (error) {
        console.error("Failed to parse saved layout:", error)
      }
    }
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await projectsApi.getAll()
      if (response.success && response.data) {
        const projects = response.data

        let totalTeamMembers = 0
        projects.forEach((p: any) => {
          totalTeamMembers +=
            (p.estimators?.length || 0) +
            (p.projectManagers?.length || 0) +
            (p.finances?.length || 0) +
            (p.designers?.length || 0) +
            (p.admins?.length || 0)
        })

        let totalBOQs = 0
        let totalTermins = 0
        let totalDiscussions = 0
        let totalAlbums = 0
        const boqStatusData: any[] = []
        const terminStatusData: any[] = []

        for (const project of projects.slice(0, 3)) {
          try {
            const boqResponse = await boqApi.getByProject(project._id)
            if (boqResponse.success) {
              totalBOQs += boqResponse.data.length
              boqResponse.data.forEach((boq: any) => {
                boqStatusData.push(boq)
              })
            }

            const terminResponse = await terminApi.getByProject(project._id)
            if (terminResponse.success) {
              totalTermins += terminResponse.data.length
              terminStatusData.push(...terminResponse.data)
            }

            const discussionResponse = await discussionsApi.getPosts(project._id, 10, 1)
            if (discussionResponse.success) {
              totalDiscussions += discussionResponse.totalData || 0
            }

            const albumResponse = await albumsApi.getByProject(project._id)
            if (albumResponse.success) {
              totalAlbums += albumResponse.data.length
            }
          } catch (error) {
            console.error(`Error loading data for project ${project._id}:`, error)
          }
        }

        setBoqData(boqStatusData)
        setTerminData(terminStatusData)

        setStats({
          totalProjects: projects.length,
          activeProjects: projects.filter((p: any) => p.status === "active").length,
          completedProjects: projects.filter((p: any) => p.status === "completed").length,
          totalClients: new Set(projects.map((p: any) => p.companyClient?.name)).size,
          totalBOQs,
          totalTermins,
          totalDiscussions,
          totalAlbums,
          teamMembers: totalTeamMembers,
        })
        setRecentProjects(projects.slice(0, 5))
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateLayout = (newLayout: DashboardLayout) => {
    setLayout(newLayout)
    localStorage.setItem("dashboard-layout", JSON.stringify(newLayout))
  }

  const toggleCardVisibility = (cardId: DashboardCardId) => {
    const newHiddenCards = layout.hiddenCards.includes(cardId)
      ? layout.hiddenCards.filter((id) => id !== cardId)
      : [...layout.hiddenCards, cardId]
    updateLayout({ ...layout, hiddenCards: newHiddenCards })
  }

  const handleDragStart = (cardId: DashboardCardId) => {
    setDraggedCard(cardId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetCardId: DashboardCardId) => {
    if (!draggedCard || draggedCard === targetCardId) return

    const newOrder = [...layout.cardOrder]
    const draggedIndex = newOrder.indexOf(draggedCard)
    const targetIndex = newOrder.indexOf(targetCardId)

    newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedCard)

    updateLayout({ ...layout, cardOrder: newOrder })
    setDraggedCard(null)
  }

  const handleDragEnd = () => {
    setDraggedCard(null)
  }

  const resetLayout = () => {
    updateLayout(DEFAULT_LAYOUT)
  }

  const safeCalculate = (value: number, fallback: number = 0): number => {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return fallback
    }
    return value
  }

  const teamMembersCount = typeof stats.teamMembers === 'number' && !isNaN(stats.teamMembers) ? stats.teamMembers : 0
  const estimatorsCount = Math.floor(teamMembersCount * 0.3)
  const pmsCount = Math.floor(teamMembersCount * 0.25)
  const designersCount = Math.floor(teamMembersCount * 0.25)
  const financeCount = Math.floor(teamMembersCount * 0.2)

  const statCards = [
    {
      title: "Total Projects",
      value: safeCalculate(stats.totalProjects),
      description: "All time projects",
      icon: FolderKanban,
      trend: "+12% from last month",
    },
    {
      title: "Active Projects",
      value: safeCalculate(stats.activeProjects),
      description: "Currently in progress",
      icon: Building2,
      trend: "+3 new this month",
    },
    {
      title: "Completed",
      value: safeCalculate(stats.completedProjects),
      description: "Successfully finished",
      icon: TrendingUp,
      trend: "+8% completion rate",
    },
    {
      title: "Total Clients",
      value: safeCalculate(stats.totalClients),
      description: "Active clients",
      icon: Users,
      trend: "+2 new clients",
    },
  ]

  const boqStatusChartData = [
    {
      name: "Draft",
      value: boqData.filter((b) => b.status === "draft").length,
      color: "hsl(var(--chart-1))",
    },
    {
      name: "Pending",
      value: boqData.filter((b) => b.status === "pending").length,
      color: "hsl(var(--chart-2))",
    },
    {
      name: "Approved",
      value: boqData.filter((b) => b.status === "approved").length,
      color: "hsl(var(--chart-3))",
    },
    {
      name: "Rejected",
      value: boqData.filter((b) => b.status === "rejected").length,
      color: "hsl(var(--chart-4))",
    },
  ]

  const paymentStatusData = [
    {
      status: "Draft",
      count: terminData.filter((t) => t.status === "Draft").length,
      color: "hsl(var(--chart-1))",
    },
    {
      status: "Pending",
      count: terminData.filter((t) => t.status === "Pending").length,
      color: "hsl(var(--chart-2))",
    },
    {
      status: "Sent",
      count: terminData.filter((t) => t.status === "Sent").length,
      color: "hsl(var(--chart-3))",
    },
    {
      status: "Approved",
      count: terminData.filter((t) => t.status === "Approved").length,
      color: "hsl(var(--chart-4))",
    },
  ]

  const cardComponents: Record<DashboardCardId, JSX.Element> = {
    stats: (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                <p className="text-xs text-primary mt-1">{stat.trend}</p>
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
          <CardDescription>Completed vs Ongoing projects over time</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <ChartContainer
            config={{
              completed: {
                label: "Completed",
                color: "hsl(142, 76%, 36%)",
              },
              ongoing: {
                label: "Ongoing",
                color: "hsl(221, 83%, 53%)",
              },
            }}
            className="h-[250px] sm:h-[300px] w-full"
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
        </CardContent>
      </Card>
    ),
    budgetOverview: (
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>Budget allocation vs actual spending</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <ChartContainer
            config={{
              budget: {
                label: "Budget",
                color: "hsl(262, 83%, 58%)",
              },
              spent: {
                label: "Spent",
                color: "hsl(346, 77%, 50%)",
              },
            }}
            className="h-[250px] sm:h-[300px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={budgetData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} iconType="circle" />
                <Line
                  type="monotone"
                  dataKey="budget"
                  stroke="hsl(262, 83%, 58%)"
                  strokeWidth={3}
                  dot={{ fill: "hsl(262, 83%, 58%)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="spent"
                  stroke="hsl(346, 77%, 50%)"
                  strokeWidth={3}
                  dot={{ fill: "hsl(346, 77%, 50%)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    ),
    boqStatus: (
      <Card>
        <CardHeader>
          <CardTitle>BOQ Status Overview</CardTitle>
          <CardDescription>Distribution of Bill of Quantities by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalBOQs}</p>
                <p className="text-xs text-muted-foreground">Total BOQs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{boqData.filter((b) => b.status === "pending").length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{boqData.filter((b) => b.status === "approved").length}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{boqData.filter((b) => b.status === "rejected").length}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </div>
          {boqStatusChartData.some((d) => d.value > 0) && (
            <ChartContainer
              config={{
                draft: { label: "Draft", color: "hsl(var(--chart-1))" },
                pending: { label: "Pending", color: "hsl(var(--chart-2))" },
                approved: { label: "Approved", color: "hsl(var(--chart-3))" },
                rejected: { label: "Rejected", color: "hsl(var(--chart-4))" },
              }}
              className="h-[200px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={boqStatusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {boqStatusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    ),
    paymentSchedule: (
      <Card>
        <CardHeader>
          <CardTitle>Payment Schedule</CardTitle>
          <CardDescription>Termin payment status tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalTermins}</p>
                <p className="text-xs text-muted-foreground">Total Terms</p>
              </div>
            </div>
            {paymentStatusData.map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: `${item.color}20` }}>
                  <div className="h-full w-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5" style={{ color: item.color }} />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-xs text-muted-foreground">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
          {paymentStatusData.some((d) => d.count > 0) && (
            <ChartContainer
              config={{
                count: { label: "Count", color: "hsl(var(--chart-1))" },
              }}
              className="h-[200px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="status" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    ),
    discussionActivity: (
      <Card>
        <CardHeader>
          <CardTitle>Discussion Activity</CardTitle>
          <CardDescription>Team communication and engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.totalDiscussions}</p>
                <p className="text-sm text-muted-foreground">Total Posts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{teamMembersCount}</p>
                <p className="text-sm text-muted-foreground">Active Members</p>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Engagement Rate</span>
              <span className="text-sm font-medium">78%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: "78%" }} />
            </div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </div>
        </CardContent>
      </Card>
    ),
    teamCollaboration: (
      <Card>
        <CardHeader>
          <CardTitle>Team Collaboration</CardTitle>
          <CardDescription>Member distribution and roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium">Total Team Members</span>
              </div>
              <span className="text-lg font-bold">{teamMembersCount}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Estimators</p>
                <p className="text-2xl font-bold">{estimatorsCount}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Project Managers</p>
                <p className="text-2xl font-bold">{pmsCount}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Designers</p>
                <p className="text-2xl font-bold">{designersCount}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Finance</p>
                <p className="text-2xl font-bold">{financeCount}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    documentStats: (
      <Card>
        <CardHeader>
          <CardTitle>Media & Documents</CardTitle>
          <CardDescription>File organization overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Image className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.totalAlbums}</p>
                <p className="text-sm text-muted-foreground">Photo Albums</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.totalBOQs}</p>
                <p className="text-sm text-muted-foreground">BOQ Documents</p>
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Storage Usage</span>
              <span className="text-sm font-medium">67%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded-full" style={{ width: "67%" }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">2.3GB of 5GB used</p>
          </div>
        </CardContent>
      </Card>
    ),
    projectTimeline: (
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>Upcoming milestones and deadlines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">BOQ Review Meeting</p>
                <p className="text-xs text-muted-foreground">Tomorrow, 10:00 AM</p>
              </div>
              <span className="text-xs bg-yellow-500/10 text-yellow-700 px-2 py-1 rounded">Upcoming</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Project Alpha Delivery</p>
                <p className="text-xs text-muted-foreground">Completed 2 days ago</p>
              </div>
              <span className="text-xs bg-green-500/10 text-green-700 px-2 py-1 rounded">Done</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Client Presentation</p>
                <p className="text-xs text-muted-foreground">Next week, Friday</p>
              </div>
              <span className="text-xs bg-blue-500/10 text-blue-700 px-2 py-1 rounded">Scheduled</span>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    recentProjects: (
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your most recently updated projects</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading projects...</p>
          ) : recentProjects.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No projects yet. Create your first project!</p>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => (window.location.href = `/projects/${project._id}`)}
                >
                  <div className="space-y-1">
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.companyClient?.name}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div
                      className={`text-sm font-medium px-2 py-1 rounded ${
                        project.status === "completed"
                          ? "bg-green-500/10 text-green-700"
                          : project.status === "active"
                            ? "bg-blue-500/10 text-blue-700"
                            : "bg-yellow-500/10 text-yellow-700"
                      }`}
                    >
                      {project.status || "draft"}
                    </div>
                    <p className="text-xs text-muted-foreground">{project.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    ),
  }

  const cardLabels: Record<DashboardCardId, string> = {
    stats: "Statistics Cards",
    projectProgress: "Project Progress Chart",
    budgetOverview: "Budget Overview Chart",
    recentProjects: "Recent Projects List",
    boqStatus: "BOQ Status Overview",
    paymentSchedule: "Payment Schedule",
    discussionActivity: "Discussion Activity",
    teamCollaboration: "Team Collaboration",
    documentStats: "Media & Documents",
    projectTimeline: "Project Timeline",
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your projects.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings2 className="h-4 w-4 mr-2" />
              Customize
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Dashboard Layout</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {layout.cardOrder.map((cardId) => (
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
                Reset to Default
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4">
        {layout.cardOrder
          .filter((cardId) => !layout.hiddenCards.includes(cardId))
          .map((cardId, index) => {
            const isChartsRow =
              (cardId === "projectProgress" || cardId === "budgetOverview") &&
              !layout.hiddenCards.includes("projectProgress") &&
              !layout.hiddenCards.includes("budgetOverview")

            if (cardId === "projectProgress" && isChartsRow) {
              return (
                <div
                  key="charts-row"
                  className="grid gap-4 grid-cols-1 lg:grid-cols-2 relative group"
                  draggable
                  onDragStart={() => handleDragStart("projectProgress")}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop("projectProgress")}
                  onDragEnd={handleDragEnd}
                >
                  <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {cardComponents.projectProgress}
                  {cardComponents.budgetOverview}
                </div>
              )
            }

            if (cardId === "budgetOverview" && isChartsRow) {
              return null
            }

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
                {cardComponents[cardId]}
              </div>
            )
          })}
      </div>
    </div>
  )
}
