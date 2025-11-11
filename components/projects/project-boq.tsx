"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Plus } from "lucide-react"
import { boqApi } from "@/lib/api/boq"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import React from "react"
import { CreateBOQDialog } from "./create-boq-dialog"

interface ProjectBOQProps {
  projectId: string
}

export function ProjectBOQ({ projectId }: ProjectBOQProps) {
  const [boqItems, setBoqItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalBudget: 0,
    totalSpent: 0,
    progress: 0,
  })
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    loadBOQ()
  }, [projectId])

  const loadBOQ = async () => {
    try {
      const response = await boqApi.getByProject(projectId)

      if (response.success && response.data && Array.isArray(response.data)) {
        setBoqItems(response.data)
        calculateSummary(response.data)
      } else {
        setBoqItems([])
      }
    } catch (error) {
      console.error("Failed to load BOQ:", error)
      setBoqItems([])
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (items: any[]) => {
    if (!Array.isArray(items) || items.length === 0) {
      setSummary({ totalBudget: 0, totalSpent: 0, progress: 0 })
      return
    }

    let totalBudget = 0

    items.forEach((boq) => {
      // Calculate from preliminary items
      if (Array.isArray(boq.preliminary)) {
        boq.preliminary.forEach((item: any) => {
          totalBudget += (item.qty || 0) * (item.price || 0)
        })
      }

      // Calculate from fittingOut categories
      if (Array.isArray(boq.fittingOut)) {
        boq.fittingOut.forEach((category: any) => {
          if (Array.isArray(category.products)) {
            category.products.forEach((product: any) => {
              totalBudget += (product.qty || 0) * (product.price || 0)
            })
          }
        })
      }

      // Calculate from furnitureWork categories
      if (Array.isArray(boq.furnitureWork)) {
        boq.furnitureWork.forEach((category: any) => {
          if (Array.isArray(category.products)) {
            category.products.forEach((product: any) => {
              totalBudget += (product.qty || 0) * (product.price || 0)
            })
          }
        })
      }
    })

    setSummary({ totalBudget, totalSpent: 0, progress: 0 })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const mainBOQ = boqItems.find((boq) => boq.number === 1)
  const additionalBOQs = boqItems.filter((boq) => boq.number !== 1)

  const renderBOQTable = (boq: any) => {
    let itemNumber = 1
    let grandTotal = 0

    return (
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] px-4">No</TableHead>
              <TableHead className="min-w-[300px] max-w-[500px] px-4">Item Name</TableHead>
              <TableHead className="text-right w-[80px] px-4">Qty</TableHead>
              <TableHead className="w-[80px] px-4">Unit</TableHead>
              <TableHead className="text-right w-[150px] px-4">Unit Price</TableHead>
              <TableHead className="text-right w-[150px] px-4">Total Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* PRELIMINARY SECTION */}
            {Array.isArray(boq.preliminary) && boq.preliminary.length > 0 && (
              <>
                <TableRow className="bg-primary/10">
                  <TableCell colSpan={6} className="font-bold text-primary uppercase px-4 py-3">
                    PRELIMINARY
                  </TableCell>
                </TableRow>
                {boq.preliminary.map((item: any) => {
                  const total = (item.qty || 0) * (item.price || 0)
                  grandTotal += total
                  return (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium pl-8 pr-4">{itemNumber++}</TableCell>
                      <TableCell className="whitespace-normal break-words px-4">{item.name}</TableCell>
                      <TableCell className="text-right px-4">{item.qty}</TableCell>
                      <TableCell className="px-4">{item.unit}</TableCell>
                      <TableCell className="text-right px-4">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right font-medium px-4">{formatCurrency(total)}</TableCell>
                    </TableRow>
                  )
                })}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={5} className="text-right font-semibold px-4 py-3">
                    Subtotal Preliminary
                  </TableCell>
                  <TableCell className="text-right font-semibold px-4 py-3">
                    {formatCurrency(
                      boq.preliminary.reduce((sum: number, item: any) => sum + (item.qty || 0) * (item.price || 0), 0),
                    )}
                  </TableCell>
                </TableRow>
              </>
            )}

            {/* FITTING OUT SECTION */}
            {Array.isArray(boq.fittingOut) && boq.fittingOut.length > 0 && (
              <>
                <TableRow className="bg-primary/10">
                  <TableCell colSpan={6} className="font-bold text-primary uppercase px-4 py-3">
                    FITTING OUT
                  </TableCell>
                </TableRow>
                {boq.fittingOut.map((category: any) => {
                  const categoryTotal =
                    Array.isArray(category.products) &&
                    category.products.reduce((sum: number, p: any) => sum + (p.qty || 0) * (p.price || 0), 0)
                  grandTotal += categoryTotal || 0

                  return (
                    <React.Fragment key={category._id}>
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={6} className="font-semibold pl-8 pr-4 py-2">
                          {category.name}
                        </TableCell>
                      </TableRow>
                      {Array.isArray(category.products) &&
                        category.products.map((product: any) => {
                          const total = (product.qty || 0) * (product.price || 0)
                          return (
                            <TableRow key={product._id}>
                              <TableCell className="font-medium pl-12 pr-4">{itemNumber++}</TableCell>
                              <TableCell className="whitespace-normal break-words px-4">{product.name}</TableCell>
                              <TableCell className="text-right px-4">{product.qty}</TableCell>
                              <TableCell className="px-4">{product.unit}</TableCell>
                              <TableCell className="text-right px-4">{formatCurrency(product.price)}</TableCell>
                              <TableCell className="text-right font-medium px-4">{formatCurrency(total)}</TableCell>
                            </TableRow>
                          )
                        })}
                      <TableRow className="bg-muted/20">
                        <TableCell colSpan={5} className="text-right text-sm font-medium pl-12 pr-4 py-2">
                          Subtotal {category.name}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium px-4 py-2">
                          {formatCurrency(categoryTotal || 0)}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  )
                })}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={5} className="text-right font-semibold px-4 py-3">
                    Subtotal Fitting Out
                  </TableCell>
                  <TableCell className="text-right font-semibold px-4 py-3">
                    {formatCurrency(
                      boq.fittingOut.reduce(
                        (sum: number, cat: any) =>
                          sum +
                          (Array.isArray(cat.products)
                            ? cat.products.reduce((s: number, p: any) => s + (p.qty || 0) * (p.price || 0), 0)
                            : 0),
                        0,
                      ),
                    )}
                  </TableCell>
                </TableRow>
              </>
            )}

            {/* FURNITURE WORK SECTION */}
            {Array.isArray(boq.furnitureWork) && boq.furnitureWork.length > 0 && (
              <>
                <TableRow className="bg-primary/10">
                  <TableCell colSpan={6} className="font-bold text-primary uppercase px-4 py-3">
                    FURNITURE WORK
                  </TableCell>
                </TableRow>
                {boq.furnitureWork.map((category: any) => {
                  const categoryTotal =
                    Array.isArray(category.products) &&
                    category.products.reduce((sum: number, p: any) => sum + (p.qty || 0) * (p.price || 0), 0)
                  grandTotal += categoryTotal || 0

                  return (
                    <React.Fragment key={category._id}>
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={6} className="font-semibold pl-8 pr-4 py-2">
                          {category.name}
                        </TableCell>
                      </TableRow>
                      {Array.isArray(category.products) &&
                        category.products.map((product: any) => {
                          const total = (product.qty || 0) * (product.price || 0)
                          return (
                            <TableRow key={product._id}>
                              <TableCell className="font-medium pl-12 pr-4">{itemNumber++}</TableCell>
                              <TableCell className="whitespace-normal break-words px-4">{product.name}</TableCell>
                              <TableCell className="text-right px-4">{product.qty}</TableCell>
                              <TableCell className="px-4">{product.unit}</TableCell>
                              <TableCell className="text-right px-4">{formatCurrency(product.price)}</TableCell>
                              <TableCell className="text-right font-medium px-4">{formatCurrency(total)}</TableCell>
                            </TableRow>
                          )
                        })}
                      <TableRow className="bg-muted/20">
                        <TableCell colSpan={5} className="text-right text-sm font-medium pl-12 pr-4 py-2">
                          Subtotal {category.name}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium px-4 py-2">
                          {formatCurrency(categoryTotal || 0)}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  )
                })}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={5} className="text-right font-semibold px-4 py-3">
                    Subtotal Furniture Work
                  </TableCell>
                  <TableCell className="text-right font-semibold px-4 py-3">
                    {formatCurrency(
                      boq.furnitureWork.reduce(
                        (sum: number, cat: any) =>
                          sum +
                          (Array.isArray(cat.products)
                            ? cat.products.reduce((s: number, p: any) => s + (p.qty || 0) * (p.price || 0), 0)
                            : 0),
                        0,
                      ),
                    )}
                  </TableCell>
                </TableRow>
              </>
            )}

            {/* GRAND TOTAL */}
            <TableRow className="bg-primary/20 font-bold">
              <TableCell colSpan={5} className="text-right text-lg px-4 py-4">
                GRAND TOTAL
              </TableCell>
              <TableCell className="text-right text-lg px-4 py-4">{formatCurrency(grandTotal)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bill of Quantity</h2>
          <p className="text-muted-foreground">Manage project BOQs and cost estimates</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add BOQ
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalBudget)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total BOQs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{boqItems.length}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {mainBOQ ? "1 Main" : "0 Main"} + {additionalBOQs.length} Additional
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            {mainBOQ && (
              <Badge variant={mainBOQ.status === "Request" ? "secondary" : "default"}>{mainBOQ.status}</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="main" className="w-full">
        <TabsList>
          <TabsTrigger value="main">Main BOQ</TabsTrigger>
          {additionalBOQs.length > 0 && <TabsTrigger value="additional">Additional BOQs</TabsTrigger>}
        </TabsList>

        <TabsContent value="main" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">Loading BOQ...</p>
              </CardContent>
            </Card>
          ) : !mainBOQ ? (
            <Card>
              <CardContent className="py-8">
                <Alert>
                  <AlertDescription className="text-center">
                    No main BOQ found. Create a main BOQ to start tracking project costs.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Main BOQ (#{mainBOQ.number})</CardTitle>
                    <CardDescription>
                      Status: {mainBOQ.status} • Created: {new Date(mainBOQ.createdAt).toLocaleDateString("id-ID")}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>{renderBOQTable(mainBOQ)}</CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="additional" className="space-y-4">
          {additionalBOQs.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <Alert>
                  <AlertDescription className="text-center">
                    No additional BOQs yet. Click "Add Additional BOQ" to create one.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : (
            additionalBOQs.map((boq) => (
              <Card key={boq._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Additional BOQ #{boq.number}</CardTitle>
                      <CardDescription>
                        Status: {boq.status} • Created: {new Date(boq.createdAt).toLocaleDateString("id-ID")}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>{renderBOQTable(boq)}</CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <CreateBOQDialog
        projectId={projectId}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={loadBOQ}
      />
    </div>
  )
}
