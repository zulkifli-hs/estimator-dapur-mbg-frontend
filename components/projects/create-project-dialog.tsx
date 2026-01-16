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
import { X, Plus, Search, Check } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
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
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
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

export function CreateProjectDialog({ open, onOpenChange, onSuccess }: CreateProjectDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const errorRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "Renovasi",
    area: 0,
    building: "",
    floor: 0,
    companyClient: {
      name: "",
      contact: { phone: "", email: "", website: "" },
      type: "",
    },
    companyOwner: {
      name: "",
      code: "",
    },
    estimators: [] as string[],
    projectManagers: [] as string[],
    finances: [] as string[],
    designers: [] as string[],
    client: {
      email: "",
      name: "",
      phone: "",
    },
    admins: [] as string[],
  })

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
      const response = await projectsApi.create(formData)

      if (response.success) {
        setFormData({
          name: "",
          type: "Renovasi",
          area: 0,
          building: "",
          floor: 0,
          companyClient: {
            name: "",
            contact: { phone: "", email: "", website: "" },
            type: "",
          },
          companyOwner: {
            name: "",
            code: "",
          },
          estimators: [],
          projectManagers: [],
          finances: [],
          designers: [],
          client: {
            email: "",
            name: "",
            phone: "",
          },
          admins: [],
        })
        onSuccess()
        onOpenChange(false)
      } else {
        setError(response.message || "Failed to create project")
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
          <DialogTitle className="text-2xl">Create New Project</DialogTitle>
          <DialogDescription>Add a new interior design project with complete details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
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
                    <SelectItem value="Renovasi">Renovasi</SelectItem>
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
                  value={formData.floor}
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
                  value={formData.area}
                  onChange={(e) => handleChange("area", Number.parseInt(e.target.value) || 0)}
                  placeholder="500"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Client Company Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Client Company as per Legal Documents</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyClient.name">Company Name *</Label>
                <Input
                  id="companyClient.name"
                  value={formData.companyClient.name}
                  onChange={(e) => handleChange("companyClient.name", e.target.value)}
                  placeholder="PT Technology Media"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyClient.type">Industry Type *</Label>
                <Select
                  value={formData.companyClient.type}
                  onValueChange={(value) => handleChange("companyClient.type", value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="logistic/transportation">Logistic/Transportation</SelectItem>
                    <SelectItem value="media/technologies">Media/Technologies</SelectItem>
                    <SelectItem value="consulting/financial institution">Consulting/Financial Institution</SelectItem>
                    <SelectItem value="real estate/property">Real Estate/Property</SelectItem>
                    <SelectItem value="industrial/manufacturing">Industrial/Manufacturing</SelectItem>
                    <SelectItem value="commodities">Commodities</SelectItem>
                    <SelectItem value="coworking">Coworking</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
            </div>
          </div>

          {/* Owner Company Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Owner Company</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyOwner.name">Owner Company Name *</Label>
                <Input
                  id="companyOwner.name"
                  value={formData.companyOwner.name}
                  onChange={(e) => handleChange("companyOwner.name", e.target.value)}
                  placeholder="Gema Building"
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
                  placeholder="GEMA"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Client Contact Person */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Client Contact Person</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client.name">Name *</Label>
                <Input
                  id="client.name"
                  value={formData.client.name}
                  onChange={(e) => handleChange("client.name", e.target.value)}
                  placeholder="John Doe"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client.email">Email *</Label>
                <Input
                  id="client.email"
                  type="email"
                  value={formData.client.email}
                  onChange={(e) => handleChange("client.email", e.target.value)}
                  placeholder="john@company.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client.phone">Phone *</Label>
                <Input
                  id="client.phone"
                  value={formData.client.phone}
                  onChange={(e) => handleChange("client.phone", e.target.value)}
                  placeholder="+62 812 3456 7890"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Team Members</h3>
            <p className="text-sm text-muted-foreground">
              Add team member emails one by one. Each email will be validated.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
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
                label="Finance Team"
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
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
