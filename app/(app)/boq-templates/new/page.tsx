"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Trash2, X, ArrowLeft, Loader2, Check, ChevronsUpDown } from "lucide-react"
import { templatesApi } from "@/lib/api/templates"
import { productsApi } from "@/lib/api/products"
import { uploadApi } from "@/lib/api/upload" // Import upload API for photo uploads in create product dialog
import { CreateProductDialog } from "@/components/products/create-product-dialog"
import { useToast } from "@/hooks/use-toast"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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

export default function NewTemplatePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [templateName, setTemplateName] = useState("")

  const [preliminary, setPreliminary] = useState<PreliminaryItem[]>([{ name: "", qty: 0, unit: "", price: 0 }])
  const [fittingOut, setFittingOut] = useState<Category[]>([
    { name: "", products: [{ name: "", qty: 0, unit: "", price: 0 }] },
  ])
  const [furnitureWork, setFurnitureWork] = useState<Category[]>([
    { name: "", products: [{ name: "", qty: 0, unit: "", price: 0 }] },
  ])
  const [mechanicalElectrical, setMechanicalElectrical] = useState<Category[]>([
    { name: "", products: [{ name: "", qty: 0, unit: "", price: 0 }] },
  ])

  const [openPopovers, setOpenPopovers] = useState<{ [key: string]: boolean }>({})

  const preliminaryQtyRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})
  const fittingOutQtyRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const furnitureWorkQtyRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const mechanicalElectricalQtyRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const [createProductDialogOpen, setCreateProductDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState<{ [key: string]: string }>({}) // State for search queries
  const [products, setProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const response = await productsApi.getAll()
      if (response?.list) {
        setProducts(response.list)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])



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
      qty?: number
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
      qty?: number
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
      qty?: number
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

  // Mechanical / Electrical / Plumbing functions
  const addMechanicalElectricalCategory = () => {
    setMechanicalElectrical([...mechanicalElectrical, { name: "", products: [{ name: "", qty: 0, unit: "", price: 0 }] }])
  }

  const removeMechanicalElectricalCategory = (index: number) => {
    if (mechanicalElectrical.length > 1) {
      setMechanicalElectrical(mechanicalElectrical.filter((_, i) => i !== index))
    }
  }

  const updateMechanicalElectricalCategory = (index: number, value: string) => {
    const updated = [...mechanicalElectrical]
    updated[index].name = value
    setMechanicalElectrical(updated)
  }

  const addMechanicalElectricalProduct = (categoryIndex: number) => {
    const updated = [...mechanicalElectrical]
    updated[categoryIndex].products.push({ name: "", qty: 0, unit: "", price: 0 })
    setMechanicalElectrical(updated)
  }

  const removeMechanicalElectricalProduct = (categoryIndex: number, productIndex: number) => {
    const updated = [...mechanicalElectrical]
    if (updated[categoryIndex].products.length > 1) {
      updated[categoryIndex].products = updated[categoryIndex].products.filter((_, i) => i !== productIndex)
      setMechanicalElectrical(updated)
    }
  }

  const updateMechanicalElectricalProduct = (
    categoryIndex: number,
    productIndex: number,
    field: keyof ProductItem,
    value: string | number,
  ) => {
    const updated = [...mechanicalElectrical]
    updated[categoryIndex].products[productIndex] = {
      ...updated[categoryIndex].products[productIndex],
      [field]: value,
    }
    setMechanicalElectrical(updated)
  }

  const selectMechanicalElectricalProduct = (
    categoryIndex: number,
    productIndex: number,
    product: {
      _id: string
      name: string
      sku: string
      type: string
      brand?: string
      qty?: number
      unit: string
      sellingPrice: number
    },
  ) => {
    const updated = [...mechanicalElectrical]
    updated[categoryIndex].products[productIndex] = {
      ...updated[categoryIndex].products[productIndex],
      name: product.name,
      unit: product.unit,
      price: product.sellingPrice,
      productId: product._id,
      brand: product.brand || "",
    }
    setMechanicalElectrical(updated)

    // Close the popover
    setOpenPopovers((prev) => ({ ...prev, [`mechanicalElectrical-${categoryIndex}-${productIndex}`]: false }))

    // Focus on quantity input
    setTimeout(() => {
      mechanicalElectricalQtyRefs.current[`${categoryIndex}-${productIndex}`]?.focus()
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

  const uploadProductPhoto = async (file: File) => {
    return uploadApi.uploadFile(file)
  }

  const handleProductCreated = () => {
    fetchProducts()
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
        mechanicalElectrical,
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
            <div className="divide-y">
              {preliminary.map((item, index) => (
                <div key={index} className="p-4 space-y-3">
                  {/* First Row: Number and Item Name */}
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-10 flex items-center justify-center font-medium text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Item Name</Label>
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
                            className="w-full justify-between min-h-10 h-auto text-left font-normal bg-transparent"
                          >
                            <span className="whitespace-normal wrap-break-word text-left">
                              {item.name || "Select product..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-125 p-0" align="start">
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
                              <CommandGroup className="max-h-75 overflow-auto">
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
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePreliminaryItem(index)}
                      disabled={preliminary.length === 1}
                      className="shrink-0"
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
                        <div className="shrink-0 w-8 h-10 flex items-center justify-center font-medium text-sm">
                          {productIndex + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Product Name</Label>
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
                                className="w-full justify-between min-h-10 h-auto text-left font-normal bg-transparent"
                              >
                                <span className="whitespace-normal wrap-break-word text-left">
                                  {product.name || "Select product..."}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-125 p-0" align="start">
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
                                  <CommandGroup className="max-h-75 overflow-auto">
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
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFittingOutProduct(categoryIndex, productIndex)}
                          disabled={category.products.length === 1}
                          className="shrink-0"
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
                        <div className="shrink-0 w-8 h-10 flex items-center justify-center font-medium text-sm">
                          {productIndex + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Product Name</Label>
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
                                className="w-full justify-between min-h-10 h-auto text-left font-normal bg-transparent"
                              >
                                <span className="whitespace-normal wrap-break-word text-left">
                                  {product.name || "Select product..."}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-125 p-0" align="start">
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
                                  <CommandGroup className="max-h-75 overflow-auto">
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
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFurnitureWorkProduct(categoryIndex, productIndex)}
                          disabled={category.products.length === 1}
                          className="shrink-0"
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
                            placeholder="unit, set"
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
          <Button type="button" onClick={addFurnitureWorkCategory} variant="outline" className="w-full bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Mechanical / Electrical / Plumbing Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">IV. MECHANICAL / ELECTRICAL / PLUMBING</h3>
          {mechanicalElectrical.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Category Name</Label>
                    <Input
                      value={category.name}
                      onChange={(e) => updateMechanicalElectricalCategory(categoryIndex, e.target.value)}
                      placeholder="e.g., Electrical Installation, Plumbing, HVAC"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMechanicalElectricalCategory(categoryIndex)}
                    disabled={mechanicalElectrical.length === 1}
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
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 w-8 h-10 flex items-center justify-center font-medium text-sm">
                          {productIndex + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Product Name</Label>
                          <ProductSearchPopover
                            selectedProductName={product.name}
                            onSelect={(prod) => selectMechanicalElectricalProduct(categoryIndex, productIndex, prod)}
                            onCreateNew={() => {
                              setCreateProductDialogOpen(true)
                            }}
                            formatCurrency={formatCurrency}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMechanicalElectricalProduct(categoryIndex, productIndex)}
                          disabled={category.products.length === 1}
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pl-11">
                      <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Brand/Equal</Label>
                      <Input
                      value={product.brand || ""}
                      onChange={(e) =>
                      updateMechanicalElectricalProduct(categoryIndex, productIndex, "brand", e.target.value)
                      }
                      placeholder="e.g. Panasonic, Schneider"
                      />
                      </div>
                      <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Location (optional)</Label>
                      <Input
                      value={product.location || ""}
                      onChange={(e) =>
                      updateMechanicalElectricalProduct(categoryIndex, productIndex, "location", e.target.value)
                      }
                      placeholder="e.g. Floor 1, Ceiling"
                      />
                      </div>
                      <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Quantity</Label>
                          <Input
                            ref={(el) => {
                              mechanicalElectricalQtyRefs.current[`${categoryIndex}-${productIndex}`] = el
                            }}
                            type="number"
                            value={product.qty}
                            onChange={(e) =>
                              updateMechanicalElectricalProduct(categoryIndex, productIndex, "qty", Number(e.target.value))
                            }
                            placeholder="0"
                          />
                      </div>
                      <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Unit</Label>
                      <Input
                      value={product.unit}
                      onChange={(e) => updateMechanicalElectricalProduct(categoryIndex, productIndex, "unit", e.target.value)}
                      placeholder="ls, set, pcs"
                      />
                      </div>
                      <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Price</Label>
                      <Input
                      type="number"
                      value={product.price}
                      onChange={(e) =>
                      updateMechanicalElectricalProduct(categoryIndex, productIndex, "price", Number(e.target.value))
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
                    onClick={() => addMechanicalElectricalProduct(categoryIndex)}
                    variant="outline"
                    className="w-full bg-transparent"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button type="button" onClick={addMechanicalElectricalCategory} variant="outline" className="w-full bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      <CreateProductDialog
        open={createProductDialogOpen}
        onOpenChange={setCreateProductDialogOpen}
        uploadPhoto={uploadProductPhoto}
        onCreated={handleProductCreated}
      />
    </div>
  )
}
