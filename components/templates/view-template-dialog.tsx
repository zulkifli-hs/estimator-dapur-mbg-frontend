"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { BOQTemplate } from "@/lib/api/templates"

interface ViewTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: BOQTemplate | null
}

export function ViewTemplateDialog({ open, onOpenChange, template }: ViewTemplateDialogProps) {
  if (!template) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const calculateTotal = (items: Array<{ qty: number; price: number }>) => {
    return items.reduce((sum, item) => sum + item.qty * item.price, 0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preliminary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preliminary">Preliminary</TabsTrigger>
            <TabsTrigger value="fittingOut">Fitting Out</TabsTrigger>
            <TabsTrigger value="furnitureWork">Furniture Work</TabsTrigger>
          </TabsList>

          <TabsContent value="preliminary">
            <Card>
              <CardHeader>
                <CardTitle>Preliminary Works</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {template.preliminary?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{item.qty}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.qty * item.price)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold">
                      <TableCell colSpan={4} className="text-right">
                        Subtotal
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(calculateTotal(template.preliminary))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fittingOut" className="space-y-4">
            {template.fittingOut?.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {category.products?.map((product, pIndex) => (
                        <TableRow key={pIndex}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell className="text-right">{product.qty}</TableCell>
                          <TableCell>{product.unit}</TableCell>
                          <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(product.qty * product.price)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold">
                        <TableCell colSpan={4} className="text-right">
                          Subtotal
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(calculateTotal(category.products))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="furnitureWork" className="space-y-4">
            {template.furnitureWork?.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {category.products?.map((product, pIndex) => (
                        <TableRow key={pIndex}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell className="text-right">{product.qty}</TableCell>
                          <TableCell>{product.unit}</TableCell>
                          <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(product.qty * product.price)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold">
                        <TableCell colSpan={4} className="text-right">
                          Subtotal
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(calculateTotal(category.products))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
