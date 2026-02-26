"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FolderIcon, Trash2, Upload, FileText, Download, ChevronRight, Home, MoreVertical, FolderOpen, Edit2, Loader2, Eye, ChevronLeft, ArrowLeft } from 'lucide-react'
import { foldersApi } from "@/lib/api/folders"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { usePathname, useRouter, useSearchParams } from "next/navigation"

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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
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
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null)
  const [hintItemKey, setHintItemKey] = useState<string | null>(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: 'folder' | 'file', item: any, index?: number } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadFolders()
  }, [projectId, searchParams])

  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current)
      }
    }
  }, [])

  const loadFolders = async () => {
    try {
      const response = await foldersApi.getByProject(projectId)
      if (response.success && response.data) {
        setFolders(response.data)

        const folderIdFromQuery = searchParams.get("folderId")
        if (folderIdFromQuery) {
          await openFolderById(folderIdFromQuery, undefined, false)
        }
      }
    } catch (error) {
      console.error("Failed to load folders:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateFolderQuery = (folderId?: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (folderId) {
      params.set("folderId", folderId)
    } else {
      params.delete("folderId")
    }

    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
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

  const handleDeleteFolder = async () => {
    if (!itemToDelete || itemToDelete.type !== 'folder') return

    setDeleting(true)
    try {
      const response = await foldersApi.delete(itemToDelete.item._id, projectId)
      if (response.success) {
        toast({
          title: "Success",
          description: "Folder deleted successfully",
        })
        loadFolders()
        if (currentFolder?._id === itemToDelete.item._id) {
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
    } finally {
      setDeleting(false)
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
    }
  }

  const openFolderById = async (folderId: string, folderName?: string, updateQuery: boolean = true) => {
    try {
      const response = await foldersApi.getFolder(projectId, folderId)
      if (response.success && response.data) {
        const folderData = {
          ...response.data,
          files: response.data.list || response.data.files || []
        }
        setCurrentFolder(folderData)
        setBreadcrumbs([
          { name: "Documents", folder: null },
          { name: folderName || response.data.name || "Folder", folder: folderData }
        ])
        setSelectedItemKey(null)

        if (updateQuery) {
          updateFolderQuery(folderId)
        }
      }
    } catch (error) {
      console.error("Failed to load folder details:", error)
    }
  }

  const handleFolderClick = async (folder: Folder) => {
    await openFolderById(folder._id, folder.name, true)
  }

  const navigateToBreadcrumb = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1)
    setBreadcrumbs(newBreadcrumbs)
    const destinationFolder = newBreadcrumbs[newBreadcrumbs.length - 1].folder
    setCurrentFolder(destinationFolder)
    setSelectedItemKey(null)

    if (destinationFolder?._id) {
      updateFolderQuery(destinationFolder._id)
    } else {
      updateFolderQuery()
    }
  }

  const navigateToRoot = () => {
    setBreadcrumbs([{ name: "Documents", folder: null }])
    setCurrentFolder(null)
    setSelectedItemKey(null)
    updateFolderQuery()
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

  const handleDeleteFile = async () => {
    if (!itemToDelete || itemToDelete.type !== 'file' || itemToDelete.index === undefined || !currentFolder) return

    setDeleting(true)
    try {
      const response = await foldersApi.deleteFile(projectId, currentFolder._id, [itemToDelete.index])
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
    } finally {
      setDeleting(false)
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
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

  const openDeleteDialog = (type: 'folder' | 'file', item: any, index?: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setItemToDelete({ type, item, index })
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (itemToDelete?.type === 'folder') {
      await handleDeleteFolder()
    } else if (itemToDelete?.type === 'file') {
      await handleDeleteFile()
    }
  }

  const getFileUrl = (provider: string, url: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.gema-interior.com"
    return `${baseUrl}/public/${provider}/${url}`
  }

  const displayItems = currentFolder ? currentFolder.files || [] : folders
  const isFileView = Boolean(currentFolder)

  const getItemKey = (item: any, index: number) => {
    if (item?._id) return String(item._id)
    return `${isFileView ? 'file' : 'folder'}-${index}`
  }

  const getCreatedByName = (createdBy: any) => {
    if (!createdBy) return "-"
    if (createdBy?.profile?.name) return createdBy.profile.name
    if (typeof createdBy === "string") return createdBy
    if (createdBy?.email) return createdBy.email
    return "-"
  }

  const getProviderLabel = (provider?: string) => {
    if (!provider) return "File"
    return provider.toLowerCase() === "local" ? "local server" : provider
  }

  const getFileExtension = (item: any) => {
    const source = (item?.name || item?.url || "").toLowerCase()
    const cleaned = source.split("?")[0].split("#")[0]
    const fileName = cleaned.split("/").pop() || ""
    const lastDotIndex = fileName.lastIndexOf(".")

    if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
      return ""
    }

    return fileName.slice(lastDotIndex + 1)
  }

  const getItemKind = (item: any, isFolder: boolean) => {
    if (isFolder) {
      return "Folder"
    }

    const extension = getFileExtension(item)
    if (!extension) {
      return "File"
    }

    const imageKinds: Record<string, string> = {
      jpg: "JPG Image",
      jpeg: "JPEG Image",
      png: "PNG Image",
      webp: "WebP Image",
      gif: "GIF Image",
      bmp: "BMP Image",
      svg: "SVG Image",
      avif: "AVIF Image",
    }

    if (extension === "pdf") {
      return "PDF Document"
    }

    if (imageKinds[extension]) {
      return imageKinds[extension]
    }

    return `${extension.toUpperCase()} File`
  }

  const getFilePreviewType = (file: any): 'pdf' | 'image' | 'unsupported' => {
    const resolvedUrl = getFileUrl(file?.provider || '', file?.url || '')
    const url = resolvedUrl || file?.url || ''
    const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase()

    if (cleanUrl.endsWith('.pdf')) {
      return 'pdf'
    }

    if (/\.(png|jpe?g|gif|webp|bmp|svg|avif)$/.test(cleanUrl)) {
      return 'image'
    }

    return 'unsupported'
  }

  const openFilePreview = (index: number) => {
    setPreviewIndex(index)
    setPreviewDialogOpen(true)
  }

  const showInteractionHint = (itemKey: string) => {
    setHintItemKey(itemKey)

    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current)
    }

    hintTimeoutRef.current = setTimeout(() => {
      setHintItemKey((current) => (current === itemKey ? null : current))
    }, 1800)
  }

  const handleItemClick = (item: any, index: number) => {
    const itemKey = getItemKey(item, index)
    setSelectedItemKey(itemKey)
    showInteractionHint(itemKey)
  }

  const handleItemDoubleClick = (item: any, index: number, isFolder: boolean) => {
    if (isFolder) {
      handleFolderClick(item)
      return
    }

    openFilePreview(index)
  }

  const filesInCurrentFolder = isFileView ? displayItems : []
  const selectedPreviewFile = previewIndex !== null ? filesInCurrentFolder[previewIndex] : null
  const selectedPreviewFileUrl = selectedPreviewFile
    ? getFileUrl(selectedPreviewFile.provider || '', selectedPreviewFile.url || '')
    : ''
  const previewType = selectedPreviewFile ? getFilePreviewType(selectedPreviewFile) : 'unsupported'
  const canGoPrevious = previewIndex !== null && previewIndex > 0
  const canGoNext = previewIndex !== null && previewIndex < filesInCurrentFolder.length - 1

  const handlePreviewNavigation = (direction: 'previous' | 'next') => {
    if (previewIndex === null) return

    if (direction === 'previous' && canGoPrevious) {
      setPreviewIndex(previewIndex - 1)
    }

    if (direction === 'next' && canGoNext) {
      setPreviewIndex(previewIndex + 1)
    }
  }

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
                  <Button size="sm" variant="outline" onClick={navigateToRoot}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
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
              {!currentFolder && (
                <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
              )}
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
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Kind</div>
                <div className="col-span-2">{currentFolder ? "File Location" : "Total Files"}</div>
                <div className="col-span-3">{currentFolder ? "Uploaded" : "Created"}</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              <div className="divide-y">
                {displayItems.map((item: any, index: number) => {
                  const isFolder = !currentFolder
                  const fileCount = isFolder ? (item.list || item.files || []).length : 0
                  const itemKey = getItemKey(item, index)
                  
                  return (
                    <div
                      key={itemKey}
                      className={`relative px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-muted/50 cursor-pointer transition-colors ${selectedItemKey === itemKey ? 'bg-muted' : ''}`}
                      // title={isFolder ? 'Double-click to open this folder.' : 'Double-click to preview this file.'}
                      onClick={() => handleItemClick(item, index)}
                      onDoubleClick={() => handleItemDoubleClick(item, index, isFolder)}
                      onMouseEnter={() => setHintItemKey(itemKey)}
                      onMouseLeave={() => setHintItemKey((current) => (current === itemKey ? null : current))}
                    >
                      {hintItemKey === itemKey && (
                        <div className="absolute right-0 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20 rounded-md bg-muted-foreground text-background text-xs px-2 py-1 pointer-events-none shadow-sm whitespace-nowrap">
                          {isFolder ? 'Double-click to open this folder.' : 'Double-click to preview this file.'}
                        </div>
                      )}

                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        {isFolder ? (
                          <FolderIcon className="h-5 w-5 text-primary shrink-0" />
                        ) : (
                          <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-medium truncate block">
                          {item.name || `File ${index + 1}`}
                        </span>
                      </div>

                      <div className="col-span-2 text-sm text-muted-foreground truncate">
                        {getItemKind(item, isFolder)}
                      </div>

                      <div className="col-span-2 text-sm text-muted-foreground">
                        {isFolder ? `${fileCount} file${fileCount !== 1 ? 's' : ''}` : getProviderLabel(item.provider)}
                      </div>

                      <div className="col-span-3 text-sm text-muted-foreground">
                        <div className="truncate">By {getCreatedByName(item.createdBy)}</div>
                        <div>
                          {item.createdAt 
                            ? new Date(item.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : '-'
                          }
                        </div>
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
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openFilePreview(index)
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                            )}
                            {!isFolder && (
                              <DropdownMenuItem asChild>
                                <a
                                  href={getFileUrl(item.provider || '', item.url || '')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                if (isFolder) {
                                  openDeleteDialog('folder', item, undefined, e)
                                } else {
                                  openDeleteDialog('file', item, index, e)
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

      <Dialog
        open={previewDialogOpen}
        onOpenChange={(open) => {
          setPreviewDialogOpen(open)
          if (!open) {
            setPreviewIndex(null)
          }
        }}
      >
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          <DialogHeader className="h-auto">
            <DialogTitle className="truncate">
              {selectedPreviewFile?.name || (previewIndex !== null ? `File ${previewIndex + 1}` : 'File Preview')}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden w-full relative">
            {filesInCurrentFolder.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handlePreviewNavigation('previous')}
                  disabled={!canGoPrevious}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handlePreviewNavigation('next')}
                  disabled={!canGoNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {!selectedPreviewFile ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No file selected for preview.
              </div>
            ) : previewType === 'pdf' ? (
              <object
                data={selectedPreviewFileUrl}
                type="application/pdf"
                className="w-full h-full"
                aria-label={selectedPreviewFile.name || 'PDF preview'}
              >
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedPreviewFileUrl)}&embedded=true`}
                  className="w-full h-full border-0"
                  title={selectedPreviewFile.name || 'PDF preview'}
                >
                  <p className="text-center text-muted-foreground py-8">
                    Unable to display PDF. Please{" "}
                    <a
                      href={selectedPreviewFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      download the file
                    </a>{" "}
                    to view.
                  </p>
                </iframe>
              </object>
            ) : previewType === 'image' ? (
              <div className="w-full h-full flex items-center justify-center bg-muted/30 p-4 rounded-md">
                <img
                  src={selectedPreviewFileUrl}
                  alt={selectedPreviewFile.name || 'Image Preview'}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center border rounded-md p-6">
                <p className="text-base font-medium">Preview is not available for this file type.</p>
                <p className="text-sm text-muted-foreground mt-2">Please download the file to view its content.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {itemToDelete?.type === 'folder' ? 'Folder' : 'File'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === 'folder' 
                ? `Are you sure you want to delete "${itemToDelete.item.name}" and all its contents? This action cannot be undone.`
                : 'Are you sure you want to delete this file? This action cannot be undone.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
