"use client"

import React from "react"

import { useState, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, FileText, Edit, Upload, Download, Eye, Trash2 } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { terminApi } from "@/lib/api/termin"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateTerminDialog } from "./create-termin-dialog"
import { Input } from "@/components/ui/input"
import { uploadProjectFile, deleteProjectFiles } from "@/lib/api/files"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
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

interface ProjectInvoiceProps {
  projectId: string
  project?: any
  onUpdate?: () => void
}

export function ProjectInvoice({ projectId, project, onUpdate }: ProjectInvoiceProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [termins, setTermins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("contract")
  const [showCreateTermin, setShowCreateTermin] = useState(false)
  const [terminMode, setTerminMode] = useState<"create" | "update">("create")
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<number[]>([])
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ indexes: number[] } | null>(null)
  const [terminUploadLoading, setTerminUploadLoading] = useState<Record<string, { invoice?: boolean; tax?: boolean; slip?: boolean; bast?: boolean }>>({})
  const [terminTaxDeleting, setTerminTaxDeleting] = useState<Record<string, boolean>>({})
  const [taxDeleteConfirm, setTaxDeleteConfirm] = useState<{ terminId: string; taxIndex: number; taxName: string } | null>(null)
  const [statusConfirm, setStatusConfirm] = useState<{ terminId: string; terminName: string; nextStatus: "Pending" | "Paid" } | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const { toast } = useToast()

  const contractFiles = project?.detail?.contract || []

  useEffect(() => {
    loadTermins()
  }, [projectId])

  useEffect(() => {
    const tabFromQuery = searchParams.get("tab")
    const subTabFromQuery = searchParams.get("subtab")

    if (tabFromQuery !== "invoice") return

    if (subTabFromQuery && tabs.some((tab) => tab.value === subTabFromQuery) && subTabFromQuery !== activeTab) {
      setActiveTab(subTabFromQuery)
    }
  }, [searchParams, activeTab])

  const handleSubTabChange = (nextSubTab: string) => {
    setActiveTab(nextSubTab)

    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "invoice")
    params.set("subtab", nextSubTab)

    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  const handleTerminFileUpload = async (terminId: string, file: File, type: "invoice" | "tax" | "slip" | "bast") => {
    if (!file) return

    const currentTermin = termins.find((item) => item._id === terminId)
    const isInvoiceReplace = type === "invoice" && !!currentTermin?.invoice?.url
    const isSlipReplace = type === "slip" && !!currentTermin?.slip?.url
    const isBastReplace = type === "bast" && !!(currentTermin as any)?.bastDocument?.url

    if (file.type !== "application/pdf") {
      toast({
        title: "Upload Failed",
        description: "Only PDF files are allowed",
        variant: "destructive",
      })
      return
    }

    setTerminUploadLoading((prev) => ({
      ...prev,
      [terminId]: {
        ...prev[terminId],
        [type]: true,
      },
    }))

    try {
      if (type === "invoice") {
        await terminApi.uploadInvoicePdf(projectId, terminId, file)
      } else if (type === "slip") {
        await terminApi.uploadSlip(projectId, terminId, file)
      } else if (type === "bast") {
        await terminApi.uploadBastDocument(projectId, terminId, file)
      } else {
        await terminApi.uploadTaxPdf(projectId, terminId, file)
      }

      toast({
        title: "Success",
        description:
          type === "invoice"
            ? isInvoiceReplace
              ? "Invoice PDF replaced successfully"
              : "Invoice PDF uploaded successfully"
            : type === "tax"
              ? "Tax PDF uploaded successfully"
              : type === "bast"
                ? isBastReplace
                  ? "BAST document replaced successfully"
                  : "BAST document uploaded successfully"
                : isSlipReplace
                  ? "Pay slip replaced successfully"
                  : "Pay slip uploaded successfully",
      })

      await loadTermins()
      onUpdate?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload file"
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setTerminUploadLoading((prev) => ({
        ...prev,
        [terminId]: {
          ...prev[terminId],
          [type]: false,
        },
      }))
    }
  }

  const handleTerminPdfChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    terminId: string,
    type: "invoice" | "tax" | "slip" | "bast",
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      handleTerminFileUpload(terminId, file, type)
    }
    e.target.value = ""
  }

  const handleDeleteTaxFile = async (terminId: string, taxIndex: number) => {
    const key = `${terminId}-${taxIndex}`
    setTerminTaxDeleting((prev) => ({ ...prev, [key]: true }))

    try {
      await terminApi.deleteTaxByIndexes(projectId, terminId, [taxIndex])

      toast({
        title: "Success",
        description: "Tax file deleted successfully",
      })

      await loadTermins()
      onUpdate?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete tax file"
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setTerminTaxDeleting((prev) => ({ ...prev, [key]: false }))
    }
  }

  const confirmDeleteTaxFile = async () => {
    if (!taxDeleteConfirm) return
    await handleDeleteTaxFile(taxDeleteConfirm.terminId, taxDeleteConfirm.taxIndex)
    setTaxDeleteConfirm(null)
  }

  const getStatusBadgeVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    if (status === "Sent") return "default"
    if (status === "Pending") return "outline"
    if (status === "Draft") return "secondary"
    if (status === "Rejected") return "destructive"
    return "secondary"
  }

  const confirmUpdateStatus = async () => {
    if (!statusConfirm) return

    setStatusUpdating(true)
    try {
      if (statusConfirm.nextStatus === "Pending") {
        await terminApi.setPending(projectId, statusConfirm.terminId)
      } else {
        await terminApi.setSent(projectId, statusConfirm.terminId)
      }

      toast({
        title: "Success",
        description: `Status updated to ${statusConfirm.nextStatus}`,
      })

      await loadTermins()
      onUpdate?.()
      setStatusConfirm(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update status"
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setStatusUpdating(false)
    }
  }

  const loadTermins = async () => {
    try {
      const response = await terminApi.getByProject(projectId)

      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          setTermins(response.data)
        } else {
          console.error("[v0] Termin data is not an array:", response.data)
          setTermins([])
        }
      }
    } catch (error) {
      console.log("[v0] No termins found or error loading termins:", error)
      setTermins([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenTerminDialog = () => {
    if (termins.length > 0) {
      setTerminMode("update")
    } else {
      setTerminMode("create")
    }
    setShowCreateTermin(true)
  }

  const getFileUrl = (provider: string, url: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.gema-interior.com"
    return `${baseUrl}/public/${provider}/${url}`
  }

  const handleDownload = (provider: string, url: string, filename: string) => {
    const fileUrl = getFileUrl(provider, url)
    window.open(fileUrl, "_blank")
  }

  const handleView = (provider: string, url: string, filename?: string) => {
    const fileUrl = getFileUrl(provider, url)
    setPreviewUrl(fileUrl)
    setPreviewOpen(true)
  }

  const handleFileUpload = async (file: File, type: string) => {
    if (!file) return

    setUploading(true)
    try {
      await uploadProjectFile(projectId, file, type)

      toast({
        title: "Success",
        description: "File uploaded successfully",
      })

      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      let errorMessage = "Failed to upload file"
      if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file, type)
    }
    e.target.value = ""
  }

  const getUserName = (createdBy: any) => {
    if (!createdBy) return "Unknown"
    if (typeof createdBy === "string") return createdBy
    if (createdBy.profile?.name) return createdBy.profile.name
    if (createdBy.email) return createdBy.email
    return "Unknown"
  }

  const handleFileSelect = (index: number, checked: boolean) => {
    setSelectedFiles((prev) => {
      if (checked) {
        return [...prev, index]
      }
      return prev.filter((i) => i !== index)
    })
  }

  const handleSelectAll = (fileCount: number, checked: boolean) => {
    if (checked) {
      setSelectedFiles(Array.from({ length: fileCount }, (_, i) => i))
    } else {
      setSelectedFiles([])
    }
  }

  const handleDeleteSingle = (index: number) => {
    setDeleteConfirm({ indexes: [index] })
  }

  const handleBulkDelete = () => {
    if (selectedFiles.length > 0) {
      setDeleteConfirm({ indexes: selectedFiles })
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return

    setDeleting(true)
    try {
      await deleteProjectFiles(projectId, "contract", deleteConfirm.indexes)

      toast({
        title: "Success",
        description: `${deleteConfirm.indexes.length} file(s) deleted successfully`,
      })

      setSelectedFiles([])

      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      let errorMessage = "Failed to delete file(s)"
      if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteConfirm(null)
    }
  }

  return (
    <div className="space-y-6">
      <CreateTerminDialog
        open={showCreateTermin}
        onOpenChange={setShowCreateTermin}
        projectId={projectId}
        onSuccess={loadTermins}
        existingTermins={termins}
        mode={terminMode}
      />

      <Tabs value={activeTab} onValueChange={handleSubTabChange} className="space-y-6">
        {/* Mobile: Dropdown */}
        <div className="block md:hidden">
          <Select value={activeTab} onValueChange={handleSubTabChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: Tabs */}
        <TabsList className="hidden md:grid w-full grid-cols-2">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="termin">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Terms (Termin)</CardTitle>
                  <CardDescription>Project payment schedule and milestones</CardDescription>
                </div>
                <Button onClick={handleOpenTerminDialog}>
                  {termins.length > 0 ? (
                    <Edit className="h-4 w-4 mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {termins.length > 0 ? "Update Terms" : "Create Terms"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading termins...</p>
              ) : termins.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No payment terms defined yet</p>
                  <Button onClick={handleOpenTerminDialog} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Payment Terms
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {termins.map((termin, index) => (
                    <div
                      key={termin._id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{termin.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {termin.value}
                                {termin.valueType === "%" ? "%" : " IDR"} • Category: {termin.category}
                              </p>
                              {termin.note && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Note: {termin.note}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={getStatusBadgeVariant(termin.status)}>
                              {termin.status === "Sent" ? "Paid" : termin.status || "Draft"}
                            </Badge>
                            <div className="flex items-center gap-2">
                              {termin.status === "Draft" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setStatusConfirm({
                                      terminId: termin._id,
                                      terminName: termin.name || "Termin",
                                      nextStatus: "Pending",
                                    })
                                  }
                                >
                                  Set As "Draft Invoice Created, Pending Approval"
                                </Button>
                              )}
                              {termin.status === "Pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setStatusConfirm({
                                      terminId: termin._id,
                                      terminName: termin.name || "Termin",
                                      nextStatus: "Paid",
                                    })
                                  }
                                >
                                  Set As "Invoice Sent, Pending Payment"
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={`grid grid-cols-1 ${termin.category === "BAPP" || termin.category === "BAST" ? "md:grid-cols-4" : "md:grid-cols-3"} gap-3`}>
                        <div className="rounded-md border bg-background p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-muted-foreground">Invoice</p>
                            <Input
                              id={`termin-invoice-upload-${termin._id}`}
                              type="file"
                              accept=".pdf,application/pdf"
                              className="hidden"
                              onChange={(e) => handleTerminPdfChange(e, termin._id, "invoice")}
                              disabled={
                                !!terminUploadLoading[termin._id]?.invoice ||
                                !!terminUploadLoading[termin._id]?.tax ||
                                !!terminUploadLoading[termin._id]?.slip
                              }
                            />
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              disabled={
                                !!terminUploadLoading[termin._id]?.invoice ||
                                !!terminUploadLoading[termin._id]?.tax ||
                                !!terminUploadLoading[termin._id]?.slip
                              }
                            >
                              <label htmlFor={`termin-invoice-upload-${termin._id}`} className="cursor-pointer">
                                <Upload className="h-4 w-4 mr-2" />
                                {terminUploadLoading[termin._id]?.invoice
                                  ? "Uploading..."
                                  : termin.invoice?.url
                                    ? "Replace"
                                    : "Upload"}
                              </label>
                            </Button>
                          </div>
                          {termin.invoice?.url ? (
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="truncate text-muted-foreground">{termin.invoice.name}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleView(termin.invoice.provider, termin.invoice.url, termin.invoice.name)}
                                  title="Preview invoice"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDownload(termin.invoice.provider, termin.invoice.url, termin.invoice.name)}
                                  title="Download invoice"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No invoice uploaded</p>
                          )}
                        </div>

                        <div className="rounded-md border bg-background p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-muted-foreground">Tax Files</p>
                            <Input
                              id={`termin-tax-upload-${termin._id}`}
                              type="file"
                              accept=".pdf,application/pdf"
                              className="hidden"
                              onChange={(e) => handleTerminPdfChange(e, termin._id, "tax")}
                              disabled={
                                !!terminUploadLoading[termin._id]?.invoice ||
                                !!terminUploadLoading[termin._id]?.tax ||
                                !!terminUploadLoading[termin._id]?.slip
                              }
                            />
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              disabled={
                                !!terminUploadLoading[termin._id]?.invoice ||
                                !!terminUploadLoading[termin._id]?.tax ||
                                !!terminUploadLoading[termin._id]?.slip
                              }
                            >
                              <label htmlFor={`termin-tax-upload-${termin._id}`} className="cursor-pointer">
                                <Upload className="h-4 w-4 mr-2" />
                                {terminUploadLoading[termin._id]?.tax ? "Uploading..." : "Upload"}
                              </label>
                            </Button>
                          </div>

                          {termin.taxes && termin.taxes.length > 0 ? (
                            <div className="space-y-1">
                              {termin.taxes.map((tax: any, taxIndex: number) => (
                                <div key={tax._id} className="flex items-center justify-between gap-2 text-xs">
                                  <span className="truncate text-muted-foreground">{tax.name}</span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleView(tax.provider, tax.url, tax.name)}
                                      title={`Preview ${tax.name}`}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDownload(tax.provider, tax.url, tax.name)}
                                      title={`Download ${tax.name}`}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        setTaxDeleteConfirm({
                                          terminId: termin._id,
                                          taxIndex,
                                          taxName: tax.name || "tax file",
                                        })
                                      }
                                      title={`Delete ${tax.name}`}
                                      disabled={terminTaxDeleting[`${termin._id}-${taxIndex}`]}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No tax files uploaded</p>
                          )}
                        </div>

                        <div className="rounded-md border bg-background p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-muted-foreground">Pay Slip</p>
                            <Input
                              id={`termin-slip-upload-${termin._id}`}
                              type="file"
                              accept=".pdf,application/pdf"
                              className="hidden"
                              onChange={(e) => handleTerminPdfChange(e, termin._id, "slip")}
                              disabled={
                                !!terminUploadLoading[termin._id]?.invoice ||
                                !!terminUploadLoading[termin._id]?.tax ||
                                !!terminUploadLoading[termin._id]?.slip
                              }
                            />
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              disabled={
                                !!terminUploadLoading[termin._id]?.invoice ||
                                !!terminUploadLoading[termin._id]?.tax ||
                                !!terminUploadLoading[termin._id]?.slip
                              }
                            >
                              <label htmlFor={`termin-slip-upload-${termin._id}`} className="cursor-pointer">
                                <Upload className="h-4 w-4 mr-2" />
                                {terminUploadLoading[termin._id]?.slip
                                  ? "Uploading..."
                                  : termin.slip?.url
                                    ? "Replace"
                                    : "Upload"}
                              </label>
                            </Button>
                          </div>

                          {termin.slip?.url ? (
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="truncate text-muted-foreground">{termin.slip.name}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleView(termin.slip.provider, termin.slip.url, termin.slip.name)}
                                  title="Preview pay slip"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDownload(termin.slip.provider, termin.slip.url, termin.slip.name)}
                                  title="Download pay slip"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No pay slip uploaded</p>
                          )}
                        </div>

                        {(termin.category === "BAPP" || termin.category === "BAST") && (
                          <div className="rounded-md border bg-background p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-muted-foreground">BAPP/BAST Doc</p>
                              <Input
                                id={`termin-bast-upload-${termin._id}`}
                                type="file"
                                accept=".pdf,application/pdf"
                                className="hidden"
                                onChange={(e) => handleTerminPdfChange(e, termin._id, "bast")}
                                disabled={!!terminUploadLoading[termin._id]?.bast}
                              />
                              {/* <Button
                                asChild
                                variant="outline"
                                size="sm"
                                disabled={!!terminUploadLoading[termin._id]?.bast}
                              >
                                <label htmlFor={`termin-bast-upload-${termin._id}`} className="cursor-pointer">
                                  <Upload className="h-4 w-4 mr-2" />
                                  {terminUploadLoading[termin._id]?.bast
                                    ? "Uploading..."
                                    : (termin as any).bastDocument?.url
                                      ? "Replace"
                                      : "Upload"}
                                </label>
                              </Button> */}
                            </div>
                            {(termin as any).bastDocument?.url ? (
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="truncate text-muted-foreground">{(termin as any).bastDocument.name}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleView((termin as any).bastDocument.provider, (termin as any).bastDocument.url, (termin as any).bastDocument.name)}
                                    title="Preview BAST document"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDownload((termin as any).bastDocument.provider, (termin as any).bastDocument.url, (termin as any).bastDocument.name)}
                                    title="Download BAST document"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">No document uploaded by Project Manager</p>
                            )}
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contract">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contract Files</CardTitle>
                  <CardDescription>Upload and manage contract documents</CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedFiles.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete ({selectedFiles.length})
                    </Button>
                  )}
                  <Input
                    id="contract-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => onFileChange(e, "contract")}
                    disabled={uploading}
                  />
                  <Button asChild disabled={uploading}>
                    <label htmlFor="contract-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Contract"}
                    </label>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {contractFiles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No contract files uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contractFiles.length > 1 && (
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Checkbox
                        checked={selectedFiles.length === contractFiles.length && contractFiles.length > 0}
                        onCheckedChange={(checked) =>
                          handleSelectAll(contractFiles.length, checked as boolean)
                        }
                      />
                      <span className="text-sm text-muted-foreground">Select All</span>
                    </div>
                  )}
                  {contractFiles.map((contract: any, index: number) => (
                    <div
                      key={contract._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedFiles.includes(index)}
                          onCheckedChange={(checked) => handleFileSelect(index, checked as boolean)}
                        />
                        <FileText className="h-8 w-8 text-green-500" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{contract.name}</p>
                            <Badge variant="default">v{contract.version || 1}.0</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Uploaded by {getUserName(contract.createdBy)} •{" "}
                            {contract.createdAt
                              ? new Date(contract.createdAt).toLocaleString("en-US", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(contract.provider, contract.url, contract.name)}
                          title="View file"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(contract.provider, contract.url, contract.name)}
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSingle(index)}
                          title="Delete file"
                          disabled={deleting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader className="h-auto">
            <DialogTitle>File Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="flex-1 min-h-0">
              <iframe src={previewUrl} className="w-full h-full" title="File preview" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteConfirm?.indexes.length || 0} file(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={deleting} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!taxDeleteConfirm} onOpenChange={() => setTaxDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tax file?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{taxDeleteConfirm?.taxName}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={
                !!taxDeleteConfirm &&
                !!terminTaxDeleting[`${taxDeleteConfirm.terminId}-${taxDeleteConfirm.taxIndex}`]
              }
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTaxFile}
              disabled={
                !!taxDeleteConfirm &&
                !!terminTaxDeleting[`${taxDeleteConfirm.terminId}-${taxDeleteConfirm.taxIndex}`]
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {taxDeleteConfirm && terminTaxDeleting[`${taxDeleteConfirm.terminId}-${taxDeleteConfirm.taxIndex}`]
                ? "Deleting..."
                : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!statusConfirm} onOpenChange={() => setStatusConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update termin status?</AlertDialogTitle>
            <AlertDialogDescription>
              Change status of "{statusConfirm?.terminName}" to "{statusConfirm?.nextStatus}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUpdateStatus}
              disabled={statusUpdating}
            >
              {statusUpdating ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

const tabs = [
  { value: "contract", label: "Contract Files" },
  { value: "termin", label: "Termin" },
]
