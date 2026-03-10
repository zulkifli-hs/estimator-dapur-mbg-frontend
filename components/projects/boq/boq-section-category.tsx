"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CreateProductDialog } from "@/components/products/create-product-dialog"
import { BoqItemRow } from "@/components/projects/boq/boq-item-row"
import { Plus, Trash2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { BOQCategory, ProductItem } from "@/lib/boq-presets"

interface BoqSectionCategoryProps {
  sectionKey: string // e.g. "fittingOut" | "mechanicalElectrical" | "furnitureWork"
  categories: BOQCategory[]
  invalidFields: Set<string>
  boqType: "main" | "additional"
  createProductDialogOpen: boolean
  formatCurrency: (value: number) => string
  uploadProductPhoto: (file: File) => Promise<{ url: string; provider: string }>
  onAddCategory: () => void
  onRemoveCategory: (categoryIndex: number) => void
  onUpdateCategoryName: (categoryIndex: number, name: string) => void
  onAddProduct: (categoryIndex: number) => void
  onRemoveProduct: (categoryIndex: number, productIndex: number) => void
  onUpdateProduct: (categoryIndex: number, productIndex: number, updated: ProductItem) => void
  onSelectProduct: (categoryIndex: number, productIndex: number, product: any) => void
  onSetPendingProductSelection: (sel: any) => void
  onSetCreateProductDialogOpen: (open: boolean) => void
  onProductCreated: (newProduct: any) => void
}

/** Returns true if any invalidFields key belongs to this category */
function categoryHasErrors(sectionKey: string, categoryIndex: number, invalidFields: Set<string>): boolean {
  const prefix = `${sectionKey}-${categoryIndex}-`
  for (const key of invalidFields) {
    if (key.startsWith(prefix)) return true
  }
  return false
}

export function BoqSectionCategory({
  sectionKey,
  categories,
  invalidFields,
  boqType,
  createProductDialogOpen,
  formatCurrency,
  uploadProductPhoto,
  onAddCategory,
  onRemoveCategory,
  onUpdateCategoryName,
  onAddProduct,
  onRemoveProduct,
  onUpdateProduct,
  onSelectProduct,
  onSetPendingProductSelection,
  onSetCreateProductDialogOpen,
  onProductCreated,
}: BoqSectionCategoryProps) {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0)
  // Per-category active edit index: key = categoryIndex, value = productIndex | null
  const [activeEditMap, setActiveEditMap] = useState<Record<number, number | null>>({})
  // Per-category name duplicate error: key = categoryIndex
  const [nameErrors, setNameErrors] = useState<Record<number, string>>({})
  const { toast } = useToast()

  const isDuplicateName = (name: string, excludeIndex: number): boolean => {
    const trimmed = name.trim().toLowerCase()
    if (!trimmed) return false
    return categories.some(
      (cat, i) => i !== excludeIndex && cat.name.trim().toLowerCase() === trimmed
    )
  }

  const handleCategoryNameChange = (catIdx: number, value: string) => {
    onUpdateCategoryName(catIdx, value)
    if (isDuplicateName(value, catIdx)) {
      setNameErrors((prev) => ({ ...prev, [catIdx]: `"${value.trim()}" already exists in this section.` }))
    } else {
      setNameErrors((prev) => { const next = { ...prev }; delete next[catIdx]; return next })
    }
  }

  const handleAddCategory = () => {
    // Block if any custom category has no name yet
    const emptyCustomIdx = categories.findIndex((c) => !c.isPreset && !c.name.trim())
    if (emptyCustomIdx !== -1) {
      setActiveCategoryIndex(emptyCustomIdx)
      toast({
        title: "Name required",
        description: "Please fill in the name for the current custom category before adding a new one.",
        variant: "destructive",
      })
      return
    }
    onAddCategory()
    setTimeout(() => setActiveCategoryIndex(categories.length), 0)
  }

  const setEditIndex = (catIdx: number, prodIdx: number | null) => {
    setActiveEditMap((prev) => ({ ...prev, [catIdx]: prodIdx }))
  }

  const activeCategory = categories[activeCategoryIndex] ?? null

  return (
    <div className="flex gap-0 border rounded-md overflow-hidden min-h-[420px]">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <div className="w-56 shrink-0 border-r bg-muted/20 flex flex-col">
        <ScrollArea className="flex-1">
          <div className="py-2">
            {/* Preset categories */}
            {categories.map((cat, idx) => {
              const isActive = activeCategoryIndex === idx
              const hasError = categoryHasErrors(sectionKey, idx, invalidFields)
              const count = cat.products.filter((p) => p.name).length

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveCategoryIndex(idx)}
                  title={cat.name}
                  className={cn(
                    "w-full text-left px-3 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors hover:bg-primary/30",
                    isActive && "bg-primary/50 font-medium",
                    !cat.isPreset && idx > 0 && categories[idx - 1].isPreset && "border-t mt-1 pt-3"
                  )}
                >
                  <span className="line-clamp-2 flex-1 leading-tight">{cat.name || <em className="text-muted-foreground">Unnamed</em>}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    {hasError && <AlertCircle className="h-3 w-3 text-red-500" />}
                    {count > 0 && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-normal">
                        {count}
                      </Badge>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </ScrollArea>

        {/* Add Custom Category button */}
        <div className="p-2 border-t">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-primary hover:text-foreground"
            onClick={handleAddCategory}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Custom Category
          </Button>
        </div>
      </div>

      {/* ── Content Panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeCategory ? (
          <>
            {/* Category header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-background">
              {activeCategory.isPreset ? (
                <h4 className="font-medium text-sm">{activeCategory.name}</h4>
              ) : (
                <div className="flex flex-col gap-0.5">
                  <Input
                    value={activeCategory.name}
                    onChange={(e) => handleCategoryNameChange(activeCategoryIndex, e.target.value)}
                    required
                    placeholder="Category name"
                    className={cn(
                      "h-8 text-sm font-medium max-w-xs",
                      nameErrors[activeCategoryIndex] && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {nameErrors[activeCategoryIndex] && (
                    <p className="text-[11px] text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {nameErrors[activeCategoryIndex]}
                    </p>
                  )}
                </div>
              )}
              {!activeCategory.isPreset && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                  onClick={() => {
                    onRemoveCategory(activeCategoryIndex)
                    setActiveCategoryIndex(Math.max(0, activeCategoryIndex - 1))
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Items table */}
            <div className="flex-1 overflow-x-auto">
              {activeCategory.products.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No items yet. Click &ldquo;Add Product&rdquo; to start.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                      <th className="py-2 px-3 text-center w-8">#</th>
                      <th className="py-2 px-3 text-left">Product Name</th>
                      <th className="py-2 px-3 text-left">Brand</th>
                      <th className="py-2 px-3 text-left">Location</th>
                      <th className="py-2 px-3 text-left">Qty · Unit</th>
                      <th className="py-2 px-3 text-left">Price</th>
                      <th className="py-2 px-3 text-center w-8">Note</th>
                      <th className="py-2 px-3 w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {activeCategory.products.map((product, productIndex) => (
                      <BoqItemRow
                        key={productIndex}
                        item={product}
                        index={productIndex}
                        sectionKey={sectionKey}
                        categoryIndex={activeCategoryIndex}
                        invalidFields={invalidFields}
                        isActiveEdit={activeEditMap[activeCategoryIndex] === productIndex}
                        boqType={boqType}
                        formatCurrency={formatCurrency}
                        onEditStart={() => setEditIndex(activeCategoryIndex, productIndex)}
                        onLiveUpdate={(updated) => onUpdateProduct(activeCategoryIndex, productIndex, updated)}
                        onConfirm={(updated) => {
                          onUpdateProduct(activeCategoryIndex, productIndex, updated)
                          setEditIndex(activeCategoryIndex, null)
                        }}
                        onDelete={() => {
                          if (activeEditMap[activeCategoryIndex] === productIndex) {
                            setEditIndex(activeCategoryIndex, null)
                          }
                          onRemoveProduct(activeCategoryIndex, productIndex)
                        }}
                        onSelectProduct={(p) => onSelectProduct(activeCategoryIndex, productIndex, p)}
                        onSetPendingProductSelection={onSetPendingProductSelection}
                        onSetCreateProductDialogOpen={onSetCreateProductDialogOpen}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Add Product */}
            <div className="p-3 border-t">
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => {
                  onAddProduct(activeCategoryIndex)
                  setTimeout(() => setEditIndex(activeCategoryIndex, activeCategory.products.length), 0)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Select a category from the sidebar.
          </div>
        )}
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
