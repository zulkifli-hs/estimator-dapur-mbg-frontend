"use client"

import type React from "react"

import { useEffect, useState } from "react"
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
import { Plus, Search, Edit, Trash2, Loader2, Upload, X } from "lucide-react"
import { usersApi, type User, type CreateUserInput, type UpdateUserInput } from "@/lib/api/users"
import { uploadApi } from "@/lib/api/upload"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/api/config"

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalData, setTotalData] = useState(0)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [page, searchQuery])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await usersApi.getAll(page, 10, searchQuery || undefined)
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
    setFormData({ email: "", password: "", name: "", phone: "" })
    setPhotoFile(null)
    setPhotoPreview("")
    setUploadProgress(0)
  }

  const handleCreate = async () => {
    try {
      setSubmitting(true)

      let photoData = undefined
      if (photoFile) {
        const uploaded = await uploadApi.uploadFile(photoFile, setUploadProgress)
        photoData = { url: uploaded.url, provider: uploaded.provider }
      }

      const createData: CreateUserInput = {
        email: formData.email,
        password: formData.password,
        name: formData.name || undefined,
        phone: formData.phone || undefined,
        photo: photoData,
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

      const updateData: UpdateUserInput = {
        email: formData.email || undefined,
        password: formData.password || undefined,
        name: formData.name || undefined,
        phone: formData.phone || undefined,
        photo: photoData,
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

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return

    try {
      await usersApi.bulkDelete(selectedUsers)
      toast({
        title: "Success",
        description: `${selectedUsers.length} user(s) deleted successfully`,
      })
      setSelectedUsers([])
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage users and their permissions</p>
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
            <div className="flex gap-2 w-full sm:w-auto">
              {selectedUsers.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ({selectedUsers.length})
                </Button>
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
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
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
                                {(user.profile?.name || user.email).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.profile?.name || "No name"}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.profile?.phone || "-"}</TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeletingUserId(user._id)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
              <Label htmlFor="edit-password">Password (leave empty to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter new password"
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
    </div>
  )
}
