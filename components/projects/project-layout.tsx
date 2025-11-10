"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Download, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ProjectLayoutProps {
  projectId: string
  project?: any
}

export function ProjectLayout({ projectId, project }: ProjectLayoutProps) {
  const projectDetail = project?.detail || {}
  const mainLayout = projectDetail.layout
  const shopDrawingFitout = projectDetail.shopDrawingFitout || []
  const shopDrawingFurniture = projectDetail.shopDrawingFurniture || []

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const getFileUrl = (provider: string, url: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.gema-interior.com"
    return `${baseUrl}/public/${provider}/${url}`
  }

  // Dummy data for layout revisions (fallback if no real data)
  const layoutRevisions = mainLayout
    ? [
        {
          id: mainLayout._id,
          version: `v${mainLayout.version || 1}.0`,
          date: mainLayout.createdAt ? format(new Date(mainLayout.createdAt), "yyyy-MM-dd") : "N/A",
          uploadedBy: mainLayout.createdBy || "Unknown",
          status: "Current",
          file: mainLayout.name,
          url: mainLayout.url,
          provider: mainLayout.provider,
        },
      ]
    : []

  const cadFiles = [
    { id: 1, name: "Building-Floor-1.dwg", uploadedBy: "John Doe", date: "2025-01-10", size: "2.4 MB" },
    { id: 2, name: "Building-Floor-2.dwg", uploadedBy: "Jane Smith", date: "2025-01-10", size: "2.1 MB" },
  ]

  const handleDownload = (provider: string, url: string, filename: string) => {
    const fileUrl = getFileUrl(provider, url)
    window.open(fileUrl, "_blank")
  }

  const handleView = (provider: string, url: string) => {
    const fileUrl = getFileUrl(provider, url)
    setPreviewUrl(fileUrl)
    setPreviewOpen(true)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="main-layout" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="main-layout">Main Layout</TabsTrigger>
          <TabsTrigger value="cad">CAD Files</TabsTrigger>
          <TabsTrigger value="fitout">Shop Drawing Fitout</TabsTrigger>
          <TabsTrigger value="furniture">Shop Drawing Furniture</TabsTrigger>
        </TabsList>

        <TabsContent value="main-layout" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Main Layout</CardTitle>
                  <CardDescription>Upload and manage main layout revisions</CardDescription>
                </div>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Version
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {layoutRevisions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No layout files uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {layoutRevisions.map((revision) => (
                    <div
                      key={revision.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{revision.file}</p>
                            <Badge variant={revision.status === "Current" ? "default" : "secondary"}>
                              {revision.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {revision.version} • Uploaded by {revision.uploadedBy} on {revision.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(revision.provider, revision.url)}
                          title="View file"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(revision.provider, revision.url, revision.file)}
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
                  <CardDescription>Upload CAD files of empty building structure</CardDescription>
                </div>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CAD File
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cadFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.size} • Uploaded by {file.uploadedBy} on {file.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Drawing
                </Button>
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
                        <Button variant="ghost" size="icon" onClick={() => handleView(drawing.provider, drawing.url)}>
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
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Drawing
                </Button>
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
                        <Button variant="ghost" size="icon" onClick={() => handleView(drawing.provider, drawing.url)}>
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
      </Tabs>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[calc(90vh-100px)]">
            {previewUrl && (
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="Preview"
                className="w-full h-auto"
                onError={(e) => {
                  // If image fails to load, show message
                  e.currentTarget.style.display = "none"
                  e.currentTarget.parentElement!.innerHTML =
                    '<p class="text-center text-muted-foreground py-8">Preview not available. Please download the file to view.</p>'
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
