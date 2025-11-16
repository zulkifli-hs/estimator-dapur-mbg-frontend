"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Phone, X, Plus, Search, Check, Trash2 } from 'lucide-react'
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
            <div className="flex items-center gap-2">
              <Badge variant={member.status === "Accepted" ? "default" : "secondary"}>{member.status}</Badge>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setRemoveMemberDialog({
                    open: true,
                    memberId: member._id,
                    memberName: member.user?.profile?.name || member.user?.email || "Unknown",
                    role: role,
                  })
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
              <Button size="sm" variant="outline" onClick={() => handleOpenInvite("estimators")}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>{renderMemberList(project.estimators, "estimators")}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Project Managers</CardTitle>
              <Button size="sm" variant="outline" onClick={() => handleOpenInvite("projectManagers")}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>{renderMemberList(project.projectManagers, "projectManagers")}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Finance Team</CardTitle>
              <Button size="sm" variant="outline" onClick={() => handleOpenInvite("finances")}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>{renderMemberList(project.finances, "finances")}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Designers</CardTitle>
              <Button size="sm" variant="outline" onClick={() => handleOpenInvite("designers")}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>{renderMemberList(project.designers, "designers")}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Clients</CardTitle>
              <Button size="sm" variant="outline" onClick={() => handleOpenInvite("clients")}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>{renderMemberList(project.clients, "clients")}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Admins</CardTitle>
              <Button size="sm" variant="outline" onClick={() => handleOpenInvite("admins")}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>{renderMemberList(project.admins, "admins")}</CardContent>
        </Card>
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
