"use client"

import React, { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, Pencil, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DiscountTaxData {
  discount: string
  discountType: "%" | "0"
  tax: string
  taxType: "%" | "0"
  saving: boolean
}

interface BoqTableProps {
  boq: any
  formatCurrency: (value: number) => string
  showNote?: boolean
  discountTaxData?: DiscountTaxData
  onDiscountTaxChange?: (patch: Partial<Omit<DiscountTaxData, "saving">>) => void
  onSaveDiscountTax?: () => void
}

// Sort: positive/zero qty first, negative qty last
const sortByQty = (items: any[]) =>
  [...items].sort((a, b) => {
    const aNeg = (a.qty ?? 0) < 0 ? 1 : 0
    const bNeg = (b.qty ?? 0) < 0 ? 1 : 0
    return aNeg - bNeg
  })

// Returns text color class based on subtotal sign
const subtotalColor = (value: number) => {
  if (value < 0) return "text-red-600 dark:text-red-400"
  if (value > 0) return "text-green-600 dark:text-green-400"
  return ""
}

export function BoqTable({
  boq,
  formatCurrency,
  showNote = false,
  discountTaxData,
  onDiscountTaxChange,
  onSaveDiscountTax,
}: BoqTableProps) {
  const [showForm, setShowForm] = useState(false)
  let itemNumber = 1

  const preliminarySubtotal = Array.isArray(boq.preliminary)
    ? boq.preliminary.reduce((sum: number, item: any) => sum + (item.qty || 0) * (item.price || 0), 0)
    : 0

  const fittingOutSubtotal = Array.isArray(boq.fittingOut)
    ? boq.fittingOut.reduce(
        (sum: number, cat: any) =>
          sum + (Array.isArray(cat.products) ? cat.products.reduce((s: number, p: any) => s + (p.qty || 0) * (p.price || 0), 0) : 0),
        0,
      )
    : 0

  const furnitureWorkSubtotal = Array.isArray(boq.furnitureWork)
    ? boq.furnitureWork.reduce(
        (sum: number, cat: any) =>
          sum + (Array.isArray(cat.products) ? cat.products.reduce((s: number, p: any) => s + (p.qty || 0) * (p.price || 0), 0) : 0),
        0,
      )
    : 0

  const mepSubtotal = Array.isArray(boq.mechanicalElectrical)
    ? boq.mechanicalElectrical.reduce(
        (sum: number, cat: any) =>
          sum + (Array.isArray(cat.products) ? cat.products.reduce((s: number, p: any) => s + (p.qty || 0) * (p.price || 0), 0) : 0),
        0,
      )
    : 0

  const grandTotal = preliminarySubtotal + fittingOutSubtotal + furnitureWorkSubtotal + mepSubtotal

  const hasData =
    (Array.isArray(boq.preliminary) && boq.preliminary.length > 0) ||
    (Array.isArray(boq.fittingOut) && boq.fittingOut.length > 0) ||
    (Array.isArray(boq.furnitureWork) && boq.furnitureWork.length > 0) ||
    (Array.isArray(boq.mechanicalElectrical) && boq.mechanicalElectrical.length > 0)

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-15 px-4">No</TableHead>
            <TableHead className="min-w-62.5 max-w-100 px-4">Item Name</TableHead>
            <TableHead className="w-30 px-4">Brand/Equal</TableHead>
            <TableHead className="w-30 px-4">Location</TableHead>
            <TableHead className="text-right w-20 px-4">Qty</TableHead>
            <TableHead className="w-20 px-4">Unit</TableHead>
            <TableHead className="text-right w-37.5 px-4">Unit Price</TableHead>
            <TableHead className="text-right w-37.5 px-4">Total Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.isArray(boq.preliminary) && boq.preliminary.length > 0 && (
            <>
              <TableRow className="bg-primary/10">
                <TableCell colSpan={8} className="font-bold text-primary uppercase px-4 py-3">
                  PRELIMINARY
                </TableCell>
              </TableRow>
              {sortByQty(boq.preliminary).map((item: any) => {
                const isNegative = (item.qty ?? 0) < 0
                const total = (item.qty || 0) * (item.price || 0)
                return (
                  <TableRow key={item._id} className={cn(isNegative && "bg-red-50 dark:bg-red-950/20")}>
                    <TableCell className="font-medium pl-8 pr-4">{itemNumber++}</TableCell>
                    <TableCell className="whitespace-normal wrap-break-word px-4">
                      {item.name}
                      {showNote && item.note && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{item.note}</p>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal wrap-break-word px-4">{item.brand || "-"}</TableCell>
                    <TableCell className="whitespace-normal wrap-break-word px-4">{item.location || "-"}</TableCell>
                    <TableCell className={cn("text-right px-4", isNegative && "text-red-600 dark:text-red-400 font-semibold")}>{item.qty}</TableCell>
                    <TableCell className="px-4">{item.unit}</TableCell>
                    <TableCell className="text-right px-4">{formatCurrency(item.price)}</TableCell>
                    <TableCell className={cn("text-right font-medium px-4", isNegative && "text-red-600 dark:text-red-400")}>{formatCurrency(total)}</TableCell>
                  </TableRow>
                )
              })}
              {(() => {
                const prelTotal = boq.preliminary.reduce((sum: number, item: any) => sum + (item.qty || 0) * (item.price || 0), 0)
                return (
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={7} className={cn("text-right font-semibold px-4 py-3", subtotalColor(prelTotal))}>
                      Subtotal Preliminary
                    </TableCell>
                    <TableCell className={cn("text-right font-semibold px-4 py-3", subtotalColor(prelTotal))}>
                      {formatCurrency(prelTotal)}
                    </TableCell>
                  </TableRow>
                )
              })()}
            </>
          )}

          {Array.isArray(boq.fittingOut) && boq.fittingOut.length > 0 && (
            <>
              <TableRow className="bg-primary/10">
                <TableCell colSpan={8} className="font-bold text-primary uppercase px-4 py-3">
                  FITTING OUT
                </TableCell>
              </TableRow>
              {boq.fittingOut.map((category: any) => {
                const categoryTotal =
                  Array.isArray(category.products) &&
                  category.products.reduce((sum: number, p: any) => sum + (p.qty || 0) * (p.price || 0), 0)

                return (
                  <React.Fragment key={category._id}>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={8} className="font-semibold pl-8 pr-4 py-2">
                        {category.name}
                      </TableCell>
                    </TableRow>
                    {Array.isArray(category.products) &&
                      sortByQty(category.products).map((product: any) => {
                        const isNegative = (product.qty ?? 0) < 0
                        const total = (product.qty || 0) * (product.price || 0)
                        return (
                          <TableRow key={product._id} className={cn(isNegative && "bg-red-50 dark:bg-red-950/20")}>
                            <TableCell className="font-medium pl-12 pr-4">{itemNumber++}</TableCell>
                            <TableCell className="whitespace-normal wrap-break-word px-4">
                              {product.name}
                              {showNote && product.note && (
                                <p className="text-xs text-muted-foreground mt-1 italic">{product.note}</p>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-normal wrap-break-word px-4">{product.brand || "-"}</TableCell>
                            <TableCell className="whitespace-normal wrap-break-word px-4">{product.location || "-"}</TableCell>
                            <TableCell className={cn("text-right px-4", isNegative && "text-red-600 dark:text-red-400 font-semibold")}>{product.qty}</TableCell>
                            <TableCell className="px-4">{product.unit}</TableCell>
                            <TableCell className="text-right px-4">{formatCurrency(product.price)}</TableCell>
                            <TableCell className={cn("text-right font-medium px-4", isNegative && "text-red-600 dark:text-red-400")}>{formatCurrency(total)}</TableCell>
                          </TableRow>
                        )
                      })}
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={7} className={cn("text-right text-sm font-medium px-4 py-2", subtotalColor(categoryTotal || 0))}>
                        Subtotal {category.name}
                      </TableCell>
                      <TableCell className={cn("text-right text-sm font-medium px-4 py-2", subtotalColor(categoryTotal || 0))}>
                        {formatCurrency(categoryTotal || 0)}
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                )
              })}
              {(() => {
                const foTotal = boq.fittingOut.reduce(
                  (sum: number, cat: any) =>
                    sum + (Array.isArray(cat.products)
                      ? cat.products.reduce((s: number, p: any) => s + (p.qty || 0) * (p.price || 0), 0)
                      : 0),
                  0,
                )
                return (
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={7} className={cn("text-right font-semibold px-4 py-3", subtotalColor(foTotal))}>
                      Subtotal Fitting Out
                    </TableCell>
                    <TableCell className={cn("text-right font-semibold px-4 py-3", subtotalColor(foTotal))}>
                      {formatCurrency(foTotal)}
                    </TableCell>
                  </TableRow>
                )
              })()}
            </>
          )}

          {Array.isArray(boq.furnitureWork) && boq.furnitureWork.length > 0 && (
            <>
              <TableRow className="bg-primary/10">
                <TableCell colSpan={8} className="font-bold text-primary uppercase px-4 py-3">
                  FURNITURE WORK
                </TableCell>
              </TableRow>
              {boq.furnitureWork.map((category: any) => {
                const categoryTotal =
                  Array.isArray(category.products) &&
                  category.products.reduce((sum: number, p: any) => sum + (p.qty || 0) * (p.price || 0), 0)

                return (
                  <React.Fragment key={category._id}>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={8} className="font-semibold pl-8 pr-4 py-2">
                        {category.name}
                      </TableCell>
                    </TableRow>
                    {Array.isArray(category.products) &&
                      sortByQty(category.products).map((product: any) => {
                        const isNegative = (product.qty ?? 0) < 0
                        const total = (product.qty || 0) * (product.price || 0)
                        return (
                          <TableRow key={product._id} className={cn(isNegative && "bg-red-50 dark:bg-red-950/20")}>
                            <TableCell className="font-medium pl-12 pr-4">{itemNumber++}</TableCell>
                            <TableCell className="whitespace-normal wrap-break-word px-4">
                              {product.name}
                              {showNote && product.note && (
                                <p className="text-xs text-muted-foreground mt-1 italic">{product.note}</p>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-normal wrap-break-word px-4">{product.brand || "-"}</TableCell>
                            <TableCell className="whitespace-normal wrap-break-word px-4">{product.location || "-"}</TableCell>
                            <TableCell className={cn("text-right px-4", isNegative && "text-red-600 dark:text-red-400 font-semibold")}>{product.qty}</TableCell>
                            <TableCell className="px-4">{product.unit}</TableCell>
                            <TableCell className="text-right px-4">{formatCurrency(product.price)}</TableCell>
                            <TableCell className={cn("text-right font-medium px-4", isNegative && "text-red-600 dark:text-red-400")}>{formatCurrency(total)}</TableCell>
                          </TableRow>
                        )
                      })}
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={7} className={cn("text-right text-sm font-medium px-4 py-2", subtotalColor(categoryTotal || 0))}>
                        Subtotal {category.name}
                      </TableCell>
                      <TableCell className={cn("text-right text-sm font-medium px-4 py-2", subtotalColor(categoryTotal || 0))}>
                        {formatCurrency(categoryTotal || 0)}
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                )
              })}
              {(() => {
                const fwTotal = boq.furnitureWork.reduce(
                  (sum: number, cat: any) =>
                    sum + (Array.isArray(cat.products)
                      ? cat.products.reduce((s: number, p: any) => s + (p.qty || 0) * (p.price || 0), 0)
                      : 0),
                  0,
                )
                return (
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={7} className={cn("text-right font-semibold px-4 py-3", subtotalColor(fwTotal))}>
                      Subtotal Furniture Work
                    </TableCell>
                    <TableCell className={cn("text-right font-semibold px-4 py-3", subtotalColor(fwTotal))}>
                      {formatCurrency(fwTotal)}
                    </TableCell>
                  </TableRow>
                )
              })()}
            </>
          )}

          {Array.isArray(boq.mechanicalElectrical) && boq.mechanicalElectrical.length > 0 && (
            <>
              <TableRow className="bg-primary/10">
                <TableCell colSpan={8} className="font-bold text-primary uppercase px-4 py-3">
                  MECHANICAL / ELECTRICAL / PLUMBING
                </TableCell>
              </TableRow>
              {boq.mechanicalElectrical.map((category: any) => {
                const categoryTotal =
                  Array.isArray(category.products) &&
                  category.products.reduce((sum: number, p: any) => sum + (p.qty || 0) * (p.price || 0), 0)

                return (
                  <React.Fragment key={category._id}>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={8} className="font-semibold pl-8 pr-4 py-2">
                        {category.name}
                      </TableCell>
                    </TableRow>
                    {Array.isArray(category.products) &&
                      sortByQty(category.products).map((product: any) => {
                        const isNegative = (product.qty ?? 0) < 0
                        const total = (product.qty || 0) * (product.price || 0)
                        return (
                          <TableRow key={product._id} className={cn(isNegative && "bg-red-50 dark:bg-red-950/20")}>
                            <TableCell className="font-medium pl-12 pr-4">{itemNumber++}</TableCell>
                            <TableCell className="whitespace-normal wrap-break-word px-4">
                              {product.name}
                              {showNote && product.note && (
                                <p className="text-xs text-muted-foreground mt-1 italic">{product.note}</p>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-normal wrap-break-word px-4">{product.brand || "-"}</TableCell>
                            <TableCell className="whitespace-normal wrap-break-word px-4">{product.location || "-"}</TableCell>
                            <TableCell className={cn("text-right px-4", isNegative && "text-red-600 dark:text-red-400 font-semibold")}>{product.qty}</TableCell>
                            <TableCell className="px-4">{product.unit}</TableCell>
                            <TableCell className="text-right px-4">{formatCurrency(product.price)}</TableCell>
                            <TableCell className={cn("text-right font-medium px-4", isNegative && "text-red-600 dark:text-red-400")}>{formatCurrency(total)}</TableCell>
                          </TableRow>
                        )
                      })}
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={7} className={cn("text-right text-sm font-medium px-4 py-2", subtotalColor(categoryTotal || 0))}>
                        Subtotal {category.name}
                      </TableCell>
                      <TableCell className={cn("text-right text-sm font-medium px-4 py-2", subtotalColor(categoryTotal || 0))}>
                        {formatCurrency(categoryTotal || 0)}
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                )
              })}
              {(() => {
                const mepTotal = boq.mechanicalElectrical.reduce(
                  (sum: number, cat: any) =>
                    sum + (Array.isArray(cat.products)
                      ? cat.products.reduce((s: number, p: any) => s + (p.qty || 0) * (p.price || 0), 0)
                      : 0),
                  0,
                )
                return (
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={7} className={cn("text-right font-semibold px-4 py-3", subtotalColor(mepTotal))}>
                      Subtotal Mechanical / Electrical / Plumbing
                    </TableCell>
                    <TableCell className={cn("text-right font-semibold px-4 py-3", subtotalColor(mepTotal))}>
                      {formatCurrency(mepTotal)}
                    </TableCell>
                  </TableRow>
                )
              })()}
            </>
          )}

        </TableBody>
      </Table>
    </div>

    {hasData && (() => {
      // ── Discount / Tax calculation ──
      const discountVal = parseFloat(discountTaxData?.discount || "0") || 0
      const discountType = discountTaxData?.discountType ?? "%"
      const taxVal = parseFloat(discountTaxData?.tax || "0") || 0
      const taxType = discountTaxData?.taxType ?? "%"
      const discountAmt =
        discountType === "%" ? (grandTotal * discountVal) / 100 : discountVal
      const afterDiscount = grandTotal - discountAmt
      const taxAmt =
        taxType === "%" ? (afterDiscount * taxVal) / 100 : taxVal
      const finalTotal = afterDiscount + taxAmt
      const hasDiscountOrTax = discountVal > 0 || taxVal > 0

      return (
        <Card className="border-2 border-primary bg-primary/5">
          <CardContent>
            {/* ── Section subtotals ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b">
              {Array.isArray(boq.preliminary) && boq.preliminary.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Preliminary</p>
                  <p className={cn("font-semibold", subtotalColor(preliminarySubtotal))}>
                    {formatCurrency(preliminarySubtotal)}
                  </p>
                </div>
              )}
              {Array.isArray(boq.fittingOut) && boq.fittingOut.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Fitting Out</p>
                  <p className={cn("font-semibold", subtotalColor(fittingOutSubtotal))}>
                    {formatCurrency(fittingOutSubtotal)}
                  </p>
                </div>
              )}
              {Array.isArray(boq.furnitureWork) && boq.furnitureWork.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Furniture Work</p>
                  <p className={cn("font-semibold", subtotalColor(furnitureWorkSubtotal))}>
                    {formatCurrency(furnitureWorkSubtotal)}
                  </p>
                </div>
              )}
              {Array.isArray(boq.mechanicalElectrical) && boq.mechanicalElectrical.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">MEP</p>
                  <p className={cn("font-semibold", subtotalColor(mepSubtotal))}>
                    {formatCurrency(mepSubtotal)}
                  </p>
                </div>
              )}
            </div>

            {/* ── Grand total row ── */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span className={cn("font-medium", subtotalColor(grandTotal))}>{formatCurrency(grandTotal)}</span>
              </div>

              {hasDiscountOrTax && discountVal > 0 && (
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Discount{discountType === "%" ? ` (${discountVal}%)` : " (flat)"}</span>
                  <span className="font-medium text-red-500">-{formatCurrency(discountAmt)}</span>
                </div>
              )}
              {hasDiscountOrTax && discountVal > 0 && (
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>After Discount</span>
                  <span className="font-medium">{formatCurrency(afterDiscount)}</span>
                </div>
              )}
              {hasDiscountOrTax && taxVal > 0 && (
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Tax (PPN){taxType === "%" ? ` (${taxVal}%)` : " (flat)"}</span>
                  <span className="font-medium text-amber-600">+{formatCurrency(taxAmt)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-xl font-bold">{hasDiscountOrTax ? "TOTAL PRICE" : "GRAND TOTAL"}</span>
                <span className={cn("text-3xl font-bold text-primary", subtotalColor(hasDiscountOrTax ? finalTotal : grandTotal))}>
                  {formatCurrency(hasDiscountOrTax ? finalTotal : grandTotal)}
                </span>
              </div>
            </div>

            {/* ── Discount & Tax toggle form ── */}
            {discountTaxData && onDiscountTaxChange && onSaveDiscountTax && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm((v) => !v)}
                  className="text-xs"
                >
                  {showForm ? (
                    <><X className="h-3 w-3 mr-1" />Cancel</>
                  ) : (
                    <><Pencil className="h-3 w-3 mr-1" />{hasDiscountOrTax ? "Edit Discount & Tax" : "Add Discount & Tax"}</>
                  )}
                </Button>

                {showForm && (
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Discount */}
                      <div className="space-y-1">
                        <Label className="text-xs">Discount</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={discountTaxData.discount}
                            onChange={(e) => onDiscountTaxChange({ discount: e.target.value })}
                            className="flex-1 h-8 text-sm"
                          />
                          <Select
                            value={discountTaxData.discountType}
                            onValueChange={(v: "%" | "0") => onDiscountTaxChange({ discountType: v })}
                          >
                            <SelectTrigger className="w-20 h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="%">%</SelectItem>
                              <SelectItem value="0">Flat</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {/* Tax */}
                      <div className="space-y-1">
                        <Label className="text-xs">Tax (PPN)</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={discountTaxData.tax}
                            onChange={(e) => onDiscountTaxChange({ tax: e.target.value })}
                            className="flex-1 h-8 text-sm"
                          />
                          <Select
                            value={discountTaxData.taxType}
                            onValueChange={(v: "%" | "0") => onDiscountTaxChange({ taxType: v })}
                          >
                            <SelectTrigger className="w-20 h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="%">%</SelectItem>
                              <SelectItem value="0">Flat</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        onSaveDiscountTax()
                        setShowForm(false)
                      }}
                      disabled={discountTaxData.saving}
                    >
                      {discountTaxData.saving ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )
    })()}
    </div>
  )
}
