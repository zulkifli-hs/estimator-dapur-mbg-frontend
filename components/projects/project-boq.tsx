"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2 } from "lucide-react"
import { boqApi } from "@/lib/api/boq"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

  useEffect(() => {
    loadBOQ()
  }, [projectId])

  const loadBOQ = async () => {
    try {
      const response = await boqApi.getByProject(projectId)
      if (response.success && response.data) {
        setBoqItems(response.data)
        calculateSummary(response.data)
      }
    } catch (error) {
      console.error("Failed to load BOQ:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (items: any[]) => {
    const totalBudget = items.reduce((sum, item) => sum + (item.unit_price * item.quantity || 0), 0)
    const totalSpent = items.reduce((sum, item) => sum + (item.actual_cost || 0), 0)
    const progress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    setSummary({ totalBudget, totalSpent, progress })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
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
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalSpent)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Budget Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.progress.toFixed(1)}%</p>
            <Progress value={summary.progress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bill of Quantities (BOQ)</CardTitle>
              <CardDescription>Track project costs and budget allocation</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading BOQ items...</p>
          ) : boqItems.length === 0 ? (
            <Alert>
              <AlertDescription className="text-center">
                No BOQ items added yet. Click "Add Item" to start tracking project costs.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {boqItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{item.item_name}</p>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>
                        Qty: {item.quantity} {item.unit}
                      </span>
                      <span>Unit Price: {formatCurrency(item.unit_price)}</span>
                      <span className="font-medium text-foreground">
                        Total: {formatCurrency(item.unit_price * item.quantity)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
