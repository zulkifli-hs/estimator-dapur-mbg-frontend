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
import { Building2, FolderKanban, TrendingUp, Users, Settings2, GripVertical } from 'lucide-react'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { projectsApi } from "@/lib/api/projects"

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

type DashboardCardId = "stats" | "projectProgress" | "budgetOverview" | "recentProjects"

interface DashboardLayout {
  cardOrder: DashboardCardId[]
  hiddenCards: DashboardCardId[]
}

const DEFAULT_LAYOUT: DashboardLayout = {
  cardOrder: ["stats", "projectProgress", "budgetOverview", "recentProjects"],
  hiddenCards: [],
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalClients: 0,
  })
  const [recentProjects, setRecentProjects] = useState<any[]>([])
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
        setStats({
          totalProjects: projects.length,
          activeProjects: projects.filter((p: any) => p.status === "active").length,
          completedProjects: projects.filter((p: any) => p.status === "completed").length,
          totalClients: new Set(projects.map((p: any) => p.client_name)).size,
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

  const statCards = [
    {
      title: "Total Projects",
      value: stats.totalProjects,
      description: "All time projects",
      icon: FolderKanban,
      trend: "+12% from last month",
    },
    {
      title: "Active Projects",
      value: stats.activeProjects,
      description: "Currently in progress",
      icon: Building2,
      trend: "+3 new this month",
    },
    {
      title: "Completed",
      value: stats.completedProjects,
      description: "Successfully finished",
      icon: TrendingUp,
      trend: "+8% completion rate",
    },
    {
      title: "Total Clients",
      value: stats.totalClients,
      description: "Active clients",
      icon: Users,
      trend: "+2 new clients",
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
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.client_name}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div
                      className={`text-sm font-medium ${
                        project.status === "completed"
                          ? "text-green-600"
                          : project.status === "active"
                            ? "text-blue-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {project.status}
                    </div>
                    <p className="text-xs text-muted-foreground">{project.location}</p>
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
            const isChartsRow = (cardId === "projectProgress" || cardId === "budgetOverview") && 
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
