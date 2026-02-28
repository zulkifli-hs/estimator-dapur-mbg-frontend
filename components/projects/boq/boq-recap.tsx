"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface BoqRecapProps {
  mainBOQ: any
  additionalBOQs: any[]
  formatCurrency: (value: number) => string
}

export function BoqRecap({ mainBOQ, additionalBOQs, formatCurrency }: BoqRecapProps) {
  const merged = {
    preliminary: [] as any[],
    fittingOut: {} as { [key: string]: any },
    furnitureWork: {} as { [key: string]: any },
    mechanicalElectrical: {} as { [key: string]: any },
  }

  const addItemsWithSource = (items: any[], source: string, section: "preliminary") => {
    items.forEach((item: any) => {
      merged[section].push({
        ...item,
        _source: source,
      })
    })
  }

  const addCategoryItemsWithSource = (
    categories: any[],
    source: string,
    section: "fittingOut" | "furnitureWork" | "mechanicalElectrical",
  ) => {
    categories.forEach((category: any) => {
      const categoryKey = category.name || "Uncategorized"
      if (!merged[section][categoryKey]) {
        merged[section][categoryKey] = {
          name: categoryKey,
          products: [],
        }
      }
      category.products?.forEach((product: any) => {
        merged[section][categoryKey].products.push({
          ...product,
          _source: source,
        })
      })
    })
  }

  if (mainBOQ) {
    addItemsWithSource(mainBOQ.preliminary || [], "Main BOQ", "preliminary")
    addCategoryItemsWithSource(mainBOQ.fittingOut || [], "Main BOQ", "fittingOut")
    addCategoryItemsWithSource(mainBOQ.furnitureWork || [], "Main BOQ", "furnitureWork")
    addCategoryItemsWithSource(mainBOQ.mechanicalElectrical || [], "Main BOQ", "mechanicalElectrical")
  }

  additionalBOQs.forEach((boq: any) => {
    const source = `Additional BOQ #${boq.number}`
    addItemsWithSource(boq.preliminary || [], source, "preliminary")
    addCategoryItemsWithSource(boq.fittingOut || [], source, "fittingOut")
    addCategoryItemsWithSource(boq.furnitureWork || [], source, "furnitureWork")
    addCategoryItemsWithSource(boq.mechanicalElectrical || [], source, "mechanicalElectrical")
  })

  let itemNumber = 1
  let grandTotal = 0

  const preliminarySubtotal = merged.preliminary.reduce((sum, item) => {
    return sum + (item.qty || 0) * (item.price || 0)
  }, 0)
  grandTotal += preliminarySubtotal

  const fittingOutSubtotal = Object.values(merged.fittingOut).reduce((sum: number, category: any) => {
    return (
      sum +
      category.products.reduce((catSum: number, product: any) => {
        return catSum + (product.qty || 0) * (product.price || 0)
      }, 0)
    )
  }, 0)
  grandTotal += fittingOutSubtotal

  const furnitureWorkSubtotal = Object.values(merged.furnitureWork).reduce((sum: number, category: any) => {
    return (
      sum +
      category.products.reduce((catSum: number, product: any) => {
        return catSum + (product.qty || 0) * (product.price || 0)
      }, 0)
    )
  }, 0)
  grandTotal += furnitureWorkSubtotal

  const mepSubtotal = Object.values(merged.mechanicalElectrical).reduce((sum: number, category: any) => {
    return (
      sum +
      category.products.reduce((catSum: number, product: any) => {
        return catSum + (product.qty || 0) * (product.price || 0)
      }, 0)
    )
  }, 0)
  grandTotal += mepSubtotal

  return (
    <div className="space-y-6">
      {merged.preliminary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">I. PRELIMINARY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-15 px-4">No</TableHead>
                    <TableHead className="min-w-50 max-w-100 px-4">Item Name</TableHead>
                    <TableHead className="w-25 px-4">Source</TableHead>
                    <TableHead className="text-right w-20 px-4">Qty</TableHead>
                    <TableHead className="w-20 px-4">Unit</TableHead>
                    <TableHead className="text-right w-37.5 px-4">Unit Price</TableHead>
                    <TableHead className="text-right w-37.5 px-4">Total Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merged.preliminary.map((item: any) => (
                    <TableRow key={`${item._source}-${item.name}-${itemNumber}`}>
                      <TableCell className="px-4">{itemNumber++}</TableCell>
                      <TableCell className="px-4">{item.name || "-"}</TableCell>
                      <TableCell className="px-4">
                        <Badge variant={item._source === "Main BOQ" ? "default" : "secondary"} className="whitespace-nowrap">
                          {item._source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-4">{item.qty || 0}</TableCell>
                      <TableCell className="px-4">{item.unit || "-"}</TableCell>
                      <TableCell className="text-right px-4">{formatCurrency(item.price || 0)}</TableCell>
                      <TableCell className="text-right px-4 font-semibold">
                        {formatCurrency((item.qty || 0) * (item.price || 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-semibold border-t-2 border-t-foreground">
                    <TableCell colSpan={6} className="px-4 text-right">
                      SUBTOTAL PRELIMINARY:
                    </TableCell>
                    <TableCell className="text-right px-4">{formatCurrency(preliminarySubtotal)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(merged.fittingOut).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">II. FITTING OUT</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(merged.fittingOut).map(([categoryName, categoryData]: [string, any]) => (
              <div key={categoryName} className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 font-semibold">{categoryName}</div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-15 px-4">No</TableHead>
                        <TableHead className="min-w-50 max-w-100 px-4">Item Name</TableHead>
                        <TableHead className="w-25 px-4">Source</TableHead>
                        <TableHead className="text-right w-20 px-4">Qty</TableHead>
                        <TableHead className="w-20 px-4">Unit</TableHead>
                        <TableHead className="text-right w-37.5 px-4">Unit Price</TableHead>
                        <TableHead className="text-right w-37.5 px-4">Total Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryData.products.map((product: any) => {
                        const itemTotal = (product.qty || 0) * (product.price || 0)
                        return (
                          <TableRow key={`${categoryName}-${product._source}-${product.name}-${itemNumber}`}>
                            <TableCell className="px-4">{itemNumber++}</TableCell>
                            <TableCell className="px-4">{product.name || "-"}</TableCell>
                            <TableCell className="px-4">
                              <Badge
                                variant={product._source === "Main BOQ" ? "default" : "secondary"}
                                className="whitespace-nowrap"
                              >
                                {product._source}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right px-4">{product.qty || 0}</TableCell>
                            <TableCell className="px-4">{product.unit || "-"}</TableCell>
                            <TableCell className="text-right px-4">{formatCurrency(product.price || 0)}</TableCell>
                            <TableCell className="text-right px-4 font-semibold">{formatCurrency(itemTotal)}</TableCell>
                          </TableRow>
                        )
                      })}
                      <TableRow className="bg-muted/50 font-semibold border-t">
                        <TableCell colSpan={6} className="px-4 text-right">
                          Subtotal {categoryName}:
                        </TableCell>
                        <TableCell className="text-right px-4">
                          {formatCurrency(
                            categoryData.products.reduce((sum: number, p: any) => sum + (p.qty || 0) * (p.price || 0), 0),
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {Object.keys(merged.furnitureWork).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">III. FURNITURE WORK</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(merged.furnitureWork).map(([categoryName, categoryData]: [string, any]) => (
              <div key={categoryName} className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 font-semibold">{categoryName}</div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-15 px-4">No</TableHead>
                        <TableHead className="min-w-50 max-w-100 px-4">Item Name</TableHead>
                        <TableHead className="w-25 px-4">Source</TableHead>
                        <TableHead className="text-right w-20 px-4">Qty</TableHead>
                        <TableHead className="w-20 px-4">Unit</TableHead>
                        <TableHead className="text-right w-37.5 px-4">Unit Price</TableHead>
                        <TableHead className="text-right w-37.5 px-4">Total Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryData.products.map((product: any) => {
                        const itemTotal = (product.qty || 0) * (product.price || 0)
                        return (
                          <TableRow key={`${categoryName}-${product._source}-${product.name}-${itemNumber}`}>
                            <TableCell className="px-4">{itemNumber++}</TableCell>
                            <TableCell className="px-4">{product.name || "-"}</TableCell>
                            <TableCell className="px-4">
                              <Badge
                                variant={product._source === "Main BOQ" ? "default" : "secondary"}
                                className="whitespace-nowrap"
                              >
                                {product._source}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right px-4">{product.qty || 0}</TableCell>
                            <TableCell className="px-4">{product.unit || "-"}</TableCell>
                            <TableCell className="text-right px-4">{formatCurrency(product.price || 0)}</TableCell>
                            <TableCell className="text-right px-4 font-semibold">{formatCurrency(itemTotal)}</TableCell>
                          </TableRow>
                        )
                      })}
                      <TableRow className="bg-muted/50 font-semibold border-t">
                        <TableCell colSpan={6} className="px-4 text-right">
                          Subtotal {categoryName}:
                        </TableCell>
                        <TableCell className="text-right px-4">
                          {formatCurrency(
                            categoryData.products.reduce((sum: number, p: any) => sum + (p.qty || 0) * (p.price || 0), 0),
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {Object.keys(merged.mechanicalElectrical).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">IV. MECHANICAL / ELECTRICAL / PLUMBING</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(merged.mechanicalElectrical).map(([categoryName, categoryData]: [string, any]) => (
              <div key={categoryName} className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 font-semibold">{categoryName}</div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-15 px-4">No</TableHead>
                        <TableHead className="min-w-50 max-w-100 px-4">Item Name</TableHead>
                        <TableHead className="w-25 px-4">Source</TableHead>
                        <TableHead className="text-right w-20 px-4">Qty</TableHead>
                        <TableHead className="w-20 px-4">Unit</TableHead>
                        <TableHead className="text-right w-37.5 px-4">Unit Price</TableHead>
                        <TableHead className="text-right w-37.5 px-4">Total Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryData.products.map((product: any) => {
                        const itemTotal = (product.qty || 0) * (product.price || 0)
                        return (
                          <TableRow key={`${categoryName}-${product._source}-${product.name}-${itemNumber}`}>
                            <TableCell className="px-4">{itemNumber++}</TableCell>
                            <TableCell className="px-4">{product.name || "-"}</TableCell>
                            <TableCell className="px-4">
                              <Badge
                                variant={product._source === "Main BOQ" ? "default" : "secondary"}
                                className="whitespace-nowrap"
                              >
                                {product._source}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right px-4">{product.qty || 0}</TableCell>
                            <TableCell className="px-4">{product.unit || "-"}</TableCell>
                            <TableCell className="text-right px-4">{formatCurrency(product.price || 0)}</TableCell>
                            <TableCell className="text-right px-4 font-semibold">{formatCurrency(itemTotal)}</TableCell>
                          </TableRow>
                        )
                      })}
                      <TableRow className="bg-muted/50 font-semibold border-t">
                        <TableCell colSpan={6} className="px-4 text-right">
                          Subtotal {categoryName}:
                        </TableCell>
                        <TableCell className="text-right px-4">
                          {formatCurrency(
                            categoryData.products.reduce((sum: number, p: any) => sum + (p.qty || 0) * (p.price || 0), 0),
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-primary bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">GRAND TOTAL</span>
            <span className="text-3xl font-bold text-primary">{formatCurrency(grandTotal)}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            {merged.preliminary.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Preliminary</p>
                <p className="font-semibold">{formatCurrency(preliminarySubtotal)}</p>
              </div>
            )}
            {Object.keys(merged.fittingOut).length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Fitting Out</p>
                <p className="font-semibold">{formatCurrency(fittingOutSubtotal)}</p>
              </div>
            )}
            {Object.keys(merged.furnitureWork).length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Furniture Work</p>
                <p className="font-semibold">{formatCurrency(furnitureWorkSubtotal)}</p>
              </div>
            )}
            {Object.keys(merged.mechanicalElectrical).length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">MEP</p>
                <p className="font-semibold">{formatCurrency(mepSubtotal)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
