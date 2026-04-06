"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { projectsApi } from "@/lib/api/projects"
import { usersApi, type User } from "@/lib/api/users"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, Plus, Search, Check, ChevronDown, ChevronUp, Users, Building2, UserCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { toast } from "sonner"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editProject?: any
}

interface TeamMemberInputProps {
  label: string
  emails: string[]
  onAdd: (email: string) => void
  onRemove: (email: string) => void
  disabled?: boolean
}

function TeamMemberInput({ label, emails, onAdd, onRemove, disabled }: TeamMemberInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

    onAdd(email)
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

    onAdd(trimmedEmail)
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

  const getImageUrl = (url: string) => {
    if (url.startsWith("http")) return url
    if (url.startsWith("images/")) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL}/${url}`
    }
    return url
  }

  const showDropdown = inputValue.trim().length > 0 && (loading || users.length > 0 || isValidEmail(inputValue.trim()))

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
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
            disabled={disabled}
            className={error ? "border-destructive" : ""}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

          {showDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-75 overflow-auto">
              {loading ? (
                <div className="p-4 text-sm text-muted-foreground text-center">Searching...</div>
              ) : users.length > 0 ? (
                <div className="p-1">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleSelectUser(user)}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-primary/50 rounded-sm"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={getImageUrl(user.profile?.photo?.url ?? "") || "/placeholder.svg"}
                          alt={user.profile?.name ?? ""}
                        />
                        <AvatarFallback>{(user.profile?.name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{user.profile?.name ?? user.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      {emails.includes(user.email) && <Check className="h-4 w-4 text-primary" />}
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
                      className="w-full bg-transparent"
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
        <Button type="button" onClick={handleAddManual} disabled={disabled} size="icon" variant="outline">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {emails.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {emails.map((email) => (
            <Badge key={email} variant="secondary" className="pl-3 pr-1 py-1">
              {email}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 hover:bg-transparent"
                onClick={() => onRemove(email)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function CreateProjectDialog({ open, onOpenChange, onSuccess, editProject }: CreateProjectDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const errorRef = useRef<HTMLDivElement>(null)

  const [showClientCompany, setShowClientCompany] = useState(false)
  const [showClientPIC, setShowClientPIC] = useState(false)
  const [showTeamMembers, setShowTeamMembers] = useState(false)
  const [teamSectionOpen, setTeamSectionOpen] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    type: "Renovation",
    area: 0,
    building: "",
    floor: 0,
    companyClient: {
      name: "",
      contact: { phone: "", email: "", website: "" },
      type: "",
      picEmail: "",
      picName: "",
      picPhone: "",
    },
    companyOwner: {
      name: "",
      code: "",
    },
    estimators: [] as string[],
    projectManagers: [] as string[],
    finances: [] as string[],
    designers: [] as string[],
    admins: [] as string[],
  })

  useEffect(() => {
    if (editProject && open) {
      const hasClientCompany = editProject.companyClient && Object.keys(editProject.companyClient).length > 0
      const hasClientPIC =
        editProject.companyClient?.picEmail || editProject.companyClient?.picName || editProject.companyClient?.picPhone
      const hasTeamMembers =
        editProject.estimators?.length > 0 ||
        editProject.projectManagers?.length > 0 ||
        editProject.finances?.length > 0 ||
        editProject.designers?.length > 0 ||
        editProject.admins?.length > 0

      setShowClientCompany(hasClientCompany)
      setShowClientPIC(hasClientPIC)
      setShowTeamMembers(hasTeamMembers)

      setFormData({
        name: editProject.name || "",
        type: editProject.type || "Renovation",
        area: editProject.area || 0,
        building: editProject.building || "",
        floor: editProject.floor || 0,
        companyClient: {
          name: editProject.companyClient?.name || "",
          contact: {
            phone: editProject.companyClient?.contact?.phone || "",
            email: editProject.companyClient?.contact?.email || "",
            website: editProject.companyClient?.contact?.website || "",
          },
          type: editProject.companyClient?.type || "",
          picEmail: editProject.companyClient?.picEmail || "",
          picName: editProject.companyClient?.picName || "",
          picPhone: editProject.companyClient?.picPhone || "",
        },
        companyOwner: {
          name: editProject.companyOwner?.name || "",
          code: editProject.companyOwner?.code || "",
        },
        estimators: editProject.estimators?.map((e: any) => e.user?.email).filter(Boolean) || [],
        projectManagers: editProject.projectManagers?.map((e: any) => e.user?.email).filter(Boolean) || [],
        finances: editProject.finances?.map((e: any) => e.user?.email).filter(Boolean) || [],
        designers: editProject.designers?.map((e: any) => e.user?.email).filter(Boolean) || [],
        admins: editProject.admins?.map((e: any) => e.user?.email).filter(Boolean) || [],
      })
    } else if (!open) {
      // Reset form when dialog closes
      setFormData({
        name: "",
        type: "Renovation",
        area: 0,
        building: "",
        floor: 0,
        companyClient: {
          name: "",
          contact: { phone: "", email: "", website: "" },
          type: "",
          picEmail: "",
          picName: "",
          picPhone: "",
        },
        companyOwner: {
          name: "",
          code: "",
        },
        estimators: [],
        projectManagers: [],
        finances: [],
        designers: [],
        admins: [],
      })
      setShowClientCompany(false)
      setShowClientPIC(false)
      setShowTeamMembers(false)
      setError("")
    }
  }, [editProject, open])

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [error])

  const handleChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child, subchild] = field.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          ...(subchild
            ? {
                [child]: {
                  ...((prev[parent as keyof typeof prev] as any)[child] || {}),
                  [subchild]: value,
                },
              }
            : { [child]: value }),
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleAddEmail = (field: string, email: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field as keyof typeof prev] as string[]), email],
    }))
  }

  const handleRemoveEmail = (field: string, email: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((e) => e !== email),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const requestBody: any = {
        name: formData.name,
        type: formData.type,
        area: formData.area,
        building: formData.building,
        floor: formData.floor,
        companyOwner: {
          name: formData.companyOwner.name,
          code: formData.companyOwner.code,
        },
        estimators: formData.estimators,
        projectManagers: formData.projectManagers,
        finances: formData.finances,
        designers: formData.designers,
        admins: formData.admins,
      }

      if (showClientCompany) {
        const companyClientData: any = {}

        if (formData.companyClient.name) companyClientData.name = formData.companyClient.name
        if (formData.companyClient.type) companyClientData.type = formData.companyClient.type

        if (
          formData.companyClient.contact.phone ||
          formData.companyClient.contact.email ||
          formData.companyClient.contact.website
        ) {
          companyClientData.contact = {}
          if (formData.companyClient.contact.phone)
            companyClientData.contact.phone = formData.companyClient.contact.phone
          if (formData.companyClient.contact.email)
            companyClientData.contact.email = formData.companyClient.contact.email
          if (formData.companyClient.contact.website)
            companyClientData.contact.website = formData.companyClient.contact.website
        }

        if (showClientPIC) {
          // if (!formData.companyClient.picEmail) {
          //   setError("PIC Email is required when adding a Person in Charge")
          //   setLoading(false)
          //   return
          // }
          // companyClientData.picEmail = formData.companyClient.picEmail
          if (formData.companyClient.picEmail) companyClientData.picEmail = formData.companyClient.picEmail
          if (formData.companyClient.picName) companyClientData.picName = formData.companyClient.picName
          if (formData.companyClient.picPhone) companyClientData.picPhone = formData.companyClient.picPhone
        }

        requestBody.companyClient = companyClientData
      } else {
        requestBody.companyClient = {}
      }

      let response
      if (editProject) {
        delete requestBody.estimators
        delete requestBody.projectManagers
        delete requestBody.finances
        delete requestBody.designers
        delete requestBody.admins

        response = await projectsApi.update(editProject._id, requestBody)
        if (response.success) {
          toast.success("Project updated successfully")
        }
      } else {
        response = await projectsApi.create(requestBody)
        if (response.success) {
          toast.success("Project created successfully")
        }
      }

      if (response.success) {
        setFormData({
          name: "",
          type: "Renovation",
          area: 0,
          building: "",
          floor: 0,
          companyClient: {
            name: "",
            contact: { phone: "", email: "", website: "" },
            type: "",
            picEmail: "",
            picName: "",
            picPhone: "",
          },
          companyOwner: {
            name: "",
            code: "",
          },
          estimators: [],
          projectManagers: [],
          finances: [],
          designers: [],
          admins: [],
        })
        setShowClientCompany(false)
        setShowClientPIC(false)
        setShowTeamMembers(false)
        onSuccess()
        onOpenChange(false)
      } else {
        setError(`Failed to ${editProject ? "update" : "create"} project`)
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{editProject ? "Edit Project" : "Create New Project"}</DialogTitle>
          <DialogDescription>
            {editProject ? "Update the project details" : "Add a new construction project with complete details"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div ref={errorRef} className="sticky top-0 z-10 animate-in slide-in-from-top-2">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Project Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Project Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Modern Office Interior"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Project Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleChange("type", value)} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Renovation">Renovation</SelectItem>
                    <SelectItem value="Fitout from bare design and build">Fitout from bare design and build</SelectItem>
                    <SelectItem value="Moving">Moving</SelectItem>
                    <SelectItem value="Reinstatement">Reinstatement</SelectItem>
                    <SelectItem value="Build only">Build only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="building">Building Name *</Label>
                <Input
                  id="building"
                  value={formData.building}
                  onChange={(e) => handleChange("building", e.target.value)}
                  placeholder="BCA Tower"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor">Floor *</Label>
                <Input
                  id="floor"
                  type="number"
                  value={formData.floor || ""}
                  onChange={(e) => handleChange("floor", Number.parseInt(e.target.value) || 0)}
                  placeholder="5"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Area (m²) *</Label>
                <Input
                  id="area"
                  type="number"
                  value={formData.area || ""}
                  onChange={(e) => handleChange("area", Number.parseInt(e.target.value) || 0)}
                  placeholder="500"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Owner Company Info - Required */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Owner Company *</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyOwner.name">Company Name *</Label>
                <Input
                  id="companyOwner.name"
                  value={formData.companyOwner.name}
                  onChange={(e) => handleChange("companyOwner.name", e.target.value)}
                  placeholder="PT Bank Central Asia Tbk"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyOwner.code">Company Code *</Label>
                <Input
                  id="companyOwner.code"
                  value={formData.companyOwner.code}
                  onChange={(e) => handleChange("companyOwner.code", e.target.value)}
                  placeholder="BCA"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">Client Company</h3>
                  <p className="text-sm text-muted-foreground">Add client company information (optional)</p>
                </div>
              </div>
              <Switch checked={showClientCompany} onCheckedChange={setShowClientCompany} disabled={loading} />
            </div>

            {showClientCompany && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyClient.name">Company Name</Label>
                    <Input
                      id="companyClient.name"
                      value={formData.companyClient.name}
                      onChange={(e) => handleChange("companyClient.name", e.target.value)}
                      placeholder="PT Bank Central Asia Tbk"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyClient.type">Industry Type</Label>
                    <Select
                      value={formData.companyClient.type}
                      onValueChange={(value) => handleChange("companyClient.type", value)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Government">Government</SelectItem>
                        <SelectItem value="Logistic/Transportation">Logistic/Transportation</SelectItem>
                        <SelectItem value="Media/Technologies">Media/Technologies</SelectItem>
                        <SelectItem value="Consulting/Financial Institution">
                          Consulting/Financial Institution
                        </SelectItem>
                        <SelectItem value="Real Estate/Property">Real Estate/Property</SelectItem>
                        <SelectItem value="Industrial/Manufacturing">Industrial/Manufacturing</SelectItem>
                        <SelectItem value="Commodities">Commodities</SelectItem>
                        <SelectItem value="Coworking">Coworking</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyClient.contact.email">Company Email</Label>
                    <Input
                      id="companyClient.contact.email"
                      type="email"
                      value={formData.companyClient.contact.email}
                      onChange={(e) => handleChange("companyClient.contact.email", e.target.value)}
                      placeholder="info@company.com"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyClient.contact.phone">Company Phone</Label>
                    <Input
                      id="companyClient.contact.phone"
                      value={formData.companyClient.contact.phone}
                      onChange={(e) => handleChange("companyClient.contact.phone", e.target.value)}
                      placeholder="+62 812 3456 7890"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="companyClient.contact.website">Company Website</Label>
                    <Input
                      id="companyClient.contact.website"
                      value={formData.companyClient.contact.website}
                      onChange={(e) => handleChange("companyClient.contact.website", e.target.value)}
                      placeholder="www.company.com"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserCircle className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Person in Charge (PIC)</h4>
                        <p className="text-sm text-muted-foreground">Add client contact person (optional)</p>
                      </div>
                    </div>
                    <Switch checked={showClientPIC} onCheckedChange={setShowClientPIC} disabled={loading} />
                  </div>

                  {showClientPIC && (
                    <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="companyClient.picName">PIC Name</Label>
                        <Input
                          id="companyClient.picName"
                          value={formData.companyClient.picName}
                          onChange={(e) => handleChange("companyClient.picName", e.target.value)}
                          placeholder="John Doe"
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyClient.picEmail">PIC Email</Label>
                        <Input
                          id="companyClient.picEmail"
                          type="email"
                          value={formData.companyClient.picEmail}
                          onChange={(e) => handleChange("companyClient.picEmail", e.target.value)}
                          placeholder="john@company.com"
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyClient.picPhone">PIC Phone</Label>
                        <Input
                          id="companyClient.picPhone"
                          value={formData.companyClient.picPhone}
                          onChange={(e) => handleChange("companyClient.picPhone", e.target.value)}
                          placeholder="+62 812 3456 7890"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">Invite Team Members</h3>
                  <p className="text-sm text-muted-foreground">Add team members to the project (optional)</p>
                </div>
              </div>
              <Switch checked={showTeamMembers} onCheckedChange={setShowTeamMembers} disabled={loading} />
            </div>

            {showTeamMembers && (
              <Collapsible open={teamSectionOpen} onOpenChange={setTeamSectionOpen} className="pt-4 border-t">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                    <span className="text-sm text-muted-foreground">
                      {formData.estimators.length +
                        formData.projectManagers.length +
                        formData.finances.length +
                        formData.designers.length +
                        formData.admins.length}{" "}
                      member(s) added
                    </span>
                    {teamSectionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <TeamMemberInput
                    label="Estimators"
                    emails={formData.estimators}
                    onAdd={(email) => handleAddEmail("estimators", email)}
                    onRemove={(email) => handleRemoveEmail("estimators", email)}
                    disabled={loading}
                  />

                  <TeamMemberInput
                    label="Project Managers"
                    emails={formData.projectManagers}
                    onAdd={(email) => handleAddEmail("projectManagers", email)}
                    onRemove={(email) => handleRemoveEmail("projectManagers", email)}
                    disabled={loading}
                  />

                  <TeamMemberInput
                    label="Finance"
                    emails={formData.finances}
                    onAdd={(email) => handleAddEmail("finances", email)}
                    onRemove={(email) => handleRemoveEmail("finances", email)}
                    disabled={loading}
                  />

                  <TeamMemberInput
                    label="Designers"
                    emails={formData.designers}
                    onAdd={(email) => handleAddEmail("designers", email)}
                    onRemove={(email) => handleRemoveEmail("designers", email)}
                    disabled={loading}
                  />

                  <TeamMemberInput
                    label="Admins (All Roles)"
                    emails={formData.admins}
                    onAdd={(email) => handleAddEmail("admins", email)}
                    onRemove={(email) => handleRemoveEmail("admins", email)}
                    disabled={loading}
                  />
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? editProject
                  ? "Updating..."
                  : "Creating..."
                : editProject
                  ? "Update Project"
                  : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
