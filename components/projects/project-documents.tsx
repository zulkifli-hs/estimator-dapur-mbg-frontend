"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FolderIcon, Trash2, Upload, FileText, Download } from 'lucide-react'
import { foldersApi } from "@/lib/api/folders"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { uploadApi } from "@/lib/api/upload"
import { useToast } from "@/hooks/use-toast"

interface ProjectDocumentsProps {
  projectId: string
}

export function ProjectDocuments({ projectId }: ProjectDocumentsProps) {
  const [folders, setFolders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<any>(null)
  const [folderDetailOpen, setFolderDetailOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
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
        setNewFolderName("")
        setCreateDialogOpen(false)
        loadFolders()
      }
    } catch (error) {
      console.error("Failed to create folder:", error)
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Are you sure you want to delete this folder and all its files?")) return

    try {
      const response = await foldersApi.delete(folderId, projectId)
      if (response.success) {
        loadFolders()
      }
    } catch (error) {
      console.error("Failed to delete folder:", error)
    }
  }

  const handleFolderClick = async (folder: any) => {
    try {
      const response = await foldersApi.getFolder(projectId, folder._id)
      if (response.success && response.data) {
        const folderData = {
          ...response.data,
          files: response.data.list || response.data.files || []
        }
        setSelectedFolder(folderData)
        setFolderDetailOpen(true)
      }
    } catch (error) {
      console.error("Failed to load folder details:", error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedFolder) return

    setUploading(true)
    try {
      const uploadResponse = await uploadApi.uploadPhoto(file)
      
      const addResponse = await foldersApi.addFile(
        projectId,
        selectedFolder._id,
        uploadResponse.url,
        uploadResponse.provider
      )
      
      if (addResponse.success) {
        toast({
          title: "Success",
          description: "File uploaded successfully",
        })
        const refreshedFolder = await foldersApi.getFolder(projectId, selectedFolder._id)
        if (refreshedFolder.success && refreshedFolder.data) {
          const folderData = {
            ...refreshedFolder.data,
            files: refreshedFolder.data.list || refreshedFolder.data.files || []
          }
          setSelectedFolder(folderData)
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

  const handleDeleteFile = async (fileIndex: number) => {
    if (!selectedFolder || !confirm("Are you sure you want to delete this file?")) return

    try {
      const response = await foldersApi.deleteFile(projectId, selectedFolder._id, [fileIndex])
      if (response.success) {
        const refreshedFolder = await foldersApi.getFolder(projectId, selectedFolder._id)
        if (refreshedFolder.success && refreshedFolder.data) {
          const folderData = {
            ...refreshedFolder.data,
            files: refreshedFolder.data.list || refreshedFolder.data.files || []
          }
          setSelectedFolder(folderData)
        }
        loadFolders()
      }
    } catch (error) {
      console.error("Failed to delete file:", error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Document Folders</CardTitle>
              <CardDescription>Organize project documents into folders</CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
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
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading folders...</p>
          ) : folders.length === 0 ? (
            <Alert>
              <AlertDescription className="text-center">
                No folders created yet. Click "New Folder" to organize your project documents.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {folders.map((folder) => (
                <Card 
                  key={folder._id} 
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleFolderClick(folder)}
                >
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <FolderIcon className="h-12 w-12 text-primary" />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{folder.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(folder.list || folder.files || []).length} file{(folder.list || folder.files || []).length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFolder(folder._id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Folder Detail Dialog */}
      <Dialog open={folderDetailOpen} onOpenChange={setFolderDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FolderIcon className="h-5 w-5" />
                {selectedFolder?.name}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Button size="sm" asChild disabled={uploading}>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload File"}
                  </label>
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            {!selectedFolder?.files || selectedFolder.files.length === 0 ? (
              <Alert>
                <AlertDescription className="text-center">
                  No files in this folder yet. Click "Upload File" to add documents.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {selectedFolder.files.map((file: any, index: number) => (
                  <div
                    key={file._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{file.provider}</span>
                          <span>•</span>
                          <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteFile(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
