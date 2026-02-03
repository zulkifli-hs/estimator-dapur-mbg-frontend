"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation" // Import useParams
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card" // Added CardTitle
import { Plus, Trash2, X, ArrowLeft, Loader2, Edit, Save, ChevronsUpDown, Check, Upload, Sparkles } from "lucide-react"
import { templatesApi } from "@/lib/api/templates"
import { productsApi } from "@/lib/api/products"
import { uploadApi } from "@/lib/api/upload"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog" // Added DialogDescription, DialogFooter
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn, formatCurrency } from "@/lib/utils" // Added formatCurrency to import
import { ProductSearchPopover } from "@/components/product-search-popover"

interface PreliminaryItem {
  name: string
  qty: number
  unit: string
  price: number
  productId?: string
  location?: string
  brand?: string
}

interface Product {
  name: string
  qty: number
  unit: string
  price: number
  productId?: string
  location?: string
  brand?: string
}

interface Category {
  name: string
  products: Product[]
}

// Move formatCurrency outside component (already done in existing code)
// const formatCurrency = (value: number) => {
//   return new Intl.NumberFormat("id-ID", {
//     style: "currency",
//     currency: "IDR",
//     minimumFractionDigits: 0,
//   }).format(value)
// }

export default function TemplateDetailPage() {
  const params = useParams() //
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [preliminary, setPreliminary] = useState<PreliminaryItem[]>([])
  const [fittingOut, setFittingOut] = useState<Category[]>([])
  const [furnitureWork, setFurnitureWork] = useState<Category[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Product dropdown functionality states
  const [searchQuery, setSearchQuery] = useState<Record<string, string>>({})
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({})
  const [createProductDialogOpen, setCreateProductDialogOpen] = useState(false)

  // Refs for auto-focus
  const preliminaryQtyRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const fittingOutQtyRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const furnitureWorkQtyRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Create product form states
  const [newProductName, setNewProductName] = useState("")
  const [newProductType, setNewProductType] = useState("Goods")
  const [newProductUnit, setNewProductUnit] = useState("")
  const [newProductSellingPrice, setNewProductSellingPrice] = useState(0)
  const [newProductPurchasePrice, setNewProductPurchasePrice] = useState(0)
  const [newProductSku, setNewProductSku] = useState("")
  const [newProductBrand, setNewProductBrand] = useState("")
  const [newProductPhotos, setNewProductPhotos] = useState<{ url: string; provider: string }[]>([])
  const [newProductDetails, setNewProductDetails] = useState<{ label: string; type: string; value: string }[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [creatingProduct, setCreatingProduct] = useState(false)

  const fetchTemplate = async () => {
    if (!params.id) return

    setLoading(true)
    try {
      const response = await templatesApi.getById(params.id as string)
      console.log("[v0] Template response:", response)

      if (response.success && response.data) {
        const template = response.data
        console.log("[v0] Template name:", template.name)
        console.log("[v0] Preliminary items:", template.preliminary?.length)
        console.log("[v0] Fitting Out categories:", template.fittingOut?.length)
        console.log("[v0] Furniture Work categories:", template.furnitureWork?.length)

        setTemplateName(template.name || "")
        setPreliminary(template.preliminary || [])
        setFittingOut(template.fittingOut || [])
        setFurnitureWork(template.furnitureWork || [])
      } else {
        toast({
          title: "Error",
          description: "Template not found",
          variant: "destructive",
        })
        router.push("/boq-templates")
      }
    } catch (error) {
      console.error("[v0] Failed to fetch template:", error) // Added [v0] prefix
      toast({
        title: "Error",
        description: "Failed to load template",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchTemplate()
    }
  }, [params.id])

  // Highlight text function
  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, "gi"))
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="bg-primary/30 font-semibold">
              {part}
            </span>
          ) : (
            part
          ),
        )}
      </>
    )
  }

  // Preliminary functions
  const addPreliminaryItem = () => {
    setPreliminary([...preliminary, { name: "", qty: 0, unit: "", price: 0 }])
  }

  const removePreliminaryItem = (index: number) => {
    if (preliminary.length > 1) {
      setPreliminary(preliminary.filter((_, i) => i !== index))
    }
  }

  const updatePreliminaryItem = (index: number, field: keyof PreliminaryItem, value: string | number) => {
    const updated = [...preliminary]
    updated[index] = { ...updated[index], [field]: value }
    setPreliminary(updated)
  }

  // Product selection functions with productId
  const selectPreliminaryProduct = (index: number, product: any) => {
    const updated = [...preliminary]
    updated[index] = {
      ...updated[index],
      name: product.name,
      unit: product.unit,
      price: product.sellingPrice,
      productId: product._id,
      brand: product.brand || "",
    }
    setPreliminary(updated)
    setOpenPopovers({ ...openPopovers, [`preliminary-${index}`]: false })
    setTimeout(() => preliminaryQtyRefs.current[index]?.focus(), 100)
  }

  // Fitting Out functions
  const addFittingOutCategory = () => {
    setFittingOut([...fittingOut, { name: "", products: [{ name: "", qty: 0, unit: "", price: 0 }] }])
  }

  const removeFittingOutCategory = (index: number) => {
    if (fittingOut.length > 1) {
      setFittingOut(fittingOut.filter((_, i) => i !== index))
    }
  }

  const updateFittingOutCategory = (index: number, value: string) => {
    const updated = [...fittingOut]
    updated[index].name = value
    setFittingOut(updated)
  }

  const addFittingOutProduct = (categoryIndex: number) => {
    const updated = [...fittingOut]
    updated[categoryIndex].products.push({ name: "", qty: 0, unit: "", price: 0 })
    setFittingOut(updated)
  }

  const removeFittingOutProduct = (categoryIndex: number, productIndex: number) => {
    const updated = [...fittingOut]
    if (updated[categoryIndex].products.length > 1) {
      updated[categoryIndex].products = updated[categoryIndex].products.filter((_, i) => i !== productIndex)
      setFittingOut(updated)
    }
  }

  const updateFittingOutProduct = (
    categoryIndex: number,
    productIndex: number,
    field: keyof Product,
    value: string | number,
  ) => {
    const updated = [...fittingOut]
    updated[categoryIndex].products[productIndex] = {
      ...updated[categoryIndex].products[productIndex],
      [field]: value,
    }
    setFittingOut(updated)
  }

  const selectFittingOutProduct = (categoryIndex: number, productIndex: number, product: any) => {
    const updated = [...fittingOut]
    updated[categoryIndex].products[productIndex] = {
      ...updated[categoryIndex].products[productIndex],
      name: product.name,
      unit: product.unit,
      price: product.sellingPrice,
      productId: product._id,
      brand: product.brand || "",
    }
    setFittingOut(updated)
    setOpenPopovers({ ...openPopovers, [`fittingOut-${categoryIndex}-${productIndex}`]: false })
    setTimeout(() => fittingOutQtyRefs.current[`${categoryIndex}-${productIndex}`]?.focus(), 100)
  }

  // Furniture Work functions
  const addFurnitureWorkCategory = () => {
    setFurnitureWork([...furnitureWork, { name: "", products: [{ name: "", qty: 0, unit: "", price: 0 }] }])
  }

  const removeFurnitureWorkCategory = (index: number) => {
    if (furnitureWork.length > 1) {
      setFurnitureWork(furnitureWork.filter((_, i) => i !== index))
    }
  }

  const updateFurnitureWorkCategory = (index: number, value: string) => {
    const updated = [...furnitureWork]
    updated[index].name = value
    setFurnitureWork(updated)
  }

  const addFurnitureWorkProduct = (categoryIndex: number) => {
    const updated = [...furnitureWork]
    updated[categoryIndex].products.push({ name: "", qty: 0, unit: "", price: 0 })
    setFurnitureWork(updated)
  }

  const removeFurnitureWorkProduct = (categoryIndex: number, productIndex: number) => {
    const updated = [...furnitureWork]
    if (updated[categoryIndex].products.length > 1) {
      updated[categoryIndex].products = updated[categoryIndex].products.filter((_, i) => i !== productIndex)
      setFurnitureWork(updated)
    }
  }

  const updateFurnitureWorkProduct = (
    categoryIndex: number,
    productIndex: number,
    field: keyof Product,
    value: string | number,
  ) => {
    const updated = [...furnitureWork]
    updated[categoryIndex].products[productIndex] = {
      ...updated[categoryIndex].products[productIndex],
      [field]: value,
    }
    setFurnitureWork(updated)
  }

  const selectFurnitureWorkProduct = (categoryIndex: number, productIndex: number, product: any) => {
    const updated = [...furnitureWork]
    updated[categoryIndex].products[productIndex] = {
      ...updated[categoryIndex].products[productIndex],
      name: product.name,
      unit: product.unit,
      price: product.sellingPrice,
      productId: product._id,
      brand: product.brand || "",
    }
    setFurnitureWork(updated)
    setOpenPopovers({ ...openPopovers, [`furnitureWork-${categoryIndex}-${productIndex}`]: false })
    setTimeout(() => furnitureWorkQtyRefs.current[`${categoryIndex}-${productIndex}`]?.focus(), 100)
  }

  // SKU generation function
  const generateSKU = () => {
    const getAbbreviation = (text: string) => {
      if (!text) return ""
      const words = text.trim().split(/\s+/)
      if (words.length >= 3) {
        return words
          .slice(0, 3)
          .map((w) => w[0].toUpperCase())
          .join("")
      } else if (words.length === 2) {
        return (words[0].substring(0, 2) + words[1][0]).toUpperCase()
      } else if (words.length === 1) {
        return words[0].substring(0, 3).toUpperCase().padEnd(3, words[0][0].toUpperCase())
      }
      return ""
    }

    const nameAbbr = getAbbreviation(newProductName)
    const typeAbbr = newProductType === "Goods" ? "GO" : newProductType === "Services" ? "SE" : "GS"
    const brandAbbr = getAbbreviation(newProductBrand)
    const year = new Date().getFullYear().toString().slice(-2)

    setNewProductSku(`${nameAbbr}-${typeAbbr}-${brandAbbr}-${year}`)
  }

  // Photo upload function
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingPhoto(true)
      const response = await uploadApi.uploadFile(file)
      setNewProductPhotos([...newProductPhotos, { url: response.url, provider: response.provider }])
      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      })
    } catch (error) {
      console.error("[v0] Failed to upload photo:", error)
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      })
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Create product function
  const handleCreateProduct = async () => {
    if (!newProductName.trim()) {
      toast({
        title: "Error",
        description: "Product name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setCreatingProduct(true)
      await productsApi.create({
        name: newProductName,
        type: newProductType,
        unit: newProductUnit,
        sellingPrice: newProductSellingPrice,
        purchasePrice: newProductPurchasePrice,
        sku: newProductSku,
        brand: newProductBrand,
        photos: newProductPhotos,
        details: newProductDetails,
      })

      toast({
        title: "Success",
        description: "Product created successfully",
      })
      setCreateProductDialogOpen(false)

      // Reset form
      setNewProductName("")
      setNewProductType("Goods")
      setNewProductUnit("")
      setNewProductSellingPrice(0)
      setNewProductPurchasePrice(0)
      setNewProductSku("")
      setNewProductBrand("")
      setNewProductPhotos([])
      setNewProductDetails([])
    } catch (error) {
      console.error("[v0] Failed to create product:", error)
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      })
    } finally {
      setCreatingProduct(false)
    }
  }

  const handleSave = async () => {
    if (!templateName?.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      await templatesApi.update(params.id, {
        // Use params.id here
        name: templateName,
        preliminary: preliminary.map((item) => ({
          name: item.name,
          qty: item.qty,
          unit: item.unit,
          price: item.price,
          productId: item.productId,
          location: item.location,
          brand: item.brand,
        })),
        fittingOut: fittingOut.map((category) => ({
          name: category.name,
          products: category.products.map((product) => ({
            name: product.name,
            qty: product.qty,
            unit: product.unit,
            price: product.price,
            productId: product.productId,
            location: product.location,
            brand: product.brand,
          })),
        })),
        furnitureWork: furnitureWork.map((category) => ({
          name: category.name,
          products: category.products.map((product) => ({
            name: product.name,
            qty: product.qty,
            unit: product.unit,
            price: product.price,
            productId: product.productId,
            location: product.location,
            brand: product.brand,
          })),
        })),
      })

      toast({
        title: "Success",
        description: "Template updated successfully",
      })
      setIsEditMode(false)
      fetchTemplate() // Re-fetch to ensure clean state after edit
    } catch (error) {
      console.error("[v0] Failed to update template:", error)
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const renderBOQTable = (template: any) => {
    let itemNumber = 1
    let grandTotal = 0

    return (
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] px-4">No</TableHead>
              <TableHead className="min-w-[250px] max-w-[400px] px-4">Item Name</TableHead>
              <TableHead className="w-[120px] px-4">Brand/Equal</TableHead>
              <TableHead className="w-[120px] px-4">Location</TableHead>
              <TableHead className="text-right w-[80px] px-4">Qty</TableHead>
              <TableHead className="w-[80px] px-4">Unit</TableHead>
              <TableHead className="text-right w-[150px] px-4">Unit Price</TableHead>
              <TableHead className="text-right w-[150px] px-4">Total Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* PRELIMINARY SECTION */}
            {Array.isArray(template.preliminary) && template.preliminary.length > 0 && (
              <>
                <TableRow className="bg-primary/10">
                  <TableCell colSpan={8} className="font-bold text-primary uppercase px-4 py-3">
                    PRELIMINARY
                  </TableCell>
                </TableRow>
                {template.preliminary.map((item: any, idx: number) => {
                  const total = (item.qty || 0) * (item.price || 0)
                  grandTotal += total
                  return (
                    <TableRow key={item._id || `prelim-${idx}`}>
                      <TableCell className="font-medium pl-8 pr-4">{itemNumber++}</TableCell>
                      <TableCell className="whitespace-normal break-words px-4">{item.name}</TableCell>
                      <TableCell className="px-4">{item.brand || "-"}</TableCell>
                      <TableCell className="px-4">{item.location || "-"}</TableCell>
                      <TableCell className="text-right px-4">{item.qty}</TableCell>
                      <TableCell className="px-4">{item.unit}</TableCell>
                      <TableCell className="text-right px-4">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right font-medium px-4">{formatCurrency(total)}</TableCell>
                    </TableRow>
                  )
                })}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={7} className="text-right font-semibold px-4 py-3">
                    Subtotal Preliminary
                  </TableCell>
                  <TableCell className="text-right font-semibold px-4 py-3">
                    {formatCurrency(
                      template.preliminary.reduce(
                        (sum: number, item: any) => sum + (item.qty || 0) * (item.price || 0),
                        0,
                      ),
                    )}
                  </TableCell>
                </TableRow>
              </>
            )}

            {/* FITTING OUT SECTION */}
            {Array.isArray(template.fittingOut) && template.fittingOut.length > 0 && (
              <>
                <TableRow className="bg-primary/10">
                  <TableCell colSpan={8} className="font-bold text-primary uppercase px-4 py-3">
                    FITTING OUT
                  </TableCell>
                </TableRow>
                {template.fittingOut.map((category: any, catIdx: number) => {
                  const categoryTotal =
                    Array.isArray(category.products) &&
                    category.products.reduce((sum: number, p: any) => sum + (p.qty || 0) * (p.price || 0), 0)
                  grandTotal += categoryTotal || 0

                  return (
                    <React.Fragment key={category._id || `fitout-cat-${catIdx}`}>
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={8} className="font-semibold pl-8 pr-4 py-2">
                          {category.name}
                        </TableCell>
                      </TableRow>
                      {Array.isArray(category.products) &&
                        category.products.map((product: any, prodIdx: number) => {
                          const total = (product.qty || 0) * (product.price || 0)
                          return (
                            <TableRow key={product._id || `fitout-prod-${catIdx}-${prodIdx}`}>
                              <TableCell className="font-medium pl-12 pr-4">{itemNumber++}</TableCell>
                              <TableCell className="whitespace-normal break-words px-4">{product.name}</TableCell>
                              <TableCell className="px-4">{product.brand || "-"}</TableCell>
                              <TableCell className="px-4">{product.location || "-"}</TableCell>
                              <TableCell className="text-right px-4">{product.qty}</TableCell>
                              <TableCell className="px-4">{product.unit}</TableCell>
                              <TableCell className="text-right px-4">{formatCurrency(product.price)}</TableCell>
                              <TableCell className="text-right font-medium px-4">{formatCurrency(total)}</TableCell>
                            </TableRow>
                          )
                        })}
                      <TableRow className="bg-muted/20">
                        <TableCell colSpan={7} className="text-right text-sm font-medium pl-12 pr-4 py-2">
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
                  <TableCell colSpan={7} className="text-right font-semibold px-4 py-3">
                    Subtotal Fitting Out
                  </TableCell>
                  <TableCell className="text-right font-semibold px-4 py-3">
                    {formatCurrency(
                      template.fittingOut.reduce(
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
            {Array.isArray(template.furnitureWork) && template.furnitureWork.length > 0 && (
              <>
                <TableRow className="bg-primary/10">
                  <TableCell colSpan={8} className="font-bold text-primary uppercase px-4 py-3">
                    FURNITURE WORK
                  </TableCell>
                </TableRow>
                {template.furnitureWork.map((category: any, catIdx: number) => {
                  const categoryTotal =
                    Array.isArray(category.products) &&
                    category.products.reduce((sum: number, p: any) => sum + (p.qty || 0) * (p.price || 0), 0)
                  grandTotal += categoryTotal || 0

                  return (
                    <React.Fragment key={category._id || `furniture-cat-${catIdx}`}>
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={8} className="font-semibold pl-8 pr-4 py-2">
                          {category.name}
                        </TableCell>
                      </TableRow>
                      {Array.isArray(category.products) &&
                        category.products.map((product: any, prodIdx: number) => {
                          const total = (product.qty || 0) * (product.price || 0)
                          return (
                            <TableRow key={product._id || `furniture-prod-${catIdx}-${prodIdx}`}>
                              <TableCell className="font-medium pl-12 pr-4">{itemNumber++}</TableCell>
                              <TableCell className="whitespace-normal break-words px-4">{product.name}</TableCell>
                              <TableCell className="px-4">{product.brand || "-"}</TableCell>
                              <TableCell className="px-4">{product.location || "-"}</TableCell>
                              <TableCell className="text-right px-4">{product.qty}</TableCell>
                              <TableCell className="px-4">{product.unit}</TableCell>
                              <TableCell className="text-right px-4">{formatCurrency(product.price)}</TableCell>
                              <TableCell className="text-right font-medium px-4">{formatCurrency(total)}</TableCell>
                            </TableRow>
                          )
                        })}
                      <TableRow className="bg-muted/20">
                        <TableCell colSpan={7} className="text-right text-sm font-medium pl-12 pr-4 py-2">
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
                  <TableCell colSpan={7} className="text-right font-semibold px-4 py-3">
                    Subtotal Furniture Work
                  </TableCell>
                  <TableCell className="text-right font-semibold px-4 py-3">
                    {formatCurrency(
                      template.furnitureWork.reduce(
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
                <TableRow className="bg-primary/20 font-bold">
                  <TableCell colSpan={7} className="text-right text-lg px-4 py-4">
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{isEditMode ? "Edit Template" : "Template Details"}</h1>
            <p className="text-muted-foreground">{isEditMode ? "Edit your template" : "View template details"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditMode ? (
            <>
              <Button variant="outline" onClick={() => setIsEditMode(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditMode(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Template
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <Label htmlFor="templateName">Template Name</Label>
          {isEditMode ? (
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name"
              className="max-w-md"
            />
          ) : (
            <p className="text-lg font-medium">{templateName}</p>
          )}
        </CardHeader>
      </Card>

      {isEditMode ? (
        <div className="space-y-6">
          {/* Preliminary Section */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">I. PRELIMINARY</h3>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {preliminary.map((item, index) => (
                  <div key={index} className="p-4 space-y-3">
                    {/* First Row: Number and Item Name */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center font-medium text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Item Name</Label>
                        <ProductSearchPopover
                          products={products}
                          selectedProductName={item.name}
                          onSelect={(product) => selectPreliminaryProduct(index, product)}
                          onCreateNew={() => setCreateProductDialogOpen(true)}
                          loadingProducts={loadingProducts}
                          className="w-full min-h-[40px] h-auto text-left font-normal"
                          formatCurrency={formatCurrency}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePreliminaryItem(index)}
                        disabled={preliminary.length === 1}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                  {/* Second Row: Other Fields */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pl-11">
                  <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Brand/Equal</Label>
                  <Input
                  value={item.brand || ""}
                  onChange={(e) => updatePreliminaryItem(index, "brand", e.target.value)}
                  placeholder="e.g. Jayaboard, Elephant"
                  />
                  </div>
                  <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Location (optional)</Label>
                  <Input
                  value={item.location || ""}
                  onChange={(e) => updatePreliminaryItem(index, "location", e.target.value)}
                  placeholder="e.g. Front, Back"
                  />
                  </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Quantity</Label>
                        <Input
                          ref={(el) => {
                            preliminaryQtyRefs.current[index] = el
                          }}
                          type="number"
                          value={item.qty}
                          onChange={(e) => updatePreliminaryItem(index, "qty", Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Unit</Label>
                        <Input
                          value={item.unit}
                          onChange={(e) => updatePreliminaryItem(index, "unit", e.target.value)}
                          placeholder="ls, m2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Price</Label>
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => updatePreliminaryItem(index, "price", Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
            {fittingOut.map((category, categoryIndex) => (
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
                      disabled={fittingOut.length === 1}
                      className="mt-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {category.products.map((product, productIndex) => (
                      <div key={productIndex} className="p-4 space-y-3">
                        {/* First Row: Number and Product Name */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center font-medium text-sm">
                            {productIndex + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Product Name</Label>
                            <ProductSearchPopover
                              products={products}
                              selectedProductName={product.name}
                              onSelect={(prod) => selectFittingOutProduct(categoryIndex, productIndex, prod)}
                              onCreateNew={() => setCreateProductDialogOpen(true)}
                              loadingProducts={loadingProducts}
                              className="w-full min-h-[40px] h-auto text-left font-normal"
                              formatCurrency={formatCurrency}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFittingOutProduct(categoryIndex, productIndex)}
                            disabled={category.products.length === 1}
                            className="flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                      {/* Second Row: Other Fields */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pl-11">
                      <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Brand/Equal</Label>
                      <Input
                      value={product.brand || ""}
                      onChange={(e) => updateFittingOutProduct(categoryIndex, productIndex, "brand", e.target.value)}
                      placeholder="e.g. Jayaboard, Elephant"
                      />
                      </div>
                      <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Location (optional)</Label>
                      <Input
                      value={product.location || ""}
                      onChange={(e) =>
                      updateFittingOutProduct(categoryIndex, productIndex, "location", e.target.value)
                      }
                      placeholder="e.g. Front, Back"
                      />
                      </div>
                      <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Quantity</Label>
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
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Unit</Label>
                            <Input
                              value={product.unit}
                              onChange={(e) =>
                                updateFittingOutProduct(categoryIndex, productIndex, "unit", e.target.value)
                              }
                              placeholder="m2, unit"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Price</Label>
                            <Input
                              type="number"
                              value={product.price}
                              onChange={(e) =>
                                updateFittingOutProduct(categoryIndex, productIndex, "price", Number(e.target.value))
                              }
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t">
                    <Button
                      type="button"
                      onClick={() => addFittingOutProduct(categoryIndex)}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button type="button" onClick={addFittingOutCategory} variant="outline" className="w-full bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          {/* Furniture Work Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">III. FURNITURE WORK</h3>
            {furnitureWork.map((category, categoryIndex) => (
              <Card key={categoryIndex}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label>Category Name</Label>
                      <Input
                        value={category.name}
                        onChange={(e) => updateFurnitureWorkCategory(categoryIndex, e.target.value)}
                        placeholder="e.g., STAFF AREA, MEETING ROOM"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFurnitureWorkCategory(categoryIndex)}
                      disabled={furnitureWork.length === 1}
                      className="mt-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {category.products.map((product, productIndex) => (
                      <div key={productIndex} className="p-4 space-y-3">
                        {/* First Row: Number and Product Name */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center font-medium text-sm">
                            {productIndex + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Product Name</Label>
                            <ProductSearchPopover
                              products={products}
                              selectedProductName={product.name}
                              onSelect={(prod) => selectFurnitureWorkProduct(categoryIndex, productIndex, prod)}
                              onCreateNew={() => setCreateProductDialogOpen(true)}
                              loadingProducts={loadingProducts}
                              className="w-full min-h-[40px] h-auto text-left font-normal"
                              formatCurrency={formatCurrency}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFurnitureWorkProduct(categoryIndex, productIndex)}
                            disabled={category.products.length === 1}
                            className="flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                      {/* Second Row: Other Fields */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pl-11">
                      <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Brand/Equal</Label>
                      <Input
                      value={product.brand || ""}
                      onChange={(e) =>
                      updateFurnitureWorkProduct(categoryIndex, productIndex, "brand", e.target.value)
                      }
                      placeholder="e.g. Jayaboard, Elephant"
                      />
                      </div>
                      <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Location (optional)</Label>
                      <Input
                      value={product.location || ""}
                      onChange={(e) =>
                      updateFurnitureWorkProduct(categoryIndex, productIndex, "location", e.target.value)
                      }
                      placeholder="e.g. Front, Back"
                      />
                      </div>
                      <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Quantity</Label>
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
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Unit</Label>
                            <Input
                              value={product.unit}
                              onChange={(e) =>
                                updateFurnitureWorkProduct(categoryIndex, productIndex, "unit", e.target.value)
                              }
                              placeholder="m2, unit"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Price</Label>
                            <Input
                              type="number"
                              value={product.price}
                              onChange={(e) =>
                                updateFurnitureWorkProduct(categoryIndex, productIndex, "price", Number(e.target.value))
                              }
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t">
                    <Button
                      type="button"
                      onClick={() => addFurnitureWorkProduct(categoryIndex)}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              type="button"
              onClick={addFurnitureWorkCategory}
              variant="outline"
              className="w-full bg-transparent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">{renderBOQTable({ preliminary, fittingOut, furnitureWork })}</div>
      )}

      <Dialog open={createProductDialogOpen} onOpenChange={setCreateProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Name</Label>
              <Input
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Enter product name"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={newProductType} onValueChange={setNewProductType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Goods">Goods</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Goods and Services">Goods and Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit</Label>
                <Input
                  value={newProductUnit}
                  onChange={(e) => setNewProductUnit(e.target.value)}
                  placeholder="e.g., pcs, m2"
                />
              </div>
              <div>
                <Label>Brand</Label>
                <Input
                  value={newProductBrand}
                  onChange={(e) => setNewProductBrand(e.target.value)}
                  placeholder="Brand name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchase Price</Label>
                <Input
                  type="number"
                  value={newProductPurchasePrice}
                  onChange={(e) => setNewProductPurchasePrice(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Selling Price</Label>
                <Input
                  type="number"
                  value={newProductSellingPrice}
                  onChange={(e) => setNewProductSellingPrice(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>SKU</Label>
                <Button type="button" variant="outline" size="sm" onClick={generateSKU}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate SKU
                </Button>
              </div>
              <Input value={newProductSku} onChange={(e) => setNewProductSku(e.target.value)} placeholder="SKU" />
            </div>

            <div>
              <Label>Photos</Label>
              <div className="space-y-2">
                {newProductPhotos.map((photo, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/${photo.provider}/${photo.url}`}
                      alt="Product"
                      className="h-16 w-16 object-cover rounded"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setNewProductPhotos(newProductPhotos.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                    id="product-photo-upload"
                  />
                  <label htmlFor="product-photo-upload">
                    <Button type="button" variant="outline" size="sm" disabled={uploadingPhoto} asChild>
                      <span>
                        {uploadingPhoto ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Upload Photo
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Product Details</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewProductDetails([...newProductDetails, { label: "", type: "text", value: "" }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Detail
                </Button>
              </div>
              {newProductDetails.map((detail, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    placeholder="Name"
                    value={detail.label}
                    onChange={(e) => {
                      const updated = [...newProductDetails]
                      updated[index].label = e.target.value
                      setNewProductDetails(updated)
                    }}
                    className="flex-1"
                  />
                  <Select
                    value={detail.type}
                    onValueChange={(value) => {
                      const updated = [...newProductDetails]
                      updated[index].type = value
                      setNewProductDetails(updated)
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Value"
                    type={detail.type === "number" ? "number" : detail.type === "date" ? "date" : "text"}
                    value={detail.value}
                    onChange={(e) => {
                      const updated = [...newProductDetails]
                      updated[index].value = e.target.value
                      setNewProductDetails(updated)
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setNewProductDetails(newProductDetails.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateProductDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProduct} disabled={creatingProduct}>
                {creatingProduct && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
