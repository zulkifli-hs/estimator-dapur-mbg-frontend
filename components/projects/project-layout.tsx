"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Download, Eye, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { uploadProjectFile, deleteProjectFiles } from "@/lib/api/files"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface ProjectLayoutProps {
  projectId: string
  project?: any
  onUpdate?: () => void
}

const getUserName = (createdBy: any) => {
  if (!createdBy) return "Unknown"
  if (typeof createdBy === "string") return createdBy
  if (createdBy.profile?.name) return createdBy.profile.name
  if (createdBy.email) return createdBy.email
  return "Unknown"
}

export function ProjectLayout({ projectId, project, onUpdate }: ProjectLayoutProps) {
  const projectDetail = project?.detail || {}
  const layoutFiles = projectDetail.layout || []
  const cadFiles = projectDetail.cad || []
  const shopDrawingFitout = projectDetail.shopDrawingFitout || []
  const shopDrawingFurniture = projectDetail.shopDrawingFurniture || []
  const approvedMaterial = projectDetail.approvedMaterial || []
  const approvedFurniture = projectDetail.approvedFurniture || []
  const contractFiles = projectDetail.contract || [] // Added contractFiles variable

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState("main-layout")
  const [selectedFiles, setSelectedFiles] = useState<Record<string, number[]>>({})
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; indexes: number[] } | null>(null)
  const { toast } = useToast()

  const tabs = [
    { value: "main-layout", label: "Main Layout" },
    { value: "cad", label: "CAD Files" },
    { value: "fitout", label: "Fitout Drawing" },
    { value: "furniture", label: "Furniture Drawing" },
    // { value: "material", label: "Approved Material" },
    // { value: "approved-furniture", label: "Approved Furniture" },
  ]

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

    console.log("[v0] handleFileUpload called:", {
      fileName: file.name,
      fileSize: file.size,
      type,
      projectId,
    })

    setUploading(true)
    try {
      console.log("[v0] Starting upload...")
      const result = await uploadProjectFile(projectId, file, type)
      console.log("[v0] Upload completed successfully:", result)

      toast({
        title: "Success",
        description: "File uploaded successfully",
      })

      if (onUpdate) {
        console.log("[v0] Calling onUpdate to refresh data")
        onUpdate()
      }
    } catch (error) {
      console.error("[v0] Upload error in handleFileUpload:", error)

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
      console.log("[v0] Upload process completed, uploading state reset")
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0]
    console.log("[v0] File selected:", { fileName: file?.name, fileType: type, fileSize: file?.size })
    if (file) {
      console.log("[v0] Calling handleFileUpload...")
      handleFileUpload(file, type)
    }
    e.target.value = ""
  }

  const handleFileSelect = (type: string, index: number, checked: boolean) => {
    setSelectedFiles((prev) => {
      const current = prev[type] || []
      if (checked) {
        return { ...prev, [type]: [...current, index] }
      }
      return { ...prev, [type]: current.filter((i) => i !== index) }
    })
  }

  const handleSelectAll = (type: string, fileCount: number, checked: boolean) => {
    setSelectedFiles((prev) => {
      if (checked) {
        return { ...prev, [type]: Array.from({ length: fileCount }, (_, i) => i) }
      }
      return { ...prev, [type]: [] }
    })
  }

  const handleDeleteSingle = (type: string, index: number) => {
    setDeleteConfirm({ type, indexes: [index] })
  }

  const handleBulkDelete = (type: string) => {
    const indexes = selectedFiles[type] || []
    if (indexes.length > 0) {
      setDeleteConfirm({ type, indexes })
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return

    setDeleting(true)
    try {
      await deleteProjectFiles(projectId, deleteConfirm.type, deleteConfirm.indexes)

      toast({
        title: "Success",
        description: `${deleteConfirm.indexes.length} file(s) deleted successfully`,
      })

      // Clear selection for this type
      setSelectedFiles((prev) => ({ ...prev, [deleteConfirm.type]: [] }))

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
        <TabsList className="hidden md:grid w-full grid-cols-4 lg:grid-cols-4 gap-1 h-auto p-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs lg:text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="main-layout" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Main Layout</CardTitle>
                  <CardDescription>Upload and manage main layout files</CardDescription>
                </div>
                <div className="flex gap-2">
                  {(selectedFiles["layout"]?.length || 0) > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBulkDelete("layout")}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete ({selectedFiles["layout"].length})
                    </Button>
                  )}
                  <Input
                    id="layout-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => onFileChange(e, "layout")}
                    disabled={uploading}
                  />
                  <Button asChild disabled={uploading}>
                    <label htmlFor="layout-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Layout"}
                    </label>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {layoutFiles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No layout files uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {layoutFiles.length > 1 && (
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Checkbox
                        checked={
                          (selectedFiles["layout"]?.length || 0) === layoutFiles.length &&
                          layoutFiles.length > 0
                        }
                        onCheckedChange={(checked) =>
                          handleSelectAll("layout", layoutFiles.length, checked as boolean)
                        }
                      />
                      <span className="text-sm text-muted-foreground">Select All</span>
                    </div>
                  )}
                  {layoutFiles.map((layout: any, index: number) => (
                    <div
                      key={layout._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedFiles["layout"]?.includes(index) || false}
                          onCheckedChange={(checked) =>
                            handleFileSelect("layout", index, checked as boolean)
                          }
                        />
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{layout.name}</p>
                            <Badge variant="default">v{layout.version || 1}.0</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Uploaded by {getUserName(layout.createdBy)} •{" "}
                            {layout.createdAt
                              ? new Date(layout.createdAt).toLocaleString("en-US", {
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
                          onClick={() => handleView(layout.provider, layout.url, layout.name)}
                          title="View file"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(layout.provider, layout.url, layout.name)}
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSingle("layout", index)}
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

        <TabsContent value="cad" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>CAD Files</CardTitle>
                  <CardDescription>Upload CAD files (DWG, DXF, DWF, STEP, IGES)</CardDescription>
                </div>
                <div className="flex gap-2">
                  {(selectedFiles["cad"]?.length || 0) > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBulkDelete("cad")}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete ({selectedFiles["cad"].length})
                    </Button>
                  )}
                  <Input
                    id="cad-upload"
                    type="file"
                    accept=".dwg,.dxf,.dwf,.step,.stp,.iges,.igs"
                    className="hidden"
                    onChange={(e) => onFileChange(e, "cad")}
                    disabled={uploading}
                  />
                  <Button asChild disabled={uploading}>
                    <label htmlFor="cad-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload CAD"}
                    </label>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cadFiles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No CAD files uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cadFiles.length > 1 && (
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Checkbox
                        checked={
                          (selectedFiles["cad"]?.length || 0) === cadFiles.length && cadFiles.length > 0
                        }
                        onCheckedChange={(checked) =>
                          handleSelectAll("cad", cadFiles.length, checked as boolean)
                        }
                      />
                      <span className="text-sm text-muted-foreground">Select All</span>
                    </div>
                  )}
                  {cadFiles.map((file: any, index: number) => (
                    <div
                      key={file._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedFiles["cad"]?.includes(index) || false}
                          onCheckedChange={(checked) => handleFileSelect("cad", index, checked as boolean)}
                        />
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{file.name}</p>
                            <Badge variant="default">v{file.version || 1}.0</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Uploaded by {getUserName(file.createdBy)} •{" "}
                            {file.createdAt
                              ? new Date(file.createdAt).toLocaleString("en-US", {
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
                          onClick={() => handleDownload(file.provider, file.url, file.name)}
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSingle("cad", index)}
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

        <TabsContent value="fitout" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Shop Drawing - Fitout</CardTitle>
                  <CardDescription>Upload and view fitout shop drawings</CardDescription>
                </div>
                <div className="flex gap-2">
                  {(selectedFiles["shop-drawing-fitout"]?.length || 0) > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBulkDelete("shop-drawing-fitout")}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete ({selectedFiles["shop-drawing-fitout"].length})
                    </Button>
                  )}
                  <Input
                    id="fitout-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => onFileChange(e, "shop-drawing-fitout")}
                    disabled={uploading}
                  />
                  <Button asChild disabled={uploading}>
                    <label htmlFor="fitout-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Drawing"}
                    </label>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {shopDrawingFitout.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No fitout shop drawings uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shopDrawingFitout.length > 1 && (
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Checkbox
                        checked={
                          (selectedFiles["shop-drawing-fitout"]?.length || 0) === shopDrawingFitout.length &&
                          shopDrawingFitout.length > 0
                        }
                        onCheckedChange={(checked) =>
                          handleSelectAll("shop-drawing-fitout", shopDrawingFitout.length, checked as boolean)
                        }
                      />
                      <span className="text-sm text-muted-foreground">Select All</span>
                    </div>
                  )}
                  {shopDrawingFitout.map((drawing: any, index: number) => (
                    <div
                      key={drawing._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedFiles["shop-drawing-fitout"]?.includes(index) || false}
                          onCheckedChange={(checked) =>
                            handleFileSelect("shop-drawing-fitout", index, checked as boolean)
                          }
                        />
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{drawing.name}</p>
                            <Badge variant="default">v{drawing.version || 1}.0</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Uploaded by {getUserName(drawing.createdBy)} •{" "}
                            {drawing.createdAt
                              ? new Date(drawing.createdAt).toLocaleString("en-US", {
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
                          onClick={() => handleView(drawing.provider, drawing.url, drawing.name)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(drawing.provider, drawing.url, drawing.name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSingle("shop-drawing-fitout", index)}
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

        <TabsContent value="furniture" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Shop Drawing - Furniture</CardTitle>
                  <CardDescription>Upload and view furniture shop drawings</CardDescription>
                </div>
                <div className="flex gap-2">
                  {(selectedFiles["shop-drawing-furniture"]?.length || 0) > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBulkDelete("shop-drawing-furniture")}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete ({selectedFiles["shop-drawing-furniture"].length})
                    </Button>
                  )}
                  <Input
                    id="furniture-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => onFileChange(e, "shop-drawing-furniture")}
                    disabled={uploading}
                  />
                  <Button asChild disabled={uploading}>
                    <label htmlFor="furniture-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Drawing"}
                    </label>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {shopDrawingFurniture.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No furniture shop drawings uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shopDrawingFurniture.length > 1 && (
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Checkbox
                        checked={
                          (selectedFiles["shop-drawing-furniture"]?.length || 0) ===
                            shopDrawingFurniture.length && shopDrawingFurniture.length > 0
                        }
                        onCheckedChange={(checked) =>
                          handleSelectAll(
                            "shop-drawing-furniture",
                            shopDrawingFurniture.length,
                            checked as boolean
                          )
                        }
                      />
                      <span className="text-sm text-muted-foreground">Select All</span>
                    </div>
                  )}
                  {shopDrawingFurniture.map((drawing: any, index: number) => (
                    <div
                      key={drawing._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedFiles["shop-drawing-furniture"]?.includes(index) || false}
                          onCheckedChange={(checked) =>
                            handleFileSelect("shop-drawing-furniture", index, checked as boolean)
                          }
                        />
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{drawing.name}</p>
                            <Badge variant="default">v{drawing.version || 1}.0</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Uploaded by {getUserName(drawing.createdBy)} •{" "}
                            {drawing.createdAt
                              ? new Date(drawing.createdAt).toLocaleString("en-US", {
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
                          onClick={() => handleView(drawing.provider, drawing.url, drawing.name)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(drawing.provider, drawing.url, drawing.name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSingle("shop-drawing-furniture", index)}
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

        <TabsContent value="material" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Approved Material</CardTitle>
                  <CardDescription>Upload and manage approved material documents</CardDescription>
                </div>
                <div>
                  <Input
                    id="material-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => onFileChange(e, "approved-material")}
                    disabled={uploading}
                  />
                  <Button asChild disabled={uploading}>
                    <label htmlFor="material-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Material"}
                    </label>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {approvedMaterial.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No approved material documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvedMaterial.map((material: any) => (
                    <div
                      key={material._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{material.name}</p>
                            <Badge variant="default">v{material.version || 1}.0</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Uploaded by {getUserName(material.createdBy)} •{" "}
                            {material.createdAt
                              ? new Date(material.createdAt).toLocaleString("en-US", {
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
                          onClick={() => handleView(material.provider, material.url, material.name)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(material.provider, material.url, material.name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved-furniture" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Approved Furniture</CardTitle>
                  <CardDescription>Upload and manage approved furniture documents</CardDescription>
                </div>
                <div>
                  <Input
                    id="approved-furniture-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => onFileChange(e, "approved-furniture")}
                    disabled={uploading}
                  />
                  <Button asChild disabled={uploading}>
                    <label htmlFor="approved-furniture-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Furniture"}
                    </label>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {approvedFurniture.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No approved furniture documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvedFurniture.map((furniture: any) => (
                    <div
                      key={furniture._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{furniture.name}</p>
                            <Badge variant="default">v{furniture.version || 1}.0</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Uploaded by {getUserName(furniture.createdBy)} •{" "}
                            {furniture.createdAt
                              ? new Date(furniture.createdAt).toLocaleString("en-US", {
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
                          onClick={() => handleView(furniture.provider, furniture.url, furniture.name)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(furniture.provider, furniture.url, furniture.name)}
                        >
                          <Download className="h-4 w-4" />
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

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewUrl && (
              <object data={previewUrl} type="application/pdf" className="w-full h-full" aria-label="PDF preview">
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl)}&embedded=true`}
                  className="w-full h-full border-0"
                  title="PDF preview"
                >
                  <p className="text-center text-muted-foreground py-8">
                    Unable to display PDF. Please{" "}
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      download the file
                    </a>{" "}
                    to view.
                  </p>
                </iframe>
              </object>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
