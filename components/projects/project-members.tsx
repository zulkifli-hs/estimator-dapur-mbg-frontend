"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Phone, X, Plus, Search, Check, Trash2, Users, Building2, Crown } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { projectsApi } from "@/lib/api/projects"
import { usersApi, type User } from "@/lib/api/users"
import { useToast } from "@/hooks/use-toast"
import { useRef, useState, useEffect } from "react"

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
      return (
        <div className="text-center py-8">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No {role.toLowerCase()} assigned yet</p>
        </div>
      )
    }

    const isClientRole = role === "clients"

    return (
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member._id}
            className="group flex items-center justify-between p-3 border rounded-lg hover:shadow-sm hover:border-primary/20 transition-all"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 ring-2 ring-background">
                <AvatarImage src={member.user?.profile?.photo || "/placeholder.svg"} />
                <AvatarFallback className="text-xs">{getInitials(member.user?.profile?.name || "U")}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{member.user?.profile?.name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground truncate">{member.user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Badge 
                variant={member.status === "Accepted" ? "default" : "secondary"}
                className="text-xs"
              >
                {member.status}
              </Badge>
              {!isClientRole && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setRemoveMemberDialog({
                      open: true,
                      memberId: member._id,
                      memberName: member.user?.profile?.name || member.user?.email || "Unknown",
                      role: role,
                    })
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // State for invite dialog
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [removeMemberDialog, setRemoveMemberDialog] = useState<{
    open: boolean
    memberId: string
    memberName: string
    role: string
  }>({ open: false, memberId: "", memberName: "", role: "" })
  const [isRemoving, setIsRemoving] = useState(false)
  const { toast } = useToast()

  // Handler to open invite dialog with specific role
  const handleOpenInvite = (role: string) => {
    setSelectedRole(role)
    setInviteDialogOpen(true)
  }

  // Handler for successful invite
  const handleInviteSuccess = () => {
    setInviteDialogOpen(false)
    onUpdate()
  }

  // Handler for remove member
  const handleRemoveMember = async () => {
    console.log('[v0] Remove member request:', {
      projectId: project._id,
      memberId: removeMemberDialog.memberId,
      role: removeMemberDialog.role,
    })
    
    setIsRemoving(true)
    try {
      const result = await projectsApi.removeMember(
        project._id,
        [removeMemberDialog.memberId],
        removeMemberDialog.role
      )
      if (result.success) {
        toast({
          title: "Member removed",
          description: `${removeMemberDialog.memberName} has been removed from the project.`,
        })
        setRemoveMemberDialog({ open: false, memberId: "", memberName: "", role: "" })
        onUpdate()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to remove member",
        variant: "destructive",
      })
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Project Owner</CardTitle>
                <CardDescription className="text-xs">Project creator and main owner</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {project.owner && (
              <div className="flex items-center gap-4 p-4 border-2 border-primary/20 rounded-lg bg-gradient-to-br from-primary/5 to-background">
                <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                  <AvatarImage src={project.owner.profile?.photo || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(project.owner.profile?.name || "O")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{project.owner.profile?.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{project.owner.email}</p>
                  {project.owner.profile?.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />
                      {project.owner.profile.phone}
                    </p>
                  )}
                </div>
                <Badge className="bg-primary">Owner</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Client</CardTitle>
                <CardDescription className="text-xs">Set during project creation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {project.clients && project.clients.length > 0 ? (
              <div className="flex items-center gap-4 p-4 border-2 border-blue-500/20 rounded-lg bg-gradient-to-br from-blue-500/5 to-background">
                <Avatar className="h-14 w-14 ring-2 ring-blue-500/20">
                  <AvatarImage src={project.clients[0].user?.profile?.photo || "/placeholder.svg"} />
                  <AvatarFallback className="bg-blue-500/10 text-blue-600 font-semibold">
                    {getInitials(project.clients[0].user?.profile?.name || "C")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{project.clients[0].user?.profile?.name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground truncate">{project.clients[0].user?.email}</p>
                  {project.clients[0].user?.profile?.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />
                      {project.clients[0].user.profile.phone}
                    </p>
                  )}
                </div>
                <Badge className="bg-blue-600">Client</Badge>
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No client assigned</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Team Members</h3>
          <p className="text-sm text-muted-foreground">Manage project team roles and permissions</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-500/10 rounded">
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                  <CardTitle className="text-base">Estimators</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleOpenInvite("estimators")} className="h-8">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>
              <CardDescription className="text-xs">Cost estimation team</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">{renderMemberList(project.estimators, "estimators")}</CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-500/10 rounded">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <CardTitle className="text-base">Project Managers</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleOpenInvite("projectManagers")} className="h-8">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>
              <CardDescription className="text-xs">Project oversight team</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">{renderMemberList(project.projectManagers, "projectManagers")}</CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-500/10 rounded">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <CardTitle className="text-base">Finance Team</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleOpenInvite("finances")} className="h-8">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>
              <CardDescription className="text-xs">Financial management</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">{renderMemberList(project.finances, "finances")}</CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-pink-500/10 rounded">
                    <Users className="h-4 w-4 text-pink-600" />
                  </div>
                  <CardTitle className="text-base">Designers</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleOpenInvite("designers")} className="h-8">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>
              <CardDescription className="text-xs">Design and creative team</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">{renderMemberList(project.designers, "designers")}</CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-500/10 rounded">
                    <Users className="h-4 w-4 text-red-600" />
                  </div>
                  <CardTitle className="text-base">Admins</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleOpenInvite("admins")} className="h-8">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>
              <CardDescription className="text-xs">System administrators</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">{renderMemberList(project.admins, "admins")}</CardContent>
          </Card>
        </div>
      </div>

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        projectId={project._id}
        role={selectedRole}
        onSuccess={handleInviteSuccess}
      />

      <AlertDialog open={removeMemberDialog.open} onOpenChange={(open) => {
        if (!isRemoving) {
          setRemoveMemberDialog({ ...removeMemberDialog, open })
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-semibold">{removeMemberDialog.memberName}</span> from this project?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleRemoveMember()
              }}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  role: string
  onSuccess: () => void
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function InviteMemberDialog({ open, onOpenChange, projectId, role, onSuccess }: InviteMemberDialogProps) {
  const [emails, setEmails] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (inputValue.trim().length > 0) {
      setLoading(true)
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await usersApi.search(inputValue.trim())
        setUsers(results)
        setLoading(false)
      }, 500)
    } else {
      setUsers([])
      setLoading(false)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [inputValue])

  const handleSelectUser = (user: User) => {
    const email = user.email
    
    if (emails.includes(email)) {
      setError("This email has already been added")
      return
    }

    setEmails([...emails, email])
    setInputValue("")
    setUsers([])
    setError("")
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleAddManual = () => {
    const trimmedEmail = inputValue.trim()

    if (!trimmedEmail) {
      setError("Email cannot be empty")
      return
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address")
      return
    }

    if (emails.includes(trimmedEmail)) {
      setError("This email has already been added")
      return
    }

    setEmails([...emails, trimmedEmail])
    setInputValue("")
    setUsers([])
    setError("")
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddManual()
    }
  }

  const handleRemove = (email: string) => {
    setEmails(emails.filter((e) => e !== email))
  }

  const getImageUrl = (url: string) => {
    if (url.startsWith("http")) return url
    if (url.startsWith("images/")) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL}/${url}`
    }
    return url
  }

  const handleSubmit = async () => {
    if (emails.length === 0) {
      setError("Please add at least one email")
      return
    }

    setSubmitting(true)
    try {
      const result = await projectsApi.inviteMember(projectId, emails, role)
      if (result.success) {
        toast({
          title: "Invitations sent",
          description: `Successfully invited ${emails.length} member${emails.length > 1 ? 's' : ''} to the project.`,
        })
        setEmails([])
        setInputValue("")
        onSuccess()
      } else {
        setError("Failed to send invitations")
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  const showDropdown = inputValue.trim().length > 0 && (loading || users.length > 0 || isValidEmail(inputValue.trim()))

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      estimators: "Estimators",
      projectManagers: "Project Managers",
      finances: "Finance Team",
      designers: "Designers",
      clients: "Clients",
      admins: "Admins"
    }
    return roleMap[role] || role
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Add members to the project as {getRoleLabel(role)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Team Members</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    setError("")
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Search by name or email..."
                  disabled={submitting}
                  className={error ? "border-destructive" : ""}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                
                {showDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[300px] overflow-auto">
                    {loading ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">Searching...</div>
                    ) : users.length > 0 ? (
                      <div className="p-1">
                        {users.map((user) => (
                          <div
                            key={user._id}
                            onClick={() => handleSelectUser(user)}
                            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent rounded-sm"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={getImageUrl(user.profile.photo.url) || "/placeholder.svg"} alt={user.profile.name} />
                              <AvatarFallback>{user.profile.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{user.profile.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            {emails.includes(user.email) && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 space-y-3">
                        <p className="text-sm text-muted-foreground text-center">No users found</p>
                        {isValidEmail(inputValue.trim()) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={handleAddManual}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add "{inputValue.trim()}"
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Button type="button" onClick={handleAddManual} disabled={submitting} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-md bg-muted/50">
                {emails.map((email) => (
                  <Badge key={email} variant="secondary" className="pl-3 pr-1 py-1">
                    {email}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 hover:bg-transparent"
                      onClick={() => handleRemove(email)}
                      disabled={submitting}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || emails.length === 0}>
              {submitting ? "Sending..." : `Invite ${emails.length} Member${emails.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
