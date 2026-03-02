"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Package, Wrench, Hammer, Building2, MoreHorizontal, Image, FileCheck, StickyNote, ExternalLink, Pencil, Upload, Loader2, Maximize2 } from "lucide-react"
import { FullscreenBoqDialog } from "@/components/projects/boq/fullscreen-boq-dialog"
import { boqApi } from "@/lib/api/boq"
import { uploadApi } from "@/lib/api/upload"
import { API_BASE_URL } from "@/lib/api/config"

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
  startDate?: string
  endDate?: string
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

const editableTagOptions = [
  { value: "Vendor", label: "Vendor" },
  { value: "MEP", label: "MEP" },
  { value: "Workshop", label: "Workshop" },
  { value: "internal", label: "Internal" },
] as const

type EditableTagOption = (typeof editableTagOptions)[number]["value"]

const normalizeTag = (tag: string) => tag.trim().toLowerCase()

const getSelectedTagValue = (tags?: string[]): EditableTagOption | "custom" | "none" => {
  const firstTag = tags?.[0]?.trim()
  if (!firstTag) return "none"

  const matchedOption = editableTagOptions.find((option) => normalizeTag(option.value) === normalizeTag(firstTag))
  if (matchedOption) return matchedOption.value

  return "custom"
}

const getCustomTagValue = (tags?: string[]) => {
  const firstTag = tags?.[0]?.trim()
  if (!firstTag) return ""

  const isKnownTag = editableTagOptions.some((option) => normalizeTag(option.value) === normalizeTag(firstTag))
  return isKnownTag ? "" : firstTag
}

export function ProjectProcurement({ projectId }: ProjectProcurementProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
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
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingApproval, setUploadingApproval] = useState(false)
  const [uploadingNoteImage, setUploadingNoteImage] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [fullscreenTitle, setFullscreenTitle] = useState("")
  const [fullscreenItems, setFullscreenItems] = useState<BOQItem[]>([])
  const [fullscreenShowTags, setFullscreenShowTags] = useState(false)

  const openFullscreen = (title: string, items: BOQItem[], showTags = false) => {
    setFullscreenTitle(title)
    setFullscreenItems(items)
    setFullscreenShowTags(showTags)
    setFullscreenOpen(true)
  }

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

  const handleImageUpload = async (file: File, type: 'image' | 'approval' | 'noteImage') => {
    try {
      if (type === 'image') setUploadingImage(true)
      if (type === 'approval') setUploadingApproval(true)
      if (type === 'noteImage') setUploadingNoteImage(true)

      const result = await uploadApi.uploadFile(file)

      if (editingItem) {
        if (type === 'image') {
          setEditingItem({
            ...editingItem,
            image: {
              url: result.url,
              provider: result.provider,
              note: editingItem.image?.note || ""
            }
          })
        } else if (type === 'approval') {
          setEditingItem({
            ...editingItem,
            approval: {
              url: result.url,
              provider: result.provider,
              note: editingItem.approval?.note || ""
            }
          })
        } else if (type === 'noteImage') {
          setEditingItem({
            ...editingItem,
            noteImage: {
              url: result.url,
              provider: result.provider,
              note: editingItem.noteImage?.note || ""
            }
          })
        }
      }

      toast({
        title: "Success",
        description: "File uploaded successfully",
      })
    } catch (error: any) {
      console.error("Failed to upload file:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      if (type === 'image') setUploadingImage(false)
      if (type === 'approval') setUploadingApproval(false)
      if (type === 'noteImage') setUploadingNoteImage(false)
    }
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

      if (cleanItem.tags) {
        const sanitizedTags = cleanItem.tags.map((tag) => tag.trim()).filter(Boolean)
        cleanItem.tags = sanitizedTags.length > 0 ? sanitizedTags : undefined
      }

      // Normalize a date string to YYYY-MM-DD (handles ISO strings from API)
      const normalizeDate = (date?: string): string | undefined => {
        if (!date) return undefined
        try {
          return new Date(date).toISOString().split("T")[0]
        } catch {
          return undefined
        }
      }

      // Normalize dates on an item before sending to API
      const normalizeItemDates = (item: any) => ({
        ...item,
        startDate: normalizeDate(item.startDate) || undefined,
        endDate: normalizeDate(item.endDate) || undefined,
      })

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

      // Prepare the payload — normalize ALL item dates to YYYY-MM-DD before sending
      const payload = {
        preliminary: (updatedBOQ.preliminary || []).map(normalizeItemDates),
        fittingOut: (updatedBOQ.fittingOut || []).map((cat: any) => ({
          ...cat,
          products: (cat.products || []).map(normalizeItemDates),
        })),
        furnitureWork: (updatedBOQ.furnitureWork || []).map((cat: any) => ({
          ...cat,
          products: (cat.products || []).map(normalizeItemDates),
        })),
        mechanicalElectrical: (updatedBOQ.mechanicalElectrical || []).map((cat: any) => ({
          ...cat,
          products: (cat.products || []).map(normalizeItemDates),
        })),
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

  const renderItemsTable = (items: BOQItem[], title: string, settings?: { showTags?: boolean }) => {
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
              {settings?.showTags && <TableHead>Tags</TableHead>}
              <TableHead>Source</TableHead>
              <TableHead className="text-center">Image</TableHead>
              <TableHead className="text-center">Approval</TableHead>
              <TableHead className="text-center">Note Image</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Finishing</TableHead>
              <TableHead>Specification</TableHead>
              {/* <TableHead>Note</TableHead> */}
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={`${item._source}-${item.name}-${index}`}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium whitespace-normal wrap-break-word">{item.name || "-"}</TableCell>
                {settings?.showTags && (
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.tags?.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant={item._source?.includes("Main") ? "default" : "secondary"} className="whitespace-nowrap">
                    {item._source || "-"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {item.image?.url ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800">
                          <Image className="h-4 w-4" />
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="space-y-2">
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${item.image.provider}/${item.image.url}`}
                            alt={item.image.note || "Image preview"}
                            className="max-w-sm max-h-96 object-contain rounded"
                          />
                          {item.image.note && (
                            <p className="text-xs text-muted-foreground">{item.image.note}</p>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {item.approval?.url ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="inline-flex items-center gap-1 text-green-600 hover:text-green-800">
                          <FileCheck className="h-4 w-4" />
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="space-y-2">
                          {item.approval.url.endsWith('.pdf') ? (
                            <div className="flex flex-col items-center gap-2 p-4">
                              <FileCheck className="h-12 w-12 text-green-600" />
                              <a
                                href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${item.approval.provider}/${item.approval.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Open PDF
                              </a>
                            </div>
                          ) : (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${item.approval.provider}/${item.approval.url}`}
                              alt={item.approval.note || "Approval preview"}
                              className="max-w-sm max-h-96 object-contain rounded"
                            />
                          )}
                          {item.approval.note && (
                            <p className="text-xs text-muted-foreground">{item.approval.note}</p>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {item.noteImage?.url ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-800">
                          <StickyNote className="h-4 w-4" />
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="space-y-2">
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${item.noteImage.provider}/${item.noteImage.url}`}
                            alt={item.noteImage.note || "Note image preview"}
                            className="max-w-sm max-h-96 object-contain rounded"
                          />
                          {item.noteImage.note && (
                            <p className="text-xs text-muted-foreground">{item.noteImage.note}</p>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
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
                {/* <TableCell className="max-w-50">
                  <div className="truncate" title={item.note || "-"}>
                    {item.note || "-"}
                  </div>
                </TableCell> */}
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

  useEffect(() => {
    const tabFromQuery = searchParams.get("tab")
    const subTabFromQuery = searchParams.get("subtab")

    if (tabFromQuery !== "procurement") return

    if (subTabFromQuery && subTabs.some((tab) => tab.value === subTabFromQuery) && subTabFromQuery !== activeSubTab) {
      setActiveSubTab(subTabFromQuery)
    }
  }, [searchParams, activeSubTab])

  const handleSubTabChange = (nextSubTab: string) => {
    setActiveSubTab(nextSubTab)

    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "procurement")
    params.set("subtab", nextSubTab)

    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Procurement</h2>
        <p className="text-muted-foreground">Manage procurement for vendors, MEP, workshop, and more</p>
      </div>

      <Tabs value={activeSubTab} onValueChange={handleSubTabChange} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vendor Procurement</CardTitle>
                  <CardDescription>Manage vendor procurement and orders</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => openFullscreen("Vendor Procurement", groupedItems.vendor)}>
                  <Maximize2 className="h-4 w-4 mr-1" />
                  Full Screen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {renderItemsTable(groupedItems.vendor, "Vendor")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mep">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>MEP Procurement</CardTitle>
                  <CardDescription>Manage Mechanical, Electrical, and Plumbing procurement</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => openFullscreen("MEP Procurement", groupedItems.mep)}>
                  <Maximize2 className="h-4 w-4 mr-1" />
                  Full Screen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {renderItemsTable(groupedItems.mep, "MEP")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workshop">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Workshop Procurement</CardTitle>
                  <CardDescription>Manage workshop materials and equipment</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => openFullscreen("Workshop Procurement", groupedItems.workshop)}>
                  <Maximize2 className="h-4 w-4 mr-1" />
                  Full Screen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {renderItemsTable(groupedItems.workshop, "Workshop")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="internal">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Internal Procurement</CardTitle>
                  <CardDescription>Manage internal procurement and resources</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => openFullscreen("Internal Procurement", groupedItems.internal)}>
                  <Maximize2 className="h-4 w-4 mr-1" />
                  Full Screen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {renderItemsTable(groupedItems.internal, "Internal")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="others">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Others Procurement</CardTitle>
                  <CardDescription>Manage other procurement items</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => openFullscreen("Others Procurement", getFilteredOthersItems(), true)}>
                  <Maximize2 className="h-4 w-4 mr-1" />
                  Full Screen
                </Button>
              </div>
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
              {renderItemsTable(getFilteredOthersItems(), "Others", { showTags: true })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <FullscreenBoqDialog
        open={fullscreenOpen}
        title={fullscreenTitle}
        onOpenChange={setFullscreenOpen}
        renderContent={() => renderItemsTable(fullscreenItems, fullscreenTitle, { showTags: fullscreenShowTags })}
      />

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

              {/* <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  value={editingItem.note || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, note: e.target.value })}
                  rows={2}
                />
              </div> */}

              <div className="space-y-2">
                <Label htmlFor="edit-item-tag">Tag</Label>
                <Select
                  value={getSelectedTagValue(editingItem.tags)}
                  onValueChange={(value: EditableTagOption | "custom" | "none") => {
                    if (value === "none") {
                      setEditingItem({ ...editingItem, tags: [] })
                      return
                    }

                    if (value === "custom") {
                      const existingCustomTag = getCustomTagValue(editingItem.tags)
                      setEditingItem({ ...editingItem, tags: [existingCustomTag] })
                      return
                    }

                    setEditingItem({ ...editingItem, tags: [value] })
                  }}
                >
                  <SelectTrigger id="edit-item-tag">
                    <SelectValue placeholder="Select a tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Tag</SelectItem>
                    {editableTagOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(getSelectedTagValue(editingItem.tags) === "custom" || (getSelectedTagValue(editingItem.tags) === "none" && editingItem.tags && editingItem.tags.length === 1 && editingItem.tags[0] === "")) && (
                <div className="space-y-2">
                  <Label htmlFor="edit-item-custom-tag">Custom Tag</Label>
                  <Input
                    id="edit-item-custom-tag"
                    value={getCustomTagValue(editingItem.tags)}
                    onChange={(e) => setEditingItem({ ...editingItem, tags: [e.target.value] })}
                    placeholder="Type custom tag"
                  />
                </div>
              )}

              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold">Image</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor="imageFile" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-md hover:bg-primary hover:text-primary-foreground transition-colors">
                          {uploadingImage ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              <span>Upload Image</span>
                            </>
                          )}
                        </div>
                      </Label>
                      <Input
                        id="imageFile"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file, 'image')
                        }}
                        disabled={uploadingImage}
                      />
                    </div>
                  </div>
                  {editingItem.image?.url && (
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <div className="border rounded-lg p-2 bg-muted/50">
                        <div className="flex flex-col items-center gap-2 p-4">
                          <img
                            src={`${API_BASE_URL}/public/${editingItem.image.provider}/${editingItem.image.url}`}
                            alt="Image preview"
                            className="max-w-full max-h-64 object-contain rounded mx-auto"
                          />
                          <a
                            href={`${API_BASE_URL}/public/${editingItem.image.provider}/${editingItem.image.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Open in new tab
                          </a>
                        </div>
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
                          placeholder="Optional note for image"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold">Approval</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor="approvalFile" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-md hover:bg-primary hover:text-primary-foreground transition-colors">
                          {uploadingApproval ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              <span>Upload Approval</span>
                            </>
                          )}
                        </div>
                      </Label>
                      <Input
                        id="approvalFile"
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file, 'approval')
                        }}
                        disabled={uploadingApproval}
                      />
                    </div>
                  </div>
                  {editingItem.approval?.url && (
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <div className="border rounded-lg p-2 bg-muted/50">
                        {editingItem.approval.url.endsWith('.pdf') ? (
                          <div className="flex flex-col items-center gap-2 p-4">
                            <FileCheck className="h-16 w-16 text-green-600" />
                            <span className="text-sm text-muted-foreground">PDF Document</span>
                            <a
                              href={`${API_BASE_URL}/public/${editingItem.approval.provider}/${editingItem.approval.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              Open in new tab
                            </a>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 p-4">
                            <img
                              src={`${API_BASE_URL}/public/${editingItem.approval.provider}/${editingItem.approval.url}`}
                              alt="Approval preview"
                              className="max-w-full max-h-64 object-contain rounded mx-auto"
                            />
                            <a
                              href={`${API_BASE_URL}/public/${editingItem.approval.provider}/${editingItem.approval.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              Open in new tab
                            </a>
                          </div>
                        )}
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
                          placeholder="Optional note for approval"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold">Note Image</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor="noteImageFile" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-md hover:bg-primary hover:text-primary-foreground transition-colors">
                          {uploadingNoteImage ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              <span>Upload Note Image</span>
                            </>
                          )}
                        </div>
                      </Label>
                      <Input
                        id="noteImageFile"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file, 'noteImage')
                        }}
                        disabled={uploadingNoteImage}
                      />
                    </div>
                  </div>
                  {editingItem.noteImage?.url && (
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <div className="border rounded-lg p-2 bg-muted/50">
                        <div className="flex flex-col items-center gap-2 p-4">
                          <img
                            src={`${API_BASE_URL}/public/${editingItem.noteImage.provider}/${editingItem.noteImage.url}`}
                            alt="Note image preview"
                            className="max-w-full max-h-64 object-contain rounded mx-auto"
                          />
                          <a
                            href={`${API_BASE_URL}/public/${editingItem.noteImage.provider}/${editingItem.noteImage.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Open in new tab
                          </a>
                        </div>
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
                          placeholder="Optional note for note image"
                        />
                      </div>
                    </div>
                  )}
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
