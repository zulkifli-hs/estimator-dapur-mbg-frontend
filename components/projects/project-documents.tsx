"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FolderIcon, Trash2, Upload, FileText, Download, ChevronRight, Home, MoreVertical, File, FolderOpen, Edit2 } from 'lucide-react'
import { foldersApi } from "@/lib/api/folders"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadApi } from "@/lib/api/upload"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProjectDocumentsProps {
  projectId: string
}

interface Folder {
  _id: string
  name: string
  files?: any[]
  list?: any[]
}

export function ProjectDocuments({ projectId }: ProjectDocumentsProps) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<{ name: string; folder: Folder | null }[]>([
    { name: "Documents", folder: null }
  ])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [uploading, setUploading] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadFolders()
  }, [projectId])

  const loadFolders = async () => {
    try {
      const response = await foldersApi.getByProject(projectId)
      if (response.success && response.data) {
        setFolders(response.data)
      }
    } catch (error) {
      console.error("Failed to load folders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const response = await foldersApi.create({
        projectId,
        name: newFolderName,
      })
      if (response.success) {
        toast({
          title: "Success",
          description: "Folder created successfully",
        })
        setNewFolderName("")
        setCreateDialogOpen(false)
        loadFolders()
      }
    } catch (error) {
      console.error("Failed to create folder:", error)
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      })
    }
  }

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this folder and all its files?")) return

    try {
      const response = await foldersApi.delete(folderId, projectId)
      if (response.success) {
        toast({
          title: "Success",
          description: "Folder deleted successfully",
        })
        loadFolders()
        if (currentFolder?._id === folderId) {
          navigateToRoot()
        }
      }
    } catch (error) {
      console.error("Failed to delete folder:", error)
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive",
      })
    }
  }

  const handleFolderClick = async (folder: Folder) => {
    try {
      const response = await foldersApi.getFolder(projectId, folder._id)
      if (response.success && response.data) {
        const folderData = {
          ...response.data,
          files: response.data.list || response.data.files || []
        }
        setCurrentFolder(folderData)
        setBreadcrumbs([...breadcrumbs, { name: folder.name, folder: folderData }])
      }
    } catch (error) {
      console.error("Failed to load folder details:", error)
    }
  }

  const navigateToBreadcrumb = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1)
    setBreadcrumbs(newBreadcrumbs)
    setCurrentFolder(newBreadcrumbs[newBreadcrumbs.length - 1].folder)
  }

  const navigateToRoot = () => {
    setBreadcrumbs([{ name: "Documents", folder: null }])
    setCurrentFolder(null)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentFolder) return

    setUploading(true)
    try {
      const uploadResponse = await uploadApi.uploadPhoto(file)
      
      const addResponse = await foldersApi.addFile(
        projectId,
        currentFolder._id,
        uploadResponse.url,
        uploadResponse.provider
      )
      
      if (addResponse.success) {
        toast({
          title: "Success",
          description: "File uploaded successfully",
        })
        
        const refreshedFolder = await foldersApi.getFolder(projectId, currentFolder._id)
        if (refreshedFolder.success && refreshedFolder.data) {
          const folderData = {
            ...refreshedFolder.data,
            files: refreshedFolder.data.list || refreshedFolder.data.files || []
          }
          setCurrentFolder(folderData)
        }
        loadFolders()
      }
    } catch (error: any) {
      console.error("Failed to upload file:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleDeleteFile = async (fileIndex: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentFolder || !confirm("Are you sure you want to delete this file?")) return

    try {
      const response = await foldersApi.deleteFile(projectId, currentFolder._id, [fileIndex])
      if (response.success) {
        toast({
          title: "Success",
          description: "File deleted successfully",
        })
        
        const refreshedFolder = await foldersApi.getFolder(projectId, currentFolder._id)
        if (refreshedFolder.success && refreshedFolder.data) {
          const folderData = {
            ...refreshedFolder.data,
            files: refreshedFolder.data.list || refreshedFolder.data.files || []
          }
          setCurrentFolder(folderData)
        }
        loadFolders()
      }
    } catch (error) {
      console.error("Failed to delete file:", error)
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  const handleRenameFolder = async () => {
    if (!renameValue.trim() || !renamingFolder) return

    try {
      const response = await foldersApi.rename(projectId, renamingFolder._id, renameValue)
      if (response.success) {
        toast({
          title: "Success",
          description: "Folder renamed successfully",
        })
        setRenameValue("")
        setRenameDialogOpen(false)
        setRenamingFolder(null)
        loadFolders()
        
        if (currentFolder?._id === renamingFolder._id) {
          setCurrentFolder({ ...currentFolder, name: renameValue })
          setBreadcrumbs(breadcrumbs.map((crumb, index) => 
            index === breadcrumbs.length - 1 ? { ...crumb, name: renameValue } : crumb
          ))
        }
      }
    } catch (error) {
      console.error("Failed to rename folder:", error)
      toast({
        title: "Error",
        description: "Failed to rename folder",
        variant: "destructive",
      })
    }
  }

  const openRenameDialog = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingFolder(folder)
    setRenameValue(folder.name)
    setRenameDialogOpen(true)
  }

  const displayItems = currentFolder ? currentFolder.files || [] : folders

  return (
    <div className="h-full flex flex-col">
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm flex-1">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index === 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateToBreadcrumb(index)}
                      className="h-8"
                    >
                      <Home className="h-4 w-4 mr-1" />
                      {crumb.name}
                    </Button>
                  ) : (
                    <>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateToBreadcrumb(index)}
                        className="h-8"
                      >
                        {crumb.name}
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentFolder && (
                <>
                  <input
                    type="file"
                    id="file-upload-toolbar"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <Button size="sm" variant="outline" asChild disabled={uploading}>
                    <label htmlFor="file-upload-toolbar" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload File"}
                    </label>
                  </Button>
                </>
              )}
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : displayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                {currentFolder ? "This folder is empty" : "No folders yet"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {currentFolder 
                  ? "Upload files to get started" 
                  : "Create a folder to organize your documents"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto h-full">
              <div className="sticky top-0 bg-muted/50 border-b px-4 py-3 grid grid-cols-12 gap-4 text-sm font-medium">
                <div className="col-span-6">Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-3">Modified</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              <div className="divide-y">
                {displayItems.map((item: any, index: number) => {
                  const isFolder = !currentFolder
                  const fileCount = isFolder ? (item.list || item.files || []).length : 0
                  
                  return (
                    <div
                      key={item._id || index}
                      className="px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => isFolder && handleFolderClick(item)}
                    >
                      <div className="col-span-6 flex items-center gap-3 min-w-0">
                        {isFolder ? (
                          <FolderIcon className="h-5 w-5 text-primary flex-shrink-0" />
                        ) : (
                          <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="font-medium truncate">
                          {item.name || `File ${index + 1}`}
                        </span>
                      </div>

                      <div className="col-span-2 text-sm text-muted-foreground">
                        {isFolder ? `${fileCount} file${fileCount !== 1 ? 's' : ''}` : item.provider || 'File'}
                      </div>

                      <div className="col-span-3 text-sm text-muted-foreground">
                        {item.createdAt 
                          ? new Date(item.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : '-'
                        }
                      </div>

                      <div className="col-span-1 flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isFolder && (
                              <DropdownMenuItem onClick={(e) => openRenameDialog(item, e)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                            )}
                            {!isFolder && (
                              <DropdownMenuItem asChild>
                                <a href={item.url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                if (isFolder) {
                                  handleDeleteFolder(item._id, e)
                                } else {
                                  handleDeleteFile(index, e)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Contracts, Reports, Invoices"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder()
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder}>Create Folder</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="rename-folder">Folder Name</Label>
              <Input
                id="rename-folder"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Enter new folder name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameFolder()
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRenameFolder}>Rename</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
