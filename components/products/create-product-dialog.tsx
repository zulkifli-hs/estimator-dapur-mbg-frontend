"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Loader2, Upload, X, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { productsApi, type CreateProductInput, type Product, type ProductDetail } from "@/lib/api/products"
import { uploadApi, type UploadResponse } from "@/lib/api/upload"
import { API_BASE_URL } from "@/lib/api/config"

const tagOptions = [
  { value: "Vendor", label: "Vendor" },
  { value: "MEP", label: "MEP" },
  { value: "Workshop", label: "Workshop" },
  { value: "internal", label: "internal" },
  { value: "custom", label: "Custom" },
] as const

type TagOption = (typeof tagOptions)[number]["value"]

type ProductFormState = {
  name: string
  type: "Goods" | "Services" | "Goods and Services"
  unit: string
  brand: string
  sellingPrice: string
  purchasePrice: string
  sku: string
  tag: TagOption | ""
  customTag: string
}

type ProductDetailInput = Pick<ProductDetail, "label" | "type" | "value">

type CreateProductDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate?: (data: CreateProductInput) => Promise<Product>
  onCreated?: (product: Product) => void
  uploadPhoto?: (file: File) => Promise<UploadResponse>
  title?: string
  description?: string
  submitLabel?: string
}

const defaultFormState: ProductFormState = {
  name: "",
  type: "Goods",
  unit: "",
  brand: "",
  sellingPrice: "",
  purchasePrice: "",
  sku: "",
  tag: "",
  customTag: "",
}

export function CreateProductDialog({
  open,
  onOpenChange,
  onCreate,
  onCreated,
  uploadPhoto,
  title = "Create New Product",
  description = "Add a new product to the system",
  submitLabel = "Create Product",
}: CreateProductDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<ProductFormState>(defaultFormState)
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ url: string; provider: string }>>([])
  const [productDetails, setProductDetails] = useState<ProductDetailInput[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const uploadHandler = useMemo(() => uploadPhoto ?? uploadApi.uploadPhoto, [uploadPhoto])

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setFormData(defaultFormState)
    setUploadedPhotos([])
    setProductDetails([])
  }

  const resolveTagInput = () => {
    const selected = formData.tag === "custom" ? formData.customTag.trim() : formData.tag.trim()
    return selected ? [selected] : undefined
  }

  const generateSKU = () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Please enter a product name first",
        variant: "destructive",
      })
      return
    }

    const generateAbbreviation = (text: string): string => {
      if (!text) return "XXX"

      const words = text.trim().split(/\s+/)

      if (words.length >= 3) {
        return words
          .slice(0, 3)
          .map((word) => word[0])
          .join("")
          .toUpperCase()
      }

      if (words.length === 2) {
        return (words[0][0] + words[1][0] + words[1][0]).toUpperCase()
      }

      const word = words[0]
      if (word.length >= 3) return word.substring(0, 3).toUpperCase()
      if (word.length === 2) return (word[0] + word[1] + word[1]).toUpperCase()
      return (word[0] + word[0] + word[0]).toUpperCase()
    }

    const namePart = generateAbbreviation(formData.name)
    const typeMap: { [key: string]: string } = {
      Goods: "GO",
      Services: "SE",
      "Goods and Services": "GS",
    }
    const typePart = typeMap[formData.type] || "XX"
    const brandPart = formData.brand ? generateAbbreviation(formData.brand) : "XXX"
    const year = new Date().getFullYear().toString().slice(-2)

    const generatedSku = `${namePart}-${typePart}-${brandPart}-${year}`
    setFormData((prev) => ({ ...prev, sku: generatedSku }))

    toast({
      title: "SKU Generated",
      description: `Generated SKU: ${generatedSku}`,
    })
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    try {
      setUploading(true)
      const file = files[0]
      const result = await uploadHandler(file)
      setUploadedPhotos((prev) => [...prev, { url: result.url, provider: result.provider }])

      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload photo",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const addDetailField = () => {
    setProductDetails((prev) => [...prev, { label: "", type: "text", value: "" }])
  }

  const updateDetailField = (index: number, field: keyof ProductDetailInput, value: string) => {
    setProductDetails((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const removeDetailField = (index: number) => {
    setProductDetails((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.unit || !formData.sku) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const createData: CreateProductInput = {
        name: formData.name,
        type: formData.type,
        unit: formData.unit,
        sellingPrice: Number.parseFloat(formData.sellingPrice) || 0,
        purchasePrice: Number.parseFloat(formData.purchasePrice) || 0,
        sku: formData.sku,
        brand: formData.brand || undefined,
        tags: resolveTagInput(),
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
        details:
          productDetails.length > 0
            ? productDetails.map((detail) => ({
                label: detail.label,
                type: detail.type,
                value: detail.value,
              }))
            : undefined,
      }

      const createdProduct = onCreate ? await onCreate(createData) : await productsApi.create(createData)

      toast({
        title: "Success",
        description: "Product created successfully",
      })

      onOpenChange(false)
      resetForm()
      if (createdProduct) {
        onCreated?.(createdProduct)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create product",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const submitDisabled = submitting || !formData.name || !formData.unit || !formData.sku

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="create-product-name">Product Name *</Label>
            <Input
              id="create-product-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Semen"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-product-type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="create-product-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Goods">Goods</SelectItem>
                  <SelectItem value="Services">Services</SelectItem>
                  <SelectItem value="Goods and Services">Goods and Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-product-unit">Unit *</Label>
              <Input
                id="create-product-unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g., liter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-product-brand">Brand</Label>
              <Input
                id="create-product-brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g., Mitsubishi"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-product-tag">Tag</Label>
            <Select
              value={formData.tag}
              onValueChange={(value: any) =>
                setFormData((prev) => ({
                  ...prev,
                  tag: value,
                  customTag: value === "custom" ? prev.customTag : "",
                }))
              }
            >
              <SelectTrigger id="create-product-tag">
                <SelectValue placeholder="Select a tag" />
              </SelectTrigger>
              <SelectContent>
                {tagOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {formData.tag === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="create-product-custom-tag">Custom Tag</Label>
              <Input
                id="create-product-custom-tag"
                value={formData.customTag}
                onChange={(e) => setFormData({ ...formData, customTag: e.target.value })}
                placeholder="Type custom tag"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-product-purchase">Purchase Price (IDR) *</Label>
              <Input
                id="create-product-purchase"
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="e.g., 20000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-product-selling">Selling Price (IDR) *</Label>
              <Input
                id="create-product-selling"
                type="number"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                placeholder="e.g., 25000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-product-sku">SKU *</Label>
            <div className="flex gap-2">
              <Input
                id="create-product-sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g., DSG-GS-MIT-25"
              />
              <Button type="button" variant="outline" onClick={generateSKU} className="whitespace-nowrap bg-transparent">
                <Sparkles className="h-4 w-4" />
                Generate SKU
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Click Generate SKU to create based on name, type, brand, and year
            </p>
          </div>

          <div className="space-y-2">
            <Label>Photos</Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="hidden"
                id="create-product-photo"
              />
              <label htmlFor="create-product-photo" className="cursor-pointer">
                <div className="flex flex-col items-center justify-center py-4">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  )}
                  <p className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click to upload photo"}</p>
                </div>
              </label>

              {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {uploadedPhotos.map((photo, index) => (
                    <div key={`${photo.url}-${index}`} className="relative group">
                      <img
                        src={`${API_BASE_URL}/public/${photo.provider}/${photo.url}`}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Product Details</Label>
              <Button type="button" variant="outline" size="sm" onClick={addDetailField}>
                <Plus className="h-4 w-4 mr-1" />
                Add Detail
              </Button>
            </div>

            {productDetails.map((detail, index) => (
              <div key={`detail-${index}`} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4 space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={detail.label}
                    onChange={(e) => updateDetailField(index, "label", e.target.value)}
                    placeholder="e.g., Color"
                    className="h-9"
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={detail.type} onValueChange={(value: any) => updateDetailField(index, "type", value)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4 space-y-1">
                  <Label className="text-xs">Value</Label>
                  <Input
                    value={detail.value}
                    onChange={(e) => updateDetailField(index, "value", e.target.value)}
                    placeholder="e.g., Ungu"
                    type={detail.type === "number" ? "number" : detail.type === "date" ? "date" : "text"}
                    className="h-9"
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDetailField(index)}
                    className="h-9 w-9"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {productDetails.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No details added yet. Click "Add Detail" to add product specifications.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={submitDisabled}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
