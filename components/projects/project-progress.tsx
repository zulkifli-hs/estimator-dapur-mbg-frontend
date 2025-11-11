"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Calendar, ImageIcon, TrendingUp, FileCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface ProjectProgressProps {
  projectId: string
}

export function ProjectProgress({ projectId }: ProjectProgressProps) {
  const [activeTab, setActiveTab] = useState("gantt")

  const tabs = [
    { value: "gantt", label: "Gantt Chart" },
    { value: "photos", label: "Project Photos" },
    { value: "scurve", label: "S Curve" },
    { value: "bast", label: "BAST/BAPP" },
  ]

  // Dummy data for project photos
  const projectPhotos = [
    { id: 1, title: "Site Preparation", date: "2025-01-05", photos: 12 },
    { id: 2, title: "Foundation Work", date: "2025-01-10", photos: 8 },
    { id: 3, title: "Partition Installation", date: "2025-01-15", photos: 15 },
  ]

  // Dummy data for BAST/BAPP
  const bastDocuments = [
    { id: 1, type: "BAST", title: "Handover Phase 1", date: "2025-01-20", status: "Signed" },
    { id: 2, type: "BAPP", title: "Progress Payment 1", date: "2025-01-15", status: "Approved" },
    { id: 3, type: "BAST", title: "Material Delivery", date: "2025-01-10", status: "Pending" },
  ]

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
        <TabsList className="hidden md:grid w-full grid-cols-4">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="gantt">
          <Card>
            <CardHeader>
              <CardTitle>Gantt Chart</CardTitle>
              <CardDescription>Project timeline and task scheduling</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[400px] border-2 border-dashed rounded-lg">
                <div className="text-center space-y-2">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Gantt Chart visualization will be displayed here</p>
                  <p className="text-sm text-muted-foreground">Integration with project management tools coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Photos</CardTitle>
                  <CardDescription>Progress documentation and site photos</CardDescription>
                </div>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projectPhotos.map((album) => (
                  <Card key={album.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold mb-1">{album.title}</h3>
                      <p className="text-sm text-muted-foreground">{album.date}</p>
                      <Badge variant="secondary" className="mt-2">
                        {album.photos} photos
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scurve">
          <Card>
            <CardHeader>
              <CardTitle>S Curve</CardTitle>
              <CardDescription>Project progress vs planned progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[400px] border-2 border-dashed rounded-lg">
                <div className="text-center space-y-2">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">S Curve chart will be displayed here</p>
                  <p className="text-sm text-muted-foreground">Showing planned vs actual progress over time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bast">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>BAST/BAPP Documents</CardTitle>
                  <CardDescription>Handover and progress payment documents</CardDescription>
                </div>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bastDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <FileCheck className="h-8 w-8 text-primary" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{doc.type}</Badge>
                          <p className="font-medium">{doc.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{doc.date}</p>
                      </div>
                    </div>
                    <Badge variant={doc.status === "Signed" || doc.status === "Approved" ? "default" : "secondary"}>
                      {doc.status}
                    </Badge>
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
