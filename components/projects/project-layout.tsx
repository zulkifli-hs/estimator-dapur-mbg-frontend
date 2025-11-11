"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Download, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { uploadProjectFile } from "@/lib/api/files"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProjectLayoutProps {
  projectId: string
  project?: any
  onUpdate?: () => void
}

export function ProjectLayout({ projectId, project, onUpdate }: ProjectLayoutProps) {
  const projectDetail = project?.detail || {}
  const layoutFiles = projectDetail.layout || []
  const cadFiles = projectDetail.cad || []
  const shopDrawingFitout = projectDetail.shopDrawingFitout || []
  const shopDrawingFurniture = projectDetail.shopDrawingFurniture || []
  const approvedMaterial = projectDetail.approvedMaterial || []
  const approvedFurniture = projectDetail.approvedFurniture || []

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState("main-layout")
  const { toast } = useToast()

  const tabs = [
    { value: "main-layout", label: "Main Layout" },
    { value: "cad", label: "CAD Files" },
    { value: "fitout", label: "Fitout Drawing" },
    { value: "furniture", label: "Furniture Drawing" },
    { value: "material", label: "Approved Material" },
    { value: "approved-furniture", label: "Approved Furniture" },
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
      toast({
        title: "Error",
        description: "Failed to upload file",
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
        <TabsList className="hidden md:grid w-full grid-cols-3 lg:grid-cols-6">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
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
                <div>
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
                  {layoutFiles.map((layout: any) => (
                    <div
                      key={layout._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{layout.name}</p>
                            <Badge variant="default">v{layout.version || 1}.0</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Uploaded by {layout.createdBy || "Unknown"} •{" "}
                            {layout.createdAt ? format(new Date(layout.createdAt), "yyyy-MM-dd") : "N/A"}
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
                  <CardTitle>CAD Files - Empty Building</CardTitle>
                  <CardDescription>Upload CAD files (.dwg) of empty building structure</CardDescription>
                </div>
                <div>
                  <Input
                    id="cad-upload"
                    type="file"
                    accept=".dwg,.dxf,.pdf"
                    className="hidden"
                    onChange={(e) => onFileChange(e, "cad")}
                    disabled={uploading}
                  />
                  <Button asChild disabled={uploading}>
                    <label htmlFor="cad-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload CAD File"}
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
                  {cadFiles.map((file: any) => (
                    <div
                      key={file._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded by {file.createdBy || "Unknown"} •{" "}
                            {file.createdAt ? format(new Date(file.createdAt), "yyyy-MM-dd") : "N/A"}
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
                <div>
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
                  {shopDrawingFitout.map((drawing: any) => (
                    <div
                      key={drawing._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{drawing.name}</p>
                            <Badge variant={drawing.status === "Approved" ? "default" : "secondary"}>
                              {drawing.status || "Pending"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            v{drawing.version || 1}.0 •{" "}
                            {drawing.createdAt ? format(new Date(drawing.createdAt), "yyyy-MM-dd") : "N/A"}
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
                <div>
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
                  {shopDrawingFurniture.map((drawing: any) => (
                    <div
                      key={drawing._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{drawing.name}</p>
                            <Badge variant={drawing.status === "Approved" ? "default" : "secondary"}>
                              {drawing.status || "Pending"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            v{drawing.version || 1}.0 •{" "}
                            {drawing.createdAt ? format(new Date(drawing.createdAt), "yyyy-MM-dd") : "N/A"}
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
                            <Badge variant="default">Approved</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {material.createdAt ? format(new Date(material.createdAt), "yyyy-MM-dd") : "N/A"}
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
                            <Badge variant="default">Approved</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {furniture.createdAt ? format(new Date(furniture.createdAt), "yyyy-MM-dd") : "N/A"}
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
    </div>
  )
}
