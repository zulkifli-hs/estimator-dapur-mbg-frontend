"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { productsApi } from "@/lib/api/products"
import { useDebounce } from "@/hooks/use-debounce"

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
  selectedProductName?: string
  onSelect: (product: Product) => void
  onCreateNew?: () => void
  placeholder?: string
  className?: string
  formatCurrency: (amount: number) => string
}

export function ProductSearchPopover({
  selectedProductName,
  onSelect,
  onCreateNew,
  placeholder = "Select product...",
  className,
  formatCurrency,
}: ProductSearchPopoverProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Fetch products based on debounced search query
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const response = await productsApi.getAll(1, 50, debouncedSearch || undefined)
        setProducts(response.list || [])
        setFilteredProducts(response.list || [])
      } catch (error) {
        console.error("[v0] Failed to fetch products:", error)
        setProducts([])
        setFilteredProducts([])
      } finally {
        setLoadingProducts(false)
      }
    }

    if (open) {
      fetchProducts()
    }
  }, [debouncedSearch, open])

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
            <CommandEmpty>
              {loadingProducts ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Searching products...</span>
                </div>
              ) : (
                "No product found."
              )}
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {products.map((product) => (
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
