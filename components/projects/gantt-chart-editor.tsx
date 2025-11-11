"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { boqApi } from "@/lib/api/boq"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Save } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface GanttChartEditorProps {
  projectId: string
  boq: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function GanttChartEditor({ projectId, boq, open, onOpenChange, onSuccess }: GanttChartEditorProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [ganttData, setGanttData] = useState<any>({
    preliminary: [],
    fittingOut: [],
    furnitureWork: [],
  })

  useEffect(() => {
    if (open && boq) {
      // Initialize with existing dates or empty strings
      const preliminary =
        boq.preliminary?.map((item: any) => ({
          name: item.name,
          startDate: item.startDate?.split("T")[0] || "",
          endDate: item.endDate?.split("T")[0] || "",
        })) || []

      const fittingOut =
        boq.fittingOut?.map((category: any) => ({
          name: category.name,
          products:
            category.products?.map((product: any) => ({
              name: product.name,
              startDate: product.startDate?.split("T")[0] || "",
              endDate: product.endDate?.split("T")[0] || "",
            })) || [],
        })) || []

      const furnitureWork =
        boq.furnitureWork?.map((category: any) => ({
          name: category.name,
          products:
            category.products?.map((product: any) => ({
              name: product.name,
              startDate: product.startDate?.split("T")[0] || "",
              endDate: product.endDate?.split("T")[0] || "",
            })) || [],
        })) || []

      setGanttData({ preliminary, fittingOut, furnitureWork })
    }
  }, [open, boq])

  const handleSubmit = async () => {
    try {
      setLoading(true)

      // Prepare data for API (remove names, keep only dates)
      const apiData = {
        preliminary: ganttData.preliminary.map((item: any) => ({
          startDate: item.startDate,
          endDate: item.endDate,
        })),
        fittingOut: ganttData.fittingOut.map((category: any) => ({
          name: category.name,
          products: category.products.map((product: any) => ({
            startDate: product.startDate,
            endDate: product.endDate,
          })),
        })),
        furnitureWork: ganttData.furnitureWork.map((category: any) => ({
          name: category.name,
          products: category.products.map((product: any) => ({
            startDate: product.startDate,
            endDate: product.endDate,
          })),
        })),
      }

      console.log("[v0] Gantt chart update data:", JSON.stringify(apiData, null, 2))
      console.log("[v0] Project ID:", projectId)
      console.log("[v0] BOQ ID:", boq._id)

      await boqApi.updateGanttChart(projectId, boq._id, apiData)

      toast({
        title: "Success",
        description: "Gantt chart updated successfully",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Failed to update gantt chart:", error)
      console.error("[v0] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update gantt chart",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updatePreliminaryDate = (index: number, field: "startDate" | "endDate", value: string) => {
    const updated = [...ganttData.preliminary]
    updated[index][field] = value
    setGanttData({ ...ganttData, preliminary: updated })
  }

  const updateFittingOutDate = (catIndex: number, prodIndex: number, field: "startDate" | "endDate", value: string) => {
    const updated = [...ganttData.fittingOut]
    updated[catIndex].products[prodIndex][field] = value
    setGanttData({ ...ganttData, fittingOut: updated })
  }

  const updateFurnitureDate = (catIndex: number, prodIndex: number, field: "startDate" | "endDate", value: string) => {
    const updated = [...ganttData.furnitureWork]
    updated[catIndex].products[prodIndex][field] = value
    setGanttData({ ...ganttData, furnitureWork: updated })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Edit Gantt Chart Timeline
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preliminary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preliminary">Preliminary</TabsTrigger>
            <TabsTrigger value="fitting">Fitting Out</TabsTrigger>
            <TabsTrigger value="furniture">Furniture</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="preliminary" className="space-y-4 pr-4">
              {ganttData.preliminary.map((item: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-sm">{item.name}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="mb-1.5 block">Start Date</Label>
                      <Input
                        type="date"
                        value={item.startDate}
                        onChange={(e) => updatePreliminaryDate(index, "startDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="mb-1.5 block">End Date</Label>
                      <Input
                        type="date"
                        value={item.endDate}
                        onChange={(e) => updatePreliminaryDate(index, "endDate", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="fitting" className="space-y-4 pr-4">
              {ganttData.fittingOut.map((category: any, catIndex: number) => (
                <div key={catIndex} className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-primary">{category.name}</h3>
                  {category.products.map((product: any, prodIndex: number) => (
                    <div key={prodIndex} className="border-l-2 border-muted pl-4 space-y-3">
                      <h4 className="font-medium text-sm">{product.name}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="mb-1.5 block">Start Date</Label>
                          <Input
                            type="date"
                            value={product.startDate}
                            onChange={(e) => updateFittingOutDate(catIndex, prodIndex, "startDate", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="mb-1.5 block">End Date</Label>
                          <Input
                            type="date"
                            value={product.endDate}
                            onChange={(e) => updateFittingOutDate(catIndex, prodIndex, "endDate", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="furniture" className="space-y-4 pr-4">
              {ganttData.furnitureWork.map((category: any, catIndex: number) => (
                <div key={catIndex} className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-primary">{category.name}</h3>
                  {category.products.map((product: any, prodIndex: number) => (
                    <div key={prodIndex} className="border-l-2 border-muted pl-4 space-y-3">
                      <h4 className="font-medium text-sm">{product.name}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="mb-1.5 block">Start Date</Label>
                          <Input
                            type="date"
                            value={product.startDate}
                            onChange={(e) => updateFurnitureDate(catIndex, prodIndex, "startDate", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="mb-1.5 block">End Date</Label>
                          <Input
                            type="date"
                            value={product.endDate}
                            onChange={(e) => updateFurnitureDate(catIndex, prodIndex, "endDate", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Timeline"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
