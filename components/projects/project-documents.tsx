"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Trash2, Upload } from "lucide-react"
import { filesApi } from "@/lib/api/files"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProjectDocumentsProps {
  projectId: string
}

export function ProjectDocuments({ projectId }: ProjectDocumentsProps) {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [projectId])

  const loadDocuments = async () => {
    try {
      const response = await filesApi.getByProject(projectId)
      if (response.success && response.data) {
        setDocuments(response.data.filter((f: any) => f.type === "document"))
      }
    } catch (error) {
      console.error("Failed to load documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const response = await filesApi.upload(projectId, file, "document")
      if (response.success) {
        loadDocuments()
      }
    } catch (error) {
      console.error("Failed to upload file:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      const response = await filesApi.delete(fileId)
      if (response.success) {
        loadDocuments()
      }
    } catch (error) {
      console.error("Failed to delete file:", error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Documents</CardTitle>
              <CardDescription>Upload and manage project-related documents</CardDescription>
            </div>
            <div>
              <input
                type="file"
                id="document-upload"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <Button asChild disabled={uploading}>
                <label htmlFor="document-upload" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Document"}
                </label>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading documents...</p>
          ) : documents.length === 0 ? (
            <Alert>
              <AlertDescription className="text-center">
                No documents uploaded yet. Click "Upload Document" to add files.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={doc.url} download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
