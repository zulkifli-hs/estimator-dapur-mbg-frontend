"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, X, ArrowLeft, Loader2, Edit, Save } from "lucide-react"
import { templatesApi } from "@/lib/api/templates"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PreliminaryItem {
  name: string
  qty: number
  unit: string
  price: number
}

interface Product {
  name: string
  qty: number
  unit: string
  price: number
}

interface Category {
  name: string
  products: Product[]
}

export default function TemplateDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [preliminary, setPreliminary] = useState<PreliminaryItem[]>([])
  const [fittingOut, setFittingOut] = useState<Category[]>([])
  const [furnitureWork, setFurnitureWork] = useState<Category[]>([])

  useEffect(() => {
    fetchTemplate()
  }, [params.id])

  const fetchTemplate = async () => {
    setLoading(true)
    try {
      const response = await templatesApi.getById(params.id as string)
      console.log("[v0] Template response:", response)

      if (response.success && response.data) {
        const template = response.data
        console.log("[v0] Template data:", template)
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
      console.error("[v0] Failed to fetch template:", error)
      toast({
        title: "Error",
        description: "Failed to load template",
        variant: "destructive",
      })
      router.push("/boq-templates")
    } finally {
      setLoading(false)
    }
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

  const handleSave = async () => {
    if (!templateName || !templateName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      await templatesApi.update(params.id as string, {
        name: templateName,
        preliminary,
        fittingOut,
        furnitureWork,
      })

      toast({
        title: "Success",
        description: "Template updated successfully",
      })

      setIsEditMode(false)
      fetchTemplate()
    } catch (error) {
      console.error("Failed to update template:", error)
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
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

      <Tabs defaultValue="preliminary" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preliminary">Preliminary</TabsTrigger>
          <TabsTrigger value="fittingOut">Fitting Out</TabsTrigger>
          <TabsTrigger value="furnitureWork">Furniture Work</TabsTrigger>
        </TabsList>

        <TabsContent value="preliminary" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Item Name</TableHead>
                    <TableHead className="w-[15%]">Quantity</TableHead>
                    <TableHead className="w-[15%]">Unit</TableHead>
                    <TableHead className="w-[20%]">Price</TableHead>
                    {isEditMode && <TableHead className="w-[10%] text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preliminary.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="align-top">
                        {isEditMode ? (
                          <Input
                            value={item.name}
                            onChange={(e) => updatePreliminaryItem(index, "name", e.target.value)}
                            placeholder="Item name"
                            className="min-h-[40px]"
                          />
                        ) : (
                          <div className="py-2 whitespace-pre-wrap break-words">{item.name}</div>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        {isEditMode ? (
                          <Input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updatePreliminaryItem(index, "qty", Number(e.target.value))}
                            placeholder="0"
                          />
                        ) : (
                          <div className="py-2">{item.qty}</div>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        {isEditMode ? (
                          <Input
                            value={item.unit}
                            onChange={(e) => updatePreliminaryItem(index, "unit", e.target.value)}
                            placeholder="ls, m2"
                          />
                        ) : (
                          <div className="py-2">{item.unit}</div>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        {isEditMode ? (
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) => updatePreliminaryItem(index, "price", Number(e.target.value))}
                            placeholder="0"
                          />
                        ) : (
                          <div className="py-2">{formatCurrency(item.price)}</div>
                        )}
                      </TableCell>
                      {isEditMode && (
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
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {isEditMode && (
                <div className="p-4 border-t">
                  <Button
                    type="button"
                    onClick={addPreliminaryItem}
                    variant="outline"
                    className="w-full bg-transparent"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fittingOut" className="space-y-4">
          {fittingOut.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Category Name</Label>
                    {isEditMode ? (
                      <Input
                        value={category.name}
                        onChange={(e) => updateFittingOutCategory(categoryIndex, e.target.value)}
                        placeholder="e.g., Partition Work, Wall Finishes"
                      />
                    ) : (
                      <p className="text-lg font-medium mt-1">{category.name}</p>
                    )}
                  </div>
                  {isEditMode && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFittingOutCategory(categoryIndex)}
                      disabled={fittingOut.length === 1}
                      className="mt-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Product Name</TableHead>
                      <TableHead className="w-[15%]">Quantity</TableHead>
                      <TableHead className="w-[15%]">Unit</TableHead>
                      <TableHead className="w-[20%]">Price</TableHead>
                      {isEditMode && <TableHead className="w-[10%] text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.products.map((product, productIndex) => (
                      <TableRow key={productIndex}>
                        <TableCell className="align-top">
                          {isEditMode ? (
                            <Input
                              value={product.name}
                              onChange={(e) =>
                                updateFittingOutProduct(categoryIndex, productIndex, "name", e.target.value)
                              }
                              placeholder="Product name"
                              className="min-h-[40px]"
                            />
                          ) : (
                            <div className="py-2 whitespace-pre-wrap break-words">{product.name}</div>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          {isEditMode ? (
                            <Input
                              type="number"
                              value={product.qty}
                              onChange={(e) =>
                                updateFittingOutProduct(categoryIndex, productIndex, "qty", Number(e.target.value))
                              }
                              placeholder="0"
                            />
                          ) : (
                            <div className="py-2">{product.qty}</div>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          {isEditMode ? (
                            <Input
                              value={product.unit}
                              onChange={(e) =>
                                updateFittingOutProduct(categoryIndex, productIndex, "unit", e.target.value)
                              }
                              placeholder="m2, unit"
                            />
                          ) : (
                            <div className="py-2">{product.unit}</div>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          {isEditMode ? (
                            <Input
                              type="number"
                              value={product.price}
                              onChange={(e) =>
                                updateFittingOutProduct(categoryIndex, productIndex, "price", Number(e.target.value))
                              }
                              placeholder="0"
                            />
                          ) : (
                            <div className="py-2">{formatCurrency(product.price)}</div>
                          )}
                        </TableCell>
                        {isEditMode && (
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
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {isEditMode && (
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
                )}
              </CardContent>
            </Card>
          ))}
          {isEditMode && (
            <Button type="button" onClick={addFittingOutCategory} variant="outline" className="w-full bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          )}
        </TabsContent>

        <TabsContent value="furnitureWork" className="space-y-4">
          {furnitureWork.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Category Name</Label>
                    {isEditMode ? (
                      <Input
                        value={category.name}
                        onChange={(e) => updateFurnitureWorkCategory(categoryIndex, e.target.value)}
                        placeholder="e.g., STAFF AREA, MEETING ROOM"
                      />
                    ) : (
                      <p className="text-lg font-medium mt-1">{category.name}</p>
                    )}
                  </div>
                  {isEditMode && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFurnitureWorkCategory(categoryIndex)}
                      disabled={furnitureWork.length === 1}
                      className="mt-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Product Name</TableHead>
                      <TableHead className="w-[15%]">Quantity</TableHead>
                      <TableHead className="w-[15%]">Unit</TableHead>
                      <TableHead className="w-[20%]">Price</TableHead>
                      {isEditMode && <TableHead className="w-[10%] text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.products.map((product, productIndex) => (
                      <TableRow key={productIndex}>
                        <TableCell className="align-top">
                          {isEditMode ? (
                            <Input
                              value={product.name}
                              onChange={(e) =>
                                updateFurnitureWorkProduct(categoryIndex, productIndex, "name", e.target.value)
                              }
                              placeholder="Product name"
                              className="min-h-[40px]"
                            />
                          ) : (
                            <div className="py-2 whitespace-pre-wrap break-words">{product.name}</div>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          {isEditMode ? (
                            <Input
                              type="number"
                              value={product.qty}
                              onChange={(e) =>
                                updateFurnitureWorkProduct(categoryIndex, productIndex, "qty", Number(e.target.value))
                              }
                              placeholder="0"
                            />
                          ) : (
                            <div className="py-2">{product.qty}</div>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          {isEditMode ? (
                            <Input
                              value={product.unit}
                              onChange={(e) =>
                                updateFurnitureWorkProduct(categoryIndex, productIndex, "unit", e.target.value)
                              }
                              placeholder="unit, set"
                            />
                          ) : (
                            <div className="py-2">{product.unit}</div>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          {isEditMode ? (
                            <Input
                              type="number"
                              value={product.price}
                              onChange={(e) =>
                                updateFurnitureWorkProduct(categoryIndex, productIndex, "price", Number(e.target.value))
                              }
                              placeholder="0"
                            />
                          ) : (
                            <div className="py-2">{formatCurrency(product.price)}</div>
                          )}
                        </TableCell>
                        {isEditMode && (
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
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {isEditMode && (
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
                )}
              </CardContent>
            </Card>
          ))}
          {isEditMode && (
            <Button
              type="button"
              onClick={addFurnitureWorkCategory}
              variant="outline"
              className="w-full bg-transparent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
