"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, FolderKanban, TrendingUp, Users } from "lucide-react"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalClients: 0,
  })
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your projects.</p>
      </div>

      {/* Stats Cards */}
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

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Completed vs Ongoing projects over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                completed: {
                  label: "Completed",
                  color: "hsl(var(--primary))",
                },
                ongoing: {
                  label: "Ongoing",
                  color: "hsl(var(--accent))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectProgressData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ongoing" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
            <CardDescription>Budget allocation vs actual spending</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                budget: {
                  label: "Budget",
                  color: "hsl(var(--primary))",
                },
                spent: {
                  label: "Spent",
                  color: "hsl(var(--accent))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="budget"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="spent"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--accent))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
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
    </div>
  )
}
