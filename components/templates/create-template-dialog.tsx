"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, X } from "lucide-react"
import { templatesApi, type BOQTemplate, type TemplateItem, type TemplateCategory } from "@/lib/api/templates"
import { useToast } from "@/hooks/use-toast"

interface CreateTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  template?: BOQTemplate | null
}

export function CreateTemplateDialog({ open, onOpenChange, onSuccess, template }: CreateTemplateDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [preliminary, setPreliminary] = useState<TemplateItem[]>([{ qty: 0, name: "", unit: "", price: 0 }])
  const [fittingOut, setFittingOut] = useState<TemplateCategory[]>([
    { name: "", products: [{ qty: 0, name: "", unit: "", price: 0 }] },
  ])
  const [furnitureWork, setFurnitureWork] = useState<TemplateCategory[]>([
    { name: "", products: [{ qty: 0, name: "", unit: "", price: 0 }] },
  ])

  useEffect(() => {
    if (template && open) {
      setName(template.name || "")
      setPreliminary(
        Array.isArray(template.preliminary) && template.preliminary.length > 0
          ? template.preliminary
          : [{ qty: 0, name: "", unit: "", price: 0 }],
      )
      setFittingOut(
        Array.isArray(template.fittingOut) && template.fittingOut.length > 0
          ? template.fittingOut
          : [{ name: "", products: [{ qty: 0, name: "", unit: "", price: 0 }] }],
      )
      setFurnitureWork(
        Array.isArray(template.furnitureWork) && template.furnitureWork.length > 0
          ? template.furnitureWork
          : [{ name: "", products: [{ qty: 0, name: "", unit: "", price: 0 }] }],
      )
    } else if (!open) {
      resetForm()
    }
  }, [template, open])

  const resetForm = () => {
    setName("")
    setPreliminary([{ qty: 0, name: "", unit: "", price: 0 }])
    setFittingOut([{ name: "", products: [{ qty: 0, name: "", unit: "", price: 0 }] }])
    setFurnitureWork([{ name: "", products: [{ qty: 0, name: "", unit: "", price: 0 }] }])
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const data = {
        name: name.trim(),
        preliminary,
        fittingOut,
        furnitureWork,
      }

      if (template) {
        await templatesApi.update(template._id, data)
        toast({
          title: "Success",
          description: "Template updated successfully",
        })
      } else {
        await templatesApi.create(data)
        toast({
          title: "Success",
          description: "Template created successfully",
        })
      }

      onSuccess()
    } catch (error) {
      console.error("Failed to save template:", error)
      toast({
        title: "Error",
        description: `Failed to ${template ? "update" : "create"} template`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Preliminary functions
  const addPreliminaryItem = () => setPreliminary([...preliminary, { qty: 0, name: "", unit: "", price: 0 }])
  const removePreliminaryItem = (index: number) => setPreliminary(preliminary.filter((_, i) => i !== index))
  const updatePreliminaryItem = (index: number, field: keyof TemplateItem, value: any) => {
    const updated = [...preliminary]
    updated[index] = { ...updated[index], [field]: value }
    setPreliminary(updated)
  }

  // Fitting Out functions
  const addFittingOutCategory = () =>
    setFittingOut([...fittingOut, { name: "", products: [{ qty: 0, name: "", unit: "", price: 0 }] }])
  const removeFittingOutCategory = (index: number) => setFittingOut(fittingOut.filter((_, i) => i !== index))
  const updateFittingOutCategory = (index: number, name: string) => {
    const updated = [...fittingOut]
    updated[index].name = name
    setFittingOut(updated)
  }
  const addFittingOutProduct = (categoryIndex: number) => {
    const updated = [...fittingOut]
    updated[categoryIndex].products.push({ qty: 0, name: "", unit: "", price: 0 })
    setFittingOut(updated)
  }
  const removeFittingOutProduct = (categoryIndex: number, productIndex: number) => {
    const updated = [...fittingOut]
    updated[categoryIndex].products = updated[categoryIndex].products.filter((_, i) => i !== productIndex)
    setFittingOut(updated)
  }
  const updateFittingOutProduct = (
    categoryIndex: number,
    productIndex: number,
    field: keyof TemplateItem,
    value: any,
  ) => {
    const updated = [...fittingOut]
    updated[categoryIndex].products[productIndex] = {
      ...updated[categoryIndex].products[productIndex],
      [field]: value,
    }
    setFittingOut(updated)
  }

  // Furniture Work functions
  const addFurnitureWorkCategory = () =>
    setFurnitureWork([...furnitureWork, { name: "", products: [{ qty: 0, name: "", unit: "", price: 0 }] }])
  const removeFurnitureWorkCategory = (index: number) => setFurnitureWork(furnitureWork.filter((_, i) => i !== index))
  const updateFurnitureWorkCategory = (index: number, name: string) => {
    const updated = [...furnitureWork]
    updated[index].name = name
    setFurnitureWork(updated)
  }
  const addFurnitureWorkProduct = (categoryIndex: number) => {
    const updated = [...furnitureWork]
    updated[categoryIndex].products.push({ qty: 0, name: "", unit: "", price: 0 })
    setFurnitureWork(updated)
  }
  const removeFurnitureWorkProduct = (categoryIndex: number, productIndex: number) => {
    const updated = [...furnitureWork]
    updated[categoryIndex].products = updated[categoryIndex].products.filter((_, i) => i !== productIndex)
    setFurnitureWork(updated)
  }
  const updateFurnitureWorkProduct = (
    categoryIndex: number,
    productIndex: number,
    field: keyof TemplateItem,
    value: any,
  ) => {
    const updated = [...furnitureWork]
    updated[categoryIndex].products[productIndex] = {
      ...updated[categoryIndex].products[productIndex],
      [field]: value,
    }
    setFurnitureWork(updated)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "Create New Template"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Template Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter template name" />
          </div>

          <Tabs defaultValue="preliminary" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preliminary">Preliminary</TabsTrigger>
              <TabsTrigger value="fittingOut">Fitting Out</TabsTrigger>
              <TabsTrigger value="furnitureWork">Furniture Work</TabsTrigger>
            </TabsList>

            <TabsContent value="preliminary" className="space-y-4">
              <div className="space-y-4">
                {preliminary.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 grid grid-cols-4 gap-4">
                          <div>
                            <Label className="mb-1.5 block">Item Name</Label>
                            <Input
                              value={item.name}
                              onChange={(e) => updatePreliminaryItem(index, "name", e.target.value)}
                              placeholder="Item name"
                            />
                          </div>
                          <div>
                            <Label className="mb-1.5 block">Quantity</Label>
                            <Input
                              type="number"
                              value={item.qty}
                              onChange={(e) => updatePreliminaryItem(index, "qty", Number(e.target.value))}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label className="mb-1.5 block">Unit</Label>
                            <Input
                              value={item.unit}
                              onChange={(e) => updatePreliminaryItem(index, "unit", e.target.value)}
                              placeholder="ls, m2, etc"
                            />
                          </div>
                          <div>
                            <Label className="mb-1.5 block">Price</Label>
                            <Input
                              type="number"
                              value={item.price}
                              onChange={(e) => updatePreliminaryItem(index, "price", Number(e.target.value))}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePreliminaryItem(index)}
                          disabled={preliminary.length === 1}
                          className="mt-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button type="button" onClick={addPreliminaryItem} variant="outline" className="w-full bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="fittingOut" className="space-y-4">
              {fittingOut.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="mb-1.5 block">Category Name</Label>
                        <Input
                          value={category.name}
                          onChange={(e) => updateFittingOutCategory(categoryIndex, e.target.value)}
                          placeholder="e.g., Partition Work, Wall Finishes"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFittingOutCategory(categoryIndex)}
                        disabled={fittingOut.length === 1}
                        className="mt-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2 pl-4 border-l-2">
                      {category.products.map((product, productIndex) => (
                        <div key={productIndex} className="flex items-start gap-4">
                          <div className="flex-1 grid grid-cols-4 gap-4">
                            <div>
                              <Label className="text-sm mb-1.5 block">Product Name</Label>
                              <Input
                                value={product.name}
                                onChange={(e) =>
                                  updateFittingOutProduct(categoryIndex, productIndex, "name", e.target.value)
                                }
                                placeholder="Product name"
                              />
                            </div>
                            <div>
                              <Label className="text-sm mb-1.5 block">Qty</Label>
                              <Input
                                type="number"
                                value={product.qty}
                                onChange={(e) =>
                                  updateFittingOutProduct(categoryIndex, productIndex, "qty", Number(e.target.value))
                                }
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <Label className="text-sm mb-1.5 block">Unit</Label>
                              <Input
                                value={product.unit}
                                onChange={(e) =>
                                  updateFittingOutProduct(categoryIndex, productIndex, "unit", e.target.value)
                                }
                                placeholder="m2, unit"
                              />
                            </div>
                            <div>
                              <Label className="text-sm mb-1.5 block">Price</Label>
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFittingOutProduct(categoryIndex, productIndex)}
                            disabled={category.products.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() => addFittingOutProduct(categoryIndex)}
                        variant="outline"
                        size="sm"
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
            </TabsContent>

            <TabsContent value="furnitureWork" className="space-y-4">
              {furnitureWork.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="mb-1.5 block">Category Name</Label>
                        <Input
                          value={category.name}
                          onChange={(e) => updateFurnitureWorkCategory(categoryIndex, e.target.value)}
                          placeholder="e.g., STAFF AREA, MEETING ROOM"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFurnitureWorkCategory(categoryIndex)}
                        disabled={furnitureWork.length === 1}
                        className="mt-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2 pl-4 border-l-2">
                      {category.products.map((product, productIndex) => (
                        <div key={productIndex} className="flex items-start gap-4">
                          <div className="flex-1 grid grid-cols-4 gap-4">
                            <div>
                              <Label className="text-sm mb-1.5 block">Product Name</Label>
                              <Input
                                value={product.name}
                                onChange={(e) =>
                                  updateFurnitureWorkProduct(categoryIndex, productIndex, "name", e.target.value)
                                }
                                placeholder="Product name"
                              />
                            </div>
                            <div>
                              <Label className="text-sm mb-1.5 block">Qty</Label>
                              <Input
                                type="number"
                                value={product.qty}
                                onChange={(e) =>
                                  updateFurnitureWorkProduct(categoryIndex, productIndex, "qty", Number(e.target.value))
                                }
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <Label className="text-sm mb-1.5 block">Unit</Label>
                              <Input
                                value={product.unit}
                                onChange={(e) =>
                                  updateFurnitureWorkProduct(categoryIndex, productIndex, "unit", e.target.value)
                                }
                                placeholder="unit, set"
                              />
                            </div>
                            <div>
                              <Label className="text-sm mb-1.5 block">Price</Label>
                              <Input
                                type="number"
                                value={product.price}
                                onChange={(e) =>
                                  updateFurnitureWorkProduct(
                                    categoryIndex,
                                    productIndex,
                                    "price",
                                    Number(e.target.value),
                                  )
                                }
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFurnitureWorkProduct(categoryIndex, productIndex)}
                            disabled={category.products.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() => addFurnitureWorkProduct(categoryIndex)}
                        variant="outline"
                        size="sm"
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
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (template ? "Updating..." : "Creating...") : template ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
