"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecapRow {
  _rowKey: string
  name: string
  unit: string
  // AS PER CONTRACT (Main BOQ)
  mainQty: number
  mainPrice: number
  mainTotal: number
  // ADDITIONAL / DEDUCTION (accumulated across all additional BOQs)
  addQty: number
  addPrice: number // effective = addTotal / addQty
  addTotal: number
  // NET RESULT
  netQty: number
  netPrice: number // effective = netTotal / netQty
  netTotal: number
}

interface RecapCategory {
  name: string
  rows: RecapRow[]
}

interface SectionTotals {
  main: number
  add: number
  net: number
}

interface BoqRecapProps {
  mainBOQ: any
  additionalBOQs: any[]
  formatCurrency: (value: number) => string
}

// ─── Identity helpers ─────────────────────────────────────────────────────────

/**
 * Build canonical merge key for an item.
 * Rule: name + _id must BOTH match for same item.
 * Fallback: if _id is absent, use normalised name only.
 */
function itemKey(item: any): string {
  const id = (item?._id ?? "").trim()
  const name = (item?.name ?? "").trim().toLowerCase()
  if (!name) return ""
  return id ? `${name}:::${id}` : name
}

// ─── Merge helpers ────────────────────────────────────────────────────────────

function finalizeRow(row: RecapRow): RecapRow {
  row.netQty = row.mainQty + row.addQty
  row.netTotal = row.mainTotal + row.addTotal
  row.addPrice = row.addQty !== 0 ? row.addTotal / row.addQty : 0
  row.netPrice = row.netQty !== 0 ? row.netTotal / row.netQty : 0
  return row
}

function mergePreliminary(mainItems: any[], additionalBOQs: any[]): RecapRow[] {
  const map = new Map<string, RecapRow>()

  for (const item of mainItems) {
    const key = itemKey(item)
    if (!key) continue
    const qty = item.qty ?? 0
    const price = item.price ?? 0
    map.set(key, {
      _rowKey: key,
      name: item.name ?? "",
      unit: item.unit ?? "",
      mainQty: qty,
      mainPrice: price,
      mainTotal: qty * price,
      addQty: 0,
      addPrice: 0,
      addTotal: 0,
      netQty: 0,
      netPrice: 0,
      netTotal: 0,
    })
  }

  for (const boq of additionalBOQs) {
    for (const item of (boq.preliminary ?? [])) {
      const key = itemKey(item)
      if (!key) continue
      const qty = item.qty ?? 0
      const price = item.price ?? 0
      if (map.has(key)) {
        const r = map.get(key)!
        r.addQty += qty
        r.addTotal += qty * price
      } else {
        map.set(key, {
          _rowKey: key,
          name: item.name ?? "",
          unit: item.unit ?? "",
          mainQty: 0,
          mainPrice: 0,
          mainTotal: 0,
          addQty: qty,
          addPrice: 0,
          addTotal: qty * price,
          netQty: 0,
          netPrice: 0,
          netTotal: 0,
        })
      }
    }
  }

  return Array.from(map.values()).map(finalizeRow)
}

function mergeCategorized(
  mainCategories: any[],
  additionalBOQs: any[],
  section: "fittingOut" | "furnitureWork" | "mechanicalElectrical",
): RecapCategory[] {
  // catName → (itemKey → RecapRow)
  const catMap = new Map<string, Map<string, RecapRow>>()

  const ensureCat = (catName: string) => {
    if (!catMap.has(catName)) catMap.set(catName, new Map())
    return catMap.get(catName)!
  }

  for (const cat of mainCategories) {
    const catName = cat.name || "Uncategorized"
    const imap = ensureCat(catName)
    for (const product of (cat.products ?? [])) {
      const key = itemKey(product)
      if (!key) continue
      const qty = product.qty ?? 0
      const price = product.price ?? 0
      imap.set(key, {
        _rowKey: `${catName}:::${key}`,
        name: product.name ?? "",
        unit: product.unit ?? "",
        mainQty: qty,
        mainPrice: price,
        mainTotal: qty * price,
        addQty: 0,
        addPrice: 0,
        addTotal: 0,
        netQty: 0,
        netPrice: 0,
        netTotal: 0,
      })
    }
  }

  for (const boq of additionalBOQs) {
    for (const cat of (boq[section] ?? [])) {
      const catName = cat.name || "Uncategorized"
      const imap = ensureCat(catName)
      for (const product of (cat.products ?? [])) {
        const key = itemKey(product)
        if (!key) continue
        const qty = product.qty ?? 0
        const price = product.price ?? 0
        if (imap.has(key)) {
          const r = imap.get(key)!
          r.addQty += qty
          r.addTotal += qty * price
        } else {
          imap.set(key, {
            _rowKey: `${catName}:::${key}`,
            name: product.name ?? "",
            unit: product.unit ?? "",
            mainQty: 0,
            mainPrice: 0,
            mainTotal: 0,
            addQty: qty,
            addPrice: 0,
            addTotal: qty * price,
            netQty: 0,
            netPrice: 0,
            netTotal: 0,
          })
        }
      }
    }
  }

  return Array.from(catMap.entries()).map(([name, imap]) => ({
    name,
    rows: Array.from(imap.values()).map(finalizeRow),
  }))
}

// ─── Total aggregates ─────────────────────────────────────────────────────────

function rowsTotals(rows: RecapRow[]): SectionTotals {
  return rows.reduce(
    (acc, r) => ({ main: acc.main + r.mainTotal, add: acc.add + r.addTotal, net: acc.net + r.netTotal }),
    { main: 0, add: 0, net: 0 },
  )
}

function categoriesTotals(cats: RecapCategory[]): SectionTotals {
  return cats.reduce(
    (acc, cat) => {
      const t = rowsTotals(cat.rows)
      return { main: acc.main + t.main, add: acc.add + t.add, net: acc.net + t.net }
    },
    { main: 0, add: 0, net: 0 },
  )
}

// ─── Shared UI sub-components ─────────────────────────────────────────────────

function RecapTableHeader() {
  return (
    <TableHeader>
      <TableRow className="border-b-0">
        <TableHead rowSpan={2} className="px-3 w-12 align-middle border-r text-center">No</TableHead>
        <TableHead rowSpan={2} className="px-3 min-w-52 align-middle border-r">Item Name</TableHead>
        <TableHead rowSpan={2} className="px-3 w-16 align-middle border-r text-center">Unit</TableHead>
        <TableHead
          colSpan={3}
          className="px-3 text-center bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-r text-xs font-bold uppercase tracking-wide"
        >
          As Per Contract
        </TableHead>
        <TableHead
          colSpan={3}
          className="px-3 text-center bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-r text-xs font-bold uppercase tracking-wide"
        >
          Additional / Deduction
        </TableHead>
        <TableHead
          colSpan={3}
          className="px-3 text-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wide"
        >
          Net Result
        </TableHead>
      </TableRow>
      <TableRow>
        {/* AS PER CONTRACT */}
        <TableHead className="px-3 text-right w-20 text-xs bg-blue-50/60 dark:bg-blue-950/20">Qty</TableHead>
        <TableHead className="px-3 text-right w-36 text-xs bg-blue-50/60 dark:bg-blue-950/20">Unit Price</TableHead>
        <TableHead className="px-3 text-right w-40 text-xs bg-blue-50/60 dark:bg-blue-950/20 border-r">Total</TableHead>
        {/* ADDITIONAL / DEDUCTION */}
        <TableHead className="px-3 text-right w-20 text-xs bg-amber-50/60 dark:bg-amber-950/20">Qty</TableHead>
        <TableHead className="px-3 text-right w-36 text-xs bg-amber-50/60 dark:bg-amber-950/20">Unit Price</TableHead>
        <TableHead className="px-3 text-right w-40 text-xs bg-amber-50/60 dark:bg-amber-950/20 border-r">Total</TableHead>
        {/* NET RESULT */}
        <TableHead className="px-3 text-right w-20 text-xs bg-emerald-50/60 dark:bg-emerald-950/20">Qty</TableHead>
        <TableHead className="px-3 text-right w-36 text-xs bg-emerald-50/60 dark:bg-emerald-950/20">Unit Price</TableHead>
        <TableHead className="px-3 text-right w-40 text-xs bg-emerald-50/60 dark:bg-emerald-950/20">Total</TableHead>
      </TableRow>
    </TableHeader>
  )
}

function RecapItemRow({ row, no, formatCurrency }: { row: RecapRow; no: number; formatCurrency: (v: number) => string }) {
  // Appearance flags
  const isNewItem = row.mainQty === 0 && row.mainTotal === 0
  const hasAdd = row.addQty !== 0 || row.addTotal !== 0
  const isDeduction = row.addTotal < 0 || row.addQty < 0
  const isAddition = !isDeduction && hasAdd

  return (
    <TableRow className={cn(hasAdd && !isNewItem && "bg-muted/20")}>
      <TableCell className="px-3 border-r text-sm text-center">{no}</TableCell>
      <TableCell className="px-3 whitespace-normal border-r text-sm">
        {row.name || "-"}
        {isNewItem && hasAdd && (
          <span className="ml-2 inline-block text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 py-0.5 rounded font-semibold">
            NEW
          </span>
        )}
      </TableCell>
      <TableCell className="px-3 border-r text-sm text-center">{row.unit || "-"}</TableCell>

      {/* AS PER CONTRACT */}
      <TableCell className="px-3 text-right text-sm bg-blue-50/30 dark:bg-blue-950/10">{row.mainQty}</TableCell>
      <TableCell className="px-3 text-right text-sm bg-blue-50/30 dark:bg-blue-950/10">{formatCurrency(row.mainPrice)}</TableCell>
      <TableCell className="px-3 text-right font-medium text-sm bg-blue-50/30 dark:bg-blue-950/10 border-r">{formatCurrency(row.mainTotal)}</TableCell>

      {/* ADDITIONAL / DEDUCTION */}
      <TableCell
        className={cn(
          "px-3 text-right text-sm bg-amber-50/30 dark:bg-amber-950/10",
          isDeduction && "text-red-600 dark:text-red-400 font-semibold",
          isAddition && "text-emerald-600 dark:text-emerald-400 font-semibold",
        )}
      >
        {hasAdd ? row.addQty : "-"}
      </TableCell>
      <TableCell
        className={cn(
          "px-3 text-right text-sm bg-amber-50/30 dark:bg-amber-950/10",
          isDeduction && "text-red-600 dark:text-red-400",
          isAddition && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {hasAdd ? formatCurrency(Math.abs(row.addPrice)) : "-"}
      </TableCell>
      <TableCell
        className={cn(
          "px-3 text-right font-medium text-sm bg-amber-50/30 dark:bg-amber-950/10 border-r",
          isDeduction && "text-red-600 dark:text-red-400",
          isAddition && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {hasAdd ? formatCurrency(row.addTotal) : "-"}
      </TableCell>

      {/* NET RESULT */}
      <TableCell className={cn("px-3 text-right text-sm bg-emerald-50/30 dark:bg-emerald-950/10", row.netQty < 0 && "text-red-600 dark:text-red-400")}>
        {row.netQty}
      </TableCell>
      <TableCell className={cn("px-3 text-right text-sm bg-emerald-50/30 dark:bg-emerald-950/10", row.netTotal < 0 && "text-red-600 dark:text-red-400")}>
        {formatCurrency(row.netPrice)}
      </TableCell>
      <TableCell className={cn("px-3 text-right font-medium text-sm bg-emerald-50/30 dark:bg-emerald-950/10", row.netTotal < 0 && "text-red-600 dark:text-red-400")}>
        {formatCurrency(row.netTotal)}
      </TableCell>
    </TableRow>
  )
}

function SubtotalRow({
  label,
  totals,
  formatCurrency,
  variant = "section",
}: {
  label: string
  totals: SectionTotals
  formatCurrency: (v: number) => string
  variant?: "section" | "category"
}) {
  const rowCls = variant === "section"
    ? "bg-muted font-semibold border-t-2 border-t-foreground/20"
    : "bg-muted/50 font-medium border-t text-xs"

  return (
    <TableRow className={rowCls}>
      <TableCell colSpan={3} className="px-3 text-right border-r">{label}:</TableCell>
      <TableCell colSpan={3} className={cn("px-3 text-right border-r bg-blue-50/50 dark:bg-blue-950/20", totals.main < 0 && "text-red-600 dark:text-red-400")}>
        {formatCurrency(totals.main)}
      </TableCell>
      <TableCell
        colSpan={3}
        className={cn(
          "px-3 text-right border-r bg-amber-50/50 dark:bg-amber-950/20",
          totals.add < 0 && "text-red-600 dark:text-red-400",
          totals.add > 0 && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {totals.add > 0 ? "+" : ""}{formatCurrency(totals.add)}
      </TableCell>
      <TableCell colSpan={3} className={cn("px-3 text-right bg-emerald-50/50 dark:bg-emerald-950/20", totals.net < 0 && "text-red-600 dark:text-red-400")}>
        {formatCurrency(totals.net)}
      </TableCell>
    </TableRow>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BoqRecap({ mainBOQ, additionalBOQs, formatCurrency }: BoqRecapProps) {
  const preliminary = mergePreliminary(mainBOQ?.preliminary ?? [], additionalBOQs)
  const fittingOut = mergeCategorized(mainBOQ?.fittingOut ?? [], additionalBOQs, "fittingOut")
  const furnitureWork = mergeCategorized(mainBOQ?.furnitureWork ?? [], additionalBOQs, "furnitureWork")
  const mep = mergeCategorized(mainBOQ?.mechanicalElectrical ?? [], additionalBOQs, "mechanicalElectrical")

  const prelTotals = rowsTotals(preliminary)
  const foTotals = categoriesTotals(fittingOut)
  const fwTotals = categoriesTotals(furnitureWork)
  const mepTotals = categoriesTotals(mep)

  const grandTotals: SectionTotals = {
    main: prelTotals.main + foTotals.main + fwTotals.main + mepTotals.main,
    add: prelTotals.add + foTotals.add + fwTotals.add + mepTotals.add,
    net: prelTotals.net + foTotals.net + fwTotals.net + mepTotals.net,
  }

  // Sequential item numbering across all sections
  let itemNo = 1

  return (
    <div className="space-y-6">
      {/* ── PRELIMINARY ── */}
      {preliminary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">I. PRELIMINARY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <RecapTableHeader />
                <TableBody>
                  {preliminary.map((row) => (
                    <RecapItemRow key={row._rowKey} row={row} no={itemNo++} formatCurrency={formatCurrency} />
                  ))}
                  <SubtotalRow label="SUBTOTAL PRELIMINARY" totals={prelTotals} formatCurrency={formatCurrency} />
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── FITTING OUT ── */}
      {fittingOut.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">II. FITTING OUT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <RecapTableHeader />
                <TableBody>
                  {fittingOut.map((cat) => (
                    <React.Fragment key={cat.name}>
                      <TableRow className="bg-primary/10">
                        <TableCell colSpan={12} className="px-4 py-2 font-semibold text-sm">{cat.name}</TableCell>
                      </TableRow>
                      {cat.rows.map((row) => (
                        <RecapItemRow key={row._rowKey} row={row} no={itemNo++} formatCurrency={formatCurrency} />
                      ))}
                      <SubtotalRow label={`Subtotal ${cat.name}`} totals={rowsTotals(cat.rows)} formatCurrency={formatCurrency} variant="category" />
                    </React.Fragment>
                  ))}
                  <SubtotalRow label="SUBTOTAL FITTING OUT" totals={foTotals} formatCurrency={formatCurrency} />
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── FURNITURE WORK ── */}
      {furnitureWork.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">III. FURNITURE WORK</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <RecapTableHeader />
                <TableBody>
                  {furnitureWork.map((cat) => (
                    <React.Fragment key={cat.name}>
                      <TableRow className="bg-primary/10">
                        <TableCell colSpan={12} className="px-4 py-2 font-semibold text-sm">{cat.name}</TableCell>
                      </TableRow>
                      {cat.rows.map((row) => (
                        <RecapItemRow key={row._rowKey} row={row} no={itemNo++} formatCurrency={formatCurrency} />
                      ))}
                      <SubtotalRow label={`Subtotal ${cat.name}`} totals={rowsTotals(cat.rows)} formatCurrency={formatCurrency} variant="category" />
                    </React.Fragment>
                  ))}
                  <SubtotalRow label="SUBTOTAL FURNITURE WORK" totals={fwTotals} formatCurrency={formatCurrency} />
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── MEP ── */}
      {mep.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">IV. MECHANICAL / ELECTRICAL / PLUMBING</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <RecapTableHeader />
                <TableBody>
                  {mep.map((cat) => (
                    <React.Fragment key={cat.name}>
                      <TableRow className="bg-primary/10">
                        <TableCell colSpan={12} className="px-4 py-2 font-semibold text-sm">{cat.name}</TableCell>
                      </TableRow>
                      {cat.rows.map((row) => (
                        <RecapItemRow key={row._rowKey} row={row} no={itemNo++} formatCurrency={formatCurrency} />
                      ))}
                      <SubtotalRow label={`Subtotal ${cat.name}`} totals={rowsTotals(cat.rows)} formatCurrency={formatCurrency} variant="category" />
                    </React.Fragment>
                  ))}
                  <SubtotalRow label="SUBTOTAL MEP" totals={mepTotals} formatCurrency={formatCurrency} />
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── GRAND TOTAL SUMMARY ── */}
      <Card className="border-2 border-primary bg-primary/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">As Per Contract</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(grandTotals.main)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Additional / Deduction</p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  grandTotals.add < 0 && "text-red-600 dark:text-red-400",
                  grandTotals.add > 0 && "text-emerald-600 dark:text-emerald-400",
                  grandTotals.add === 0 && "text-muted-foreground",
                )}
              >
                {grandTotals.add > 0 ? "+" : ""}{formatCurrency(grandTotals.add)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Net Total</p>
              <p className={cn("text-2xl font-bold", grandTotals.net < 0 ? "text-red-600 dark:text-red-400" : "text-primary")}>{formatCurrency(grandTotals.net)}</p>
            </div>
          </div>

          {/* Per-section breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            {preliminary.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Preliminary (Net)</p>
                <p className={cn("font-semibold text-sm", prelTotals.net < 0 && "text-red-600 dark:text-red-400")}>{formatCurrency(prelTotals.net)}</p>
              </div>
            )}
            {fittingOut.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Fitting Out (Net)</p>
                <p className={cn("font-semibold text-sm", foTotals.net < 0 && "text-red-600 dark:text-red-400")}>{formatCurrency(foTotals.net)}</p>
              </div>
            )}
            {furnitureWork.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Furniture Work (Net)</p>
                <p className={cn("font-semibold text-sm", fwTotals.net < 0 && "text-red-600 dark:text-red-400")}>{formatCurrency(fwTotals.net)}</p>
              </div>
            )}
            {mep.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">MEP (Net)</p>
                <p className={cn("font-semibold text-sm", mepTotals.net < 0 && "text-red-600 dark:text-red-400")}>{formatCurrency(mepTotals.net)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


