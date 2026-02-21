"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Wrench, Hammer, Building2, MoreHorizontal } from "lucide-react"

interface ProjectProcurementProps {
  projectId: string
}

export function ProjectProcurement({ projectId }: ProjectProcurementProps) {
  const [activeSubTab, setActiveSubTab] = useState("vendor")

  const subTabs = [
    { value: "vendor", label: "Vendor", icon: Package },
    { value: "mep", label: "MEP", icon: Wrench },
    { value: "workshop", label: "Workshop", icon: Hammer },
    { value: "internal", label: "Internal", icon: Building2 },
    { value: "others", label: "Others", icon: MoreHorizontal },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Procurement</h2>
        <p className="text-muted-foreground">Manage procurement for vendors, MEP, workshop, and more</p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          {subTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="vendor">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Procurement</CardTitle>
              <CardDescription>Manage vendor procurement and orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>Vendor procurement content coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mep">
          <Card>
            <CardHeader>
              <CardTitle>MEP Procurement</CardTitle>
              <CardDescription>Manage Mechanical, Electrical, and Plumbing procurement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>MEP procurement content coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workshop">
          <Card>
            <CardHeader>
              <CardTitle>Workshop Procurement</CardTitle>
              <CardDescription>Manage workshop materials and equipment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>Workshop procurement content coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="internal">
          <Card>
            <CardHeader>
              <CardTitle>Internal Procurement</CardTitle>
              <CardDescription>Manage internal procurement and resources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>Internal procurement content coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="others">
          <Card>
            <CardHeader>
              <CardTitle>Others Procurement</CardTitle>
              <CardDescription>Manage other procurement items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>Others procurement content coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
