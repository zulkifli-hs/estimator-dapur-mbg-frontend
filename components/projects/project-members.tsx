"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Phone } from "lucide-react"

interface ProjectMembersProps {
  project: any
  onUpdate: () => void
}

export function ProjectMembers({ project, onUpdate }: ProjectMembersProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const renderMemberList = (members: any[], role: string) => {
    if (!members || members.length === 0) {
      return <p className="text-sm text-muted-foreground py-4">No {role.toLowerCase()} assigned</p>
    }

    return (
      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member._id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={member.user?.profile?.photo || "/placeholder.svg"} />
                <AvatarFallback>{getInitials(member.user?.profile?.name || "U")}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{member.user?.profile?.name || "Unknown"}</p>
                <p className="text-sm text-muted-foreground">{member.user?.email}</p>
              </div>
            </div>
            <Badge variant={member.status === "Accepted" ? "default" : "secondary"}>{member.status}</Badge>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Owner</CardTitle>
              <CardDescription>Project creator and main owner</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {project.owner && (
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={project.owner.profile?.photo || "/placeholder.svg"} />
                <AvatarFallback>{getInitials(project.owner.profile?.name || "O")}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{project.owner.profile?.name}</p>
                <p className="text-sm text-muted-foreground">{project.owner.email}</p>
                {project.owner.profile?.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3" />
                    {project.owner.profile.phone}
                  </p>
                )}
              </div>
              <Badge>Owner</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Estimators</CardTitle>
              <Button size="sm" variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>{renderMemberList(project.estimators, "Estimators")}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Project Managers</CardTitle>
              <Button size="sm" variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>{renderMemberList(project.projectManagers, "Project Managers")}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Finance Team</CardTitle>
              <Button size="sm" variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>{renderMemberList(project.finances, "Finance Team")}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Designers</CardTitle>
              <Button size="sm" variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>{renderMemberList(project.designers, "Designers")}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Clients</CardTitle>
              <Button size="sm" variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>{renderMemberList(project.clients, "Clients")}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Admins</CardTitle>
              <Button size="sm" variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>{renderMemberList(project.admins, "Admins")}</CardContent>
        </Card>
      </div>
    </div>
  )
}
