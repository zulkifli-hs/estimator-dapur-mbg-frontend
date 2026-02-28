"use client"

import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface BoqTableProps {
  boq: any
  formatCurrency: (value: number) => string
}

export function BoqTable({ boq, formatCurrency }: BoqTableProps) {
  let itemNumber = 1
  let grandTotal = 0

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-15 px-4">No</TableHead>
            <TableHead className="min-w-62.5 max-w-100 px-4">Item Name</TableHead>
            <TableHead className="w-30 px-4">Brand/Equal</TableHead>
            <TableHead className="w-30 px-4">Location</TableHead>
            <TableHead className="text-right w-20 px-4">Qty</TableHead>
            <TableHead className="w-20 px-4">Unit</TableHead>
            <TableHead className="text-right w-37.5 px-4">Unit Price</TableHead>
            <TableHead className="text-right w-37.5 px-4">Total Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.isArray(boq.preliminary) && boq.preliminary.length > 0 && (
            <>
              <TableRow className="bg-primary/10">
                <TableCell colSpan={8} className="font-bold text-primary uppercase px-4 py-3">
                  PRELIMINARY
                </TableCell>
              </TableRow>
              {boq.preliminary.map((item: any) => {
                const total = (item.qty || 0) * (item.price || 0)
                grandTotal += total
                return (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium pl-8 pr-4">{itemNumber++}</TableCell>
                    <TableCell className="whitespace-normal wrap-break-word px-4">{item.name}</TableCell>
                    <TableCell className="whitespace-normal wrap-break-word px-4">{item.brand || "-"}</TableCell>
                    <TableCell className="whitespace-normal wrap-break-word px-4">{item.location || "-"}</TableCell>
                    <TableCell className="text-right px-4">{item.qty}</TableCell>
                    <TableCell className="px-4">{item.unit}</TableCell>
                    <TableCell className="text-right px-4">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-right font-medium px-4">{formatCurrency(total)}</TableCell>
                  </TableRow>
                )
              })}
              <TableRow className="bg-muted/30">
                <TableCell colSpan={7} className="text-right font-semibold px-4 py-3">
                  Subtotal Preliminary
                </TableCell>
                <TableCell className="text-right font-semibold px-4 py-3">
                  {formatCurrency(
                    boq.preliminary.reduce((sum: number, item: any) => sum + (item.qty || 0) * (item.price || 0), 0),
                  )}
                </TableCell>
              </TableRow>
            </>
          )}

          {Array.isArray(boq.fittingOut) && boq.fittingOut.length > 0 && (
            <>
              <TableRow className="bg-primary/10">
                <TableCell colSpan={8} className="font-bold text-primary uppercase px-4 py-3">
                  FITTING OUT
                </TableCell>
              </TableRow>
              {boq.fittingOut.map((category: any) => {
                const categoryTotal =
                  Array.isArray(category.products) &&
                  category.products.reduce((sum: number, p: any) => sum + (p.qty || 0) * (p.price || 0), 0)
                grandTotal += categoryTotal || 0

                return (
                  <React.Fragment key={category._id}>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={8} className="font-semibold pl-8 pr-4 py-2">
                        {category.name}
                      </TableCell>
                    </TableRow>
                    {Array.isArray(category.products) &&
                      category.products.map((product: any) => {
                        const total = (product.qty || 0) * (product.price || 0)
                        return (
                          <TableRow key={product._id}>
                            <TableCell className="font-medium pl-12 pr-4">{itemNumber++}</TableCell>
                            <TableCell className="whitespace-normal wrap-break-word px-4">{product.name}</TableCell>
                            <TableCell className="whitespace-normal wrap-break-word px-4">{product.brand || "-"}</TableCell>
                            <TableCell className="whitespace-normal wrap-break-word px-4">{product.location || "-"}</TableCell>
                            <TableCell className="text-right px-4">{product.qty}</TableCell>
                            <TableCell className="px-4">{product.unit}</TableCell>
                            <TableCell className="text-right px-4">{formatCurrency(product.price)}</TableCell>
                            <TableCell className="text-right font-medium px-4">{formatCurrency(total)}</TableCell>
                          </TableRow>
                        )
                      })}
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={7} className="text-right text-sm font-medium pl-12 pr-4 py-2">
                        Subtotal {category.name}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium px-4 py-2">
                        {formatCurrency(categoryTotal || 0)}
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                )
              })}
              <TableRow className="bg-muted/30">
                <TableCell colSpan={7} className="text-right font-semibold px-4 py-3">
                  Subtotal Fitting Out
                </TableCell>
                <TableCell className="text-right font-semibold px-4 py-3">
                  {formatCurrency(
                    boq.fittingOut.reduce(
                      (sum: number, cat: any) =>
                        sum +
                        (Array.isArray(cat.products)
                          ? cat.products.reduce((s: number, p: any) => s + (p.qty || 0) * (p.price || 0), 0)
                          : 0),
                      0,
                    ),
                  )}
                </TableCell>
              </TableRow>
            </>
          )}

          {Array.isArray(boq.furnitureWork) && boq.furnitureWork.length > 0 && (
            <>
              <TableRow className="bg-primary/10">
                <TableCell colSpan={8} className="font-bold text-primary uppercase px-4 py-3">
                  FURNITURE WORK
                </TableCell>
              </TableRow>
              {boq.furnitureWork.map((category: any) => {
                const categoryTotal =
                  Array.isArray(category.products) &&
                  category.products.reduce((sum: number, p: any) => sum + (p.qty || 0) * (p.price || 0), 0)
                grandTotal += categoryTotal || 0

                return (
                  <React.Fragment key={category._id}>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={8} className="font-semibold pl-8 pr-4 py-2">
                        {category.name}
                      </TableCell>
                    </TableRow>
                    {Array.isArray(category.products) &&
                      category.products.map((product: any) => {
                        const total = (product.qty || 0) * (product.price || 0)
                        return (
                          <TableRow key={product._id}>
                            <TableCell className="font-medium pl-12 pr-4">{itemNumber++}</TableCell>
                            <TableCell className="whitespace-normal wrap-break-word px-4">{product.name}</TableCell>
                            <TableCell className="whitespace-normal wrap-break-word px-4">{product.brand || "-"}</TableCell>
                            <TableCell className="whitespace-normal wrap-break-word px-4">{product.location || "-"}</TableCell>
                            <TableCell className="text-right px-4">{product.qty}</TableCell>
                            <TableCell className="px-4">{product.unit}</TableCell>
                            <TableCell className="text-right px-4">{formatCurrency(product.price)}</TableCell>
                            <TableCell className="text-right font-medium px-4">{formatCurrency(total)}</TableCell>
                          </TableRow>
                        )
                      })}
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={7} className="text-right text-sm font-medium pl-12 pr-4 py-2">
                        Subtotal {category.name}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium px-4 py-2">
                        {formatCurrency(categoryTotal || 0)}
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                )
              })}
              <TableRow className="bg-muted/30">
                <TableCell colSpan={7} className="text-right font-semibold px-4 py-3">
                  Subtotal Furniture Work
                </TableCell>
                <TableCell className="text-right font-semibold px-4 py-3">
                  {formatCurrency(
                    boq.furnitureWork.reduce(
                      (sum: number, cat: any) =>
                        sum +
                        (Array.isArray(cat.products)
                          ? cat.products.reduce((s: number, p: any) => s + (p.qty || 0) * (p.price || 0), 0)
                          : 0),
                      0,
                    ),
                  )}
                </TableCell>
              </TableRow>
            </>
          )}

          {Array.isArray(boq.mechanicalElectrical) && boq.mechanicalElectrical.length > 0 && (
            <>
              <TableRow className="bg-primary/10">
                <TableCell colSpan={8} className="font-bold text-primary uppercase px-4 py-3">
                  MECHANICAL / ELECTRICAL / PLUMBING
                </TableCell>
              </TableRow>
              {boq.mechanicalElectrical.map((category: any) => {
                const categoryTotal =
                  Array.isArray(category.products) &&
                  category.products.reduce((sum: number, p: any) => sum + (p.qty || 0) * (p.price || 0), 0)
                grandTotal += categoryTotal || 0

                return (
                  <React.Fragment key={category._id}>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={8} className="font-semibold pl-8 pr-4 py-2">
                        {category.name}
                      </TableCell>
                    </TableRow>
                    {Array.isArray(category.products) &&
                      category.products.map((product: any) => {
                        const total = (product.qty || 0) * (product.price || 0)
                        return (
                          <TableRow key={product._id}>
                            <TableCell className="font-medium pl-12 pr-4">{itemNumber++}</TableCell>
                            <TableCell className="whitespace-normal wrap-break-word px-4">{product.name}</TableCell>
                            <TableCell className="whitespace-normal wrap-break-word px-4">{product.brand || "-"}</TableCell>
                            <TableCell className="whitespace-normal wrap-break-word px-4">{product.location || "-"}</TableCell>
                            <TableCell className="text-right px-4">{product.qty}</TableCell>
                            <TableCell className="px-4">{product.unit}</TableCell>
                            <TableCell className="text-right px-4">{formatCurrency(product.price)}</TableCell>
                            <TableCell className="text-right font-medium px-4">{formatCurrency(total)}</TableCell>
                          </TableRow>
                        )
                      })}
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={7} className="text-right text-sm font-medium pl-12 pr-4 py-2">
                        Subtotal {category.name}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium px-4 py-2">
                        {formatCurrency(categoryTotal || 0)}
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                )
              })}
              <TableRow className="bg-muted/30">
                <TableCell colSpan={7} className="text-right font-semibold px-4 py-3">
                  Subtotal Mechanical / Electrical / Plumbing
                </TableCell>
                <TableCell className="text-right font-semibold px-4 py-3">
                  {formatCurrency(
                    boq.mechanicalElectrical.reduce(
                      (sum: number, cat: any) =>
                        sum +
                        (Array.isArray(cat.products)
                          ? cat.products.reduce((s: number, p: any) => s + (p.qty || 0) * (p.price || 0), 0)
                          : 0),
                      0,
                    ),
                  )}
                </TableCell>
              </TableRow>
            </>
          )}

          {((Array.isArray(boq.preliminary) && boq.preliminary.length > 0) ||
            (Array.isArray(boq.fittingOut) && boq.fittingOut.length > 0) ||
            (Array.isArray(boq.furnitureWork) && boq.furnitureWork.length > 0) ||
            (Array.isArray(boq.mechanicalElectrical) && boq.mechanicalElectrical.length > 0)) && (
            <TableRow className="bg-primary/20 font-bold">
              <TableCell colSpan={7} className="text-right text-lg px-4 py-4">
                GRAND TOTAL
              </TableCell>
              <TableCell className="text-right text-lg px-4 py-4">{formatCurrency(grandTotal)}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
