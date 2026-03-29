"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ProductSearchPopover } from "@/components/product-search-popover"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Pencil, Trash2, Check, X, MessageSquare, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProductItem } from "@/lib/boq-presets"

interface BoqItemRowProps {
  item: ProductItem
  index: number
  sectionKey: string
  categoryIndex?: number
  invalidFields: Set<string>
  isActiveEdit: boolean
  boqType: "main" | "additional"
  formatCurrency: (value: number) => string
  mainBoqItems?: ProductItem[]
  externalProduct?: any | null
  onEditStart: () => void
  onLiveUpdate: (updated: ProductItem) => void
  onConfirm: (updated: ProductItem) => void
  onDelete: () => void
  onSelectProduct: (product: any) => void
  onSetPendingProductSelection: (sel: any) => void
  onSetCreateProductDialogOpen: (open: boolean) => void
}

// Build the invalidFields key prefix for this item
function fieldKey(sectionKey: string, categoryIndex: number | undefined, index: number, field: string): string {
  if (categoryIndex !== undefined) {
    return `${sectionKey}-${categoryIndex}-${index}-${field}`
  }
  return `${sectionKey}-${index}-${field}`
}

export function BoqItemRow({
  item,
  index,
  sectionKey,
  categoryIndex,
  invalidFields,
  isActiveEdit,
  boqType,
  formatCurrency,
  mainBoqItems,
  externalProduct,
  onEditStart,
  onLiveUpdate,
  onConfirm,
  onDelete,
  onSelectProduct,
  onSetPendingProductSelection,
  onSetCreateProductDialogOpen,
}: BoqItemRowProps) {
  // Local draft state for edit mode
  const [draft, setDraft] = useState<ProductItem>(item)
  const [itemSource, setItemSource] = useState<"catalog" | "mainBoq">("mainBoq")
  const [mainBoqPickerOpen, setMainBoqPickerOpen] = useState(false)
  const qtyRef = useRef<HTMLInputElement | null>(null)

  // Sync draft from latest item ONLY when edit mode opens (isActiveEdit: false → true)
  useEffect(() => {
    if (isActiveEdit) {
      setDraft({ ...item })
      setItemSource("mainBoq")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActiveEdit])

  // Auto-apply externally injected product (e.g. just created via CreateProductDialog)
  useEffect(() => {
    if (!externalProduct) return
    const updated = {
      ...draft,
      name: externalProduct.name,
      unit: externalProduct.unit || draft.unit,
      price: externalProduct.sellingPrice ?? draft.price,
      productId: externalProduct._id,
      brand: externalProduct.brand || draft.brand || "",
    }
    setDraft(updated)
    onLiveUpdate(updated)
    setTimeout(() => qtyRef.current?.focus(), 100)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalProduct])

  const updateDraft = (field: keyof ProductItem, value: any) => {
    const updated = { ...draft, [field]: value }
    setDraft(updated)
    onLiveUpdate(updated) // live-sync to parent without closing edit mode
  }

  const hasNote = !!item.note && item.note.trim() !== ""
  const hasNoteInDraft = !!draft.note && draft.note.trim() !== ""

  const qtyKey = fieldKey(sectionKey, categoryIndex, index, "qty")
  const unitKey = fieldKey(sectionKey, categoryIndex, index, "unit")
  const priceKey = fieldKey(sectionKey, categoryIndex, index, "price")

  // ─── Read Mode ────────────────────────────────────────────────────────────────
  if (!isActiveEdit) {
    return (
      <tr className="border-b transition-colors hover:bg-muted/30 group">
        <td className="py-2 px-3 text-sm text-muted-foreground w-8 text-center">{index + 1}</td>
        <td className="py-2 px-3 text-sm">
          <div className="line-clamp-2 leading-snug font-medium">
            {item.name || <span className="text-muted-foreground italic">—</span>}
            {item.note && (
              <p className="text-xs text-muted-foreground mt-1 italic">{item.note}</p>
            )}
          </div>
        </td>
        <td className="py-2 px-3 text-sm text-muted-foreground">
          {item.brand || <span>—</span>}
        </td>
        <td className="py-2 px-3 text-sm text-muted-foreground">
          {item.location || <span>—</span>}
        </td>
        <td className="py-2 px-3 text-sm tabular-nums whitespace-nowrap">
          {item.qty} <span className="text-muted-foreground">{item.unit}</span>
        </td>
        <td className="py-2 px-3 text-sm tabular-nums whitespace-nowrap">
          {formatCurrency(item.price)}
        </td>
        {/* <td className="py-2 px-3 text-sm w-8 text-center">
          {hasNote ? (
            <span title={item.note} className="text-muted-foreground cursor-help">
              <MessageSquare className="h-3.5 w-3.5" />
            </span>
          ) : (
            <span className="text-muted-foreground opacity-30">—</span>
          )}
        </td> */}
        <td className="py-2 px-3 w-20">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onEditStart}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  // ─── Edit Mode (inline expand) ─────────────────────────────────────────────
  return (
    <tr className="border-b bg-muted/20">
      <td className="py-3 px-3 text-sm text-muted-foreground w-8 text-center align-top pt-4">{index + 1}</td>
      <td colSpan={6} className="py-3 px-3">
        <div
          className="overflow-hidden transition-all duration-300"
          style={{ maxHeight: isActiveEdit ? "800px" : "0px", opacity: isActiveEdit ? 1 : 0 }}
        >
          <div className="space-y-3">
            {/* Product Name */}
            <div>
              <Label className="text-xs mb-1 block">
                Product Name <span className="text-red-500">*</span>
              </Label>
              {/* Source toggle — only for additional BOQ when main BOQ items exist */}
              {boqType === "additional" && mainBoqItems && mainBoqItems.length > 0 && (
                <div className="flex rounded-md border text-xs overflow-hidden mb-2">
                  <button
                    type="button"
                    className={cn(
                      "flex-1 py-1 px-3 transition-colors border-l",
                      itemSource === "mainBoq"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    )}
                    onClick={() => setItemSource("mainBoq")}
                  >
                    From Main BOQ
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex-1 py-1 px-3 transition-colors",
                      itemSource === "catalog"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    )}
                    onClick={() => setItemSource("catalog")}
                  >
                    Product Catalog
                  </button>
                </div>
              )}
              {itemSource === "mainBoq" && boqType === "additional" && mainBoqItems && mainBoqItems.length > 0 ? (
                <Popover open={mainBoqPickerOpen} onOpenChange={setMainBoqPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal" type="button">
                      <span className={cn("truncate", !draft.name && "text-muted-foreground")}>
                        {draft.name || "Select item from main BOQ..."}
                      </span>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-100 p-0" align="start" side="bottom">
                    <Command>
                      <CommandInput placeholder="Search items..." />
                      <CommandList>
                        <CommandEmpty>No matching items.</CommandEmpty>
                        <CommandGroup>
                          {mainBoqItems.map((boqItem, i) => (
                            <CommandItem
                              key={i}
                              value={`${(boqItem as any)._section ?? ""} ${(boqItem as any)._category ?? ""} ${boqItem.name}`}
                              onSelect={() => {
                                const updated = {
                                  ...draft,
                                  name: boqItem.name,
                                  unit: boqItem.unit,
                                  price: boqItem.price,
                                  brand: boqItem.brand || draft.brand || "",
                                  productId: boqItem.productId,
                                  qty: 0,
                                }
                                setDraft(updated)
                                onLiveUpdate(updated)
                                setMainBoqPickerOpen(false)
                                setTimeout(() => qtyRef.current?.focus(), 100)
                              }}
                            >
                              <div className="flex flex-col w-full">
                                <span className="font-medium">{boqItem.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {(boqItem as any)._section}
                                  {(boqItem as any)._category ? ` / ${(boqItem as any)._category}` : ""}
                                  {" · "}{boqItem.unit}{" · "}{formatCurrency(boqItem.price)}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <ProductSearchPopover
                  selectedProductName={draft.name}
                  onSelect={(product) => {
                    const updated = {
                      ...draft,
                      name: product.name,
                      unit: product.unit || draft.unit,
                      price: product.sellingPrice ?? draft.price,
                      productId: product._id,
                      brand: product.brand || draft.brand || "",
                    }
                    setDraft(updated)
                    onLiveUpdate(updated) // live-sync to parent
                    setTimeout(() => qtyRef.current?.focus(), 100)
                  }}
                  onCreateNew={() => {
                    onSetPendingProductSelection(
                      categoryIndex !== undefined
                        ? { type: sectionKey, categoryIndex, productIndex: index }
                        : { type: sectionKey, productIndex: index }
                    )
                    onSetCreateProductDialogOpen(true)
                  }}
                  formatCurrency={formatCurrency}
                  className="w-full"
                />
              )}
            </div>

            {/* Row 1: Brand, Location, Qty, Unit, Price */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Brand</Label>
                <Input
                  value={draft.brand || ""}
                  onChange={(e) => updateDraft("brand", e.target.value)}
                  placeholder="e.g. Jayaboard"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Location</Label>
                <Input
                  value={draft.location || ""}
                  onChange={(e) => updateDraft("location", e.target.value)}
                  placeholder="e.g. Front"
                />
              </div>
              <div>
                <Label className={cn("text-xs mb-1 block", invalidFields.has(qtyKey) ? "text-red-500" : "text-muted-foreground")}>
                  Qty <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={qtyRef}
                  type="number"
                  value={draft.qty === 0 ? "" : draft.qty}
                  onChange={(e) => updateDraft("qty", e.target.value === "" ? 0 : Number(e.target.value))}
                  placeholder="0"
                  className={cn(invalidFields.has(qtyKey) && "border-red-500 focus-visible:ring-red-500")}
                />
              </div>
              <div>
                <Label className={cn("text-xs mb-1 block", invalidFields.has(unitKey) ? "text-red-500" : "text-muted-foreground")}>
                  Unit <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={draft.unit}
                  onChange={(e) => updateDraft("unit", e.target.value)}
                  placeholder="m2, ls, pcs"
                  className={cn(invalidFields.has(unitKey) && "border-red-500 focus-visible:ring-red-500")}
                />
              </div>
              <div>
                <Label className={cn("text-xs mb-1 block", invalidFields.has(priceKey) ? "text-red-500" : "text-muted-foreground")}>
                  Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={draft.price === 0 ? "" : draft.price}
                  onChange={(e) => updateDraft("price", e.target.value === "" ? 0 : Number(e.target.value))}
                  placeholder="0"
                  className={cn(invalidFields.has(priceKey) && "border-red-500 focus-visible:ring-red-500")}
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Note</Label>
              <Textarea
                value={draft.note || ""}
                onChange={(e) => updateDraft("note", e.target.value)}
                placeholder="Additional notes for this item"
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
        </div>
      </td>
      <td className="py-3 px-3 align-top">
        <div className="flex flex-col gap-1 pt-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => onConfirm(draft)}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setDraft({ ...item })
              // notify parent to close edit — parent controls isActiveEdit
              onConfirm(item)
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
