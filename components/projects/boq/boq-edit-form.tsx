"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreateProductDialog } from "@/components/products/create-product-dialog"
import { ProductSearchPopover } from "@/components/product-search-popover"
import { Loader2, Plus, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface BoqEditFormProps {
  editingBOQ: any
  boqType: "main" | "additional"
  loading: boolean
  preliminary: any[]
  fittingOut: any[]
  furnitureWork: any[]
  mechanicalElectrical: any[]
  createProductDialogOpen: boolean
  preliminaryQtyRefs: React.MutableRefObject<{ [key: number]: HTMLInputElement | null }>
  fittingOutQtyRefs: React.MutableRefObject<{ [key: string]: HTMLInputElement | null }>
  furnitureWorkQtyRefs: React.MutableRefObject<{ [key: string]: HTMLInputElement | null }>
  mechanicalElectricalQtyRefs: React.MutableRefObject<{ [key: string]: HTMLInputElement | null }>
  onCancel: () => void
  onSubmit: () => void
  onSetCreateProductDialogOpen: (open: boolean) => void
  onSetPendingProductSelection: (selection: any) => void
  onSelectPreliminaryProduct: (index: number, product: any) => void
  onSelectFittingOutProduct: (categoryIndex: number, productIndex: number, product: any) => void
  onSelectFurnitureWorkProduct: (categoryIndex: number, productIndex: number, product: any) => void
  onSelectMechanicalElectricalProduct: (categoryIndex: number, productIndex: number, product: any) => void
  onRemovePreliminaryItem: (index: number) => void
  onUpdatePreliminaryItem: (index: number, field: string, value: any) => void
  onAddPreliminaryItem: () => void
  onUpdateFittingOutCategory: (categoryIndex: number, value: string) => void
  onRemoveFittingOutCategory: (categoryIndex: number) => void
  onRemoveFittingOutProduct: (categoryIndex: number, productIndex: number) => void
  onUpdateFittingOutProduct: (categoryIndex: number, productIndex: number, field: string, value: any) => void
  onAddFittingOutProduct: (categoryIndex: number) => void
  onAddFittingOutCategory: () => void
  onUpdateFurnitureWorkCategory: (categoryIndex: number, value: string) => void
  onRemoveFurnitureWorkCategory: (categoryIndex: number) => void
  onRemoveFurnitureWorkProduct: (categoryIndex: number, productIndex: number) => void
  onUpdateFurnitureWorkProduct: (categoryIndex: number, productIndex: number, field: string, value: any) => void
  onAddFurnitureWorkProduct: (categoryIndex: number) => void
  onAddFurnitureWorkCategory: () => void
  onUpdateMechanicalElectricalCategory: (categoryIndex: number, value: string) => void
  onRemoveMechanicalElectricalCategory: (categoryIndex: number) => void
  onRemoveMechanicalElectricalProduct: (categoryIndex: number, productIndex: number) => void
  onUpdateMechanicalElectricalProduct: (categoryIndex: number, productIndex: number, field: string, value: any) => void
  onAddMechanicalElectricalProduct: (categoryIndex: number) => void
  onAddMechanicalElectricalCategory: () => void
  uploadProductPhoto: (file: File) => Promise<{ url: string; provider: string }>
  onProductCreated: (newProduct: any) => void
  formatCurrency: (value: number) => string
  invalidFields: Set<string>
}

export function BoqEditForm({
  editingBOQ,
  boqType,
  loading,
  preliminary,
  fittingOut,
  furnitureWork,
  mechanicalElectrical,
  createProductDialogOpen,
  preliminaryQtyRefs,
  fittingOutQtyRefs,
  furnitureWorkQtyRefs,
  mechanicalElectricalQtyRefs,
  onCancel,
  onSubmit,
  onSetCreateProductDialogOpen,
  onSetPendingProductSelection,
  onSelectPreliminaryProduct,
  onSelectFittingOutProduct,
  onSelectFurnitureWorkProduct,
  onSelectMechanicalElectricalProduct,
  onRemovePreliminaryItem,
  onUpdatePreliminaryItem,
  onAddPreliminaryItem,
  onUpdateFittingOutCategory,
  onRemoveFittingOutCategory,
  onRemoveFittingOutProduct,
  onUpdateFittingOutProduct,
  onAddFittingOutProduct,
  onAddFittingOutCategory,
  onUpdateFurnitureWorkCategory,
  onRemoveFurnitureWorkCategory,
  onRemoveFurnitureWorkProduct,
  onUpdateFurnitureWorkProduct,
  onAddFurnitureWorkProduct,
  onAddFurnitureWorkCategory,
  onUpdateMechanicalElectricalCategory,
  onRemoveMechanicalElectricalCategory,
  onRemoveMechanicalElectricalProduct,
  onUpdateMechanicalElectricalProduct,
  onAddMechanicalElectricalProduct,
  onAddMechanicalElectricalCategory,
  uploadProductPhoto,
  onProductCreated,
  formatCurrency,
  invalidFields,
}: BoqEditFormProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {editingBOQ ? "Edit BOQ" : boqType === "additional" ? "Create Additional BOQ" : "Create Main BOQ"}
          </h2>
          <p className="text-muted-foreground">Fill in the details for your Bill of Quantities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editingBOQ ? "Update BOQ" : "Create BOQ"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">I. PRELIMINARY</h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border">
            <div className="overflow-x-auto">
              {preliminary.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No items yet. Click "Add Item" button below to start adding items.
                </div>
              ) : (
                <div className="divide-y">
                  {preliminary.map((item, index) => (
                    <div key={index} className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 w-8 h-10 flex items-center justify-center font-medium text-sm">{index + 1}</div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Item Name</Label>
                          <ProductSearchPopover
                            selectedProductName={item.name}
                            onSelect={(product) => onSelectPreliminaryProduct(index, product)}
                            onCreateNew={() => {
                              onSetPendingProductSelection({ type: "preliminary", productIndex: index })
                              onSetCreateProductDialogOpen(true)
                            }}
                            formatCurrency={formatCurrency}
                            className="w-full"
                          />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => onRemovePreliminaryItem(index)} className="shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pl-11">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Brand/Equal</Label>
                          <Input
                            value={item.brand || ""}
                            onChange={(e) => onUpdatePreliminaryItem(index, "brand", e.target.value)}
                            placeholder="e.g. Jayaboard, Elephant"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Location (optional)</Label>
                          <Input
                            value={item.location || ""}
                            onChange={(e) => onUpdatePreliminaryItem(index, "location", e.target.value)}
                            placeholder="e.g. Front, Back"
                          />
                        </div>
                        <div>
                          <Label className={cn("text-xs mb-1.5 block", invalidFields.has(`preliminary-${index}-qty`) ? "text-red-500" : "text-muted-foreground")}>Quantity</Label>
                          <Input
                            ref={(el) => {
                              preliminaryQtyRefs.current[index] = el
                            }}
                            type="number"
                            value={item.qty}
                            onChange={(e) => onUpdatePreliminaryItem(index, "qty", Number(e.target.value))}
                            placeholder="0"
                            className={cn(invalidFields.has(`preliminary-${index}-qty`) && "border-red-500 focus-visible:ring-red-500")}
                          />
                        </div>
                        <div>
                          <Label className={cn("text-xs mb-1.5 block", invalidFields.has(`preliminary-${index}-unit`) ? "text-red-500" : "text-muted-foreground")}>Unit</Label>
                          <Input
                            value={item.unit}
                            onChange={(e) => onUpdatePreliminaryItem(index, "unit", e.target.value)}
                            placeholder="ls, m2"
                            className={cn(invalidFields.has(`preliminary-${index}-unit`) && "border-red-500 focus-visible:ring-red-500")}
                          />
                        </div>
                        <div>
                          <Label className={cn("text-xs mb-1.5 block", invalidFields.has(`preliminary-${index}-price`) ? "text-red-500" : "text-muted-foreground")}>Price</Label>
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) => onUpdatePreliminaryItem(index, "price", Number(e.target.value))}
                            placeholder="0"
                            className={cn(invalidFields.has(`preliminary-${index}-price`) && "border-red-500 focus-visible:ring-red-500")}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="p-4 border-t">
            <Button type="button" onClick={onAddPreliminaryItem} variant="outline" className="w-full bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardContent>
      </Card>

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
                      onChange={(e) => onUpdateFittingOutCategory(categoryIndex, e.target.value)}
                      placeholder="e.g., Partition Work, Wall Finishes"
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => onRemoveFittingOutCategory(categoryIndex)} className="mt-6">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border-t">
                  <div className="divide-y">
                    {category.products.map((product: any, productIndex: number) => (
                      <div key={productIndex} className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 w-8 h-10 flex items-center justify-center font-medium text-sm">{productIndex + 1}</div>
                          <div className="flex-1 min-w-0">
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Product Name</Label>
                            <ProductSearchPopover
                              selectedProductName={product.name}
                              onSelect={(prod) => onSelectFittingOutProduct(categoryIndex, productIndex, prod)}
                              onCreateNew={() => {
                                onSetPendingProductSelection({ type: "fittingOut", categoryIndex, productIndex })
                                onSetCreateProductDialogOpen(true)
                              }}
                              formatCurrency={formatCurrency}
                              className="w-full"
                            />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => onRemoveFittingOutProduct(categoryIndex, productIndex)} className="shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pl-11">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Brand/Equal</Label>
                            <Input
                              value={product.brand || ""}
                              onChange={(e) => onUpdateFittingOutProduct(categoryIndex, productIndex, "brand", e.target.value)}
                              placeholder="e.g. Jayaboard, Elephant"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Location (optional)</Label>
                            <Input
                              value={product.location || ""}
                              onChange={(e) => onUpdateFittingOutProduct(categoryIndex, productIndex, "location", e.target.value)}
                              placeholder="e.g. Front, Back"
                            />
                          </div>
                          <div>
                            <Label className={cn("text-xs mb-1.5 block", invalidFields.has(`fittingOut-${categoryIndex}-${productIndex}-qty`) ? "text-red-500" : "text-muted-foreground")}>Quantity</Label>
                            <Input
                              ref={(el) => {
                                fittingOutQtyRefs.current[`${categoryIndex}-${productIndex}`] = el
                              }}
                              type="number"
                              value={product.qty}
                              onChange={(e) => onUpdateFittingOutProduct(categoryIndex, productIndex, "qty", Number(e.target.value))}
                              placeholder="0"
                              className={cn(invalidFields.has(`fittingOut-${categoryIndex}-${productIndex}-qty`) && "border-red-500 focus-visible:ring-red-500")}
                            />
                          </div>
                          <div>
                            <Label className={cn("text-xs mb-1.5 block", invalidFields.has(`fittingOut-${categoryIndex}-${productIndex}-unit`) ? "text-red-500" : "text-muted-foreground")}>Unit</Label>
                            <Input
                              value={product.unit}
                              onChange={(e) => onUpdateFittingOutProduct(categoryIndex, productIndex, "unit", e.target.value)}
                              placeholder="ls, m2"
                              className={cn(invalidFields.has(`fittingOut-${categoryIndex}-${productIndex}-unit`) && "border-red-500 focus-visible:ring-red-500")}
                            />
                          </div>
                          <div>
                            <Label className={cn("text-xs mb-1.5 block", invalidFields.has(`fittingOut-${categoryIndex}-${productIndex}-price`) ? "text-red-500" : "text-muted-foreground")}>Price</Label>
                            <Input
                              type="number"
                              value={product.price}
                              onChange={(e) => onUpdateFittingOutProduct(categoryIndex, productIndex, "price", Number(e.target.value))}
                              placeholder="0"
                              className={cn(invalidFields.has(`fittingOut-${categoryIndex}-${productIndex}-price`) && "border-red-500 focus-visible:ring-red-500")}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 border-t">
                  <Button type="button" onClick={() => onAddFittingOutProduct(categoryIndex)} variant="outline" className="w-full bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        <Button type="button" onClick={onAddFittingOutCategory} variant="outline" className="w-full bg-transparent">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

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
                      onChange={(e) => onUpdateFurnitureWorkCategory(categoryIndex, e.target.value)}
                      placeholder="e.g., Cabinet Work, Furniture Installation"
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => onRemoveFurnitureWorkCategory(categoryIndex)} className="mt-6">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border-t">
                  <div className="divide-y">
                    {category.products.map((product: any, productIndex: number) => (
                      <div key={productIndex} className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 w-8 h-10 flex items-center justify-center font-medium text-sm">{productIndex + 1}</div>
                          <div className="flex-1 min-w-0">
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Product Name</Label>
                            <ProductSearchPopover
                              selectedProductName={product.name}
                              onSelect={(prod) => onSelectFurnitureWorkProduct(categoryIndex, productIndex, prod)}
                              onCreateNew={() => {
                                onSetPendingProductSelection({ type: "furnitureWork", categoryIndex, productIndex })
                                onSetCreateProductDialogOpen(true)
                              }}
                              formatCurrency={formatCurrency}
                              className="w-full"
                            />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => onRemoveFurnitureWorkProduct(categoryIndex, productIndex)} className="shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pl-11">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Brand/Equal</Label>
                            <Input
                              value={product.brand || ""}
                              onChange={(e) => onUpdateFurnitureWorkProduct(categoryIndex, productIndex, "brand", e.target.value)}
                              placeholder="e.g. Jayaboard, Elephant"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Location (optional)</Label>
                            <Input
                              value={product.location || ""}
                              onChange={(e) => onUpdateFurnitureWorkProduct(categoryIndex, productIndex, "location", e.target.value)}
                              placeholder="e.g. Front, Back"
                            />
                          </div>
                          <div>
                            <Label className={cn("text-xs mb-1.5 block", invalidFields.has(`furnitureWork-${categoryIndex}-${productIndex}-qty`) ? "text-red-500" : "text-muted-foreground")}>Quantity</Label>
                            <Input
                              ref={(el) => {
                                furnitureWorkQtyRefs.current[`${categoryIndex}-${productIndex}`] = el
                              }}
                              type="number"
                              value={product.qty}
                              onChange={(e) => onUpdateFurnitureWorkProduct(categoryIndex, productIndex, "qty", Number(e.target.value))}
                              placeholder="0"
                              className={cn(invalidFields.has(`furnitureWork-${categoryIndex}-${productIndex}-qty`) && "border-red-500 focus-visible:ring-red-500")}
                            />
                          </div>
                          <div>
                            <Label className={cn("text-xs mb-1.5 block", invalidFields.has(`furnitureWork-${categoryIndex}-${productIndex}-unit`) ? "text-red-500" : "text-muted-foreground")}>Unit</Label>
                            <Input
                              value={product.unit}
                              onChange={(e) => onUpdateFurnitureWorkProduct(categoryIndex, productIndex, "unit", e.target.value)}
                              placeholder="ls, m2"
                              className={cn(invalidFields.has(`furnitureWork-${categoryIndex}-${productIndex}-unit`) && "border-red-500 focus-visible:ring-red-500")}
                            />
                          </div>
                          <div>
                            <Label className={cn("text-xs mb-1.5 block", invalidFields.has(`furnitureWork-${categoryIndex}-${productIndex}-price`) ? "text-red-500" : "text-muted-foreground")}>Price</Label>
                            <Input
                              type="number"
                              value={product.price}
                              onChange={(e) => onUpdateFurnitureWorkProduct(categoryIndex, productIndex, "price", Number(e.target.value))}
                              placeholder="0"
                              className={cn(invalidFields.has(`furnitureWork-${categoryIndex}-${productIndex}-price`) && "border-red-500 focus-visible:ring-red-500")}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 border-t">
                  <Button type="button" onClick={() => onAddFurnitureWorkProduct(categoryIndex)} variant="outline" className="w-full bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        <Button type="button" onClick={onAddFurnitureWorkCategory} variant="outline" className="w-full bg-transparent">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">IV. MECHANICAL / ELECTRICAL / PLUMBING</h3>
        {mechanicalElectrical.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No categories yet. Click "Add Category" button below to start adding MEP categories.
            </CardContent>
          </Card>
        ) : (
          mechanicalElectrical.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Category Name</Label>
                    <Input
                      value={category.name}
                      onChange={(e) => onUpdateMechanicalElectricalCategory(categoryIndex, e.target.value)}
                      placeholder="e.g., Electrical Installation, Plumbing, HVAC"
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => onRemoveMechanicalElectricalCategory(categoryIndex)} className="mt-6">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border-t">
                  <div className="divide-y">
                    {category.products.map((product: any, productIndex: number) => (
                      <div key={productIndex} className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 w-8 h-10 flex items-center justify-center font-medium text-sm">{productIndex + 1}</div>
                          <div className="flex-1 min-w-0">
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Product Name</Label>
                            <ProductSearchPopover
                              selectedProductName={product.name}
                              onSelect={(prod) => onSelectMechanicalElectricalProduct(categoryIndex, productIndex, prod)}
                              onCreateNew={() => {
                                onSetPendingProductSelection({ type: "mechanicalElectrical", categoryIndex, productIndex })
                                onSetCreateProductDialogOpen(true)
                              }}
                              formatCurrency={formatCurrency}
                              className="w-full"
                            />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => onRemoveMechanicalElectricalProduct(categoryIndex, productIndex)} className="shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pl-11">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Brand/Equal</Label>
                            <Input
                              value={product.brand || ""}
                              onChange={(e) => onUpdateMechanicalElectricalProduct(categoryIndex, productIndex, "brand", e.target.value)}
                              placeholder="e.g. Panasonic, Schneider"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Location (optional)</Label>
                            <Input
                              value={product.location || ""}
                              onChange={(e) => onUpdateMechanicalElectricalProduct(categoryIndex, productIndex, "location", e.target.value)}
                              placeholder="e.g. Floor 1, Ceiling"
                            />
                          </div>
                          <div>
                            <Label className={cn("text-xs mb-1.5 block", invalidFields.has(`mechanicalElectrical-${categoryIndex}-${productIndex}-qty`) ? "text-red-500" : "text-muted-foreground")}>Quantity</Label>
                            <Input
                              ref={(el) => {
                                mechanicalElectricalQtyRefs.current[`${categoryIndex}-${productIndex}`] = el
                              }}
                              type="number"
                              value={product.qty}
                              onChange={(e) => onUpdateMechanicalElectricalProduct(categoryIndex, productIndex, "qty", Number(e.target.value))}
                              placeholder="0"
                              className={cn(invalidFields.has(`mechanicalElectrical-${categoryIndex}-${productIndex}-qty`) && "border-red-500 focus-visible:ring-red-500")}
                            />
                          </div>
                          <div>
                            <Label className={cn("text-xs mb-1.5 block", invalidFields.has(`mechanicalElectrical-${categoryIndex}-${productIndex}-unit`) ? "text-red-500" : "text-muted-foreground")}>Unit</Label>
                            <Input
                              value={product.unit}
                              onChange={(e) => onUpdateMechanicalElectricalProduct(categoryIndex, productIndex, "unit", e.target.value)}
                              placeholder="ls, set, pcs"
                              className={cn(invalidFields.has(`mechanicalElectrical-${categoryIndex}-${productIndex}-unit`) && "border-red-500 focus-visible:ring-red-500")}
                            />
                          </div>
                          <div>
                            <Label className={cn("text-xs mb-1.5 block", invalidFields.has(`mechanicalElectrical-${categoryIndex}-${productIndex}-price`) ? "text-red-500" : "text-muted-foreground")}>Price</Label>
                            <Input
                              type="number"
                              value={product.price}
                              onChange={(e) => onUpdateMechanicalElectricalProduct(categoryIndex, productIndex, "price", Number(e.target.value))}
                              placeholder="0"
                              className={cn(invalidFields.has(`mechanicalElectrical-${categoryIndex}-${productIndex}-price`) && "border-red-500 focus-visible:ring-red-500")}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 border-t">
                  <Button type="button" onClick={() => onAddMechanicalElectricalProduct(categoryIndex)} variant="outline" className="w-full bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        <Button type="button" onClick={onAddMechanicalElectricalCategory} variant="outline" className="w-full bg-transparent">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <CreateProductDialog
        open={createProductDialogOpen}
        onOpenChange={onSetCreateProductDialogOpen}
        uploadPhoto={uploadProductPhoto}
        onCreated={onProductCreated}
      />
    </div>
  )
}
