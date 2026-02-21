"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, FileText, Edit, Upload, Download, Eye, Trash2 } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { terminApi } from "@/lib/api/termin"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateTerminDialog } from "./create-termin-dialog"
import { Input } from "@/components/ui/input"
import { uploadProjectFile, deleteProjectFiles } from "@/lib/api/files"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

interface ProjectInvoiceProps {
  projectId: string
  project?: any
  onUpdate?: () => void
}

export function ProjectInvoice({ projectId, project, onUpdate }: ProjectInvoiceProps) {
  const [termins, setTermins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("termin")
  const [showCreateTermin, setShowCreateTermin] = useState(false)
  const [terminMode, setTerminMode] = useState<"create" | "update">("create")
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<number[]>([])
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ indexes: number[] } | null>(null)
  const { toast } = useToast()

  const contractFiles = project?.detail?.contract || []

  useEffect(() => {
    loadTermins()
  }, [projectId])

  const loadTermins = async () => {
    try {
      const response = await terminApi.getByProject(projectId)

      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          setTermins(response.data)
        } else {
          console.error("[v0] Termin data is not an array:", response.data)
          setTermins([])
        }
      }
    } catch (error) {
      console.log("[v0] No termins found or error loading termins:", error)
      setTermins([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenTerminDialog = () => {
    if (termins.length > 0) {
      setTerminMode("update")
    } else {
      setTerminMode("create")
    }
    setShowCreateTermin(true)
  }

  const getFileUrl = (provider: string, url: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.gema-interior.com"
    return `${baseUrl}/public/${provider}/${url}`
  }

  const handleDownload = (provider: string, url: string, filename: string) => {
    const fileUrl = getFileUrl(provider, url)
    window.open(fileUrl, "_blank")
  }

  const handleView = (provider: string, url: string, filename?: string) => {
    const fileUrl = getFileUrl(provider, url)
    setPreviewUrl(fileUrl)
    setPreviewOpen(true)
  }

  const handleFileUpload = async (file: File, type: string) => {
    if (!file) return

    setUploading(true)
    try {
      await uploadProjectFile(projectId, file, type)

      toast({
        title: "Success",
        description: "File uploaded successfully",
      })

      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      let errorMessage = "Failed to upload file"
      if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file, type)
    }
    e.target.value = ""
  }

  const getUserName = (createdBy: any) => {
    if (!createdBy) return "Unknown"
    if (typeof createdBy === "string") return createdBy
    if (createdBy.profile?.name) return createdBy.profile.name
    if (createdBy.email) return createdBy.email
    return "Unknown"
  }

  const handleFileSelect = (index: number, checked: boolean) => {
    setSelectedFiles((prev) => {
      if (checked) {
        return [...prev, index]
      }
      return prev.filter((i) => i !== index)
    })
  }

  const handleSelectAll = (fileCount: number, checked: boolean) => {
    if (checked) {
      setSelectedFiles(Array.from({ length: fileCount }, (_, i) => i))
    } else {
      setSelectedFiles([])
    }
  }

  const handleDeleteSingle = (index: number) => {
    setDeleteConfirm({ indexes: [index] })
  }

  const handleBulkDelete = () => {
    if (selectedFiles.length > 0) {
      setDeleteConfirm({ indexes: selectedFiles })
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return

    setDeleting(true)
    try {
      await deleteProjectFiles(projectId, "contract", deleteConfirm.indexes)

      toast({
        title: "Success",
        description: `${deleteConfirm.indexes.length} file(s) deleted successfully`,
      })

      setSelectedFiles([])

      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      let errorMessage = "Failed to delete file(s)"
      if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteConfirm(null)
    }
  }

  return (
    <div className="space-y-6">
      <CreateTerminDialog
        open={showCreateTermin}
        onOpenChange={setShowCreateTermin}
        projectId={projectId}
        onSuccess={loadTermins}
        existingTermins={termins}
        mode={terminMode}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Mobile: Dropdown */}
        <div className="block md:hidden">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: Tabs */}
        <TabsList className="hidden md:grid w-full grid-cols-4">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="termin">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Terms (Termin)</CardTitle>
                  <CardDescription>Project payment schedule and milestones</CardDescription>
                </div>
                <Button onClick={handleOpenTerminDialog}>
                  {termins.length > 0 ? (
                    <Edit className="h-4 w-4 mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {termins.length > 0 ? "Update Terms" : "Create Terms"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading termins...</p>
              ) : termins.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No payment terms defined yet</p>
                  <Button onClick={handleOpenTerminDialog} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Payment Terms
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {termins.map((termin, index) => (
                    <div
                      key={termin._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{termin.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {termin.value}
                            {termin.valueType === "%" ? "%" : " IDR"} • Category: {termin.category}
                          </p>
                          {termin.note && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Note: {termin.note}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant={
                          termin.status === "Approved" ? "default" : 
                          termin.status === "Rejected" ? "destructive" : 
                          "secondary"
                        }
                      >
                        {termin.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>Project invoices and payment tracking</CardDescription>
                </div>
                <Button disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Under Construction</h3>
                <p className="text-muted-foreground">This feature is currently being developed and will be available soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tax Invoices (Faktur Pajak)</CardTitle>
                  <CardDescription>Upload and manage tax invoices</CardDescription>
                </div>
                <Button disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Tax Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Under Construction</h3>
                <p className="text-muted-foreground">This feature is currently being developed and will be available soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contract">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contract Files</CardTitle>
                  <CardDescription>Upload and manage contract documents</CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedFiles.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete ({selectedFiles.length})
                    </Button>
                  )}
                  <Input
                    id="contract-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => onFileChange(e, "contract")}
                    disabled={uploading}
                  />
                  <Button asChild disabled={uploading}>
                    <label htmlFor="contract-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Contract"}
                    </label>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {contractFiles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No contract files uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contractFiles.length > 1 && (
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Checkbox
                        checked={selectedFiles.length === contractFiles.length && contractFiles.length > 0}
                        onCheckedChange={(checked) =>
                          handleSelectAll(contractFiles.length, checked as boolean)
                        }
                      />
                      <span className="text-sm text-muted-foreground">Select All</span>
                    </div>
                  )}
                  {contractFiles.map((contract: any, index: number) => (
                    <div
                      key={contract._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedFiles.includes(index)}
                          onCheckedChange={(checked) => handleFileSelect(index, checked as boolean)}
                        />
                        <FileText className="h-8 w-8 text-green-500" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{contract.name}</p>
                            <Badge variant="default">v{contract.version || 1}.0</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Uploaded by {getUserName(contract.createdBy)} •{" "}
                            {contract.createdAt
                              ? new Date(contract.createdAt).toLocaleString("en-US", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(contract.provider, contract.url, contract.name)}
                          title="View file"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(contract.provider, contract.url, contract.name)}
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSingle(index)}
                          title="Delete file"
                          disabled={deleting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <iframe src={previewUrl} className="w-full h-full" title="File preview" />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteConfirm?.indexes.length || 0} file(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={deleting} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

const tabs = [
  { value: "contract", label: "Contract Files" },
  { value: "termin", label: "Termin" },
  { value: "invoice", label: "Invoice" },
  { value: "tax", label: "Tax Invoice" },
]
