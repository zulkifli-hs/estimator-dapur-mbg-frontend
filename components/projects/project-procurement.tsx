"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Package, Wrench, Hammer, Building2, MoreHorizontal, Image, FileCheck, StickyNote, ExternalLink, Pencil } from "lucide-react"
import { boqApi } from "@/lib/api/boq"

interface ProjectProcurementProps {
  projectId: string
}

interface BOQItem {
  productId?: string
  qty: number
  name: string
  unit: string
  price: number
  location?: string
  brand?: string
  tags?: string[]
  image?: {
    url: string
    provider: string
    note?: string
  }
  approval?: {
    url: string
    provider: string
    note?: string
  }
  noteImage?: {
    url: string
    provider: string
    note?: string
  }
  note?: string
  finishing?: string
  type?: string
  code?: string
  spesification?: string
  _source?: string
  _category?: string
  _boqId?: string
  _boqNumber?: number
  _section?: string
  _itemIndex?: number
  _categoryIndex?: number
}

interface GroupedItems {
  vendor: BOQItem[]
  mep: BOQItem[]
  workshop: BOQItem[]
  internal: BOQItem[]
  others: BOQItem[]
}

export function ProjectProcurement({ projectId }: ProjectProcurementProps) {
  const { toast } = useToast()
  const [activeSubTab, setActiveSubTab] = useState("vendor")
  const [loading, setLoading] = useState(true)
  const [groupedItems, setGroupedItems] = useState<GroupedItems>({
    vendor: [],
    mep: [],
    workshop: [],
    internal: [],
    others: [],
  })
  const [selectedOthersTag, setSelectedOthersTag] = useState<string>("all")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BOQItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [allBOQs, setAllBOQs] = useState<any[]>([])

  useEffect(() => {
    if (projectId) {
      fetchAndGroupBOQItems()
    }
  }, [projectId])

  const fetchAndGroupBOQItems = async () => {
    try {
      setLoading(true)
      const response = await boqApi.getByProject(projectId)
      
      if (response.success && response.data) {
        const boqItems = response.data
        setAllBOQs(boqItems) // Store complete BOQ data
        const allItems: BOQItem[] = []

        // Process each BOQ (main and additional)
        boqItems.forEach((boq: any) => {
          const source = boq.number === 1 ? "Main BOQ" : `Additional BOQ #${boq.number}`

          // Preliminary items
          boq.preliminary?.forEach((item: any, index: number) => {
            allItems.push({
              ...item,
              _source: source,
              _category: "Preliminary",
              _boqId: boq._id,
              _boqNumber: boq.number,
              _section: "preliminary",
              _itemIndex: index,
            })
          })

          // Fitting Out items
          boq.fittingOut?.forEach((category: any, categoryIndex: number) => {
            category.products?.forEach((product: any, productIndex: number) => {
              allItems.push({
                ...product,
                _source: source,
                _category: `Fitting Out - ${category.name}`,
                _boqId: boq._id,
                _boqNumber: boq.number,
                _section: "fittingOut",
                _categoryIndex: categoryIndex,
                _itemIndex: productIndex,
              })
            })
          })

          // Furniture Work items
          boq.furnitureWork?.forEach((category: any, categoryIndex: number) => {
            category.products?.forEach((product: any, productIndex: number) => {
              allItems.push({
                ...product,
                _source: source,
                _category: `Furniture Work - ${category.name}`,
                _boqId: boq._id,
                _boqNumber: boq.number,
                _section: "furnitureWork",
                _categoryIndex: categoryIndex,
                _itemIndex: productIndex,
              })
            })
          })

          // Mechanical/Electrical items
          boq.mechanicalElectrical?.forEach((category: any, categoryIndex: number) => {
            category.products?.forEach((product: any, productIndex: number) => {
              allItems.push({
                ...product,
                _source: source,
                _category: `MEP - ${category.name}`,
                _boqId: boq._id,
                _boqNumber: boq.number,
                _section: "mechanicalElectrical",
                _categoryIndex: categoryIndex,
                _itemIndex: productIndex,
              })
            })
          })
        })

        // Group items by tags
        const grouped: GroupedItems = {
          vendor: [],
          mep: [],
          workshop: [],
          internal: [],
          others: [],
        }

        allItems.forEach((item) => {
          if (!item.tags || item.tags.length === 0) {
            grouped.others.push(item)
            return
          }

          // Map tags to categories
          const tags = item.tags.map(tag => tag.toLowerCase())
          
          if (tags.some(tag => tag.includes('vendor') || tag.includes('supplier'))) {
            grouped.vendor.push(item)
          } else if (tags.some(tag => 
            tag.includes('mep') || 
            tag.includes('mechanical') || 
            tag.includes('electrical') || 
            tag.includes('plumbing')
          )) {
            grouped.mep.push(item)
          } else if (tags.some(tag => tag.includes('workshop') || tag.includes('fabrication'))) {
            grouped.workshop.push(item)
          } else if (tags.some(tag => tag.includes('internal') || tag.includes('in-house'))) {
            grouped.internal.push(item)
          } else {
            grouped.others.push(item)
          }
        })

        setGroupedItems(grouped)
      }
    } catch (error) {
      console.error("Failed to fetch BOQ items:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleEditItem = (item: BOQItem) => {
    setEditingItem(item)
    setEditDialogOpen(true)
  }

  const handleSaveItem = async () => {
    if (!editingItem || !editingItem._boqId) return

    try {
      setSaving(true)

      // Find the BOQ that contains this item
      const boq = allBOQs.find((b) => b._id === editingItem._boqId)
      if (!boq) {
        toast({
          title: "Error",
          description: "BOQ not found",
          variant: "destructive",
        })
        return
      }

      // Create a deep copy of the BOQ
      const updatedBOQ = JSON.parse(JSON.stringify(boq))

      // Remove metadata fields from editing item
      const cleanItem = { ...editingItem }
      delete cleanItem._source
      delete cleanItem._category
      delete cleanItem._boqId
      delete cleanItem._boqNumber
      delete cleanItem._section
      delete cleanItem._itemIndex
      delete cleanItem._categoryIndex

      // Update the specific item in the BOQ structure
      if (editingItem._section === "preliminary") {
        updatedBOQ.preliminary[editingItem._itemIndex!] = cleanItem
      } else if (editingItem._section === "fittingOut") {
        updatedBOQ.fittingOut[editingItem._categoryIndex!].products[editingItem._itemIndex!] = cleanItem
      } else if (editingItem._section === "furnitureWork") {
        updatedBOQ.furnitureWork[editingItem._categoryIndex!].products[editingItem._itemIndex!] = cleanItem
      } else if (editingItem._section === "mechanicalElectrical") {
        updatedBOQ.mechanicalElectrical[editingItem._categoryIndex!].products[editingItem._itemIndex!] = cleanItem
      }

      // Prepare the payload
      const payload = {
        preliminary: updatedBOQ.preliminary || [],
        fittingOut: updatedBOQ.fittingOut || [],
        furnitureWork: updatedBOQ.furnitureWork || [],
        mechanicalElectrical: updatedBOQ.mechanicalElectrical || [],
      }

      // Call the update API
      const response = await boqApi.update(projectId, editingItem._boqId, payload)

      if (response.success) {
        toast({
          title: "Success",
          description: "Item updated successfully",
        })
        setEditDialogOpen(false)
        setEditingItem(null)
        // Refresh the data
        fetchAndGroupBOQItems()
      } else {
        toast({
          title: "Error",
          description: "Failed to update item",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Failed to update item:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const renderItemsTable = (items: BOQItem[], title: string) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )
    }

    if (items.length === 0) {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <p>No {title.toLowerCase()} items found</p>
        </div>
      )
    }

    return (
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead className="min-w-50">Item Name</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-center">Image</TableHead>
              <TableHead className="text-center">Approval</TableHead>
              <TableHead className="text-center">Note Image</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Finishing</TableHead>
              <TableHead>Specification</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={`${item._source}-${item.name}-${index}`}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">{item.name || "-"}</TableCell>
                <TableCell>
                  <Badge variant={item._source?.includes("Main") ? "default" : "secondary"} className="whitespace-nowrap">
                    {item._source || "-"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {item.image?.url ? (
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/${item.image.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      title={item.image.note || "View image"}
                    >
                      <Image className="h-4 w-4" />
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {item.approval?.url ? (
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/${item.approval.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-green-600 hover:text-green-800"
                      title={item.approval.note || "View approval"}
                    >
                      <FileCheck className="h-4 w-4" />
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {item.noteImage?.url ? (
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/${item.noteImage.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-800"
                      title={item.noteImage.note || "View note image"}
                    >
                      <StickyNote className="h-4 w-4" />
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{item.code || "-"}</TableCell>
                <TableCell>{item.type || "-"}</TableCell>
                <TableCell>{item.finishing || "-"}</TableCell>
                <TableCell className="max-w-50">
                  <div className="truncate" title={item.spesification || "-"}>
                    {item.spesification || "-"}
                  </div>
                </TableCell>
                <TableCell className="max-w-50">
                  <div className="truncate" title={item.note || "-"}>
                    {item.note || "-"}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditItem(item)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  // Get unique tags from Others items
  const getOthersTags = () => {
    const tags = new Set<string>()
    groupedItems.others.forEach((item) => {
      if (item.tags && item.tags.length > 0) {
        item.tags.forEach((tag) => tags.add(tag))
      }
    })
    return Array.from(tags).sort()
  }

  // Filter Others items based on selected tag
  const getFilteredOthersItems = () => {
    if (selectedOthersTag === "all") {
      return groupedItems.others
    } else if (selectedOthersTag === "no-tag") {
      return groupedItems.others.filter((item) => !item.tags || item.tags.length === 0)
    } else {
      return groupedItems.others.filter((item) => item.tags?.includes(selectedOthersTag))
    }
  }

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
              {renderItemsTable(groupedItems.vendor, "Vendor")}
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
              {renderItemsTable(groupedItems.mep, "MEP")}
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
              {renderItemsTable(groupedItems.workshop, "Workshop")}
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
              {renderItemsTable(groupedItems.internal, "Internal")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="others">
          <Card>
            <CardHeader>
              <CardTitle>Others Procurement</CardTitle>
              <CardDescription>Manage other procurement items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tag Filter */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Filter by tag:</span>
                <Select value={selectedOthersTag} onValueChange={setSelectedOthersTag}>
                  <SelectTrigger className="w-50">
                    <SelectValue placeholder="Select tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="no-tag">No Tag</SelectItem>
                    {getOthersTags().map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedOthersTag !== "all" && (
                  <Badge variant="secondary">
                    {selectedOthersTag === "no-tag" 
                      ? `No Tag (${getFilteredOthersItems().length})` 
                      : `${selectedOthersTag} (${getFilteredOthersItems().length})`}
                  </Badge>
                )}
              </div>
              {/* Items Table */}
              {renderItemsTable(getFilteredOthersItems(), "Others")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Update the item details below</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={editingItem.name || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    value={editingItem.code || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    value={editingItem.type || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="finishing">Finishing</Label>
                  <Input
                    id="finishing"
                    value={editingItem.finishing || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, finishing: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specification">Specification</Label>
                <Textarea
                  id="specification"
                  value={editingItem.spesification || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, spesification: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  value={editingItem.note || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, note: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold">Image</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">URL</Label>
                    <Input
                      id="imageUrl"
                      value={editingItem.image?.url || ""}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        image: { ...editingItem.image, url: e.target.value, provider: editingItem.image?.provider || "local" } as any
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imageProvider">Provider</Label>
                    <Input
                      id="imageProvider"
                      value={editingItem.image?.provider || ""}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        image: { ...editingItem.image, provider: e.target.value, url: editingItem.image?.url || "" } as any
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imageNote">Note</Label>
                    <Input
                      id="imageNote"
                      value={editingItem.image?.note || ""}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        image: { ...editingItem.image, note: e.target.value, url: editingItem.image?.url || "", provider: editingItem.image?.provider || "local" } as any
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold">Approval</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="approvalUrl">URL</Label>
                    <Input
                      id="approvalUrl"
                      value={editingItem.approval?.url || ""}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        approval: { ...editingItem.approval, url: e.target.value, provider: editingItem.approval?.provider || "local" } as any
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="approvalProvider">Provider</Label>
                    <Input
                      id="approvalProvider"
                      value={editingItem.approval?.provider || ""}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        approval: { ...editingItem.approval, provider: e.target.value, url: editingItem.approval?.url || "" } as any
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="approvalNote">Note</Label>
                    <Input
                      id="approvalNote"
                      value={editingItem.approval?.note || ""}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        approval: { ...editingItem.approval, note: e.target.value, url: editingItem.approval?.url || "", provider: editingItem.approval?.provider || "local" } as any
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold">Note Image</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="noteImageUrl">URL</Label>
                    <Input
                      id="noteImageUrl"
                      value={editingItem.noteImage?.url || ""}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        noteImage: { ...editingItem.noteImage, url: e.target.value, provider: editingItem.noteImage?.provider || "local" } as any
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="noteImageProvider">Provider</Label>
                    <Input
                      id="noteImageProvider"
                      value={editingItem.noteImage?.provider || ""}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        noteImage: { ...editingItem.noteImage, provider: e.target.value, url: editingItem.noteImage?.url || "" } as any
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="noteImageNote">Note</Label>
                    <Input
                      id="noteImageNote"
                      value={editingItem.noteImage?.note || ""}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        noteImage: { ...editingItem.noteImage, note: e.target.value, url: editingItem.noteImage?.url || "", provider: editingItem.noteImage?.provider || "local" } as any
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
