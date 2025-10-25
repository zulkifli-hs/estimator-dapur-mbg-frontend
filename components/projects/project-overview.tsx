"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Calendar, User, Ruler, Layers } from "lucide-react"

interface ProjectOverviewProps {
  project: any
  onUpdate: () => void
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const totalTeamMembers =
    (project.estimators?.length || 0) +
    (project.projectManagers?.length || 0) +
    (project.finances?.length || 0) +
    (project.designers?.length || 0) +
    (project.admins?.length || 0)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <Badge variant="secondary">{project.type}</Badge>
          </div>

          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Client Company</p>
              <p className="text-sm text-muted-foreground">{project.companyClient?.name || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Building</p>
              <p className="text-sm text-muted-foreground">{project.building || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Ruler className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Area & Floor</p>
              <p className="text-sm text-muted-foreground">
                {project.area} m² • Floor {project.floor}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Layers className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Owner Company</p>
              <p className="text-sm text-muted-foreground">{project.companyOwner?.name || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Created</p>
              <p className="text-sm text-muted-foreground">
                {new Date(project.createdAt).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team & Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Team Members</span>
            <span className="text-2xl font-bold">{totalTeamMembers}</span>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimators</span>
              <span className="font-medium">{project.estimators?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Project Managers</span>
              <span className="font-medium">{project.projectManagers?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Finances</span>
              <span className="font-medium">{project.finances?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Designers</span>
              <span className="font-medium">{project.designers?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Clients</span>
              <span className="font-medium">{project.clients?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Admins</span>
              <span className="font-medium">{project.admins?.length || 0}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Layout Document</span>
              <span className="font-medium">{project.detail?.layout ? "✓" : "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Contract Document</span>
              <span className="font-medium">{project.detail?.contract ? "✓" : "—"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
