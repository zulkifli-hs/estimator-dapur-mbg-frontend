"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Loader2, Upload, X, Shield, MoreVertical, Eye, Key, Lock } from "lucide-react"
import { usersApi, type User, type UpdateUserInput, type Permission } from "@/lib/api/users"
import { uploadApi } from "@/lib/api/upload"
import { getProfile } from "@/lib/api/auth"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/api/config"

export default function UsersPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true) // Added auth checking state
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [userType, setUserType] = useState<"All" | "Internal" | "External">("All")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalData, setTotalData] = useState(0)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [statusConfirmDialogOpen, setStatusConfirmDialogOpen] = useState(false)
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)
  const [viewDetailDialogOpen, setViewDetailDialogOpen] = useState(false)
  const [projectsDialogOpen, setProjectsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [toggleStatusUser, setToggleStatusUser] = useState<User | null>(null)
  const [selectedUsersForPermissions, setSelectedUsersForPermissions] = useState<User[]>([])
  const [permissionsMap, setPermissionsMap] = useState<Record<string, Permission[]>>({})
  const [selectedUserForProjects, setSelectedUserForProjects] = useState<User | null>(null)
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    type: "Internal" as "Internal" | "External",
  })
  const [passwordFormData, setPasswordFormData] = useState({
    password: "",
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0) // Declared uploadProgress variable

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const response = await getProfile()
        if (!response.data.admin) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page",
            variant: "destructive",
          })
          router.push("/dashboard")
          return
        }
        setCurrentUserId(response.data._id)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to verify access permissions",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      } finally {
        setCheckingAuth(false)
      }
    }
    checkAdminAccess()
  }, [router, toast])

  useEffect(() => {
    if (!checkingAuth) {
      loadUsers()
    }
  }, [page, searchQuery, userType, checkingAuth])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const typeParam = userType !== "All" ? userType : undefined
      const response = await usersApi.getAll(page, 10, searchQuery || undefined, typeParam)
      setUsers(response.list)
      setTotalPages(response.totalPage)
      setTotalData(response.totalData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setPage(1)
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview("")
  }

  const resetForm = () => {
    setFormData({ email: "", password: "", name: "", phone: "", type: "Internal" })
    setPhotoFile(null)
    setPhotoPreview("")
    setUploadProgress(0)
  }

  const handleCreate = async () => {
    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Email and password are required",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      let photoData = { url: "images/user-default.jpeg", provider: "local" }
      if (photoFile) {
        const uploaded = await uploadApi.uploadFile(photoFile, setUploadProgress)
        photoData = { url: uploaded.url, provider: uploaded.provider }
      }

      const profileData: any = {
        name: formData.name || "",
        photo: photoData,
      }

      // Only add phone to profile if it's not empty
      if (formData.phone && formData.phone.trim()) {
        profileData.phone = formData.phone
      }

      const createData: any = {
        email: formData.email,
        password: formData.password,
        profile: profileData,
      }
      if (formData.type) {
        createData.type = formData.type
      }
      await usersApi.create(createData)

      toast({
        title: "Success",
        description: "User created successfully",
      })

      setCreateDialogOpen(false)
      resetForm()
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingUser) return

    try {
      setSubmitting(true)

      let photoData = editingUser.profile?.photo
      if (photoFile) {
        const uploaded = await uploadApi.uploadFile(photoFile, setUploadProgress)
        photoData = { url: uploaded.url, provider: uploaded.provider }
      }

      const profileData: any = {
        name: formData.name || "",
        photo: photoData,
      }

      // Only add phone to profile if it's not empty
      if (formData.phone && formData.phone.trim()) {
        profileData.phone = formData.phone
      }

      const updateData: UpdateUserInput = {
        email: formData.email || undefined,
        password: formData.password || undefined,
        profile: profileData,
        type: formData.type || "Internal",
      }

      await usersApi.update(editingUser._id, updateData)

      toast({
        title: "Success",
        description: "User updated successfully",
      })

      setEditDialogOpen(false)
      resetForm()
      setEditingUser(null)
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: "",
      name: user.profile?.name || "",
      phone: user.profile?.phone || "",
      type: user.type || "Internal",
    })
    if (user.profile?.photo) {
      setPhotoPreview(`${API_BASE_URL}/public/${user.profile.photo.provider}/${user.profile.photo.url}`)
    }
    setEditDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingUserId) return

    try {
      await usersApi.delete(deletingUserId)
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
      setDeleteDialogOpen(false)
      setDeletingUserId(null)
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const openBulkDeleteDialog = () => {
    if (selectedUsers.length === 0) return

    // Check if current user is in the selection
    if (selectedUsers.includes(currentUserId)) {
      toast({
        title: "Action Not Allowed",
        description: "You cannot delete your own account. Please deselect yourself from the selection.",
        variant: "destructive",
      })
      return
    }

    setBulkDeleteDialogOpen(true)
  }

  const confirmBulkDelete = async () => {
    if (selectedUsers.length === 0) return

    try {
      await usersApi.bulkDelete(selectedUsers)
      toast({
        title: "Success",
        description: `${selectedUsers.length} user(s) deleted successfully`,
      })
      setSelectedUsers([])
      setBulkDeleteDialogOpen(false)
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete users",
        variant: "destructive",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return

    try {
      await usersApi.bulkDelete(selectedUsers)
      toast({
        title: "Success",
        description: `${selectedUsers.length} user(s) deleted successfully`,
      })
      setSelectedUsers([])
      setBulkDeleteDialogOpen(false)
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete users",
        variant: "destructive",
      })
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const toggleAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map((u) => u._id))
    }
  }

  const handleToggleStatus = (user: User) => {
    // Prevent user from deactivating their own account
    if (user._id === currentUserId && user.status === "Active") {
      toast({
        title: "Action Not Allowed",
        description: "You cannot deactivate your own account",
        variant: "destructive",
      })
      return
    }

    setToggleStatusUser(user)
    setStatusConfirmDialogOpen(true)
  }

  const confirmToggleStatus = async () => {
    if (!toggleStatusUser) return

    try {
      if (toggleStatusUser.status === "Active") {
        await usersApi.deactivate(toggleStatusUser._id)
        toast({
          title: "Success",
          description: `User ${toggleStatusUser.profile?.name || toggleStatusUser.email} has been deactivated`,
        })
      } else {
        await usersApi.activate(toggleStatusUser._id)
        toast({
          title: "Success",
          description: `User ${toggleStatusUser.profile?.name || toggleStatusUser.email} has been activated`,
        })
      }
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      })
    } finally {
      setStatusConfirmDialogOpen(false)
      setToggleStatusUser(null)
    }
  }

  const openPermissionsDialog = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select users to update permissions",
        variant: "destructive",
      })
      return
    }

    const usersToUpdate = users.filter((u) => selectedUsers.includes(u._id))
    setSelectedUsersForPermissions(usersToUpdate)

    // Initialize permissions map with current user permissions
    const initialMap: Record<string, Permission[]> = {}
    for (const user of usersToUpdate) {
      initialMap[user._id] = user.permissions || []
    }
    setPermissionsMap(initialMap)
    setPermissionsDialogOpen(true)
  }

  const togglePermission = (userId: string, permission: Permission) => {
    setPermissionsMap((prev) => {
      const userPerms = prev[userId] || []
      const exists = userPerms.some((p) => p.path === permission.path && p.method === permission.method)

      if (exists) {
        return {
          ...prev,
          [userId]: userPerms.filter((p) => !(p.path === permission.path && p.method === permission.method)),
        }
      }
      return {
        ...prev,
        [userId]: [...userPerms, permission],
      }
    })
  }

  const hasPermission = (userId: string, permission: Permission): boolean => {
    const userPerms = permissionsMap[userId] || []
    return userPerms.some((p) => p.path === permission.path && p.method === permission.method)
  }

  const handleUpdatePermissions = async () => {
    try {
      setSubmitting(true)

      const updateData = {
        users: Object.entries(permissionsMap).map(([userId, permissions]) => ({
          _id: userId,
          permissions,
        })),
      }

      await usersApi.updatePermissions(updateData)

      toast({
        title: "Success",
        description: "Permissions updated successfully",
      })

      setPermissionsDialogOpen(false)
      setSelectedUsersForPermissions([])
      setPermissionsMap({})
      setSelectedUsers([])
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const openViewDetailDialog = async (user: User) => {
    try {
      const userData = await usersApi.getById(user._id)
      setViewingUser(userData)
      setViewDetailDialogOpen(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user details",
        variant: "destructive",
      })
    }
  }

  const openPasswordDialog = (user: User) => {
    setEditingUser(user)
    setPasswordFormData({ password: "" })
    setPasswordDialogOpen(true)
  }

  const handleUpdatePassword = async () => {
    if (!editingUser) return

    try {
      setSubmitting(true)

      await usersApi.update(editingUser._id, {
        password: passwordFormData.password,
      })

      toast({
        title: "Success",
        description: "Password updated successfully",
      })

      setPasswordDialogOpen(false)
      setEditingUser(null)
      setPasswordFormData({ password: "" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const openSingleUserPermissionsDialog = (user: User) => {
    setSelectedUsersForPermissions([user])
    const initialMap: Record<string, Permission[]> = {
      [user._id]: user.permissions || [],
    }
    setPermissionsMap(initialMap)
    setPermissionsDialogOpen(true)
  }

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access permissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" /> {/* Added admin shield icon */}
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage users and permissions (Admin Only)</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>Total: {totalData} user(s)</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto flex-wrap">
              {selectedUsers.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={openPermissionsDialog}>
                    <Shield className="mr-2 h-4 w-4" />
                    Permissions ({selectedUsers.length})
                  </Button>
                  <Button variant="destructive" size="sm" onClick={openBulkDeleteDialog}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({selectedUsers.length})
                  </Button>
                </>
              )}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          
          {/* Type Filter Buttons */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {(["All", "Internal", "External"] as const).map((type) => (
              <Button
                key={type}
                variant={userType === type ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setUserType(type)
                  setPage(1)
                }}
              >
                {type}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onCheckedChange={toggleAllUsers}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email / Phone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow
                        key={user._id}
                        onMouseEnter={() => setHoveredUserId(user._id)}
                        onMouseLeave={() => setHoveredUserId(null)}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user._id)}
                            onCheckedChange={() => toggleUserSelection(user._id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={
                                  user.profile?.photo
                                    ? `${API_BASE_URL}/public/${user.profile.photo.provider}/${user.profile.photo.url}`
                                    : undefined
                                }
                                alt={user.profile?.name || user.email}
                              />
                              <AvatarFallback>
                                {(user.profile?.name || user.email || "U").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">{user.profile?.name || "No name"}</span>
                              {user.admin && (
                                <Badge variant="secondary" className="w-fit text-xs">
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        {/* <TableCell>{user.email || "-"}</TableCell> */}
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm">{user.email || "-"}</span>
                            <span className="text-xs text-muted-foreground">{user.profile?.phone || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.type && (
                            <Badge variant={user.type === "Internal" ? "default" : "secondary"}>
                              {user.type}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {hoveredUserId === user._id ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openSingleUserPermissionsDialog(user)}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Update
                            </Button>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {user.permissions && user.permissions.length > 0 ? (
                                user.permissions.map((perm, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {perm.method} {perm.path}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-muted-foreground">No permissions</span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.projects && user.projects.length > 0 ? (
                              <>
                                <span className="font-medium">{user.projects.length}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUserForProjects(user)
                                    setProjectsDialogOpen(true)
                                  }}
                                >
                                  View
                                </Button>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.status === "Active"}
                              onCheckedChange={() => handleToggleStatus(user)}
                            />
                            <span className="text-sm text-muted-foreground">{user.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openViewDetailDialog(user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPasswordDialog(user)}>
                                <Key className="mr-2 h-4 w-4" />
                                Update Password
                              </DropdownMenuItem>
                              {/* <DropdownMenuItem onClick={() => openSingleUserPermissionsDialog(user)}>
                                <Shield className="mr-2 h-4 w-4" />
                                Update Permissions
                              </DropdownMenuItem> */}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeletingUserId(user._id)
                                  setDeleteDialogOpen(true)
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>Add a new user to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password *</Label>
              <Input
                id="create-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-phone">Phone</Label>
              <Input
                id="create-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-type">User Type</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger id="create-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Internal">Internal</SelectItem>
                  <SelectItem value="External">External</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Photo</Label>
              {photoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={photoPreview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={removePhoto}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id="create-photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("create-photo")?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </Button>
                </div>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting || !formData.email || !formData.password}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">User Type</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger id="edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Internal">Internal</SelectItem>
                  <SelectItem value="External">External</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Photo</Label>
              {photoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={photoPreview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={removePhoto}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input id="edit-photo" type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("edit-photo")?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </Button>
                </div>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false)
                resetForm()
                setEditingUser(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={statusConfirmDialogOpen} onOpenChange={setStatusConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              {toggleStatusUser?.status === "Active" ? (
                <>
                  Are you sure you want to <strong>deactivate</strong> this user?
                  <br />
                  <br />
                  Deactivating this user will prevent them from logging in to the system.
                </>
              ) : (
                <>
                  Are you sure you want to <strong>activate</strong> this user?
                  <br />
                  <br />
                  Activating this user will allow them to log in to the system.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToggleStatusUser(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleStatus}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Password</DialogTitle>
            <DialogDescription>
              Update password for {editingUser?.profile?.name || editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordFormData.password}
                onChange={(e) => setPasswordFormData({ password: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialogOpen(false)
                setEditingUser(null)
                setPasswordFormData({ password: "" })
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdatePassword} disabled={submitting || !passwordFormData.password}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={viewDetailDialogOpen} onOpenChange={setViewDetailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={
                      viewingUser.profile?.photo
                        ? `${API_BASE_URL}/public/${viewingUser.profile.photo.provider}/${viewingUser.profile.photo.url}`
                        : undefined
                    }
                    alt={viewingUser.profile?.name || viewingUser.email}
                  />
                  <AvatarFallback>{(viewingUser.profile?.name || viewingUser.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold">{viewingUser.profile?.name || "No name"}</div>
                  <div className="text-sm text-muted-foreground">{viewingUser.email}</div>
                  <div className="flex gap-2 mt-1">
                    {viewingUser.admin && (
                      <Badge variant="secondary" className="text-xs">
                        Admin
                      </Badge>
                    )}
                    <Badge variant={viewingUser.status === "Active" ? "default" : "secondary"} className="text-xs">
                      {viewingUser.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <div className="text-sm">{viewingUser.profile?.phone || "-"}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created At</Label>
                  <div className="text-sm">{new Date(viewingUser.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Updated At</Label>
                  <div className="text-sm">{new Date(viewingUser.updatedAt).toLocaleString()}</div>
                </div>
                {viewingUser.permissions && viewingUser.permissions.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Permissions</Label>
                    <div className="mt-1 space-y-1">
                      {viewingUser.permissions.map((perm, idx) => (
                        <div key={idx} className="text-sm flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {perm.method}
                          </Badge>
                          <span className="text-muted-foreground">{perm.path}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Permissions</DialogTitle>
            <DialogDescription>
              Manage permissions for {selectedUsersForPermissions.length} selected user(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Available Permissions */}
            <div className="space-y-4">
              <div className="font-medium text-sm">Available Permissions</div>
              <div className="border rounded-lg p-4 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div>
                      <div className="font-medium">Create Project</div>
                      <div className="text-xs text-muted-foreground">POST /projects</div>
                    </div>
                  </div>
                  
                  {/* User-specific checkboxes */}
                  <div className="space-y-2 pl-4">
                    {selectedUsersForPermissions.map((user) => (
                      <div key={user._id} className="flex items-center gap-2">
                        <Checkbox
                          id={`create-project-${user._id}`}
                          checked={hasPermission(user._id, { path: "/projects", method: "POST" })}
                          onCheckedChange={() =>
                            togglePermission(user._id, { path: "/projects", method: "POST" })
                          }
                        />
                        <Label htmlFor={`create-project-${user._id}`} className="text-sm cursor-pointer">
                          {user.profile?.name || user.email}
                          {user.admin && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Admin
                            </Badge>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPermissionsDialogOpen(false)
                setSelectedUsersForPermissions([])
                setPermissionsMap({})
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdatePermissions} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUsers.length} selected user(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedUsers.length} User(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Projects Dialog */}
      <Dialog open={projectsDialogOpen} onOpenChange={setProjectsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Projects - {selectedUserForProjects?.profile?.name || selectedUserForProjects?.email}
            </DialogTitle>
            <DialogDescription>
              Viewing all projects and roles for this user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedUserForProjects?.projects && selectedUserForProjects.projects.length > 0 ? (
              <div className="space-y-3">
                {selectedUserForProjects.projects.map((projectAssignment) => (
                  <div
                    key={projectAssignment._id}
                    className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setProjectsDialogOpen(false)
                      router.push(`/projects/${projectAssignment.project._id || projectAssignment._id}`)
                    }}
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold">{projectAssignment.project.name}</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {projectAssignment.roles.map((role) => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No projects assigned to this user
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setProjectsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
