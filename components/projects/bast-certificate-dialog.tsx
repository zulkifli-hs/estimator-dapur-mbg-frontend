"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Download, Eye, Loader2, Upload, X, ImageIcon, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { terminApi } from "@/lib/api/termin"

interface BastCertificateData {
  title: string
  subtitle: string
  bodyText: string
  contractorName: string
  clientName: string
  dayDate: string
  projectLocation: string
  preparedByName: string
  preparedByRole: string
  acceptanceByName: string
  acceptanceByRole: string
  headerLines: string[]
}

interface BastCertificateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  termin: any
  project: any
  projectId: string
  onSaved?: () => void
}

function formatDayDate(date: Date): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]
  const day = days[date.getDay()]
  const d = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const suffix = d === 1 || d === 21 || d === 31 ? "st" : d === 2 || d === 22 ? "nd" : d === 3 || d === 23 ? "rd" : "th"
  return `${day}, ${month} ${d}${suffix} ${year}`
}

function buildInitialData(termin: any, project: any): BastCertificateData {
  const contractorName = project?.companyOwner?.name || "PT. Gema Intermulia Sejahtera"
  const clientName = project?.companyClient?.name || ""
  const projectName = project?.name || ""
  const building = project?.building || ""

  // Subtitle: termin name + value
  const valueLabel =
    termin?.valueType === "%"
      ? `${termin.value}%`
      : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
        termin?.value || 0,
      )
  const subtitle = `Progress ${termin?.name || ""} ${valueLabel}`

  const bodyText = `We are delighted to inform you that fit out progress for ${clientName} office interior, as part of the project ${projectName}, has been successfully completed as per the contractual agreement between the following parties:`

  // Get first project manager name if available
  const pmName =
    project?.projectManagers?.[0]?.user?.profile?.name || ""

  return {
    title: "CERTIFICATION OF COMPLETION",
    subtitle,
    bodyText,
    contractorName,
    clientName,
    dayDate: formatDayDate(new Date()),
    projectLocation: building,
    preparedByName: pmName,
    preparedByRole: "Project Manager",
    acceptanceByName: "",
    acceptanceByRole: "",
    headerLines: [
      "PT GEMA INTERMULIA SEJAHTERA",
      "Jl. Bendungan Hilir Raya No. 76",
      "Jakarta, Indonesia. 10220",
      "P: (021) 5737270, 5737201",
      "E: gis@gemaintermulia.co.id",
      "www.gemaintermulia.co.id",
    ],
  }
}

async function loadDefaultLogo(): Promise<string | null> {
  try {
    const res = await fetch("/images/header-logo.png")
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

async function generateCertificatePdf(data: BastCertificateData, logoDataUrl: string | null): Promise<any> {
  const { default: jsPDF } = await import("jspdf")

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2

  let y = margin

  // ── Logo (top-right) ─────────────────────────────────────────────────────
  const logoH = 11
  let logoW = 32 // fallback width
  if (logoDataUrl) {
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
      img.onerror = () => resolve({ w: 96, h: 33 }) // fallback ~3:1 ratio
      img.src = logoDataUrl
    })
    if (dims.h > 0) logoW = logoH * (dims.w / dims.h)
  }
  const logoX = pageWidth - margin - logoW
  if (logoDataUrl) {
    const imgType = logoDataUrl.startsWith("data:image/png")
      ? "PNG"
      : logoDataUrl.startsWith("data:image/webp")
        ? "WEBP"
        : "JPEG"
    try {
      doc.addImage(logoDataUrl, imgType, logoX, y, logoW, logoH)
    } catch {
      // silently skip if image fails
    }
  }

  // ── Header (top-right company info below logo) ───────────────────────────
  const headerStartY = logoDataUrl ? y + logoH + 4 : y
  doc.setFontSize(7)
  const headerRightX = pageWidth - margin
  data.headerLines.forEach((line, i) => {
    if (!line) return
    if (i === 0) {
      doc.setFont("helvetica", "bold")
    } else {
      doc.setFont("helvetica", "normal")
    }
    const w = doc.getTextWidth(line)
    doc.text(line, headerRightX - w, headerStartY + i * 4)
  })

  // ── Title ─────────────────────────────────────────────────────────────────
  y = margin + (logoDataUrl ? logoH + 2 : 0) + data.headerLines.filter(Boolean).length * 4 + 10
  if (y < margin + 35) y = margin + 35
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  const titleW = doc.getTextWidth(data.title)
  doc.text(data.title, (pageWidth - titleW) / 2, y)

  // Underline
  doc.setLineWidth(0.5)
  doc.line((pageWidth - titleW) / 2, y + 1, (pageWidth + titleW) / 2, y + 1)

  // ── Subtitle ──────────────────────────────────────────────────────────────
  y += 7
  doc.setFontSize(11)
  doc.setFont("helvetica", "italic")
  const subW = doc.getTextWidth(data.subtitle)
  doc.text(data.subtitle, (pageWidth - subW) / 2, y)

  // ── Body text ─────────────────────────────────────────────────────────────
  y += 14
  doc.setFontSize(10.5)
  doc.setFont("helvetica", "normal")
  const bodyLines = doc.splitTextToSize(data.bodyText, contentWidth)
  doc.text(bodyLines, margin, y)
  y += bodyLines.length * 5.5 + 8

  // ── Info table ────────────────────────────────────────────────────────────
  const labelX = margin
  const colonX = margin + 42
  const valueX = colonX + 5
  const rowGap = 8

  const infoRows = [
    { label: "Interior Contractors", value: data.contractorName },
    { label: "Client", value: data.clientName },
    { label: "Day / Date", value: data.dayDate },
    { label: "Project location", value: data.projectLocation },
  ]

  infoRows.forEach((row, i) => {
    const rowY = y + i * rowGap
    doc.setFont("helvetica", "normal")
    doc.text(row.label, labelX, rowY)
    doc.text(":", colonX, rowY)

    // Bold value
    doc.setFont("helvetica", "bold")
    const valueLines = doc.splitTextToSize(row.value, contentWidth - (valueX - margin))
    doc.text(valueLines, valueX, rowY)
  })

  y += infoRows.length * rowGap + 10

  // ── Closing sentence ──────────────────────────────────────────────────────
  const closingText =
    "We would like to acknowledge that the successful outcome of this work would not have been possible without your valuable input and collaboration. Thank you for your cooperation, and we remain at your service."
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10.5)
  const closingLines = doc.splitTextToSize(closingText, contentWidth)
  doc.text(closingLines, margin, y)
  y += closingLines.length * 5.5 + 16

  // ── Signature block ───────────────────────────────────────────────────────
  const colWidth = (pageWidth - margin * 2) / 2
  const col1Center = margin + colWidth / 2
  const col2Center = pageWidth - margin - colWidth / 2

  doc.setFontSize(10.5)
  doc.setFont("helvetica", "normal")
  doc.text("Prepared by:", col1Center, y, { align: "center" })
  doc.text("Acceptance by:", col2Center, y, { align: "center" })

  y += 6
  doc.setFont("helvetica", "bold")
  doc.text(data.contractorName, col1Center, y, { align: "center" })
  doc.text(data.clientName, col2Center, y, { align: "center" })

  // Signature space
  y += 22

  // Name + underline
  doc.setFont("helvetica", "bold")
  const lineHalfW = colWidth * 0.38
  doc.setLineWidth(0.3)
  if (data.preparedByName) {
    doc.text(data.preparedByName, col1Center, y, { align: "center" })
    doc.line(col1Center - lineHalfW, y + 1.5, col1Center + lineHalfW, y + 1.5)
  } else {
    doc.line(col1Center - lineHalfW, y + 1.5, col1Center + lineHalfW, y + 1.5)
  }
  if (data.acceptanceByName) {
    doc.text(data.acceptanceByName, col2Center, y, { align: "center" })
    doc.line(col2Center - lineHalfW, y + 1.5, col2Center + lineHalfW, y + 1.5)
  } else {
    doc.line(col2Center - lineHalfW, y + 1.5, col2Center + lineHalfW, y + 1.5)
  }

  y += 6
  doc.setFont("helvetica", "normal")
  if (data.preparedByRole) doc.text(data.preparedByRole, col1Center, y, { align: "center" })
  if (data.acceptanceByRole) doc.text(data.acceptanceByRole, col2Center, y, { align: "center" })

  return doc
}

export function BastCertificateDialog({
  open,
  onOpenChange,
  termin,
  project,
  projectId,
  onSaved,
}: BastCertificateDialogProps) {
  const [formData, setFormData] = useState<BastCertificateData>(() =>
    buildInitialData(termin, project),
  )
  const [generating, setGenerating] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { toast } = useToast()

  // Load default logo on mount
  useEffect(() => {
    loadDefaultLogo().then(setLogoDataUrl)
  }, [])

  // Reset & init form when dialog opens
  useEffect(() => {
    if (!open) return
    // Pre-fill from saved certificateData if available, otherwise use defaults
    const saved = termin?.certificateData
    setFormData(saved && Object.keys(saved).length > 0 ? (saved as BastCertificateData) : buildInitialData(termin, project))
    setPreviewUrl(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Auto-preview with 800ms debounce on any data/logo change
  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setPreviewing(true)
      try {
        const doc = await generateCertificatePdf(formData, logoDataUrl)
        const blob = doc.output("blob")
        const newUrl = URL.createObjectURL(blob)
        // Atomic swap — never set null in between, so iframe stays visible
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return newUrl
        })
      } catch {
        // silently fail for auto-preview
      } finally {
        setPreviewing(false)
      }
    }, 800)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [formData, logoDataUrl, open])

  // Revoke object URL on close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    onOpenChange(open)
  }

  const update = (field: keyof BastCertificateData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  const handleDownload = async () => {
    setGenerating(true)
    try {
      const doc = await generateCertificatePdf(formData, logoDataUrl)
      const fileName = `${termin?.name || "certificate"}_${project?.name || "project"}.pdf`
        .replace(/\s+/g, "_")
        .toLowerCase()
      doc.save(fileName)
      toast({ title: "Success", description: "Certificate PDF downloaded" })
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate PDF", variant: "destructive" })
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!projectId || !termin?._id) return
    setSaving(true)
    try {
      await terminApi.saveCertificateData(projectId, termin._id, formData as Record<string, any>)
      toast({ title: "Saved", description: "Certificate data saved successfully" })
      onSaved?.()
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message || "Failed to save certificate data", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async () => {
    setPreviewing(true)
    try {
      const doc = await generateCertificatePdf(formData, logoDataUrl)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      const blob = doc.output("blob")
      setPreviewUrl(URL.createObjectURL(blob))
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to preview PDF", variant: "destructive" })
    } finally {
      setPreviewing(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setLogoDataUrl(reader.result as string)
    reader.readAsDataURL(file)
    // Reset input so same file can be selected again
    e.target.value = ""
  }

  const updateHeaderText = (text: string) =>
    setFormData((prev) => ({ ...prev, headerLines: text.split("\n") }))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate BAPP/BAST Certificate — {termin?.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* ── Left: Editable Form ─────────────────────────── */}
          <div className="space-y-4">

            {/* Logo upload */}
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-3">
                <div className="w-24 h-10 border rounded flex items-center justify-center bg-muted overflow-hidden shrink-0">
                  {logoDataUrl ? (
                    <img src={logoDataUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Upload
                  </Button>
                  {logoDataUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setLogoDataUrl(null)}
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
            </div>

            {/* Company header lines */}
            <div className="space-y-2">
              <Label>Company Header (right-aligned in PDF)</Label>
              <p className="text-xs text-muted-foreground">Each line = one row in the PDF header. Line 1 will be rendered bold.</p>
              <Textarea
                rows={6}
                value={formData.headerLines.join("\n")}
                onChange={(e) => updateHeaderText(e.target.value)}
                className="font-mono text-sm resize-y"
                placeholder={"PT Company Name\nJl. Address No. 1\nCity, Country 12345\nP: (021) 0000000\nE: email@company.com\nwww.company.com"}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="cert-title">Document Title</Label>
              <Input
                id="cert-title"
                value={formData.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cert-subtitle">Subtitle / Progress Label</Label>
              <Input
                id="cert-subtitle"
                value={formData.subtitle}
                onChange={(e) => update("subtitle", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cert-body">Opening Paragraph</Label>
              <Textarea
                id="cert-body"
                rows={4}
                value={formData.bodyText}
                onChange={(e) => update("bodyText", e.target.value)}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cert-contractor">Interior Contractors</Label>
                <Input
                  id="cert-contractor"
                  value={formData.contractorName}
                  onChange={(e) => update("contractorName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cert-client">Client</Label>
                <Input
                  id="cert-client"
                  value={formData.clientName}
                  onChange={(e) => update("clientName", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cert-date">Day / Date</Label>
              <Input
                id="cert-date"
                value={formData.dayDate}
                onChange={(e) => update("dayDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cert-location">Project Location</Label>
              <Textarea
                id="cert-location"
                rows={2}
                value={formData.projectLocation}
                onChange={(e) => update("projectLocation", e.target.value)}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cert-prep-name">Prepared By (Name)</Label>
                <Input
                  id="cert-prep-name"
                  value={formData.preparedByName}
                  onChange={(e) => update("preparedByName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cert-prep-role">Prepared By (Role)</Label>
                <Input
                  id="cert-prep-role"
                  value={formData.preparedByRole}
                  onChange={(e) => update("preparedByRole", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cert-accept-name">Acceptance By (Name)</Label>
                <Input
                  id="cert-accept-name"
                  value={formData.acceptanceByName}
                  onChange={(e) => update("acceptanceByName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cert-accept-role">Acceptance By (Role)</Label>
                <Input
                  id="cert-accept-role"
                  value={formData.acceptanceByRole}
                  onChange={(e) => update("acceptanceByRole", e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {/* <Button variant="outline" onClick={handlePreview} disabled={previewing || generating || saving} className="flex-1">
                {previewing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                {previewing ? "Generating..." : "Preview PDF"}
              </Button> */}
              <Button variant="outline" onClick={handleSave} disabled={saving || generating || previewing} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={() => {
                  handleSave()
                  handleDownload()
                }} disabled={generating || previewing || saving} className="flex-1">
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                {generating ? "Generating..." : "Download PDF"}
              </Button>
            </div>
          </div>

          {/* ── Right: PDF Preview ──────────────────────────── */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">PDF Preview</p>
              {previewing && previewUrl && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Updating...
                </span>
              )}
            </div>
            <div className="relative flex-1 min-h-125">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full min-h-125 border rounded-lg"
                  title="Certificate Preview"
                />
              ) : (
                <div className="w-full h-full min-h-125 border-2 border-dashed rounded-lg flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Generating preview...</span>
                  </div>
                </div>
              )}
              {/* Overlay spinner while updating — keeps old PDF visible underneath */}
              {previewing && previewUrl && (
                <div className="absolute inset-0 rounded-lg bg-background/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-xs">Updating...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
