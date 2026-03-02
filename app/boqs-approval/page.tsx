"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { boqApi } from "@/lib/api/boq"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, Building2, XCircle } from "lucide-react"
import React from "react"

function BOQApprovalContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [boqData, setBoqData] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null)
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const verifyAndFetchBOQ = async () => {
      if (!token) {
        setError("Token tidak ditemukan. Silakan gunakan link yang valid.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await boqApi.verifyToken(token)

        if (response.success && response.data?.data) {
          setBoqData(response.data.data)
          setError(null)
        } else {
          setError("Token tidak valid atau sudah kadaluarsa.")
        }
      } catch (err: any) {
        console.error("Error verifying token:", err)
        setError("Gagal memverifikasi token. Silakan coba lagi.")
      } finally {
        setLoading(false)
      }
    }

    verifyAndFetchBOQ()
  }, [token])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleBOQAction = async (action: "approve" | "reject") => {
    if (!boqData?.boq?._id || !boqData?.boq?.project?._id || !boqData?.email || !boqData?.code) {
      setActionMessage({
        type: "error",
        text: "Data approval tidak lengkap. Silakan refresh halaman dan coba lagi.",
      })
      return
    }

    try {
      setActionLoading(action)
      setActionMessage(null)

      if (action === "approve") {
        await boqApi.accept(boqData.boq.project._id, boqData.boq._id, boqData.email, boqData.code)
      } else {
        await boqApi.reject(boqData.boq.project._id, boqData.boq._id, boqData.email, boqData.code)
      }

      const verifyResponse = await boqApi.verifyToken(token as string)
      if (verifyResponse.success && verifyResponse.data?.data) {
        setBoqData(verifyResponse.data.data)
      }

      setActionMessage({
        type: "success",
        text: action === "approve" ? "BOQ berhasil di-approve." : "BOQ berhasil di-reject.",
      })
    } catch (err) {
      setActionMessage({
        type: "error",
        text: action === "approve" ? "Gagal approve BOQ." : "Gagal reject BOQ.",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const renderBOQTable = (boq: any) => {
    let itemNumber = 1
    let grandTotal = 0

    return (
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
            {/* PRELIMINARY SECTION */}
            {Array.isArray(boq.preliminary) && boq.preliminary.length > 0 && (
              <>
                <TableRow className="bg-primary/10">
                  <TableCell colSpan={8} className="font-bold text-primary uppercase px-4 py-3">
                    PRELIMINARY
                  </TableCell>
                </TableRow>
                {boq.preliminary.map((item: any) => {
                  const total = (item.qty || 0) * (item.price || 0)
                  grandTotal += total
                  return (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium pl-8 pr-4">{itemNumber++}</TableCell>
                      <TableCell className="whitespace-normal wrap-break-word px-4">{item.name}</TableCell>
                      <TableCell className="px-4">{item.brand || "-"}</TableCell>
                      <TableCell className="px-4">{item.location || "-"}</TableCell>
                      <TableCell className="text-right px-4">{item.qty}</TableCell>
                      <TableCell className="px-4">{item.unit}</TableCell>
                      <TableCell className="text-right px-4">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right font-medium px-4">{formatCurrency(total)}</TableCell>
                    </TableRow>
                  )
                })}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={7} className="text-right font-semibold px-4 py-3">
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
                  <TableCell colSpan={8} className="font-bold text-primary uppercase px-4 py-3">
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
                        <TableCell colSpan={8} className="font-semibold pl-8 pr-4 py-2">
                          {category.name}
                        </TableCell>
                      </TableRow>
                      {Array.isArray(category.products) &&
                        category.products.map((product: any) => {
                          const total = (product.qty || 0) * (product.price || 0)
                          return (
                            <TableRow key={product._id}>
                              <TableCell className="font-medium pl-12 pr-4">{itemNumber++}</TableCell>
                              <TableCell className="whitespace-normal wrap-break-word px-4">{product.name}</TableCell>
                              <TableCell className="px-4">{product.brand || "-"}</TableCell>
                              <TableCell className="px-4">{product.location || "-"}</TableCell>
                              <TableCell className="text-right px-4">{product.qty}</TableCell>
                              <TableCell className="px-4">{product.unit}</TableCell>
                              <TableCell className="text-right px-4">{formatCurrency(product.price)}</TableCell>
                              <TableCell className="text-right font-medium px-4">{formatCurrency(total)}</TableCell>
                            </TableRow>
                          )
                        })}
                      <TableRow className="bg-muted/20">
                        <TableCell colSpan={7} className="text-right text-sm font-medium pl-12 pr-4 py-2">
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
                  <TableCell colSpan={7} className="text-right font-semibold px-4 py-3">
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
                  <TableCell colSpan={8} className="font-bold text-primary uppercase px-4 py-3">
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
                        <TableCell colSpan={8} className="font-semibold pl-8 pr-4 py-2">
                          {category.name}
                        </TableCell>
                      </TableRow>
                      {Array.isArray(category.products) &&
                        category.products.map((product: any) => {
                          const total = (product.qty || 0) * (product.price || 0)
                          return (
                            <TableRow key={product._id}>
                              <TableCell className="font-medium pl-12 pr-4">{itemNumber++}</TableCell>
                              <TableCell className="whitespace-normal wrap-break-word px-4">{product.name}</TableCell>
                              <TableCell className="px-4">{product.brand || "-"}</TableCell>
                              <TableCell className="px-4">{product.location || "-"}</TableCell>
                              <TableCell className="text-right px-4">{product.qty}</TableCell>
                              <TableCell className="px-4">{product.unit}</TableCell>
                              <TableCell className="text-right px-4">{formatCurrency(product.price)}</TableCell>
                              <TableCell className="text-right font-medium px-4">{formatCurrency(total)}</TableCell>
                            </TableRow>
                          )
                        })}
                      <TableRow className="bg-muted/20">
                        <TableCell colSpan={7} className="text-right text-sm font-medium pl-12 pr-4 py-2">
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
                  <TableCell colSpan={7} className="text-right font-semibold px-4 py-3">
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

            {/* MECHANICAL / ELECTRICAL / PLUMBING SECTION */}
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
                  grandTotal += categoryTotal || 0

                  return (
                    <React.Fragment key={category._id}>
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={8} className="font-semibold pl-8 pr-4 py-2">
                          {category.name}
                        </TableCell>
                      </TableRow>
                      {Array.isArray(category.products) &&
                        category.products.map((product: any) => {
                          const total = (product.qty || 0) * (product.price || 0)
                          return (
                            <TableRow key={product._id}>
                              <TableCell className="font-medium pl-12 pr-4">{itemNumber++}</TableCell>
                              <TableCell className="whitespace-normal wrap-break-word px-4">{product.name}</TableCell>
                              <TableCell className="px-4">{product.brand || "-"}</TableCell>
                              <TableCell className="px-4">{product.location || "-"}</TableCell>
                              <TableCell className="text-right px-4">{product.qty}</TableCell>
                              <TableCell className="px-4">{product.unit}</TableCell>
                              <TableCell className="text-right px-4">{formatCurrency(product.price)}</TableCell>
                              <TableCell className="text-right font-medium px-4">{formatCurrency(total)}</TableCell>
                            </TableRow>
                          )
                        })}
                      <TableRow className="bg-muted/20">
                        <TableCell colSpan={7} className="text-right text-sm font-medium pl-12 pr-4 py-2">
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
                  <TableCell colSpan={7} className="text-right font-semibold px-4 py-3">
                    Subtotal Mechanical / Electrical / Plumbing
                  </TableCell>
                  <TableCell className="text-right font-semibold px-4 py-3">
                    {formatCurrency(
                      boq.mechanicalElectrical.reduce(
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
            {(Array.isArray(boq.preliminary) && boq.preliminary.length > 0) ||
            (Array.isArray(boq.fittingOut) && boq.fittingOut.length > 0) ||
            (Array.isArray(boq.furnitureWork) && boq.furnitureWork.length > 0) ||
            (Array.isArray(boq.mechanicalElectrical) && boq.mechanicalElectrical.length > 0) ? (
              <>
                <TableRow className="bg-primary/20 font-bold">
                  <TableCell colSpan={7} className="text-right text-lg px-4 py-4">
                    GRAND TOTAL
                  </TableCell>
                  <TableCell className="text-right text-lg px-4 py-4">{formatCurrency(grandTotal)}</TableCell>
                </TableRow>
              </>
            ) : null}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Memverifikasi token...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!boqData || !boqData.boq) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Data BOQ tidak ditemukan</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const project = boqData.boq.project
  const boq = boqData.boq
  const isRequestStatus = String(boq.status || "").toLowerCase() === "request"

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Bill of Quantity</h1>
              <p className="text-muted-foreground">Approval Request</p>
            </div>
          </div>
          
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Token berhasil diverifikasi. Email: <strong>{boqData.email}</strong>
            </AlertDescription>
          </Alert>

          {actionMessage && (
            <Alert
              className={`mt-4 ${
                actionMessage.type === "success"
                  ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
              }`}
              variant={actionMessage.type === "error" ? "destructive" : "default"}
            >
              <AlertDescription>{actionMessage.text}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Project Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informasi Proyek</CardTitle>
            <CardDescription>Detail informasi proyek terkait</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nama Proyek</p>
                  <p className="text-lg font-semibold">{project.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipe Proyek</p>
                  <Badge variant="outline" className="mt-1">
                    {project.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Klien</p>
                  <p className="text-base font-medium">{project.companyClient?.name || "-"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gedung</p>
                  <p className="text-base font-medium">{project.building}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lantai</p>
                  <p className="text-base font-medium">{project.floor}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Luas Area</p>
                  <p className="text-base font-medium">{project.area} m²</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BOQ Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Status BOQ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status Saat Ini</p>
                <Badge
                  className={
                    boq.status === "Approved"
                      ? "bg-green-500 hover:bg-green-600"
                      : boq.status === "Rejected"
                      ? "bg-red-500 hover:bg-red-600"
                      : boq.status === "Request"
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : "bg-blue-500 hover:bg-blue-600"
                  }
                >
                  {boq.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nomor BOQ</p>
                <p className="text-base font-semibold">BOQ #{boq.number}</p>
              </div>

              {isRequestStatus && (
                <div className="flex gap-2">
                  <Button onClick={() => handleBOQAction("approve")} disabled={actionLoading !== null}>
                    {actionLoading === "approve" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Approve BOQ
                  </Button>
                  <Button variant="destructive" onClick={() => handleBOQAction("reject")} disabled={actionLoading !== null}>
                    {actionLoading === "reject" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Reject BOQ
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* BOQ Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Bill of Quantity</CardTitle>
            <CardDescription>Rincian lengkap item dan biaya proyek</CardDescription>
          </CardHeader>
          <CardContent>{renderBOQTable(boq)}</CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function BOQApprovalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Memverifikasi token...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <BOQApprovalContent />
    </Suspense>
  )
}
