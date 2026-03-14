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
import { Package, Wrench, Hammer, Building2, MoreHorizontal, Image, FileCheck, StickyNote, ExternalLink, Pencil, Upload, Loader2, Maximize2, ChevronRight, ChevronDown, Plus, Trash2 } from "lucide-react"
import { FullscreenBoqDialog } from "@/components/projects/boq/fullscreen-boq-dialog"
import { boqApi } from "@/lib/api/boq"
import { uploadApi } from "@/lib/api/upload"
import { API_BASE_URL } from "@/lib/api/config"

interface ProjectProcurementProps {
  projectId: string
}

interface DocField {
  url: string
  provider: string
  note?: string
}

interface SubItem {
  _id: string
  name: string
  note?: string
  finishing?: string
  type?: string
  code?: string
  spesification?: string
  image?: DocField
  approval?: DocField
  noteImage?: DocField
}

interface BOQItem {
  _id?: string
  _categoryId?: string
  subItems?: SubItem[]
  productId?: string
  qty: number
  name: string
  unit: string
  price: number
  location?: string
  brand?: string
  tags?: string[]
  image?: DocField
  approval?: DocField
  noteImage?: DocField
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

  // Expandable sub-item rows
  const [expandedItemKeys, setExpandedItemKeys] = useState<Set<string>>(new Set())

  // Sub-item dialog
  const [subItemDialogOpen, setSubItemDialogOpen] = useState(false)
  const [subItemDialogMode, setSubItemDialogMode] = useState<"add" | "edit">("add")
  const [editingSubItem, setEditingSubItem] = useState<SubItem | null>(null)
  const [subItemParentItem, setSubItemParentItem] = useState<BOQItem | null>(null)
  const [savingSubItem, setSavingSubItem] = useState(false)
  const [uploadingSubItemImage, setUploadingSubItemImage] = useState(false)
  const [uploadingSubItemApproval, setUploadingSubItemApproval] = useState(false)
  const [uploadingSubItemNoteImage, setUploadingSubItemNoteImage] = useState(false)

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
                _categoryId: category._id,
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
                _categoryId: category._id,
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
                _categoryId: category._id,
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

        // Auto-expand items that already have sub-items
        const keysWithSubItems = new Set<string>()
        allItems.forEach((item) => {
          if (item._id && item.subItems && item.subItems.length > 0) {
            keysWithSubItems.add(`${item._boqId}-${item._id}`)
          }
        })
        setExpandedItemKeys(keysWithSubItems)
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
      delete cleanItem._categoryId
      delete cleanItem.subItems // sub-items are managed separately, never sent with BOQ update

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

  // ── Sub-item helpers ─────────────────────────────────────────────────────────

  const toggleItemExpand = (key: string) => {
    setExpandedItemKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const collapseAll = (items: BOQItem[]) => {
    setExpandedItemKeys((prev) => {
      const next = new Set(prev)
      items.forEach((item) => {
        if (item._id) next.delete(`${item._boqId}-${item._id}`)
      })
      return next
    })
  }

  const expandAll = (items: BOQItem[]) => {
    setExpandedItemKeys((prev) => {
      const next = new Set(prev)
      items.forEach((item) => {
        if (item._id) next.add(`${item._boqId}-${item._id}`)
      })
      return next
    })
  }

  const expandWithSubItems = (items: BOQItem[]) => {
    setExpandedItemKeys((prev) => {
      const next = new Set(prev)
      // First collapse all items in this list, then expand only those with sub-items
      items.forEach((item) => {
        if (item._id) next.delete(`${item._boqId}-${item._id}`)
      })
      items.forEach((item) => {
        if (item._id && item.subItems && item.subItems.length > 0) {
          next.add(`${item._boqId}-${item._id}`)
        }
      })
      return next
    })
  }

  const handleAddSubItem = (item: BOQItem) => {
    setSubItemParentItem(item)
    setEditingSubItem({ _id: "", name: "", note: "", finishing: "", type: "", code: "", spesification: "" })
    setSubItemDialogMode("add")
    setSubItemDialogOpen(true)
  }

  const handleEditSubItem = (item: BOQItem, subItem: SubItem) => {
    setSubItemParentItem(item)
    setEditingSubItem({ ...subItem })
    setSubItemDialogMode("edit")
    setSubItemDialogOpen(true)
  }

  const handleDeleteSubItem = async (item: BOQItem, subItem: SubItem) => {
    if (!item._boqId || !item._id || !subItem._id) return
    if (!window.confirm(`Delete sub-item "${subItem.name}"?`)) return

    try {
      await boqApi.deleteSubItem(
        projectId,
        item._boqId,
        item._section!,
        item._categoryId || null,
        item._id,
        subItem._id,
      )
      toast({ title: "Success", description: "Sub-item deleted" })
      fetchAndGroupBOQItems()
    } catch (error: any) {
      console.error("Failed to delete sub-item:", error)
      toast({ title: "Error", description: error.message || "Failed to delete sub-item", variant: "destructive" })
    }
  }

  const handleSubItemImageUpload = async (file: File, type: "image" | "approval" | "noteImage") => {
    try {
      if (type === "image") setUploadingSubItemImage(true)
      if (type === "approval") setUploadingSubItemApproval(true)
      if (type === "noteImage") setUploadingSubItemNoteImage(true)

      const result = await uploadApi.uploadFile(file)
      const docField: DocField = { url: result.url, provider: result.provider }

      setEditingSubItem((prev) => {
        if (!prev) return prev
        return { ...prev, [type]: { ...docField, note: prev[type]?.note || "" } }
      })

      toast({ title: "Success", description: "File uploaded successfully" })
    } catch (error: any) {
      console.error("Failed to upload file:", error)
      toast({ title: "Error", description: error.message || "Failed to upload file", variant: "destructive" })
    } finally {
      if (type === "image") setUploadingSubItemImage(false)
      if (type === "approval") setUploadingSubItemApproval(false)
      if (type === "noteImage") setUploadingSubItemNoteImage(false)
    }
  }

  const handleSaveSubItem = async () => {
    if (!editingSubItem || !subItemParentItem || !subItemParentItem._boqId || !subItemParentItem._id) return
    if (!editingSubItem.name.trim()) {
      toast({ title: "Error", description: "Sub-item name is required", variant: "destructive" })
      return
    }

    const body: Record<string, unknown> = {
      name: editingSubItem.name.trim(),
    }
    if (editingSubItem.note) body.note = editingSubItem.note
    if (editingSubItem.finishing) body.finishing = editingSubItem.finishing
    if (editingSubItem.type) body.type = editingSubItem.type
    if (editingSubItem.code) body.code = editingSubItem.code
    if (editingSubItem.spesification) body.spesification = editingSubItem.spesification
    if (editingSubItem.image?.url) body.image = editingSubItem.image
    if (editingSubItem.approval?.url) body.approval = editingSubItem.approval
    if (editingSubItem.noteImage?.url) body.noteImage = editingSubItem.noteImage

    try {
      setSavingSubItem(true)
      if (subItemDialogMode === "add") {
        await boqApi.addSubItem(
          projectId,
          subItemParentItem._boqId,
          subItemParentItem._section!,
          subItemParentItem._categoryId || null,
          subItemParentItem._id,
          body,
        )
        toast({ title: "Success", description: "Sub-item added successfully" })
      } else {
        await boqApi.updateSubItem(
          projectId,
          subItemParentItem._boqId,
          subItemParentItem._section!,
          subItemParentItem._categoryId || null,
          subItemParentItem._id,
          editingSubItem._id,
          body,
        )
        toast({ title: "Success", description: "Sub-item updated successfully" })
      }
      setSubItemDialogOpen(false)
      setEditingSubItem(null)
      setSubItemParentItem(null)
      fetchAndGroupBOQItems()
    } catch (error: any) {
      console.error("Failed to save sub-item:", error)
      toast({ title: "Error", description: error.message || "Failed to save sub-item", variant: "destructive" })
    } finally {
      setSavingSubItem(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

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

    const totalCols = settings?.showTags ? 11 : 10

    return (
      <>
        <div className="border rounded-lg overflow-x-auto">
          <Table className="[&_th]:border [&_th]:border-border [&_td]:border [&_td]:border-border">
            <TableHeader>
              {/* Row 1: group headers */}
              <TableRow>
                <TableHead rowSpan={2} className="w-12 align-middle">No</TableHead>
                <TableHead colSpan={4} className="text-center font-bold border-b">Material</TableHead>
                {settings?.showTags && <TableHead rowSpan={2} className="align-middle">Tags</TableHead>}
                <TableHead rowSpan={2} className="min-w-36 align-middle">Application</TableHead>
                <TableHead rowSpan={2} className="text-center align-middle">Image Material</TableHead>
                <TableHead rowSpan={2} className="text-center align-middle">Approval</TableHead>
                <TableHead rowSpan={2} className="text-center align-middle">Note</TableHead>
                <TableHead rowSpan={2} className="text-center align-middle">Actions</TableHead>
              </TableRow>
              {/* Row 2: Material sub-headers */}
              <TableRow>
                <TableHead className="min-w-48">Item</TableHead>
                <TableHead className="w-16 text-center">Qty</TableHead>
                <TableHead className="min-w-32">Finishing</TableHead>
                <TableHead className="min-w-48">Brand/Type/Code/Specification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.sort((a, b) => a.name.localeCompare(b.name)).map((item, index) => {
                return (
                  <>
                    <TableRow key={`${item._source}-${item.name}-${index}`}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      {/* Item */}
                      <TableCell className="font-medium whitespace-normal">{item.name || "-"}</TableCell>
                      {/* Qty */}
                      <TableCell className="text-center text-sm font-medium">
                        {item.qty != null ? (
                          <span className={
                            item._boqNumber === 1
                              ? "text-blue-600"
                              : item.qty < 0
                                ? "text-red-600"
                                : "text-green-600"
                          }>
                            {item._boqNumber !== 1 && item.qty > 0 ? `+${item.qty}` : item.qty}
                          </span>
                        ) : "-"}
                      </TableCell>
                      {/* Finishing */}
                      <TableCell className={`text-sm ${!item.finishing ? "text-center" : ""}`}>{item.finishing || "-"}</TableCell>
                      {/* Brand/Type/Code/Specification */}
                      <TableCell className="whitespace-normal align-top">
                        <div className="space-y-0.5 text-xs">
                          <div className="text-muted-foreground"><span className="font-medium text-foreground">Brand:</span> {item.brand || "-"}</div>
                          <div className="text-muted-foreground"><span className="font-medium text-foreground">Type:</span> {item.type || "-"}</div>
                          <div className="font-bold"><span className="font-medium">Code:</span> {item.code || "-"}</div>
                          <div className="italic text-muted-foreground"><span className="not-italic font-medium text-foreground">Spec:</span> {item.spesification || "-"}</div>
                        </div>
                      </TableCell>
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
                      {/* Application (location) — read-only */}
                      <TableCell className="text-sm">{item.location || "-"}</TableCell>
                      {/* Image Material — inline thumbnail */}
                      <TableCell className="text-center">
                        {item.image?.url ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="block mx-auto hover:opacity-80 transition-opacity">
                                <img
                                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${item.image.provider}/${item.image.url}`}
                                  alt={item.image.note || "Image preview"}
                                  className="h-24 w-24 cursor-pointer object-cover rounded border"
                                />
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
                      {/* Approval — inline thumbnail */}
                      <TableCell className="text-center">
                        {item.approval?.url ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              {item.approval.url.endsWith('.pdf') ? (
                                <button className="inline-flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
                                  <FileCheck className="h-12 w-12 text-green-600" />
                                  <span className="text-xs text-blue-600">PDF</span>
                                </button>
                              ) : (
                                <button className="block mx-auto hover:opacity-80 transition-opacity">
                                  <img
                                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${item.approval.provider}/${item.approval.url}`}
                                    alt={item.approval.note || "Approval"}
                                    className="h-24 w-24 cursor-pointer object-cover rounded border"
                                  />
                                </button>
                              )}
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2">
                              <div className="space-y-2">
                                {item.approval.url.endsWith('.pdf') ? (
                                  <div className="flex flex-col items-center gap-2 p-4">
                                    <FileCheck className="h-12 w-12 text-green-600" />
                                    <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${item.approval.provider}/${item.approval.url}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Open PDF</a>
                                  </div>
                                ) : (
                                  <img src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${item.approval.provider}/${item.approval.url}`} alt={item.approval.note || "Approval preview"} className="max-w-sm max-h-96 object-contain rounded" />
                                )}
                                {item.approval.note && <p className="text-xs text-muted-foreground">{item.approval.note}</p>}
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      {/* Note (= noteImage) — inline thumbnail */}
                      <TableCell className="text-center">
                        {item.noteImage?.url ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="block mx-auto hover:opacity-80 transition-opacity">
                                <img
                                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${item.noteImage.provider}/${item.noteImage.url}`}
                                  alt={item.noteImage.note || "Note"}
                                  className="h-24 w-24 cursor-pointer object-cover rounded border"
                                />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2">
                              <div className="space-y-2">
                                <img src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${item.noteImage.provider}/${item.noteImage.url}`} alt={item.noteImage.note || "Note preview"} className="max-w-sm max-h-96 object-contain rounded" />
                                {item.noteImage.note && <p className="text-xs text-muted-foreground">{item.noteImage.note}</p>}
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                            className="h-8 w-8 p-0"
                            title="Edit item"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {item._id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddSubItem(item)}
                              className="h-8 w-8 p-0 text-primary hover:text-foreground"
                              title="Add sub-item"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* ── Sub-item rows (always visible) ── */}
                    {(item.subItems || []).length > 0 && (
                      <>
                        {(item.subItems || []).map((subItem, subIndex) => (
                          <TableRow key={`sub-${subItem._id || subIndex}`} className="bg-muted/30 text-sm">
                            <TableCell className="text-muted-foreground pl-4 text-xs text-center">{index + 1}.{subIndex + 1}</TableCell>
                            {/* Item */}
                            <TableCell className="pl-6 whitespace-normal">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-px bg-border shrink-0" />
                                <span>{subItem.name || "-"}</span>
                              </div>
                            </TableCell>
                            {/* Qty — empty for sub-items */}
                            <TableCell className="text-center">-</TableCell>
                            {/* Finishing */}
                            <TableCell className={`text-sm ${!subItem.finishing ? "text-center" : ""}`}>{subItem.finishing || "-"}</TableCell>
                            {/* Brand/Type/Code/Specification */}
                            <TableCell className="whitespace-normal align-top">
                              <div className="space-y-0.5 text-xs">
                                <div className="text-muted-foreground"><span className="font-medium text-foreground">Brand:</span> {item.brand || "-"}</div>
                                <div className="text-muted-foreground"><span className="font-medium text-foreground">Type:</span> {subItem.type || "-"}</div>
                                <div className="font-bold"><span className="font-medium">Code:</span> {subItem.code || "-"}</div>
                                <div className="italic text-muted-foreground"><span className="not-italic font-medium text-foreground">Spec:</span> {subItem.spesification || "-"}</div>
                              </div>
                            </TableCell>
                            {settings?.showTags && <TableCell />}
                            {/* Application — inherit from parent */}
                            <TableCell className="text-sm">{item.location || "-"}</TableCell>
                            {/* Image Material — inline thumbnail */}
                            <TableCell className="text-center">
                              {subItem.image?.url ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="block mx-auto hover:opacity-80 transition-opacity">
                                      <img
                                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${subItem.image.provider}/${subItem.image.url}`}
                                        alt={subItem.image.note || "Image"}
                                        className="h-24 w-24 cursor-pointer object-cover rounded border"
                                      />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-2">
                                    <div className="space-y-2">
                                      <img src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${subItem.image.provider}/${subItem.image.url}`} alt={subItem.image.note || "Image"} className="max-w-sm max-h-96 object-contain rounded" />
                                      {subItem.image.note && <p className="text-xs text-muted-foreground">{subItem.image.note}</p>}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              ) : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            {/* Approval — inline thumbnail */}
                            <TableCell className="text-center">
                              {subItem.approval?.url ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    {subItem.approval.url.endsWith('.pdf') ? (
                                      <button className="inline-flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
                                        <FileCheck className="h-12 w-12 text-green-600" />
                                        <span className="text-xs text-blue-600">PDF</span>
                                      </button>
                                    ) : (
                                      <button className="block mx-auto hover:opacity-80 transition-opacity">
                                        <img src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${subItem.approval.provider}/${subItem.approval.url}`} alt={subItem.approval.note || "Approval"} className="h-24 w-24 cursor-pointer object-cover rounded border" />
                                      </button>
                                    )}
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-2">
                                    <div className="space-y-2">
                                      {subItem.approval.url.endsWith('.pdf') ? (
                                        <div className="flex flex-col items-center gap-2 p-4">
                                          <FileCheck className="h-12 w-12 text-green-600" />
                                          <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${subItem.approval.provider}/${subItem.approval.url}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Open PDF</a>
                                        </div>
                                      ) : (
                                        <img src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${subItem.approval.provider}/${subItem.approval.url}`} alt={subItem.approval.note || "Approval"} className="max-w-sm max-h-96 object-contain rounded" />
                                      )}
                                      {subItem.approval.note && <p className="text-xs text-muted-foreground">{subItem.approval.note}</p>}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              ) : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            {/* Note (= noteImage) — inline thumbnail */}
                            <TableCell className="text-center">
                              {subItem.noteImage?.url ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="block mx-auto hover:opacity-80 transition-opacity">
                                      <img src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${subItem.noteImage.provider}/${subItem.noteImage.url}`} alt={subItem.noteImage.note || "Note"} className="h-24 w-24 cursor-pointer object-cover rounded border" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-2">
                                    <div className="space-y-2">
                                      <img src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${subItem.noteImage.provider}/${subItem.noteImage.url}`} alt={subItem.noteImage.note || "Note"} className="max-w-sm max-h-96 object-contain rounded" />
                                      {subItem.noteImage.note && <p className="text-xs text-muted-foreground">{subItem.noteImage.note}</p>}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              ) : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleEditSubItem(item, subItem)} className="h-7 w-7 p-0">
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteSubItem(item, subItem)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}
                  </>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </>
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
                <Input
                  id="specification"
                  value={editingItem.spesification || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, spesification: e.target.value })}
                  placeholder="Enter specification"
                />
              </div>

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

              <div className="grid grid-cols-3 gap-3 border-t pt-4">
                {/* Image */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Image</p>
                  <Label htmlFor="imageFile" className="cursor-pointer block">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed rounded text-xs hover:bg-primary hover:text-primary-foreground transition-colors">
                      {uploadingImage ? <><Loader2 className="h-3 w-3 animate-spin" /><span>Uploading...</span></> : <><Upload className="h-3 w-3" /><span>Upload</span></>}
                    </div>
                  </Label>
                  <Input id="imageFile" type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, 'image') }}
                    disabled={uploadingImage}
                  />
                  {editingItem.image?.url && (
                    <>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="block w-full hover:opacity-80 transition-opacity">
                            <img src={`${API_BASE_URL}/public/${editingItem.image.provider}/${editingItem.image.url}`} alt="Image" className="w-full aspect-square object-cover rounded border" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <div className="space-y-1">
                            <img src={`${API_BASE_URL}/public/${editingItem.image.provider}/${editingItem.image.url}`} alt="Image" className="max-w-sm max-h-96 object-contain rounded" />
                            {editingItem.image.note && <p className="text-xs text-muted-foreground">{editingItem.image.note}</p>}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Input className="h-8 text-xs" placeholder="Note"
                        value={editingItem.image?.note || ""}
                        onChange={(e) => setEditingItem({ ...editingItem, image: { ...editingItem.image, note: e.target.value, url: editingItem.image?.url || "", provider: editingItem.image?.provider || "local" } as any })}
                      />
                    </>
                  )}
                </div>

                {/* Approval */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Approval</p>
                  <Label htmlFor="approvalFile" className="cursor-pointer block">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed rounded text-xs hover:bg-primary hover:text-primary-foreground transition-colors">
                      {uploadingApproval ? <><Loader2 className="h-3 w-3 animate-spin" /><span>Uploading...</span></> : <><Upload className="h-3 w-3" /><span>Upload</span></>}
                    </div>
                  </Label>
                  <Input id="approvalFile" type="file" accept="image/*,.pdf" className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, 'approval') }}
                    disabled={uploadingApproval}
                  />
                  {editingItem.approval?.url && (
                    <>
                      <Popover>
                        <PopoverTrigger asChild>
                          {editingItem.approval.url.endsWith('.pdf') ? (
                            <button className="block w-full hover:opacity-80 transition-opacity">
                              <div className="w-full aspect-square flex items-center justify-center rounded border bg-muted"><FileCheck className="h-6 w-6 text-green-600" /></div>
                            </button>
                          ) : (
                            <button className="block w-full hover:opacity-80 transition-opacity">
                              <img src={`${API_BASE_URL}/public/${editingItem.approval.provider}/${editingItem.approval.url}`} alt="Approval" className="w-full aspect-square object-cover rounded border" />
                            </button>
                          )}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <div className="space-y-1">
                            {editingItem.approval.url.endsWith('.pdf') ? (
                              <div className="flex flex-col items-center gap-2 p-4">
                                <FileCheck className="h-12 w-12 text-green-600" />
                                <a href={`${API_BASE_URL}/public/${editingItem.approval.provider}/${editingItem.approval.url}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Open PDF</a>
                              </div>
                            ) : (
                              <img src={`${API_BASE_URL}/public/${editingItem.approval.provider}/${editingItem.approval.url}`} alt="Approval" className="max-w-sm max-h-96 object-contain rounded" />
                            )}
                            {editingItem.approval.note && <p className="text-xs text-muted-foreground">{editingItem.approval.note}</p>}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Input className="h-8 text-xs" placeholder="Note"
                        value={editingItem.approval?.note || ""}
                        onChange={(e) => setEditingItem({ ...editingItem, approval: { ...editingItem.approval, note: e.target.value, url: editingItem.approval?.url || "", provider: editingItem.approval?.provider || "local" } as any })}
                      />
                    </>
                  )}
                </div>

                {/* Note Image */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Note Image</p>
                  <Label htmlFor="noteImageFile" className="cursor-pointer block">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed rounded text-xs hover:bg-primary hover:text-primary-foreground transition-colors">
                      {uploadingNoteImage ? <><Loader2 className="h-3 w-3 animate-spin" /><span>Uploading...</span></> : <><Upload className="h-3 w-3" /><span>Upload</span></>}
                    </div>
                  </Label>
                  <Input id="noteImageFile" type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, 'noteImage') }}
                    disabled={uploadingNoteImage}
                  />
                  {editingItem.noteImage?.url && (
                    <>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="block w-full hover:opacity-80 transition-opacity">
                            <img src={`${API_BASE_URL}/public/${editingItem.noteImage.provider}/${editingItem.noteImage.url}`} alt="Note" className="w-full aspect-square object-cover rounded border" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <div className="space-y-1">
                            <img src={`${API_BASE_URL}/public/${editingItem.noteImage.provider}/${editingItem.noteImage.url}`} alt="Note" className="max-w-sm max-h-96 object-contain rounded" />
                            {editingItem.noteImage.note && <p className="text-xs text-muted-foreground">{editingItem.noteImage.note}</p>}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Input className="h-8 text-xs" placeholder="Note"
                        value={editingItem.noteImage?.note || ""}
                        onChange={(e) => setEditingItem({ ...editingItem, noteImage: { ...editingItem.noteImage, note: e.target.value, url: editingItem.noteImage?.url || "", provider: editingItem.noteImage?.provider || "local" } as any })}
                      />
                    </>
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
      {/* Sub-item Dialog */}
      <Dialog open={subItemDialogOpen} onOpenChange={setSubItemDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{subItemDialogMode === "add" ? "Add Sub-item" : "Edit Sub-item"}</DialogTitle>
            <DialogDescription>
              {subItemDialogMode === "add" ? "Add a descriptive sub-item to" : "Update sub-item of"}{" "}
              <span className="font-medium">{subItemParentItem?.name}</span>
            </DialogDescription>
          </DialogHeader>
          {editingSubItem && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sub-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sub-name"
                  value={editingSubItem.name}
                  onChange={(e) => setEditingSubItem({ ...editingSubItem, name: e.target.value })}
                  placeholder="Sub-item name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sub-code">Code</Label>
                  <Input
                    id="sub-code"
                    value={editingSubItem.code || ""}
                    onChange={(e) => setEditingSubItem({ ...editingSubItem, code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub-type">Type</Label>
                  <Input
                    id="sub-type"
                    value={editingSubItem.type || ""}
                    onChange={(e) => setEditingSubItem({ ...editingSubItem, type: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sub-finishing">Finishing</Label>
                  <Input
                    id="sub-finishing"
                    value={editingSubItem.finishing || ""}
                    onChange={(e) => setEditingSubItem({ ...editingSubItem, finishing: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub-note">Note</Label>
                  <Input
                    id="sub-note"
                    value={editingSubItem.note || ""}
                    onChange={(e) => setEditingSubItem({ ...editingSubItem, note: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sub-specification">Specification</Label>
                <Input
                  id="sub-specification"
                  value={editingSubItem.spesification || ""}
                  onChange={(e) => setEditingSubItem({ ...editingSubItem, spesification: e.target.value })}
                  placeholder="Enter specification"
                />
              </div>

              {/* Images */}
              <div className="grid grid-cols-3 gap-3 border-t pt-4">
                {/* Image */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Image</p>
                  <Label htmlFor="sub-imageFile" className="cursor-pointer block">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed rounded text-xs hover:bg-primary hover:text-primary-foreground transition-colors">
                      {uploadingSubItemImage ? <><Loader2 className="h-3 w-3 animate-spin" /><span>Uploading...</span></> : <><Upload className="h-3 w-3" /><span>Upload</span></>}
                    </div>
                  </Label>
                  <Input id="sub-imageFile" type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSubItemImageUpload(f, "image") }}
                    disabled={uploadingSubItemImage}
                  />
                  {editingSubItem.image?.url && (
                    <>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="block w-full hover:opacity-80 transition-opacity">
                            <img src={`${API_BASE_URL}/public/${editingSubItem.image.provider}/${editingSubItem.image.url}`} alt="Image" className="w-full aspect-square object-cover rounded border" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <div className="space-y-1">
                            <img src={`${API_BASE_URL}/public/${editingSubItem.image.provider}/${editingSubItem.image.url}`} alt="Image" className="max-w-sm max-h-96 object-contain rounded" />
                            {editingSubItem.image.note && <p className="text-xs text-muted-foreground">{editingSubItem.image.note}</p>}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Input className="h-8 text-xs" placeholder="Note"
                        value={editingSubItem.image.note || ""}
                        onChange={(e) => setEditingSubItem({ ...editingSubItem, image: { ...editingSubItem.image!, note: e.target.value } })}
                      />
                    </>
                  )}
                </div>

                {/* Approval */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Approval</p>
                  <Label htmlFor="sub-approvalFile" className="cursor-pointer block">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed rounded text-xs hover:bg-primary hover:text-primary-foreground transition-colors">
                      {uploadingSubItemApproval ? <><Loader2 className="h-3 w-3 animate-spin" /><span>Uploading...</span></> : <><Upload className="h-3 w-3" /><span>Upload</span></>}
                    </div>
                  </Label>
                  <Input id="sub-approvalFile" type="file" accept="image/*,.pdf" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSubItemImageUpload(f, "approval") }}
                    disabled={uploadingSubItemApproval}
                  />
                  {editingSubItem.approval?.url && (
                    <>
                      <Popover>
                        <PopoverTrigger asChild>
                          {editingSubItem.approval.url.endsWith(".pdf") ? (
                            <button className="block w-full hover:opacity-80 transition-opacity">
                              <div className="w-full aspect-square flex items-center justify-center rounded border bg-muted"><FileCheck className="h-6 w-6 text-green-600" /></div>
                            </button>
                          ) : (
                            <button className="block w-full hover:opacity-80 transition-opacity">
                              <img src={`${API_BASE_URL}/public/${editingSubItem.approval.provider}/${editingSubItem.approval.url}`} alt="Approval" className="w-full aspect-square object-cover rounded border" />
                            </button>
                          )}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <div className="space-y-1">
                            {editingSubItem.approval.url.endsWith(".pdf") ? (
                              <div className="flex flex-col items-center gap-2 p-4">
                                <FileCheck className="h-12 w-12 text-green-600" />
                                <a href={`${API_BASE_URL}/public/${editingSubItem.approval.provider}/${editingSubItem.approval.url}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Open PDF</a>
                              </div>
                            ) : (
                              <img src={`${API_BASE_URL}/public/${editingSubItem.approval.provider}/${editingSubItem.approval.url}`} alt="Approval" className="max-w-sm max-h-96 object-contain rounded" />
                            )}
                            {editingSubItem.approval.note && <p className="text-xs text-muted-foreground">{editingSubItem.approval.note}</p>}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Input className="h-8 text-xs" placeholder="Note"
                        value={editingSubItem.approval.note || ""}
                        onChange={(e) => setEditingSubItem({ ...editingSubItem, approval: { ...editingSubItem.approval!, note: e.target.value } })}
                      />
                    </>
                  )}
                </div>

                {/* Note Image */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Note Image</p>
                  <Label htmlFor="sub-noteImageFile" className="cursor-pointer block">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed rounded text-xs hover:bg-primary hover:text-primary-foreground transition-colors">
                      {uploadingSubItemNoteImage ? <><Loader2 className="h-3 w-3 animate-spin" /><span>Uploading...</span></> : <><Upload className="h-3 w-3" /><span>Upload</span></>}
                    </div>
                  </Label>
                  <Input id="sub-noteImageFile" type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSubItemImageUpload(f, "noteImage") }}
                    disabled={uploadingSubItemNoteImage}
                  />
                  {editingSubItem.noteImage?.url && (
                    <>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="block w-full hover:opacity-80 transition-opacity">
                            <img src={`${API_BASE_URL}/public/${editingSubItem.noteImage.provider}/${editingSubItem.noteImage.url}`} alt="Note" className="w-full aspect-square object-cover rounded border" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <div className="space-y-1">
                            <img src={`${API_BASE_URL}/public/${editingSubItem.noteImage.provider}/${editingSubItem.noteImage.url}`} alt="Note" className="max-w-sm max-h-96 object-contain rounded" />
                            {editingSubItem.noteImage.note && <p className="text-xs text-muted-foreground">{editingSubItem.noteImage.note}</p>}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Input className="h-8 text-xs" placeholder="Note"
                        value={editingSubItem.noteImage.note || ""}
                        onChange={(e) => setEditingSubItem({ ...editingSubItem, noteImage: { ...editingSubItem.noteImage!, note: e.target.value } })}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubItemDialogOpen(false)} disabled={savingSubItem}>
              Cancel
            </Button>
            <Button onClick={handleSaveSubItem} disabled={savingSubItem}>
              {savingSubItem ? "Saving..." : subItemDialogMode === "add" ? "Add Sub-item" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
