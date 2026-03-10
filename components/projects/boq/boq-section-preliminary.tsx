"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreateProductDialog } from "@/components/products/create-product-dialog"
import { BoqItemRow } from "@/components/projects/boq/boq-item-row"
import { Plus } from "lucide-react"
import type { ProductItem } from "@/lib/boq-presets"

interface BoqSectionPreliminaryProps {
  items: ProductItem[]
  invalidFields: Set<string>
  boqType: "main" | "additional"
  createProductDialogOpen: boolean
  formatCurrency: (value: number) => string
  uploadProductPhoto: (file: File) => Promise<{ url: string; provider: string }>
  onAddItem: () => void
  onUpdateItem: (index: number, updated: ProductItem) => void
  onRemoveItem: (index: number) => void
  onSelectProduct: (index: number, product: any) => void
  onSetPendingProductSelection: (sel: any) => void
  onSetCreateProductDialogOpen: (open: boolean) => void
  onProductCreated: (newProduct: any) => void
  mainBoqItems?: ProductItem[]
}

export function BoqSectionPreliminary({
  items,
  invalidFields,
  boqType,
  createProductDialogOpen,
  formatCurrency,
  uploadProductPhoto,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onSelectProduct,
  onSetPendingProductSelection,
  onSetCreateProductDialogOpen,
  onProductCreated,
  mainBoqItems,
}: BoqSectionPreliminaryProps) {
  const [activeEditIndex, setActiveEditIndex] = useState<number | null>(null)

  const handleEditStart = (index: number) => {
    setActiveEditIndex(index)
  }

  const handleConfirm = (index: number, updated: ProductItem) => {
    onUpdateItem(index, updated)
    setActiveEditIndex(null)
  }

  const handleDelete = (index: number) => {
    if (activeEditIndex === index) setActiveEditIndex(null)
    onRemoveItem(index)
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
          No items yet. Click &ldquo;Add Item&rdquo; to start adding preliminary items.
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="py-2 px-3 text-center w-8">#</th>
                <th className="py-2 px-3 text-left">Product Name</th>
                <th className="py-2 px-3 text-left">Brand</th>
                <th className="py-2 px-3 text-left">Location</th>
                <th className="py-2 px-3 text-left">Qty · Unit</th>
                <th className="py-2 px-3 text-left">Price</th>
                {/* <th className="py-2 px-3 text-center w-8">Note</th> */}
                <th className="py-2 px-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <BoqItemRow
                  key={index}
                  item={item}
                  index={index}
                  sectionKey="preliminary"
                  invalidFields={invalidFields}
                  isActiveEdit={activeEditIndex === index}
                  boqType={boqType}
                  formatCurrency={formatCurrency}
                  onEditStart={() => handleEditStart(index)}
                  onLiveUpdate={(updated) => onUpdateItem(index, updated)}
                  onConfirm={(updated) => handleConfirm(index, updated)}
                  onDelete={() => handleDelete(index)}
                  onSelectProduct={(product) => onSelectProduct(index, product)}
                  onSetPendingProductSelection={onSetPendingProductSelection}
                  onSetCreateProductDialogOpen={onSetCreateProductDialogOpen}
                  mainBoqItems={mainBoqItems}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full bg-transparent"
        onClick={() => {
          onAddItem()
          // Auto-open the new item for editing
          setTimeout(() => setActiveEditIndex(items.length), 0)
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Item
      </Button>

      <CreateProductDialog
        open={createProductDialogOpen}
        onOpenChange={onSetCreateProductDialogOpen}
        uploadPhoto={uploadProductPhoto}
        onCreated={onProductCreated}
      />
    </div>
  )
}
