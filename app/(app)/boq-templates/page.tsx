"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search, Trash2, Eye, Edit, Loader2 } from "lucide-react"
import { templatesApi, type BOQTemplate } from "@/lib/api/templates"
import { getProfile } from "@/lib/api/auth"
import { useToast } from "@/hooks/use-toast"

export default function BOQTemplatesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<BOQTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<BOQTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    checkAdminAccess()
    fetchTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [searchQuery, templates])

  const checkAdminAccess = async () => {
    try {
      const response = await getProfile()
      if (!response.data?.admin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        })
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Failed to check admin access:", error)
      router.push("/dashboard")
    }
  }

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await templatesApi.getAll()
      if (response.success) {
        setTemplates(response.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch templates",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
      toast({
        title: "Error",
        description: "Failed to fetch templates",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterTemplates = () => {
    if (!searchQuery.trim()) {
      setFilteredTemplates(templates)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = templates.filter((template) => template.name.toLowerCase().includes(query))
    setFilteredTemplates(filtered)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTemplates(filteredTemplates.map((t) => t._id))
    } else {
      setSelectedTemplates([])
    }
  }

  const handleSelectTemplate = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTemplates([...selectedTemplates, id])
    } else {
      setSelectedTemplates(selectedTemplates.filter((selectedId) => selectedId !== id))
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingId) return

    try {
      await templatesApi.delete(deletingId)
      toast({
        title: "Success",
        description: "Template deleted successfully",
      })
      fetchTemplates()
      setSelectedTemplates(selectedTemplates.filter((id) => id !== deletingId))
    } catch (error) {
      console.error("Failed to delete template:", error)
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setDeletingId(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTemplates.length === 0) return

    try {
      await templatesApi.bulkDelete(selectedTemplates)
      toast({
        title: "Success",
        description: `${selectedTemplates.length} template(s) deleted successfully`,
      })
      fetchTemplates()
      setSelectedTemplates([])
    } catch (error) {
      console.error("Failed to bulk delete templates:", error)
      toast({
        title: "Error",
        description: "Failed to delete templates",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (template: BOQTemplate) => {
    router.push(`/boq-templates/${template._id}`)
  }

  const handleView = (template: BOQTemplate) => {
    router.push(`/boq-templates/${template._id}`)
  }

  const handleCreate = () => {
    router.push("/boq-templates/new")
  }

  const calculateTotal = (template: BOQTemplate) => {
    let total = 0

    template.preliminary?.forEach((item) => {
      total += (item.qty || 0) * (item.price || 0)
    })

    template.fittingOut?.forEach((category) => {
      category.products?.forEach((product) => {
        total += (product.qty || 0) * (product.price || 0)
      })
    })

    template.furnitureWork?.forEach((category) => {
      category.products?.forEach((product) => {
        total += (product.qty || 0) * (product.price || 0)
      })
    })

    return total
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">BOQ Templates</h1>
          <p className="text-muted-foreground">Manage your Bill of Quantities templates</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {selectedTemplates.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedTemplates.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? "No templates found matching your search." : "No templates yet. Create your first one!"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTemplates.length === filteredTemplates.length && filteredTemplates.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Template Name</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template._id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTemplates.includes(template._id)}
                        onCheckedChange={(checked) => handleSelectTemplate(template._id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(calculateTotal(template))}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleView(template)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(template._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
