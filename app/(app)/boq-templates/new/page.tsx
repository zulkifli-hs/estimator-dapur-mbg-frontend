"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Trash2, X, ArrowLeft, Loader2, Check, ChevronsUpDown, Upload } from "lucide-react"
import { templatesApi } from "@/lib/api/templates"
import { productsApi } from "@/lib/api/products"
import { uploadApi } from "@/lib/api/upload" // Import upload API for photo uploads in create product dialog
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Added Select components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog" // Added Dialog components
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils" // Added formatCurrency import
import { ProductSearchPopover } from "@/components/product-search-popover"

interface PreliminaryItem {
  name: string
  qty: number
  unit: string
  price: number
  productId?: string // Added productId field
  location?: string
  brand?: string
}

interface ProductItem {
  name: string
  qty: number
  unit: string
  price: number
  productId?: string // Added productId field
  location?: string
  brand?: string
}

interface Category {
  name: string
  products: ProductItem[]
}

// Define ProductDetail interface
interface ProductDetail {
  label: string
  type: "text" | "number" | "date"
  value: string
}

export default function NewTemplatePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [products, setProducts] = useState<
    {
      _id: string
      name: string
      sku: string
      type: string
      brand?: string
      qty: number
      unit: string
      sellingPrice: number
    }[]
  >([]) // Updated product type to include sku, type, and brand
  const [loadingProducts, setLoadingProducts] = useState(false)

  const [preliminary, setPreliminary] = useState<PreliminaryItem[]>([{ name: "", qty: 0, unit: "", price: 0 }])
  const [fittingOut, setFittingOut] = useState<Category[]>([
    { name: "", products: [{ name: "", qty: 0, unit: "", price: 0 }] },
  ])
  const [furnitureWork, setFurnitureWork] = useState<Category[]>([
    { name: "", products: [{ name: "", qty: 0, unit: "", price: 0 }] },
  ])

  const [openPopovers, setOpenPopovers] = useState<{ [key: string]: boolean }>({})

  const preliminaryQtyRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})
  const fittingOutQtyRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const furnitureWorkQtyRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const [createProductDialogOpen, setCreateProductDialogOpen] = useState(false)
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
  const [productDetails, setProductDetails] = useState<ProductDetail[]>([])
  const [submittingProduct, setSubmittingProduct] = useState(false)
  const [searchQuery, setSearchQuery] = useState<{ [key: string]: string }>({}) // State for search queries

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true)
      try {
        const response = await productsApi.getAll(1, 1000)
        setProducts(response.list || [])
      } catch (error) {
        console.error("Failed to fetch products:", error)
        toast({
          title: "Error",
          description: "Failed to fetch products",
          variant: "destructive",
        })
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [toast])

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

  const selectPreliminaryProduct = (
    index: number,
    product: {
      _id: string
      name: string
      sku: string
      type: string
      brand?: string
      qty: number
      unit: string
      sellingPrice: number
    }, // Added _id and other fields to product type
  ) => {
    const updated = [...preliminary]
    updated[index] = {
      ...updated[index],
      name: product.name,
      unit: product.unit,
      price: product.sellingPrice,
      productId: product._id, // Store the product ID
      brand: product.brand || "",
    }
    setPreliminary(updated)

    // Close the popover
    setOpenPopovers((prev) => ({ ...prev, [`preliminary-${index}`]: false }))

    // Focus on quantity input
    setTimeout(() => {
      preliminaryQtyRefs.current[index]?.focus()
    }, 100)
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
    field: keyof ProductItem,
    value: string | number,
  ) => {
    const updated = [...fittingOut]
    updated[categoryIndex].products[productIndex] = {
      ...updated[categoryIndex].products[productIndex],
      [field]: value,
    }
    setFittingOut(updated)
  }

  const selectFittingOutProduct = (
    categoryIndex: number,
    productIndex: number,
    product: {
      _id: string
      name: string
      sku: string
      type: string
      brand?: string
      qty: number
      unit: string
      sellingPrice: number
    }, // Added _id and other fields to product type
  ) => {
    const updated = [...fittingOut]
    updated[categoryIndex].products[productIndex] = {
      ...updated[categoryIndex].products[productIndex],
      name: product.name,
      unit: product.unit,
      price: product.sellingPrice,
      productId: product._id, // Store the product ID
      brand: product.brand || "",
    }
    setFittingOut(updated)

    // Close the popover
    setOpenPopovers((prev) => ({ ...prev, [`fittingOut-${categoryIndex}-${productIndex}`]: false }))

    // Focus on quantity input
    setTimeout(() => {
      fittingOutQtyRefs.current[`${categoryIndex}-${productIndex}`]?.focus()
    }, 100)
  }

  // Furniture Work functions (similar to Fitting Out)
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
    field: keyof ProductItem,
    value: string | number,
  ) => {
    const updated = [...furnitureWork]
    updated[categoryIndex].products[productIndex] = {
      ...updated[categoryIndex].products[productIndex],
      [field]: value,
    }
    setFurnitureWork(updated)
  }

  const selectFurnitureWorkProduct = (
    categoryIndex: number,
    productIndex: number,
    product: {
      _id: string
      name: string
      sku: string
      type: string
      brand?: string
      qty: number
      unit: string
      sellingPrice: number
    }, // Added _id and other fields to product type
  ) => {
    const updated = [...furnitureWork]
    updated[categoryIndex].products[productIndex] = {
      ...updated[categoryIndex].products[productIndex],
      name: product.name,
      unit: product.unit,
      price: product.sellingPrice,
      productId: product._id, // Store the product ID
      brand: product.brand || "",
    }
    setFurnitureWork(updated)

    // Close the popover
    setOpenPopovers((prev) => ({ ...prev, [`furnitureWork-${categoryIndex}-${productIndex}`]: false }))

    // Focus on quantity input
    setTimeout(() => {
      furnitureWorkQtyRefs.current[`${categoryIndex}-${productIndex}`]?.focus()
    }, 100)
  }

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

  const generateSKU = () => {
    const getAbbreviation = (text: string): string => {
      if (!text) return "XXX"
      const words = text.trim().split(/\s+/)
      if (words.length >= 3) {
        return words
          .slice(0, 3)
          .map((w) => w[0])
          .join("")
          .toUpperCase()
      }
      if (words.length === 2) {
        return (words[0].substring(0, 2) + words[1][0]).toUpperCase()
      }
      if (words.length === 1) {
        const word = words[0]
        if (word.length >= 3) return word.substring(0, 3).toUpperCase()
        if (word.length === 2) return (word + word[0]).toUpperCase()
        return (word + word + word).toUpperCase()
      }
      return "XXX"
    }

    const typeCode = {
      Goods: "GO",
      Services: "SE",
      "Goods and Services": "GS",
    }[productFormData.type]

    const nameAbbr = getAbbreviation(productFormData.name)
    const brandAbbr = getAbbreviation(productFormData.brand)
    const year = new Date().getFullYear().toString().slice(-2)

    setProductFormData({
      ...productFormData,
      sku: `${nameAbbr}-${typeCode}-${brandAbbr}-${year}`,
    })
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const response = await uploadApi.uploadFile(file)
      setUploadedPhotos([...uploadedPhotos, { url: response.url, provider: response.provider }])
      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
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

  const updateDetailField = (index: number, field: keyof ProductDetail, value: string) => {
    const updated = [...productDetails]
    updated[index] = { ...updated[index], [field]: value }
    setProductDetails(updated)
  }

  const removeDetailField = (index: number) => {
    setProductDetails(productDetails.filter((_, i) => i !== index))
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
    try {
      setSubmittingProduct(true)

      const createData = {
        name: productFormData.name,
        type: productFormData.type,
        unit: productFormData.unit,
        sellingPrice: Number.parseFloat(productFormData.sellingPrice) || 0,
        purchasePrice: Number.parseFloat(productFormData.purchasePrice) || 0,
        sku: productFormData.sku,
        brand: productFormData.brand || undefined,
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
        details:
          productDetails.length > 0
            ? productDetails.map((d) => ({
                label: d.label,
                type: d.type,
                value: d.value,
              }))
            : undefined,
      }

      await productsApi.create(createData)

      toast({
        title: "Success",
        description: "Product created successfully",
      })

      setCreateProductDialogOpen(false)
      resetProductForm()

      // Refresh products list
      const response = await productsApi.getAll(1, 1000)
      setProducts(response.list || [])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create product",
        variant: "destructive",
      })
    } finally {
      setSubmittingProduct(false)
    }
  }

  const handleSubmit = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await templatesApi.create({
        name: templateName,
        preliminary,
        fittingOut,
        furnitureWork,
      })

      toast({
        title: "Success",
        description: "Template created successfully",
      })

      router.push("/boq-templates")
    } catch (error) {
      console.error("Failed to create template:", error)
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Removed unused formatCurrency function as it's now imported from lib/utils

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Template</h1>
            <p className="text-muted-foreground">Create a new BOQ template</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Template
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <Label htmlFor="templateName">Template Name</Label>
          <Input
            id="templateName"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter template name"
            className="max-w-md"
          />
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {/* Preliminary Section */}
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
                {preliminary.map((item, index) => (
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
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search product..."
                              onValueChange={(value) =>
                                setSearchQuery({ ...searchQuery, [`preliminary-${index}`]: value })
                              }
                            />
                            <CommandList>
                              <CommandEmpty>
                                {loadingProducts ? "Loading products..." : "No product found."}
                              </CommandEmpty>
                              <CommandGroup className="max-h-[300px] overflow-auto">
                                {products
                                  .filter((product) => {
                                    const query = (searchQuery[`preliminary-${index}`] || "").toLowerCase()
                                    if (!query) return true
                                    return (
                                      product.name.toLowerCase().includes(query) ||
                                      product.sku.toLowerCase().includes(query) ||
                                      product.type.toLowerCase().includes(query) ||
                                      (product.brand && product.brand.toLowerCase().includes(query))
                                    )
                                  })
                                  .map((product) => (
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
                                            <span>SKU: {highlightText(product.sku, searchQuery[`preliminary-${index}`] || "")}</span>
                                            <span>•</span>
                                            <span>Type: {highlightText(product.type, searchQuery[`preliminary-${index}`] || "")}</span>
                                            {product.brand && (
                                              <>
                                                <span>•</span>
                                                <span>Brand: {highlightText(product.brand, searchQuery[`preliminary-${index}`] || "")}</span>
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
                              <div className="border-t p-2">
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
                        disabled={preliminary.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
                              <Command shouldFilter={false}>
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
                                    {loadingProducts ? "Loading products..." : "No product found."}
                                  </CommandEmpty>
                                  <CommandGroup className="max-h-[300px] overflow-auto">
                                    {products
                                      .filter((prod) => {
                                        const query = (
                                          searchQuery[`fittingOut-${categoryIndex}-${productIndex}`] || ""
                                        ).toLowerCase()
                                        if (!query) return true
                                        return (
                                          prod.name.toLowerCase().includes(query) ||
                                          prod.sku.toLowerCase().includes(query) ||
                                          prod.type.toLowerCase().includes(query) ||
                                          (prod.brand && prod.brand.toLowerCase().includes(query))
                                        )
                                      })
                                      .map((prod) => (
                                        <CommandItem
                                          key={prod._id}
                                          value={prod.name}
                                          onSelect={() => {
                                            selectFittingOutProduct(categoryIndex, productIndex, prod)
                                          }}
                                          className="flex flex-col items-start py-3 hover:bg-primary/30 cursor-pointer"
                                        >
                                          <div className="flex items-center w-full">
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4 shrink-0",
                                                product.name === prod.name ? "opacity-100" : "opacity-0",
                                              )}
                                            />
                                            <div className="flex-1">
                                              <div className="font-medium">
                                                {highlightText(
                                                  prod.name,
                                                  searchQuery[`fittingOut-${categoryIndex}-${productIndex}`] || "",
                                                )}
                                              </div>
                                              <div className="text-xs text-muted-foreground mt-1 space-x-2">
                                                <span>SKU: {highlightText(prod.sku, searchQuery[`fittingOut-${categoryIndex}-${productIndex}`] || "")}</span>
                                                <span>•</span>
                                                <span>Type: {highlightText(prod.type, searchQuery[`fittingOut-${categoryIndex}-${productIndex}`] || "")}</span>
                                                {prod.brand && (
                                                  <>
                                                    <span>•</span>
                                                    <span>Brand: {highlightText(prod.brand, searchQuery[`fittingOut-${categoryIndex}-${productIndex}`] || "")}</span>
                                                  </>
                                                )}
                                              </div>
                                              <div className="text-xs text-muted-foreground mt-1">
                                                Price: {formatCurrency(prod.sellingPrice)}
                                              </div>
                                            </div>
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                  <div className="border-t p-2">
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
                            placeholder="m2, unit"
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
                            disabled={category.products.length === 1}
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
                              <Command shouldFilter={false}>
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
                                    {loadingProducts ? "Loading products..." : "No product found."}
                                  </CommandEmpty>
                                  <CommandGroup className="max-h-[300px] overflow-auto">
                                    {products
                                      .filter((prod) => {
                                        const query = (
                                          searchQuery[`furnitureWork-${categoryIndex}-${productIndex}`] || ""
                                        ).toLowerCase()
                                        if (!query) return true
                                        return (
                                          prod.name.toLowerCase().includes(query) ||
                                          prod.sku.toLowerCase().includes(query) ||
                                          prod.type.toLowerCase().includes(query) ||
                                          (prod.brand && prod.brand.toLowerCase().includes(query))
                                        )
                                      })
                                      .map((prod) => (
                                        <CommandItem
                                          key={prod._id}
                                          value={prod.name}
                                          onSelect={() => {
                                            selectFurnitureWorkProduct(categoryIndex, productIndex, prod)
                                          }}
                                          className="flex flex-col items-start py-3 hover:bg-primary/30 cursor-pointer"
                                        >
                                          <div className="flex items-center w-full">
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4 shrink-0",
                                                product.name === prod.name ? "opacity-100" : "opacity-0",
                                              )}
                                            />
                                            <div className="flex-1">
                                              <div className="font-medium">
                                                {highlightText(
                                                  prod.name,
                                                  searchQuery[`furnitureWork-${categoryIndex}-${productIndex}`] || "",
                                                )}
                                              </div>
                                              <div className="text-xs text-muted-foreground mt-1 space-x-2">
                                                <span>SKU: {highlightText(prod.sku, searchQuery[`furnitureWork-${categoryIndex}-${productIndex}`] || "")}</span>
                                                <span>•</span>
                                                <span>Type: {highlightText(prod.type, searchQuery[`furnitureWork-${categoryIndex}-${productIndex}`] || "")}</span>
                                                {prod.brand && (
                                                  <>
                                                    <span>•</span>
                                                    <span>Brand: {highlightText(prod.brand, searchQuery[`furnitureWork-${categoryIndex}-${productIndex}`] || "")}</span>
                                                  </>
                                                )}
                                              </div>
                                              <div className="text-xs text-muted-foreground mt-1">
                                                Price: {formatCurrency(prod.sellingPrice)}
                                              </div>
                                            </div>
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                  <div className="border-t p-2">
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
                            placeholder="unit, set"
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
                            disabled={category.products.length === 1}
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
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button type="button" onClick={addFurnitureWorkCategory} variant="outline" className="w-full bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      <Dialog open={createProductDialogOpen} onOpenChange={setCreateProductDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
