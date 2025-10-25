"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { terminApi } from "@/lib/api/termin"

interface ProjectInvoiceProps {
  projectId: string
}

export function ProjectInvoice({ projectId }: ProjectInvoiceProps) {
  const [termins, setTermins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTermins()
  }, [projectId])

  const loadTermins = async () => {
    try {
      const response = await terminApi.getByProject(projectId)
      if (response.success && response.data) {
        setTermins(response.data)
      }
    } catch (error) {
      console.error("Failed to load termins:", error)
    } finally {
      setLoading(false)
    }
  }

  // Dummy invoice data
  const invoices = [
    {
      id: 1,
      number: "INV-2025-001",
      termin: "Termin 1",
      amount: 50000000,
      date: "2025-01-15",
      status: "Paid",
      dueDate: "2025-01-20",
    },
    {
      id: 2,
      number: "INV-2025-002",
      termin: "Termin 2",
      amount: 75000000,
      date: "2025-01-20",
      status: "Pending",
      dueDate: "2025-01-25",
    },
  ]

  // Dummy tax invoice data
  const taxInvoices = [
    {
      id: 1,
      number: "FP-001/2025",
      invoiceNumber: "INV-2025-001",
      date: "2025-01-16",
      amount: 5500000,
      status: "Uploaded",
    },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="termin" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="termin">Termin</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="tax">Tax Invoice</TabsTrigger>
        </TabsList>

        <TabsContent value="termin">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Terms (Termin)</CardTitle>
                  <CardDescription>Project payment schedule and milestones</CardDescription>
                </div>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Add Termin
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading termins...</p>
              ) : termins.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No payment terms defined yet</p>
              ) : (
                <div className="space-y-3">
                  {termins.map((termin, index) => (
                    <div
                      key={termin._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">Termin {index + 1}</p>
                          <p className="text-sm text-muted-foreground">
                            {termin.value}
                            {termin.valueType === "%" ? "%" : " IDR"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Scheduled</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>Project invoices and payment tracking</CardDescription>
                </div>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{invoice.number}</p>
                          <Badge variant="outline">{invoice.termin}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(invoice.amount)} • Due: {invoice.dueDate}
                        </p>
                      </div>
                    </div>
                    <Badge variant={invoice.status === "Paid" ? "default" : "secondary"}>{invoice.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tax Invoices (Faktur Pajak)</CardTitle>
                  <CardDescription>Upload and manage tax invoices</CardDescription>
                </div>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Tax Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {taxInvoices.map((tax) => (
                  <div
                    key={tax.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-green-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{tax.number}</p>
                          <Badge variant="outline">{tax.invoiceNumber}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(tax.amount)} • {tax.date}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default">{tax.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
