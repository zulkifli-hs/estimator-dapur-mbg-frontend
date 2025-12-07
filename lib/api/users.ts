import { apiRequest } from "./config"

export interface User {
  _id: string
  email: string
  profile?: {
    name?: string
    photo?: {
      url: string
      provider: string
    }
    phone?: string
  }
  createdAt: string
  updatedAt: string
  permissions?: string[]
}

export interface CreateUserInput {
  email: string
  password: string
  profile?: {
    name?: string
    photo?: {
      url: string
      provider: string
    }
    phone?: string
  }
}

export interface UpdateUserInput {
  email?: string
  password?: string
  profile?: {
    name?: string
    photo?: {
      url: string
      provider: string
    }
    phone?: string
  }
}

export const usersApi = {
  getAll: async (
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<{ list: User[]; totalData: number; totalPage: number; page: number }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })

    if (search) {
      params.append("search", search)
    }

    const response = await apiRequest(`/users?${params.toString()}`, {
      method: "GET",
    })

    return response.data
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiRequest(`/users/${id}`, {
      method: "GET",
    })

    return response.data
  },

  create: async (data: CreateUserInput): Promise<User> => {
    const response = await apiRequest("/users", {
      method: "POST",
      body: JSON.stringify(data),
    })

    return response.data
  },

  update: async (id: string, data: UpdateUserInput): Promise<User> => {
    const response = await apiRequest(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })

    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiRequest(`/users/${id}`, {
      method: "DELETE",
    })
  },

  bulkDelete: async (ids: string[]): Promise<void> => {
    await apiRequest("/users/delete", {
      method: "POST",
      body: JSON.stringify({ _ids: ids }),
    })
  },

  search: async (keyword: string): Promise<User[]> => {
    try {
      const response = await apiRequest(`/users?search=${encodeURIComponent(keyword)}`, {
        method: "GET",
      })

      if (response.code === 200 && response.data?.list) {
        return response.data.list
      }

      return []
    } catch (error) {
      console.error("[v0] Failed to search users:", error)
      return []
    }
  },
}
