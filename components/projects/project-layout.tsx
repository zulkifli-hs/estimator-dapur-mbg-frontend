"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Download, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ProjectLayoutProps {
  projectId: string
}

export function ProjectLayout({ projectId }: ProjectLayoutProps) {
  // Dummy data for layout revisions
  const layoutRevisions = [
    {
      id: 1,
      version: "v3.0",
      date: "2025-01-15",
      uploadedBy: "John Doe",
      status: "Current",
      file: "main-layout-v3.pdf",
    },
    {
      id: 2,
      version: "v2.1",
      date: "2025-01-10",
      uploadedBy: "Jane Smith",
      status: "Revised",
      file: "main-layout-v2.1.pdf",
    },
    {
      id: 3,
      version: "v2.0",
      date: "2025-01-05",
      uploadedBy: "John Doe",
      status: "Revised",
      file: "main-layout-v2.pdf",
    },
    {
      id: 4,
      version: "v1.0",
      date: "2024-12-20",
      uploadedBy: "Jane Smith",
      status: "Initial",
      file: "main-layout-v1.pdf",
    },
  ]

  const cadFiles = [
    { id: 1, name: "Building-Floor-1.dwg", uploadedBy: "John Doe", date: "2025-01-10", size: "2.4 MB" },
    { id: 2, name: "Building-Floor-2.dwg", uploadedBy: "Jane Smith", date: "2025-01-10", size: "2.1 MB" },
  ]

  const shopDrawingFitout = [
    { id: 1, name: "Partition-Layout.pdf", version: "v2.0", date: "2025-01-12", status: "Approved" },
    { id: 2, name: "Ceiling-Plan.pdf", version: "v1.5", date: "2025-01-11", status: "Under Review" },
    { id: 3, name: "Electrical-Layout.pdf", version: "v1.0", date: "2025-01-10", status: "Approved" },
  ]

  const shopDrawingFurniture = [
    { id: 1, name: "Workstation-Layout.pdf", version: "v2.0", date: "2025-01-14", status: "Approved" },
    { id: 2, name: "Meeting-Room-Furniture.pdf", version: "v1.0", date: "2025-01-13", status: "Approved" },
  ]

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
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
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
              <div className="space-y-3">
                {shopDrawingFitout.map((drawing) => (
                  <div
                    key={drawing.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{drawing.name}</p>
                          <Badge variant={drawing.status === "Approved" ? "default" : "secondary"}>
                            {drawing.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {drawing.version} • {drawing.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
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
              <div className="space-y-3">
                {shopDrawingFurniture.map((drawing) => (
                  <div
                    key={drawing.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{drawing.name}</p>
                          <Badge variant={drawing.status === "Approved" ? "default" : "secondary"}>
                            {drawing.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {drawing.version} • {drawing.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
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
      </Tabs>
    </div>
  )
}
