"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface Product {
  _id: string
  name: string
  sku: string
  type: string
  brand?: string
  sellingPrice: number
  unit: string
}

interface ProductSearchPopoverProps {
  products: Product[]
  selectedProductName?: string
  onSelect: (product: Product) => void
  onCreateNew?: () => void
  loadingProducts?: boolean
  placeholder?: string
  className?: string
  formatCurrency: (amount: number) => string
}

export function ProductSearchPopover({
  products,
  selectedProductName,
  onSelect,
  onCreateNew,
  loadingProducts = false,
  placeholder = "Select product...",
  className,
  formatCurrency,
}: ProductSearchPopoverProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const highlightText = (text: string, query: string) => {
    if (!query) return text

    const parts = text.split(new RegExp(`(${query})`, "gi"))
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-foreground">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </>
    )
  }

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase()
    if (!query) return true
    return (
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query) ||
      product.type.toLowerCase().includes(query) ||
      (product.brand && product.brand.toLowerCase().includes(query))
    )
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between bg-transparent", className)}
        >
          {selectedProductName || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search product..." onValueChange={setSearchQuery} />
          <CommandList>
            <CommandEmpty>{loadingProducts ? "Loading products..." : "No product found."}</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {filteredProducts.map((product) => (
                <CommandItem
                  key={product._id}
                  value={product.name}
                  onSelect={() => {
                    onSelect(product)
                    setOpen(false)
                    setSearchQuery("")
                  }}
                  className="flex flex-col items-start py-3 hover:bg-primary/30 cursor-pointer"
                >
                  <div className="flex items-center w-full">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        selectedProductName === product.name ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{highlightText(product.name, searchQuery)}</div>
                      <div className="text-xs text-muted-foreground mt-1 space-x-2">
                        <span>SKU: {highlightText(product.sku, searchQuery)}</span>
                        <span>•</span>
                        <span>Type: {highlightText(product.type, searchQuery)}</span>
                        {product.brand && (
                          <>
                            <span>•</span>
                            <span>Brand: {highlightText(product.brand, searchQuery)}</span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Price: {formatCurrency(product.sellingPrice)}</div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreateNew && (
              <div className="border-t p-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setOpen(false)
                    setSearchQuery("")
                    onCreateNew()
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Product
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
