"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Plus, Search, Edit, Trash2, Loader2, Package, Shield, Eye, X, Upload } from "lucide-react"
import {
  productsApi,
  type Product,
  type CreateProductInput,
  type UpdateProductInput,
  type ProductDetail,
} from "@/lib/api/products"
import { getProfile } from "@/lib/api/auth"
import { uploadPhoto } from "@/lib/api/upload"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/api/config"

export default function ProductsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalData, setTotalData] = useState(0)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    type: "Goods" as "Goods" | "Services" | "Goods and Services",
    unit: "",
    brand: "",
    sellingPrice: "",
    purchasePrice: "",
    sku: "",
  })

  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ url: string; provider: string }>>([])
  const [uploading, setUploading] = useState(false)
  const [productDetails, setProductDetails] = useState<ProductDetail[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const response = await getProfile()
        if (!response.data.admin) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page",
            variant: "destructive",
          })
          router.push("/dashboard")
          return
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to verify access permissions",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      } finally {
        setCheckingAuth(false)
      }
    }
    checkAdminAccess()
  }, [router, toast])

  useEffect(() => {
    if (!checkingAuth) {
      loadProducts()
    }
  }, [page, searchQuery, checkingAuth])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await productsApi.getAll(page, 10, searchQuery || undefined)
      setProducts(response.list)
      setTotalPages(response.totalPage)
      setTotalData(response.totalData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setPage(1)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "Goods",
      unit: "",
      brand: "",
      sellingPrice: "",
      purchasePrice: "",
      sku: "",
    })
    setUploadedPhotos([])
    setProductDetails([])
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setUploading(true)
      const file = files[0]
      const result = await uploadPhoto(file)

      setUploadedPhotos((prev) => [...prev, { url: result.url, provider: result.provider }])

      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const addDetailField = () => {
    setProductDetails((prev) => [...prev, { label: "", type: "text", value: "" }])
  }

  const updateDetailField = (index: number, field: keyof ProductDetail, value: string) => {
    setProductDetails((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      // Auto-sync name with label
      if (field === "label") {
        updated[index].name = value
      }
      return updated
    })
  }

  const removeDetailField = (index: number) => {
    setProductDetails((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreate = async () => {
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
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
        details:
          productDetails.length > 0
            ? productDetails.map((d) => ({
                label: d.label,
                type: d.type,
                value: d.value,
              }))
            : undefined,
      }

      await productsApi.create(createData)

      toast({
        title: "Success",
        description: "Product created successfully",
      })

      setCreateDialogOpen(false)
      resetForm()
      loadProducts()
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

  const handleEdit = async () => {
    if (!editingProduct) return

    try {
      setSubmitting(true)

      const updateData: UpdateProductInput = {
        name: formData.name,
        unit: formData.unit,
        price: Number.parseFloat(formData.price),
      }

      await productsApi.update(editingProduct._id, updateData)

      toast({
        title: "Success",
        description: "Product updated successfully",
      })

      setEditDialogOpen(false)
      resetForm()
      setEditingProduct(null)
      loadProducts()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      type: product.type,
      unit: product.unit,
      brand: product.brand,
      sellingPrice: product.sellingPrice.toString(),
      purchasePrice: product.purchasePrice.toString(),
      sku: product.sku,
    })
    setUploadedPhotos(product.photos || [])
    setProductDetails(product.details || [])
    setEditDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingProductId) return

    try {
      await productsApi.delete(deletingProductId)
      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
      setDeleteDialogOpen(false)
      setDeletingProductId(null)
      loadProducts()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return

    try {
      await productsApi.bulkDelete(selectedProducts)
      toast({
        title: "Success",
        description: `${selectedProducts.length} product(s) deleted successfully`,
      })
      setSelectedProducts([])
      loadProducts()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete products",
        variant: "destructive",
      })
    }
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const toggleAllProducts = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map((p) => p._id))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  useEffect(() => {
    if (formData.name || formData.type || formData.brand) {
      const year = new Date().getFullYear()
      const namePart = formData.name.substring(0, 3).toUpperCase()
      const typePart = formData.type.substring(0, 3).toUpperCase()
      const brandPart = formData.brand.substring(0, 3).toUpperCase()
      const generatedSku = `${namePart}${typePart}${brandPart}${year}`.replace(/\s/g, "")
      setFormData((prev) => ({ ...prev, sku: generatedSku }))
    }
  }, [formData.name, formData.type, formData.brand])

  const openDetailsDialog = (product: Product) => {
    setViewingProduct(product)
    setDetailsDialogOpen(true)
  }

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access permissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" /> {/* Added admin shield icon */}
            Product Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage products and pricing (Admin Only)</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>Total: {totalData} product(s)</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {selectedProducts.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ({selectedProducts.length})
                </Button>
              )}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No products found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedProducts.length === products.length && products.length > 0}
                          onCheckedChange={toggleAllProducts}
                        />
                      </TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Selling Price</TableHead>
                      <TableHead>Purchase Price</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.includes(product._id)}
                            onCheckedChange={() => toggleProductSelection(product._id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.type}</TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell>{product.brand || "-"}</TableCell>
                        <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
                        <TableCell>{formatCurrency(product.purchasePrice)}</TableCell>
                        <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailsDialog(product)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(product)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeletingProductId(product._id)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
            <DialogDescription>Add a new product to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="create-name">Product Name *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Semen"
              />
            </div>

            {/* Type, Unit, Brand */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-type">Type *</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger id="create-type">
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
                <Label htmlFor="create-unit">Unit *</Label>
                <Input
                  id="create-unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., liter"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-brand">Brand</Label>
                <Input
                  id="create-brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g., Mitsubishi"
                />
              </div>
            </div>

            {/* Purchase Price & Selling Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-purchase">Purchase Price (IDR) *</Label>
                <Input
                  id="create-purchase"
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  placeholder="e.g., 20000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-selling">Selling Price (IDR) *</Label>
                <Input
                  id="create-selling"
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  placeholder="e.g., 25000"
                />
              </div>
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <Label htmlFor="create-sku">SKU *</Label>
              <Input
                id="create-sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Auto-generated from name, type, brand, and year"
              />
              <p className="text-xs text-muted-foreground">Auto-generated based on product details</p>
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <Label>Photos</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center py-4">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {uploading ? "Uploading..." : "Click to upload photo"}
                    </p>
                  </div>
                </label>

                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {uploadedPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={`${API_BASE_URL}/files/${photo.url}`}
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

            {/* Product Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Product Details</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDetailField}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Detail
                </Button>
              </div>

              {productDetails.map((detail, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
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
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting || !formData.name || !formData.unit || !formData.sku}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>View product information and specifications</DialogDescription>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Product Name</Label>
                  <p className="font-medium">{viewingProduct.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">SKU</Label>
                  <p className="font-mono text-sm">{viewingProduct.sku}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p>{viewingProduct.type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Unit</Label>
                  <p>{viewingProduct.unit}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Brand</Label>
                  <p>{viewingProduct.brand || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Selling Price</Label>
                  <p className="font-medium">{formatCurrency(viewingProduct.sellingPrice)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Purchase Price</Label>
                  <p className="font-medium">{formatCurrency(viewingProduct.purchasePrice)}</p>
                </div>
              </div>

              {/* Photos */}
              {viewingProduct.photos && viewingProduct.photos.length > 0 && (
                <div className="space-y-2">
                  <Label>Photos</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingProduct.photos.map((photo, index) => (
                      <img
                        key={photo._id || index}
                        src={`${API_BASE_URL}/files/${photo.url}`}
                        alt={photo.name || `Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Details */}
              {viewingProduct.details && viewingProduct.details.length > 0 && (
                <div className="space-y-2">
                  <Label>Product Specifications</Label>
                  <div className="border rounded-lg divide-y">
                    {viewingProduct.details.map((detail, index) => (
                      <div key={detail._id || index} className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{detail.label}</p>
                          <p className="text-xs text-muted-foreground capitalize">{detail.type}</p>
                        </div>
                        <p className="text-sm">{detail.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type *</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger id="edit-type">
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
                <Label htmlFor="edit-unit">Unit *</Label>
                <Input
                  id="edit-unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-brand">Brand</Label>
                <Input
                  id="edit-brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-purchase">Purchase Price (IDR) *</Label>
                <Input
                  id="edit-purchase"
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-selling">Selling Price (IDR) *</Label>
                <Input
                  id="edit-selling"
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sku">SKU *</Label>
              <Input
                id="edit-sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false)
                resetForm()
                setEditingProduct(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={submitting || !formData.name || !formData.unit || !formData.sku}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
