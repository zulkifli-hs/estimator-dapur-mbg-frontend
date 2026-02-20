import { apiRequest } from "./config"

export interface Photo {
  _id?: string
  name?: string
  url: string
  provider: string
  version?: number
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface ProductDetail {
  _id?: string
  label: string
  type: "text" | "number" | "date"
  value: string
  name?: string
  createdAt?: string
  updatedAt?: string
}

export interface Product {
  _id: string
  sku: string
  name: string
  type: "Goods" | "Services" | "Goods and Services"
  unit: string
  price: number
  sellingPrice: number
  purchasePrice: number
  brand?: string
  tags?: string[]
  photos?: Photo[]
  details?: ProductDetail[]
  sellingPriceHistory?: any[]
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface CreateProductInput {
  name: string
  type: "Goods" | "Services" | "Goods and Services"
  unit: string
  sellingPrice: number
  purchasePrice: number
  sku: string
  brand?: string
  tags?: string[]
  photos?: Array<{ url: string; provider: string }>
  details?: Array<{ label: string; type: "text" | "number" | "date"; value: string }>
}

export interface UpdateProductInput {
  name?: string
  type?: "Goods" | "Services" | "Goods and Services"
  unit?: string
  sku?: string
  price?: number
  sellingPrice?: number
  purchasePrice?: number
  brand?: string
  tags?: string[]
  photos?: Photo[]
  details?: ProductDetail[]
}

export const productsApi = {
  getAll: async (
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<{ list: Product[]; totalData: number; totalPage: number; page: number }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })

    if (search) {
      params.append("search", search)
    }

    const response = await apiRequest(`/products?${params.toString()}`, {
      method: "GET",
    })

    return response.data
  },

  getById: async (id: string): Promise<Product> => {
    const response = await apiRequest(`/products/${id}`, {
      method: "GET",
    })

    return response.data
  },

  create: async (data: CreateProductInput): Promise<Product> => {
    const response = await apiRequest("/products", {
      method: "POST",
      body: JSON.stringify(data),
    })

    return response.data
  },

  update: async (id: string, data: UpdateProductInput): Promise<Product> => {
    const response = await apiRequest(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })

    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiRequest(`/products/${id}`, {
      method: "DELETE",
    })
  },

  bulkDelete: async (ids: string[]): Promise<void> => {
    await apiRequest("/products/delete", {
      method: "POST",
      body: JSON.stringify({ _ids: ids }),
    })
  },
}
