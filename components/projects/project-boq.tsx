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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [editingBOQ, setEditingBOQ] = useState<any>(null)
  const [isCreatingAdditional, setIsCreatingAdditional] = useState(false)
  const [activeTab, setActiveTab] = useState("main")

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
                <TableRow className="bg-primary/20 font-bold">
                  <TableCell colSpan={5} className="text-right text-lg px-4 py-4">
                    GRAND TOTAL
                  </TableCell>
                  <TableCell className="text-right text-lg px-4 py-4">{formatCurrency(grandTotal)}</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  const handleEditBOQ = (boq: any) => {
    setEditingBOQ(boq)
    setShowCreateDialog(true)
  }

  const handleDialogClose = (open: boolean) => {
    setShowCreateDialog(open)
    if (!open) {
      setEditingBOQ(null)
      setIsCreatingAdditional(false)
    }
  }

  const handleCreateAdditionalBOQ = () => {
    setIsCreatingAdditional(true)
    setShowCreateDialog(true)
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === "approved") {
      return <Badge className="bg-green-500 text-white hover:bg-green-600">Approved</Badge>
    } else if (statusLower === "rejected") {
      return <Badge className="bg-red-500 text-white hover:bg-red-600">Rejected</Badge>
    } else if (statusLower === "request") {
      return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Request</Badge>
    } else if (statusLower === "revision") {
      return <Badge className="bg-blue-500 text-white hover:bg-blue-600">Revision</Badge>
    }
    return <Badge variant="secondary">{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Bill of Quantity</h2>
          <p className="text-muted-foreground">Manage project BOQs and cost estimates</p>
        </div>
        {!mainBOQ ? (
          <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Main BOQ
          </Button>
        ) : (
          <Button onClick={handleCreateAdditionalBOQ} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Additional BOQ
          </Button>
        )}
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
            <CardTitle className="text-sm font-medium">Main BOQ Status</CardTitle>
          </CardHeader>
          <CardContent>
            {mainBOQ ? (
              getStatusBadge(mainBOQ.status)
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Not Created
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile: Dropdown */}
        <div className="block md:hidden mb-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select BOQ type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main">Main BOQ {mainBOQ && `(${mainBOQ.status})`}</SelectItem>
              <SelectItem value="additional">Additional BOQs ({additionalBOQs.length})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: Tabs */}
        <TabsList className="hidden md:flex">
          <TabsTrigger value="main" className="flex items-center gap-2">
            Main BOQ
            {mainBOQ && <span className="text-xs opacity-70">({mainBOQ.status})</span>}
          </TabsTrigger>
          <TabsTrigger value="additional" className="flex items-center gap-2">
            Additional BOQs
            {additionalBOQs.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 flex items-center justify-center px-1">
                {additionalBOQs.length}
              </Badge>
            )}
          </TabsTrigger>
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
                    No main BOQ found. Click "Add Main BOQ" to create the main BOQ for this project.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <CardTitle>Main BOQ</CardTitle>
                      {getStatusBadge(mainBOQ.status)}
                    </div>
                    <CardDescription>
                      BOQ #{mainBOQ.number} • Created: {new Date(mainBOQ.createdAt).toLocaleDateString("id-ID")}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditBOQ(mainBOQ)}
                    className="w-full sm:w-auto"
                  >
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <CardTitle>Additional BOQ #{boq.number}</CardTitle>
                        {getStatusBadge(boq.status)}
                      </div>
                      <CardDescription>Created: {new Date(boq.createdAt).toLocaleDateString("id-ID")}</CardDescription>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditBOQ(boq)}
                        className="flex-1 sm:flex-none"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none bg-transparent">
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
        onOpenChange={handleDialogClose}
        onSuccess={loadBOQ}
        boq={editingBOQ}
        isAdditional={isCreatingAdditional}
      />
    </div>
  )
}
