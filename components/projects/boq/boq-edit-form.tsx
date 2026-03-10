"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { BoqSectionPreliminary } from "@/components/projects/boq/boq-section-preliminary"
import { BoqSectionCategory } from "@/components/projects/boq/boq-section-category"
import { Loader2, AlertCircle } from "lucide-react"
import type { BOQCategory, ProductItem } from "@/lib/boq-presets"

interface PreliminaryItem {
  _id?: string
  name: string
  qty: number
  unit: string
  price: number
  productId?: string
  location?: string
  brand?: string
  note?: string
  tags?: string[]
  startDate?: string
  endDate?: string
}

export interface BoqEditFormProps {
  editingBOQ: any
  boqType: "main" | "additional"
  loading: boolean
  hasUnsavedChanges: boolean
  preliminary: PreliminaryItem[]
  fittingOut: BOQCategory[]
  furnitureWork: BOQCategory[]
  mechanicalElectrical: BOQCategory[]
  createProductDialogOpen: boolean
  invalidFields: Set<string>
  formatCurrency: (value: number) => string

  onCancel: () => void
  onSubmit: () => void
  onSetCreateProductDialogOpen: (open: boolean) => void
  onSetPendingProductSelection: (sel: any) => void
  uploadProductPhoto: (file: File) => Promise<{ url: string; provider: string }>
  onProductCreated: (newProduct: any) => void

  // -- Preliminary
  onAddPreliminaryItem: () => void
  onUpdatePreliminaryItem: (index: number, updated: PreliminaryItem) => void
  onRemovePreliminaryItem: (index: number) => void
  onSelectPreliminaryProduct: (index: number, product: any) => void

  // -- Fitting Out
  onAddFittingOutCategory: () => void
  onRemoveFittingOutCategory: (catIdx: number) => void
  onUpdateFittingOutCategoryName: (catIdx: number, name: string) => void
  onAddFittingOutProduct: (catIdx: number) => void
  onRemoveFittingOutProduct: (catIdx: number, prodIdx: number) => void
  onUpdateFittingOutProduct: (catIdx: number, prodIdx: number, updated: ProductItem) => void
  onSelectFittingOutProduct: (catIdx: number, prodIdx: number, product: any) => void

  // -- Furniture Work
  onAddFurnitureWorkCategory: () => void
  onRemoveFurnitureWorkCategory: (catIdx: number) => void
  onUpdateFurnitureWorkCategoryName: (catIdx: number, name: string) => void
  onAddFurnitureWorkProduct: (catIdx: number) => void
  onRemoveFurnitureWorkProduct: (catIdx: number, prodIdx: number) => void
  onUpdateFurnitureWorkProduct: (catIdx: number, prodIdx: number, updated: ProductItem) => void
  onSelectFurnitureWorkProduct: (catIdx: number, prodIdx: number, product: any) => void

  // -- MEP
  onAddMechanicalElectricalCategory: () => void
  onRemoveMechanicalElectricalCategory: (catIdx: number) => void
  onUpdateMechanicalElectricalCategoryName: (catIdx: number, name: string) => void
  onAddMechanicalElectricalProduct: (catIdx: number) => void
  onRemoveMechanicalElectricalProduct: (catIdx: number, prodIdx: number) => void
  onUpdateMechanicalElectricalProduct: (catIdx: number, prodIdx: number, updated: ProductItem) => void
  onSelectMechanicalElectricalProduct: (catIdx: number, prodIdx: number, product: any) => void
}

function countPreliminaryItems(items: PreliminaryItem[]) {
  return items.filter((i) => i.name).length
}
function countCategoryItems(cats: BOQCategory[]) {
  return cats.reduce((s, c) => s + c.products.filter((p) => p.name).length, 0)
}
function sectionHasErrors(prefix: string, invalidFields: Set<string>) {
  for (const k of invalidFields) {
    if (k.startsWith(prefix)) return true
  }
  return false
}

export function BoqEditForm({
  editingBOQ,
  boqType,
  loading,
  hasUnsavedChanges,
  preliminary,
  fittingOut,
  furnitureWork,
  mechanicalElectrical,
  createProductDialogOpen,
  invalidFields,
  formatCurrency,
  onCancel,
  onSubmit,
  onSetCreateProductDialogOpen,
  onSetPendingProductSelection,
  uploadProductPhoto,
  onProductCreated,
  onAddPreliminaryItem,
  onUpdatePreliminaryItem,
  onRemovePreliminaryItem,
  onSelectPreliminaryProduct,
  onAddFittingOutCategory,
  onRemoveFittingOutCategory,
  onUpdateFittingOutCategoryName,
  onAddFittingOutProduct,
  onRemoveFittingOutProduct,
  onUpdateFittingOutProduct,
  onSelectFittingOutProduct,
  onAddFurnitureWorkCategory,
  onRemoveFurnitureWorkCategory,
  onUpdateFurnitureWorkCategoryName,
  onAddFurnitureWorkProduct,
  onRemoveFurnitureWorkProduct,
  onUpdateFurnitureWorkProduct,
  onSelectFurnitureWorkProduct,
  onAddMechanicalElectricalCategory,
  onRemoveMechanicalElectricalCategory,
  onUpdateMechanicalElectricalCategoryName,
  onAddMechanicalElectricalProduct,
  onRemoveMechanicalElectricalProduct,
  onUpdateMechanicalElectricalProduct,
  onSelectMechanicalElectricalProduct,
}: BoqEditFormProps) {
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)

  const title = editingBOQ
    ? "Edit BOQ"
    : boqType === "additional"
    ? "Create Additional BOQ"
    : "Create Main BOQ"

  const handleCancelClick = () => {
    if (hasUnsavedChanges) {
      setDiscardDialogOpen(true)
    } else {
      onCancel()
    }
  }

  const prelCount = countPreliminaryItems(preliminary)
  const foCount = countCategoryItems(fittingOut)
  const fwCount = countCategoryItems(furnitureWork)
  const mepCount = countCategoryItems(mechanicalElectrical)

  const prelError = sectionHasErrors("preliminary", invalidFields)
  const foError = sectionHasErrors("fittingOut", invalidFields)
  const fwError = sectionHasErrors("furnitureWork", invalidFields)
  const mepError = sectionHasErrors("mechanicalElectrical", invalidFields)

  return (
    <>
      <div className="pb-20 space-y-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground text-sm">Fill in the details for your Bill of Quantities</p>
        </div>

        <Tabs defaultValue="preliminary" className="w-full">
          <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-muted/50 p-1">
            <TabsTrigger value="preliminary" className="flex items-center gap-1.5">
              <span>I. Preliminary</span>
              {prelError && <AlertCircle className="h-3 w-3 text-red-500" />}
              {prelCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{prelCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="fittingOut" className="flex items-center gap-1.5">
              <span>II. Fitting Out</span>
              {foError && <AlertCircle className="h-3 w-3 text-red-500" />}
              {foCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{foCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="furnitureWork" className="flex items-center gap-1.5">
              <span>III. Furniture Work</span>
              {fwError && <AlertCircle className="h-3 w-3 text-red-500" />}
              {fwCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{fwCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="mep" className="flex items-center gap-1.5">
              <span>IV. MEP</span>
              {mepError && <AlertCircle className="h-3 w-3 text-red-500" />}
              {mepCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{mepCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preliminary" className="mt-4">
            <BoqSectionPreliminary
              items={preliminary as ProductItem[]}
              invalidFields={invalidFields}
              boqType={boqType}
              createProductDialogOpen={createProductDialogOpen}
              formatCurrency={formatCurrency}
              uploadProductPhoto={uploadProductPhoto}
              onAddItem={onAddPreliminaryItem}
              onUpdateItem={(idx, updated) => onUpdatePreliminaryItem(idx, updated as PreliminaryItem)}
              onRemoveItem={onRemovePreliminaryItem}
              onSelectProduct={onSelectPreliminaryProduct}
              onSetPendingProductSelection={onSetPendingProductSelection}
              onSetCreateProductDialogOpen={onSetCreateProductDialogOpen}
              onProductCreated={onProductCreated}
            />
          </TabsContent>

          <TabsContent value="fittingOut" className="mt-4">
            <BoqSectionCategory
              sectionKey="fittingOut"
              categories={fittingOut}
              invalidFields={invalidFields}
              boqType={boqType}
              createProductDialogOpen={createProductDialogOpen}
              formatCurrency={formatCurrency}
              uploadProductPhoto={uploadProductPhoto}
              onAddCategory={onAddFittingOutCategory}
              onRemoveCategory={onRemoveFittingOutCategory}
              onUpdateCategoryName={onUpdateFittingOutCategoryName}
              onAddProduct={onAddFittingOutProduct}
              onRemoveProduct={onRemoveFittingOutProduct}
              onUpdateProduct={onUpdateFittingOutProduct}
              onSelectProduct={onSelectFittingOutProduct}
              onSetPendingProductSelection={onSetPendingProductSelection}
              onSetCreateProductDialogOpen={onSetCreateProductDialogOpen}
              onProductCreated={onProductCreated}
            />
          </TabsContent>

          <TabsContent value="furnitureWork" className="mt-4">
            <BoqSectionCategory
              sectionKey="furnitureWork"
              categories={furnitureWork}
              invalidFields={invalidFields}
              boqType={boqType}
              createProductDialogOpen={createProductDialogOpen}
              formatCurrency={formatCurrency}
              uploadProductPhoto={uploadProductPhoto}
              onAddCategory={onAddFurnitureWorkCategory}
              onRemoveCategory={onRemoveFurnitureWorkCategory}
              onUpdateCategoryName={onUpdateFurnitureWorkCategoryName}
              onAddProduct={onAddFurnitureWorkProduct}
              onRemoveProduct={onRemoveFurnitureWorkProduct}
              onUpdateProduct={onUpdateFurnitureWorkProduct}
              onSelectProduct={onSelectFurnitureWorkProduct}
              onSetPendingProductSelection={onSetPendingProductSelection}
              onSetCreateProductDialogOpen={onSetCreateProductDialogOpen}
              onProductCreated={onProductCreated}
            />
          </TabsContent>

          <TabsContent value="mep" className="mt-4">
            <BoqSectionCategory
              sectionKey="mechanicalElectrical"
              categories={mechanicalElectrical}
              invalidFields={invalidFields}
              boqType={boqType}
              createProductDialogOpen={createProductDialogOpen}
              formatCurrency={formatCurrency}
              uploadProductPhoto={uploadProductPhoto}
              onAddCategory={onAddMechanicalElectricalCategory}
              onRemoveCategory={onRemoveMechanicalElectricalCategory}
              onUpdateCategoryName={onUpdateMechanicalElectricalCategoryName}
              onAddProduct={onAddMechanicalElectricalProduct}
              onRemoveProduct={onRemoveMechanicalElectricalProduct}
              onUpdateProduct={onUpdateMechanicalElectricalProduct}
              onSelectProduct={onSelectMechanicalElectricalProduct}
              onSetPendingProductSelection={onSetPendingProductSelection}
              onSetCreateProductDialogOpen={onSetCreateProductDialogOpen}
              onProductCreated={onProductCreated}
            />
          </TabsContent>
        </Tabs>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-6 py-3 flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          {hasUnsavedChanges && (
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancelClick} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editingBOQ ? "Update BOQ" : "Create BOQ"}
          </Button>
        </div>
      </div>

      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? All changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onCancel}
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
