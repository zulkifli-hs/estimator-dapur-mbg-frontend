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
import { Plus, Search, Edit, Trash2, Loader2, Package, Shield, Eye } from "lucide-react"
import { productsApi, type Product, type CreateProductInput, type UpdateProductInput } from "@/lib/api/products"
import { getProfile } from "@/lib/api/auth"
import { uploadApi } from "@/lib/api/upload"
import { useToast } from "@/hooks/use-toast"

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
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    sku: "",
    type: "Goods" as "Goods" | "Services" | "Goods and Services",
    name: "",
    unit: "",
    sellingPrice: "",
    purchasePrice: "",
    brand: "",
    photos: [] as Array<{ url: string; provider: string }>,
    details: [] as Array<{ name: string; value: string; label: string; type: string }>,
  })
  const [newDetail, setNewDetail] = useState({ name: "", value: "" })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
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
      sku: "",
      type: "Goods" as "Goods" | "Services" | "Goods and Services",
      name: "",
      unit: "",
      sellingPrice: "",
      purchasePrice: "",
      brand: "",
      photos: [],
      details: [],
    })
    setNewDetail({ name: "", value: "" })
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingPhoto(true)
      const uploadedPhoto = await uploadApi.uploadFile(file)
      setFormData({
        ...formData,
        photos: [...formData.photos, { url: uploadedPhoto.url, provider: uploadedPhoto.provider }],
      })
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
      setUploadingPhoto(false)
    }
  }

  const addDetail = () => {
    if (!newDetail.name || !newDetail.value) {
      toast({
        title: "Error",
        description: "Please fill in all detail fields",
        variant: "destructive",
      })
      return
    }
    setFormData({
      ...formData,
      details: [
        ...formData.details,
        {
          name: newDetail.name,
          value: newDetail.value,
          label: newDetail.name,
          type: "text",
        },
      ],
    })
    setNewDetail({ name: "", value: "" })
  }

  const removeDetail = (index: number) => {
    setFormData({
      ...formData,
      details: formData.details.filter((_, i) => i !== index),
    })
  }

  const removePhoto = (index: number) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== index),
    })
  }

  const handleCreate = async () => {
    try {
      setSubmitting(true)

      const createData: CreateProductInput = {
        sku: formData.sku,
        type: formData.type,
        name: formData.name,
        unit: formData.unit,
        sellingPrice: Number.parseFloat(formData.sellingPrice),
        purchasePrice: Number.parseFloat(formData.purchasePrice),
        brand: formData.brand || undefined,
        photos: formData.photos,
        details: formData.details,
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
        sku: formData.sku,
        type: formData.type,
        name: formData.name,
        unit: formData.unit,
        sellingPrice: Number.parseFloat(formData.sellingPrice),
        purchasePrice: Number.parseFloat(formData.purchasePrice),
        brand: formData.brand || undefined,
        photos: formData.photos,
        details: formData.details,
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
      sku: product.sku,
      type: product.type,
      name: product.name,
      unit: product.unit,
      sellingPrice: product.sellingPrice.toString(),
      purchasePrice: product.purchasePrice.toString(),
      brand: product.brand || "",
      photos: product.photos || [],
      details: product.details || [],
    })
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
                      <TableHead>Brand</TableHead>
                      <TableHead>Unit</TableHead>
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
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.type}</TableCell>
                        <TableCell>{product.brand || "-"}</TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
                        <TableCell>{formatCurrency(product.purchasePrice)}</TableCell>
                        <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setViewingProduct(product)
                                setDetailsDialogOpen(true)
                              }}
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

      {/* Create Product Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
            <DialogDescription>Add a new product to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-sku">SKU *</Label>
                <Input
                  id="create-sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g., SKU-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "Goods" | "Services" | "Goods and Services") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger id="create-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Goods">Goods</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Goods and Services">Goods and Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-name">Product Name *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Semen"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-unit">Unit *</Label>
                <Input
                  id="create-unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., liter, kg, pcs"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-selling-price">Selling Price (IDR) *</Label>
                <Input
                  id="create-selling-price"
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  placeholder="e.g., 25000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-purchase-price">Purchase Price (IDR) *</Label>
                <Input
                  id="create-purchase-price"
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  placeholder="e.g., 20000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-photos">Photos</Label>
              <div className="flex gap-2">
                <Input
                  id="create-photos"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />
                {uploadingPhoto && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {formData.photos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.photos.map((photo, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/${photo.url}`}
                        alt="Product"
                        className="h-16 w-16 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Product Details</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Detail name (e.g., Color)"
                  value={newDetail.name}
                  onChange={(e) => setNewDetail({ ...newDetail, name: e.target.value })}
                />
                <Input
                  placeholder="Detail value (e.g., Ungu)"
                  value={newDetail.value}
                  onChange={(e) => setNewDetail({ ...newDetail, value: e.target.value })}
                />
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addDetail} className="w-full bg-transparent">
                Add Detail
              </Button>
              {formData.details.length > 0 && (
                <div className="space-y-2 mt-2">
                  {formData.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-secondary rounded text-sm">
                      <span>
                        <strong>{detail.name}:</strong> {detail.value}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDetail(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
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
            <Button
              onClick={handleCreate}
              disabled={
                submitting ||
                uploadingPhoto ||
                !formData.sku ||
                !formData.name ||
                !formData.unit ||
                !formData.sellingPrice ||
                !formData.purchasePrice
              }
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sku">SKU *</Label>
                <Input
                  id="edit-sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "Goods" | "Services" | "Goods and Services") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Goods">Goods</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Goods and Services">Goods and Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="edit-selling-price">Selling Price (IDR) *</Label>
                <Input
                  id="edit-selling-price"
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-purchase-price">Purchase Price (IDR) *</Label>
                <Input
                  id="edit-purchase-price"
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-photos">Photos</Label>
              <Input
                id="edit-photos"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
              {uploadingPhoto && <Loader2 className="h-4 w-4 animate-spin" />}
              {formData.photos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.photos.map((photo, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/${photo.url}`}
                        alt="Product"
                        className="h-16 w-16 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-details">Details</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="edit-details-name"
                  value={newDetail.name}
                  onChange={(e) => setNewDetail({ ...newDetail, name: e.target.value })}
                  placeholder="Name"
                />
                <Input
                  id="edit-details-value"
                  value={newDetail.value}
                  onChange={(e) => setNewDetail({ ...newDetail, value: e.target.value })}
                  placeholder="Value"
                />
              </div>
              <Button variant="outline" size="sm" onClick={addDetail}>
                Add Detail
              </Button>
              {formData.details.length > 0 && (
                <div className="space-y-2 mt-2">
                  {formData.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-secondary rounded text-sm">
                      <span>
                        <strong>{detail.name}:</strong> {detail.value}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDetail(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
            <Button
              onClick={handleEdit}
              disabled={
                submitting ||
                uploadingPhoto ||
                !formData.sku ||
                !formData.name ||
                !formData.unit ||
                !formData.sellingPrice ||
                !formData.purchasePrice
              }
            >
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

      {/* View Product Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingProduct?.name}</DialogTitle>
            <DialogDescription>Product details and information</DialogDescription>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-4">
              {viewingProduct.photos && viewingProduct.photos.length > 0 && (
                <div className="space-y-2">
                  <Label className="font-semibold">Photos</Label>
                  <div className="flex flex-wrap gap-2">
                    {viewingProduct.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/${photo.url}`}
                        alt="Product"
                        className="h-24 w-24 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
              {viewingProduct.details && viewingProduct.details.length > 0 && (
                <div className="space-y-2">
                  <Label className="font-semibold">Details</Label>
                  <div className="space-y-1 text-sm">
                    {viewingProduct.details.map((detail, idx) => (
                      <div key={idx} className="flex justify-between p-2 bg-secondary rounded">
                        <span className="font-medium">{detail.label}:</span>
                        <span>{detail.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
