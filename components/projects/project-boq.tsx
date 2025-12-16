"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Edit,
  Trash2,
  Plus,
  Eye,
  FileSpreadsheet,
  Sparkles,
  X,
  Check,
  ChevronsUpDown,
  Loader2,
  Upload,
} from "lucide-react"
import { boqApi } from "@/lib/api/boq"
import { templatesApi } from "@/lib/api/templates"
import { productsApi } from "@/lib/api/products"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import React from "react"
import { CreateBOQDialog } from "./create-boq-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PreliminaryItem {
  name: string
  qty: number
  unit: string
  price: number
  productId?: string
}

interface ProductItem {
  name: string
  qty: number
  unit: string
  price: number
  productId?: string
}

interface Category {
  name: string
  products: ProductItem[]
}

interface ProjectBOQProps {
  projectId: string
}

export function ProjectBOQ({ projectId }: ProjectBOQProps) {
  const { toast } = useToast() // Initialize toast here
  const [boqItems, setBoqItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBOQ, setEditingBOQ] = useState<any>(null)
  const [isCreatingAdditional, setIsCreatingAdditional] = useState(false)
  const [activeTab, setActiveTab] = useState("main")

  // Creation mode states
  const [creationMode, setCreationMode] = useState<"blank" | "template" | null>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [openPopovers, setOpenPopovers] = useState<{ [key: string]: boolean }>({})
  const [searchQuery, setSearchQuery] = useState<{ [key: string]: string }>({})
  const [createProductDialogOpen, setCreateProductDialogOpen] = useState(false)

  // Form states for blank creation
  const [preliminary, setPreliminary] = useState<PreliminaryItem[]>([])
  const [fittingOut, setFittingOut] = useState<Category[]>([])
  const [furnitureWork, setFurnitureWork] = useState<Category[]>([])

  const preliminaryQtyRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})
  const fittingOutQtyRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const furnitureWorkQtyRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  // Product creation form states
  const [productFormData, setProductFormData] = useState({
    name: "",
    type: "Goods" as "Goods" | "Services" | "Goods and Services",
    unit: "",
    brand: "",
    sellingPrice: "",
    purchasePrice: "",
    sku: "",
  })
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ url: string; provider: string }>>([])
  const [uploading, setUploading] = useState(false)
  const [productDetails, setProductDetails] = useState<any[]>([])
  const [submittingProduct, setSubmittingProduct] = useState(false)
  const [summary, setSummary] = useState({
    totalBudget: 0,
    totalSpent: 0,
    progress: 0,
  })

  useEffect(() => {
    loadBOQs()
    fetchTemplates()
    fetchProducts()
  }, [projectId])

  useEffect(() => {
    if (editingBOQ && creationMode === "blank") {
      // Populate preliminary items
      setPreliminary(
        editingBOQ.preliminary?.map((item: any) => ({
          name: item.name || "",
          qty: item.qty || 0,
          unit: item.unit || "",
          price: item.price || 0,
          productId: item.productId || "",
        })) || [],
      )

      // Populate fitting out categories
      setFittingOut(
        editingBOQ.fittingOut?.map((category: any) => ({
          name: category.name || "",
          products:
            category.products?.map((product: any) => ({
              name: product.name || "",
              qty: product.qty || 0,
              unit: product.unit || "",
              price: product.price || 0,
              productId: product.productId || "",
            })) || [],
        })) || [],
      )

      // Populate furniture work categories
      setFurnitureWork(
        editingBOQ.furnitureWork?.map((category: any) => ({
          name: category.name || "",
          products:
            category.products?.map((product: any) => ({
              name: product.name || "",
              qty: product.qty || 0,
              unit: product.unit || "",
              price: product.price || 0,
              productId: product.productId || "",
            })) || [],
        })) || [],
      )
    } else if (creationMode === "blank" && !editingBOQ) {
      setPreliminary([])
      setFittingOut([])
      setFurnitureWork([])
    }
  }, [editingBOQ, creationMode])

  const fetchTemplates = async () => {
    try {
      const response = await templatesApi.getAll()
      if (response.success && response.data) {
        setTemplates(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    }
  }

  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      const response = await productsApi.getAll()
      if (response.success && response.data) {
        setProducts(response.data.list || [])
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadBOQs = async () => {
    try {
      const response = await boqApi.getByProject(projectId)

      if (response.success && response.data) {
        setBoqItems(response.data)
        calculateSummary(response.data)
      } else {
        setBoqItems([])
      }
    } catch (error) {
      console.error("Failed to load BOQ:", error)
      setBoqItems([])
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (items: any[]) => {
    if (!Array.isArray(items) || items.length === 0) {
      setSummary({ totalBudget: 0, totalSpent: 0, progress: 0 })
      return
    }

    let totalBudget = 0

    items.forEach((boq) => {
      // Calculate from preliminary items
      if (Array.isArray(boq.preliminary)) {
        boq.preliminary.forEach((item: any) => {
          totalBudget += (item.qty || 0) * (item.price || 0)
        })
      }

      // Calculate from fittingOut categories
      if (Array.isArray(boq.fittingOut)) {
        boq.fittingOut.forEach((category: any) => {
          if (Array.isArray(category.products)) {
            category.products.forEach((product: any) => {
              totalBudget += (product.qty || 0) * (product.price || 0)
            })
          }
        })
      }

      // Calculate from furnitureWork categories
      if (Array.isArray(boq.furnitureWork)) {
        boq.furnitureWork.forEach((category: any) => {
          if (Array.isArray(category.products)) {
            category.products.forEach((product: any) => {
              totalBudget += (product.qty || 0) * (product.price || 0)
            })
          }
        })
      }
    })

    setSummary({ totalBudget, totalSpent: 0, progress: 0 })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const renderBOQTable = (boq: any) => {
    let itemNumber = 1
    let grandTotal = 0

    return (
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] px-4">No</TableHead>
              <TableHead className="min-w-[300px] max-w-[500px] px-4">Item Name</TableHead>
              <TableHead className="text-right w-[80px] px-4">Qty</TableHead>
              <TableHead className="w-[80px] px-4">Unit</TableHead>
              <TableHead className="text-right w-[150px] px-4">Unit Price</TableHead>
              <TableHead className="text-right w-[150px] px-4">Total Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* PRELIMINARY SECTION */}
            {Array.isArray(boq.preliminary) && boq.preliminary.length > 0 && (
              <>
                <TableRow className="bg-primary/10">
                  <TableCell colSpan={6} className="font-bold text-primary uppercase px-4 py-3">
                    PRELIMINARY
                  </TableCell>
                </TableRow>
                {boq.preliminary.map((item: any) => {
                  const total = (item.qty || 0) * (item.price || 0)
                  grandTotal += total
                  return (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium pl-8 pr-4">{itemNumber++}</TableCell>
                      <TableCell className="whitespace-normal break-words px-4">{item.name}</TableCell>
                      <TableCell className="text-right px-4">{item.qty}</TableCell>
                      <TableCell className="px-4">{item.unit}</TableCell>
                      <TableCell className="text-right px-4">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right font-medium px-4">{formatCurrency(total)}</TableCell>
                    </TableRow>
                  )
                })}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={5} className="text-right font-semibold px-4 py-3">
                    Subtotal Preliminary
                  </TableCell>
                  <TableCell className="text-right font-semibold px-4 py-3">
                    {formatCurrency(
                      boq.preliminary.reduce((sum: number, item: any) => sum + (item.qty || 0) * (item.price || 0), 0),
                    )}
                  </TableCell>
                </TableRow>
              </>
            )}

            {/* FITTING OUT SECTION */}
            {Array.isArray(boq.fittingOut) && boq.fittingOut.length > 0 && (
              <>
                <TableRow className="bg-primary/10">
                  <TableCell colSpan={6} className="font-bold text-primary uppercase px-4 py-3">
                    FITTING OUT
                  </TableCell>
                </TableRow>
                {boq.fittingOut.map((category: any) => {
                  const categoryTotal =
                    Array.isArray(category.products) &&
                    category.products.reduce((sum: number, p: any) => sum + (p.qty || 0) * (p.price || 0), 0)
                  grandTotal += categoryTotal || 0

                  return (
                    <React.Fragment key={category._id}>
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={6} className="font-semibold pl-8 pr-4 py-2">
                          {category.name}
                        </TableCell>
                      </TableRow>
                      {Array.isArray(category.products) &&
                        category.products.map((product: any) => {
                          const total = (product.qty || 0) * (product.price || 0)
                          return (
                            <TableRow key={product._id}>
                              <TableCell className="font-medium pl-12 pr-4">{itemNumber++}</TableCell>
                              <TableCell className="whitespace-normal break-words px-4">{product.name}</TableCell>
                              <TableCell className="text-right px-4">{product.qty}</TableCell>
                              <TableCell className="px-4">{product.unit}</TableCell>
                              <TableCell className="text-right px-4">{formatCurrency(product.price)}</TableCell>
                              <TableCell className="text-right font-medium px-4">{formatCurrency(total)}</TableCell>
                            </TableRow>
                          )
                        })}
                      <TableRow className="bg-muted/20">
                        <TableCell colSpan={5} className="text-right text-sm font-medium pl-12 pr-4 py-2">
                          Subtotal {category.name}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium px-4 py-2">
                          {formatCurrency(categoryTotal || 0)}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  )
                })}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={5} className="text-right font-semibold px-4 py-3">
                    Subtotal Fitting Out
                  </TableCell>
                  <TableCell className="text-right font-semibold px-4 py-3">
                    {formatCurrency(
                      boq.fittingOut.reduce(
                        (sum: number, cat: any) =>
                          sum +
                          (Array.isArray(cat.products)
                            ? cat.products.reduce((s: number, p: any) => s + (p.qty || 0) * (p.price || 0), 0)
                            : 0),
                        0,
                      ),
                    )}
                  </TableCell>
                </TableRow>
              </>
            )}

            {/* FURNITURE WORK SECTION */}
            {Array.isArray(boq.furnitureWork) && boq.furnitureWork.length > 0 && (
              <>
                <TableRow className="bg-primary/10">
                  <TableCell colSpan={6} className="font-bold text-primary uppercase px-4 py-3">
                    FURNITURE WORK
                  </TableCell>
                </TableRow>
                {boq.furnitureWork.map((category: any) => {
                  const categoryTotal =
                    Array.isArray(category.products) &&
                    category.products.reduce((sum: number, p: any) => sum + (p.qty || 0) * (p.price || 0), 0)
                  grandTotal += categoryTotal || 0

                  return (
                    <React.Fragment key={category._id}>
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={6} className="font-semibold pl-8 pr-4 py-2">
                          {category.name}
                        </TableCell>
                      </TableRow>
                      {Array.isArray(category.products) &&
                        category.products.map((product: any) => {
                          const total = (product.qty || 0) * (product.price || 0)
                          return (
                            <TableRow key={product._id}>
                              <TableCell className="font-medium pl-12 pr-4">{itemNumber++}</TableCell>
                              <TableCell className="whitespace-normal break-words px-4">{product.name}</TableCell>
                              <TableCell className="text-right px-4">{product.qty}</TableCell>
                              <TableCell className="px-4">{product.unit}</TableCell>
                              <TableCell className="text-right px-4">{formatCurrency(product.price)}</TableCell>
                              <TableCell className="text-right font-medium px-4">{formatCurrency(total)}</TableCell>
                            </TableRow>
                          )
                        })}
                      <TableRow className="bg-muted/20">
                        <TableCell colSpan={5} className="text-right text-sm font-medium pl-12 pr-4 py-2">
                          Subtotal {category.name}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium px-4 py-2">
                          {formatCurrency(categoryTotal || 0)}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  )
                })}
                <TableRow className="bg-primary/20 font-bold">
                  <TableCell colSpan={5} className="text-right text-lg px-4 py-4">
                    GRAND TOTAL
                  </TableCell>
                  <TableCell className="text-right text-lg px-4 py-4">{formatCurrency(grandTotal)}</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  const handleEditBOQ = (boq: any) => {
    setEditingBOQ(boq)
    // In the new implementation, editing is handled by navigating to the creation form
    // For now, we can set the state but the dialog won't be used directly for editing
  }

  const handleDialogClose = (open: boolean) => {
    // This handler is for the old CreateBOQDialog, which is being replaced
    // It's kept here for now but might be removed or refactored later.
    if (!open) {
      setEditingBOQ(null)
      setIsCreatingAdditional(false)
    }
  }

  const handleCreateAdditionalBOQ = () => {
    setIsCreatingAdditional(true)
    // In the new implementation, this action leads to the blank creation form
    setCreationMode("blank")
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === "approved") {
      return <Badge className="bg-green-500 text-white hover:bg-green-600">Approved</Badge>
    } else if (statusLower === "rejected") {
      return <Badge className="bg-red-500 text-white hover:bg-red-600">Rejected</Badge>
    } else if (statusLower === "request") {
      return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Request</Badge>
    } else if (statusLower === "revision") {
      return <Badge className="bg-blue-500 text-white hover:bg-blue-600">Revision</Badge>
    }
    return <Badge variant="secondary">{status}</Badge>
  }

  // Helper function for highlighting search query in product names
  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, "gi"))
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-primary/30 text-foreground">
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </>
    )
  }

  // Functions for selecting products in the creation form
  const selectPreliminaryProduct = (index: number, product: any) => {
    const newPreliminary = [...preliminary]
    newPreliminary[index] = {
      name: product.name,
      qty: newPreliminary[index].qty || 0,
      unit: product.unit,
      price: product.sellingPrice,
      productId: product._id,
    }
    setPreliminary(newPreliminary)
    setOpenPopovers({ ...openPopovers, [`preliminary-${index}`]: false })
    setTimeout(() => {
      preliminaryQtyRefs.current[index]?.focus()
    }, 100)
  }

  const selectFittingOutProduct = (categoryIndex: number, productIndex: number, product: any) => {
    const newFittingOut = [...fittingOut]
    newFittingOut[categoryIndex].products[productIndex] = {
      name: product.name,
      qty: newFittingOut[categoryIndex].products[productIndex].qty || 0,
      unit: product.unit,
      price: product.sellingPrice,
      productId: product._id,
    }
    setFittingOut(newFittingOut)
    setOpenPopovers({ ...openPopovers, [`fittingOut-${categoryIndex}-${productIndex}`]: false })
    setTimeout(() => {
      fittingOutQtyRefs.current[`${categoryIndex}-${productIndex}`]?.focus()
    }, 100)
  }

  const selectFurnitureWorkProduct = (categoryIndex: number, productIndex: number, product: any) => {
    const newFurnitureWork = [...furnitureWork]
    newFurnitureWork[categoryIndex].products[productIndex] = {
      name: product.name,
      qty: newFurnitureWork[categoryIndex].products[productIndex].qty || 0,
      unit: product.unit,
      price: product.sellingPrice,
      productId: product._id,
    }
    setFurnitureWork(newFurnitureWork)
    setOpenPopovers({ ...openPopovers, [`furnitureWork-${categoryIndex}-${productIndex}`]: false })
    setTimeout(() => {
      furnitureWorkQtyRefs.current[`${categoryIndex}-${productIndex}`]?.focus()
    }, 100)
  }

  // Functions for updating form fields
  const updatePreliminaryItem = (index: number, field: string, value: any) => {
    const newPreliminary = [...preliminary]
    newPreliminary[index] = { ...newPreliminary[index], [field]: value }
    setPreliminary(newPreliminary)
  }

  const addPreliminaryItem = () => {
    setPreliminary([...preliminary, { name: "", qty: 0, unit: "", price: 0 }])
  }

  const removePreliminaryItem = (index: number) => {
    if (preliminary.length > 1) {
      setPreliminary(preliminary.filter((_, i) => i !== index))
    } else {
      // Clear the single item instead of removing it if it's the last one
      setPreliminary([{ name: "", qty: 0, unit: "", price: 0 }])
    }
  }

  const updateFittingOutCategory = (categoryIndex: number, name: string) => {
    const newFittingOut = [...fittingOut]
    newFittingOut[categoryIndex].name = name
    setFittingOut(newFittingOut)
  }

  const updateFittingOutProduct = (categoryIndex: number, productIndex: number, field: string, value: any) => {
    const newFittingOut = [...fittingOut]
    newFittingOut[categoryIndex].products[productIndex] = {
      ...newFittingOut[categoryIndex].products[productIndex],
      [field]: value,
    }
    setFittingOut(newFittingOut)
  }

  const addFittingOutProduct = (categoryIndex: number) => {
    const newFittingOut = [...fittingOut]
    newFittingOut[categoryIndex].products.push({ name: "", qty: 0, unit: "", price: 0 })
    setFittingOut(newFittingOut)
  }

  const removeFittingOutProduct = (categoryIndex: number, productIndex: number) => {
    const newFittingOut = [...fittingOut]
    if (newFittingOut[categoryIndex].products.length > 1) {
      newFittingOut[categoryIndex].products = newFittingOut[categoryIndex].products.filter((_, i) => i !== productIndex)
      setFittingOut(newFittingOut)
    } else {
      // Clear the single product instead of removing it if it's the last one in the category
      newFittingOut[categoryIndex].products = [{ name: "", qty: 0, unit: "", price: 0 }]
      setFittingOut(newFittingOut)
    }
  }

  const addFittingOutCategory = () => {
    setFittingOut([...fittingOut, { name: "", products: [{ name: "", qty: 0, unit: "", price: 0 }] }])
  }

  const removeFittingOutCategory = (categoryIndex: number) => {
    if (fittingOut.length > 1) {
      setFittingOut(fittingOut.filter((_, i) => i !== categoryIndex))
    } else {
      // Clear the single category instead of removing it if it's the last one
      setFittingOut([{ name: "", products: [{ name: "", qty: 0, unit: "", price: 0 }] }])
    }
  }

  const updateFurnitureWorkCategory = (categoryIndex: number, name: string) => {
    const newFurnitureWork = [...furnitureWork]
    newFurnitureWork[categoryIndex].name = name
    setFurnitureWork(newFurnitureWork)
  }

  const updateFurnitureWorkProduct = (categoryIndex: number, productIndex: number, field: string, value: any) => {
    const newFurnitureWork = [...furnitureWork]
    newFurnitureWork[categoryIndex].products[productIndex] = {
      ...newFurnitureWork[categoryIndex].products[productIndex],
      [field]: value,
    }
    setFurnitureWork(newFurnitureWork)
  }

  const addFurnitureWorkProduct = (categoryIndex: number) => {
    const newFurnitureWork = [...furnitureWork]
    newFurnitureWork[categoryIndex].products.push({ name: "", qty: 0, unit: "", price: 0 })
    setFurnitureWork(newFurnitureWork)
  }

  const removeFurnitureWorkProduct = (categoryIndex: number, productIndex: number) => {
    const newFurnitureWork = [...furnitureWork]
    if (newFurnitureWork[categoryIndex].products.length > 1) {
      newFurnitureWork[categoryIndex].products = newFurnitureWork[categoryIndex].products.filter(
        (_, i) => i !== productIndex,
      )
      setFurnitureWork(newFurnitureWork)
    } else {
      // Clear the single product instead of removing it if it's the last one in the category
      newFurnitureWork[categoryIndex].products = [{ name: "", qty: 0, unit: "", price: 0 }]
      setFurnitureWork(newFurnitureWork)
    }
  }

  const addFurnitureWorkCategory = () => {
    setFurnitureWork([...furnitureWork, { name: "", products: [{ name: "", qty: 0, unit: "", price: 0 }] }])
  }

  const removeFurnitureWorkCategory = (categoryIndex: number) => {
    if (furnitureWork.length > 1) {
      setFurnitureWork(furnitureWork.filter((_, i) => i !== categoryIndex))
    } else {
      // Clear the single category instead of removing it if it's the last one
      setFurnitureWork([{ name: "", products: [{ name: "", qty: 0, unit: "", price: 0 }] }])
    }
  }

  // Handlers for creating BOQ
  const handleCreateMainBOQ = async () => {
    try {
      setLoading(true)

      const filteredPreliminary = preliminary.filter((item) => item.name && item.unit)
      const filteredFittingOut = fittingOut
        .map((category) => ({
          ...category,
          products: category.products.filter((product) => product.name && product.unit),
        }))
        .filter((category) => category.name && category.products.length > 0)
      const filteredFurnitureWork = furnitureWork
        .map((category) => ({
          ...category,
          products: category.products.filter((product) => product.name && product.unit),
        }))
        .filter((category) => category.name && category.products.length > 0)

      if (filteredPreliminary.length === 0 && filteredFittingOut.length === 0 && filteredFurnitureWork.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please add at least one item to any section before creating BOQ",
          variant: "destructive",
        })
        return
      }

      const boqData = {
        preliminary: filteredPreliminary,
        fittingOut: filteredFittingOut,
        furnitureWork: filteredFurnitureWork,
      }

      if (editingBOQ) {
        await boqApi.update(projectId, editingBOQ._id, boqData)
        toast({
          title: "Success",
          description: "BOQ updated successfully",
        })
      } else {
        await boqApi.create(projectId, boqData)
        toast({
          title: "Success",
          description: "Main BOQ created successfully",
        })
      }

      // Reset states
      setCreationMode(null)
      setEditingBOQ(null)
      setPreliminary([])
      setFittingOut([])
      setFurnitureWork([])
      loadBOQs()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save BOQ",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUseTemplate = async (template: any) => {
    try {
      setLoading(true)
      const response = await boqApi.create(projectId, {
        preliminary: template.preliminary || [],
        fittingOut: template.fittingOut || [],
        furnitureWork: template.furnitureWork || [],
      })

      if (response.success) {
        toast({
          title: "Success",
          description: "Main BOQ created from template successfully",
        })
        loadBOQs()
        setCreationMode(null)
        setSelectedTemplate(null)
        setShowTemplatePreview(false)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create BOQ from template",
      })
    } finally {
      setLoading(false)
    }
  }

  // Product creation functions
  const generateSKU = () => {
    const getAbbreviation = (text: string) => {
      if (!text) return "XXX"
      const words = text.trim().split(/\s+/)
      if (words.length >= 3) {
        return words
          .slice(0, 3)
          .map((w) => w[0])
          .join("")
          .toUpperCase()
      } else if (words.length === 2) {
        return (words[0].substring(0, 2) + words[1][0]).toUpperCase()
      } else if (words.length === 1) {
        const word = words[0]
        if (word.length >= 3) {
          return word.substring(0, 3).toUpperCase()
        } else if (word.length === 2) {
          return (word + word[1]).toUpperCase()
        } else {
          return (word + word + word).toUpperCase()
        }
      }
      return "XXX"
    }

    const typeMap: { [key: string]: string } = {
      Goods: "GO",
      Services: "SE",
      "Goods and Services": "GS",
    }

    const productAbbr = getAbbreviation(productFormData.name)
    const typeAbbr = typeMap[productFormData.type] || "XX"
    const brandAbbr = getAbbreviation(productFormData.brand)
    const year = new Date().getFullYear().toString().slice(-2)

    const sku = `${productAbbr}-${typeAbbr}-${brandAbbr}-${year}`
    setProductFormData({ ...productFormData, sku })
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const token = localStorage.getItem("auth_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const result = await response.json()
      setUploadedPhotos([...uploadedPhotos, { url: result.data.url, provider: result.data.provider }])
      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload photo",
      })
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = (index: number) => {
    setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== index))
  }

  const addDetailField = () => {
    setProductDetails([...productDetails, { label: "", type: "text", value: "" }])
  }

  const removeDetailField = (index: number) => {
    setProductDetails(productDetails.filter((_, i) => i !== index))
  }

  const updateDetailField = (index: number, field: string, value: any) => {
    const newDetails = [...productDetails]
    newDetails[index] = { ...newDetails[index], [field]: value }
    setProductDetails(newDetails)
  }

  const resetProductForm = () => {
    setProductFormData({
      name: "",
      type: "Goods",
      unit: "",
      brand: "",
      sellingPrice: "",
      purchasePrice: "",
      sku: "",
    })
    setUploadedPhotos([])
    setProductDetails([])
  }

  const handleCreateProduct = async () => {
    if (!productFormData.name || !productFormData.unit || !productFormData.sku) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }

    setSubmittingProduct(true)
    try {
      const response = await productsApi.create({
        name: productFormData.name,
        type: productFormData.type,
        unit: productFormData.unit,
        brand: productFormData.brand || undefined,
        sellingPrice: Number(productFormData.sellingPrice) || 0,
        purchasePrice: Number(productFormData.purchasePrice) || 0,
        sku: productFormData.sku,
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
        details: productDetails.length > 0 ? productDetails : undefined,
      })

      if (response.success) {
        toast({
          title: "Success",
          description: "Product created successfully",
        })
        setCreateProductDialogOpen(false)
        resetProductForm()
        fetchProducts()
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create product",
      })
    } finally {
      setSubmittingProduct(false)
    }
  }

  const handleDeleteBOQ = async (boqId: string) => {
    if (!confirm("Are you sure you want to delete this BOQ?")) return

    try {
      await boqApi.delete(projectId, boqId)
      toast({
        title: "Success",
        description: "BOQ deleted successfully",
      })
      loadBOQs()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete BOQ",
      })
    }
  }

  const mainBOQ = boqItems.find((boq) => boq.number === 1)
  const additionalBOQs = boqItems.filter((boq) => boq.number > 1)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading BOQ...</p>
      </div>
    )
  }

  if (!mainBOQ && !creationMode) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Main BOQ</CardTitle>
            <CardDescription>Choose how you want to create your Bill of Quantities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-32 flex flex-col items-center justify-center gap-3 bg-transparent"
                onClick={() => setCreationMode("blank")}
              >
                <FileSpreadsheet className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Create from Blank</div>
                  <div className="text-sm text-muted-foreground">Start with an empty BOQ</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-32 flex flex-col items-center justify-center gap-3 bg-transparent"
                onClick={() => setCreationMode("template")}
              >
                <Sparkles className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Import from Template</div>
                  <div className="text-sm text-muted-foreground">Use a pre-made template</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!mainBOQ && creationMode === "template") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Select Template</h2>
            <p className="text-muted-foreground">Choose a template to create your BOQ</p>
          </div>
          <Button variant="outline" onClick={() => setCreationMode(null)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template._id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">{template.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Preliminary: {template.preliminary?.length || 0} items</div>
                  <div>Fitting Out: {template.fittingOut?.length || 0} categories</div>
                  <div>Furniture Work: {template.furnitureWork?.length || 0} categories</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => {
                      setSelectedTemplate(template)
                      setShowTemplatePreview(true)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => handleUseTemplate(template)} disabled={loading}>
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {templates.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No templates available</p>
              <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setCreationMode("blank")}>
                Create from Blank Instead
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Template Preview Dialog */}
        <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTemplate?.name}</DialogTitle>
              <DialogDescription>Preview template details</DialogDescription>
            </DialogHeader>
            {selectedTemplate && renderBOQTable(selectedTemplate)}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTemplatePreview(false)}>
                Close
              </Button>
              <Button onClick={() => handleUseTemplate(selectedTemplate)} disabled={loading}>
                Use This Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (!mainBOQ && creationMode === "blank") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{editingBOQ ? "Edit Main BOQ" : "Create Main BOQ"}</h2>
            <p className="text-muted-foreground">Fill in the details for your Bill of Quantities</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreationMode(null)
                setEditingBOQ(null)
                setPreliminary([])
                setFittingOut([])
                setFurnitureWork([])
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateMainBOQ} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingBOQ ? "Update BOQ" : "Create BOQ"}
            </Button>
          </div>
        </div>

        {/* Preliminary Section - Same as template creation */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">I. PRELIMINARY</h3>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[5%]">No</TableHead>
                  <TableHead className="w-[40%]">Item Name</TableHead>
                  <TableHead className="w-[15%]">Quantity</TableHead>
                  <TableHead className="w-[15%]">Unit</TableHead>
                  <TableHead className="w-[20%]">Price</TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preliminary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No items yet. Click "Add Item" button below to start adding items.
                    </TableCell>
                  </TableRow>
                ) : (
                  preliminary.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium text-center">{index + 1}</TableCell>
                      <TableCell className="align-top">
                        <Popover
                          open={openPopovers[`preliminary-${index}`]}
                          onOpenChange={(open) =>
                            setOpenPopovers((prev) => ({ ...prev, [`preliminary-${index}`]: open }))
                          }
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between min-h-[40px] h-auto text-left font-normal bg-transparent"
                            >
                              <span className="whitespace-normal break-words text-left">
                                {item.name || "Select product..."}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[500px] p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Search product..."
                                onValueChange={(value) =>
                                  setSearchQuery({ ...searchQuery, [`preliminary-${index}`]: value })
                                }
                              />
                              <CommandList>
                                <CommandEmpty>
                                  {loadingProducts ? (
                                    "Loading products..."
                                  ) : (
                                    <div className="p-2">
                                      <p className="text-sm text-muted-foreground mb-2">No product found.</p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full bg-transparent"
                                        onClick={() => {
                                          setOpenPopovers({ ...openPopovers, [`preliminary-${index}`]: false })
                                          setCreateProductDialogOpen(true)
                                        }}
                                      >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create New Product
                                      </Button>
                                    </div>
                                  )}
                                </CommandEmpty>
                                <CommandGroup className="max-h-[300px] overflow-auto">
                                  {products.map((product) => (
                                    <CommandItem
                                      key={product._id}
                                      value={product.name}
                                      onSelect={() => {
                                        selectPreliminaryProduct(index, product)
                                      }}
                                      className="flex flex-col items-start py-3 hover:bg-primary/30 cursor-pointer"
                                    >
                                      <div className="flex items-center w-full">
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4 shrink-0",
                                            item.name === product.name ? "opacity-100" : "opacity-0",
                                          )}
                                        />
                                        <div className="flex-1">
                                          <div className="font-medium">
                                            {highlightText(product.name, searchQuery[`preliminary-${index}`] || "")}
                                          </div>
                                          <div className="text-xs text-muted-foreground mt-1 space-x-2">
                                            <span>SKU: {product.sku}</span>
                                            <span>•</span>
                                            <span>Type: {product.type}</span>
                                            {product.brand && (
                                              <>
                                                <span>•</span>
                                                <span>Brand: {product.brand}</span>
                                              </>
                                            )}
                                          </div>
                                          <div className="text-xs text-muted-foreground mt-1">
                                            Price: {formatCurrency(product.sellingPrice)}
                                          </div>
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell className="align-top">
                        <Input
                          ref={(el) => {
                            preliminaryQtyRefs.current[index] = el
                          }}
                          type="number"
                          value={item.qty}
                          onChange={(e) => updatePreliminaryItem(index, "qty", Number(e.target.value))}
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Input
                          value={item.unit}
                          onChange={(e) => updatePreliminaryItem(index, "unit", e.target.value)}
                          placeholder="ls, m2"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => updatePreliminaryItem(index, "price", Number(e.target.value))}
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePreliminaryItem(index)}
                          // Removed disabled check here as it's handled by the ternary above
                          // disabled={preliminary.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="p-4 border-t">
              <Button type="button" onClick={addPreliminaryItem} variant="outline" className="w-full bg-transparent">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Fitting Out Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">II. FITTING OUT</h3>
          {fittingOut.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No categories yet. Click "Add Category" button below to start adding fitting out categories.
              </CardContent>
            </Card>
          ) : (
            fittingOut.map((category, categoryIndex) => (
              <Card key={categoryIndex}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label>Category Name</Label>
                      <Input
                        value={category.name}
                        onChange={(e) => updateFittingOutCategory(categoryIndex, e.target.value)}
                        placeholder="e.g., Partition Work, Wall Finishes"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFittingOutCategory(categoryIndex)}
                      // Removed disabled check here as it's handled by the ternary above
                      // disabled={fittingOut.length === 1}
                      className="mt-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[5%]">No</TableHead>
                        <TableHead className="w-[40%]">Product Name</TableHead>
                        <TableHead className="w-[15%]">Quantity</TableHead>
                        <TableHead className="w-[15%]">Unit</TableHead>
                        <TableHead className="w-[20%]">Price</TableHead>
                        <TableHead className="w-[10%] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {category.products.map((product, productIndex) => (
                        <TableRow key={productIndex}>
                          <TableCell className="font-medium text-center">{productIndex + 1}</TableCell>
                          <TableCell className="align-top">
                            <Popover
                              open={openPopovers[`fittingOut-${categoryIndex}-${productIndex}`]}
                              onOpenChange={(open) =>
                                setOpenPopovers((prev) => ({
                                  ...prev,
                                  [`fittingOut-${categoryIndex}-${productIndex}`]: open,
                                }))
                              }
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between min-h-[40px] h-auto text-left font-normal bg-transparent"
                                >
                                  <span className="whitespace-normal break-words text-left">
                                    {product.name || "Select product..."}
                                  </span>
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[500px] p-0" align="start">
                                <Command>
                                  <CommandInput
                                    placeholder="Search product..."
                                    onValueChange={(value) =>
                                      setSearchQuery({
                                        ...searchQuery,
                                        [`fittingOut-${categoryIndex}-${productIndex}`]: value,
                                      })
                                    }
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      {loadingProducts ? (
                                        "Loading products..."
                                      ) : (
                                        <div className="p-2">
                                          <p className="text-sm text-muted-foreground mb-2">No product found.</p>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full bg-transparent"
                                            onClick={() => {
                                              setOpenPopovers({
                                                ...openPopovers,
                                                [`fittingOut-${categoryIndex}-${productIndex}`]: false,
                                              })
                                              setCreateProductDialogOpen(true)
                                            }}
                                          >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create New Product
                                          </Button>
                                        </div>
                                      )}
                                    </CommandEmpty>
                                    <CommandGroup className="max-h-[300px] overflow-auto">
                                      {products.map((product) => (
                                        <CommandItem
                                          key={product._id}
                                          value={product.name}
                                          onSelect={() => {
                                            selectFittingOutProduct(categoryIndex, productIndex, product)
                                          }}
                                          className="flex flex-col items-start py-3 hover:bg-primary/30 cursor-pointer"
                                        >
                                          <div className="flex items-center w-full">
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4 shrink-0",
                                                product.name === product.name ? "opacity-100" : "opacity-0",
                                              )}
                                            />
                                            <div className="flex-1">
                                              <div className="font-medium">
                                                {highlightText(
                                                  product.name,
                                                  searchQuery[`fittingOut-${categoryIndex}-${productIndex}`] || "",
                                                )}
                                              </div>
                                              <div className="text-xs text-muted-foreground mt-1 space-x-2">
                                                <span>SKU: {product.sku}</span>
                                                <span>•</span>
                                                <span>Type: {product.type}</span>
                                                {product.brand && (
                                                  <>
                                                    <span>•</span>
                                                    <span>Brand: {product.brand}</span>
                                                  </>
                                                )}
                                              </div>
                                              <div className="text-xs text-muted-foreground mt-1">
                                                Price: {formatCurrency(product.sellingPrice)}
                                              </div>
                                            </div>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              ref={(el) => {
                                fittingOutQtyRefs.current[`${categoryIndex}-${productIndex}`] = el
                              }}
                              type="number"
                              value={product.qty}
                              onChange={(e) =>
                                updateFittingOutProduct(categoryIndex, productIndex, "qty", Number(e.target.value))
                              }
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              value={product.unit}
                              onChange={(e) =>
                                updateFittingOutProduct(categoryIndex, productIndex, "unit", e.target.value)
                              }
                              placeholder="ls, m2"
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              type="number"
                              value={product.price}
                              onChange={(e) =>
                                updateFittingOutProduct(categoryIndex, productIndex, "price", Number(e.target.value))
                              }
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell className="text-right align-top">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFittingOutProduct(categoryIndex, productIndex)}
                              // Removed disabled check here as it's handled by the ternary above
                              // disabled={category.products.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-4 border-t">
                    <Button
                      type="button"
                      onClick={() => addFittingOutProduct(categoryIndex)}
                      variant="outline"
                      className="w-full bg-transparent"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          <Button type="button" onClick={addFittingOutCategory} variant="outline" className="w-full bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Furniture Work Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">III. FURNITURE WORK</h3>
          {furnitureWork.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No categories yet. Click "Add Category" button below to start adding furniture work categories.
              </CardContent>
            </Card>
          ) : (
            furnitureWork.map((category, categoryIndex) => (
              <Card key={categoryIndex}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label>Category Name</Label>
                      <Input
                        value={category.name}
                        onChange={(e) => updateFurnitureWorkCategory(categoryIndex, e.target.value)}
                        placeholder="e.g., Cabinet Work, Furniture Installation"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFurnitureWorkCategory(categoryIndex)}
                      // Removed disabled check here as it's handled by the ternary above
                      // disabled={furnitureWork.length === 1}
                      className="mt-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[5%]">No</TableHead>
                        <TableHead className="w-[40%]">Product Name</TableHead>
                        <TableHead className="w-[15%]">Quantity</TableHead>
                        <TableHead className="w-[15%]">Unit</TableHead>
                        <TableHead className="w-[20%]">Price</TableHead>
                        <TableHead className="w-[10%] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {category.products.map((product, productIndex) => (
                        <TableRow key={productIndex}>
                          <TableCell className="font-medium text-center">{productIndex + 1}</TableCell>
                          <TableCell className="align-top">
                            <Popover
                              open={openPopovers[`furnitureWork-${categoryIndex}-${productIndex}`]}
                              onOpenChange={(open) =>
                                setOpenPopovers((prev) => ({
                                  ...prev,
                                  [`furnitureWork-${categoryIndex}-${productIndex}`]: open,
                                }))
                              }
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between min-h-[40px] h-auto text-left font-normal bg-transparent"
                                >
                                  <span className="whitespace-normal break-words text-left">
                                    {product.name || "Select product..."}
                                  </span>
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[500px] p-0" align="start">
                                <Command>
                                  <CommandInput
                                    placeholder="Search product..."
                                    onValueChange={(value) =>
                                      setSearchQuery({
                                        ...searchQuery,
                                        [`furnitureWork-${categoryIndex}-${productIndex}`]: value,
                                      })
                                    }
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      {loadingProducts ? (
                                        "Loading products..."
                                      ) : (
                                        <div className="p-2">
                                          <p className="text-sm text-muted-foreground mb-2">No product found.</p>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full bg-transparent"
                                            onClick={() => {
                                              setOpenPopovers({
                                                ...openPopovers,
                                                [`furnitureWork-${categoryIndex}-${productIndex}`]: false,
                                              })
                                              setCreateProductDialogOpen(true)
                                            }}
                                          >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create New Product
                                          </Button>
                                        </div>
                                      )}
                                    </CommandEmpty>
                                    <CommandGroup className="max-h-[300px] overflow-auto">
                                      {products.map((product) => (
                                        <CommandItem
                                          key={product._id}
                                          value={product.name}
                                          onSelect={() => {
                                            selectFurnitureWorkProduct(categoryIndex, productIndex, product)
                                          }}
                                          className="flex flex-col items-start py-3 hover:bg-primary/30 cursor-pointer"
                                        >
                                          <div className="flex items-center w-full">
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4 shrink-0",
                                                product.name === product.name ? "opacity-100" : "opacity-0",
                                              )}
                                            />
                                            <div className="flex-1">
                                              <div className="font-medium">
                                                {highlightText(
                                                  product.name,
                                                  searchQuery[`furnitureWork-${categoryIndex}-${productIndex}`] || "",
                                                )}
                                              </div>
                                              <div className="text-xs text-muted-foreground mt-1 space-x-2">
                                                <span>SKU: {product.sku}</span>
                                                <span>•</span>
                                                <span>Type: {product.type}</span>
                                                {product.brand && (
                                                  <>
                                                    <span>•</span>
                                                    <span>Brand: {product.brand}</span>
                                                  </>
                                                )}
                                              </div>
                                              <div className="text-xs text-muted-foreground mt-1">
                                                Price: {formatCurrency(product.sellingPrice)}
                                              </div>
                                            </div>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              ref={(el) => {
                                furnitureWorkQtyRefs.current[`${categoryIndex}-${productIndex}`] = el
                              }}
                              type="number"
                              value={product.qty}
                              onChange={(e) =>
                                updateFurnitureWorkProduct(categoryIndex, productIndex, "qty", Number(e.target.value))
                              }
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              value={product.unit}
                              onChange={(e) =>
                                updateFurnitureWorkProduct(categoryIndex, productIndex, "unit", e.target.value)
                              }
                              placeholder="ls, m2"
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              type="number"
                              value={product.price}
                              onChange={(e) =>
                                updateFurnitureWorkProduct(categoryIndex, productIndex, "price", Number(e.target.value))
                              }
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell className="text-right align-top">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFurnitureWorkProduct(categoryIndex, productIndex)}
                              // Removed disabled check here as it's handled by the ternary above
                              // disabled={category.products.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-4 border-t">
                    <Button
                      type="button"
                      onClick={() => addFurnitureWorkProduct(categoryIndex)}
                      variant="outline"
                      className="w-full bg-transparent"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          <Button type="button" onClick={addFurnitureWorkCategory} variant="outline" className="w-full bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>
    )
  }

  // Main return statement for when a main BOQ exists
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Bill of Quantity</h2>
          <p className="text-muted-foreground">Manage project BOQs and cost estimates</p>
        </div>
        {/* This button logic is now handled by the creation mode state */}
        {!mainBOQ && !creationMode && (
          <Button onClick={() => setCreationMode("blank")} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Main BOQ
          </Button>
        )}
        {mainBOQ && !creationMode && (
          <Button onClick={handleCreateAdditionalBOQ} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Additional BOQ
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalBudget)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total BOQs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{boqItems.length}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {mainBOQ ? "1 Main" : "0 Main"} + {additionalBOQs.length} Additional
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Main BOQ Status</CardTitle>
          </CardHeader>
          <CardContent>
            {mainBOQ ? (
              getStatusBadge(mainBOQ.status)
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Not Created
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile: Dropdown */}
        <div className="block md:hidden mb-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select BOQ type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main">Main BOQ {mainBOQ && `(${mainBOQ.status})`}</SelectItem>
              <SelectItem value="additional">Additional BOQs ({additionalBOQs.length})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: Tabs */}
        <TabsList className="hidden md:flex">
          <TabsTrigger value="main" className="flex items-center gap-2">
            Main BOQ
            {mainBOQ && <span className="text-xs opacity-70">({mainBOQ.status})</span>}
          </TabsTrigger>
          <TabsTrigger value="additional" className="flex items-center gap-2">
            Additional BOQs
            {additionalBOQs.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 flex items-center justify-center px-1">
                {additionalBOQs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">Loading BOQ...</p>
              </CardContent>
            </Card>
          ) : !mainBOQ ? (
            // This part is now handled by the initial render logic when !mainBOQ && !creationMode
            <></>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <CardTitle>Main BOQ</CardTitle>
                      {getStatusBadge(mainBOQ.status)}
                    </div>
                    <CardDescription>
                      BOQ #{mainBOQ.number} • Created: {new Date(mainBOQ.createdAt).toLocaleDateString("id-ID")}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingBOQ(mainBOQ)
                      setCreationMode("blank") // Navigate to blank creation form for editing
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>{renderBOQTable(mainBOQ)}</CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="additional" className="space-y-4">
          {additionalBOQs.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <Alert>
                  <AlertDescription className="text-center">
                    No additional BOQs yet. Click "Add Additional BOQ" to create one.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : (
            additionalBOQs.map((boq) => (
              <Card key={boq._id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <CardTitle>Additional BOQ #{boq.number}</CardTitle>
                        {getStatusBadge(boq.status)}
                      </div>
                      <CardDescription>Created: {new Date(boq.createdAt).toLocaleDateString("id-ID")}</CardDescription>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingBOQ(boq)
                          setCreationMode("blank") // Navigate to blank creation form for editing
                          setIsCreatingAdditional(true) // Indicate this is an additional BOQ
                        }}
                        className="flex-1 sm:flex-none"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none bg-transparent"
                        onClick={() => handleDeleteBOQ(boq._id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>{renderBOQTable(boq)}</CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <CreateBOQDialog
        projectId={projectId}
        open={false} // This dialog is no longer the primary way of creating/editing BOQs
        onOpenChange={handleDialogClose}
        onSuccess={loadBOQs} // Corrected: use loadBOQs instead of loadBOQ
        boq={editingBOQ}
        isAdditional={isCreatingAdditional}
      />

      {/* Create Product Dialog */}
      <Dialog open={createProductDialogOpen} onOpenChange={setCreateProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
            <DialogDescription>Add a new product to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Product Name *</Label>
              <Input
                id="create-name"
                value={productFormData.name}
                onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                placeholder="e.g., Semen"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-type">Type *</Label>
                <Select
                  value={productFormData.type}
                  onValueChange={(value: any) => setProductFormData({ ...productFormData, type: value })}
                >
                  <SelectTrigger id="create-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Goods">Goods</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Goods and Services">Goods and Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-unit">Unit *</Label>
                <Input
                  id="create-unit"
                  value={productFormData.unit}
                  onChange={(e) => setProductFormData({ ...productFormData, unit: e.target.value })}
                  placeholder="e.g., liter"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-brand">Brand</Label>
                <Input
                  id="create-brand"
                  value={productFormData.brand}
                  onChange={(e) => setProductFormData({ ...productFormData, brand: e.target.value })}
                  placeholder="e.g., Mitsubishi"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-purchase">Purchase Price (IDR) *</Label>
                <Input
                  id="create-purchase"
                  type="number"
                  value={productFormData.purchasePrice}
                  onChange={(e) => setProductFormData({ ...productFormData, purchasePrice: e.target.value })}
                  placeholder="e.g., 20000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-selling">Selling Price (IDR) *</Label>
                <Input
                  id="create-selling"
                  type="number"
                  value={productFormData.sellingPrice}
                  onChange={(e) => setProductFormData({ ...productFormData, sellingPrice: e.target.value })}
                  placeholder="e.g., 25000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-sku">SKU *</Label>
              <div className="flex gap-2">
                <Input
                  id="create-sku"
                  value={productFormData.sku}
                  onChange={(e) => setProductFormData({ ...productFormData, sku: e.target.value })}
                  placeholder="e.g., DSG-GS-MIT-25"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSKU}
                  className="whitespace-nowrap bg-transparent"
                >
                  Generate SKU
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Photos</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center py-4">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {uploading ? "Uploading..." : "Click to upload photo"}
                    </p>
                  </div>
                </label>

                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {uploadedPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${photo.provider}/${photo.url}`}
                          alt={`Product ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Product Details</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDetailField}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Detail
                </Button>
              </div>

              {productDetails.map((detail, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4 space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={detail.label}
                      onChange={(e) => updateDetailField(index, "label", e.target.value)}
                      placeholder="e.g., Color"
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={detail.type} onValueChange={(value: any) => updateDetailField(index, "type", value)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4 space-y-1">
                    <Label className="text-xs">Value</Label>
                    <Input
                      value={detail.value}
                      onChange={(e) => updateDetailField(index, "value", e.target.value)}
                      placeholder="e.g., Ungu"
                      type={detail.type === "number" ? "number" : detail.type === "date" ? "date" : "text"}
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDetailField(index)}
                      className="h-9 w-9"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {productDetails.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No details added yet. Click "Add Detail" to add product specifications.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateProductDialogOpen(false)
                resetProductForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProduct}
              disabled={submittingProduct || !productFormData.name || !productFormData.unit || !productFormData.sku}
            >
              {submittingProduct && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
