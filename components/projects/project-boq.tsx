"use client"

import "@radix-ui/react-id"
import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Eye,
  FileSpreadsheet,
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  Send,
  Maximize2,
} from "lucide-react"
import { boqApi } from "@/lib/api/boq"
import { getAuthToken } from "@/lib/api/config"
import { templatesApi, type CreateTemplateInput } from "@/lib/api/templates"
import { productsApi } from "@/lib/api/products"
import { projectsApi } from "@/lib/api/projects"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreateProductDialog } from "@/components/products/create-product-dialog"
import { FullscreenBoqDialog } from "@/components/projects/boq/fullscreen-boq-dialog"
import { MainBoqActions } from "@/components/projects/boq/main-boq-actions"
import { AdditionalBoqActions } from "@/components/projects/boq/additional-boq-actions"
import { BoqTable } from "@/components/projects/boq/boq-table"
import { BoqRecap } from "@/components/projects/boq/boq-recap"
import { BoqEditForm } from "@/components/projects/boq/boq-edit-form"
import {
  type BOQCategory,
  type ProductItem,
  initFittingOutCategories,
  initMEPCategories,
  mergeFittingOutWithPresets,
  mergeMEPWithPresets,
} from "@/lib/boq-presets"

interface Category extends BOQCategory {}

interface ProjectBOQProps {
  projectId: string
}

interface PreliminaryItem {
  _id?: string
  name: string
  qty: number
  unit: string
  price: number
  productId?: string
  location?: string
  brand?: string
  note?: string
  tags?: string[]
  startDate?: string
  endDate?: string
}

export function ProjectBOQ({ projectId }: ProjectBOQProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [boqItems, setBoqItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBOQ, setEditingBOQ] = useState<any>(null)
  const [isCreatingAdditional, setIsCreatingAdditional] = useState(false)
  const [activeTab, setActiveTab] = useState("main")

  const [creationMode, setCreationMode] = useState<"blank" | "template" | null>(null)
  const [boqType, setBOQType] = useState<"main" | "additional">("main")
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)
  const [openPopovers, setOpenPopovers] = useState<{ [key: string]: boolean }>({})
  const [] = useState<{ [key: string]: string }>({})
  const [createProductDialogOpen, setCreateProductDialogOpen] = useState(false)
  const [pendingProductSelection, setPendingProductSelection] = useState<{
    type: "preliminary" | "fittingOut" | "furnitureWork" | "mechanicalElectrical"
    categoryIndex?: number
    productIndex: number
  } | null>(null)

  const [preliminary, setPreliminary] = useState<PreliminaryItem[]>([])
  const [fittingOut, setFittingOut] = useState<Category[]>([])
  const [furnitureWork, setFurnitureWork] = useState<Category[]>([])
  const [mechanicalElectrical, setMechanicalElectrical] = useState<Category[]>([])

  const preliminaryQtyRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})
  const fittingOutQtyRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const furnitureWorkQtyRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const mechanicalElectricalQtyRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const [, setProducts] = useState<any[]>([])
  const [, setLoadingProducts] = useState(false)
  const [summary, setSummary] = useState({
    totalBudget: 0,
    mainBudget: 0,
    additionalBudget: 0,
    totalSpent: 0,
    progress: 0,
  })

  const [discountTaxState, setDiscountTaxState] = useState<{
    [boqId: string]: {
      discount: string
      discountType: "%" | "0"
      tax: string
      taxType: "%" | "0"
      saving: boolean
    }
  }>({})

  const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [replaceTemplateOpen, setReplaceTemplateOpen] = useState(false)
  const [selectedReplaceTemplate, setSelectedReplaceTemplate] = useState<any>(null)
  const [replaceTemplatePreviewOpen, setReplaceTemplatePreviewOpen] = useState(false)
  const [fullscreenBoqOpen, setFullscreenBoqOpen] = useState(false)
  const [fullscreenBoqTitle, setFullscreenBoqTitle] = useState("")
  const [fullscreenBoqData, setFullscreenBoqData] = useState<any | null>(null)
  const [fullscreenBoqType, setFullscreenBoqType] = useState<"table" | "recap">("table")
  const [templateEditingBOQ, setTemplateEditingBOQ] = useState<any>(null)

  // Track invalid field keys for highlighting (e.g. "preliminary-0-qty")
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set())

  // Track unsaved changes for sticky bottom bar and beforeunload
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Refs that always hold the latest state — used by async handlers to avoid stale closures
  const preliminaryRef = useRef(preliminary)
  const fittingOutRef = useRef(fittingOut)
  const furnitureWorkRef = useRef(furnitureWork)
  const mechanicalElectricalRef = useRef(mechanicalElectrical)
  useEffect(() => { preliminaryRef.current = preliminary }, [preliminary])
  useEffect(() => { fittingOutRef.current = fittingOut }, [fittingOut])
  useEffect(() => { furnitureWorkRef.current = furnitureWork }, [furnitureWork])
  useEffect(() => { mechanicalElectricalRef.current = mechanicalElectrical }, [mechanicalElectrical])

  // Approval request states
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalEmails, setApprovalEmails] = useState<Array<{ email: string; label: string }>>([])
  const [selectedApprovalEmail, setSelectedApprovalEmail] = useState<string>("")
  const [customApprovalEmail, setCustomApprovalEmail] = useState<string>("")
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [, setProjectData] = useState<any>(null)

  // Renamed loadBOQs to fetchBOQ for clarity with the update function below
  const fetchBOQ = async () => {
    try {
      const response = await boqApi.getByProject(projectId)

      if (response.success && response.data) {
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

  // Fetch project data to get approval emails
  const fetchProject = async () => {
    try {
      const response = await projectsApi.getById(projectId)
      if (response.success && response.data) {
        setProjectData(response.data)
        const emails: Array<{ email: string; label: string }> = []
        if (response.data.companyClient?.contact?.email) {
          emails.push({
            email: response.data.companyClient.contact.email,
            label: "Company Email",
          })
        }
        // Note: picEmail may not exist on all company types
        if ((response.data.companyClient as any)?.picEmail) {
          emails.push({
            email: (response.data.companyClient as any).picEmail,
            label: "PIC Email",
          })
        }
        const uniqueEmails = emails.filter(
          (item, index, self) => index === self.findIndex((current) => current.email === item.email),
        )
        setApprovalEmails(uniqueEmails)
      }
    } catch (error) {
      console.error("Failed to fetch project:", error)
    }
  }

  useEffect(() => {
    if (editingBOQ) {
      console.log("[v0] Setting form data for editing BOQ:", editingBOQ)
      setPreliminary(editingBOQ.preliminary || [])
      // Merge backend data with presets for FO and MEP
      setFittingOut(mergeFittingOutWithPresets(editingBOQ.fittingOut || []))
      setFurnitureWork(
        (editingBOQ.furnitureWork || []).map((category: any) => ({
          ...category,
          isPreset: false,
          products:
            category.products?.map((product: any) => ({
              ...product,
              startDate: product.startDate ? new Date(product.startDate).toISOString().split("T")[0] : "",
              endDate: product.endDate ? new Date(product.endDate).toISOString().split("T")[0] : "",
            })) || [],
        })),
      )
      setMechanicalElectrical(mergeMEPWithPresets(editingBOQ.mechanicalElectrical || []))
      setHasUnsavedChanges(false)
    } else if (creationMode === "blank" && !editingBOQ) {
      console.log("[v0] Resetting form for new BOQ")
      setPreliminary([])
      setFittingOut(initFittingOutCategories())
      setFurnitureWork([])
      setMechanicalElectrical(initMEPCategories())
      setHasUnsavedChanges(false)
    }
  }, [editingBOQ, creationMode])

  const fetchTemplates = async () => {
    try {
      const response = await templatesApi.getAll()
      if (response.success && response.data) {
        setTemplates(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const response = await productsApi.getAll()
      if (response && response.list) {
        setProducts(response.list)
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => {
    fetchBOQ()
    fetchTemplates()
    fetchProducts()
    fetchProject()
  }, [projectId])

  // Warn user before leaving with unsaved BOQ changes
  useEffect(() => {
    if (!hasUnsavedChanges) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  const calculateBOQBudget = (boq: any): number => {
    let budget = 0

    // Calculate from preliminary items
    if (Array.isArray(boq.preliminary)) {
      boq.preliminary.forEach((item: any) => {
        budget += (item.qty || 0) * (item.price || 0)
      })
    }

    // Calculate from fittingOut categories
    if (Array.isArray(boq.fittingOut)) {
      boq.fittingOut.forEach((category: any) => {
        if (Array.isArray(category.products)) {
          category.products.forEach((product: any) => {
            budget += (product.qty || 0) * (product.price || 0)
          })
        }
      })
    }

    // Calculate from furnitureWork categories
    if (Array.isArray(boq.furnitureWork)) {
      boq.furnitureWork.forEach((category: any) => {
        if (Array.isArray(category.products)) {
          category.products.forEach((product: any) => {
            budget += (product.qty || 0) * (product.price || 0)
          })
        }
      })
    }

    // Calculate from mechanicalElectrical categories
    if (Array.isArray(boq.mechanicalElectrical)) {
      boq.mechanicalElectrical.forEach((category: any) => {
        if (Array.isArray(category.products)) {
          category.products.forEach((product: any) => {
            budget += (product.qty || 0) * (product.price || 0)
          })
        }
      })
    }

    return budget
  }

  const calculateSummary = (items: any[]) => {
    if (!Array.isArray(items) || items.length === 0) {
      setSummary({ totalBudget: 0, mainBudget: 0, additionalBudget: 0, totalSpent: 0, progress: 0 })
      return
    }

    let mainBudget = 0
    let additionalBudget = 0

    items.forEach((boq) => {
      const boqBudget = calculateBOQBudget(boq)
      if (boq.number === 1) {
        mainBudget = boqBudget
      } else {
        additionalBudget += boqBudget
      }
    })

    const totalBudget = mainBudget + additionalBudget
    setSummary({ totalBudget, mainBudget, additionalBudget, totalSpent: 0, progress: 0 })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === "accepted") {
      return <Badge className="bg-green-500 text-white hover:bg-green-600">Accepted</Badge>
    } else if (statusLower === "rejected") {
      return <Badge className="bg-red-500 text-white hover:bg-red-600">Rejected</Badge>
    } else if (statusLower === "request") {
      return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Request</Badge>
    } else if (statusLower === "draft") {
      return <Badge className="bg-blue-500 text-white hover:bg-blue-600">Draft</Badge>
    }
    return <Badge variant="secondary">{status}</Badge>
  }

  // Helper function for highlighting search query in product names

  // Functions for selecting products in the creation form
  // No longer used (product selection now handled inside BoqItemRow draft only)
  const selectPreliminaryProduct = (_index: number, _product: any) => {}
  const selectFittingOutProduct = (_categoryIndex: number, _productIndex: number, _product: any) => {}
  const selectFurnitureWorkProduct = (_categoryIndex: number, _productIndex: number, _product: any) => {}
  const selectMechanicalElectricalProduct = (_categoryIndex: number, _productIndex: number, _product: any) => {}

  // Preliminary functions
  const addPreliminaryItem = () => {
    setPreliminary((prev) => [...prev, { name: "", qty: 0, unit: "", price: 0, tags: [], startDate: "", endDate: "" }])
  }

  const removePreliminaryItem = (index: number) => {
    setPreliminary((prev) =>
      prev.length > 1
        ? prev.filter((_, i) => i !== index)
        : [{ name: "", qty: 0, unit: "", price: 0, tags: [], startDate: "", endDate: "" }]
    )
  }

  // Fitting Out functions
  const addFittingOutCategory = () => {
    setFittingOut((prev) => [...prev, { name: "", isPreset: false, products: [] }])
    setHasUnsavedChanges(true)
  }

  const removeFittingOutCategory = (categoryIndex: number) => {
    setFittingOut((prev) => prev.filter((_, i) => i !== categoryIndex))
    setHasUnsavedChanges(true)
  }

  const updateFittingOutCategory = (categoryIndex: number, value: string) => {
    setFittingOut((prev) =>
      prev.map((cat, i) => i !== categoryIndex ? cat : { ...cat, name: value })
    )
  }

  const addFittingOutProduct = (categoryIndex: number) => {
    setFittingOut((prev) =>
      prev.map((cat, i) =>
        i !== categoryIndex ? cat : {
          ...cat,
          products: [...cat.products, { name: "", qty: 0, unit: "", price: 0, tags: [], startDate: "", endDate: "" }],
        }
      )
    )
  }

  const removeFittingOutProduct = (categoryIndex: number, productIndex: number) => {
    setFittingOut((prev) =>
      prev.map((cat, i) => {
        if (i !== categoryIndex) return cat
        const filtered = cat.products.filter((_, pi) => pi !== productIndex)
        return {
          ...cat,
          products: filtered.length > 0 ? filtered : [{ name: "", qty: 0, unit: "", price: 0, startDate: "", endDate: "" }],
        }
      })
    )
  }

  // Furniture Work functions
  const updateFurnitureWorkCategory = (categoryIndex: number, name: string) => {
    setFurnitureWork((prev) =>
      prev.map((cat, i) => i !== categoryIndex ? cat : { ...cat, name })
    )
  }

  const addFurnitureWorkProduct = (categoryIndex: number) => {
    setFurnitureWork((prev) =>
      prev.map((cat, i) =>
        i !== categoryIndex ? cat : {
          ...cat,
          products: [...cat.products, { name: "", qty: 0, unit: "", price: 0, tags: [], startDate: "", endDate: "" }],
        }
      )
    )
  }

  const removeFurnitureWorkProduct = (categoryIndex: number, productIndex: number) => {
    setFurnitureWork((prev) =>
      prev.map((cat, i) => {
        if (i !== categoryIndex) return cat
        const filtered = cat.products.filter((_, pi) => pi !== productIndex)
        return {
          ...cat,
          products: filtered.length > 0 ? filtered : [{ name: "", qty: 0, unit: "", price: 0, tags: [], startDate: "", endDate: "" }],
        }
      })
    )
  }

  const addFurnitureWorkCategory = () => {
    setFurnitureWork((prev) => [...prev, { name: "", isPreset: false, products: [] }])
    setHasUnsavedChanges(true)
  }

  const removeFurnitureWorkCategory = (categoryIndex: number) => {
    setFurnitureWork((prev) => prev.filter((_, i) => i !== categoryIndex))
    setHasUnsavedChanges(true)
  }

  // Mechanical / Electrical functions
  const updateMechanicalElectricalCategory = (categoryIndex: number, name: string) => {
    setMechanicalElectrical((prev) =>
      prev.map((cat, i) => i !== categoryIndex ? cat : { ...cat, name })
    )
  }

  const addMechanicalElectricalProduct = (categoryIndex: number) => {
    setMechanicalElectrical((prev) =>
      prev.map((cat, i) =>
        i !== categoryIndex ? cat : {
          ...cat,
          products: [...cat.products, { name: "", qty: 0, unit: "", price: 0, tags: [], startDate: "", endDate: "" }],
        }
      )
    )
  }

  const removeMechanicalElectricalProduct = (categoryIndex: number, productIndex: number) => {
    setMechanicalElectrical((prev) =>
      prev.map((cat, i) => {
        if (i !== categoryIndex) return cat
        const filtered = cat.products.filter((_, pi) => pi !== productIndex)
        return {
          ...cat,
          products: filtered.length > 0 ? filtered : [{ name: "", qty: 0, unit: "", price: 0, tags: [], startDate: "", endDate: "" }],
        }
      })
    )
  }

  const addMechanicalElectricalCategory = () => {
    setMechanicalElectrical((prev) => [...prev, { name: "", isPreset: false, products: [] }])
    setHasUnsavedChanges(true)
  }

  const removeMechanicalElectricalCategory = (categoryIndex: number) => {
    setMechanicalElectrical((prev) => prev.filter((_, i) => i !== categoryIndex))
    setHasUnsavedChanges(true)
  }

  // ── Full-item replace handlers — called on ✓ confirm in BoqItemRow ──────────
  const replacePreliminaryItem = (index: number, item: ProductItem) => {
    setPreliminary((prev) => prev.map((p, i) => i !== index ? p : { ...item }))
    setHasUnsavedChanges(true)
  }

  const replaceFittingOutProduct = (categoryIndex: number, productIndex: number, item: ProductItem) => {
    setFittingOut((prev) =>
      prev.map((cat, ci) =>
        ci !== categoryIndex ? cat : {
          ...cat,
          products: cat.products.map((p, pi) => pi !== productIndex ? p : { ...item }),
        }
      )
    )
    setHasUnsavedChanges(true)
  }

  const replaceFurnitureWorkProduct = (categoryIndex: number, productIndex: number, item: ProductItem) => {
    setFurnitureWork((prev) =>
      prev.map((cat, ci) =>
        ci !== categoryIndex ? cat : {
          ...cat,
          products: cat.products.map((p, pi) => pi !== productIndex ? p : { ...item }),
        }
      )
    )
    setHasUnsavedChanges(true)
  }

  const replaceMechanicalElectricalProduct = (categoryIndex: number, productIndex: number, item: ProductItem) => {
    setMechanicalElectrical((prev) =>
      prev.map((cat, ci) =>
        ci !== categoryIndex ? cat : {
          ...cat,
          products: cat.products.map((p, pi) => pi !== productIndex ? p : { ...item }),
        }
      )
    )
    setHasUnsavedChanges(true)
  }

  // Handlers for creating BOQ
  const handleCreateMainBOQ = async () => {
    try {
      setLoading(true)


      // Helper: normalize date to YYYY-MM-DD
      const normalizeDate = (date?: string) => {
        if (!date) return undefined
        try {
          return new Date(date).toISOString().split("T")[0]
        } catch {
          return undefined
        }
      }

      // Helper: normalize item dates
      const normalizeItemDates = (item: any) => ({
        ...item,
        startDate: item.startDate ? normalizeDate(item.startDate) : undefined,
        endDate: item.endDate ? normalizeDate(item.endDate) : undefined,
      })

      // Determine if this is a main BOQ (number === 1) or additional
      const isMainBOQ = editingBOQ ? editingBOQ.number === 1 : boqType === "main"

      // Validate all items: qty, unit, price
      const invalids: Array<{ section: string; subsection?: string; name: string; reasons: string[] }> = []
      const newInvalidFields = new Set<string>()

      const validateItem = (item: any, section: string, fieldPrefix: string, subsection?: string) => {
        if (!item.name) return
        const reasons: string[] = []

        // qty validation
        if (isMainBOQ) {
          if (item.qty === 0) {
            reasons.push("Quantity must be greater than 0")
            newInvalidFields.add(`${fieldPrefix}-qty`)
          } else if (item.qty < 0) {
            reasons.push("Quantity cannot be negative for main BOQ (must be > 0)")
            newInvalidFields.add(`${fieldPrefix}-qty`)
          }
        } else {
          if (item.qty === 0) {
            reasons.push("Quantity cannot be zero for additional BOQ (must be > 0 or < 0)")
            newInvalidFields.add(`${fieldPrefix}-qty`)
          }
        }

        // unit validation
        if (!item.unit || item.unit.trim() === "") {
          reasons.push("Unit cannot be empty")
          newInvalidFields.add(`${fieldPrefix}-unit`)
        }

        // price validation (must be >= 0)
        if (item.price === undefined || item.price === null || isNaN(item.price) || item.price < 0) {
          reasons.push("Price must be a positive number or 0")
          newInvalidFields.add(`${fieldPrefix}-price`)
        }

        if (reasons.length > 0) {
          invalids.push({ section, subsection, name: item.name, reasons })
        }
      }

      // Validate all sections (read from refs to avoid stale closures)
      preliminaryRef.current.forEach((item, idx) => validateItem(item, "Preliminary", `preliminary-${idx}`))
      fittingOutRef.current.forEach((cat, catIdx) =>
        cat.products.forEach((product, prodIdx) =>
          validateItem(product, "Fitting Out", `fittingOut-${catIdx}-${prodIdx}`, cat.name)
        )
      )
      furnitureWorkRef.current.forEach((cat, catIdx) =>
        cat.products.forEach((product, prodIdx) =>
          validateItem(product, "Furniture Work", `furnitureWork-${catIdx}-${prodIdx}`, cat.name)
        )
      )
      mechanicalElectricalRef.current.forEach((cat, catIdx) =>
        cat.products.forEach((product, prodIdx) =>
          validateItem(product, "Mechanical/Electrical", `mechanicalElectrical-${catIdx}-${prodIdx}`, cat.name)
        )
      )

      setInvalidFields(newInvalidFields)

      if (invalids.length > 0) {
        const errorLines = invalids.map((inv) => {
          const location = inv.subsection ? `${inv.section} / ${inv.subsection}` : inv.section
          return `• [${location}] "${inv.name}": ${inv.reasons.join("; ")}`
        })
        toast({
          title: `${invalids.length} Invalid Field${invalids.length > 1 ? "s" : ""} Found`,
          description: errorLines.join("\n"),
          variant: "destructive",
        })
        return
      }

      // Filter preliminary items (read from refs to get latest state)
      const filteredPreliminary = preliminaryRef.current
        .filter((item) => item.name && (isMainBOQ ? item.qty > 0 : item.qty !== 0))
        .map((item) => normalizeItemDates({
          _id: (item as any)._id || undefined,
          productId: item.productId,
          qty: item.qty,
          name: item.name,
          unit: item.unit,
          price: item.price,
          location: item.location || undefined,
          brand: item.brand || undefined,
          note: item.note || undefined,
          tags: item.tags || [],
          startDate: item.startDate || undefined,
          endDate: item.endDate || undefined,
        }))

      const filteredFittingOut = fittingOutRef.current
        .map((category) => ({
          _id: (category as any)._id || undefined,
          name: category.name,
          products: category.products
            .filter((product) => product.name && (isMainBOQ ? product.qty > 0 : product.qty !== 0))
            .map((product) => normalizeItemDates({
              _id: (product as any)._id || undefined,
              productId: product.productId,
              qty: product.qty,
              name: product.name,
              unit: product.unit,
              price: product.price,
              location: product.location || undefined,
              brand: product.brand || undefined,
              note: product.note || undefined,
              tags: product.tags || [],
              startDate: product.startDate || undefined,
              endDate: product.endDate || undefined,
            })),
        }))
        .filter((category) => category.name && category.products.length > 0)

      const filteredFurnitureWork = furnitureWorkRef.current
        .map((category) => ({
          _id: (category as any)._id || undefined,
          name: category.name,
          products: category.products
            .filter((product) => product.name && (isMainBOQ ? product.qty > 0 : product.qty !== 0))
            .map((product) => normalizeItemDates({
              _id: (product as any)._id || undefined,
              productId: product.productId,
              qty: product.qty,
              name: product.name,
              unit: product.unit,
              price: product.price,
              location: product.location || undefined,
              brand: product.brand || undefined,
              note: product.note || undefined,
              tags: product.tags || [],
              startDate: product.startDate || undefined,
              endDate: product.endDate || undefined,
            })),
        }))
        .filter((category) => category.name && category.products.length > 0)

      const filteredMechanicalElectrical = mechanicalElectricalRef.current
        .map((category) => ({
          _id: (category as any)._id || undefined,
          name: category.name,
          products: category.products
            .filter((product) => product.name && (isMainBOQ ? product.qty > 0 : product.qty !== 0))
            .map((product) => normalizeItemDates({
              _id: (product as any)._id || undefined,
              productId: product.productId,
              qty: product.qty,
              name: product.name,
              unit: product.unit,
              price: product.price,
              location: product.location || undefined,
              brand: product.brand || undefined,
              note: product.note || undefined,
              tags: product.tags || [],
              startDate: product.startDate || undefined,
              endDate: product.endDate || undefined,
            })),
        }))
        .filter((category) => category.name && category.products.length > 0)

      if (filteredPreliminary.length === 0 && filteredFittingOut.length === 0 && filteredFurnitureWork.length === 0 && filteredMechanicalElectrical.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please add at least one item to any section before creating BOQ",
          variant: "destructive",
        })
        return
      }

      const boqData = {
        preliminary: filteredPreliminary,
        fittingOut: filteredFittingOut,
        furnitureWork: filteredFurnitureWork,
        mechanicalElectrical: filteredMechanicalElectrical,
      }

      if (editingBOQ) {
        await boqApi.update(projectId, editingBOQ._id, boqData)
        toast({
          title: "Success",
          description: "BOQ updated successfully",
        })
      } else if (boqType === "additional") {
        // Create additional BOQ using the additional endpoint
        await boqApi.createAdditional(projectId, boqData)
        toast({
          title: "Success",
          description: "Additional BOQ created successfully",
        })
      } else {
        // Create main BOQ
        await boqApi.create(projectId, boqData)
        toast({
          title: "Success",
          description: "Main BOQ created successfully",
        })
      }

      // Reset states
      setCreationMode(null)
      setEditingBOQ(null)
      setBOQType("main") // Reset to main
      setIsCreatingAdditional(false)
      setPreliminary([])
      setFittingOut(initFittingOutCategories())
      setFurnitureWork([])
      setMechanicalElectrical(initMEPCategories())
      setInvalidFields(new Set())
      setHasUnsavedChanges(false)
      fetchBOQ() // Use renamed function
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save BOQ",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUseTemplate = async (template: any) => {
    try {
      setLoading(true)
      const templateData = {
        preliminary: template.preliminary || [],
        fittingOut: template.fittingOut || [],
        furnitureWork: template.furnitureWork || [],
        mechanicalElectrical: template.mechanicalElectrical || [],
      }

      if (boqType === "additional") {
        await boqApi.createAdditional(projectId, templateData)
        toast({
          title: "Success",
          description: "Additional BOQ created from template successfully",
        })
      } else {
        const response = await boqApi.create(projectId, templateData)
        if (response.success) {
          toast({
            title: "Success",
            description: "Main BOQ created from template successfully",
          })
        }
      }

      fetchBOQ() // Use renamed function
      setCreationMode(null)
      setSelectedTemplate(null)
      setShowTemplatePreview(false)
      setBOQType("main") // Reset to main
      setIsCreatingAdditional(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create BOQ from template",
      })
    } finally {
      setLoading(false)
    }
  }

  const uploadProductPhoto = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const token = getAuthToken()
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Upload failed")
    }

    const result = await response.json()
    return { url: result.data.url, provider: result.data.provider }
  }

  const handleProductCreated = (newProduct: any) => {
    fetchProducts()

    if (pendingProductSelection) {
      const { type, categoryIndex, productIndex } = pendingProductSelection

      if (type === "preliminary") {
        selectPreliminaryProduct(productIndex, newProduct)
      } else if (type === "fittingOut" && categoryIndex !== undefined) {
        selectFittingOutProduct(categoryIndex, productIndex, newProduct)
      } else if (type === "furnitureWork" && categoryIndex !== undefined) {
        selectFurnitureWorkProduct(categoryIndex, productIndex, newProduct)
      } else if (type === "mechanicalElectrical" && categoryIndex !== undefined) {
        selectMechanicalElectricalProduct(categoryIndex, productIndex, newProduct)
      }

      setPendingProductSelection(null)
    }
  }

  const handleDeleteBOQ = async (boqId: string) => {
    if (!confirm("Are you sure you want to delete this BOQ?")) return

    try {
      await boqApi.delete(projectId, boqId)
      toast({
        title: "Success",
        description: "BOQ deleted successfully",
      })
      fetchBOQ() // Use renamed function
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete BOQ",
      })
    }
  }

  // Initialize discountTaxState whenever boqItems changes (e.g. after fetchBOQ)
  useEffect(() => {
    setDiscountTaxState((prev) => {
      const next: {
        [boqId: string]: {
          discount: string
          discountType: "%" | "0"
          tax: string
          taxType: "%" | "0"
          saving: boolean
        }
      } = {}
      boqItems.forEach((boq) => {
        next[boq._id] = {
          discount: String(boq.discount ?? prev[boq._id]?.discount ?? ""),
          discountType: ((boq.discountType as "%" | "0") ?? prev[boq._id]?.discountType ?? "%"),
          tax: String(boq.tax ?? prev[boq._id]?.tax ?? ""),
          taxType: ((boq.taxType as "%" | "0") ?? prev[boq._id]?.taxType ?? "%"),
          saving: prev[boq._id]?.saving ?? false,
        }
      })
      return next
    })
  }, [boqItems])

  const handleSaveDiscountTax = async (boqId: string) => {
    const dtState = discountTaxState[boqId]
    if (!dtState) return
    setDiscountTaxState((prev) => ({ ...prev, [boqId]: { ...prev[boqId], saving: true } }))
    try {
      await boqApi.updateDiscountTax(projectId, boqId, {
        discount: parseFloat(dtState.discount) || 0,
        discountType: dtState.discountType,
        tax: parseFloat(dtState.tax) || 0,
        taxType: dtState.taxType,
      })
      toast({ title: "Saved", description: "Discount & tax updated successfully." })
      fetchBOQ()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save discount & tax.",
        variant: "destructive",
      })
    } finally {
      setDiscountTaxState((prev) => ({ ...prev, [boqId]: { ...prev[boqId], saving: false } }))
    }
  }

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim() || (!mainBOQ && !templateEditingBOQ)) {
      toast({
        title: "Error",
        description: "Please enter a template name",
        variant: "destructive",
      })
      return
    }

    try {
      // Use templateEditingBOQ if set (for additional BOQs), otherwise use mainBOQ
      const boqToSave = templateEditingBOQ || mainBOQ
      // Prepare template data from BOQ
      const templateData: CreateTemplateInput = {
        name: templateName.trim(),
        preliminary: boqToSave.preliminary.map((item: any) => ({
          productId: item.productId,
          qty: item.qty,
          name: item.name,
          unit: item.unit,
          price: item.price,
          location: item.location,
          brand: item.brand,
          tags: item.tags || [],
        })),
        fittingOut: boqToSave.fittingOut.map((category: any) => ({
          name: category.name,
          products: category.products.map((product: any) => ({
            productId: product.productId,
            qty: product.qty,
            name: product.name,
            unit: product.unit,
            price: product.price,
            location: product.location,
            brand: product.brand,
            tags: product.tags || [],
          })),
        })),
        furnitureWork: boqToSave.furnitureWork.map((category: any) => ({
          name: category.name,
          products: category.products.map((product: any) => ({
            productId: product.productId,
            qty: product.qty,
            name: product.name,
            unit: product.unit,
            price: product.price,
            location: product.location,
            brand: product.brand,
            tags: product.tags || [],
          })),
        })),
        mechanicalElectrical: (boqToSave.mechanicalElectrical || []).map((category: any) => ({
          name: category.name,
          products: category.products.map((product: any) => ({
            productId: product.productId,
            qty: product.qty,
            name: product.name,
            unit: product.unit,
            price: product.price,
            location: product.location,
            brand: product.brand,
            tags: product.tags || [],
          })),
        })),
      }

      await templatesApi.create(templateData)

      toast({
        title: "Success",
        description: "BOQ saved as template successfully",
      })

      setSaveAsTemplateOpen(false)
      setTemplateName("")
      setTemplateEditingBOQ(null)
    } catch (error) {
      console.error("Failed to save as template:", error)
      toast({
        title: "Error",
        description: "Failed to save BOQ as template",
        variant: "destructive",
      })
    }
  }

  const handleReplaceWithTemplate = async () => {
    if (!selectedReplaceTemplate || (!mainBOQ && !templateEditingBOQ)) return

    // Warn that replacing with a template will permanently remove all existing sub-items
    const confirmed = window.confirm(
      "Replacing with a template will permanently remove all sub-items attached to existing BOQ items. This action cannot be undone. Continue?"
    )
    if (!confirmed) return

    try {
      // Use templateEditingBOQ if set (for additional BOQs), otherwise use mainBOQ
      const boqToReplace = templateEditingBOQ || mainBOQ
      // Prepare BOQ data from template
      const boqData = {
        preliminary: selectedReplaceTemplate.preliminary.map((item: any) => ({
          productId: item.productId,
          qty: item.qty,
          name: item.name,
          unit: item.unit,
          price: item.price,
          tags: item.tags || [],
        })),
        fittingOut: selectedReplaceTemplate.fittingOut.map((category: any) => ({
          name: category.name,
          products: category.products.map((product: any) => ({
            productId: product.productId,
            qty: product.qty,
            name: product.name,
            unit: product.unit,
            price: product.price,
            tags: product.tags || [],
          })),
        })),
        furnitureWork: selectedReplaceTemplate.furnitureWork.map((category: any) => ({
          name: category.name,
          products: category.products.map((product: any) => ({
            productId: product.productId,
            qty: product.qty,
            name: product.name,
            unit: product.unit,
            price: product.price,
            tags: product.tags || [],
          })),
        })),
        mechanicalElectrical: (selectedReplaceTemplate.mechanicalElectrical || []).map((category: any) => ({
          name: category.name,
          products: category.products.map((product: any) => ({
            productId: product.productId,
            qty: product.qty,
            name: product.name,
            unit: product.unit,
            price: product.price,
            tags: product.tags || [],
          })),
        })),
      }

      await boqApi.update(projectId, boqToReplace._id, boqData)

      toast({
        title: "Success",
        description: "BOQ replaced with template successfully",
      })

      setReplaceTemplateOpen(false)
      setSelectedReplaceTemplate(null)
      setReplaceTemplatePreviewOpen(false)
      setTemplateEditingBOQ(null)

      // Refresh BOQ data
      fetchBOQ()
    } catch (error) {
      console.error("Failed to replace with template:", error)
      toast({
        title: "Error",
        description: "Failed to replace BOQ with template",
        variant: "destructive",
      })
    }
  }

  const hasGanttData = (boq: any) => {
    const hasPreliminDates = boq.preliminary?.some((item: any) => item.startDate || item.endDate)
    const hasFittingDates = boq.fittingOut?.some((cat: any) => cat.products?.some((p: any) => p.startDate || p.endDate))
    const hasFurnitureDates = boq.furnitureWork?.some((cat: any) =>
      cat.products?.some((p: any) => p.startDate || p.endDate),
    )
    return hasPreliminDates || hasFittingDates || hasFurnitureDates
  }

  const getGanttDataDetails = (boq: any) => {
    const details: any[] = []

    boq.preliminary?.forEach((item: any) => {
      if (item.startDate || item.endDate) {
        details.push({
          name: item.name,
          startDate: item.startDate,
          endDate: item.endDate,
          section: "Preliminary",
        })
      }
    })

    boq.fittingOut?.forEach((cat: any) => {
      cat.products?.forEach((product: any) => {
        if (product.startDate || product.endDate) {
          details.push({
            name: product.name,
            startDate: product.startDate,
            endDate: product.endDate,
            section: `Fitting Out - ${cat.name}`,
          })
        }
      })
    })

    boq.furnitureWork?.forEach((cat: any) => {
      cat.products?.forEach((product: any) => {
        if (product.startDate || product.endDate) {
          details.push({
            name: product.name,
            startDate: product.startDate,
            endDate: product.endDate,
            section: `Furniture Work - ${cat.name}`,
          })
        }
      })
    })

    return details
  }

  const mainBOQ = boqItems.find((boq) => boq.number === 1)
  const additionalBOQs = boqItems.filter((boq) => boq.number > 1)
  // Flat list of all named items in the main BOQ — used as a source for additional BOQ item selection
  const mainBoqItems: ProductItem[] = mainBOQ
    ? [
        ...(mainBOQ.preliminary || []).map((item: any) => ({
          ...item,
          _section: "I. Preliminary",
        })),
        ...(mainBOQ.fittingOut || []).flatMap((c: any) =>
          (c.products || []).map((p: any) => ({
            ...p,
            _section: "II. Fitting Out",
            _category: c.name || undefined,
          }))
        ),
        ...(mainBOQ.furnitureWork || []).flatMap((c: any) =>
          (c.products || []).map((p: any) => ({
            ...p,
            _section: "III. Furniture Work",
            _category: c.name || undefined,
          }))
        ),
        ...(mainBOQ.mechanicalElectrical || []).flatMap((c: any) =>
          (c.products || []).map((p: any) => ({
            ...p,
            _section: "IV. MEP",
            _category: c.name || undefined,
          }))
        ),
      ].filter((item: any) => item.name)
    : []

  useEffect(() => {
    const tabFromQuery = searchParams.get("tab")
    const subTabFromQuery = searchParams.get("subtab")

    if (tabFromQuery !== "boq") return
    if (!subTabFromQuery) return

    const isValidSubTab =
      subTabFromQuery === "main" ||
      subTabFromQuery === "additional" ||
      (subTabFromQuery === "recap" && additionalBOQs.length > 0)

    if (isValidSubTab && subTabFromQuery !== activeTab) {
      setActiveTab(subTabFromQuery)
    }
  }, [searchParams, additionalBOQs.length, activeTab])

  const syncSubTabQuery = (nextSubTab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "boq")
    params.set("subtab", nextSubTab)

    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  // Send approval request with selected email
  const sendApprovalRequest = async () => {
    const email = selectedApprovalEmail || customApprovalEmail

    if (!email) {
      toast({
        title: "Error",
        description: "Please select or enter an email address",
        variant: "destructive",
      })
      return
    }

    if (!mainBOQ) return

    try {
      setApprovalLoading(true)
      const response = await boqApi.requestApproval(projectId, mainBOQ._id, { email })
      if (response.success) {
        toast({
          title: "Success",
          description: "Approval request sent successfully",
        })
        setShowApprovalModal(false)
        setSelectedApprovalEmail("")
        setCustomApprovalEmail("")
        fetchBOQ() // Refresh BOQ list
      } else {
        toast({
          title: "Error",
          description: "Failed to send approval request",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Failed to send approval request:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send approval request",
        variant: "destructive",
      })
    } finally {
      setApprovalLoading(false)
    }
  }

  // Handle request approval - open modal
  const handleRequestApproval = async () => {
    if (!mainBOQ) return
    setShowApprovalModal(true)
  }

  const handleTabChange = (value: string) => {
    // Only allow switching to additional tab if main BOQ is accepted
    if (value === "additional" && mainBOQ && mainBOQ.status.toLowerCase() !== "accepted") {
      toast({
        title: "Cannot Access",
        description: "Additional BOQs can only be created after the main BOQ is accepted.",
        variant: "destructive",
      })
      return
    }
    setActiveTab(value)
    syncSubTabQuery(value)
  }

  const openFullscreenBoq = (title: string, type: "table" | "recap", data?: any) => {
    setFullscreenBoqTitle(title)
    setFullscreenBoqType(type)
    setFullscreenBoqData(data ?? null)
    setFullscreenBoqOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading BOQ...</p>
      </div>
    )
  }

  if (!mainBOQ && !creationMode && boqType === "main") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Main BOQ</CardTitle>
            <CardDescription>Choose how you want to create your Bill of Quantities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-32 flex flex-col items-center justify-center gap-3 bg-transparent"
                onClick={() => setCreationMode("blank")}
              >
                <FileSpreadsheet className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Create from Blank</div>
                  <div className="text-sm text-muted-foreground">Start with an empty BOQ</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-32 flex flex-col items-center justify-center gap-3 bg-transparent"
                onClick={() => setCreationMode("template")}
              >
                <Sparkles className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Import from Template</div>
                  <div className="text-sm text-muted-foreground">Use a pre-made template</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show template or blank selection for additional BOQ
  if (mainBOQ && boqType === "additional" && !creationMode) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Additional BOQ</CardTitle>
            <CardDescription>Choose how you want to create your Additional Bill of Quantities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-32 flex flex-col items-center justify-center gap-3 bg-transparent"
                onClick={() => setCreationMode("blank")}
              >
                <FileSpreadsheet className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Create from Blank</div>
                  <div className="text-sm text-muted-foreground">Start with an empty BOQ</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-32 flex flex-col items-center justify-center gap-3 bg-transparent"
                onClick={() => setCreationMode("template")}
              >
                <Sparkles className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Import from Template</div>
                  <div className="text-sm text-muted-foreground">Use a pre-made template</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if ((!mainBOQ || boqType === "additional") && creationMode === "template") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Select Template</h2>
            <p className="text-muted-foreground">Choose a template to create your {boqType === "additional" ? "Additional" : "Main"} BOQ</p>
          </div>
          <Button variant="outline" onClick={() => {
            setCreationMode(null)
            setBOQType("main")
            if (boqType === "additional") {
              setActiveTab("additional")
            }
          }}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template._id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">{template.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Preliminary: {template.preliminary?.length || 0} items</div>
                  <div>Fitting Out: {template.fittingOut?.length || 0} categories</div>
                  <div>Furniture Work: {template.furnitureWork?.length || 0} categories</div>
                  <div>MEP: {template.mechanicalElectrical?.length || 0} categories</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => {
                      setSelectedTemplate(template)
                      setShowTemplatePreview(true)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => handleUseTemplate(template)} disabled={loading}>
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {templates.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No templates available</p>
              <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setCreationMode("blank")}>
                Create from Blank Instead
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Template Preview Dialog */}
        <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTemplate?.name}</DialogTitle>
              <DialogDescription>Preview template details</DialogDescription>
            </DialogHeader>
            {selectedTemplate && <BoqTable boq={selectedTemplate} formatCurrency={formatCurrency} />}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTemplatePreview(false)}>
                Close
              </Button>
              <Button onClick={() => handleUseTemplate(selectedTemplate)} disabled={loading}>
                Use This Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if ((editingBOQ && creationMode === "blank") || (!mainBOQ && creationMode === "blank") || (boqType === "additional" && creationMode === "blank")) {
    const handleCancel = () => {
      setCreationMode(null)
      setEditingBOQ(null)
      setBOQType("main")
      setInvalidFields(new Set())
      setHasUnsavedChanges(false)
      if (boqType === "additional") {
        setActiveTab("additional")
      }
      setPreliminary([])
      setFittingOut(initFittingOutCategories())
      setFurnitureWork([])
      setMechanicalElectrical(initMEPCategories())
    }
    return (
      <BoqEditForm
        editingBOQ={editingBOQ}
        boqType={boqType}
        loading={loading}
        hasUnsavedChanges={hasUnsavedChanges}
        preliminary={preliminary}
        fittingOut={fittingOut}
        furnitureWork={furnitureWork}
        mechanicalElectrical={mechanicalElectrical}
        createProductDialogOpen={createProductDialogOpen}
        invalidFields={invalidFields}
        formatCurrency={formatCurrency}
        mainBoqItems={mainBoqItems}
        onCancel={handleCancel}
        onSubmit={handleCreateMainBOQ}
        onSetCreateProductDialogOpen={setCreateProductDialogOpen}
        onSetPendingProductSelection={setPendingProductSelection}
        uploadProductPhoto={uploadProductPhoto}
        onProductCreated={handleProductCreated}
        // Preliminary
        onAddPreliminaryItem={addPreliminaryItem}
        onUpdatePreliminaryItem={(idx, updated) => replacePreliminaryItem(idx, updated)}
        onRemovePreliminaryItem={removePreliminaryItem}
        onSelectPreliminaryProduct={selectPreliminaryProduct}
        // Fitting Out
        onAddFittingOutCategory={addFittingOutCategory}
        onRemoveFittingOutCategory={removeFittingOutCategory}
        onUpdateFittingOutCategoryName={updateFittingOutCategory}
        onAddFittingOutProduct={addFittingOutProduct}
        onRemoveFittingOutProduct={removeFittingOutProduct}
        onUpdateFittingOutProduct={replaceFittingOutProduct}
        onSelectFittingOutProduct={selectFittingOutProduct}
        // Furniture Work
        onAddFurnitureWorkCategory={addFurnitureWorkCategory}
        onRemoveFurnitureWorkCategory={removeFurnitureWorkCategory}
        onUpdateFurnitureWorkCategoryName={updateFurnitureWorkCategory}
        onAddFurnitureWorkProduct={addFurnitureWorkProduct}
        onRemoveFurnitureWorkProduct={removeFurnitureWorkProduct}
        onUpdateFurnitureWorkProduct={replaceFurnitureWorkProduct}
        onSelectFurnitureWorkProduct={selectFurnitureWorkProduct}
        // MEP
        onAddMechanicalElectricalCategory={addMechanicalElectricalCategory}
        onRemoveMechanicalElectricalCategory={removeMechanicalElectricalCategory}
        onUpdateMechanicalElectricalCategoryName={updateMechanicalElectricalCategory}
        onAddMechanicalElectricalProduct={addMechanicalElectricalProduct}
        onRemoveMechanicalElectricalProduct={removeMechanicalElectricalProduct}
        onUpdateMechanicalElectricalProduct={replaceMechanicalElectricalProduct}
        onSelectMechanicalElectricalProduct={selectMechanicalElectricalProduct}
      />
    )
  }

  // Main return statement for when a main BOQ exists
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Bill of Quantity</h2>
          <p className="text-muted-foreground">Manage project BOQs and cost estimates</p>
        </div>
        {/* This button logic is now handled by the creation mode state */}
        {!mainBOQ && !creationMode && (
          <Button
            onClick={() => {
              setBOQType("main")
              setCreationMode("blank")
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Main BOQ
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* AS PER CONTRACT — Main BOQ */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">AS PER CONTRACT</CardTitle>
            <CardDescription className="text-xs">Main BOQ Budget</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(summary.mainBudget)}</p>
            <div className="mt-2 flex items-center gap-2">
              {mainBOQ ? (
                getStatusBadge(mainBOQ.status)
              ) : (
                <Badge variant="outline" className="text-muted-foreground">Not Created</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ADDITIONAL / DEDUCTION */}
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">ADDITIONAL / DEDUCTION</CardTitle>
            <CardDescription className="text-xs">{additionalBOQs.length} Additional BOQ(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${
              summary.additionalBudget >= 0
                ? "text-amber-700 dark:text-amber-300"
                : "text-red-600 dark:text-red-400"
            }`}>
              {summary.additionalBudget >= 0 ? "+" : ""}{formatCurrency(summary.additionalBudget)}
            </p>
            {additionalBOQs.length > 0 && (
              <div className="mt-2 space-y-1">
                {additionalBOQs.map((boq) => {
                  const boqTotal = calculateBOQBudget(boq)
                  return (
                    <div key={boq._id} className="flex justify-between text-xs text-muted-foreground">
                      <span>BOQ #{boq.number}</span>
                      <span className={`font-medium ${
                        boqTotal < 0 ? "text-red-500" : "text-foreground"
                      }`}>
                        {boqTotal >= 0 ? "+" : ""}{formatCurrency(boqTotal)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* NET TOTAL */}
        <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">NET TOTAL</CardTitle>
            <CardDescription className="text-xs">As Per Contract + Additional</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{formatCurrency(summary.totalBudget)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {mainBOQ ? "1 Main" : "0 Main"} + {additionalBOQs.length} Additional
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">

        {/* Desktop: Tabs */}
        <TabsList className="hidden md:flex">
          <TabsTrigger value="main" className="flex items-center gap-2">
            Main BOQ
            {mainBOQ && <span className="text-xs opacity-70">({mainBOQ.status})</span>}
          </TabsTrigger>
          <TabsTrigger 
            value="additional" 
            className={`flex items-center gap-2 ${
              mainBOQ && mainBOQ.status.toLowerCase() !== "accepted"
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            disabled={mainBOQ && mainBOQ.status.toLowerCase() !== "accepted"}
          >
            Additional BOQs
            {additionalBOQs.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 flex items-center justify-center px-1">
                {additionalBOQs.length}
              </Badge>
            )}
            {mainBOQ && mainBOQ.status.toLowerCase() !== "accepted" && (
              <span className="text-xs text-muted-foreground ml-1">(Need accepted)</span>
            )}
          </TabsTrigger>
          {additionalBOQs.length > 0 && (
            <TabsTrigger value="recap" className="flex items-center gap-2">
              Recap BOQ
              <Badge variant="outline" className="ml-1 h-5 min-w-5 flex items-center justify-center px-1 text-xs">
                {boqItems.length}
              </Badge>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="main" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">Loading BOQ...</p>
              </CardContent>
            </Card>
          ) : !mainBOQ ? (
            // This part is now handled by the initial render logic when !mainBOQ && !creationMode
            <></>
          ) : (
            // Main BOQ Display
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <CardTitle>Main BOQ</CardTitle>
                      {getStatusBadge(mainBOQ.status)}
                    </div>
                    <CardDescription>
                      BOQ #{mainBOQ.number} • Created: {new Date(mainBOQ.createdAt).toLocaleDateString("id-ID")}
                    </CardDescription>
                  </div>
                  <MainBoqActions
                    status={mainBOQ.status}
                    onFullscreen={() => openFullscreenBoq("Main BOQ", "table", mainBOQ)}
                    onEdit={() => {
                      setEditingBOQ(mainBOQ)
                      setCreationMode("blank")
                    }}
                    onSaveTemplate={() => setSaveAsTemplateOpen(true)}
                    onReplaceTemplate={() => setReplaceTemplateOpen(true)}
                    onRequestApproval={handleRequestApproval}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <BoqTable
                  boq={mainBOQ}
                  formatCurrency={formatCurrency}
                  discountTaxData={discountTaxState[mainBOQ._id]}
                  onDiscountTaxChange={(patch) =>
                    setDiscountTaxState((prev) => ({
                      ...prev,
                      [mainBOQ._id]: { ...prev[mainBOQ._id], ...patch },
                    }))
                  }
                  onSaveDiscountTax={() => handleSaveDiscountTax(mainBOQ._id)}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="additional" className="space-y-4">
          {!creationMode && boqType === "main" && mainBOQ && !editingBOQ && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
                onClick={() => {
                  setBOQType("additional")
                  setCreationMode("blank")
                }}
              >
                <FileSpreadsheet className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold text-sm">Create from Blank</div>
                  <div className="text-xs text-muted-foreground">Start with empty template</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
                onClick={() => {
                  setBOQType("additional")
                  setCreationMode("template")
                }}
              >
                <Sparkles className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold text-sm">Create from Template</div>
                  <div className="text-xs text-muted-foreground">Use pre-made template</div>
                </div>
              </Button>
            </div>
          )}
          {additionalBOQs.length === 0 && !creationMode && boqType === "main" ? (
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
                    <AdditionalBoqActions
                      status={boq.status}
                      onFullscreen={() => openFullscreenBoq(`Additional BOQ #${boq.number}`, "table", boq)}
                      onEdit={() => {
                        setEditingBOQ(boq)
                        setCreationMode("blank")
                        setBOQType("additional")
                        setIsCreatingAdditional(true)
                      }}
                      onSaveTemplate={() => {
                        setTemplateEditingBOQ(boq)
                        setSaveAsTemplateOpen(true)
                      }}
                      onReplaceTemplate={() => {
                        setTemplateEditingBOQ(boq)
                        setReplaceTemplateOpen(true)
                      }}
                      onDelete={() => handleDeleteBOQ(boq._id)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <BoqTable
                    boq={boq}
                    formatCurrency={formatCurrency}
                    showNote
                    discountTaxData={discountTaxState[boq._id]}
                    onDiscountTaxChange={(patch) =>
                      setDiscountTaxState((prev) => ({
                        ...prev,
                        [boq._id]: { ...prev[boq._id], ...patch },
                      }))
                    }
                    onSaveDiscountTax={() => handleSaveDiscountTax(boq._id)}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {additionalBOQs.length > 0 && (
          <TabsContent value="recap" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => openFullscreenBoq("Recap BOQ", "recap")}>
                <Maximize2 className="h-4 w-4 mr-2" />
                Full Screen
              </Button>
            </div>
            {activeTab === "recap" ? (
              <BoqRecap mainBOQ={mainBOQ} additionalBOQs={additionalBOQs} formatCurrency={formatCurrency} />
            ) : null}
          </TabsContent>
        )}
      </Tabs>

      <FullscreenBoqDialog
        open={fullscreenBoqOpen}
        title={fullscreenBoqTitle}
        onOpenChange={setFullscreenBoqOpen}
        renderContent={() =>
          fullscreenBoqType === "recap" ? (
            <BoqRecap mainBOQ={mainBOQ} additionalBOQs={additionalBOQs} formatCurrency={formatCurrency} />
          ) : fullscreenBoqData ? (
            <BoqTable boq={fullscreenBoqData} formatCurrency={formatCurrency} showNote={fullscreenBoqData?.number > 1} />
          ) : null
        }
      />

      <CreateProductDialog
        open={createProductDialogOpen}
        onOpenChange={setCreateProductDialogOpen}
        uploadPhoto={uploadProductPhoto}
        onCreated={handleProductCreated}
      />

      <Dialog 
        open={saveAsTemplateOpen} 
        onOpenChange={(open) => {
          setSaveAsTemplateOpen(open)
          if (!open) {
            setTemplateName("")
            setTemplateEditingBOQ(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save BOQ as Template</DialogTitle>
            <DialogDescription>
              Enter a name for this template. It will be saved without timeline data.
              {templateEditingBOQ && ` (Additional BOQ #${templateEditingBOQ.number})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="templateName" className="text-sm font-medium">
                Template Name
              </label>
              <Input
                id="templateName"
                placeholder="e.g., Office Renovation Template"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveAsTemplateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsTemplate}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={replaceTemplateOpen} 
        onOpenChange={(open) => {
          setReplaceTemplateOpen(open)
          if (!open) {
            setSelectedReplaceTemplate(null)
            setTemplateEditingBOQ(null)
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Replace BOQ with Template</DialogTitle>
            <DialogDescription>
              Select a template to replace the current BOQ.
              {templateEditingBOQ && ` (Additional BOQ #${templateEditingBOQ.number})`}
              {hasGanttData(templateEditingBOQ || mainBOQ) && (
                <span className="text-destructive font-medium">
                  {" "}
                  Warning: This will remove all Gantt chart timeline data.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Show Gantt chart warning if data exists */}
          {hasGanttData(templateEditingBOQ || mainBOQ) && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-semibold text-destructive">Gantt Chart Data Will Be Lost</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    The following items have timeline data that will be removed:
                  </p>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {getGanttDataDetails(templateEditingBOQ || mainBOQ).map((detail, idx) => (
                  <div key={idx} className="text-sm bg-background rounded p-2 space-y-1">
                    <div className="font-medium">{detail.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {detail.section} • {new Date(detail.startDate).toLocaleDateString("id-ID")} -{" "}
                      {new Date(detail.endDate).toLocaleDateString("id-ID")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Template Selection */}
          <div className="space-y-3">
            <h4 className="font-semibold">Select Template</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2">
              {templates.map((template) => (
                <Card
                  key={template._id}
                  className={`cursor-pointer transition-colors hover:bg-primary/50 ${
                    selectedReplaceTemplate?._id === template._id ? "ring-1 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedReplaceTemplate(template)}
                >
                  <CardContent className="py-4">
                    <h5 className="font-medium">{template.name}</h5>
                    <p className="text-xs text-muted-foreground mt-1">
                      {template.preliminary.length} preliminary • {template.fittingOut.length} fitting out •{" "}
                      {template.furnitureWork.length} furniture • {(template.mechanicalElectrical || []).length} MEP
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 mt-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedReplaceTemplate(template)
                        setReplaceTemplatePreviewOpen(true)
                      }}
                    >
                      Preview
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReplaceTemplateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReplaceWithTemplate} disabled={!selectedReplaceTemplate} variant="destructive">
              Replace BOQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={replaceTemplatePreviewOpen} onOpenChange={setReplaceTemplatePreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview: {selectedReplaceTemplate?.name}</DialogTitle>
            <DialogDescription>Review the template contents before replacing your BOQ</DialogDescription>
          </DialogHeader>
          {selectedReplaceTemplate && (
            <div className="space-y-4">
              <BoqTable
                boq={{
                  ...selectedReplaceTemplate,
                  mechanicalElectrical: selectedReplaceTemplate.mechanicalElectrical || [],
                }}
                formatCurrency={formatCurrency}
              />
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setReplaceTemplatePreviewOpen(false)}>Close</Button>
            <Button
              variant="destructive"
              onClick={() => {
                setReplaceTemplatePreviewOpen(false)
                handleReplaceWithTemplate()
              }}
            >
              Use This Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Request Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Approval</DialogTitle>
            <DialogDescription>Select or enter the email address to send the approval request</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {approvalEmails.length > 0 && (
              <div className="space-y-2">
                <Label>Select from client emails</Label>
                <Select value={selectedApprovalEmail} onValueChange={(value) => {
                  setSelectedApprovalEmail(value)
                  setCustomApprovalEmail("") // Clear custom email when selecting from list
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an email" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvalEmails.map((item) => (
                      <SelectItem key={item.email} value={item.email}>
                        <div className="flex items-center gap-2">
                          <span>{item.email}</span>
                          <span className="text-xs text-muted-foreground">({item.label})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="custom-email">Or enter email manually</Label>
              <Input
                id="custom-email"
                type="email"
                placeholder="email@example.com"
                value={customApprovalEmail}
                onChange={(e) => {
                  setCustomApprovalEmail(e.target.value)
                  setSelectedApprovalEmail("") // Clear selection when typing
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowApprovalModal(false)
                setSelectedApprovalEmail("")
                setCustomApprovalEmail("")
              }}
            >
              Cancel
            </Button>
            <Button onClick={sendApprovalRequest} disabled={approvalLoading}>
              {approvalLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Send className="h-4 w-4 mr-2" />
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
