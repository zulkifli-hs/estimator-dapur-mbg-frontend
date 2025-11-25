import { apiRequest } from "./config"

export interface Product {
  _id: string
  name: string
  unit: string
  price: number
  createdAt: string
  updatedAt: string
}

export interface CreateProductInput {
  name: string
  unit: string
  price: number
}

export interface UpdateProductInput {
  name?: string
  unit?: string
  price?: number
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
