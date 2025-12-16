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
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface PreliminaryItem {
  name: string
  qty: number
  unit: string
  price: number
  productId?: string // Added productId field
}

interface ProductItem {
  name: string
  qty: number
  unit: string
  price: number
  productId?: string // Added productId field
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
  const [products, setProducts] = useState<
    { _id: string; name: string; qty: number; unit: string; sellingPrice: number }[]
  >([])
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
    product: { _id: string; name: string; qty: number; unit: string; sellingPrice: number }, // Added _id to product type
  ) => {
    const updated = [...preliminary]
    updated[index] = {
      ...updated[index],
      name: product.name,
      unit: product.unit,
      price: product.sellingPrice,
      productId: product._id, // Store the product ID
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
    product: { _id: string; name: string; qty: number; unit: string; sellingPrice: number }, // Added _id to product type
  ) => {
    const updated = [...fittingOut]
    updated[categoryIndex].products[productIndex] = {
      ...updated[categoryIndex].products[productIndex],
      name: product.name,
      unit: product.unit,
      price: product.sellingPrice,
      productId: product._id, // Store the product ID
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
    product: { _id: string; name: string; qty: number; unit: string; sellingPrice: number }, // Added _id to product type
  ) => {
    const updated = [...furnitureWork]
    updated[categoryIndex].products[productIndex] = {
      ...updated[categoryIndex].products[productIndex],
      name: product.name,
      unit: product.unit,
      price: product.sellingPrice,
      productId: product._id, // Store the product ID
    }
    setFurnitureWork(updated)

    // Close the popover
    setOpenPopovers((prev) => ({ ...prev, [`furnitureWork-${categoryIndex}-${productIndex}`]: false }))

    // Focus on quantity input
    setTimeout(() => {
      furnitureWorkQtyRefs.current[`${categoryIndex}-${productIndex}`]?.focus()
    }, 100)
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

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
                            <span className="truncate">{item.name || "Select product..."}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[500px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search product..." />
                            <CommandList>
                              <CommandEmpty>
                                {loadingProducts ? "Loading products..." : "No product found."}
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
                                        <div className="font-medium">{product.name}</div>
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
                                <span className="truncate">{product.name || "Select product..."}</span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[500px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search product..." />
                                <CommandList>
                                  <CommandEmpty>
                                    {loadingProducts ? "Loading products..." : "No product found."}
                                  </CommandEmpty>
                                  <CommandGroup className="max-h-[300px] overflow-auto">
                                    {products.map((prod) => (
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
                                            <div className="font-medium">{prod.name}</div>
                                            <div className="text-xs text-muted-foreground mt-1 space-x-2">
                                              <span>SKU: {prod.sku}</span>
                                              <span>•</span>
                                              <span>Type: {prod.type}</span>
                                              {prod.brand && (
                                                <>
                                                  <span>•</span>
                                                  <span>Brand: {prod.brand}</span>
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
                                <span className="truncate">{product.name || "Select product..."}</span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[500px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search product..." />
                                <CommandList>
                                  <CommandEmpty>
                                    {loadingProducts ? "Loading products..." : "No product found."}
                                  </CommandEmpty>
                                  <CommandGroup className="max-h-[300px] overflow-auto">
                                    {products.map((prod) => (
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
                                            <div className="font-medium">{prod.name}</div>
                                            <div className="text-xs text-muted-foreground mt-1 space-x-2">
                                              <span>SKU: {prod.sku}</span>
                                              <span>•</span>
                                              <span>Type: {prod.type}</span>
                                              {prod.brand && (
                                                <>
                                                  <span>•</span>
                                                  <span>Brand: {prod.brand}</span>
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
    </div>
  )
}
